# Buddy animation spike — in progress

Static appearance was explicitly approved on 2026-11-03. This folder contains the subsequent head/ear/overlap refinements and animation harness outputs. The approved static checkpoint remains preserved in ../assembly_review/.

## Scope

- Head yaw is clamped at the fitted top-middle turnaround angle (40.34 degrees on the reference side). The other direction is more conservative because the source face is asymmetric. Head width compensation preserves a broad silhouette. A rendered contour check verifies both eyes inside the head, including a clear margin.
- Ears use the full original 277x271 transparent textures with cubic sampling and broad cards instead of sampling head curvature. Width never falls below 96% of the source placement width. No source artwork was regenerated, recoloured or replaced.
- Head boundary has a small source-space feather. Both arm shoulders remain behind the head throughout a lift; source-arm crossfade is preserved without a layer switch. Weighted mesh rotation bends the elbow continuously.
- Motion model: 20-second cycle with breathing, five rendered-image blinks, clamped turn, nod, +/-8 degree tilt, damped ear jiggles, one two-beat elbow wave, one hop with anticipation/stretch/landing squash and a shrinking ground shadow.
- Live lab uses a shared Skia picture driven on the UI thread, rendered at small and large size. Pauses in background; reduced-motion mode holds a neutral still. Recording mode hides lab controls and warnings.

## Verification so far

- Source TypeScript check and 8 focused geometry/motion tests passed. Tests cover oversized-turn clamp, eye contour facing, tilt/turn bounds, one-hop count, closed-eye state and loop continuity.
- Offscreen renders use the same drawing and motion code as the phone lab.
- refinement_metrics.json records actual image-mask measurements, not just parameter values. Regenerate with node tools/harness/run.cjs cutout motion, then tools/.venv/Scripts/python.exe tools/buddy/review_animation.py.
- Final Android review APK built successfully in 2m18s. The local preflight contains 600 exact-clock frames at 30fps; its two contact sheets were reviewed for blink, turn/nod/tilt, arm lift/wave and hop/landing. It was rendered before the last opposite-yaw safety/landing-tail adjustments and remains internal QA only. Final static/keyframe boards were regenerated afterward.
- adb currently reports an empty device list. The user has been asked asynchronously to reconnect the phone. No animation installation, runtime/performance pass or new phone recording has been verified yet. Do not reuse the earlier static diagnostic video as animation evidence.

## Review artifacts

clamped_reference_comparison.png pairs the maximum turn with the top-middle turnaround reference; ears_at_matched_scale.png compares original master ears to the rig; refined_assembly_light/dark.png show the refined poses; motion_keyframes.png samples the exact-clock sequence. They are local harness QA, not phone completion evidence.

The user requested a reviewed 20-second phone recording and final approval checkpoint. That is still required. No onboarding timeline integration is authorized by this folder.

Final rendered eye margins are 27px and 23px at the clamped extremes (3.82% and 3.26% of authored head width). Both eyes are complete; head width/height is 1.124 and 1.136. These are local contour measurements, not whole-character likeness or phone verification. Windows also returned no present Android/Vivo/ADB USB interface when checked, and adb reconnect offline did not restore a device.
