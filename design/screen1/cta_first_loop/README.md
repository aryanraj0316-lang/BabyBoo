# Get Started after the first loop

2026-11-05, Asia/Calcutta. Branch: onboarding-screen1-rebuild.

Get Started is hidden until the existing shared, unwrapped demo clock reaches 26 seconds. Once revealed it stays available for subsequent loops on this Screen 1 visit. Asset loading and background pauses retain their existing clock gating; no timeout or independent timer was added.

The button stays mounted in its measured slot with opacity zero until completion, preserving phone/Buddy/copy positions. Its Pressable is disabled, pointer events pass through, and the subtree is hidden from accessibility while invisible. Existing localized labels, button styling and navigation callback are retained.

Reduced motion keeps the existing composed still. The shared clock counts the same foreground viewing period so the CTA can become available without enabling scene animation or leaving users permanently blocked.

## Application files changed

- `src/onboarding/screen1/useDemoClock.ts`: sticky first-loop completion flag; shared viewing time also advances while the reduced-motion scene stays parked.
- `src/onboarding/screen1/OnboardingScreen1.tsx`: passes that completion flag to the existing CTA.
- `src/onboarding/screen1/CtaButton.tsx`: visibility, interaction and accessibility gating with space preserved.

No story timings, Buddy frames/behavior, phone animations, artwork, text, layout tokens, navigation or other screens changed.

## Verification

- App TypeScript check passed.
- All 21 existing timeline/layout/dialogue tests passed.
- Task whitespace check passed.
- Android arm64 build succeeded in 1m37s; installed on physical Vivo V2432, serial 10MF7BG5920005F.
- APK SHA256: 3AE9C9722BDC0BF772C0909F3E7EA92C8589DE1A1B270DD5AF38C04A3FD2E9B2.
- Recorded 58.117 seconds from cold launch with ADB, pulled it, extracted 1fps contact sheets and reviewed both sheets plus full-size before/after screenshots. Button absent through the first story; appears after its wrap and remains visible through the next two starts. Phone/headline/subline positions do not shift. Debug controls absent.
- Recorded 38.037 seconds from a reduced-motion cold start. Reviewed the extracted contact sheet: composed home/Buddy/speech still stays stationary, CTA is initially absent and becomes visible after the viewing period. Original transition_animation_scale=1.0 was restored and read back; app relaunched normally in English.
- No fatal exceptions or ReactNativeJS errors in the checked recent log window.

Evidence: `before-loop.png` (raw time24s), `after-loop.png` (31s), `contact-01.png`, `contact-02.png`, `reduced-contact.png`, `reduced-after.png`. `reveal-review.mp4` is the actual recording's ten-second excerpt (raw22–32s) around the reveal. PNGs are unchanged physical-phone frames. Full raw recordings remain local.

Stopped after this requested change for user review; no additional polish started.
