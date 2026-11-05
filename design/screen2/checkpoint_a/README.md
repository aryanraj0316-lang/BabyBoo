# Screen 2 — Checkpoint A: asset audit and six candidates

2026-11-05, Asia/Calcutta. Branch: onboarding-screen1-rebuild. **Not integrated or approved for production.** No application code or Screen 1 files changed.

## Existing implementation audit

Native Screen 2 is `src/native/OnboardingSecondScreenNative.tsx`, mounted through `app/index.tsx`. It currently supports editable name entry, name submission/keyboard dismissal, age chips, English/Hindi, Back/Continue/Skip and forwarding name/age to the existing parent callback. Actual age IDs are under_1, age_1, 2_4, 5_7 and 8_10. It uses mascot_body.png plus a separately waving hand, floating idle motion and typing dots. Those systems have not been changed in this asset-only checkpoint.

There is no favourite-colour control, colour field in the Screen 2 return type or progressive friendship card yet. Name/age are local component state; the parent receives them on Continue, but the screen does not accept initial answers when remounted. Back/forward answer preservation therefore needs attention in the later interactive checkpoint. No existing validation, navigation, saved values or profile model was edited here.

`design/ONBOARDING_SCREENS_2_TO_14.md` is absent. The five named screen02_* reference files were not found in the project search. The latest user brief governed this asset checkpoint.

Inspected Buddy master, joy/actions sheets and the existing all-frame contact atlas (including turnaround, expressions, celebration and closed-eye variants), plus the prepared Screen 1 WebPs and its measurement/export code. Existing clasped-paws artwork has closed eyes; worried clasped paws has the wrong mood; neither supplies the requested attentive downward gaze. No existing full-body frame has the required cards or chest badge. Only the approved wave was directly reusable.

Screen 1 already has the approved cream speech bubble. Its component is coupled to Screen 1's scene layout/shared clock; later Screen 2 work can reuse its visual tokens in an interaction-driven wrapper without modifying Screen 1 or importing its demo clock.

## Six candidates

All filenames below exist at both @2x.webp and @3x.webp under `assets/onboarding/screen2/buddy/`.

| State | Filename stem | Source and likeness assessment |
| --- | --- | --- |
| Greeting | buddy_greeting | Exact copies of the approved Screen 1 buddy_wave exports. Warm seated wave, closest existing match to master. No new greeting generated. |
| Name entry | buddy_name_attentive | New, master-referenced. Clasped paws and bowed head; open-eye downward attention is subtle and needs approval. |
| Age selection | buddy_age_ready | New. Blank cream card held low; bowed/attentive face. Frontal card has clear central space for a native age label. |
| Age confirmed | buddy_age_proud | New. More upright/viewer-facing smile and raised blank age card. Difference from ready is restrained rather than dramatic. |
| Colour selected | buddy_colour_badge | New. Blank circular cream disk and paw touching its right edge. Head is bowed slightly; gaze could read as forward rather than clearly at the disk. |
| Completed Friend Card | buddy_friend_complete | New. Both paws hold a larger blank cream card, with a broader delighted smile. Central card area remains clear. |

Five built-in image_gen calls, one per missing pose, no automatic regeneration rounds. The original master was attached to every call. Full prompts: `generation-prompts.json`; original tool paths: `generation-sources.json`; all five untouched generated PNG originals are preserved in `generated/`. Built-in mode used; no API/CLI fallback, Blender, meshes, rigging or procedural character drawing.

**Likeness assessment:** all five new candidates retain lavender plush fur, black glossy eyes, pink cheeks/inner ears, rounded paws, heart pads and three toe beans per foot. No eyebrows, nose, star, human fingers or baked user data were observed. They are more frontal and slightly paler than the approved wave; head/ear silhouette and lighting are close, not pixel-identical to the master. The bowed-head poses have higher-looking foreheads and subtle gaze cues. These are review candidates, not an assertion of exact likeness.

## Preparation and actual checks

- `tools/screen2/prepare_frames.py` reuses the existing Screen 1 measurement and premultiplied resampling helpers without calling its export or modifying its assets.
- Shared 160×159pt canvas, estimated 106pt head width and 155pt seated baseline. 2x:320×318; 3x:480×477. No generated source was enlarged. Greeting is copied byte-for-byte at both densities.
- Twelve transparent WebPs total about 335KiB; each 3x frame is 34–38KiB. Manifest includes source hashes, transforms, dimensions, bytes, transparency counts, visible bounds and blank-prop bounds in canvas points.
- Reviewed `contact_sheet_light.png` and `contact_sheet_dark.png` at identical display scale. Visible ears, paws, feet and props fit inside the canvas. No obvious white rectangular background, hard white halo, stretch or clipped visible fur at the inspected scale. Raw generated alpha has faint residual pixels below opacity8/255; these can reach canvas edges, while all visible-alpha bounds above that threshold remain inside. No fur recolouring, facial edits or pose warping was performed.
- Both cards and the chest disk remain blank. No child name, age or selected colour is baked into any frame.
- No app tests/build run: no app code changed. No new-artwork phone test is claimed. A read-only baseline-phone audit was attempted but skipped because BabyBoo was not the foreground app; no other app was navigated or recorded.

## Proposed dynamic information approach — not implemented

Use native Text/View overlays positioned in the blank card's measured central safe area, in the same normalized image container. Keep age/name/colour as real localized application data. Cards are nearly parallel to the camera, so readable overlays should not need perspective-warped text. Long names and larger accessibility text must be checked at Checkpoint B/C; keep the full native Friend Card/form summary readable if the held-card preview becomes too small.

For the chest disk, tint only a static alpha mask of the blank cream surface; preserve the furry paw and rim above it. A full circle painted over the whole image would cover the paw and is not proposed. No separate images per child/age/colour and no procedural body drawing are needed. Blank-prop measurements in manifest.json are preliminary positioning aids, not approved final overlay geometry.

STOPPED at Checkpoint A. Await explicit approval of the six-pose set before Checkpoint B's static Screen 2 integration. Interactive wiring, colour input, answer preservation and dialogue are Checkpoint C work after B approval.
