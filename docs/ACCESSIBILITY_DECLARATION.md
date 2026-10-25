# Google Play Console Accessibility Service Declaration

**Application Name:** BabyBoo  
**Application ID:** `com.babyboo.app`  
**Service Class:** `com.babyboo.app.BlackoutAccessibilityService`  
**Configuration File:** `res/xml/blackout_accessibility_config.xml` (`android:isAccessibilityTool="false"`)

---

## 1. Overview of Google Play Policy Requirements

Google Play’s Accessibility API Policy mandates that:
1. The app must declare whether it is an accessibility tool designed for individuals with disabilities. **(BabyBoo declares: NO, it is a Parental Control / Screen Time Management tool)**.
2. The app must demonstrate that the service is essential to the core user-facing functionality.
3. The app must display a **Prominent In-App Disclosure** before directing the user to Android Accessibility Settings.
4. The developer must provide a video link (unlisted YouTube URL) demonstrating the prominent disclosure in action and the feature working.

---

## 2. Google Play Console Declaration Form Questions & Verbatim Answers

### Question 1: Is your app an Accessibility Tool?
- **Answer:** **No**
- **Explanation:** BabyBoo is an innovative parental control and screen-time management tool for families. It uses the Accessibility Service API strictly to enforce parental screen-time limits and prevent device lock circumvention. It does not claim to assist users with disabilities.

---

### Question 2: Why does your app need the Accessibility Service API?
*(Paste this exact verbatim response into the text box)*:
> "BabyBoo uses Android's Accessibility Service API to detect foreground app changes so BabyBoo can present a full-screen blackout and re-assert the lock during active parental screen-time sessions. 
> 
> Without the Accessibility Service, when a child opens another application or taps the Home/Recent Apps buttons, the operating system would allow them to bypass the screen-time restriction. The Accessibility Service enables BabyBoo to identify window transitions in real time and immediately re-assert the blackout lockout overlay until the parental session timer concludes or the parent enters their unlock PIN.
> 
> The service does NOT observe keystrokes, does NOT read or harvest on-screen text, does NOT alter user settings without consent, and does NOT record or transmit any personal data."

---

### Question 3: Does your app collect or share any personal or sensitive user data using the Accessibility API?
- **Answer:** **No**
- **Explanation:** The Accessibility Service only inspects window state transitions in local device RAM (`onAccessibilityEvent`). No event data, package names, keystrokes, or screen content are logged to disk, stored, or transmitted over any network.

---

### Question 4: How does your app provide prominent disclosure to users?
- **Answer:**
> "Before navigating the user to Android's system Accessibility Settings, BabyBoo displays a modal dialog with prominent, high-contrast text that explicitly states:
> 
> 'BabyBoo uses Android's Accessibility Service
> BabyBoo watches for app changes so it can show a full-screen blackout and hold the device locked. It does not collect or share personal data. [Learn more]'
> 
> The dialog includes an explicit 'Enable in Settings' button, a 'Not now' dismissal button, and a clickable link to our publicly hosted Privacy Policy. Users cannot be redirected to system settings without first interacting with this disclosure."

---

### Question 5: Demonstration Video URL
- **Required Format:** Unlisted YouTube video URL (e.g. `https://youtu.be/...`).
- **Video Content Checklist (Demonstrated in `docs/disclosure-demo.mp4` / `docs/disclosure-demo.jpg`):**
  1. Open BabyBoo app.
  2. Navigate to setup or enable lockout.
  3. Show the prominent disclosure dialog appearing on screen *before* settings.
  4. Tap "Enable in Settings".
  5. Show device navigating to Android Accessibility Settings.
  6. Enable BabyBoo accessibility service and return to app.
  7. Trigger blackout lockout and demonstrate that attempting to open another app re-asserts the blackout screen.
- **Local Playbook Reference:** See `docs/DISCLOSURE_DEMO.md`.
- **Upload Placeholder:** `https://youtu.be/CHANGE_ME_DISCLOSURE_DEMO` *(Replace with your unlisted YouTube link upon recording)*.
