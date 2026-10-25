# Google Play Console Data Safety Questionnaire Answers

**Application:** BabyBoo (`com.babyboo.app`)  
**Target Audience:** Parents & Guardians (Screen Time & Device Lockout)  
**Architecture:** 100% On-Device / Zero-Telemetry

---

## 1. Data Collection & Sharing Overview

| Question in Play Console | Required Answer | Justification / Reviewer Notes |
| :--- | :--- | :--- |
| **Does your app collect or share any of the required user data types?** | **No** | BabyBoo processes all lock screen triggers, simulation states, and call screening rules strictly in local device memory (RAM) and local SQLite/AsyncStorage. No data is transmitted to any backend. |
| **Is all of the user data collected by your app encrypted in transit?** | **Not applicable** | No data is collected or transmitted over any network. |
| **Do you provide a way for users to request that their data be deleted?** | **Yes** | Users can delete all local preferences and timers at any time via Android App Info > "Clear Storage" or by uninstalling the application. |
| **Does your app adhere to the Google Play Families Policy?** | **Yes** | BabyBoo does not collect personal identifiers from children and complies with COPPA and Families policy requirements. |

---

## 2. Specific Data Type Declarations

### Location
- **Approximate location:** Not collected / Not shared.
- **Precise location:** Not collected / Not shared.

### Personal Info
- **Name, Email address, User IDs, Address, Phone number, Political/religious beliefs, Sexual orientation, Other personal info:** **None collected / None shared.**

### Financial Info
- **Credit card, debit card, bank account numbers, purchase history, credit score:** **None collected / None shared.**

### Health & Fitness
- **Health information, fitness information:** **None collected / None shared.**

### Messages
- **Emails, SMS or MMS messages, Other in-app messages:** **None collected / None shared.**

### Photos & Videos
- **Photos, Videos:** **None collected / None shared.**

### Audio Files
- **Voice or sound recordings, Music files, Other audio files:** **None collected / None shared.**

### Files & Documents
- **Files and docs:** **None collected / None shared.**

### Calendar
- **Calendar events:** **None collected / None shared.**

### Contacts
- **Contacts:** **None collected / None shared.**

### App Activity
- **App interactions:** **Not collected.** (Accessibility API observes foreground app window transitions ephemerally in RAM strictly to determine whether to trigger the lockout overlay. It is never logged, stored, or sent off the device).
- **In-app search history:** Not collected.
- **Installed apps:** Not collected.
- **Other user-generated content:** Not collected.
- **Other actions:** Not collected.

### Web Browsing
- **Web browsing history:** **Not collected / Not shared.**

### App Info & Performance
- **Crash logs:** Not collected. (No external crash-reporting SDKs like Crashlytics or Sentry).
- **Diagnostics:** Not collected.
- **Other app performance data:** Not collected.

### Device or Other IDs
- **Device or other identifiers (e.g. IMEI, MAC address, Android ID, Advertising ID):** **Not collected / Not shared.**

### Call Screening / Phone
- **Call metadata:** Evaluated in real-time purely in memory via Android's `CallScreeningService` API to allow parents to silence or screen incoming calls during active lockouts. No phone numbers, contact records, or call durations are retained, logged to disk, or transmitted.

---

## 3. Summary Statement for Human Reviewer (Paste into Console Notes if prompted)

> "BabyBoo is an offline-first parental device lock and screen-time management application. It operates entirely on-device with zero telemetry, zero analytics, and zero advertising SDKs. The Accessibility Service is used exclusively in RAM to detect foreground window transitions to re-assert the blackout lockout screen. Call screening is handled locally via Android's RoleManager system role. No user data of any type is collected, stored remotely, or shared with third parties."
