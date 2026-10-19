# BabyBoo — Prominent Accessibility Disclosure Playbook & Demo

## Overview
Google Play's **Accessibility API Policy** mandates that before an application requests or redirects the user to enable an Accessibility Service, it must display a **prominent in-app disclosure** that:
1. Is displayed within the app itself (not solely in Play Store description or website).
2. Explains clearly what data is accessed or monitored.
3. Requires explicit affirmative user action (cannot dismiss by tapping outside or auto-proceed).
4. Does not use misleading claims.

---

## Verbatim Disclosure Copy (Implemented)

### Title
> **BabyBoo uses Android's Accessibility Service**

### Body
> **BabyBoo watches for app changes so it can show a full-screen blackout and hold the device locked. It does not collect or share personal data. [Learn more]**

### Action Buttons
- **`Enable in Settings`**: Directly redirects the user to Android system `Settings.ACTION_ACCESSIBILITY_SETTINGS`.
- **`Not now`**: Dismisses the prompt and leaves accessibility disabled.
- **`[Learn more]`**: Navigates to the official privacy policy at `https://babyboo.app/privacy`.

---

## Visual Demonstration

A high-fidelity capture of this disclosure in action is preserved at:
- **Image:** `docs/disclosure-demo.jpg`
- **Video Path:** `docs/disclosure-demo.mp4`

---

## Play Console Submission Requirement
When completing the **App Content -> Sensitive Permissions -> Accessibility Tool Declaration** in the Google Play Console:
1. Google asks: *"Provide a link to a video demonstrating your prominent disclosure and accessibility features in action."*
2. Upload the video recording of this screen (`docs/disclosure-demo.mp4`) to **YouTube as Unlisted** (or Google Drive with public link sharing enabled).
3. Paste the URL into the declaration form.
