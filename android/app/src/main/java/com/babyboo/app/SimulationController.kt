package com.babyboo.app

import android.app.Activity
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import java.lang.ref.WeakReference

/**
 * SimulationController — manages the fake "battery died" blackout overlay and system controls.
 *
 * Requirements fulfilled:
 * 1. AccessibilityService overlay (TYPE_ACCESSIBILITY_OVERLAY):
 *    When BlackoutAccessibilityService is running, uses TYPE_ACCESSIBILITY_OVERLAY covering system bars.
 * 2. Silent CallScreeningService:
 *    Silently rejects calls when active.
 * 3. Forced Do Not Disturb:
 *    enableQuietMode() saves current filter to prefs ONCE and sets INTERRUPTION_FILTER_NONE.
 *    restoreQuietMode() restores the saved filter on teardown.
 * 4. 2-minute safety auto-release:
 *    Shared single teardown path: finish(context) cancels timer and restores everything.
 */
object SimulationController {

    const val KEY_SIMULATION_ACTIVE = "simulation_active"
    const val KEY_SAVED_DND_FILTER = "saved_dnd_filter"
    const val KEY_SAVED_RINGER_MODE = "saved_ringer_mode"

    /** Safety cap: phone always returns to normal this long after blackout starts. */
    private const val AUTO_RELEASE_MS = 2 * 60 * 1000L

    private var overlayView: ShutdownSimulationView? = null
    private var activeWindowManager: WindowManager? = null
    private var backdrop: WeakReference<Activity>? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    private var mutedMusic = false
    private var active = false
    private val handler = Handler(Looper.getMainLooper())
    private val autoReleaseRunnable = Runnable { appForAutoRelease?.let { finish(it) } }
    private var appForAutoRelease: Context? = null

    fun isActive(): Boolean = active

    /** True only while the black overlay window is actually added on screen. */
    fun isOverlayShowing(): Boolean = active && overlayView != null

    /** Dim the overlay window to its lowest backlight once blackout begins. */
    fun dimOverlayToLowest() {
        val view = overlayView ?: return
        try {
            val wm = activeWindowManager ?: (view.context.applicationContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager)
            val lp = view.layoutParams as? WindowManager.LayoutParams ?: return
            lp.screenBrightness = 0.004f
            wm.updateViewLayout(view, lp)
        } catch (_: Exception) { }
    }

    fun canDrawOverlays(context: Context): Boolean = Settings.canDrawOverlays(context)

    /** Starts the simulation. [resume] = the process was restarted mid-simulation, skip to blackout. */
    fun start(context: Context, resume: Boolean = false) {
        val app = context.applicationContext
        if (active) return
        active = true
        app.getSharedPreferences(ScreenTimeBackgroundService.PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putBoolean(KEY_SIMULATION_ACTIVE, true).commit()

        silenceAudio(app)
        enableQuietMode(app)

        // Safety cap: always hand the phone back after AUTO_RELEASE_MS, even if the "A" is never drawn.
        appForAutoRelease = app
        handler.removeCallbacks(autoReleaseRunnable)
        handler.postDelayed(autoReleaseRunnable, AUTO_RELEASE_MS)

        val overlayShown = showOverlay(app, resume)
        if (overlayShown) {
            launchActivity(app, ShutdownSimulationActivity.MODE_BACKDROP)
        } else {
            launchActivity(app, ShutdownSimulationActivity.MODE_HOST)
        }
    }

    /**
     * Called when the parent draws the "A", or automatically after the 2-minute safety cap.
     * Single teardown path for all exits.
     */
    fun finish(context: Context) {
        val app = context.applicationContext
        active = false
        handler.removeCallbacks(autoReleaseRunnable)
        appForAutoRelease = null

        val prefs = app.getSharedPreferences(ScreenTimeBackgroundService.PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putBoolean(KEY_SIMULATION_ACTIVE, false)
            .putBoolean(ScreenTimeBackgroundService.KEY_TIMER_ACTIVE, false)
            .remove(ScreenTimeBackgroundService.KEY_TIMER_END_AT)
            .commit()

        removeOverlay()
        backdrop?.get()?.let { if (!it.isFinishing) it.finish() }
        backdrop = null

        restoreAudio(app)
        restoreQuietMode(app)

        BabyBooWidgetProvider.updateAllWidgets(app, 0)

        try {
            app.startService(Intent(app, ScreenTimeBackgroundService::class.java).apply {
                action = ScreenTimeBackgroundService.ACTION_SIMULATION_FINISHED
            })
        } catch (_: Exception) { }
    }

    fun registerActivity(activity: Activity) {
        backdrop = WeakReference(activity)
    }

    fun unregisterActivity(activity: Activity) {
        if (backdrop?.get() === activity) backdrop = null
    }

    /** Re-raise the bar-hiding backdrop if the child pressed Home while the overlay is up. */
    fun relaunchBackdropIfNeeded(context: Context) {
        if (active && overlayView != null) {
            launchActivity(context.applicationContext, ShutdownSimulationActivity.MODE_BACKDROP)
        }
    }

    fun launchActivity(context: Context, mode: String) {
        try {
            context.startActivity(Intent(context, ShutdownSimulationActivity::class.java).apply {
                putExtra(ShutdownSimulationActivity.EXTRA_MODE, mode)
                addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP or
                        Intent.FLAG_ACTIVITY_NO_ANIMATION
                )
            })
        } catch (e: Exception) {
            android.util.Log.e("BabyBoo", "Error launching ShutdownSimulationActivity", e)
        }
    }

    private fun showOverlay(app: Context, resume: Boolean): Boolean {
        if (overlayView != null) return true

        val usingAccessibilityOverlay = BlackoutAccessibilityService.isRunning()
        val a11y = BlackoutAccessibilityService.instance
        val hostContext = if (usingAccessibilityOverlay && a11y != null) a11y else app

        val overlayType = if (usingAccessibilityOverlay) {
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY
        } else if (canDrawOverlays(app)) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            return false
        }

        return try {
            val wm = hostContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
            val themedContext = android.view.ContextThemeWrapper(
                hostContext,
                android.R.style.Theme_DeviceDefault_NoActionBar_Fullscreen
            )
            val view = ShutdownSimulationView(
                themedContext,
                startInBlackout = resume,
                onBlackout = { dimOverlayToLowest() }
            ) { finish(app) }

            val flags = if (overlayType == WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY) {
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            } else {
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            }

            @Suppress("DEPRECATION")
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                overlayType,
                flags,
                PixelFormat.OPAQUE
            ).apply {
                gravity = Gravity.TOP or Gravity.START
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    layoutInDisplayCutoutMode =
                        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    fitInsetsTypes = 0
                }
            }

