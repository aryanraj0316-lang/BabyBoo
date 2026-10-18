package com.babyboo.app

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

/**
 * WidgetPopupActivity — floating popup shown when the home screen widget is tapped.
 *
 * - Idle: shows the timer options configured in the BabyBoo app (Schedule tab). Tapping one starts
 *   ScreenTimeBackgroundService right here — the BabyBoo app is never opened.
 * - Running: shows the live countdown (remaining, elapsed, total) with Stop / Done.
 *
 * The UI is rebuilt from SharedPreferences every time the popup comes to the front (onResume),
 * because this activity is singleInstance and Android reuses an existing instance when the widget
 * is tapped again — building only in onCreate showed stale options and hid a running countdown.
 */
class WidgetPopupActivity : Activity() {

    companion object {
        const val PREFS_NAME = "babyboo_widget_prefs"
        const val KEY_WIDGET_OPTIONS = "babyboo_widget_timer_options"
        val DEFAULT_OPTIONS = listOf(15, 30, 45, 60)
        private const val REQUEST_NOTIFICATIONS = 4101

        fun formatClock(totalSeconds: Int): String {
            val s = totalSeconds.coerceAtLeast(0)
            val h = s / 3600
            val m = (s % 3600) / 60
            val sec = s % 60
            return if (h > 0) String.format("%d:%02d:%02d", h, m, sec) else String.format("%02d:%02d", m, sec)
        }

        fun formatOption(minutes: Int): String {
            val h = minutes / 60
            val m = minutes % 60
            return when {
                h == 0 -> "${m}m"
                m == 0 -> "${h}h"
                else -> "${h}h ${m}m"
            }
        }
    }

    private val handler = Handler(Looper.getMainLooper())
    private var activeCountdownText: TextView? = null
    private var activeElapsedText: TextView? = null
    private var showingActive = false

    private val tickRunnable = object : Runnable {
        override fun run() {
            updateLiveCountdownDisplay()
            handler.postDelayed(this, 500)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.apply {
            setBackgroundDrawableResource(android.R.color.transparent)
            addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
            setDimAmount(0.40f)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }

    override fun onResume() {
        super.onResume()
        if (SimulationController.isActive()) {
            finish()
            return
        }
        renderPopupUI()
        handler.removeCallbacks(tickRunnable)
        handler.post(tickRunnable)
    }

    override fun onPause() {
        handler.removeCallbacks(tickRunnable)
        super.onPause()
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        super.onDestroy()
    }

    private fun prefs() = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private fun remainingSeconds(): Int {
        val p = prefs()
        val endAt = p.getLong(ScreenTimeBackgroundService.KEY_TIMER_END_AT, 0L)
        val remainingMillis = endAt - System.currentTimeMillis()
        return if (p.getBoolean(ScreenTimeBackgroundService.KEY_TIMER_ACTIVE, false) && remainingMillis > 0) {
            ((remainingMillis + 999) / 1000).toInt()
        } else 0
    }

    private fun renderPopupUI() {
        activeCountdownText = null
        activeElapsedText = null

        val rootFrame = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setOnClickListener { finish() } // Dismiss on outside tap
        }

        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = FrameLayout.LayoutParams(dpToPx(320), FrameLayout.LayoutParams.WRAP_CONTENT).apply {
                gravity = Gravity.CENTER
            }
            setPadding(dpToPx(18), dpToPx(18), dpToPx(18), dpToPx(18))
            background = GradientDrawable().apply {
                setColor(Color.WHITE)
                cornerRadius = dpToPx(24).toFloat()
            }
            elevation = dpToPx(12).toFloat()
            setOnClickListener { /* consume clicks inside the card */ }
        }

        card.addView(buildHeader())
        if (!SimulationController.canDrawOverlays(this)) {
            card.addView(buildOverlayPermissionBanner())
        }

        val remaining = remainingSeconds()
        showingActive = remaining > 0
        if (showingActive) buildActiveSection(card, remaining) else buildIdleSection(card)

        rootFrame.addView(card)
        setContentView(rootFrame)
    }

