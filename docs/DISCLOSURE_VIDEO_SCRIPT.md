# BabyBoo Accessibility Prominent Disclosure — Demonstration Video Script

This script provides the exact shot-by-shot roadmap to record the 60–90 second unlisted YouTube demonstration video required by Google Play Console for AccessibilityService API verification.

---

## Video Specifications
- **Format:** MP4 / Screen Recording (1080p, 60fps or 30fps).
- **Duration:** 60 to 90 seconds.
- **Audio:** Clear voiceover explaining each step (or clear on-screen caption cards).
- **Hosting:** YouTube $\rightarrow$ Set Visibility to **"Unlisted"**.

---

## Shot List & Script

### Shot 1: Launch & Normal Usage Navigation (0:00 – 0:15)
- **Visual Action:**
  1. Launch BabyBoo from the device home screen.
  2. The parent lands on the main dashboard.
  3. Parent selects a screen time duration (e.g. 15 minutes) or toggles "Total Blackout".
- **Spoken Voiceover:**
  > *"Welcome to BabyBoo. BabyBoo is a screen-time management and device handover app for parents. When a parent initiates a session or toggles Total Blackout during normal usage, the app presents a prominent in-app disclosure before requesting any system permissions."*

---

### Shot 2: Prominent In-App Disclosure Presentation (0:15 – 0:30)
- **Visual Action:**
  1. The prominent standalone disclosure screen appears on screen.
  2. Slowly scroll through the disclosure to demonstrate that all text is clearly readable.
  3. Highlight the specific clauses:
     - Clear statement that it uses Android's Accessibility Service.
     - Why: To draw an impenetrable blackout overlay above the status bar.
     - What it does NOT do: Does not read the screen, does not collect or share data.
     - Mention of revocation at any time in Settings.
     - The "Agree & Continue" and "Not now" affirmative buttons.
- **Spoken Voiceover:**
  > *"Here is the prominent disclosure screen. It clearly informs parents in plain English that BabyBoo utilizes Android's Accessibility Service solely to draw a full-screen blackout overlay above the system status bar, preventing swipe-downs during device lockout. It explicitly highlights that zero screen content is inspected and zero user data is collected or shared."*

---

### Shot 3: Affirmative Consent & System Settings Navigation (0:30 – 0:45)
- **Visual Action:**
  1. Tap **"Agree & Continue"**.
  2. The app immediately redirects the user into Android's Accessibility Settings page.
  3. Locate "BabyBoo" under Installed Apps / Downloaded Services.
  4. Toggle the service **ON** and confirm Android's system prompt.
  5. Press Back to return to BabyBoo.
- **Spoken Voiceover:**
  > *"Tapping 'Agree & Continue' navigates the user to Android Accessibility Settings. The user toggles the BabyBoo service to 'On' and accepts the system prompt, then navigates back to the app."*

---

### Shot 4: Core Feature Demonstration — Total Blackout (0:45 – 0:65)
- **Visual Action:**
  1. Trigger the blackout simulation (or wait for timer handover).
  2. The screen transitions into full blackout.
  3. **Crucial demonstration:** Repeatedly swipe down from the very top bezel of the device screen.
  4. Show that the status bar, clock, battery indicator, and notification shade are completely covered and cannot be pulled down.
  5. Perform the secret parent unlock gesture (draw letter "A" on screen).
  6. Device cleanly unlocks and returns to parent dashboard.
- **Spoken Voiceover:**
  > *"With the accessibility overlay active, when the phone enters the simulated 'dead battery' blackout, swiping down from the top edge reveals no status bar or notification shade. The screen remains totally black, preserving the handover effect. Drawing the hidden parent unlock gesture 'A' immediately dismisses the overlay and unlocks the phone."*

---

### Shot 5: Non-Consent Fallback & Re-trigger Demonstration (0:65 – 0:85)
- **Visual Action:**
  1. Navigate to Settings and disable the accessibility service to simulate the non-consent or revoked permission path.
  2. Return to BabyBoo and start a session.
  3. When the disclosure appears, tap **"Not now"**.
  4. Show that the app still operates normally with basic blackout fallback without crashing.
  5. Show the Settings screen badge displaying *"Total Blackout: Basic (accessibility off)"* with the *"Why does BabyBoo need this?"* link to re-trigger the disclosure.
- **Spoken Voiceover:**
  > *"Finally, we show that Accessibility is completely optional. If a parent taps 'Not now', BabyBoo gracefully falls back to basic overlay mode with automatic status bar collapsing. The parent can revisit the disclosure at any time by tapping 'Why does BabyBoo need this?' in Settings."*

---

## Play Console Checklist
- [ ] Recorded 1080p video following this sequence.
- [ ] Uploaded to YouTube with visibility set to **Unlisted**.
- [ ] Copied YouTube URL and pasted into the Play Console Accessibility Declaration form.