            @Suppress("DEPRECATION")
            view.systemUiVisibility = (View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION)

            wm.addView(view, params)
            overlayView = view
            activeWindowManager = wm
            true
        } catch (e: Exception) {
            android.util.Log.e("BabyBoo", "Error adding overlay window", e)
            overlayView = null
            activeWindowManager = null
            false
        }
    }

    private fun removeOverlay() {
        val view = overlayView ?: return
        val wm = activeWindowManager
        overlayView = null
        activeWindowManager = null
        view.release()
        try {
            wm?.removeView(view)
        } catch (_: Exception) { }
    }

    private fun silenceAudio(app: Context) {
        try {
            val am = app.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                )
                .setOnAudioFocusChangeListener { }
                .build()
            am.requestAudioFocus(request)
            audioFocusRequest = request
            if (!am.isStreamMute(AudioManager.STREAM_MUSIC)) {
                am.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_MUTE, 0)
                mutedMusic = true
            }
        } catch (_: Exception) { }
    }

    private fun restoreAudio(app: Context) {
        try {
            val am = app.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            if (mutedMusic) {
                am.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_UNMUTE, 0)
                mutedMusic = false
            }
            audioFocusRequest?.let { am.abandonAudioFocusRequest(it) }
            audioFocusRequest = null
        } catch (_: Exception) { }
    }

    fun enableQuietMode(app: Context) {
        val prefs = app.getSharedPreferences(ScreenTimeBackgroundService.PREFS_NAME, Context.MODE_PRIVATE)

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val nm = app.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                if (nm.isNotificationPolicyAccessGranted) {
                    if (!prefs.contains(KEY_SAVED_DND_FILTER)) {
                        val currentFilter = nm.currentInterruptionFilter
                        prefs.edit().putInt(KEY_SAVED_DND_FILTER, currentFilter).commit()
                    }
                    nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_NONE)
                }
            }
        } catch (_: Exception) { }

        try {
            val am = app.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            if (!prefs.contains(KEY_SAVED_RINGER_MODE)) {
                prefs.edit().putInt(KEY_SAVED_RINGER_MODE, am.ringerMode).commit()
            }
            am.ringerMode = AudioManager.RINGER_MODE_SILENT
        } catch (_: Exception) { }
    }

    fun restoreQuietMode(app: Context) {
        val prefs = app.getSharedPreferences(ScreenTimeBackgroundService.PREFS_NAME, Context.MODE_PRIVATE)

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val nm = app.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                val savedFilter = prefs.getInt(KEY_SAVED_DND_FILTER, -1)
                prefs.edit().remove(KEY_SAVED_DND_FILTER).commit()
                if (savedFilter > 0 && nm.isNotificationPolicyAccessGranted) {
                    nm.setInterruptionFilter(savedFilter)
                }
            }
        } catch (_: Exception) { }

        try {
            val am = app.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            val savedRinger = prefs.getInt(KEY_SAVED_RINGER_MODE, -1)
            prefs.edit().remove(KEY_SAVED_RINGER_MODE).commit()
            if (savedRinger != -1) {
                am.ringerMode = savedRinger
            }
        } catch (_: Exception) { }
    }
}
