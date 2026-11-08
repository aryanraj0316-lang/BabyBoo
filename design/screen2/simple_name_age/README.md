# Minimal Screen 2: name → age milestone

2026-11-08, Asia/Calcutta. Branch: onboarding-screen1-rebuild.

The latest supplied reference supersedes the previous Friend Card container layout. This milestone simplifies the existing native Screen 2 into near-white space, plain friendly text, one stationary Buddy image and a rounded green-outline input. Back, English/Hindi and the existing name/age callback contract remain.

## Implemented

- Auto-focus opens the name keyboard. The KeyboardAvoidingView reserves keyboard space; the name field is the bottom section inside the visible scroll area, rather than underneath a large card. Buddy's layout size adjusts when the keyboard appears; no animated transforms or independent mascot clock.
- Empty name: original approved greeting frame and introduction.
- Non-empty name: `Hi, {name}!` / Hindi equivalent, and the approved attentive frame. The pose changes only between empty/non-empty input, not on every keystroke; the text reflects corrections immediately.
- Submit via keyboard Next or the input's arrow: dismiss keyboard and ask the child's age on the same page, with the approved age-ready image.
- Age selection: existing five age IDs/options, approved age-proud frame and existing Continue callback. Cards in artwork stay blank; selected age is visible in the native option, not baked into an image.
- Edit name returns to the same input without discarding the selected age. Continue requires a non-empty name and age. Existing parent navigation/data handling outside Screen 2 was not changed.
- No new images, colour input, badge tinting, completed card, Screen 1 changes or other-screen changes. No typing-dot loops, artificial waiting, body movement or speech-bubble/card chrome.

Approved frames used: `buddy_greeting`, `buddy_name_attentive`, `buddy_age_ready`, `buddy_age_proud`. `mascot-frames.png` displays the unchanged images on a common baseline. Colour/completion frames remain preserved for a separately approved milestone.

## Checks and current blocker

- App TypeScript check passed.
- Task whitespace check passed.
- Android arm64 build passed in 4m24s and installed on the connected Vivo V2432 (10MF7BG5920005F).
- APK SHA256: 10D252CEB52F68108D7D1DEDF77E7246EAF69ED119B013951D804FEB1A347FAC.
- Capture stopped safely when the expected Screen 2 input could not be found. The phone's proximity sensor was holding the display OFF (`mWakefulness=Asleep`, `mProximityPositive=true`, last sleep reason proximity), so navigation taps did not take effect and the screenshot was black. No test name or profile was entered/saved.
- Asked the user to leave the screen on/unlocked and top sensor uncovered. No call ended and no sensor protection bypassed. Do not claim visual or keyboard verification from a successful build.

Pending: actual Android recording, screenshot review of greeting+keyboard/name/age/selected age and Hindi, and screen-state contact sheet. Run `tools/screen2/capture_name_age.ps1 -UseInstalled` once the display is ready, then extract/review video frames and run `tools/screen2/review_name_age.py`. Capture uses temporary name Mira and does not press Continue/save a child profile. No other QA rounds or colour milestone should begin automatically.

Known pre-existing limitation: parent app does not pass initial answers back on a new Screen 2 mount, so full backward/forward remount persistence remains outside this Screen-2-only milestone. Editing within this page retains age/name state.

Stopped at the device-verification blocker, awaiting phone availability. Once this small milestone is reviewed, ask for approval before further changes.
