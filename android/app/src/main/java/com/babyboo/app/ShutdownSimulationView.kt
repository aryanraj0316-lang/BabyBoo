package com.babyboo.app

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PointF
import android.graphics.RectF
import android.graphics.Typeface
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.TypedValue
import android.view.Gravity
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

/**
 * ShutdownSimulationView — the full fake "battery died" sequence as a View.
 *
 * Stage 1: Critical battery warning, drains 5% → 0%.
 * Stage 2: "Shutting down…" spinner & powering off transition.
 * Stage 3: Pitch black.
 *          - Faint "Draw A to unlock" hint shown for 3 seconds then fades out into total black.
 *          - Invisible touch capture: NO touch traces, NO lines, screen looks 100% powered off.
 *          - Tolerant capital "A" recognition (supports 1, 2, or 3 strokes).
 *          - 5 rapid taps toggle the faint hint back on.
 */
class ShutdownSimulationView(
    baseContext: Context,
    startInBlackout: Boolean,
    private val onBlackout: () -> Unit = {},
    private val onUnlocked: () -> Unit
) : FrameLayout(android.view.ContextThemeWrapper(baseContext, android.R.style.Theme_DeviceDefault_NoActionBar_Fullscreen)) {

    private enum class Stage { BATTERY_DRAINING, BLACKOUT, UNLOCKED }

    private var currentStage = Stage.BATTERY_DRAINING
    private val handler = Handler(Looper.getMainLooper())

    private var batteryIcon: BatteryIconView? = null
    private var batteryPercentText: TextView? = null
    private var swipeCanvas: SwipeCanvasView? = null
    private var hintText: TextView? = null
    private var feedbackText: TextView? = null

    init {
        setBackgroundColor(Color.BLACK)
        isClickable = true
        isFocusable = true
        isFocusableInTouchMode = true
        if (startInBlackout) showBlackoutStage() else showBatteryDrainStage()
    }

    fun release() {
        handler.removeCallbacksAndMessages(null)
    }

    // ==========================================
    // STAGE 1: Realistic Animated Battery Drain
    // ==========================================
    private fun showBatteryDrainStage() {
        currentStage = Stage.BATTERY_DRAINING
        removeAllViews()

        val column = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
            alpha = 1f
        }

        batteryIcon = BatteryIconView(context).apply {
            level = 0.04f
            layoutParams = LinearLayout.LayoutParams(dpToPx(72), dpToPx(136))
        }
        column.addView(batteryIcon)

        batteryPercentText = TextView(context).apply {
            text = "4%"
            setTextColor(Color.parseColor("#EF4444"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 42f)
            typeface = Typeface.create("sans-serif-light", Typeface.NORMAL)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dpToPx(20) }
        }
        column.addView(batteryPercentText)

        val titleText = TextView(context).apply {
            text = "Battery critically low"
            setTextColor(Color.parseColor("#E4E4E7"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dpToPx(12) }
        }
        column.addView(titleText)

        val subText = TextView(context).apply {
            text = "Phone will shut down"
            setTextColor(Color.parseColor("#71717A"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 13.5f)
            typeface = Typeface.DEFAULT
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dpToPx(4) }
        }
        column.addView(subText)

        addView(column)

        // Initial subtle haptic alert
        vibrateDevice(longArrayOf(0, 120))

        // Step 1: Smooth drain 4% -> 3%
        handler.postDelayed({
            if (currentStage != Stage.BATTERY_DRAINING) return@postDelayed
            batteryPercentText?.text = "3%"
            batteryIcon?.animateLevelTo(0.03f, 600)
            vibrateDevice(longArrayOf(0, 50))
        }, 900)

        // Step 2: Smooth drain 3% -> 2%
        handler.postDelayed({
            if (currentStage != Stage.BATTERY_DRAINING) return@postDelayed
            batteryPercentText?.text = "2%"
            batteryIcon?.animateLevelTo(0.02f, 600)
            vibrateDevice(longArrayOf(0, 50))
        }, 1900)

        // Step 3: Smooth drain 2% -> 1%
        handler.postDelayed({
            if (currentStage != Stage.BATTERY_DRAINING) return@postDelayed
            batteryPercentText?.text = "1%"
            batteryIcon?.animateLevelTo(0.01f, 600)
            vibrateDevice(longArrayOf(0, 60))
        }, 3000)

        // Step 4: Final drain 1% -> 0% (authentic low-power blink)
        handler.postDelayed({
            if (currentStage != Stage.BATTERY_DRAINING) return@postDelayed
            batteryPercentText?.text = "0%"
            batteryIcon?.animateLevelTo(0.0f, 400)
            subText.text = "Shutting down…"
            subText.setTextColor(Color.parseColor("#A1A1AA"))

            batteryIcon?.startBlink()
            vibrateDevice(longArrayOf(0, 100, 80, 200))
        }, 4100)

        // Step 5: Smooth OLED fade-to-black power off into blackout
        handler.postDelayed({
            if (currentStage != Stage.BATTERY_DRAINING) return@postDelayed
            column.animate()
                .alpha(0f)
                .setDuration(600)
                .withEndAction {
                    showBlackoutStage()
                }
                .start()
        }, 5400)
    }

    // ====================
    // STAGE 3: Blackout (Pitch Black)
    // ====================
    private fun showBlackoutStage() {
        currentStage = Stage.BLACKOUT
        removeAllViews()
        onBlackout()

        // Invisible touch canvas covering full screen
        swipeCanvas = SwipeCanvasView(context).apply {
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        }
        addView(swipeCanvas)

        // [5] Faint "Draw capital A to unlock" hint for the first few seconds, then fade into black
        hintText = TextView(context).apply {
            text = "Draw capital A to unlock"
            setTextColor(Color.parseColor("#444444"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            typeface = android.graphics.Typeface.DEFAULT
            gravity = Gravity.CENTER
            alpha = 1f
            layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
                gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
                bottomMargin = dpToPx(36)
            }
        }
        addView(hintText)

        // Fade out hint after 3 seconds into pitch black
        hintText?.animate()
            ?.alpha(0f)
            ?.setDuration(1000)
            ?.setStartDelay(3000)
            ?.withEndAction { hintText?.visibility = View.GONE }
            ?.start()

        feedbackText = TextView(context).apply {
            setTextColor(Color.parseColor("#10B981"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 20f)
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

    /** 5 rapid taps on the black screen briefly reveals the faint unlock hint for the parent. */
    private fun registerTap() {
        val now = System.currentTimeMillis()
        emergencyTaps = if (now - lastTapTime < 600) emergencyTaps + 1 else 1
        lastTapTime = now
        if (emergencyTaps >= 5) {
            emergencyTaps = 0
            hintText?.apply {
                visibility = View.VISIBLE
                alpha = 0f
                animate()
                    .alpha(0.85f)
                    .setDuration(300)
                    .withEndAction {
                        animate()
                            .alpha(0f)
                            .setDuration(1000)
                            .setStartDelay(2500)
                            .withEndAction { visibility = View.GONE }
                            .start()
                    }
                    .start()
            }
        }
    }

    /**
     * Captures strokes 100% invisibly. Absolutely NO lines or touch trails are drawn on screen,
     * maintaining the complete illusion of a powered-off device to the toddler.
     */
    inner class SwipeCanvasView(context: Context) : View(context) {
        private val strokes = mutableListOf<List<PointF>>()
        private var current = mutableListOf<PointF>()
        private val resetRunnable = Runnable { strokes.clear() }

        init {
            isClickable = true
            isFocusable = true
        }

        override fun onTouchEvent(event: MotionEvent): Boolean {
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    handler.removeCallbacks(resetRunnable)
                    current = mutableListOf(PointF(event.x, event.y))
                }
                MotionEvent.ACTION_MOVE -> {
                    for (i in 0 until event.historySize) {
                        current.add(PointF(event.getHistoricalX(i), event.getHistoricalY(i)))
                    }
                    current.add(PointF(event.x, event.y))
                }
                MotionEvent.ACTION_UP -> {
                    current.add(PointF(event.x, event.y))
                    val dist = if (current.isNotEmpty()) {
                        Math.hypot(
                            (current.last().x - current.first().x).toDouble(),
                            (current.last().y - current.first().y).toDouble()
                        ).toFloat()
                    } else 0f

                    if (dist < dpToPx(16) || current.size < 6) {
                        registerTap()
                    } else {
                        if (strokes.size >= 3) strokes.clear()
                        strokes.add(current)
                    }
                    current = mutableListOf()

                    if (currentStage == Stage.BLACKOUT && isCapitalA(strokes)) {
                        handler.removeCallbacks(resetRunnable)
                        strokes.clear()
                        onPatternRecognized()
                    } else {
                        handler.postDelayed(resetRunnable, 2500)
                    }
                }
                MotionEvent.ACTION_CANCEL -> current = mutableListOf()
            }
            return true
        }

        // Intentionally completely blank: NO touch traces whatsoever
        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)
        }
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        return when (event.keyCode) {
            KeyEvent.KEYCODE_BACK,
            KeyEvent.KEYCODE_VOLUME_UP,
            KeyEvent.KEYCODE_VOLUME_DOWN -> true
            else -> super.dispatchKeyEvent(event)
        }
    }

    /** Sleek, modern OEM-style battery indicator icon with smooth animated fluid drain */
    private class BatteryIconView(context: Context) : View(context) {
        var level = 0.04f
            set(value) {
                field = value.coerceIn(0f, 1f)
                invalidate()
            }

        private var blinkAlpha = 1f

        private val bodyOutline = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#3F3F46")
            style = Paint.Style.STROKE
        }
        private val bodyTrack = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#18181B")
            style = Paint.Style.FILL
        }
        private val nubPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#3F3F46")
            style = Paint.Style.FILL
        }
        private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#EF4444")
            style = Paint.Style.FILL
        }
        private val exclamationPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#EF4444")
            style = Paint.Style.FILL
            textAlign = Paint.Align.CENTER
        }

        fun startBlink(onDone: () -> Unit = {}) {
            val animator = ValueAnimator.ofFloat(1f, 0.2f, 1f, 0.15f, 1f, 0.4f, 1f)
            animator.duration = 1100
            animator.addUpdateListener {
                blinkAlpha = it.animatedValue as Float
                invalidate()
            }
            animator.addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    onDone()
                }
            })
            animator.start()
        }

        fun animateLevelTo(targetLevel: Float, durationMs: Long = 600, onEnd: () -> Unit = {}) {
            val animator = ValueAnimator.ofFloat(level, targetLevel)
            animator.duration = durationMs
            animator.interpolator = DecelerateInterpolator()
            animator.addUpdateListener {
                level = it.animatedValue as Float
            }
            animator.addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    onEnd()
                }
            })
            animator.start()
        }

        override fun onDraw(canvas: Canvas) {
            val w = width.toFloat()
            val h = height.toFloat()
            val stroke = w * 0.055f
            bodyOutline.strokeWidth = stroke

            val corner = w * 0.18f

            // Terminal nub on top
            val nubW = w * 0.34f
            val nubH = h * 0.06f
            val nubLeft = (w - nubW) / 2f
            val nubRect = RectF(nubLeft, 0f, nubLeft + nubW, nubH + stroke)
            canvas.drawRoundRect(nubRect, nubH * 0.6f, nubH * 0.6f, nubPaint)

            // Battery body
            val bodyTop = nubH + stroke * 0.4f
            val bodyRect = RectF(stroke / 2f, bodyTop, w - stroke / 2f, h - stroke / 2f)

            // Dark inner track
            canvas.drawRoundRect(bodyRect, corner, corner, bodyTrack)
            // Sleek outline
            canvas.drawRoundRect(bodyRect, corner, corner, bodyOutline)

            // Inner liquid fill
            val padding = stroke * 1.3f
            val innerLeft = bodyRect.left + padding
            val innerRight = bodyRect.right - padding
            val innerTop = bodyRect.top + padding
            val innerBottom = bodyRect.bottom - padding
            val innerH = innerBottom - innerTop

            if (level > 0.005f) {
                fillPaint.alpha = (255 * blinkAlpha).toInt()
                val currentH = innerH * level
                val fillTop = innerBottom - currentH
                val fillRect = RectF(innerLeft, fillTop, innerRight, innerBottom)
                val fillCorner = corner * 0.6f
                canvas.drawRoundRect(fillRect, fillCorner, fillCorner, fillPaint)
            } else {
                // Empty battery: draw subtle exclamation mark
                exclamationPaint.alpha = (240 * blinkAlpha).toInt()
                exclamationPaint.textSize = w * 0.36f
                exclamationPaint.typeface = Typeface.DEFAULT_BOLD
                val textY = bodyRect.centerY() + (exclamationPaint.textSize * 0.35f)
                canvas.drawText("!", bodyRect.centerX(), textY, exclamationPaint)
            }
        }
    }

    // ---------- Strict Capital "A" Recognition ----------

    /**
     * Strictly recognizes a capital letter 'A'.
     * A true capital 'A' MUST consist of:
     * 1. Two angled legs meeting at a central apex at the top ('^' or '/' + '\').
     * 2. A STRICT, MANDATORY horizontal crossbar connecting the legs across the middle ('-').
     *
     * Random swipes, slide tests, curved arcs, or carets without a crossbar are strictly rejected.
     */
    private fun isCapitalA(strokes: List<List<PointF>>): Boolean {
        if (strokes.isEmpty() || strokes.size > 3) return false

        val screenH = resources.displayMetrics.heightPixels.toFloat()
        val screenW = resources.displayMetrics.widthPixels.toFloat()

        val allPoints = strokes.flatten()
        if (allPoints.size < 10) return false

        val minX = allPoints.minOf { it.x }
        val maxX = allPoints.maxOf { it.x }
        val minY = allPoints.minOf { it.y }
        val maxY = allPoints.maxOf { it.y }

        val totalW = maxX - minX
        val totalH = maxY - minY

        // Deliberate size requirement: reject tiny scratches, micro-jitters, or screen wipes
        if (totalH < screenH * 0.10f || totalW < screenW * 0.08f) return false

        // Aspect ratio: letter 'A' should not be an impossibly flat line or infinite needle
        val whRatio = totalW / totalH
        if (whRatio !in 0.22f..1.80f) return false

        // Case 1: Single continuous stroke (Start bottom-left -> Apex -> Right leg -> Crossbar)
        if (strokes.size == 1) {
            return isSingleStrokeCapitalA(strokes[0], minX, maxX, minY, maxY, totalW, totalH)
        }

        // Case 2: Multi-stroke (2 or 3 strokes) - strictly requires a dedicated crossbar stroke
        return isMultiStrokeCapitalA(strokes, minX, maxX, minY, maxY, totalW, totalH)
    }

    private fun isSingleStrokeCapitalA(
        stroke: List<PointF>,
        minX: Float,
        maxX: Float,
        minY: Float,
        maxY: Float,
        totalW: Float,
        totalH: Float
    ): Boolean {
        if (stroke.size < 14) return false

        // 1. Locate apex (highest point)
        var apexIdx = 0
        for (i in stroke.indices) {
            if (stroke[i].y < stroke[apexIdx].y) apexIdx = i
        }
        val apex = stroke[apexIdx]

        // Apex must occur in the ascending portion (15% to 70% of stroke)
        val apexFrac = apexIdx.toFloat() / stroke.size
        if (apexFrac !in 0.15f..0.70f) return false

        // Apex must be near the top
        if (apex.y - minY > totalH * 0.18f) return false

        // Apex X must be reasonably centered
        val apexXFrac = (apex.x - minX) / totalW
        if (apexXFrac !in 0.18f..0.82f) return false

        // 2. Start must be at the bottom
        val start = stroke.first()
        if (start.y - apex.y < totalH * 0.45f) return false

        // 3. Find lowest point of the right leg after the apex
        var rightFootIdx = apexIdx
        for (i in apexIdx until stroke.size) {
            if (stroke[i].y > stroke[rightFootIdx].y) rightFootIdx = i
        }
        val rightFoot = stroke[rightFootIdx]

        // Right foot must drop down towards the base
        if (rightFoot.y - apex.y < totalH * 0.45f) return false

        // Right foot must be well to the right of start
        if (rightFoot.x - start.x < totalW * 0.28f) return false

        // 4. MUST have remaining points forming the horizontal crossbar
        if (stroke.size - rightFootIdx < 3) return false

        val crossPoints = stroke.subList(rightFootIdx, stroke.size)
        val crossMinX = crossPoints.minOf { it.x }
        val crossMaxX = crossPoints.maxOf { it.x }
        val crossMinY = crossPoints.minOf { it.y }
        val crossMaxY = crossPoints.maxOf { it.y }

        val crossW = crossMaxX - crossMinX
        val crossH = crossMaxY - crossMinY
        val crossCenterY = (crossMinY + crossMaxY) / 2f

        // Crossbar vertical position must be in middle region (20% to 85% from top)
        val crossYFrac = (crossCenterY - minY) / totalH
        if (crossYFrac !in 0.20f..0.85f) return false

        // Crossbar must be predominantly horizontal and sufficiently wide
        if (crossW < totalW * 0.28f) return false
        if (crossW < crossH * 1.2f) return false

        return true
    }

    private fun isCrossbarStroke(
        stroke: List<PointF>,
        minX: Float,
        maxX: Float,
        minY: Float,
        maxY: Float,
        totalW: Float,
        totalH: Float
    ): Boolean {
        if (stroke.size < 3) return false
        val sMinX = stroke.minOf { it.x }
        val sMaxX = stroke.maxOf { it.x }
        val sMinY = stroke.minOf { it.y }
        val sMaxY = stroke.maxOf { it.y }

        val sW = sMaxX - sMinX
        val sH = sMaxY - sMinY
        val centerY = (sMinY + sMaxY) / 2f
        val yFrac = (centerY - minY) / totalH

        // Must be in the middle vertical band (20% to 85% from the top)
        if (yFrac !in 0.20f..0.85f) return false

        // Must be predominantly horizontal
        if (sW < sH * 1.4f && sH > totalH * 0.25f) return false

        // Must span horizontally across the letter
        if (sW < totalW * 0.26f) return false

        // Must lie between left and right bounds
        val centerX = (sMinX + sMaxX) / 2f
        val xFrac = (centerX - minX) / totalW
        if (xFrac !in 0.12f..0.88f) return false

        return true
    }

    private fun isInvertedVStroke(
        stroke: List<PointF>,
        minX: Float,
        maxX: Float,
        minY: Float,
        maxY: Float,
        totalW: Float,
        totalH: Float
    ): Boolean {
        if (stroke.size < 7) return false

        // Locate apex
        var apexIdx = 0
        for (i in stroke.indices) {
            if (stroke[i].y < stroke[apexIdx].y) apexIdx = i
        }
        val apex = stroke[apexIdx]

        val frac = apexIdx.toFloat() / stroke.size
        if (frac !in 0.15f..0.85f) return false

        // Apex near top
        if (apex.y - minY > totalH * 0.20f) return false

        // Both ends must drop down towards the base
        val startDrop = stroke.first().y - apex.y
        val endDrop = stroke.last().y - apex.y
        if (startDrop < totalH * 0.45f || endDrop < totalH * 0.45f) return false

        // Two feet must be horizontally separated
        val footDistX = Math.abs(stroke.last().x - stroke.first().x)
        if (footDistX < totalW * 0.30f) return false

        // Apex X should be between the two feet
        val leftX = Math.min(stroke.first().x, stroke.last().x)
        val rightX = Math.max(stroke.first().x, stroke.last().x)
        if (apex.x < leftX - totalW * 0.18f || apex.x > rightX + totalW * 0.18f) return false

        return true
    }

    private fun areTwoLegStrokes(
        leg1: List<PointF>,
        leg2: List<PointF>,
        minX: Float,
        maxX: Float,
        minY: Float,
        maxY: Float,
        totalW: Float,
        totalH: Float
    ): Boolean {
        if (leg1.size < 4 || leg2.size < 4) return false

        val h1 = leg1.maxOf { it.y } - leg1.minOf { it.y }
        val h2 = leg2.maxOf { it.y } - leg2.minOf { it.y }

        if (h1 < totalH * 0.45f || h2 < totalH * 0.45f) return false

        val top1 = leg1.minByOrNull { it.y }!!
        val top2 = leg2.minByOrNull { it.y }!!
        val bot1 = leg1.maxByOrNull { it.y }!!
        val bot2 = leg2.maxByOrNull { it.y }!!

        // Top points meet near apex
        val topDist = Math.hypot((top1.x - top2.x).toDouble(), (top1.y - top2.y).toDouble()).toFloat()
        if (topDist > totalH * 0.38f) return false

        // Bottom points are separated
        val botDistX = Math.abs(bot1.x - bot2.x)
        if (botDistX < totalW * 0.30f) return false

        return true
    }

    private fun isMultiStrokeCapitalA(
        strokes: List<List<PointF>>,
        minX: Float,
        maxX: Float,
        minY: Float,
        maxY: Float,
        totalW: Float,
        totalH: Float
    ): Boolean {
        // Step 1: Find a stroke that qualifies as the horizontal crossbar
        var crossbarStroke: List<PointF>? = null
        val remainingStrokes = mutableListOf<List<PointF>>()

        for (st in strokes) {
            if (crossbarStroke == null && isCrossbarStroke(st, minX, maxX, minY, maxY, totalW, totalH)) {
                crossbarStroke = st
            } else {
                remainingStrokes.add(st)
            }
        }

        // STRICT: If no valid horizontal crossbar was found, it CANNOT be a capital 'A'!
        if (crossbarStroke == null) return false

        // 2 strokes total: 1 inverted V ('^') + 1 crossbar ('-')
        if (remainingStrokes.size == 1) {
            return isInvertedVStroke(remainingStrokes[0], minX, maxX, minY, maxY, totalW, totalH)
        }

        // 3 strokes total: 2 meeting legs ('/' + '\') + 1 crossbar ('-')
        if (remainingStrokes.size == 2) {
            return areTwoLegStrokes(remainingStrokes[0], remainingStrokes[1], minX, maxX, minY, maxY, totalW, totalH)
        }

        return false
    }

    private fun onPatternRecognized() {
        currentStage = Stage.UNLOCKED
        vibrateDevice(longArrayOf(0, 50, 80, 50))
        feedbackText?.apply {
            text = "✓ Unlocked"
            visibility = View.VISIBLE
        }
        handler.postDelayed({ onUnlocked() }, 400)
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
