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

---

## Phase 2: Versioning

- **Date / Timestamp:** 2026-10-19
- **Goal:** Give the build a shippable identity and establish production release versioning rules.

### 1. Version Settings
- `android/app/build.gradle`:
  ```groovy
  defaultConfig {
      applicationId 'com.babyboo.app'
      minSdkVersion rootProject.ext.minSdkVersion
      targetSdkVersion rootProject.ext.targetSdkVersion
      versionCode 1
      versionName "1.0.0"
  }
  ```
- `app.json`:
  - `"version": "1.0.0"`
  - `"android.versionCode": 1`

### 2. Versioning Convention
- **`versionCode` (Integer):** Monotonically increasing positive integer. **Must be bumped by +1 for every single upload to Google Play Console** (`1` -> `2` -> `3`). Google Play strictly rejects uploads where `versionCode` is lower than or equal to any previous build.
- **`versionName` (String):** Follows Semantic Versioning (`MAJOR.MINOR.PATCH`):
  - `1.0.0`: Initial Google Play production release candidate.
  - `1.0.1+`: Bug fixes, hotfixes, policy adjustments.
  - `1.1.0+`: New user-facing features or major simulation enhancements.
  - `2.0.0+`: Breaking architectural changes.

### 3. Phase 2 Definition of Done Checklist
- [x] `versionCode 1` and `versionName "1.0.0"` confirmed in `android/app/build.gradle` and `app.json`
- [x] Versioning convention fully documented

---

## Phase 3: Accessibility Service Declaration Flag

- **Date / Timestamp:** 2026-10-19
- **Goal:** Explicitly declare to Google Play that this service is not a disability-tool claim, enabling the Play Console Parental Control / Child Wellbeing declaration review pathway.

### 1. Changes Made
- In `android/app/src/main/res/xml/blackout_accessibility_config.xml`:
  - Added `android:isAccessibilityTool="false"`.
  - Preserved all existing attributes: `description`, `summary`, `accessibilityFeedbackType`, `accessibilityFlags="flagDefault|flagRetrieveInteractiveWindows"`, `canRetrieveWindowContent="false"`, `notificationTimeout="100"`.
- In `android/app/src/main/AndroidManifest.xml`:
  - Verified `<service android:name=".BlackoutAccessibilityService">` retains:
    - `android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"`
    - `<action android:name="android.accessibilityservice.AccessibilityService" />`
    - `<meta-data android:name="android.accessibilityservice" android:resource="@xml/blackout_accessibility_config" />`

### 2. Verification
- `.\gradlew.bat assembleDebug` succeeded with no errors or manifest merger warnings.

### 3. Phase 3 Definition of Done Checklist
- [x] `android:isAccessibilityTool="false"` flag present in `blackout_accessibility_config.xml`
- [x] Service remains properly declared in `AndroidManifest.xml`
- [x] Build and manifest merger verified clean

---

## Phase 4: Prominent In-App Disclosure

- **Date / Timestamp:** 2026-10-19
- **Goal:** Display Google Play-mandated prominent in-app disclosure before redirecting users to Android Accessibility Settings.

### 1. Changes Made
- Created native `AccessibilityDisclosureActivity.kt` (`com.babyboo.app.AccessibilityDisclosureActivity`):
  - Displays modal card with verbatim required copy:
    - **Title:** `BabyBoo uses Android's Accessibility Service`
    - **Body:** `BabyBoo watches for app changes so it can show a full-screen blackout and hold the device locked. It does not collect or share personal data. [Learn more]`
    - **Buttons:** `Enable in Settings` (deep-links to `Settings.ACTION_ACCESSIBILITY_SETTINGS`) and `Not now`.
    - Clickable `[Learn more]` span links to `https://babyboo.app/privacy`.
- Registered `AccessibilityDisclosureActivity` in `android/app/src/main/AndroidManifest.xml` with intent filter `com.babyboo.app.ACTION_ACCESSIBILITY_DISCLOSURE`.
- Updated `WidgetPopupActivity.kt` to present this exact verbatim disclosure before redirecting to accessibility settings.
- Created React Native `AccessibilityDisclosureScreen.tsx` (`src/native/AccessibilityDisclosureScreen.tsx`) for the React Native navigation flow.
- Integrated accessibility status checking and persistent settings access via `SettingsDrawerHubNative.tsx` so parents can view the disclosure anytime.
- Updated `HandoverNativeModule.kt` to report `accessibilityGranted` status and route accessibility requests to the disclosure activity.
- Preserved visual asset and video documentation playbook at `docs/DISCLOSURE_DEMO.md` (`docs/disclosure-demo.jpg` and `docs/disclosure-demo.mp4`).

### 2. Verification
- `.\gradlew.bat assembleDebug` succeeded with exit code 0.
- Manifest merger verified clean.

### 3. Phase 4 Definition of Done Checklist
- [x] Prominent disclosure surface implemented natively and in React Native
- [x] Verbatim required copy and `[Learn more]` link implemented
- [x] `Enable in Settings` and `Not now` actions wired to system intents
- [x] Accessible from setup flow and persistently from settings drawer
- [x] Disclosure demo asset and playbook created in `docs/`

---

## Phase 5: Call-Screening Role Request

- **Date / Timestamp:** 2026-10-19
- **Goal:** Request Android system `ROLE_CALL_SCREENING` at runtime instead of relying on sensitive Play permissions declaration.

### 1. Changes Made
- In `android/app/src/main/java/com/babyboo/app/MainActivity.kt`:
  - Added runtime system role request in `onPostCreate()` via `RoleManager.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING)` when `!rm.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)`.
- In `android/app/src/main/AndroidManifest.xml`:
  - Verified `BabyBooCallScreeningService` retains:
    - `android:permission="android.permission.BIND_SCREENING_SERVICE"`
    - `<action android:name="android.telecom.CallScreeningService" />`
- In `modules/handover-native/android/src/main/java/expo/modules/handovernative/HandoverNativeModule.kt`:
  - Added `"callScreeningRoleHeld"` check to `getPermissionStatus()`.
  - Added `"call_screening"` intent launcher to `openPermissionSettings()`.
- Policy & Declaration decision:
  - No Play Console declaration required for Call Screening when utilizing standard Android `RoleManager.ROLE_CALL_SCREENING`.
  - Data safety documentation records that incoming call handling is processed strictly on-device without telemetry or transmission.

### 2. Verification
- `.\gradlew.bat assembleDebug` succeeded with exit code 0.
- Manifest merger verified clean.

### 3. Phase 5 Definition of Done Checklist
- [x] Runtime role prompt triggers via `RoleManager`
- [x] Screening service properly bound and declared with `BIND_SCREENING_SERVICE`
- [x] Build verified clean





