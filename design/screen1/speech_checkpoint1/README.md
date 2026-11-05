# Buddy speech bubble — Checkpoint 1

2026-11-05, Asia/Calcutta. Branch: onboarding-screen1-rebuild.

One cream, rounded, non-interactive bubble above Buddy: English “Time's up!” / Hindi “समय पूरा!”. It follows the existing shutdown/yawn image reaction through the shared scene state. No independent clock, additional dialogue sequence, fade, Buddy image/timing change or layout reservation was added. Its existing yawn window is approximately 12.7–13.6s; full dialogue dwell times and transitions remain Checkpoint 2 work after approval.

## Changed application files

- src/onboarding/screen1/scene/BuddySpeechBubble.tsx: single bubble, tail, native text and existing-reaction visibility.
- src/onboarding/screen1/OnboardingScreen1.tsx: mount overlay using existing scene layout and shared clock state.
- src/onboarding/screen1/strings.ts: one English/Hindi localized message.
- src/onboarding/screen1/tokens.ts: isolated bubble appearance tokens.

The phone demonstration, battery, A gesture, Buddy frames/switching, approved layout, background, headline, description, CTA, navigation and other screens were not changed in this checkpoint.

## Actual verification

- TypeScript: `node node_modules/typescript/bin/tsc --project tsconfig.app.json --noEmit` passed.
- Existing timeline/layout Vitest checks: 18 passed.
- Task whitespace check passed.
- Android arm64 assembleDebug succeeded in 57 seconds; installed on connected Vivo V2432, serial 10MF7BG5920005F.
- APK SHA256: E94DA80A8A3DFE62D13370CD816C6E9360C40683D293BC3B9662F3F000781AB0.
- Actual ADB recordings pulled, frames/contact sheets extracted and visually reviewed. English and Hindi full-size 720×1600 screenshots reviewed. Debug controls absent. No bubble overlap with phone, Buddy's face, headline, CTA or language toggle in these captures.
- `review/english-screen.png` and `review/hindi-screen.png` are unaltered frames extracted from physical-phone recordings. `review/bubble-preview.mp4` is a 4.03-second excerpt from the English recording, including the one bubble turn. Contact sheets and raw recordings remain local in review/.

System font scaling is enabled with the existing screen's maximum multiplier. No bubble motion was introduced. Extra device sizes, enlarged system-font settings and reduced-motion device settings were not physically exercised in this checkpoint.

Existing issue observed outside this change: the Hindi battery label inside the Skia phone demo displays missing-glyph squares. The new native-text speech bubble renders Hindi correctly. Battery rendering was left untouched as requested.

STOPPED after Checkpoint 1. Remaining six messages, sequential parent turns, dialogue dwell times/fades and full-loop dialogue verification require explicit Checkpoint 2 approval.
