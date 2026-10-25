# Screen 1 hero: asset quality gate and feasibility

Date: 25 October 2026. Pipeline: `python tools/prepare_mascot.py` (about 25 s, writes `assets/mascot/*` and `docs/mascot-contact-sheet.png`).

## Verdict

**Shipped on derived art, with notes.** The derived rig passed the 2x review at the motion ranges the director actually uses (head turn within 7 degrees, wave -21 to +15 degrees, ear twitch within 8 degrees, gaze 6% of eye width). Two artifacts are visible at 2x only at the rig's extreme limits; the director never reaches them during the loop.

| Check | Result |
| :-- | :-- |
| Neutral reassembly vs source, interior pixels | mean dE76 0.90, 96.4% of pixels under 3 (the rest are resampling noise on crisp edges: eye rims, paw pads) |
| Matte | no cream fringe on dark or light backgrounds; the baked floor shadow is removed (the app draws its own) |
| Blinks (eyelid and squash), sleepy, yawn, curious, cheer squint, gaze left / right | clean at 2x |
| Wave at -18 / +18 degrees | clean; revealed head fur and forearm read as fur, shoulder junction blends |
| Ear twitch 8 degrees | clean after the seam fix |
| Head turn at the 8 degree limit | **faint line** under the left chin (+8) and a small fur tuft above the right shoulder (-8) |

Contact sheet: `docs/mascot-contact-sheet.png`. 2x crops per pose: `docs/mascot-qa/`. Numbers: `docs/mascot-qa.json`.

## What would remove the remaining artifacts

Commission these as layered PNGs, 1254 x 1254, same framing as `buddy_source.png`, transparent background, each part complete including the area normally hidden behind other parts:

1. `head.png`: the full head with no face features, including the chin underside and the area behind the waving paw.
2. `torso.png`: the full body including neck and shoulders hidden under the head.
3. `arm_wave.png`: the raised arm and paw, including the forearm hidden under the cheek.
4. `ear_l.png`, `ear_r.png`: full ears, including the part behind the head.
5. `eye_l.png`, `eye_r.png`: eyeballs without highlights; highlights as separate `highlight_l.png`, `highlight_r.png`.
6. Optional poses: `pose_yawn.png` (open O mouth with paw), `pose_cheer.png`, `pose_sleepy.png`.

Drop them into `assets/mascot/artist/` and re-run the pipeline. The manifest marks them `source: "artist"` and the regenerated `mascotAssets.generated.ts` uses them; no hand-written code changes are needed.

## Unlock gesture

Confirmed 25 October 2026: the real unlock is a free-form capital A swipe (one to three strokes, no dot grid), as recognized by `ShutdownSimulationView.kt`. The hero shows the same gesture. The hero draws a soft trail so parents can see the letter; the real blackout screen draws nothing, so the child sees no hint.
