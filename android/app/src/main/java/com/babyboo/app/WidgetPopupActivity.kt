package com.babyboo.app

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

/**
 * WidgetPopupActivity — a lightweight, floating dialog activity.
 *
 * Launched directly from BabyBooWidgetProvider when the home screen widget is tapped.
 * Features:
 * 1. Synchronized with the BabyBoo app: Displays all customized/predefined timer options (e.g. 2m, 15m, 30m, etc.).
 * 2. When a timer option is selected:
 *    - Immediately starts ScreenTimeBackgroundService in the background.
 *    - Immediately switches to an ACTIVE COUNTDOWN display ticking down live every second.
 *    - Gives the user 100% visual certainty and haptic confirmation that the timer is running.
 * 3. When opened while a countdown is already active:
 *    - Shows the live ticking countdown (e.g. 01:45 remaining), total time, and elapsed time.
 *    - Provides a "Stop Timer" button to cancel.
 *    - Allows switching to a new duration with 1 tap.
 * 4. Closing the popup NEVER redirects to the BabyBoo main app — the user stays on their home screen.
 */
class WidgetPopupActivity : Activity() {

    companion object {
        const val PREFS_NAME = "babyboo_widget_prefs"
        const val KEY_WIDGET_OPTIONS = "babyboo_widget_timer_options"
    }

    private val handler = Handler(Looper.getMainLooper())
    private var rootCard: LinearLayout? = null
    private var activeCountdownText: TextView? = null
    private var activeElapsedText: TextView? = null

    private val tickRunnable = object : Runnable {
        override fun run() {
            updateLiveCountdownDisplay()
            handler.postDelayed(this, 1000)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Floating dialog configuration
        window.apply {
            setBackgroundDrawableResource(android.R.color.transparent)
            addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
            setDimAmount(0.40f)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                setDecorFitsSystemWindows(false)
            }
        }

        renderPopupUI()
    }

    override fun onResume() {
        super.onResume()
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

    private fun renderPopupUI() {
        handler.removeCallbacks(tickRunnable)

        val rootFrame = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setOnClickListener { finish() } // Dismiss on outside tap
        }

        val cardWidth = dpToPx(320)
        rootCard = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            val lp = FrameLayout.LayoutParams(cardWidth, FrameLayout.LayoutParams.WRAP_CONTENT)
            lp.gravity = Gravity.CENTER
            layoutParams = lp
            setPadding(dpToPx(18), dpToPx(18), dpToPx(18), dpToPx(18))
            val bg = GradientDrawable().apply {
                setColor(Color.parseColor("#FFFFFF"))
                cornerRadius = dpToPx(24).toFloat()
            }
            background = bg
            elevation = dpToPx(12).toFloat()
            setOnClickListener { /* consume click inside card */ }
        }

