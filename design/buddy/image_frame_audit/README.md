# Checkpoint A: existing Buddy image assets

2026-11-04, Asia/Calcutta. Asset audit only. No application, timeline or asset pixels were changed. No Blender or image generation was used. Original `design/buddy/buddy_master.png` remains the likeness authority. The user's image-frame direction supersedes all earlier procedural, cutout, Blender and rig instructions.

## Existing locations and readiness

- `design/buddy/`: master, turnaround, expressions, actions, joy, celebrate, eyes-closed, gaze-grid and parts source sheets. Optional buddy_lighting.png was not found here. `extras/buddy_playful_poses.png` is additional existing artwork.
- `design/buddy/_work/matte/`: existing extracted transparent PNGs, including front/3/4/profile/rear, expressions, actions, joy, celebration and master cutouts. No repeat extraction is needed. These are working assets rather than normalized app exports.
- `assets/onboarding/screen1/buddy/`: ten prepared poses, each as @2x and @3x WebP, plus manifest.json. All ten @3x files decode as RGBA480x477 with transparent and partially transparent pixels. Their combined size is309,678bytes (302.4KiB); individual sizes are24-36KiB. The @2x files are320x318. Existing full-body frames are directly reusable. `fur.png` is a shader texture, not a pose.
- `design/buddy/buddy_contact_sheet.png`: previous all-frame contact sheet, already labels normalized app exports and additional cuts.
- `src/onboarding/screen1/buddyImages.generated.ts` and `buddyMetrics.generated.ts`: existing image mapping and normalization metrics. Manifest records106pt head width,160x159pt canvas and155pt sitting baseline. Point-left is already mirrored. Existing color-matching work is documented in the older brief and `_work/colour_report.json`; this audit does not redo it or assert a new color-match measurement against the master.
- Root assets/mascot.png, mascot_body.png and mascot_hand.png are legacy files; not selected. Rendered procedural/cutout/Blender diagnostics are not selected artwork.

## Proposed selection

All filenames below are in `assets/onboarding/screen1/buddy/`. Reuse existing @2x/@3x variants; no new artwork or exports required.

| Story reaction | Exact selected3x file | Source | Approved24s story event | Current code event |
|---|---|---|---|---|
| Watching | buddy_watch_34_left@3x.webp | turnaround top-middle | Reels0-7s |0s, returning10.6s |
| Mild concern | buddy_worried_wavy@3x.webp | expressions bottom-right | Low-battery alert7.6s | Currently4.6s, after paws frame |
| Critical worry | buddy_worried_paws@3x.webp | actions top-right | Critical drain, below10% | Currently3.5s, before wavy frame |
| Yawning | buddy_yawn@3x.webp | actions bottom-left | Power off12.5-14s |5.6s |
| Sleepy / dark rest | buddy_sleepy@3x.webp | actions bottom-middle | Sleepy after shutdown; dark rest14-15.5s |6.2s |
| Surprised | buddy_surprised@3x.webp | expressions bottom-row third | Wake tap15.5s |6.8s |
| Pointing | buddy_point_left@3x.webp | actions bottom-right, already mirrored | Swipe17.2-18.1s |7.15s |
| Celebrating | buddy_arms_up@3x.webp | joy top-right | Unlocked19s |8.1s |
| Waving | buddy_wave@3x.webp | joy top-left | After celebration, before21.5s |8.9s |
| Happy idle | buddy_happy_front@3x.webp | celebrate bottom-right | Rest21.5s, watching returns23.2s |9.8s |

Concern/worry order is a proposal matching the new narrative request. No event timings/order have been edited. Exact transition times within a beat would come from phone events, not an independent Buddy clock.

## Current implementation findings

`app/index.tsx` mounts `OnboardingScreen1`, which creates `useDemoClock`. That clock derives a shared `SceneState` via `sceneAt` in timeline.ts. `buddyTimeline` in tokens.ts supplies named frame events; sceneAt returns frameFrom/frameTo/frameMix. `Scene.tsx` predecodes all ten images before calling onReady, holding the clock until decoded and laid out. `scene/Buddy.tsx` currently draws the image frames through Skia Image nodes, with150ms opacity transitions.

The Screen1 component does **not** import the procedural/cutout/Blender lab renderers. It does currently apply whole-image breathing, sway, scaling, celebration bounce and a relighting overlay, which conflict with the new still-image rules. These would be removed only after Checkpoint A approval. The existing failed-image behavior is to wait indefinitely rather than show a fallback; Checkpoint B should handle this gracefully.

**Timing discrepancy:** FINAL.md explicitly specifies the24s story, superseding the older11s brief. The checked-in current tokens.ts nevertheless sets demo.loop=11 and contains the older phone beat times (battery3.5, shutdown5.5, unlock6.8, unlocked8.1, rest9.8). No active24s implementation was found in the Screen1 route. The contact-sheet labels describe the approved24s narrative, not a claim that the code implements it. This mismatch needs explicit resolution before implementation while preserving the phone story; neither a silent retime nor an11s fallback was made in this audit.

## Visual review and gaps

Reviewed selected_frames_light.png and selected_frames_dark.png. Same uniform canvas scale and manifest baseline are used for every pose; no per-frame resizing, mirroring, matting or color edits were made. No opaque white rectangles or obvious clipped ears/paws were visible. Small pose-dependent changes in head tilt, ear droop and fur lighting remain in the source art. Worry has intentionally drooped ears and clasped paws; it departs most from the upright master silhouette. This is an approval selection, not a claim of exact master equivalence or phone verification.

All requested reactions have suitable existing prepared frames. There is no distinct mild-concern asset: the wavy-mouth worried expression is the closest available choice. The sleepy asset is closed-eye with a closed smile, suitable for dark rest; the existing eyes_closed_smile PNG has an open happy mouth and is less suitable for sleep. No separate asleep export is necessary for the proposed mapping. Avoid celebrate bottom-middle, flagged off-model in the brief. Prepared left-pointing and left-watching assets already face the phone.

`asset_audit.json` records dimensions, alpha information, provenance hashes, normalization metadata and all20 existing WebP variants. `audit_image_frames.py` only inventories and composites existing frames into review boards. No device capture or app test was performed because this checkpoint is asset audit only. App/src/assets diff remained empty.

STOP: awaiting explicit selection approval and resolution of the24s specification versus11s implementation before Checkpoint B.