    private fun buildHeader(): View {
        val headerRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        headerRow.addView(View(this).apply {
            layoutParams = LinearLayout.LayoutParams(dpToPx(28), dpToPx(28)).apply { marginEnd = dpToPx(8) }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#5D997C"))
            }
        })
        headerRow.addView(TextView(this).apply {
            text = "BabyBoo Screen Time"
            setTextColor(Color.parseColor("#1A2436"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15.5f)
            typeface = Typeface.create("sans-serif-medium", Typeface.BOLD)
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        })
        headerRow.addView(TextView(this).apply {
            text = "✕"
            setTextColor(Color.parseColor("#475569"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(dpToPx(26), dpToPx(26))
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#E2E8F0"))
            }
            setOnClickListener { finish() }
        })
        return headerRow
    }

    /** Without this permission Android will not let the battery screen appear over other apps. */
    private fun buildOverlayPermissionBanner(): View = TextView(this).apply {
        text = "⚠ One-time setup: tap here and turn ON \"Display over other apps\" for BabyBoo, " +
            "otherwise the battery screen cannot appear over YouTube or games."
        setTextColor(Color.parseColor("#92400E"))
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 11.5f)
        typeface = Typeface.DEFAULT_BOLD
        setPadding(dpToPx(12), dpToPx(10), dpToPx(12), dpToPx(10))
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = dpToPx(12) }
        background = GradientDrawable().apply {
            setColor(Color.parseColor("#FEF3C7"))
            cornerRadius = dpToPx(12).toFloat()
            setStroke(dpToPx(1), Color.parseColor("#F59E0B"))
        }
        setOnClickListener {
            try {
                startActivity(
                    Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName"))
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                )
            } catch (_: Exception) {
                try {
                    startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                } catch (_: Exception) { }
            }
        }
    }

    private fun buildActiveSection(card: LinearLayout, initialRemaining: Int) {
        val countdownBox = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dpToPx(12) }
            setPadding(dpToPx(14), dpToPx(16), dpToPx(14), dpToPx(14))
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#F0FDF4"))
                cornerRadius = dpToPx(16).toFloat()
                setStroke(dpToPx(1.5f), Color.parseColor("#86EFAC"))
            }
        }

        countdownBox.addView(TextView(this).apply {
            text = "● TIMER RUNNING"
            setTextColor(Color.parseColor("#15803D"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
        })

        activeCountdownText = TextView(this).apply {
            text = formatClock(initialRemaining)
            setTextColor(Color.parseColor("#14532D"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 44f)
            typeface = Typeface.create("sans-serif-black", Typeface.BOLD)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dpToPx(4) }
        }
        countdownBox.addView(activeCountdownText)

        countdownBox.addView(TextView(this).apply {
            text = "remaining"
            setTextColor(Color.parseColor("#166534"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            gravity = Gravity.CENTER
        })

        activeElapsedText = TextView(this).apply {
            text = elapsedLine(initialRemaining)
            setTextColor(Color.parseColor("#166534"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11.5f)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dpToPx(8) }
        }
        countdownBox.addView(activeElapsedText)
        card.addView(countdownBox)

        val buttonsRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dpToPx(12) }
        }
        buttonsRow.addView(actionButton("Stop Timer", "#DC2626", "#FEE2E2", endMargin = true) { onStopTimerSelected() })
        buttonsRow.addView(actionButton("Done", "#334155", "#F1F5F9", endMargin = false) { finish() })
        card.addView(buttonsRow)

        card.addView(TextView(this).apply {
            text = "Keeps running in the background. Tap the widget any time to check."
            setTextColor(Color.parseColor("#94A3B8"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dpToPx(10) }
        })
    }

    private fun elapsedLine(remaining: Int): String {
        val total = prefs().getInt(ScreenTimeBackgroundService.KEY_TIMER_TOTAL_SECONDS, remaining)
        val elapsed = (total - remaining).coerceAtLeast(0)
        return "Elapsed ${formatClock(elapsed)}  •  Total ${formatOption(total / 60)}"
    }

    private fun actionButton(label: String, fg: String, bg: String, endMargin: Boolean, onClick: () -> Unit) =
        TextView(this).apply {
            text = label
            setTextColor(Color.parseColor(fg))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(dpToPx(16), dpToPx(10), dpToPx(16), dpToPx(10))
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                if (endMargin) marginEnd = dpToPx(6) else marginStart = dpToPx(6)
            }
            background = GradientDrawable().apply {
                setColor(Color.parseColor(bg))
                cornerRadius = dpToPx(10).toFloat()
            }
            setOnClickListener { onClick() }
        }

    private fun buildIdleSection(card: LinearLayout) {
        card.addView(TextView(this).apply {
            text = "Tap a time to start the countdown:"
            setTextColor(Color.parseColor("#64748B"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dpToPx(12)
                bottomMargin = dpToPx(10)
            }
        })

        val options = getTimerOptions()
        val perRow = if (options.size <= 4) 4 else 3
        for (rowItems in options.chunked(perRow)) {
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    topMargin = dpToPx(3)
                    bottomMargin = dpToPx(3)
                }
            }
            for (mins in rowItems) row.addView(createTimerPill(mins))
            // Keep pills the same width on a short last row
            repeat(perRow - rowItems.size) {
                row.addView(View(this).apply {
                    layoutParams = LinearLayout.LayoutParams(0, dpToPx(42), 1f).apply {
                        marginStart = dpToPx(3)
                        marginEnd = dpToPx(3)
                    }
                })
            }
            card.addView(row)
        }

        card.addView(TextView(this).apply {
            text = "Change these times in BabyBoo → Schedule tab"
            setTextColor(Color.parseColor("#94A3B8"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dpToPx(12) }
        })
    }

    private fun updateLiveCountdownDisplay() {
        if (SimulationController.isActive()) {
            finish()
            return
        }
        val remaining = remainingSeconds()
        if (remaining > 0 && showingActive) {
            activeCountdownText?.text = formatClock(remaining)
            activeElapsedText?.text = elapsedLine(remaining)
        } else if ((remaining > 0) != showingActive) {
            // Timer started/stopped/finished elsewhere (notification, app) — switch views
            renderPopupUI()
        }
    }

    private fun getTimerOptions(): List<Int> {
        val optionsStr = prefs().getString(KEY_WIDGET_OPTIONS, null)
        if (!optionsStr.isNullOrBlank()) {
            val parsed = optionsStr.split(",")
                .mapNotNull { it.trim().toIntOrNull() }
                .filter { it > 0 }
                .distinct()
                .sorted()
            if (parsed.isNotEmpty()) return parsed
        }
        return DEFAULT_OPTIONS
    }

    private fun createTimerPill(minutes: Int) = TextView(this).apply {
        text = formatOption(minutes)
        setTextColor(Color.parseColor("#1A2436"))
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 13.5f)
        typeface = Typeface.DEFAULT_BOLD
        gravity = Gravity.CENTER
        layoutParams = LinearLayout.LayoutParams(0, dpToPx(42), 1f).apply {
            marginStart = dpToPx(3)
            marginEnd = dpToPx(3)
        }
        background = GradientDrawable().apply {
            setColor(Color.parseColor("#F1F5F9"))
            cornerRadius = dpToPx(12).toFloat()
            setStroke(dpToPx(1), Color.parseColor("#CBD5E1"))
        }
        setOnClickListener { onTimerOptionSelected(minutes) }
    }

    private fun onTimerOptionSelected(minutes: Int) {
        vibrateBriefly()
        requestNotificationPermissionIfNeeded()

        val totalSecs = minutes * 60
        prefs().edit()
            .putBoolean(ScreenTimeBackgroundService.KEY_TIMER_ACTIVE, true)
            .putLong(ScreenTimeBackgroundService.KEY_TIMER_END_AT, System.currentTimeMillis() + totalSecs * 1000L)
            .putInt(ScreenTimeBackgroundService.KEY_TIMER_TOTAL_SECONDS, totalSecs)
            .commit()

        val serviceIntent = Intent(this, ScreenTimeBackgroundService::class.java).apply {
            action = ScreenTimeBackgroundService.ACTION_START_TIMER
            putExtra(ScreenTimeBackgroundService.EXTRA_MINUTES, minutes)
        }
        try {
            startForegroundService(serviceIntent)
        } catch (_: Exception) {
            try { startService(serviceIntent) } catch (_: Exception) { }
        }

        BabyBooWidgetProvider.updateAllWidgets(this, totalSecs)
        // Show the live countdown right here in the popup
        renderPopupUI()
    }

    private fun onStopTimerSelected() {
        vibrateBriefly()
        prefs().edit()
            .putBoolean(ScreenTimeBackgroundService.KEY_TIMER_ACTIVE, false)
            .remove(ScreenTimeBackgroundService.KEY_TIMER_END_AT)
            .commit()
        try {
            startService(Intent(this, ScreenTimeBackgroundService::class.java).apply {
                action = ScreenTimeBackgroundService.ACTION_CANCEL_TIMER
            })
        } catch (_: Exception) { }
        BabyBooWidgetProvider.updateAllWidgets(this, 0)
        renderPopupUI()
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            try {
                requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), REQUEST_NOTIFICATIONS)
            } catch (_: Exception) { }
        }
    }

    private fun vibrateBriefly() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vm.defaultVibrator.vibrate(VibrationEffect.createOneShot(45, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                (getSystemService(Context.VIBRATOR_SERVICE) as Vibrator)
                    .vibrate(VibrationEffect.createOneShot(45, VibrationEffect.DEFAULT_AMPLITUDE))
            }
        } catch (_: Exception) { }
    }

    private fun dpToPx(dp: Float): Int =
        TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, resources.displayMetrics).toInt()

    private fun dpToPx(dp: Int): Int = dpToPx(dp.toFloat())
}
