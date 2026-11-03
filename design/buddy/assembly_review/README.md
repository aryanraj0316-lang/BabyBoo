# Buddy static assembly: handoff

Updated 2026-11-03. Branch: `onboarding-screen1-rebuild`.

Status: static assembly and face-projection diagnostics were recorded on the phone and their extracted contact sheets reviewed on 2026-11-03. See `recording/20261103-203519/README.md` for the video, stills and remaining differences. **User approval of the appearance is pending.** No new Buddy integration into onboarding screen 1 has been made. Animation is the next phase after this checkpoint is reviewed and approved.

## Recovered user decisions

The previous project session contains explicit parts approval on 2026-11-03 at 08:55 UTC. Its next task was:

- Correct head height/width from approximately 0.806 to 0.856 with vertical mesh stretch.
- Mirror the right resting arm for the left resting state, and the left raised palm for the right raised state. Neutral has both arms down. Blend artwork around shoulder height in the later moving rig.
- Check the right foot against the master overlay; regenerate only if it reads wrong there.
- Use rendered eyes, mouths and blush. This updates the earlier live-coded-face direction for this checkpoint.
- Place facial textures on the head's ellipsoid surface so turn, nod, roll and squash deform them with the head; fit the far/near eye size ratios from the top-middle turnaround reference.
- Show the master-matching pose (left arm raised), its 50% master overlay, the both-arms-down neutral pose, a head diagnostic strip and a 3/4 reference comparison. Stop for approval before animation.

The later request to avoid questions did not supply visual approval of these assembly renders. The current project instructions explicitly retain checkpoint approval gates.

## Files to review

| File | Purpose |
| --- | --- |
| `assembly_comparison.png` | Master, assembled master pose and 50% overlay |
| `overlay_50.png` | Full-resolution master/assembly blend |
| `neutral_on_light.png` | Sitting pose with both arms resting |
| `face_parts_review.png` | Rendered face parts on light and dark backgrounds |
| `face_projection_strip.png` | Turn -1 through +1, nod, tilt +/-8 degrees and squash |
| `three_quarter_comparison.png` | Reference and projected 3/4 head |
| `right_foot_overlay.png` | Enlarged right-foot alignment inspection |
| `assembly_metrics.json` | Existing OpenCV eye-ratio measurements |
| `validation.json` | Resume-session checks and raw render hashes |

`device_check.png` is an old launch troubleshooting capture, not phone verification evidence. The valid cutout recording and contact sheets are in `recording/20261103-203519/`.

## Implementation and limits

`src/onboarding/screen1/buddy/cutout/` contains the shared Skia textured-mesh renderer, pose model, focused tests and isolated dev lab. `tools/harness/renderCutout.ts` renders the same drawing code offscreen. The route is `babyboo://dev/buddy-lab?cutout=1`; add `record=1&shot=review` for the control-free diagnostic slideshow. The slideshow switches static poses; it is not the requested smooth animation spike.

The model uses a head aspect of 0.856, a 1.061745 vertical stretch relative to the approved source. Existing pixel measurements report far/near eye width 0.495575 versus reference 0.499567, and height 0.954027 versus reference 0.953530. These ratios alone do not establish overall likeness. The OpenCV measurement script was not rerun during resume because the Python executable was inaccessible.

Local visual review on resume covered the assembly/overlay, neutral pose, face parts, head diagnostic strip, 3/4 comparison and enlarged right foot. Remaining differences are visible: the head boundary is harder than the master's soft fur edge, the raised arm overlaps the head differently, and the 3/4 head/ears do not reproduce the reference silhouette. The right foot has similar outer coverage but its pad positions and slant still differ; no regeneration was performed during resume. No silhouette IoU, colour threshold or phone-performance pass is claimed.

Arms currently interpolate placement boxes and crossfade resting/raised artwork. Smooth elbow deformation, breathing, blink playback, ear jiggle and hop/landing are not implemented in this cutout lab. Extra mouth/closed-eye textures are prepared but not animated. Do not describe this checkpoint as the completed rig spike.

## Resume verification

- `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json`: passed. This config covers `src`; it is not a full app-route build.
- `node node_modules/vitest/vitest.mjs run src/onboarding/screen1/buddy/cutout/model.test.ts`: all four tests passed.
- `node tools/harness/run.cjs cutout`: passed; regenerated both full poses, ten head diagnostics and head-aspect render.
- Compositing the regenerated master and neutral PNGs over their saved review backgrounds exactly reproduced `master_pose_on_light.png` and `neutral_on_light.png`: maximum channel difference 0 for both.
- SDK directory access is denied in this session. Both PATH-based adb lookup and the previously used absolute adb command failed. Device connection state cannot be determined here.
- `tools/.venv/Scripts/python.exe` cannot reach its base interpreter because access is denied. Existing Python-produced review boards and measurements are preserved.

## Exact next work

The SDK access, review build and phone capture blockers listed below were resolved using approved escalation on 2026-11-03. The recording README describes the exact successful steps. The remaining next action is user review of the static assembly appearance.

1. Review/refine the remaining local likeness differences without changing the screen 1 timeline or other screens.
2. In a session with Android SDK access, finish the debug review build and verify that it loads this renderer. The previous installed standalone debug APK showed old artwork; opening its deep link was not sufficient.
3. The prepared build command, from `android/`, is `.\gradlew.bat :app:assembleDebug -I ../tools/buddy/review-build.init.gradle -PreactNativeArchitectures=arm64-v8a --console=plain`. Its successful completion and installation have not been verified. The init script enables dev routes only for this review bundle; production settings were not edited.
4. Open the isolated lab in record mode, record with adb, pull the video, extract frames/contact sheets and inspect them. Keep debug controls hidden. Do not substitute a desktop render for phone evidence.
5. Commit task-related checkpoint files when Git writes are available, then present the static assembly checkpoint for explicit approval under root `AGENTS.md`. Preserve unrelated `.claude/` content.
6. After approval, proceed with the limited Buddy Lab animation spike. Keep the new Buddy out of the onboarding timeline until its look is approved.

The earlier session could not write `.git`. Approved escalation restored Git staging for the reviewed checkpoint.
