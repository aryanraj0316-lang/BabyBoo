# Contextual Buddy dialogue — Checkpoint 2

2026-11-05, Asia/Calcutta. Branch: onboarding-screen1-rebuild. Checkpoint 1 approved by user; remaining dialogue and a slightly brighter child hand authorized.

## Implemented

Seven localized English/Hindi turns derive from the existing `useDemoClock → sceneAt` state. The pure `dialogueAt` lookup supplies one message ID and opacity; the native bubble updates text only when that ID changes. No second clock, timer or Buddy animation. Adjacent turns fade through over 150ms total, without overlapping text layers. Reduced motion shows the existing composed still with a fully visible success message. Pointer events pass through the bubble; text uses the existing system font family and font-scale cap.

| Existing story moment | English copy | Bubble window (seconds) |
| --- | --- | --- |
| Reels | Just one more reel? | 0.70–5.30 |
| Battery drain | Uh-oh, battery's dropping! | 9.00–12.15 |
| Shutdown | Time's up! | 12.50–13.60 |
| Sleepy | Nap time... Zzz | 13.60–14.80 |
| Parent hand-off | Parents, it's your turn! | 14.80–16.55 |
| A gesture | Draw an A to unlock! | 16.55–18.85 |
| Unlocked | Yay! You did it! | 19.00–21.80 |

The two parent messages are separate turns. The parent hand-off leads the visible prompt by 0.7 seconds and lasts 1.75 seconds; the A instruction starts 0.4 seconds into the unchanged A stroke and lasts 2.3 seconds. This provides reading time without moving any phone event. Quiet intervals, including 21.8–24.0 and the first 0.7 seconds, prevent dialogue crowding at the seam.

Child reel-hand opacity increased from 0.66 to 0.78 for slightly more visible pink/cuff colour. Adult hand unchanged. All Buddy images, image selection, phone timing/animation, background artwork, layout, primary copy, navigation and other screens remain untouched.

## Checks completed

- TypeScript app check passed.
- 21 Vitest checks passed (13 existing timeline, 5 existing layout, 3 new dialogue tests including localization coverage, non-overlap, parent reading windows, shared scene state and reduced-motion still).
- Task whitespace check passed.
- Android arm64 assembleDebug succeeded in 49 seconds and installed on Vivo V2432 (10MF7BG5920005F).
- APK SHA256: 4AA0F47738C08698EA721CC4B799AEA5913217CB23D306BA6E12EA4FB4B8F118.

## Physical-device verification — incomplete

First 45-second recording stopped after 7.70 seconds when the active call's proximity sensor switched the display off. Pulled the actual recording, extracted frames/contact sheet and reviewed it: the reel message and more visible child hand appear. The subsequent Hindi capture and a full-sequence retry returned `INVALID_LAYER_STACK` as the display turned off. No call was ended and no proximity protections were bypassed. User was asked to leave the screen on/top sensor uncovered.

Remaining: uninterrupted full-loop English/Hindi recording and frame review; longest-message wrapping and separate parent-turn review; small-screen/large-font and reduced-motion device checks. Do not claim these have passed from TypeScript or rendering success.

Original phone settings read: font_scale=1.0, transition_animation_scale=1.0, physical 720×1600, density300, no display overrides. Settings have not been changed.

Existing unrelated Hindi battery-label missing glyphs remain outside this change. No further polish or next phase is authorized beyond completing this checkpoint's verification and showing the result.