        // Header row: icon + title + close button
        val headerRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        val iconCircle = View(this).apply {
            val size = dpToPx(28)
            layoutParams = LinearLayout.LayoutParams(size, size).apply {
                marginEnd = dpToPx(8)
            }
            val circleBg = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#5D997C"))
            }
            background = circleBg
        }
        headerRow.addView(iconCircle)

        val title = TextView(this).apply {
            text = "BabyBoo Screen Time"
            setTextColor(Color.parseColor("#1A2436"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15.5f)
            typeface = android.graphics.Typeface.create("sans-serif-medium", android.graphics.Typeface.BOLD)
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        headerRow.addView(title)

        val closeBtn = TextView(this).apply {
            text = "✕"
            setTextColor(Color.parseColor("#475569"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            val size = dpToPx(26)
            layoutParams = LinearLayout.LayoutParams(size, size)
            val closeBg = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#E2E8F0"))
            }
            background = closeBg
            setOnClickListener { finish() }
        }
        headerRow.addView(closeBtn)
        rootCard!!.addView(headerRow)

        // Check active state
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val isActive = prefs.getBoolean(ScreenTimeBackgroundService.KEY_TIMER_ACTIVE, false)
        val endAt = prefs.getLong(ScreenTimeBackgroundService.KEY_TIMER_END_AT, 0L)
        val now = System.currentTimeMillis()
        val remaining = if (isActive && endAt > now) ((endAt - now) / 1000).toInt() else 0

        if (remaining > 0) {
            buildActiveSection(rootCard!!, remaining)
        } else {
            buildIdleSection(rootCard!!)
        }

        rootFrame.addView(rootCard)
        setContentView(rootFrame)

        if (remaining > 0) {
            handler.post(tickRunnable)
        }
    }

    private fun buildActiveSection(card: LinearLayout, initialRemaining: Int) {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val totalSecs = prefs.getInt(ScreenTimeBackgroundService.KEY_TIMER_TOTAL_SECONDS, initialRemaining)
        val elapsed = maxOf(0, totalSecs - initialRemaining)

        // Big countdown card container
        val countdownBox = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dpToPx(12)
                bottomMargin = dpToPx(10)
            }
            setPadding(dpToPx(14), dpToPx(14), dpToPx(14), dpToPx(14))
            val bg = GradientDrawable().apply {
                setColor(Color.parseColor("#F0FDF4")) // Light emerald
                cornerRadius = dpToPx(16).toFloat()
                setStroke(dpToPx(1.5f), Color.parseColor("#86EFAC"))
            }
            background = bg
        }

        val statusBadge = TextView(this).apply {
            text = "● TIMER RUNNING IN BACKGROUND"
            setTextColor(Color.parseColor("#15803D"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10.5f)
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
        }
        countdownBox.addView(statusBadge)

        val m = initialRemaining / 60
        val s = initialRemaining % 60
        val timeStr = String.format("%02d:%02d", m, s)

        activeCountdownText = TextView(this).apply {
            text = timeStr
            setTextColor(Color.parseColor("#14532D"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 36f)
            typeface = android.graphics.Typeface.create("sans-serif-black", android.graphics.Typeface.BOLD)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dpToPx(4)
                bottomMargin = dpToPx(2)
            }
        }
        countdownBox.addView(activeCountdownText)

        val elapsedM = elapsed / 60
        val elapsedS = elapsed % 60
        val totalM = totalSecs / 60

        activeElapsedText = TextView(this).apply {
            text = String.format("Elapsed: %02d:%02d • Total: %dm", elapsedM, elapsedS, totalM)
            setTextColor(Color.parseColor("#166534"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            gravity = Gravity.CENTER
        }
        countdownBox.addView(activeElapsedText)

        // Action Buttons Row: Stop Timer + Done
        val buttonsRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dpToPx(10)
            }
        }

        val stopBtn = TextView(this).apply {
            text = "Stop Timer"
            setTextColor(Color.parseColor("#DC2626"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(dpToPx(16), dpToPx(8), dpToPx(16), dpToPx(8))
            val lp = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                marginEnd = dpToPx(6)
            }
            layoutParams = lp
            val btnBg = GradientDrawable().apply {
                setColor(Color.parseColor("#FEE2E2"))
                cornerRadius = dpToPx(10).toFloat()
            }
            background = btnBg
            setOnClickListener { onStopTimerSelected() }
        }
        buttonsRow.addView(stopBtn)

        val doneBtn = TextView(this).apply {
            text = "Done"
            setTextColor(Color.parseColor("#334155"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(dpToPx(16), dpToPx(8), dpToPx(16), dpToPx(8))
            val lp = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                marginStart = dpToPx(6)
            }
            layoutParams = lp
            val btnBg = GradientDrawable().apply {
                setColor(Color.parseColor("#F1F5F9"))
                cornerRadius = dpToPx(10).toFloat()
            }
            background = btnBg
            setOnClickListener { finish() }
        }
        buttonsRow.addView(doneBtn)
        countdownBox.addView(buttonsRow)

        card.addView(countdownBox)

        // Subtitle for changing timing
        val changeSubtitle = TextView(this).apply {
            text = "Or tap a duration to restart with new time:"
            setTextColor(Color.parseColor("#64748B"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dpToPx(4)
                bottomMargin = dpToPx(8)
            }
        }
        card.addView(changeSubtitle)

        // Render option pills
        renderPills(card)
    }

    private fun buildIdleSection(card: LinearLayout) {
        val subtitle = TextView(this).apply {
            text = "Tap a timing to start background screen time:"
            setTextColor(Color.parseColor("#64748B"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dpToPx(10)
                bottomMargin = dpToPx(12)
            }
        }
        card.addView(subtitle)

        renderPills(card)

        val hint = TextView(this).apply {
            text = "⏱ Live countdown on widget • Simulates battery drain at 0m"
            setTextColor(Color.parseColor("#94A3B8"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dpToPx(12)
            }
        }
        card.addView(hint)
    }

    private fun renderPills(card: LinearLayout) {
        val timerOptions = getTimerOptions()
        val chunkSize = if (timerOptions.size <= 4) 4 else 3
        val rows = timerOptions.chunked(chunkSize)

        for (rowItems in rows) {
            val optionsRow = LinearLayout(this).apply {
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
            for (mins in rowItems) {
                val pill = createTimerPill(mins)
                optionsRow.addView(pill)
            }
            card.addView(optionsRow)
        }
    }

    private fun updateLiveCountdownDisplay() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val isActive = prefs.getBoolean(ScreenTimeBackgroundService.KEY_TIMER_ACTIVE, false)
        val endAt = prefs.getLong(ScreenTimeBackgroundService.KEY_TIMER_END_AT, 0L)
        val totalSecs = prefs.getInt(ScreenTimeBackgroundService.KEY_TIMER_TOTAL_SECONDS, 0)
        val now = System.currentTimeMillis()
        val remaining = if (isActive && endAt > now) ((endAt - now) / 1000).toInt() else 0

        if (remaining > 0) {
            val m = remaining / 60
            val s = remaining % 60
            activeCountdownText?.text = String.format("%02d:%02d", m, s)

            val elapsed = maxOf(0, totalSecs - remaining)
            val elapsedM = elapsed / 60
            val elapsedS = elapsed % 60
            val totalM = totalSecs / 60
            activeElapsedText?.text = String.format("Elapsed: %02d:%02d • Total: %dm", elapsedM, elapsedS, totalM)
        } else if (isActive) {
            // Reached zero, switch UI back
            renderPopupUI()
        }
    }

    private fun getTimerOptions(): List<Int> {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val optionsStr = prefs.getString(KEY_WIDGET_OPTIONS, null)
        if (!optionsStr.isNullOrBlank()) {
            try {
                val parsed = optionsStr.split(",")
                    .mapNotNull { it.trim().toIntOrNull() }
                    .filter { it > 0 }
                if (parsed.isNotEmpty()) return parsed
            } catch (_: Exception) { }
        }
        return listOf(15, 30, 45, 60)
    }

    private fun createTimerPill(minutes: Int): TextView {
        val label = if (minutes >= 60 && minutes % 60 == 0) {
            "${minutes / 60}h"
        } else {
            "${minutes}m"
        }

        return TextView(this).apply {
            text = label
            setTextColor(Color.parseColor("#1A2436"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            val lp = LinearLayout.LayoutParams(0, dpToPx(40), 1f).apply {
                marginStart = dpToPx(3)
                marginEnd = dpToPx(3)
            }
            layoutParams = lp
            val pillBg = GradientDrawable().apply {
                setColor(Color.parseColor("#F1F5F9"))
                cornerRadius = dpToPx(12).toFloat()
                setStroke(dpToPx(1), Color.parseColor("#CBD5E1"))
            }
            background = pillBg

            setOnClickListener {
                onTimerOptionSelected(minutes)
            }
        }
    }

    private fun onTimerOptionSelected(minutes: Int) {
        vibrateBriefly()

        val now = System.currentTimeMillis()
        val totalSecs = minutes * 60
        val endAt = now + (totalSecs * 1000L)

        // Persist timer state synchronously to disk
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putBoolean(ScreenTimeBackgroundService.KEY_TIMER_ACTIVE, true)
            .putLong(ScreenTimeBackgroundService.KEY_TIMER_END_AT, endAt)
            .putInt(ScreenTimeBackgroundService.KEY_TIMER_TOTAL_SECONDS, totalSecs)
            .commit()

        // Start the ScreenTimeBackgroundService
        val serviceIntent = Intent(this, ScreenTimeBackgroundService::class.java).apply {
            action = ScreenTimeBackgroundService.ACTION_START_TIMER
            putExtra(ScreenTimeBackgroundService.EXTRA_MINUTES, minutes)
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
        } catch (_: Exception) {
            try { startService(serviceIntent) } catch (_: Exception) {}
        }

        // Update home screen widget immediately
        BabyBooWidgetProvider.updateAllWidgets(this, totalSecs)

        // Switch to Active Countdown View immediately so the user SEES the timer ticking down live
        renderPopupUI()

        // Auto-dismiss after 3.5 seconds if untouched, giving the user ample time to see the live countdown
        handler.postDelayed({
            if (!isFinishing && !isDestroyed) {
                finish()
            }
        }, 3500)
    }

    private fun onStopTimerSelected() {
        vibrateBriefly()

        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putBoolean(ScreenTimeBackgroundService.KEY_TIMER_ACTIVE, false)
            .remove(ScreenTimeBackgroundService.KEY_TIMER_END_AT)
            .commit()

        val serviceIntent = Intent(this, ScreenTimeBackgroundService::class.java).apply {
            action = ScreenTimeBackgroundService.ACTION_CANCEL_TIMER
        }
        try {
            startService(serviceIntent)
        } catch (_: Exception) {}

        BabyBooWidgetProvider.updateAllWidgets(this, 0)

        // Switch back to idle view
        renderPopupUI()
    }

    private fun vibrateBriefly() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vibratorManager.defaultVibrator.vibrate(VibrationEffect.createOneShot(45, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(45, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(45)
                }
            }
        } catch (_: Exception) { }
    }

    private fun dpToPx(dp: Float): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dp,
            resources.displayMetrics
        ).toInt()
    }

    private fun dpToPx(dp: Int): Int = dpToPx(dp.toFloat())
}
