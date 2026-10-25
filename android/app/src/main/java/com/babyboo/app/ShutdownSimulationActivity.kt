package com.babyboo.app

import android.app.Activity
import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.view.KeyEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager

/**
 * ShutdownSimulationActivity — full-screen, immersive, shown over the lock screen.
 *
 * MODE_BACKDROP: plain black screen underneath SimulationController's overlay window. It exists
 *   only to hide the status/navigation bars and swallow the Back key; the overlay draws the UI.
 * MODE_HOST: fallback when "Display over other apps" is not granted — hosts the
 *   ShutdownSimulationView itself.
 */
class ShutdownSimulationActivity : Activity() {

    companion object {
        const val EXTRA_MODE = "mode"
        const val EXTRA_WAKE_SIGNAL = "wake_signal"
        const val MODE_BACKDROP = "backdrop"
        const val MODE_HOST = "host"

        /** Graceful fallback: collapses Android notification shade if child swipes top edge */
        fun collapseStatusBar(context: Context) {
            try {
                @android.annotation.SuppressLint("WrongConstant")
                val sbservice = context.getSystemService("statusbar")
                val statusbarManager = Class.forName("android.app.StatusBarManager")
                val collapse = statusbarManager.getMethod("collapsePanels")
                collapse.invoke(sbservice)
            } catch (_: Exception) { }
        }
    }

    private val handler = Handler(Looper.getMainLooper())
    private var hostedView: ShutdownSimulationView? = null
    private var screenOffReceiver: BroadcastReceiver? = null
    private var wasScreenOff = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        configureFullScreen()

        window.decorView.setOnApplyWindowInsetsListener { v, insets ->
            hideSystemBars()
            v.onApplyWindowInsets(insets)
        }

        // Register screen off receiver so that when device wakes up, we can flash the 1-second battery signal
        try {
            val filter = IntentFilter(Intent.ACTION_SCREEN_OFF)
            val receiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context?, intent: Intent?) {
                    wasScreenOff = true
                }
            }
            screenOffReceiver = receiver
            registerReceiver(receiver, filter)
        } catch (_: Exception) { }

        // Opened late (e.g. from the notification) after the parent already unlocked
        if (!SimulationController.isActive()) {
            finish()
            return
        }
        SimulationController.registerActivity(this)
        render(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        render(intent)
        if (intent.getBooleanExtra(EXTRA_WAKE_SIGNAL, false)) {
            hostedView?.showWakeBatterySignal()
        }
    }

    private fun render(intent: Intent?) {
        if (hostedView != null) return
        val mode = intent?.getStringExtra(EXTRA_MODE) ?: MODE_HOST
        val dimCallback: () -> Unit = if (mode == MODE_HOST) ({ dimToLowest() }) else ({})
        hostedView = ShutdownSimulationView(
            this,
            startInBlackout = mode == MODE_BACKDROP,
            onBlackout = dimCallback,
            onSetBrightness = { brightness -> setScreenBrightness(brightness) }
        ) {
            SimulationController.finish(this)
        }
        setContentView(hostedView)
    }

    fun setScreenBrightness(brightness: Float) {
        try {
            window.attributes = window.attributes.apply {
                screenBrightness = brightness
            }
        } catch (_: Exception) { }
    }

    fun unlockAndDismiss() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val km = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
                km.requestDismissKeyguard(this, null)
            } catch (_: Exception) { }
        }
        finish()
    }

    private fun configureFullScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.decorView.setBackgroundColor(Color.BLACK)
        hideSystemBars()
    }

    /** Lowest backlight once the screen is fully black; auto-restores when the window goes away. */
    private fun dimToLowest() {
        setScreenBrightness(0.004f)
    }

    // Android lets a deliberate edge swipe reveal the bars for a moment. Re-hide them the instant
    // that happens (and keep re-asserting), so they are gone again within a frame or two.
    private val keepBarsHidden = object : Runnable {
        override fun run() {
            hideSystemBars()
            handler.postDelayed(this, 150)
        }
    }

    override fun onResume() {
        super.onResume()
        handler.removeCallbacks(keepBarsHidden)
        handler.post(keepBarsHidden)
        if (wasScreenOff) {
            wasScreenOff = false
            hostedView?.showWakeBatterySignal()
        }
    }

    override fun onPause() {
        handler.removeCallbacks(keepBarsHidden)
        super.onPause()
    }

    private fun hideSystemBars() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
            window.insetsController?.let {
                it.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                it.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                )
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemBars()
        } else {
            // If child pulled down shade when accessibility overlay is disabled, snap it shut
            if (!BlackoutAccessibilityService.isRunning()) {
                collapseStatusBar(this)
                hideSystemBars()
            }
        }
    }

    override fun onStop() {
        super.onStop()
        // Child pressed Home/Recents: bring the bar-hiding backdrop straight back while the
        // overlay keeps covering the screen. Skip when the screen simply turned off.
        if (!isFinishing && SimulationController.isActive()) {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            if (pm.isInteractive) {
                handler.postDelayed({ SimulationController.relaunchBackdropIfNeeded(this) }, 400)
            }
        }
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        // Phone is "dead": Back and volume keys do nothing
        return when (event.keyCode) {
            KeyEvent.KEYCODE_BACK,
            KeyEvent.KEYCODE_VOLUME_UP,
            KeyEvent.KEYCODE_VOLUME_DOWN -> true
            else -> super.dispatchKeyEvent(event)
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Blocked — the phone appears powered off
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        screenOffReceiver?.let {
            try { unregisterReceiver(it) } catch (_: Exception) { }
            screenOffReceiver = null
        }
        hostedView?.release()
        SimulationController.unregisterActivity(this)
        super.onDestroy()
    }
}
