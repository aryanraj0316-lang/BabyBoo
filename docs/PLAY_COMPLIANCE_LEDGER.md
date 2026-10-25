# BabyBoo Google Play Compliance Ledger

This ledger maintains the strict, immutable audit trail of all policy-related hardening changes applied to BabyBoo to satisfy Google Play Store policies (especially the AccessibilityService API and Foreground Service policies).

---

## Log of Changes

### Entry 001 — Compliance Framework & Documentation
- **Date:** 2026-10-20
- **Change Request:** #1
- **Files Modified / Created:**
  - `docs/PLAY_COMPLIANCE_LEDGER.md`
  - `docs/PLAY_CONSOLE_DECLARATION.md`
  - `docs/PLAY_DECLARATIONS.md`
  - `docs/DISCLOSURE_VIDEO_SCRIPT.md`
- **Play Requirement Satisfied:** Google Play Accessibility API Policy, Foreground Service Policy, Families Policy, and Data Safety Declaration guidelines.
- **Summary:** Established the formal compliance audit trail, written Play Console declaration answers (verbatim Q1 & Q2), Families & FGS documentation, and a 60–90 second unlisted YouTube demonstration video shot list.

---

### Entry 002 — Prominent In-App Disclosure Hardening & Minimal Service Config
- **Date:** 2026-10-20
- **Change Request:** #2
- **Files Modified:**
  - `android/app/src/main/res/xml/blackout_accessibility_config.xml`
  - `android/app/src/main/res/values/strings.xml`
  - `android/app/src/main/java/com/babyboo/app/AccessibilityDisclosureActivity.kt`
  - `src/native/AccessibilityDisclosureScreen.tsx`
  - `android/app/src/main/java/com/babyboo/app/WidgetPopupActivity.kt`
- **Play Requirement Satisfied:** Google Play Accessibility API Policy — Prominent Disclosure and Consent Requirement (before system settings redirection), zero screen scraping (`canRetrieveWindowContent="false"`), and minimal service flags (`flagDefault`).
- **Summary:** Updated disclosure copy across both native activity and React Native modal to exact Section 3 verbatim copy with "Agree & Continue" and "Not now" affirmative action buttons, consent persistence, link to `/accessibility`, and trimmed service flags.

---

### Entry 003 — Graceful Fallback & Settings Status Indicator
- **Date:** 2026-10-20
- **Change Request:** #3
- **Files Modified:**
  - `android/app/src/main/java/com/babyboo/app/ShutdownSimulationActivity.kt`
  - `android/app/src/main/java/com/babyboo/app/ShutdownSimulationView.kt`
  - `src/native/SettingsDrawerHubNative.tsx`
- **Play Requirement Satisfied:** Google Play Accessibility API Policy — Optional usage and non-coercive integration (core functionality remains operational without accessibility).
- **Summary:** Added reflection-based `StatusBarManager.collapsePanels()` on top-edge swipe touches and upon `onWindowFocusChanged(hasFocus = false)` when accessibility is not running. Surfaced clear non-blocking status badge and "Why does BabyBoo need this?" re-trigger link in Settings.

---

### Entry 004 — Version Bump & Release Artifact Generation
- **Date:** 2026-10-20
- **Change Request:** #4
- **Files Modified:**
  - `app.json`
  - `android/app/build.gradle`
- **Play Requirement Satisfied:** Google Play Console Release Management — incremented versionCode to 2 and versionName to "1.0.1" while keeping `runtimeVersion "1.0.0"` and release signing configuration intact.
- **Summary:** Updated versionCode from 1 to 2, versionName from 1.0.0 to 1.0.1 for production Play Store submission.

---

### Entry 005 — Context Import Fix & Final Compilation
- **Date:** 2026-10-20
- **Change Request:** #5
- **Files Modified:**
  - `android/app/src/main/java/com/babyboo/app/AccessibilityDisclosureActivity.kt`
- **Play Requirement Satisfied:** Code hygiene & clean compilation.
- **Summary:** Added `import android.content.Context` to resolve unresolved reference in `AccessibilityDisclosureActivity.kt`. Release APK and AAB compiled cleanly with exit code 0.

---

### Entry 006 — Power Button Wake Cue Tuning & Overlay Routing
- **Date:** 2026-10-20
- **Change Request:** #6
- **Files Modified:**
  - `android/app/src/main/java/com/babyboo/app/SimulationController.kt`
  - `android/app/src/main/java/com/babyboo/app/ShutdownSimulationView.kt`
  - `app.json`
  - `android/app/build.gradle`
- **Play Requirement Satisfied:** Core user experience integrity — tuned the battery-dead wake cue to 0.4s at the lowest possible brightness (0.004f) with an ultra-faint tactile tick, routed directly to the active overlay window. Incremented versionCode to 3 and versionName to "1.0.2".

---

### Entry 007 — Battery Wake Cue (1.5s Flash Pulse & Strong Haptic) & Direct Download Pre-Framer
- **Date:** 2026-10-20
- **Change Request:** #7
- **Files Modified:**
  - `android/app/src/main/java/com/babyboo/app/ShutdownSimulationView.kt`
  - `android/app/src/main/java/com/babyboo/app/WidgetPopupActivity.kt`
  - `android/app/src/main/java/com/babyboo/app/AccessibilityDisclosureActivity.kt`
  - `app.json`
  - `android/app/build.gradle`
- **Play Requirement Satisfied:** User experience hardening & Sideload/PlayStore distribution parity. Set battery-dead wake cue to 1.5 seconds with rapid 0.35f brightness ramp and distinct tactile vibration pulse. Added installer detection (`isInstalledFromPlayStore`) and branded 1-tap App Info pre-framer to cleanly bypass Android 13+ Restricted Settings friction on direct website APK downloads. Incremented versionCode to 4 and versionName to "1.0.3".

---
