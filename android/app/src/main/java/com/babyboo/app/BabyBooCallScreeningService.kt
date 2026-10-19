package com.babyboo.app

import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import androidx.annotation.RequiresApi

/**
 * BabyBooCallScreeningService — Silently rejects incoming calls while the blackout simulation is active.
 */
@RequiresApi(Build.VERSION_CODES.N)
class BabyBooCallScreeningService : CallScreeningService() {

    companion object {
        fun isRoleHeld(context: Context): Boolean {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val roleManager = context.getSystemService(RoleManager::class.java)
                return roleManager?.isRoleHeld(RoleManager.ROLE_CALL_SCREENING) ?: false
            }
            return true
        }

        fun requestRoleIntent(context: Context): Intent? {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val roleManager = context.getSystemService(RoleManager::class.java)
                if (roleManager != null && roleManager.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING)) {
                    return roleManager.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING)
                }
            }
            return null
        }
    }

    override fun onScreenCall(callDetails: Call.Details) {
        if (SimulationController.isActive()) {
            val response = CallResponse.Builder()
                .setDisallowCall(true)
                .setRejectCall(true)
                .setSkipNotification(true)
                .setSkipCallLog(false)
                .build()
            respondToCall(callDetails, response)
        } else {
            val response = CallResponse.Builder()
                .setDisallowCall(false)
                .setRejectCall(false)
                .setSkipNotification(false)
                .build()
            respondToCall(callDetails, response)
        }
    }
}
