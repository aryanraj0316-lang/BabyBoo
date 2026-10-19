package com.babyboo.app

import android.Manifest
import android.app.Activity
import android.app.AlertDialog
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
 * - Idle: shows timer options. Tapping one starts an automated setup wizard if permissions
 *   are missing, or starts ScreenTimeBackgroundService immediately.
 * - Automatic Setup Wizard:
 *   1. Step 1: Overlay permission ("Display over other apps") -> redirects directly to BabyBoo's toggle.
 *   2. Step 2: Accessibility permission ("Prevent Kid Bypass") -> redirects to Accessibility settings.
 *   When the user returns from settings, the timer starts automatically without manual back-and-forth!
 * - Running: shows live countdown with Stop / Done buttons.
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

    private var pendingTimerMinutes = 0
    private var awaitingOverlayReturn = false
    private var awaitingAccessibilityReturn = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (savedInstanceState != null) {
            pendingTimerMinutes = savedInstanceState.getInt("pending_timer_minutes", 0)
            awaitingOverlayReturn = savedInstanceState.getBoolean("awaiting_overlay_return", false)
            awaitingAccessibilityReturn = savedInstanceState.getBoolean("awaiting_accessibility_return", false)
        }
        window.apply {
            setBackgroundDrawableResource(android.R.color.transparent)
            addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
            setDimAmount(0.40f)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putInt("pending_timer_minutes", pendingTimerMinutes)
        outState.putBoolean("awaiting_overlay_return", awaitingOverlayReturn)
        outState.putBoolean("awaiting_accessibility_return", awaitingAccessibilityReturn)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }

    override fun onResume() {
        super.onResume()
        if (SimulationController.isOverlayShowing()) {
            finish()
            return
        }
        renderPopupUI()
        handler.removeCallbacks(tickRunnable)
        handler.post(tickRunnable)

        // If user was in the middle of granting permissions for a selected timer:
        if (pendingTimerMinutes > 0 && remainingSeconds() <= 0) {
            handler.postDelayed({
                if (!isFinishing && !isDestroyed && pendingTimerMinutes > 0) {
                    checkAndProceedPermissionFlow(pendingTimerMinutes)
                }
            }, 300)
        }
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
            setOnClickListener { finish() }
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
            setOnClickListener { }
        }

        card.addView(buildHeader())

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

    private fun openSettings(action: String, data: Uri?) {
        try {
            startActivity(Intent(action).apply {
                if (data != null) this.data = data
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })
        } catch (_: Exception) {
            try {
                startActivity(Intent(action).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            } catch (_: Exception) {
                try {
                    startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
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
        val needsSetup = !SimulationController.canDrawOverlays(this) || !BlackoutAccessibilityService.isEnabled(this)
        if (needsSetup) {
            card.addView(TextView(this).apply {
                text = "⚡ Tap any time below to begin 1-time setup"
                setTextColor(Color.parseColor("#0284C7"))
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 11.5f)
                typeface = Typeface.DEFAULT_BOLD
                setPadding(dpToPx(10), dpToPx(6), dpToPx(10), dpToPx(6))
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    topMargin = dpToPx(10)
                    bottomMargin = dpToPx(2)
                }
                background = GradientDrawable().apply {
                    setColor(Color.parseColor("#F0F9FF"))
                    cornerRadius = dpToPx(10).toFloat()
                    setStroke(dpToPx(1), Color.parseColor("#BAE6FD"))
                }
                gravity = Gravity.CENTER
            })
        }

        card.addView(TextView(this).apply {
            text = "Tap a time to start the countdown:"
            setTextColor(Color.parseColor("#64748B"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dpToPx(10)
                bottomMargin = dpToPx(8)
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
        if (SimulationController.isOverlayShowing()) {
            finish()
            return
        }
        val remaining = remainingSeconds()
        if (remaining > 0 && showingActive) {
            activeCountdownText?.text = formatClock(remaining)
            activeElapsedText?.text = elapsedLine(remaining)
        } else if ((remaining > 0) != showingActive) {
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
        pendingTimerMinutes = minutes
        checkAndProceedPermissionFlow(minutes)
    }

    /**
     * Sequential automated setup wizard:
     * Guides parent through each switch, redirecting directly to the toggle page.
     * When user returns, automatically advances or starts the timer!
     */
    private fun checkAndProceedPermissionFlow(minutes: Int) {
        if (isFinishing || isDestroyed) return

        // 1. Overlay Permission: Required to display the shutdown screen over YouTube/games
        if (!SimulationController.canDrawOverlays(this)) {
            if (awaitingOverlayReturn) {
                // User came back from settings without enabling it
                awaitingOverlayReturn = false
                AlertDialog.Builder(this)
                    .setTitle("Permission Needed")
                    .setMessage("Overlay permission was not turned on. BabyBoo cannot take over the screen when time runs out without this switch enabled.")
                    .setCancelable(false)
                    .setPositiveButton("Try Again") { _, _ ->
                        awaitingOverlayReturn = true
                        openSettings(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName"))
                    }
                    .setNegativeButton("Cancel") { _, _ ->
                        pendingTimerMinutes = 0
                    }
                    .show()
                return
            }

            AlertDialog.Builder(this)
                .setTitle("Step 1 of 2: Allow Display Over Apps")
                .setMessage("To allow BabyBoo to lock the screen over YouTube and other apps when time is up, switch ON \"Allow display over other apps\" on the next screen.\n\nThen press Back to continue.")
                .setCancelable(false)
                .setPositiveButton("Turn ON") { _, _ ->
                    awaitingOverlayReturn = true
                    openSettings(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName"))
                }
                .setNegativeButton("Cancel") { _, _ ->
                    pendingTimerMinutes = 0
                }
                .show()
            return
        }
        awaitingOverlayReturn = false

        // 2. Accessibility Permission: Prevents kids from pulling down status bar or pressing Home
        if (!BlackoutAccessibilityService.isEnabled(this)) {
            if (awaitingAccessibilityReturn) {
                // User came back from accessibility settings without enabling it
                awaitingAccessibilityReturn = false
                AlertDialog.Builder(this)
                    .setTitle("Accessibility Not Enabled")
                    .setMessage("BabyBoo will still take over the screen with low battery! Do you want to start the timer now without status bar protection?")
                    .setCancelable(false)
                    .setPositiveButton("Start Timer Now") { _, _ ->
                        requestNotificationPermissionIfNeeded()
                        startTimerDirectly(minutes)
                    }
                    .setNeutralButton("Try Again") { _, _ ->
                        awaitingAccessibilityReturn = true
                        openSettings(Settings.ACTION_ACCESSIBILITY_SETTINGS, null)
                    }
                    .setNegativeButton("Cancel") { _, _ ->
                        pendingTimerMinutes = 0
                    }
                    .show()
                return
            }

            AlertDialog.Builder(this)
                .setTitle("Step 2 of 2: Prevent Kid Bypass")
                .setMessage("To cover the status bar and navigation buttons during the low-battery simulation so kids cannot exit, turn ON \"BabyBoo\" in Accessibility.\n\nTap BabyBoo on the next screen → switch it ON.")
                .setCancelable(false)
                .setPositiveButton("Turn ON") { _, _ ->
                    awaitingAccessibilityReturn = true
                    openSettings(Settings.ACTION_ACCESSIBILITY_SETTINGS, null)
                }
                .setNeutralButton("Skip for Now") { _, _ ->
                    requestNotificationPermissionIfNeeded()
                    startTimerDirectly(minutes)
                }
                .setNegativeButton("Cancel") { _, _ ->
                    pendingTimerMinutes = 0
                }
                .show()
            return
        }
        awaitingAccessibilityReturn = false

        // 3. Notification permission check
        requestNotificationPermissionIfNeeded()

        // All ready! Start the countdown directly!
        startTimerDirectly(minutes)
    }

    private fun startTimerDirectly(minutes: Int) {
        pendingTimerMinutes = 0
        awaitingOverlayReturn = false
        awaitingAccessibilityReturn = false
        vibrateBriefly()

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
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
        } catch (_: Exception) {
            try { startService(serviceIntent) } catch (_: Exception) { }
        }

        BabyBooWidgetProvider.updateAllWidgets(this, totalSecs)
        renderPopupUI()
    }

    private fun onStopTimerSelected() {
        vibrateBriefly()
        pendingTimerMinutes = 0
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
