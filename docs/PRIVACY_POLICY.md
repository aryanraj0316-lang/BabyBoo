# Privacy Policy for BabyBoo

**Last Updated:** October 19, 2026  
**Effective Date:** October 19, 2026  
**Application Name:** BabyBoo  
**Application ID:** `com.babyboo.app`  
**Contact Email:** `support@babyboo.app` (Developer: `aryanraj0316@gmail.com`)  
**Website:** `https://babyboo.app`

---

## 1. Introduction

BabyBoo ("we", "our", or "us") provides a child screen-time management and parental lockout tool for Android devices. We are committed to protecting your privacy and the privacy of your family. This Privacy Policy details how BabyBoo functions, our strict on-device data handling model, and our adherence to Google Play's Developer Program Policies, including policies on Sensitive Permissions and Children's Privacy.

**Core Privacy Principle:** BabyBoo is an **offline-first, zero-telemetry application**. We do not collect, harvest, track, sell, or transmit personal data, usage data, or sensitive device information to remote servers or third parties.

---

## 2. Explicit Use of Android Permissions & Services

To provide device lockout and simulation features, BabyBoo requests specific sensitive Android permissions. Each permission is used strictly for its declared core purpose:

### A. Android Accessibility Service (`BIND_ACCESSIBILITY_SERVICE`)
- **Purpose:** BabyBoo uses Android's Accessibility Service API exclusively to detect when a child switches foreground applications or navigates away from the active screen-time session. This enables BabyBoo to present a full-screen blackout overlay and re-assert the lock state.
- **Data Protection & Non-Collection:** 
  - BabyBoo **does NOT** read, record, log, or transmit typed text, passwords, messages, web history, or on-screen visual content.
  - BabyBoo **does NOT** use the Accessibility API to alter system settings without parental intent or bypass Android security controls.
  - BabyBoo declares `android:isAccessibilityTool="false"` in compliance with Google Play policy, confirming that this service is dedicated to parental control / child device lockout rather than disability assistance.
- **Prominent In-App Disclosure:** Before directing you to Android's system settings to enable this service, BabyBoo displays an in-app prominent disclosure explaining the exact purpose and affirming that no personal data is collected.

### B. Display Over Other Apps (`SYSTEM_ALERT_WINDOW`)
- **Purpose:** Allows BabyBoo to draw the full-screen blackout layer and simulated battery drain / shutdown visual feedback over active screens during a lockout period.
- **Data Protection:** No visual data beneath the overlay is captured, recorded, or screenshotted.

### C. Call Screening Service (`BIND_SCREENING_SERVICE` / `ROLE_CALL_SCREENING`)
- **Purpose:** Allows parents to screen incoming calls while a lockout or blackout session is active.
- **Data Protection:** Incoming phone numbers and call metadata are evaluated entirely in real-time on the local device to determine whether to silence or allow the call. No call logs, numbers, audio, or call metadata are recorded, uploaded, or transmitted off the device.

### D. Wake Lock & Vibration (`WAKE_LOCK`, `VIBRATE`)
- **Purpose:** Keeps the display state active during lock enforcement and provides haptic feedback during interactive simulation triggers.

---

## 3. Data Collection, Storage, and Sharing

- **Personal Information:** We do not collect names, email addresses, phone numbers, physical addresses, or device identifiers (IMEI, Android ID, Advertising ID).
- **Analytics & Telemetry:** BabyBoo contains no third-party tracking SDKs, no behavioral analytics (such as Google Analytics or Firebase Analytics), and no advertising frameworks.
- **Network Traffic:** BabyBoo does not establish background network connections or transmit device data to any external server.
- **Local Storage:** All app preferences, parental PIN codes, mascot customizations, and scheduled blackout timers are stored locally on the device (using encrypted Android SharedPreferences and SQLite/AsyncStorage).

---

## 4. Children's Privacy & Families Policy Compliance (COPPA)

BabyBoo is designed for parents and guardians to manage child screen time:
- We comply with the Children's Online Privacy Protection Act (COPPA) and Google Play's Families Policy.
- We do not knowingly solicit or collect personal information from children under the age of 13.
- There are no advertisements, in-app behavioral tracking, or links to external unmoderated platforms presented to children.

---

## 5. User Control, Data Retention & Deletion

- **Local Data Retention:** All settings remain on your device for as long as the app is installed.
- **Data Deletion:** You can delete all local data at any time by:
  1. Opening Android **Settings** > **Apps** > **BabyBoo**.
  2. Selecting **Storage & cache** > **Clear Storage** / **Clear Data**.
  3. Or simply uninstalling the application.

---

## 6. Revoking Permissions

You may revoke any permission at any time through standard Android settings:
- **Accessibility Service:** Android **Settings** > **Accessibility** > **BabyBoo** > Toggle off.
- **Draw Over Other Apps:** Android **Settings** > **Apps** > **Special app access** > **Display over other apps** > **BabyBoo** > Toggle off.
- **Call Screening:** Android **Settings** > **Apps** > **Default apps** > **Caller ID & spam app** > Set to system default.

---

## 7. Changes to This Privacy Policy

If we update this Privacy Policy, the updated version will be published at `https://babyboo.app/privacy` with a revised "Last Updated" date.

---

## 8. Contact Us

If you have any questions or feedback regarding this Privacy Policy or BabyBoo's privacy practices, please contact us:
- **Support Email:** `support@babyboo.app`
- **Developer Email:** `aryanraj0316@gmail.com`
- **GitHub Repository:** `https://github.com/aryanraj0316/BabyBoo`
