package com.babyboo.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews

/**
 * BabyBooWidgetProvider — The home screen widget.
 *
 * Behavior:
 * - Collapsed state: Shows a small compact 1×1 icon.
 * - When idle: Shows "BabyBoo" badge.
 * - When active (timer selected): Shows the live countdown directly on the widget (e.g. 02:00, 01:59).
 * - When tapped: Launches WidgetPopupActivity (floating popup with timer options)
 *   directly over the home screen — NO app opening, no deep link routing.
 */
class BabyBooWidgetProvider : AppWidgetProvider() {

    companion object {
        const val PREFS_NAME = "babyboo_widget_prefs"
        const val KEY_TIMER_END_AT = "timer_end_at"
        const val KEY_TIMER_ACTIVE = "timer_active"

        fun updateAllWidgets(context: Context, remainingSeconds: Int = -1) {
            val appWidgetManager = AppWidgetManager.getInstance(context) ?: return
            val component = ComponentName(context, BabyBooWidgetProvider::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(component) ?: return
            for (id in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, id, remainingSeconds)
            }
        }

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int,
            explicitRemaining: Int = -1
        ) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isActive = prefs.getBoolean(KEY_TIMER_ACTIVE, false)
            val endAt = prefs.getLong(KEY_TIMER_END_AT, 0L)
            val now = System.currentTimeMillis()

            val views = RemoteViews(context.packageName, R.layout.babyboo_widget_layout)

            // Always show collapsed view (compact 1x1 icon)
            views.setViewVisibility(R.id.widget_collapsed_view, View.VISIBLE)
            views.setViewVisibility(R.id.widget_expanded_view, View.GONE)

            val remaining = if (explicitRemaining >= 0) {
                explicitRemaining
            } else if (isActive && endAt > now) {
                ((endAt - now) / 1000).toInt()
            } else {
                0
            }

            if (isActive && remaining > 0) {
                // Show live ticking chronometer on home screen
                views.setViewVisibility(R.id.widget_collapsed_badge, View.GONE)
                views.setViewVisibility(R.id.widget_countdown_badge, View.GONE)
                views.setViewVisibility(R.id.widget_chronometer, View.VISIBLE)

                val remainingMillis = if (endAt > now) (endAt - now) else (remaining * 1000L)
                val baseTime = android.os.SystemClock.elapsedRealtime() + remainingMillis
                views.setChronometer(R.id.widget_chronometer, baseTime, "%s", true)
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                    views.setChronometerCountDown(R.id.widget_chronometer, true)
                }
            } else {
                // Show idle badge, hide countdown chronometer
                views.setViewVisibility(R.id.widget_chronometer, View.GONE)
                views.setViewVisibility(R.id.widget_countdown_badge, View.GONE)
                views.setViewVisibility(R.id.widget_collapsed_badge, View.VISIBLE)
                views.setTextViewText(R.id.widget_collapsed_badge, "BabyBoo")
            }

            // Tapping the widget icon launches the WidgetPopupActivity (floating popup)
            val popupIntent = Intent(context, WidgetPopupActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
            }
            val popupPendingIntent = PendingIntent.getActivity(
                context,
                appWidgetId,
                popupIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_collapsed_view, popupPendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        updateAllWidgets(context)
    }
}
