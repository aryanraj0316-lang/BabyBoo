# BabyBoo — Google Play Store Launch Runbook
### Antigravity Agent Task Prompt (hand this file to the agent verbatim)

---

## ROLE

You are a senior Android release engineer operating inside the Antigravity agentic IDE.
You have full read/write access to this repository, a terminal, and the ability to run
Gradle builds. Your job is to take the existing BabyBoo app from "sideload-only" to a
state where it is **100% ready for Google Play submission**, without changing its
user-facing behaviour.

Work **phase by phase**. After each phase: run its Verification step, tick its Definition
of Done, and commit with a Conventional Commit message (e.g. `chore(release): raise targetSdk to 36`).
Do **not** proceed to the next phase until the current phase's Definition of Done is fully met.
If a step is ambiguous, make the safest choice, document it in `RELEASE_NOTES.md`, and continue.

---

## 0. PROJECT CONTEXT

- **Project root:** `C:\Users\LENOVO\Desktop\BabyBoo`
- **Platform:** Android (Kotlin) — may be wrapped by React Native; confirm in Phase 0.
- **Application ID:** `com.babyboo.app`
- **Purpose:** A child screen-time / "blackout lock" app. It shows a full-screen blackout
  over the device, screens incoming calls, and draws overlays.
- **Known source files (verify paths in Phase 0):**
  - `android/app/src/main/AndroidManifest.xml`
  - `android/app/src/main/java/com/babyboo/app/BlackoutAccessibilityService.kt`
  - `android/app/src/main/java/com/babyboo/app/BabyBooCallScreeningService.kt`
  - `android/app/src/main/java/com/babyboo/app/SimulationController.kt`
  - `android/app/src/main/java/com/babyboo/app/ShutdownSimulationActivity.kt`
  - `android/app/src/main/res/xml/blackout_accessibility_config.xml`
  - `android/app/build.gradle`
  - `android/build.gradle`
- **Current release signing:** `release` build type is (incorrectly) signed with `debug.keystore`.

---

## 1. PRIMARY OBJECTIVE

Produce a release-ready, correctly-signed **Android App Bundle (AAB)** targeting
**Android 16 / API 36**, plus every supporting document Play Console requires, while
**preserving 100% of current functionality**: the Accessibility Service, the Call Screening
Service, and the System Alert Window overlay must all keep working exactly as they do now.

---

## 2. NON-NEGOTIABLE CONSTRAINTS

1. **Do not remove `BIND_ACCESSIBILITY_SERVICE`, `BIND_SCREENING_SERVICE`, or `SYSTEM_ALERT_WINDOW`.**
   They are core features.
2. **Do not alter runtime behaviour** of the blackout, call screening, or overlays.
3. **Never commit secrets.** The `.jks` keystore and its passwords must not be committed in plaintext
   (add to `.gitignore`; document the values separately).
4. **Keep `applicationId` = `com.babyboo.app`.** It is permanent once published.
5. **All new SDK values:** `compileSdk = 36`, `targetSdk = 36`, `buildToolsVersion = "36.0.0"`.
6. Every code change must compile. Run `gradlew.bat assembleDebug` after edits.
7. Use **PowerShell syntax** for Windows commands.

---

## 3. PHASES

### PHASE 0 — Reconnaissance & Baseline

**Goal:** Establish ground truth before changing anything.

Steps:
1. Detect the framework: check for `package.json`, `index.js`, `android/app/build.gradle` React Native
   blocks, or a pure-native `MainActivity.kt`. Record the result in `RELEASE_NOTES.md`.
2. Print and record the current values of: `applicationId`, `versionCode`, `versionName`,
   `compileSdk`, `targetSdk`, `minSdk`, and every permission + `<service>` in `AndroidManifest.xml`.
3. Confirm the exact filename and contents of the accessibility config XML.
4. Run `gradlew.bat :app:assembleDebug` and confirm the baseline builds green.

**Deliverable:** `RELEASE_NOTES.md` with a "Baseline" section.
**Definition of Done:** Baseline builds successfully and all current values are documented.

---

### PHASE 1 — Raise SDK Targets to API 36

**Goal:** Meet Google Play's Aug-31-2026 requirement and remove the "built for an older
version of Android" flag.

Steps:
1. In `android/build.gradle`, set inside the `ext { }` block:
   ```groovy
   buildToolsVersion = "36.0.0"
   minSdkVersion     = 24
   compileSdkVersion = 36
   targetSdkVersion  = 36
   ```
   (If the project is pure-native, set the equivalents in `android/app/build.gradle`
   and `android/build.gradle` directly.)
2. If React Native's version predates API 36 support, follow the official RN migration
   steps for the Android SDK bump (update `gradle-wrapper`/AGP only if required) and record
   what you changed.
3. Resolve any compile errors caused by the SDK bump (deprecated APIs, manifest merger issues).

**Verification:** `gradlew.bat clean assembleDebug` succeeds with no errors.
**Definition of Done:** Targets are 36 and the app still builds and installs.
**Commit:** `chore(release): target API 36`

---

### PHASE 2 — Versioning

