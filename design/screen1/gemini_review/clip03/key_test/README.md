# Clip03 background-removal proof

Completed 2026-11-18 11:30 +0530. User explicitly instructed the agent to perform the test without asking them to take actions. Scope: isolated video asset proof only; app untouched.

Result: KEEP Clip03 as a viable candidate for compositing. Green background, disconnected moving sparkles, external watermark and baked floor shadow disappear in the reviewed four-second sample. No conspicuous holes in eyes/mouth/paws or cropped ears in reviewed samples. A slightly harder silhouette/faint light edging remains visible when enlarged, especially against charcoal. Fine fur wisps are partly lost; this is not a claim of perfect hair matting or unchanged original master likeness.

## Outputs
- light_dark_preview.mp4: four-second silent H264 comparison, source interval1.0-5.0s at24fps. Both panels show the same footage over #F6F3FF/#1A1A1E. Fixed crop and scale; labels are review UI, not intended app content.
- buddy_alpha_proof.mov: actual alpha export, ProRes4444,1280x720,24fps,96frames,4seconds. Editing/intermediate format only, NOT a tested Android playback asset.
- alpha-*.png: seven RGBA sample frames, source timestamps in filenames.
- encoded_preview_contact.png: six samples decoded from the actual MP4 and visually reviewed.
- contact_sheet.png/comparison-*.png: direct compositing diagnostics.
- decoded_alpha.png: alpha plane decoded from the actual MOV, not a checkerboard claim.
- checks.json: source hash,96frame assertions and actual-alpha validation.

## Method and verification
Single correction/render pass using tools/buddy/test_gemini_key.py. Green-dominance matte, largest lavender body silhouette, filled opaque interior, limited edge band, edge-only screen unmix. Removes disconnected background effects without repainting/regenerating Buddy. Face/body interior raw RGB asserted identical to decoded source before codec export on96/96frames; opaque-eye/mouth holes prevented by the filled body interior. ProRes is a lossy colour codec; do not extend that exact pre-encode pixel claim to encoded video colours.

Original source SHA256 rechecked unchanged. ffprobe confirms actual alpha-capable decoded pixel format yuva444p12le,96frames/4seconds, noaudio. Extracted alpha has min0,max65535 and41distinct values, confirming real non-binary alpha. The encoded MP4 decoded96frames successfully; six encoded samples plus full-size yawn composite visually reviewed. Seven direct timestamp samples cover worry, paw lift/yawn, transition and sleep. No visible external sparkles or green rectangles in those composites. Frame assertions are processing invariants, not proof of perfect edge quality or every uninspected frame.

ADB devices -l returned an empty device list. No physical-device recording/screenshot possible this milestone; do not imply Android playback or app integration verified. No requests made for the user to connect/unlock a phone. No TypeScript/build changes/checks applicable. No Screen1 code, timeline, navigation, other screens or originals changed.

Limitations: only source1-5s tested, no full10s key/26s assembly or joins. Existing generated grey-lavender/material/pose differences remain. Source screenshot framing has not been registered to the app160x159canvas. Silhouette key can lose fine fur and could fail if future decorations overlap Buddy; do not assume other clips key identically. Later app delivery codec/alpha/performance and phone preview remain separate work. Do not generate more clips or integrate automatically at this proof checkpoint.
