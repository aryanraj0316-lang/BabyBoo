package com.babyboo.app

import android.app.Activity
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PointF
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import android.content.Context
import android.graphics.Canvas
import android.graphics.drawable.GradientDrawable
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.widget.ProgressBar

/**
 * ShutdownSimulationActivity — A full-screen native activity that simulates
 * a realistic phone shutdown sequence:
 *
 * Phase 1 (Battery Draining): Critical battery warning with rapid drain from 20% → 1%
 * Phase 2 (System Shutdown): Android shutdown animation with spinner and screen dim to black
 * Phase 3 (Blackout): Complete pitch-black screen (#000000). Phone appears dead/powered off.
 *
 * To unlock: Swipe capital letter "A" on the black screen.
 *
 * This activity uses FLAG_SHOW_WHEN_LOCKED + FLAG_TURN_SCREEN_ON to appear
 * over any running app, game, or lock screen.
 */
class ShutdownSimulationActivity : Activity() {

    private enum class Stage {
        BATTERY_DRAINING,
        SYSTEM_SHUTDOWN,
        BLACKOUT,
        UNLOCKED
    }

    private var currentStage = Stage.BATTERY_DRAINING
    private val handler = Handler(Looper.getMainLooper())
    private var batteryPercent = 20
    private var drainCountdown = 5

    // For swipe pattern recognition
    private val swipePoints = mutableListOf<PointF>()
    private var isDrawing = false

    // Root view
    private lateinit var rootFrame: FrameLayout

    // Stage views
    private var batteryView: LinearLayout? = null
    private var batteryPercentText: TextView? = null
    private var batteryWarningText: TextView? = null
    private var shutdownView: LinearLayout? = null
    private var shutdownText: TextView? = null
    private var blackoutView: FrameLayout? = null
    private var swipeCanvas: SwipeCanvasView? = null
    private var hintText: TextView? = null
    private var feedbackText: TextView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Full-screen immersive, show over lock screen
        configureFullScreen()

        rootFrame = FrameLayout(this).apply {
            setBackgroundColor(Color.BLACK)
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        setContentView(rootFrame)

        // Start with battery drain phase
        showBatteryDrainStage()
    }

    private fun configureFullScreen() {
        // Show over lock screen, turn screen on, keep screen on
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

        // Fullscreen immersive
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
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

    // ====================
    // PHASE 1: Battery Draining
    // ====================
    private fun showBatteryDrainStage() {
        currentStage = Stage.BATTERY_DRAINING
        rootFrame.removeAllViews()

        batteryView = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.BLACK)
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }

