package com.babyboo.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import androidx.core.app.NotificationCompat

/**
 * ScreenTimeBackgroundService — Android Foreground Service that runs a continuous
 * countdown timer independently of the React Native app's JavaScript thread.
 *
 * When the timer reaches zero, it launches ShutdownSimulationActivity as a full-screen
 * overlay on top of whatever app or screen the child is currently using.
 */
class ScreenTimeBackgroundService : Service() {

    companion object {
        const val ACTION_START_TIMER = "com.babyboo.app.ACTION_START_TIMER"
        const val ACTION_CANCEL_TIMER = "com.babyboo.app.ACTION_CANCEL_TIMER"
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
    private var totalSeconds: Int = 0
    private var wakeLock: PowerManager.WakeLock? = null

    private val tickRunnable = object : Runnable {
        override fun run() {
            val now = System.currentTimeMillis()
            val remaining = ((endTimeMillis - now) / 1000).toInt()

            if (remaining <= 0) {
                // Timer hit zero! Reset widget and launch shutdown simulation
                BabyBooWidgetProvider.updateAllWidgets(this@ScreenTimeBackgroundService, 0)
                onTimerExpired()
                return
            }

            // Update the notification with remaining time
            updateNotification(remaining)

            // Update the home screen widget with the live countdown
            BabyBooWidgetProvider.updateAllWidgets(this@ScreenTimeBackgroundService, remaining)

            // Tick again in 1 second
            handler.postDelayed(this, 1000)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_TIMER -> {
                val minutes = intent.getIntExtra(EXTRA_MINUTES, 0)
                if (minutes > 0) {
                    startCountdown(minutes)
                }
            }
            ACTION_CANCEL_TIMER -> {
                cancelCountdown()
            }
        }
        return START_STICKY
    }

    private fun startCountdown(minutes: Int) {
        // Stop any existing countdown
        handler.removeCallbacks(tickRunnable)

        totalSeconds = minutes * 60
        endTimeMillis = System.currentTimeMillis() + (totalSeconds * 1000L)

        // Persist timer state to SharedPreferences
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putLong(KEY_TIMER_END_AT, endTimeMillis)
            .putInt(KEY_TIMER_TOTAL_SECONDS, totalSeconds)
            .putBoolean(KEY_TIMER_ACTIVE, true)
            .apply()

        // Acquire partial wake lock to keep timer alive
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "BabyBoo::ScreenTimeTimer"
            ).apply {
                acquire(totalSeconds * 1000L + 60000L) // Extra minute safety
            }
        } catch (_: Exception) { }

        // Immediately update the widget to show the starting countdown
        BabyBooWidgetProvider.updateAllWidgets(this, totalSeconds)

        // Show foreground notification and start ticking
        val notification = buildNotification(totalSeconds)
        startForeground(NOTIFICATION_ID, notification)
        handler.post(tickRunnable)
    }

    private fun cancelCountdown() {
        handler.removeCallbacks(tickRunnable)
        releaseWakeLock()

        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putBoolean(KEY_TIMER_ACTIVE, false)
            .remove(KEY_TIMER_END_AT)
            .apply()

        // Reset widget to idle
        BabyBooWidgetProvider.updateAllWidgets(this, 0)

        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun onTimerExpired() {
        handler.removeCallbacks(tickRunnable)
        releaseWakeLock()

        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putBoolean(KEY_TIMER_ACTIVE, false)
            .remove(KEY_TIMER_END_AT)
            .apply()

        // Reset widget to idle
        BabyBooWidgetProvider.updateAllWidgets(this, 0)

        // Wake screen up if locked/sleeping
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            @Suppress("DEPRECATION")
            val screenWakeLock = pm.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
                "BabyBoo::ShutdownWakeLock"
            )
            screenWakeLock.acquire(10000L)
        } catch (_: Exception) {}

        // Prepare simulation intent
        val simulationIntent = Intent(this, ShutdownSimulationActivity::class.java).apply {
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP or
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            )
        }

        // 1. High-Priority FullScreenIntent Notification (Reliable on Android 10+ background)
        try {
            val fullScreenPendingIntent = PendingIntent.getActivity(
                this,
                1002,
                simulationIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val fullScreenNotification = NotificationCompat.Builder(this, CHANNEL_ALARM_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("BabyBoo Screen Time Reached")
                .setContentText("Screen time session complete.")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .setAutoCancel(true)
                .build()

            val nm = getSystemService(NotificationManager::class.java)
            nm?.notify(SIMULATION_NOTIFICATION_ID, fullScreenNotification)
        } catch (_: Exception) {}

        // 2. Direct startActivity attempt
        try {
            startActivity(simulationIntent)
        } catch (_: Exception) {}

        // Stop the foreground service
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun releaseWakeLock() {
        try {
            wakeLock?.let {
                if (it.isHeld) it.release()
            }
            wakeLock = null
        } catch (_: Exception) { }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(NotificationManager::class.java)

            // Low priority channel for continuous countdown notification
            val countdownChannel = NotificationChannel(
                CHANNEL_ID,
                "BabyBoo Screen Time",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Active screen time countdown"
                setShowBadge(false)
            }
            nm?.createNotificationChannel(countdownChannel)

            // High priority channel for full-screen alarm trigger when timer hits zero
            val alarmChannel = NotificationChannel(
                CHANNEL_ALARM_ID,
                "BabyBoo Session Complete",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Full screen battery drainage simulation trigger"
                setShowBadge(true)
                enableVibration(true)
            }
            nm?.createNotificationChannel(alarmChannel)
        }
    }

    private fun buildNotification(remainingSeconds: Int): Notification {
        val m = remainingSeconds / 60
        val s = remainingSeconds % 60
        val timeStr = String.format("%02d:%02d", m, s)

        // Cancel action
        val cancelIntent = Intent(this, ScreenTimeBackgroundService::class.java).apply {
            action = ACTION_CANCEL_TIMER
        }
        val cancelPendingIntent = PendingIntent.getService(
            this, 0, cancelIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("BabyBoo Screen Time Active")
            .setContentText("Time remaining: $timeStr")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setOngoing(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(android.R.drawable.ic_delete, "Cancel", cancelPendingIntent)
            .build()
    }

    private fun updateNotification(remainingSeconds: Int) {
        val notification = buildNotification(remainingSeconds)
        val nm = getSystemService(NotificationManager::class.java)
        nm?.notify(NOTIFICATION_ID, notification)
    }

    override fun onDestroy() {
        handler.removeCallbacks(tickRunnable)
        releaseWakeLock()
        BabyBooWidgetProvider.updateAllWidgets(this, 0)
        super.onDestroy()
    }
}
