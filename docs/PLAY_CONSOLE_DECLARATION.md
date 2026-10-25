# Google Play Console Accessibility Service Declaration

**Application Name:** BabyBoo  
**Application ID:** `com.babyboo.app`  
**Accessibility Service Class:** `com.babyboo.app.BlackoutAccessibilityService`  
**Configuration File:** `res/xml/blackout_accessibility_config.xml` (`android:isAccessibilityTool="false"`)  

---

## Google Play Console Accessibility Form — Exact Submission Answers

### Question 1: Why does your app need the Accessibility Services API?
- **Selection:** Select **"App functionality"** (or Parental Control / Screen Time if offered in dropdown).
- **Free-Text Justification (Copy and paste verbatim into the text box):**
> "BabyBoo draws a full-screen overlay above the system status bar so a child cannot pull down the notification shade and see the clock/battery during a simulated 'dead phone'. A standard SYSTEM_ALERT_WINDOW overlay sits below the notification shade; only the accessibility overlay covers it, which is required for the effect. No screen content is read."

---

### Question 2: Do you collect and/or share personal or sensitive data using the accessibility capabilities?
- **Selection:** Select **"No"**.
- **Explanation:**
> "The Accessibility Service does not collect, record, or share any personal or sensitive user data. The service configuration explicitly sets android:canRetrieveWindowContent='false'. No keystrokes, on-screen text, notifications, or window contents are accessed, processed, stored, or transmitted over any network."

---

### Question 3: Prominent In-App Disclosure Verification
- **Selection:** Select **"Yes, the app displays a prominent in-app disclosure before requesting the permission"**.
- **Explanation:**
> "Before navigating the user to Android's system Accessibility Settings, BabyBoo displays a dedicated, standalone disclosure screen stating:
>
> 'BabyBoo uses Android's Accessibility Service — here's exactly why.
> BabyBoo draws a black layer over the whole screen, above the status bar, so the phone looks completely dead. Without it, a swipe from the top would reveal the clock and battery and break the illusion.
> What BabyBoo does with it: draws that overlay. That's it.
> What it does NOT do: it does not read your screen, and it does not collect or share any data.
> You can turn it off any time in Settings → Accessibility.'
>
> The user must tap an affirmative 'Agree & Continue' button to proceed to Android settings, or they can tap 'Not now' to decline. Accessibility is 100% optional; declining does not break app functionality."

---

### Demonstration Video Requirement
- **Format:** Unlisted YouTube Video Link.
- **Script & Content Reference:** See `docs/DISCLOSURE_VIDEO_SCRIPT.md`.
- **Submission Field:** Enter your unlisted video URL in the designated field in Play Console.

---

> [!IMPORTANT]
> **Policy Resubmission Notice:**
> Per Google Play Developer Policy, any future changes to how the AccessibilityService API is used in BabyBoo, or any changes to what data is accessed, require updating and resubmitting this declaration in the Google Play Console prior to publishing the app update.