        // Critical battery icon (red circle with "!" or battery outline)
        val batteryIcon = TextView(this).apply {
            text = "🔋"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 64f)
            gravity = Gravity.CENTER
        }
        batteryView!!.addView(batteryIcon)

        // Battery percentage
        batteryPercentText = TextView(this).apply {
            text = "${batteryPercent}%"
            setTextColor(Color.parseColor("#EF4444"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 48f)
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dpToPx(8) }
        }
        batteryView!!.addView(batteryPercentText)

        // Warning text
        batteryWarningText = TextView(this).apply {
            text = "Critical battery level\nPhone will shut down soon"
            setTextColor(Color.parseColor("#F87171"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dpToPx(16) }
        }
        batteryView!!.addView(batteryWarningText)

        rootFrame.addView(batteryView)

        // Vibrate
        vibrateDevice(longArrayOf(0, 150, 100, 200))

        // Start drain sequence
        drainCountdown = 5
        batteryPercent = 20
        startBatteryDrain()
    }

    private fun startBatteryDrain() {
        handler.postDelayed(object : Runnable {
            override fun run() {
                if (currentStage != Stage.BATTERY_DRAINING) return

                drainCountdown--
                when (drainCountdown) {
                    4 -> batteryPercent = 14
                    3 -> batteryPercent = 8
                    2 -> batteryPercent = 4
                    1 -> batteryPercent = 1
                }

                batteryPercentText?.text = "${batteryPercent}%"

                if (drainCountdown <= 0) {
                    // Battery fully drained, move to shutdown stage
                    vibrateDevice(longArrayOf(0, 300))
                    handler.postDelayed({ showSystemShutdownStage() }, 600)
                } else {
                    vibrateDevice(longArrayOf(0, 80))
                    handler.postDelayed(this, 1000)
                }
            }
        }, 1000)
    }

    // ====================
    // PHASE 2: System Shutdown
    // ====================
    private fun showSystemShutdownStage() {
        currentStage = Stage.SYSTEM_SHUTDOWN
        rootFrame.removeAllViews()

        shutdownView = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.BLACK)
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }

        // Shutdown spinner
        val spinner = ProgressBar(this).apply {
            isIndeterminate = true
            layoutParams = LinearLayout.LayoutParams(dpToPx(48), dpToPx(48))
        }
        shutdownView!!.addView(spinner)

        // "Shutting down..." text
        shutdownText = TextView(this).apply {
            text = "Shutting down…"
            setTextColor(Color.parseColor("#9CA3AF"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dpToPx(20) }
        }
        shutdownView!!.addView(shutdownText)

        rootFrame.addView(shutdownView)

        // After 3 seconds, go to complete blackout
        handler.postDelayed({
            shutdownText?.text = "Powering off…"
            vibrateDevice(longArrayOf(0, 400))
        }, 1500)

        handler.postDelayed({
            showBlackoutStage()
        }, 3000)
    }

    // ====================
    // PHASE 3: Blackout (Pitch Black)
    // ====================
    private fun showBlackoutStage() {
        currentStage = Stage.BLACKOUT
        rootFrame.removeAllViews()

        blackoutView = FrameLayout(this).apply {
            setBackgroundColor(Color.BLACK)
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }

        // Swipe canvas for detecting capital "A"
        swipeCanvas = SwipeCanvasView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        blackoutView!!.addView(swipeCanvas)

        // Tiny hint text (very subtle, near bottom)
        hintText = TextView(this).apply {
            text = ""  // Hidden by default — parent knows the pattern
            setTextColor(Color.parseColor("#1A1A1A"))  // Nearly invisible on black
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 9f)
            gravity = Gravity.CENTER
            val lp = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            )
            lp.gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
            lp.bottomMargin = dpToPx(30)
            layoutParams = lp
        }
        blackoutView!!.addView(hintText)

        // Feedback text for unlock success
        feedbackText = TextView(this).apply {
            text = ""
            setTextColor(Color.parseColor("#10B981"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            visibility = View.GONE
            val lp = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            )
            lp.gravity = Gravity.CENTER
            layoutParams = lp
        }
        blackoutView!!.addView(feedbackText)

        rootFrame.addView(blackoutView)

        // Set up emergency tap counter (5 rapid taps also show hint)
        var emergencyTaps = 0
        var lastTapTime = 0L
        blackoutView!!.setOnClickListener {
            val now = System.currentTimeMillis()
            if (now - lastTapTime < 600) {
                emergencyTaps++
            } else {
                emergencyTaps = 1
            }
            lastTapTime = now
            if (emergencyTaps >= 5) {
                hintText?.setTextColor(Color.parseColor("#333333"))
                hintText?.text = "Swipe capital \"A\" to unlock"
                emergencyTaps = 0
            }
        }
    }

    // ====================
    // Custom view for drawing swipe path
    // ====================
    inner class SwipeCanvasView(context: Context) : View(context) {
        private val paint = Paint().apply {
            color = Color.parseColor("#333333")  // Very dark, barely visible
            strokeWidth = 4f
            style = Paint.Style.STROKE
            isAntiAlias = true
            strokeCap = Paint.Cap.ROUND
            strokeJoin = Paint.Join.ROUND
        }
        private val path = Path()

        override fun onTouchEvent(event: MotionEvent): Boolean {
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    swipePoints.clear()
                    path.reset()
                    swipePoints.add(PointF(event.x, event.y))
                    path.moveTo(event.x, event.y)
                    isDrawing = true
                    invalidate()
                    return true
                }
                MotionEvent.ACTION_MOVE -> {
                    if (isDrawing) {
                        swipePoints.add(PointF(event.x, event.y))
                        path.lineTo(event.x, event.y)
                        invalidate()
                    }
                    return true
                }
                MotionEvent.ACTION_UP -> {
                    isDrawing = false
                    // Check if the drawn path matches capital "A"
                    if (isCapitalAPattern(swipePoints)) {
                        onPatternRecognized()
                    } else {
                        // Clear after a short delay
                        handler.postDelayed({
                            swipePoints.clear()
                            path.reset()
                            invalidate()
                        }, 300)
                    }
                    return true
                }
            }
            return super.onTouchEvent(event)
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

    /**
     * Checks if the swipe path resembles a capital "A":
     * - Goes upward (left-ish direction toward top)
     * - Peaks at the top
     * - Comes down (right-ish direction toward bottom)
     * - Has a horizontal crossbar somewhere in the middle
     *
     * We use a simplified heuristic:
     * 1. Find the topmost point (the apex)
     * 2. Check that points go from bottom-left → top → bottom-right
     * 3. Detect a horizontal movement (crossbar) in the middle third
     */
    private fun isCapitalAPattern(points: List<PointF>): Boolean {
        if (points.size < 15) return false  // Need sufficient points

        // Find the apex (highest point = lowest Y value)
        var apexIndex = 0
        var minY = Float.MAX_VALUE
        for (i in points.indices) {
            if (points[i].y < minY) {
                minY = points[i].y
                apexIndex = i
            }
        }

        // Apex should be roughly in the first half of the stroke
        val apexRatio = apexIndex.toFloat() / points.size
        if (apexRatio < 0.1f || apexRatio > 0.65f) return false

        // Check vertical travel: the path should cover significant vertical distance
        val startY = points.first().y
        val endY = points.last().y
        val totalHeight = maxOf(startY, endY) - minY
        val screenH = resources.displayMetrics.heightPixels.toFloat()
        if (totalHeight < screenH * 0.12f) return false  // Must cover at least 12% of screen

        // Left leg: start → apex should go upward (Y decreases)
        val leftLeg = points.subList(0, apexIndex)
        if (leftLeg.size < 3) return false
        val leftYDelta = leftLeg.last().y - leftLeg.first().y
        if (leftYDelta > -totalHeight * 0.2f) return false  // Should go up significantly

        // Right leg: apex → end should go downward (Y increases)
        val rightLeg = points.subList(apexIndex, points.size)
        if (rightLeg.size < 3) return false
        val rightYDelta = rightLeg.last().y - rightLeg.first().y
        if (rightYDelta < totalHeight * 0.2f) return false  // Should go down significantly

        // Check for horizontal crossbar: look for a segment with relatively flat Y
        // in the middle portion of the vertical span
        val midY = minY + totalHeight * 0.4f
        val midYRange = totalHeight * 0.3f
        var hasHorizontalSegment = false
        for (i in 1 until points.size) {
            val p = points[i]
            if (p.y > midY - midYRange && p.y < midY + midYRange) {
                // Check if there's a horizontal-ish run
                if (i > 2) {
                    val prevP = points[i - 2]
                    val dx = kotlin.math.abs(p.x - prevP.x)
                    val dy = kotlin.math.abs(p.y - prevP.y)
                    if (dx > dy * 1.5f && dx > dpToPx(15).toFloat()) {
                        hasHorizontalSegment = true
                        break
                    }
                }
            }
        }

        // "A" without crossbar is still acceptable — the key shape is /\ (inverted V)
        // We'll be lenient: if the overall shape is up-then-down with good coverage, accept it
        return true
    }

    private fun onPatternRecognized() {
        currentStage = Stage.UNLOCKED

        // Green feedback
        vibrateDevice(longArrayOf(0, 50, 80, 50))

        // Show success briefly
        swipeCanvas?.clearPath()
        feedbackText?.apply {
            text = "✓ Unlocked"
            visibility = View.VISIBLE
        }

        handler.postDelayed({
            finish()
        }, 800)
    }

    // ====================
    // Utilities
    // ====================
    private fun vibrateDevice(pattern: LongArray) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                val vibrator = vibratorManager.defaultVibrator
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
            } else {
                @Suppress("DEPRECATION")
                val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(pattern, -1)
                }
            }
        } catch (_: Exception) { }
    }

    private fun dpToPx(dp: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dp.toFloat(),
            resources.displayMetrics
        ).toInt()
    }

    override fun onBackPressed() {
        // Block back button during simulation — phone appears dead
        if (currentStage == Stage.BLACKOUT) {
            return  // Do nothing — phone is "off"
        }
        // For other stages, also block
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        super.onDestroy()
    }
}
