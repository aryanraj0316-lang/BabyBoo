package com.babyboo.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import androidx.core.app.NotificationCompat

/**
 * ScreenTimeBackgroundService — Android Foreground Service that runs the countdown independently
 * of the React Native app (works on the home screen, inside YouTube, with BabyBoo closed…).
 *
 * Fixes auto-trigger bug:
 * - Stale timers from hours or days ago on reboot or service restart are strictly discarded rather
 *   than firing an unexpected blackout.
 * - Service runs START_NOT_STICKY when idle so Android does not randomly revive it.
 */
class ScreenTimeBackgroundService : Service() {

    companion object {
        const val ACTION_START_TIMER = "com.babyboo.app.ACTION_START_TIMER"
        const val ACTION_CANCEL_TIMER = "com.babyboo.app.ACTION_CANCEL_TIMER"
        const val ACTION_SIMULATION_FINISHED = "com.babyboo.app.ACTION_SIMULATION_FINISHED"
        const val EXTRA_MINUTES = "extra_minutes"

        const val CHANNEL_ID = "babyboo_timer_channel"
        const val CHANNEL_ALARM_ID = "babyboo_alarm_channel"
        const val NOTIFICATION_ID = 9001
        const val SIMULATION_NOTIFICATION_ID = 9002
        const val PREFS_NAME = "babyboo_widget_prefs"
        const val KEY_TIMER_END_AT = "timer_end_at"
        const val KEY_TIMER_TOTAL_SECONDS = "timer_total_seconds"
        const val KEY_TIMER_ACTIVE = "timer_active"
    }

    private val handler = Handler(Looper.getMainLooper())
    private var endTimeMillis: Long = 0L
    private var wakeLock: PowerManager.WakeLock? = null

    private val tickRunnable = object : Runnable {
        override fun run() {
            val remainingMillis = endTimeMillis - System.currentTimeMillis()
            if (remainingMillis <= 0) {
                onTimerExpired()
                return
            }
            val remaining = ((remainingMillis + 999) / 1000).toInt()
            updateNotification(buildCountdownNotification(remaining))
            BabyBooWidgetProvider.updateAllWidgets(this@ScreenTimeBackgroundService, remaining)
            handler.postDelayed(this, (remainingMillis % 1000).let { if (it == 0L) 1000L else it })
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_TIMER -> {
                val minutes = intent.getIntExtra(EXTRA_MINUTES, 0)
                if (minutes > 0) {
                    startCountdown(minutes)
                    return START_STICKY
                } else {
                    stopIfIdle()
                    return START_NOT_STICKY
                }
            }
            ACTION_CANCEL_TIMER -> {
                cancelCountdown()
                return START_NOT_STICKY
            }
            ACTION_SIMULATION_FINISHED -> {
                getSystemService(NotificationManager::class.java)?.cancel(SIMULATION_NOTIFICATION_ID)
                stopForegroundCompat()
                stopSelf()
                return START_NOT_STICKY
            }
            else -> {
                resumeFromPrefs()
                val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val isTimer = prefs.getBoolean(KEY_TIMER_ACTIVE, false)
                val isSim = prefs.getBoolean(SimulationController.KEY_SIMULATION_ACTIVE, false)
                return if (isTimer || isSim) START_STICKY else START_NOT_STICKY
            }
        }
    }

    private fun startCountdown(minutes: Int) {
        val totalSeconds = minutes * 60
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val now = System.currentTimeMillis()
        val storedEnd = prefs.getLong(KEY_TIMER_END_AT, 0L)
        val storedTotal = prefs.getInt(KEY_TIMER_TOTAL_SECONDS, 0)
        endTimeMillis = if (prefs.getBoolean(KEY_TIMER_ACTIVE, false) && storedTotal == totalSeconds &&
            storedEnd > now && storedEnd - now <= totalSeconds * 1000L + 5000L
        ) storedEnd else now + totalSeconds * 1000L

        prefs.edit()
            .putLong(KEY_TIMER_END_AT, endTimeMillis)
            .putInt(KEY_TIMER_TOTAL_SECONDS, totalSeconds)
            .putBoolean(KEY_TIMER_ACTIVE, true)
            .commit()

        goForeground(buildCountdownNotification(totalSeconds))
        runCountdown()
    }

    private fun runCountdown() {
        handler.removeCallbacks(tickRunnable)
        acquireWakeLock(endTimeMillis - System.currentTimeMillis() + 60_000L)
        BabyBooWidgetProvider.updateAllWidgets(this)
        handler.post(tickRunnable)
    }

