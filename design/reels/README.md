# Screen 1: supplied videos and slower phone story

Updated2026-11-05, Asia/Calcutta. Work only on Screen1. The user's subsequent requests explicitly supersede B1's11-second timing freeze: slow the entire flow, show a prominent full-screen battery drain, draw a literalA to unlock, then refine that A to be more freehand and keep the battery vertical.

## Current implementation

- Five user-supplied Desktop videos: husky, waterfall, palms, hiker, gaming. Existing design/reels/source copies are SHA-256 identical to the Desktop files; see media-report.json. Originals remain outside the app bundle and Git.
- tools/reels/encode-screen1.ps1 makes silent3s previews from source seconds1-4,540x960,30fps,H.264main,faststart, plus JPEG fallback posters. Five MP4s total1,394,282bytes. No dependencies added.
- VideoReel.tsx resolves bundled files through the already-installed expo-asset and renders actual video through installed Skia useVideo. Feed only mounts current/next decoders. Playback pauses when hidden/backgrounded; reduced-motion uses still posters. Failed file resolution retains its poster. Existing reel UI and phone clipping are retained.
- Existing shared story clock remains the sole controller for the phone and Buddy image events. Loop24s; reels about1.5s each; battery alert7.6s; full-screen takeover8.3s; steady20%-0% drain9-12.4s; shutdown12.5s; dark rest13.5-15.5s; freehandA16.15-18.25s; fade into home through19s; celebration/wave, then rest21.5s; return23.2-24s.
- BatteryTakeover.tsx: vertical rounded housing/top cap, full-phone dark gradient, amber-to-red liquid with subtle moving surface, large percentage and localized label. The final user request restored vertical orientation after an intermediate horizontal version.
- UnlockGesture.tsx: two authored irregular cubic finger strokes, rounded up/down main stroke, pen lift and uneven/slanted crossbar. Native path trimming and contour measurement keep the touch dot on the visible stroke. Phone stays dark until theA completes. No hand artwork or new gesture clock.
- Buddy remains the10 approved preloaded still images from B1; no added character transforms or relighting. Layout, headline, subline, CTA, language control and navigation are preserved. No other screen, legacy mascot file or Blender source changed.

## Checks actually run

TypeScript: `node node_modules/typescript/bin/tsc --project tsconfig.app.json --noEmit`, passed. Timeline/layout:17 tests passed. Updated tests verify readable reel holds, monotonic battery depletion, and that the screen stays dark untilA completes. Whitespace check passed.

Android final vertical/freehand version: `gradlew.bat :app:assembleDebug -PreactNativeArchitectures=arm64-v8a --console=plain`, successful3m13s; installed viaadb on VivoV2432. APK SHA-256: `AF998D7697E9D861AE990CE537007A20A0C4758C012C104EF24A89D559E51D8C`.

Earlier versions were recorded on that device: allfive videos playing,24-second story, battery countdown, letterA and stationary Buddy were visible in reviewed contact sheets. Those captures are preserved locally under device_review, slower_review and final_review. They do **not** show the final vertical/freehand refinement.

## Current device verification status

Final capture attempt failed `INVALID_LAYER_STACK`. Diagnostics: MainActivity is resumed, wakefulnessAwake, `mProximityPositive=true`; physical display remains off. Two wake attempts/screenshots returned black. No JavaScript fatal error appeared in the checked log window. User was asked to place the phone face-up and uncover the earpiece sensor. No call was ended or device settings altered.

Latest appearance remains **unverified** until the sensor clears and a fresh recording is extracted/reviewed. Planned final evidence folder: design/reels/review/. Do not present earlier captures as proof of this final refinement. Stop after delivering the final verified preview for user approval; do not extend to another phase.
