package com.babyboo.app

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.text.SpannableString
import android.text.Spanned
import android.text.method.LinkMovementMethod
import android.text.style.ClickableSpan
import android.text.style.ForegroundColorSpan
import android.text.style.UnderlineSpan
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

/**
 * Prominent In-App Disclosure for Google Play Accessibility Policy compliance.
 * Shown BEFORE the user is directed to Android Accessibility Settings.
 */
class AccessibilityDisclosureActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Root container with dark/translucent scrim
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#990F172A")) // Slate scrim
            setPadding(dp(20), dp(20), dp(20), dp(20))
        }

        val scroll = ScrollView(this).apply {
            isFillViewport = true
        }

        // Dialog Card Container
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(24), dp(28), dp(24), dp(24))

            val cardBg = GradientDrawable().apply {
                setColor(Color.parseColor("#FFFFFF"))
                cornerRadius = dp(24).toFloat()
            }
            background = cardBg
            elevation = dp(12).toFloat()
        }

        // Shield/Privacy Icon Badge
        val iconBadge = TextView(this).apply {
            text = "🛡️"
            textSize = 36f
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(12))
        }
        card.addView(iconBadge)

        // Prominent Title
        // Prominent Title
        val titleView = TextView(this).apply {
            text = "BabyBoo uses Android's Accessibility Service"
            textSize = 20f
            setTypeface(typeface, Typeface.BOLD)
            setTextColor(Color.parseColor("#0F172A"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(14))
        }
        card.addView(titleView)

        // Exact Section 3 verbatim disclosure copy
        val bodyText = "BabyBoo draws a black layer over the whole screen, above the status bar, so the phone looks completely dead. Without it, a swipe from the top would reveal the clock and battery and break the illusion.\n\n" +
            "• What BabyBoo does with it: draws that overlay. That's it.\n" +
            "• What it does NOT do: it does not read your screen, and it does not collect or share any data.\n\n" +
            "You can turn it off any time in Settings → Accessibility. [Learn more]"
        val spannable = SpannableString(bodyText)

        val learnMoreStart = bodyText.indexOf("[Learn more]")
        if (learnMoreStart != -1) {
            val learnMoreEnd = learnMoreStart + "[Learn more]".length
            val clickableSpan = object : ClickableSpan() {
                override fun onClick(widget: View) {
                    try {
                        val browserIntent = Intent(
                            Intent.ACTION_VIEW,
                            Uri.parse("https://babyboo.app/accessibility")
                        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        startActivity(browserIntent)
                    } catch (_: Exception) {}
                }
            }
            spannable.setSpan(clickableSpan, learnMoreStart, learnMoreEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            spannable.setSpan(ForegroundColorSpan(Color.parseColor("#4F46E5")), learnMoreStart, learnMoreEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            spannable.setSpan(UnderlineSpan(), learnMoreStart, learnMoreEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        }

        val bodyView = TextView(this).apply {
            text = spannable
            textSize = 14f
            setTextColor(Color.parseColor("#334155"))
            setLineSpacing(dp(3).toFloat(), 1.05f)
            gravity = Gravity.START
            movementMethod = LinkMovementMethod.getInstance()
            setPadding(0, 0, 0, dp(20))
        }
        card.addView(bodyView)

        // "Agree & Continue" primary affirmative consent button
        val enableButton = Button(this).apply {
            text = "Agree & Continue"
            textSize = 16f
            setTextColor(Color.WHITE)
            setTypeface(typeface, Typeface.BOLD)
            val btnBg = GradientDrawable().apply {
                setColor(Color.parseColor("#4F46E5"))
                cornerRadius = dp(14).toFloat()
            }
            background = btnBg
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(52)
            ).apply {
                setMargins(0, 0, 0, dp(12))
            }
            setOnClickListener {
                getSharedPreferences("babyboo_a11y_prefs", Context.MODE_PRIVATE)
                    .edit()
                    .putBoolean("has_consented_a11y_disclosure", true)
                    .apply()
                try {
                    val settingsIntent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    startActivity(settingsIntent)
                } catch (e: Exception) {
                    val appSettings = Intent(Settings.ACTION_SETTINGS).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    startActivity(appSettings)
                }
                finish()
            }
        }
        card.addView(enableButton)

        // "Not now" secondary button
        val notNowButton = Button(this).apply {
            text = "Not now"
            textSize = 15f
            setTextColor(Color.parseColor("#64748B"))
            val btnBg = GradientDrawable().apply {
                setColor(Color.parseColor("#F1F5F9"))
                cornerRadius = dp(14).toFloat()
            }
            background = btnBg
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(48)
            )
            setOnClickListener {
                finish()
            }
        }
        card.addView(notNowButton)

        val isSideloaded = !WidgetPopupActivity.isInstalledFromPlayStore(this)
        if (isSideloaded && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            val helpNote = TextView(this).apply {
                text = "💡 Direct Download: If switch is greyed out, tap here to open App Info → tap ⋮ (top right) → Allow restricted settings."
                textSize = 12f
                setTextColor(Color.parseColor("#4338CA"))
                gravity = Gravity.CENTER
                setPadding(0, dp(14), 0, 0)
                setOnClickListener {
                    WidgetPopupActivity.openAppInfoSettings(this@AccessibilityDisclosureActivity)
                }
            }
            card.addView(helpNote)
        }

        scroll.addView(card)
        root.addView(scroll)
        setContentView(root)
    }

    private fun dp(value: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            value.toFloat(),
            resources.displayMetrics
        ).toInt()
    }
}
