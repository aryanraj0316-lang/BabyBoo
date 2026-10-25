# BabyBoo Google Play Declarations & Manifest Hygiene Guide

This document specifies the exact answers and declarations required for the remaining Google Play policy sections in the Google Play Console.

---

## 1. Foreground Service Declaration (FOREGROUND_SERVICE_SPECIAL_USE)

### Service Class: `com.babyboo.app.ScreenTimeBackgroundService`
- **Foreground Service Type:** `specialUse`
- **Property Value:** `Screen time countdown timer for child device handover`
- **Play Console Justification:**
> "BabyBoo runs an active countdown timer with a persistent notification to enforce parent-set screen-time limits and trigger the handover screen when time expires."
- **Why Background Execution is Required:**
> "The parent initiates a screen-time boundary (e.g., 15 minutes) and hands the device to their child to use other apps (like YouTube Kids, learning games, or e-books). The timer must continue counting down accurately while the child interacts with third-party applications in the foreground, ensuring the blackout handover screen triggers precisely when the allotted time concludes."

---

## 2. Data Safety Declaration

### Key Facts:
- **Data Collected:** None. (0 categories collected).
- **Data Shared:** None. (0 categories shared with third parties).
- **On-Device Only:** All timer configurations, parent PIN hashes, and usage history logs reside strictly in local SQLite/SharedPreferences storage on the device.
- **Network Transmission:** Zero user data or telemetry transmitted.
- **Account Creation:** Optional/Local. No compulsory cloud authentication.

### Play Console Data Safety Form Responses:
1. **Does your app collect or share any of the required user data types?**  
   $\rightarrow$ **No**
2. **Is all the user data collected by your app encrypted in transit?**  
   $\rightarrow$ **Yes** (Any network requests, such as OTA update checks, use HTTPS/TLS).
3. **Do you provide a way for users to request that their data is deleted?**  
   $\rightarrow$ **Yes** (Users can reset all settings or clear app storage in-app or via Android system settings).

---

## 3. Families & Target Audience Policy

- **Target Age Group:** Children under 13 (parent-supervised handover).
- **Primary Audience:** Parents and Guardians (Parental Control / Digital Wellbeing).
- **COPPA Compliance:** Fully compliant. The app collects zero personally identifiable information (PII) from children, contains no behavioral tracking or third-party ad SDKs.
- **Neutral Age Screen / Parent Gate:** Parent features (changing timers, modifying PIN, accessing settings) are guarded by a parent PIN challenge.

---

## 4. Manifest Hygiene Verification

Audit of permissions defined in `android/app/src/main/AndroidManifest.xml`:
- `android.permission.FOREGROUND_SERVICE` — Required for timer background service.
- `android.permission.FOREGROUND_SERVICE_SPECIAL_USE` — Explicitly declared with `PROPERTY_SPECIAL_USE_FGS_SUBTYPE`.
- `android.permission.SYSTEM_ALERT_WINDOW` — Fallback overlay for devices where accessibility is declined.
- `android.permission.POST_NOTIFICATIONS` — Required on Android 13+ to show persistent timer countdown notification.
- `android.permission.RECEIVE_BOOT_COMPLETED` — Restores active timer session if device rebooted mid-session.
- `android.permission.VIBRATE` — Tactile tick on touch during handover.
- `android.permission.WAKE_LOCK` — Brief wake signal when battery flash displays.
- `android.permission.READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` — Capped strictly at `android:maxSdkVersion="32"` via `tools:replace="android:maxSdkVersion"`.
- **Zero prohibited permissions:** No `USE_FULL_SCREEN_INTENT`, no `SYSTEM_OVERLAY_WINDOW`, no location, camera, audio recording, or contact permissions.
