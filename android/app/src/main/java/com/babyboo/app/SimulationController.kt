package com.babyboo.app

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import java.lang.ref.WeakReference

/**
 * SimulationController — runs the fake "battery died" screen on top of whatever the child is using.
 *
 * With "Display over other apps" granted (the normal path):
 *  - Media is silenced (audio focus + music stream muted), so YouTube & co. stop playing.
 *  - A full-screen TYPE_APPLICATION_OVERLAY window hosting [ShutdownSimulationView] is added
 *    above every app, including the launcher. It swallows all touches.
 *  - A black immersive ShutdownSimulationActivity is launched underneath purely to hide the
 *    status/navigation bars and to swallow the Back key (allowed because a visible overlay exists).
 *
 * Without the permission, ShutdownSimulationActivity hosts the simulation itself (best effort —
 * Android may only show it as a notification while the phone is in use).
 *
 * All methods must be called on the main thread.
 */
object SimulationController {

    const val KEY_SIMULATION_ACTIVE = "simulation_active"

    private var overlayView: ShutdownSimulationView? = null
    private var backdrop: WeakReference<Activity>? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    private var mutedMusic = false
    private var active = false

    fun isActive(): Boolean = active

    fun canDrawOverlays(context: Context): Boolean = Settings.canDrawOverlays(context)

    /** Starts the simulation. [resume] = the process was restarted mid-simulation, skip to blackout. */
    fun start(context: Context, resume: Boolean = false) {
        val app = context.applicationContext
        if (active) return
        active = true
        app.getSharedPreferences(ScreenTimeBackgroundService.PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putBoolean(KEY_SIMULATION_ACTIVE, true).commit()

        silenceAudio(app)

        if (canDrawOverlays(app) && showOverlay(app, resume)) {
            launchActivity(app, ShutdownSimulationActivity.MODE_BACKDROP)
        } else {
            launchActivity(app, ShutdownSimulationActivity.MODE_HOST)
        }
    }

    /** Called once the parent draws the "A". Tears everything down and stops the service. */
    fun finish(context: Context) {
        val app = context.applicationContext
        active = false
        app.getSharedPreferences(ScreenTimeBackgroundService.PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putBoolean(KEY_SIMULATION_ACTIVE, false).commit()

        removeOverlay(app)
        backdrop?.get()?.let { if (!it.isFinishing) it.finish() }
        backdrop = null
        restoreAudio(app)

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
        } catch (_: Exception) { }
    }

    private fun showOverlay(app: Context, resume: Boolean): Boolean {
        if (overlayView != null) return true
        return try {
            val wm = app.getSystemService(Context.WINDOW_SERVICE) as WindowManager
            val view = ShutdownSimulationView(app, startInBlackout = resume) { finish(app) }

            @Suppress("DEPRECATION")
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                // Not focusable: keys go to the backdrop activity, but touches still land here.
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                    WindowManager.LayoutParams.FLAG_FULLSCREEN or
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
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
            true
        } catch (_: Exception) {
            overlayView = null
            false
        }
    }

    private fun removeOverlay(app: Context) {
        val view = overlayView ?: return
        overlayView = null
        view.release()
        try {
            (app.getSystemService(Context.WINDOW_SERVICE) as WindowManager).removeView(view)
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
}
