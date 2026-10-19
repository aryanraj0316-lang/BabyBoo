package com.babyboo.app

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.ComponentName
import android.content.Context
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent

/**
 * BlackoutAccessibilityService — provides TYPE_ACCESSIBILITY_OVERLAY capability so that
 * the blackout overlay covers the entire panel including system status and navigation bars.
 */
class BlackoutAccessibilityService : AccessibilityService() {

    companion object {
        @Volatile
        var instance: BlackoutAccessibilityService? = null
            private set

        @Volatile
        private var running: Boolean = false

        fun isRunning(): Boolean = running && instance != null

        fun isEnabled(context: Context): Boolean {
            val expectedComponentName = ComponentName(context, BlackoutAccessibilityService::class.java).flattenToString()
            val enabledServices = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return false
            return enabledServices.split(':').any {
                it.equals(expectedComponentName, ignoreCase = true) ||
                it.contains(context.packageName + "/" + BlackoutAccessibilityService::class.java.name)
            }
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        running = true
        try {
            serviceInfo = (serviceInfo ?: AccessibilityServiceInfo()).apply {
                flags = flags or AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
            }
        } catch (_: Exception) { }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // no-op
    }

    override fun onInterrupt() {
        // no-op
    }

    override fun onDestroy() {
        running = false
        if (instance === this) {
            instance = null
        }
        super.onDestroy()
    }
}
