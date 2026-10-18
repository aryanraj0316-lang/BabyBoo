package expo.modules.handovernative

import android.app.NotificationManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class HandoverNativeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("HandoverNative")

    Events("onHandoverStateChange")

    AsyncFunction("helloWorld") {
      "HandoverNative Android Engine Ready"
    }

    AsyncFunction("getState") {
      val context = appContext.reactContext ?: return@AsyncFunction mapOf(
        "status" to "IDLE",
        "endAt" to 0L,
        "graceEndAt" to 0L
      )
      val prefs = context.getSharedPreferences("babyboo_widget_prefs", Context.MODE_PRIVATE)
      val isActive = prefs.getBoolean("timer_active", false)
      val endAt = prefs.getLong("timer_end_at", 0L)
      if (isActive && endAt > System.currentTimeMillis()) {
        mapOf(
          "status" to "ACTIVE",
          "endAt" to endAt,
          "graceEndAt" to 0L
        )
      } else {
        mapOf(
          "status" to "IDLE",
          "endAt" to 0L,
          "graceEndAt" to 0L
        )
      }
    }

    AsyncFunction("startSession") { config: Map<String, Any?> ->
      val context = appContext.reactContext ?: return@AsyncFunction mapOf(
        "status" to "IDLE",
        "endAt" to 0L,
        "graceEndAt" to 0L
      )
      val minutes = ((config["durationMinutes"] ?: config["minutes"]) as? Number)?.toInt() ?: 0
      if (minutes > 0) {
        val serviceIntent = Intent().apply {
          component = ComponentName(context.packageName, "com.babyboo.app.ScreenTimeBackgroundService")
          action = "com.babyboo.app.ACTION_START_TIMER"
          putExtra("extra_minutes", minutes)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          context.startForegroundService(serviceIntent)
        } else {
          context.startService(serviceIntent)
        }
        val endAt = System.currentTimeMillis() + (minutes * 60 * 1000L)
        mapOf(
          "status" to "ACTIVE",
          "endAt" to endAt,
          "graceEndAt" to 0L
        )
      } else {
        mapOf(
          "status" to "IDLE",
          "endAt" to 0L,
          "graceEndAt" to 0L
        )
      }
    }

    AsyncFunction("cancelSession") {
      val context = appContext.reactContext ?: return@AsyncFunction mapOf(
        "status" to "IDLE",
        "endAt" to 0L,
        "graceEndAt" to 0L
      )
      val serviceIntent = Intent().apply {
        component = ComponentName(context.packageName, "com.babyboo.app.ScreenTimeBackgroundService")
        action = "com.babyboo.app.ACTION_CANCEL_TIMER"
      }
      context.startService(serviceIntent)
      mapOf(
        "status" to "IDLE",
        "endAt" to 0L,
        "graceEndAt" to 0L
      )
    }

    AsyncFunction("setPin") { pin: String ->
      false
    }

    AsyncFunction("verifyPin") { pin: String ->
      false
    }

    AsyncFunction("getPermissionStatus") {
      val context = appContext.reactContext
      if (context == null) {
        mapOf(
          "overlayGranted" to false,
          "notificationsGranted" to false,
          "exactAlarmsGranted" to false,
          "batteryOptimizationIgnored" to false
        )
      } else {
        val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val nm = context.getSystemService(NotificationManager::class.java)
        mapOf(
          "overlayGranted" to Settings.canDrawOverlays(context),
          "notificationsGranted" to (nm?.areNotificationsEnabled() ?: false),
          "exactAlarmsGranted" to true,
          "batteryOptimizationIgnored" to pm.isIgnoringBatteryOptimizations(context.packageName)
        )
      }
    }

    AsyncFunction("openPermissionSettings") { permissionType: String ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val pkgUri = Uri.parse("package:${context.packageName}")
      val intent = when (permissionType) {
        "overlay" -> Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, pkgUri)
        "notifications" -> Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
          .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        "battery" -> Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
        else -> Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkgUri)
      }.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      try {
        context.startActivity(intent)
      } catch (_: Exception) {
        context.startActivity(
          Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkgUri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
      }
    }

    // Widget Timer Options Management
    AsyncFunction("setWidgetOptionsCsv") { optionsCsv: String ->
      val context = appContext.reactContext ?: return@AsyncFunction false
      val prefs = context.getSharedPreferences("babyboo_widget_prefs", Context.MODE_PRIVATE)
      prefs.edit().putString("babyboo_widget_timer_options", optionsCsv).commit()
      try {
        val updateIntent = Intent("android.appwidget.action.APPWIDGET_UPDATE").apply {
          setPackage(context.packageName)
        }
        context.sendBroadcast(updateIntent)
      } catch (_: Exception) {}
      true
    }

    // NOTE: must be List<Double>, not List<Number> — Expo has no converter for Number and the
    // whole module then fails to load (JS silently falls back to its mock).
    AsyncFunction("setWidgetOptions") { options: List<Double> ->
      val context = appContext.reactContext ?: return@AsyncFunction false
      val intList = options.map { Math.round(it).toInt() }.filter { it > 0 }
      val prefs = context.getSharedPreferences("babyboo_widget_prefs", Context.MODE_PRIVATE)
      prefs.edit().putString("babyboo_widget_timer_options", intList.joinToString(",")).commit()
      try {
        val updateIntent = Intent("android.appwidget.action.APPWIDGET_UPDATE").apply {
          setPackage(context.packageName)
        }
        context.sendBroadcast(updateIntent)
      } catch (_: Exception) {}
      true
    }

    AsyncFunction("getWidgetOptions") {
      val context = appContext.reactContext ?: return@AsyncFunction listOf(15, 30, 45, 60)
      val prefs = context.getSharedPreferences("babyboo_widget_prefs", Context.MODE_PRIVATE)
      val optionsStr = prefs.getString("babyboo_widget_timer_options", null)
      if (optionsStr != null && optionsStr.isNotBlank()) {
        try {
          val parsed = optionsStr.split(",").mapNotNull { it.trim().toIntOrNull() }.filter { it > 0 }
          if (parsed.isNotEmpty()) parsed else listOf(15, 30, 45, 60)
        } catch (_: Exception) {
          listOf(15, 30, 45, 60)
        }
      } else {
        listOf(15, 30, 45, 60)
      }
    }
  }
}