    private fun resumeFromPrefs() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val now = System.currentTimeMillis()
        val endAt = prefs.getLong(KEY_TIMER_END_AT, 0L)
        when {
            prefs.getBoolean(SimulationController.KEY_SIMULATION_ACTIVE, false) -> {
                SimulationController.start(this, resume = true)
            }
            prefs.getBoolean(KEY_TIMER_ACTIVE, false) && endAt > now -> {
                endTimeMillis = endAt
                goForeground(buildCountdownNotification(((endAt - now) / 1000).toInt()))
                runCountdown()
            }
            prefs.getBoolean(KEY_TIMER_ACTIVE, false) -> {
                // Fix auto-trigger: only trigger if expired very recently (within 15 seconds)
                val elapsedSinceExpiry = now - endAt
                if (endAt > 0L && elapsedSinceExpiry in 0..15_000L) {
                    endTimeMillis = endAt
                    onTimerExpired()
                } else {
                    // Stale timer — clear out cleanly and do not trigger unexpected blackout
                    prefs.edit()
                        .putBoolean(KEY_TIMER_ACTIVE, false)
                        .remove(KEY_TIMER_END_AT)
                        .commit()
                    BabyBooWidgetProvider.updateAllWidgets(this, 0)
                    stopIfIdle()
                }
            }
            else -> stopIfIdle()
        }
    }

    private fun stopIfIdle() {
        goForeground(buildCountdownNotification(0))
        stopForegroundCompat()
        stopSelf()
    }

    private fun cancelCountdown() {
        handler.removeCallbacks(tickRunnable)
        releaseWakeLock()

        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit()
            .putBoolean(KEY_TIMER_ACTIVE, false)
            .remove(KEY_TIMER_END_AT)
            .commit()

        BabyBooWidgetProvider.updateAllWidgets(this, 0)
        if (!SimulationController.isActive()) {
            stopForegroundCompat()
            stopSelf()
        }
    }

    private fun onTimerExpired() {
        handler.removeCallbacks(tickRunnable)
        releaseWakeLock()

        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit()
            .putBoolean(KEY_TIMER_ACTIVE, false)
            .remove(KEY_TIMER_END_AT)
            .commit()

        BabyBooWidgetProvider.updateAllWidgets(this, 0)

        // Strict: NO spoiler notifications when timer reaches zero.
        // Dismiss the ongoing countdown notification immediately.
        try {
            stopForegroundCompat()
            val nm = getSystemService(NotificationManager::class.java)
            nm?.cancel(NOTIFICATION_ID)
            nm?.cancel(SIMULATION_NOTIFICATION_ID)
        } catch (_: Exception) { }

        // Wake screen if display is off
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            @Suppress("DEPRECATION")
            pm.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
                "BabyBoo::ShutdownWakeLock"
            ).acquire(10_000L)
        } catch (_: Exception) { }

        SimulationController.start(this)
    }

    private fun goForeground(notification: Notification) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (_: Exception) { }
    }

    private fun stopForegroundCompat() {
        try { stopForeground(STOP_FOREGROUND_REMOVE) } catch (_: Exception) { }
    }

    private fun acquireWakeLock(timeoutMillis: Long) {
        releaseWakeLock()
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "BabyBoo::ScreenTimeTimer").apply {
                acquire(timeoutMillis.coerceAtLeast(60_000L))
            }
        } catch (_: Exception) { }
    }

    private fun releaseWakeLock() {
        try {
            wakeLock?.let { if (it.isHeld) it.release() }
        } catch (_: Exception) { }
        wakeLock = null
    }

    private fun createNotificationChannels() {
        val nm = getSystemService(NotificationManager::class.java) ?: return
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "BabyBoo Screen Time", NotificationManager.IMPORTANCE_LOW).apply {
                description = "Active screen time countdown"
                setShowBadge(false)
            }
        )
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_ALARM_ID, "BabyBoo Session Complete", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Full screen battery drainage simulation trigger"
                enableVibration(true)
            }
        )
    }

    private fun openPopupPendingIntent(): PendingIntent = PendingIntent.getActivity(
        this, 1003,
        Intent(this, WidgetPopupActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    private fun buildCountdownNotification(remainingSeconds: Int): Notification {
        val cancelPendingIntent = PendingIntent.getService(
            this, 0,
            Intent(this, ScreenTimeBackgroundService::class.java).apply { action = ACTION_CANCEL_TIMER },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("BabyBoo Screen Time Active")
            .setContentText("Time remaining: ${WidgetPopupActivity.formatClock(remainingSeconds)}")
            .setSmallIcon(R.drawable.ic_stat_babyboo)
            .setOngoing(true)
            .setSilent(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(openPopupPendingIntent())
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(0, "Cancel", cancelPendingIntent)
            .build()
    }

    private fun updateNotification(notification: Notification) {
        try {
            getSystemService(NotificationManager::class.java)?.notify(NOTIFICATION_ID, notification)
        } catch (_: Exception) { }
    }

    override fun onDestroy() {
        handler.removeCallbacks(tickRunnable)
        releaseWakeLock()
        BabyBooWidgetProvider.updateAllWidgets(this)
        super.onDestroy()
    }
}
