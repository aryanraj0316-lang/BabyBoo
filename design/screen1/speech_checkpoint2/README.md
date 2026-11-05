# Contextual Buddy dialogue — Checkpoint 2

2026-11-05, Asia/Calcutta. Branch: onboarding-screen1-rebuild. Checkpoint 1 approved by user; remaining dialogue and a slightly brighter child hand authorized. Latest follow-up requests a longer sleepy pause: two seconds added before the parent turn, extending the loop from 24 to 26 seconds.

## Implemented

Seven localized English/Hindi turns derive from the existing `useDemoClock → sceneAt` state. The pure `dialogueAt` lookup supplies one message ID and opacity; the native bubble updates text only when that ID changes. No second clock, timer or Buddy animation. Adjacent turns fade through over 150ms total, without overlapping text layers. Reduced motion shows the existing composed still with a fully visible success message. Pointer events pass through the bubble; text uses the existing system font family and font-scale cap.

| Existing story moment | English copy | Bubble window (seconds) |
| --- | --- | --- |
| Reels | Just one more reel? | 0.70–5.30 |
| Battery drain | Uh-oh, battery's dropping! | 9.00–12.15 |
| Shutdown | Time's up! | 12.50–13.60 |
| Sleepy | Nap time... Zzz | 13.60–16.80 |
| Parent hand-off | Parents, it's your turn! | 16.80–18.55 |
| A gesture | Draw an A to unlock! | 18.55–20.85 |
| Unlocked | Yay! You did it! | 21.00–23.80 |

The two parent messages are separate turns. The parent hand-off leads the visible prompt by 0.7 seconds and lasts 1.75 seconds; the A instruction starts 0.4 seconds into the A stroke and lasts 2.3 seconds. Quiet intervals, including 23.8–26.0 and the first 0.7 seconds, prevent dialogue crowding at the seam.

Child reel-hand opacity increased from 0.66 to 0.78 for slightly more visible pink/cuff colour. Adult hand unchanged. The latest authorized timing change extends Buddy's sleepy frame from 1.9 to 3.9 seconds and the nap bubble from 1.2 to 3.2 seconds. The parent prompt/A/unlock/ending all move two seconds later together, preserving their durations. Battery/reels/shutdown, Buddy artwork/rendering, background artwork, layout, primary copy, navigation and other screens remain untouched.

## Checks completed (latest longer-sleep build)

- TypeScript app check passed.
- 21 Vitest checks passed (13 timeline, 5 layout, 3 dialogue tests including localization coverage, non-overlap, parent reading windows, shared scene state and reduced-motion still). Timing checks now assert the extra sleepy interval and that the entire parent message occurs with lockVisible=1, lockOpacity=1, feedOpacity=0 and dim=1.
- Task whitespace check passed.
- Android arm64 assembleDebug succeeded in 43 seconds and installed on Vivo V2432 (10MF7BG5920005F).
- APK SHA256: 69D167D68B4F609F36F3AE8591AD8CB97656526B752D0E4636B13849C77FA97E.

## Physical-device verification — completed

The display remained available for the latest captures. Actual ADB recordings were pulled and extracted into contact sheets; the English and Hindi story sequences, loop seam and full-size key screenshots were reviewed. Debug controls are hidden.

- English recording: 45.073 seconds. Hindi: 40.021 seconds. Both include a full 26-second story. All seven localized turns appear, with no overlapping messages. Parent hand-off is visible on the black screen, then the separate A instruction, then success. The longer nap and brighter child hand are visible.
- `review/phone-loop.mp4`: 26.5-second English excerpt from the actual physical-phone capture, 720×1600, no synthetic frames or mockup. This includes one complete story cycle.
- `review/parent-screen-off.png`, `longer-nap.png`, `hindi-parent-screen-off.png` and `hindi-draw-a.png`: unchanged full-size frames extracted from those recordings. Bubble stays above Buddy/right of phone, with no face/phone/headline/CTA/toggle overlap in the reviewed captures.
- Small-screen/large-font check: temporarily used density360 on the 720px phone (320pt width), font_scale=1.3. Reviewed the 40-second English recording/contact sheets and full-size `large-font-parent.png`: all seven turns wrap inside the bubble without covering main UI. Existing composition shrinks the phone/Buddy group to accommodate enlarged main text. Hindi was verified at the normal device size, not at the combined small/large-font setting.
- Reduced-motion check: transition_animation_scale=0, same small/large-font setting. Reviewed eight seconds of recording/contact sheet; home screen, waving still frame and success bubble remain stationary. `review/reduced-motion.png` records that state.
- Original settings restored and read back: font_scale=1.0, transition_animation_scale=1.0, physical density300 without override. App relaunched in English. No fatal exceptions or ReactNativeJS errors found in the checked recent log window.

Raw captures and repeated contact-sheet pages remain local. Selected evidence is committed with this checkpoint. No other physical phone model was tested.

## Earlier capture blocker — resolved

First 45-second recording stopped after 7.70 seconds when the active call's proximity sensor switched the display off. Pulled the actual recording, extracted frames/contact sheet and reviewed it: the reel message and more visible child hand appear. The subsequent Hindi capture and a full-sequence retry returned `INVALID_LAYER_STACK` as the display turned off. No call was ended and no proximity protections were bypassed. User was asked to leave the screen on/top sensor uncovered.

Existing unrelated Hindi battery-label missing glyphs remain outside this change. Checkpoint 2 and the requested longer pause are complete; STOPPED for user review. No further polish or next phase started.
