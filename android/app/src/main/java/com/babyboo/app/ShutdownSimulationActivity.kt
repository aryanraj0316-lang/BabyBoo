package com.babyboo.app

import android.app.Activity
import android.content.Context
import android.content.Intent
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
        const val MODE_BACKDROP = "backdrop"
        const val MODE_HOST = "host"
    }

    private val handler = Handler(Looper.getMainLooper())
    private var hostedView: ShutdownSimulationView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        configureFullScreen()

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
    }

    private fun render(intent: Intent?) {
        if (hostedView != null) return
        val mode = intent?.getStringExtra(EXTRA_MODE) ?: MODE_HOST
        // In backdrop mode the overlay normally covers this view entirely. It still listens for
        // the "A" in case the overlay is hidden (e.g. behind the lock screen) so the parent is
        // never stuck on a black screen that ignores input.
        hostedView = ShutdownSimulationView(this, startInBlackout = mode == MODE_BACKDROP) {
            SimulationController.finish(this)
        }
        setContentView(hostedView)
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
        if (hasFocus) hideSystemBars()
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
        hostedView?.release()
        SimulationController.unregisterActivity(this)
        super.onDestroy()
    }
}
