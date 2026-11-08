# Screen 2 — four-frame likeness review

2026-11-08, Asia/Calcutta. User explicitly chose: **forward eye highlights match the master; highlights are lowered when Buddy looks down.** These candidates implement that resolved rule as whole-body images, not separate app eye patches.

| File in `frames/` | Purpose |
|---|---|
| `01_greeting.png` | Greeting before the name input focuses. Exact reuse of Screen 1's wave, unchanged. |
| `02_focus_down.png` | Name field focused, including empty input and typing pauses. Lowered highlights stay inside the black eye outlines. |
| `03_write_down.png` | Small writing-paw/pen variation for actual typing; the downward face remains. |
| `04_forward.png` | Keyboard dismissed or Go pressed; also reused while choosing age and after selection. Master-style upper highlights, not centred white circles. |

`all_frames.png` labels the full set and contains enlarged rendered eyes. `eye_comparison.png` compares the original master and the three new frames at a similar eye scale. Individual transparent PNGs and optimized 2x/3x WebPs are in `frames/`. Full source originals are preserved at:

- `design/buddy/generated/buddy_screen2_v3_forward-original.png`
- `design/buddy/generated/buddy_screen2_v3_focus_down-original.png`
- `design/buddy/generated/buddy_screen2_v3_write_down-original.png`

Generated with built-in image_gen, one call per new frame, no retries. Master is the identity/colour/lighting authority; the previous note-taking candidate supplied pose information only for the first frame. The two down frames were derived successively from that brighter forward frame. All exact prompts in `generation.json`, export/registration measurements and source hashes in `manifest.json`.

Checks completed: visually inspected all three original outputs, the complete four-frame contact sheet and master/eye close-ups; greeting WebP copied unchanged; all frame visible bounds remain inside the common 160x159pt canvas, head width target106pt and baseline155pt. Three new frames share the forward frame's registration. No face patching, distortion, recolouring, automatic relighting or image regeneration during preparation.

**Remaining limitation:** the generated derivatives are not pixel-identical outside the edited areas; the writing pair retains a slight shade/texture difference. The fur median measurements also show differences: master L*73.47, forward74.59, focused77.23, writing79.92 (whole-fur masks across poses, not a perceptual guarantee). The new images look lighter than the rejected darker pose; exact colour/likeness approval remains with the user. This set is not yet proven to animate smoothly; the frames alone are an art review.

No app integration, native build or phone installation was performed. No TypeScript/application behavior changes in this milestone; no claim of device verification for these images. No Screen 1 assets or other screens were modified. The phone still contains the earlier rejected preview build. STOP for visual approval before any integration or animation work.
