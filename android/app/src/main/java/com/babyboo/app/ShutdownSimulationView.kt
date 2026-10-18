package com.babyboo.app

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PointF
import android.graphics.RectF
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView

/**
 * ShutdownSimulationView — the full fake "battery died" sequence as a plain View, so it can be
 * hosted either in a system overlay window (drawn above YouTube, games, the launcher…) or inside
 * ShutdownSimulationActivity as a fallback.
 *
 * Stage 1: Critical battery warning, drains 5% → 0%.
 * Stage 2: "Shutting down…" spinner.
 * Stage 3: Pitch black. Drawing a capital "A" unlocks and calls [onUnlocked].
 */
class ShutdownSimulationView(
    context: Context,
    startInBlackout: Boolean,
    private val onUnlocked: () -> Unit
) : FrameLayout(context) {

    private enum class Stage { BATTERY_DRAINING, SYSTEM_SHUTDOWN, BLACKOUT, UNLOCKED }

    private var currentStage = Stage.BATTERY_DRAINING
    private val handler = Handler(Looper.getMainLooper())
    private var batteryPercent = 5

    private val swipePoints = mutableListOf<PointF>()
    private var isDrawing = false

    private var batteryIcon: BatteryIconView? = null
    private var batteryPercentText: TextView? = null
    private var swipeCanvas: SwipeCanvasView? = null
    private var hintText: TextView? = null
    private var feedbackText: TextView? = null

    init {
        setBackgroundColor(Color.BLACK)
        // Swallow every touch so nothing underneath can be used
        isClickable = true
        isFocusable = true
        if (startInBlackout) showBlackoutStage() else showBatteryDrainStage()
    }

    fun release() {
        handler.removeCallbacksAndMessages(null)
    }

    // ====================
    // STAGE 1: Battery Draining
    // ====================
    private fun showBatteryDrainStage() {
        currentStage = Stage.BATTERY_DRAINING
        removeAllViews()

        val column = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        }

        batteryIcon = BatteryIconView(context).apply {
            level = batteryPercent / 100f
            layoutParams = LinearLayout.LayoutParams(dpToPx(64), dpToPx(120))
        }
        column.addView(batteryIcon)

        batteryPercentText = TextView(context).apply {
            text = "$batteryPercent%"
            setTextColor(Color.parseColor("#EF4444"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 44f)
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dpToPx(18) }
        }
        column.addView(batteryPercentText)

        val warning = TextView(context).apply {
            text = "Battery critically low\nPhone is shutting down"
            setTextColor(Color.parseColor("#D1D5DB"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dpToPx(14) }
        }
        column.addView(warning)

        addView(column)
        vibrateDevice(longArrayOf(0, 150, 100, 200))

        batteryPercent = 5
        handler.postDelayed(object : Runnable {
            override fun run() {
                if (currentStage != Stage.BATTERY_DRAINING) return
                batteryPercent--
                batteryPercentText?.text = "$batteryPercent%"
                batteryIcon?.level = batteryPercent / 100f
                if (batteryPercent <= 0) {
                    vibrateDevice(longArrayOf(0, 300))
                    handler.postDelayed({ showSystemShutdownStage() }, 600)
                } else {
                    vibrateDevice(longArrayOf(0, 60))
                    handler.postDelayed(this, 900)
                }
            }
        }, 900)
    }

    // ====================
    // STAGE 2: System Shutdown
    // ====================
    private fun showSystemShutdownStage() {
        currentStage = Stage.SYSTEM_SHUTDOWN
        removeAllViews()

        val column = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        }

        val spinner = ProgressBar(context).apply {
            isIndeterminate = true
            indeterminateTintList = ColorStateList.valueOf(Color.parseColor("#E5E7EB"))
            layoutParams = LinearLayout.LayoutParams(dpToPx(48), dpToPx(48))
        }
        column.addView(spinner)

        val shutdownText = TextView(context).apply {
            text = "Shutting down…"
            setTextColor(Color.parseColor("#9CA3AF"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dpToPx(20) }
        }
        column.addView(shutdownText)
        addView(column)

        handler.postDelayed({
            shutdownText.text = "Powering off…"
            vibrateDevice(longArrayOf(0, 400))
        }, 1500)
        handler.postDelayed({ column.animate().alpha(0f).setDuration(600).start() }, 2600)
        handler.postDelayed({ showBlackoutStage() }, 3300)
    }

    // ====================
    // STAGE 3: Blackout (Pitch Black)
    // ====================
    private fun showBlackoutStage() {
        currentStage = Stage.BLACKOUT
        removeAllViews()

        swipeCanvas = SwipeCanvasView(context).apply {
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        }
        addView(swipeCanvas)

        hintText = TextView(context).apply {
            text = "" // Hidden by default — parent knows the pattern
            setTextColor(Color.parseColor("#1A1A1A"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 9f)
            gravity = Gravity.CENTER
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
                gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
                bottomMargin = dpToPx(30)
            }
        }
        addView(hintText)

        feedbackText = TextView(context).apply {
            setTextColor(Color.parseColor("#10B981"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            visibility = View.GONE
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
                gravity = Gravity.CENTER
            }
        }
        addView(feedbackText)
    }

    private var emergencyTaps = 0
    private var lastTapTime = 0L

    /** 5 rapid taps on the black screen reveal a faint unlock hint for the parent. */
    private fun registerTap() {
        val now = System.currentTimeMillis()
        emergencyTaps = if (now - lastTapTime < 600) emergencyTaps + 1 else 1
        lastTapTime = now
        if (emergencyTaps >= 5) {
            hintText?.setTextColor(Color.parseColor("#333333"))
            hintText?.text = "Draw a capital \"A\" to unlock"
            emergencyTaps = 0
        }
    }

    inner class SwipeCanvasView(context: Context) : View(context) {
        private val paint = Paint().apply {
            color = Color.parseColor("#333333") // Very dark, barely visible
            strokeWidth = 4f
            style = Paint.Style.STROKE
            isAntiAlias = true
            strokeCap = Paint.Cap.ROUND
            strokeJoin = Paint.Join.ROUND
        }
        private val path = Path()

        override fun onTouchEvent(event: MotionEvent): Boolean {
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    swipePoints.clear()
                    path.reset()
                    swipePoints.add(PointF(event.x, event.y))
                    path.moveTo(event.x, event.y)
                    isDrawing = true
                    invalidate()
                }
                MotionEvent.ACTION_MOVE -> if (isDrawing) {
                    swipePoints.add(PointF(event.x, event.y))
                    path.lineTo(event.x, event.y)
                    invalidate()
                }
                MotionEvent.ACTION_UP -> {
                    isDrawing = false
                    if (swipePoints.size < 5) registerTap()
                    if (currentStage == Stage.BLACKOUT && isCapitalAPattern(swipePoints)) {
                        onPatternRecognized()
                    } else {
                        handler.postDelayed({
                            swipePoints.clear()
                            path.reset()
                            invalidate()
                        }, 300)
                    }
                }
            }
            return true
        }

        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)
            canvas.drawPath(path, paint)
        }

        fun clearPath() {
            path.reset()
            invalidate()
        }
    }

    /** Simple red-level battery outline, like the system "battery critically low" icon. */
    private class BatteryIconView(context: Context) : View(context) {
        var level = 0.05f
            set(value) { field = value.coerceIn(0f, 1f); invalidate() }

        private val outline = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#E5E7EB"); style = Paint.Style.STROKE
        }
        private val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#EF4444"); style = Paint.Style.FILL
        }
        private val nub = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#E5E7EB"); style = Paint.Style.FILL
        }

        override fun onDraw(canvas: Canvas) {
            val w = width.toFloat()
            val h = height.toFloat()
            val stroke = w * 0.08f
            outline.strokeWidth = stroke
            val nubH = h * 0.07f
            canvas.drawRoundRect(RectF(w * 0.32f, 0f, w * 0.68f, nubH + stroke), stroke, stroke, nub)
            val body = RectF(stroke / 2, nubH + stroke / 2, w - stroke / 2, h - stroke / 2)
            canvas.drawRoundRect(body, stroke * 1.5f, stroke * 1.5f, outline)
            val inset = stroke * 1.4f
            val innerTop = body.top + inset
            val innerBottom = body.bottom - inset
            val fillH = maxOf((innerBottom - innerTop) * level, if (level > 0f) stroke else 0f)
            canvas.drawRoundRect(
                RectF(body.left + inset, innerBottom - fillH, body.right - inset, innerBottom),
                stroke / 2, stroke / 2, fill
            )
        }
    }

    /**
     * Lenient capital "A" check: the stroke must go up to an apex and back down again,
     * covering a meaningful part of the screen height (an inverted V, crossbar optional).
     */
    private fun isCapitalAPattern(points: List<PointF>): Boolean {
        if (points.size < 15) return false

        var apexIndex = 0
        var minY = Float.MAX_VALUE
        for (i in points.indices) {
            if (points[i].y < minY) {
                minY = points[i].y
                apexIndex = i
            }
        }

        val apexRatio = apexIndex.toFloat() / points.size
        if (apexRatio < 0.1f || apexRatio > 0.65f) return false

        val totalHeight = maxOf(points.first().y, points.last().y) - minY
        val screenH = resources.displayMetrics.heightPixels.toFloat()
        if (totalHeight < screenH * 0.12f) return false

        val leftLeg = points.subList(0, apexIndex)
        if (leftLeg.size < 3) return false
        if (leftLeg.last().y - leftLeg.first().y > -totalHeight * 0.2f) return false

        val rightLeg = points.subList(apexIndex, points.size)
        if (rightLeg.size < 3) return false
        if (rightLeg.last().y - rightLeg.first().y < totalHeight * 0.2f) return false

        return true
    }

    private fun onPatternRecognized() {
        currentStage = Stage.UNLOCKED
        vibrateDevice(longArrayOf(0, 50, 80, 50))
        swipeCanvas?.clearPath()
        feedbackText?.apply {
            text = "✓ Unlocked"
            visibility = View.VISIBLE
        }
        handler.postDelayed({ onUnlocked() }, 800)
    }

    private fun vibrateDevice(pattern: LongArray) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vm.defaultVibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
            } else {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
            }
        } catch (_: Exception) { }
    }

    private fun dpToPx(dp: Int): Int =
        TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp.toFloat(), resources.displayMetrics).toInt()
}