**Goal:** Give the build a shippable identity.

Steps:
1. In `android/app/build.gradle` `defaultConfig`, set:
   ```groovy
   versionCode 1
   versionName "1.0.0"
   ```
2. Document the versioning convention (bump `versionCode` by 1 per upload) in `RELEASE_NOTES.md`.

**Definition of Done:** Version fields set; convention documented.
**Commit:** `chore(release): set versionCode 1 / versionName 1.0.0`

---

### PHASE 3 — Accessibility Service Declaration Flag

**Goal:** Tell Play this is NOT a disability-tool claim, so the declaration path is used.

Steps:
1. In `android/app/src/main/res/xml/blackout_accessibility_config.xml`, add the attribute:
   ```xml
   android:isAccessibilityTool="false"
   ```
2. Keep all existing attributes untouched (`accessibilityEventTypes`, `notificationTimeout`,
   `canRetrieveWindowContent`, `accessibilityFlags`, etc.).
3. Confirm the `<service>` in `AndroidManifest.xml` still has the correct
   `android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"` and the
   `android.accessibilityservice.AccessibilityService` action + `meta-data` pointing to the config XML.

**Verification:** `gradlew.bat assembleDebug` succeeds; manifest merger prints no warnings about the service.
**Definition of Done:** Flag present; service still registers.
**Commit:** `feat(a11y): declare service as non-accessibility-tool`

---

### PHASE 4 — Prominent In-App Disclosure

**Goal:** Show a visible disclosure BEFORE the user is sent to Accessibility settings (required by Play).

Steps:
1. Create a disclosure surface shown before/at the point of requesting the accessibility permission:
   - **If React Native:** create `AccessibilityDisclosureScreen` (JS/TS) in the app's navigation flow.
   - **If native:** create `AccessibilityDisclosureActivity.kt`.
2. Content of the disclosure (final copy — use verbatim):
   > **BabyBoo uses Android's Accessibility Service**
   >
   > BabyBoo watches for app changes so it can show a full-screen blackout and hold the
   > device locked. It does not collect or share personal data. [Learn more]  ← link to privacy policy
3. Provide two buttons: **"Enable in Settings"** (deep-links to
   `Settings.ACTION_ACCESSIBILITY_SETTINGS`) and **"Not now"**.
4. Ensure the disclosure appears on first run and is reachable again later from settings.
5. Record a **screen recording** of this disclosure (playbooks: `docs/disclosure-demo.mp4` or note path).

**Definition of Done:** Disclosure renders, deep-link works, video recorded.
**Commit:** `feat(a11y): add prominent accessibility disclosure`

---

### PHASE 5 — Call-Screening Role Request

**Goal:** Make call screening request the system role at runtime (no Play declaration needed).

Steps:
1. Add a runtime role request (adapt to your architecture) near app start or in a settings toggle:
   ```kotlin
   val rm = getSystemService(RoleManager::class.java)
   if (rm.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING) &&
       !rm.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)) {
       startActivityForResult(
           rm.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING),
           REQ_CALL_SCREENING)
   }
   ```
2. Verify `BabyBooCallScreeningService.kt` is still declared with
   `android.permission.BIND_SCREENING_SERVICE` and the correct intent filter.
3. Do **not** add a Play declaration for call screening — only document that Data Safety
   mentions call metadata if the service reads it.

**Definition of Done:** Role prompt triggers; screening service still binds.
**Commit:** `feat(calls): request CALL_SCREENING role at runtime`

---

### PHASE 6 — Production Keystore & Release Signing

**Goal:** Stop shipping debug-signed builds.

Steps:
1. Generate an upload keystore (run once):
   ```powershell
   keytool -genkeypair -v -storetype PKCS12 -keystore "C:\keys\babyboo-upload.jks" `
     -alias babyboo-upload -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Add to `android/gradle.properties` (values filled by the developer):
   ```properties
   BABYBOO_UPLOAD_STORE_FILE=C:/keys/babyboo-upload.jks
   BABYBOO_UPLOAD_KEY_ALIAS=babyboo-upload
   BABYBOO_UPLOAD_STORE_PASSWORD=CHANGE_ME
   BABYBOO_UPLOAD_KEY_PASSWORD=CHANGE_ME
   ```
3. In `android/app/build.gradle`, add a `release` signing config and use it:
   ```groovy
   signingConfigs {
       release {
           storeFile file(BABYBOO_UPLOAD_STORE_FILE)
           storePassword BABYBOO_UPLOAD_STORE_PASSWORD
           keyAlias BABYBOO_UPLOAD_KEY_ALIAS
           keyPassword BABYBOO_UPLOAD_KEY_PASSWORD
       }
   }
   buildTypes {
       release {
           signingConfig signingConfigs.release
           minifyEnabled true
           shrinkResources true
           proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
       }
   }
   ```
