# Buddy Screen 1 — Gemini animation handoff

Prepared from the actual current Screen 1 image mapping and 26-second timeline on 2026-11-18. No new mascot artwork was generated; no app code, layout, timeline or other onboarding screen was changed. This is an external-generation reference package, not an animation already integrated or verified in the app.

## What to give Gemini

1. Open `upload/`. Upload `00_buddy_master.png` and the ten numbered pose PNGs. The PNGs are lossless format conversions of the app's 3x WebPs: same 480x477 pixels, alpha and shared registration. The master is an unchanged copy of the original and has its original pale background; use it for identity, not background extraction.
2. Open `GEMINI_PROMPT.txt`, copy all of it, and paste it into your video-generation conversation. It explains identity, plush rendering, exact story, timings, expressions, the offscreen phone, clean compositing, continuity and export requirements.
3. If the uploader limits how many images you can attach, use the master plus `contact_sheet.png` for the whole story, then attach only the relevant individual poses for each of the five segments listed in the prompt. Always carry the same master/identity instructions into every segment. Do not assume the tool reads ZIP files; extract first and upload actual images.
4. Ask it to state its real duration/background/export options. The requested 26-second length and alpha formats are targets, not claims about what your current Gemini tool supports. The prompt includes a five-clip fallback and uniform-green fallback when true alpha is unavailable.
5. Keep the original full-quality downloads. Send the resulting clip(s), any hold-pose stills and the actual duration/FPS/dimensions/background information back to the developer. Avoid screen recordings or messaging-app recompression.

## Files

- `GEMINI_PROMPT.txt` / `.md`: identical detailed prompt, plain text and readable Markdown.
- `upload/`: 11 images — master plus the ten actual app frames, numbered in story order.
- `contact_sheet.png` / `contact_sheet_dark.png`: labelled pose/timing reference on light and dark backgrounds. These are not output-animation layouts.
- `source_webp/`: all 20 original 2x/3x app WebPs, copied without modification. You normally upload the PNGs, not these duplicates.
- `frame_guide.csv`: filename, purpose, actual interval and source path for each pose.
- `screen1_timing.json`: resolved numeric phone, Buddy and dialogue timings from the current TypeScript data, not the older 11/24-second drafts.
- `asset_manifest.json`: source paths, hashes, decoded-pixel equality, dimensions, alpha bounds and intervals.
- Adjacent archive: `../Buddy_Screen 1_Gemini.zip` contains this complete handoff.

The actual Buddy intervals are: watching 0–7.6; mild concern 7.6–10.5; paws-near-chest worry 10.5–12.7; yawn 12.7–13.6; sleepy 13.6–17.5; surprise 17.5–18.15; point-left 18.15–21; arms-up 21–22.2; wave 22.2–23.5; happy rest 23.5–25.2; watch/reset 25.2–26. Battery drains 5% to 0% from 9–12.4s; parent A gesture 18.15–20.25s. Parent dialogue starts 16.8s while Buddy is still sleepy and the phone is off.

## Review before handing the animation back

Confirm that Buddy remains the same character: lavender/plush texture and soft 3D volume; unchanged face/eye construction and master-style white reflections; no added nose/eyebrows/teeth/human fingers; correct paws/beans; no floating limbs, cropped ears, scale/colour drift or flickering fur. Check that the phone is to Buddy's VIEWER LEFT, the point is not mirrored again, and the video contains Buddy only with no UI/text/background scene. There must be a long sleepy pause and a clean return to the first watching pose.

An MP4 without an alpha channel is not transparent; a checkerboard baked into pixels is not transparency either. If true alpha is unavailable, a flat clean chroma background is preferable to a generated meadow or phone scene. Preserve full fur detail and avoid green spill.

Slowing, trimming and freezing can adapt timing. They cannot reliably repair a different face, inconsistent fur, clipped paws or missing animation. Reject those generation problems before spending time on integration. Final codec/background removal/performance and synchronization will be reviewed against the actual returned files; no replacement has been made yet.

## Reproduce and verification

Run `node tools/buddy/export_gemini_timing.cjs`, then `tools/.venv/Scripts/python.exe tools/buddy/package_gemini_handoff.py`. The packager verifies 10 PNGs against the decoded app pixels, all 20 copied WebP hashes and the master hash, alpha/canvas bounds, contiguous 26-second intervals and ZIP CRC/content integrity. The contact sheets must also be visually reviewed. No new phone recording is needed for these copied reference files; this package makes no new claim of a rendered/installed animation or device visual approval.
