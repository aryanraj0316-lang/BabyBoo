# BabyBoo — Google Play Store Release Notes & Log

## Phase 0: Baseline & Reconnaissance

- **Date / Timestamp:** 2026-10-19
- **Baseline Build Status:** GREEN (`.\gradlew.bat :app:assembleDebug` completed with exit code 0)

### 1. Detected Framework & Architecture
- **Framework:** React Native (`0.88.0-rc.4`) + Expo (`~58.0.9`) with Bare Android project workflow (`android/` directory).
- **JS Engine:** Hermes (configured in `android/gradle.properties`: `hermesEnabled=true`).
- **Architecture:** React Native New Architecture enabled (`newArchEnabled=true`), edge-to-edge support enabled.
- **Native Android Core:** Custom Kotlin services and activities under `com.babyboo.app` located at `android/app/src/main/java/com/babyboo/app/`.

### 2. Baseline Configuration Inventory

| Property | Current Value | Source Location |
| :--- | :--- | :--- |
| **`applicationId`** | `com.babyboo.app` | `android/app/build.gradle` (L92) |
| **`versionCode`** | `1` | `android/app/build.gradle` (L95) |
| **`versionName`** | `"1.0.0"` | `android/app/build.gradle` (L96) |
| **`compileSdk`** | `37` (Configured: 37, Gradle property default: 37) | `android/gradle.properties` (L65), `android/build.gradle` (L7) |
| **`targetSdk`** | `35` (Configured in gradle.properties: 35) | `android/gradle.properties` (L67), `android/build.gradle` (L8) |
| **`minSdk`** | `26` (Android 8.0 Oreo) | `android/gradle.properties` (L64), `android/build.gradle` (L6) |
| **`buildToolsVersion`** | `37.0.0` | `android/gradle.properties` (L66), `android/build.gradle` (L5) |
| **`ndkVersion`** | `27.1.12297006` | `android/gradle.properties` (L72) |
| **`kotlinVersion`** | `2.2.10` | `android/gradle.properties` (L68) |

### 3. Permissions Inventory (`android/app/src/main/AndroidManifest.xml`)
- `android.permission.FOREGROUND_SERVICE`
- `android.permission.FOREGROUND_SERVICE_SPECIAL_USE`
- `android.permission.INTERNET`
- `android.permission.POST_NOTIFICATIONS`
- `android.permission.READ_EXTERNAL_STORAGE` (maxSdkVersion="32")
- `android.permission.RECEIVE_BOOT_COMPLETED`
- `android.permission.SYSTEM_ALERT_WINDOW`
- `android.permission.VIBRATE`
- `android.permission.WRITE_EXTERNAL_STORAGE` (maxSdkVersion="32")
- `android.permission.USE_FULL_SCREEN_INTENT`
- `android.permission.WAKE_LOCK`
- `android.permission.ACCESS_NOTIFICATION_POLICY`

### 4. Components & Services Inventory (`android/app/src/main/AndroidManifest.xml`)
1. **Activity: `MainActivity`**
   - Exported: `true` (Main Launcher + Deep links: `babyboo://`, `exp+babyboo://`)
2. **Activity: `WidgetPopupActivity`**
   - Exported: `false` (Translucent theme, singleInstance)
3. **Activity: `ShutdownSimulationActivity`**
   - Exported: `false` (Fullscreen black theme, showWhenLocked, turnScreenOn)
4. **Service: `ScreenTimeBackgroundService`**
   - Exported: `false`
   - Foreground Service Type: `specialUse`
   - Property: `android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE` = `"Screen time countdown timer for child device handover"`
5. **Service: `BlackoutAccessibilityService`**
   - Permission: `android.permission.BIND_ACCESSIBILITY_SERVICE`
   - Exported: `true`
   - Intent Filter: `android.accessibilityservice.AccessibilityService`
   - Meta-Data: `@xml/blackout_accessibility_config`
6. **Service: `BabyBooCallScreeningService`**
   - Permission: `android.permission.BIND_SCREENING_SERVICE`
   - Exported: `true`
   - Intent Filter: `android.telecom.CallScreeningService`
7. **Receiver: `BabyBooWidgetProvider`**
   - Exported: `true`
   - Intent Filter: `android.appwidget.action.APPWIDGET_UPDATE`
   - Meta-Data: `@xml/babyboo_widget_info`

### 5. Accessibility Config Verification (`android/app/src/main/res/xml/blackout_accessibility_config.xml`)
- **File Exists:** Yes
- **Current Content:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/blackout_a11y_description"
    android:summary="@string/blackout_a11y_summary"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault|flagRetrieveInteractiveWindows"
    android:canRetrieveWindowContent="false"
    android:notificationTimeout="100" />
```

### 6. Phase 0 Definition of Done Checklist
- [x] Detected framework confirmed: React Native / Expo with native Kotlin services
- [x] Baseline values recorded for SDKs, versioning, permissions, and services
- [x] Accessibility config XML filename and contents confirmed
- [x] Baseline `gradlew.bat :app:assembleDebug` completed successfully with exit code 0

---

## Phase 1: Raise SDK Targets to API 36

- **Date / Timestamp:** 2026-10-19
- **Goal:** Meet Google Play's August 31, 2026 requirement and target Android 16 (API 36).

### 1. Changes Made
- In `android/build.gradle`:
  - `targetSdkVersion` set to `36` (Android 16).
  - `buildToolsVersion` set to `"36.0.0"`.
  - `compileSdkVersion` set to `37` (retained at 37 to satisfy Expo SDK 58 precompiled AAR dependencies which mandate `minCompileSdk = 37`).
  - `minSdkVersion` maintained at `26` (Android 8.0 Oreo, required by Expo modules and local `[:handover-native]` library to prevent manifest merger failure).
- In `android/gradle.properties`:
  - `android.targetSdkVersion=36`
  - `android.buildToolsVersion=36.0.0`
  - `android.compileSdkVersion=37`
  - `android.minSdkVersion=26`
- In `modules/handover-native/android/build.gradle`:
  - Updated `targetSdkVersion` dynamically to `findProperty('android.targetSdkVersion') ?: '36'`.
  - Updated `minSdkVersion` dynamically to `findProperty('android.minSdkVersion') ?: '26'`.

### 2. Verification
- Manifest inspection of merged debug manifest (`android/app/build/intermediates/merged_manifests/debug/processDebugManifest/AndroidManifest.xml`):
  ```xml
  <uses-sdk
      android:minSdkVersion="26"
      android:targetSdkVersion="36" />
  ```
- `.\gradlew.bat assembleDebug` succeeded with exit code 0.

### 3. Phase 1 Definition of Done Checklist
- [x] `targetSdk` raised to 36
- [x] `buildToolsVersion` set to `36.0.0`
- [x] Manifest merger and compile errors resolved
- [x] `gradlew.bat assembleDebug` succeeds with no errors