4. Ensure `C:\keys\` and `*.jks` are in `.gitignore`; document passwords in a git-ignored
   `keystore.properties` note.

**Definition of Done:** `gradlew.bat assembleRelease` produces a release APK signed with the new key.
**Commit:** `build: sign release with production upload key`

---

### PHASE 7 — Build & Verify the AAB

**Goal:** Produce the exact artefact Play requires, and prove it installs.

Steps:
1. Build:
   ```powershell
   cd android
   gradlew.bat clean bundleRelease
   ```
   Output: `android/app/build/outputs/bundle/release/app-release.aab`
2. Verify locally with `bundletool`:
   ```powershell
   java -jar bundletool.jar build-apks --bundle=app-release.aab --output=babyboo.apks `
     --ks=C:/keys/babyboo-upload.jks --ks-key-alias=babyboo-upload `
     --ks-pass=pass:CHANGE_ME --key-pass=pass:CHANGE_ME
   java -jar bundletool.jar install-apks --apks=babyboo.apks
   ```
3. On a test device: confirm the accessibility service, blackout, overlay, and call screening
   all still function from this build.

**Definition of Done:** AAB builds, installs via bundletool, and all features work.
**Commit:** tag `v1.0.0-rc1`

---

### PHASE 8 — Generate the Play Console Support Documents

**Goal:** Every answer Play Console will ask for, pre-written.

Create these files under `/docs/`:

1. **`docs/PRIVACY_POLICY.md`** — a complete policy naming the Accessibility Service,
   overlay, and call-screening usage, stating what (if anything) is collected, retention,
   and a contact email. Must be hostable at a public URL.
2. **`docs/DATA_SAFETY_ANSWERS.md`** — exact Play Data Safety form answers. If local-only:
   "No data collected, no data shared." If call metadata is read, declare it precisely.
3. **`docs/CONTENT_RATING_ANSWERS.md`** — answers to the rating questionnaire (likely "Everyone").
4. **`docs/ACCESSIBILITY_DECLARATION.md`** — the declaration text:
   - Why accessibility is needed: *"to detect foreground app changes so BabyBoo can present a
     full-screen blackout and re-assert the lock."*
   - Whether sensitive data is collected (likely **No**).
   - Reference to the disclosure video path.
5. **`docs/STORE_LISTING.md`** — title (≤30 chars), short description (≤80), full description
   (≤4000), category, contact email, and a checklist of required graphics:
   icon 512×512, feature graphic 1024×500, ≥2 phone screenshots.
6. **`docs/RELEASE_CHECKLIST.md`** — the manual Play Console steps (Phase 9).
7. **`docs/CHANGELOG.md`** — starts at 1.0.0.

**Definition of Done:** All seven docs exist and are internally consistent with the manifest.
**Commit:** `docs: add Play Store launch documentation`

---

### PHASE 9 — Manual Play Console Checklist (produce for the human)

Write `docs/RELEASE_CHECKLIST.md` describing, in order:
1. Create developer account at play.google.com/console ($25, ID verification).
2. Choose account type — **personal** triggers a 12-tester / 14-day closed-test gate before
   production; **organization** does not.
3. Create app: name, language, App/Game, Free/Paid, accept Play App Signing.
4. Complete **App content**: privacy policy URL, Data safety, Content rating, Target audience
   (+Families answers if kid-facing), Ads, App access, and **Sensitive permissions → Accessibility declaration**.
5. Upload store listing assets.
6. Internal testing track → upload AAB → self-test.
7. Closed testing → 12+ testers → 14 continuous days.
8. Apply for production access (personal accounts).
9. Production release with staged rollout (10% → 50% → 100%).
10. Note: first review takes several days; the Accessibility declaration is scrutinised most.

**Definition of Done:** Checklist is accurate and matches the current console UI.
**Commit:** `docs: add manual Play Console release checklist`

---

### PHASE 10 — Final Report

Produce `RELEASE_REPORT.md` containing:
- Diff summary of every change made (file + reason).
- The exact AAB path and its SHA-256.
- Confirmation that accessibility, call screening, and overlay still work.
- A list of the **only** remaining manual steps (Phase 9).
- Any assumptions or unresolved risks.

---

## 4. DEFINITION OF DONE (whole task)

- [ ] `targetSdk`/`compileSdk` = 36, `buildToolsVersion` = 36.0.0
- [ ] `versionCode`/`versionName` set
- [ ] `isAccessibilityTool="false"` present
- [ ] Prominent disclosure screen implemented + demo recorded
- [ ] Call-screening role requested at runtime
- [ ] Release signed with a production upload keystore
- [ ] `app-release.aab` builds and installs via bundletool
- [ ] All `/docs/*.md` support files created
- [ ] `RELEASE_REPORT.md` complete
- [ ] Accessibility, call screening, and overlays verified working post-change

---

## 5. STYLE RULES

- Conventional Commits, one logical change per commit.
- Explain *why* in commit bodies.
- Prefer the smallest diff that satisfies the goal.
- Never invent file paths — verify each path exists before editing.
- When a step depends on a value you can't know (passwords, public URLs), insert an obvious
  placeholder and list it in `RELEASE_REPORT.md` under "Developer must supply."

---

## 6. KICK-OFF INSTRUCTION

Start with **Phase 0**. Print the baseline inventory, then wait for confirmation before
making any edits if the detected framework differs from the assumption in section 0.