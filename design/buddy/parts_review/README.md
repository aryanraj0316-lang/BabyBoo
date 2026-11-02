# Buddy parts checkpoint

Status: prepared for user review; approval pending. No assembly, runtime rig or screen changes have been made.

## Deliverables

- `parts_light.png`: eight labelled cutouts on #F6F3FF, shown at a common scale.
- `parts_dark.png`: the same cutouts on #1A1A1E.
- `master_part_comparison.png`: each part beside its master crop at matched scale within the pair. Crops include surrounding/occluding parts.
- `edge_review.png`: 4x native-pixel edge inspection on both backgrounds.
- `cutouts/*.png`: eight full-resolution RGBA assets, with 8 px transparent margins.
- `measurements.json`: source rectangles, alpha bounds, pixel dimensions, proposed uniform scales and dimensions relative to head width.
- `alpha_checks.json`: all eight have clear margins and partial-alpha edge pixels.
- `../generated/GENERATION_LOG.md`: prompts, references, output provenance and selection history. Every generated original is preserved.

## Review decisions

Left/right always means viewer left/right.

| Part | Decision | Reason |
|---|---|---|
| Left ear | Retain supplied | Rounded lavender rim, pink interior and lighting follow master. The diagonal inner join tucks behind the head; it is not an exposed fur edge. |
| Right ear | Retain supplied | Same material and pink interior; smaller placement scale follows the master's far ear. |
| Blank head | Retain supplied fix | Broad rounded head and short lavender fur. Blank face is intentional. Source aspect ratio approximately 1.24 matches the master's roughly 1.25 head envelope. |
| Torso | Retain supplied fix | Short rounded torso, lavender fur and soft bottom shading; head overlap/contact shadow belongs to assembly. |
| Left arm | Retain supplied | Palm-facing raised arm, heart pad and four toe beans follow the master's waving hand. |
| Right arm | Replace; select attempt 3 | Supplied arm shows pads but master shows the furry back. Attempts 1 and 2 were too hooked/curved; attempt 3 restores the broad teardrop paw and narrow concealed shoulder. |
| Left foot | Replace; select attempt 1 | Supplied foot was too tall for the seated view. New height/width is approximately 0.97 versus supplied 1.06, closer to the master's roughly 0.95. Three toe beans and heart pad retained. |
| Right foot | Replace; select attempt 1 | Supplied upright circular foot did not match the broad seated perspective. New height/width is approximately 0.80 versus supplied 1.03. Extra inner heel is intended to sit behind torso/arm. |

Colour, lighting and fur were visually compared against the master at matched display scale. The selected parts retain the lavender/pink palette, soft directional volume and visible fur. No numerical CIEDE2000 pass is claimed at this asset checkpoint. Original artwork interiors were not recoloured. Existing gray-background parts use a deterministic soft matte with nearest opaque fur colour extension to remove gray fringe. Generated parts retain their supplied alpha; all generated originals remain unchanged.

## Size convention

H = 706 source pixels, rounded from the existing master silhouette fit's intrinsic head width of 705.452 pixels (ears excluded). It is an approximate fitted reference, not a new subpixel measurement. The sheets pack their parts at different scales, so raw PNG dimensions are not assembly proportions. Review boards use proposed uniform placement scales to make their relative dimensions meaningful.

| Part | Width / H | Height / H |
|---|---:|---:|
| Left ear | 0.374 | 0.365 |
| Right ear | 0.347 | 0.339 |
| Blank head | 1.000 | 0.806 |
| Torso | 0.666 | 0.537 |
| Left arm | 0.445 | 0.514 |
| Right arm | 0.297 | 0.424 |
| Left foot | 0.347 | 0.335 |
| Right foot | 0.382 | 0.306 |

These sizes include the entire part, including overlap allowance, and exclude the transparent margin. They are proposed sizes for approval. Final pose, overlap coverage and any required mesh deformation will be verified only in the next approved assembly/50% overlay checkpoint. This is not a claim that the assembled silhouette already passes the older brief's likeness thresholds.

## Verification and limits

Viewed both final boards, matched-scale master comparisons, and enlarged edge crops. Corrected missing ear interiors, clipped light fur, and gray edge contamination found in early matte passes. Checked all eight RGBA assets have clear margins and partial-alpha edges.

`adb devices` returned an empty device list. Phone recording and extracted-frame review could not be performed; this is a local asset review only. Phone visual verification remains pending, as required by AGENTS.md. No app visual completion is claimed.

Rebuild assets with `tools/.venv/Scripts/python.exe tools/buddy/prepare_cutout_parts.py` using the existing image-processing environment (Pillow, NumPy, SciPy, OpenCV). No new dependencies were installed.

Stop here for the user's parts approval before assembly or rig work.
