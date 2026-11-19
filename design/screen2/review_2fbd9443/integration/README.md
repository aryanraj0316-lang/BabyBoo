# Approved clip integration

User approved using `gemini_generated_video_2fbd9443.mp4` despite the previously documented forward-facing gaze.

- Original video stays unchanged in Downloads; SHA-256 is in preparation.json.
- `tools/screen2/prepare-video-2fbd9443.py` removes green outside the mascot, protects the enclosed pen/card and registers planted feet. No facial or pose edits, synthetic frames, stretching or new art.
- Transparent WebP: 480x477, 240 frames, approximately10s, 7.60MB. All240 alpha bounds checked: no clipping, baseline spread1pixel.
- Native `VideoWritingBuddy` uses the existing Skia animated-image decoder with a shared frame callback. Begins after first nonblank name input with keyboard visible, pauses on keyboard dismissal/submission/background and holds the final frame instead of looping ink away. Reduced motion/load failure uses a still from the same video.
- No old procedural pen/eye/arm compositor, no new native package, no other screen edits.
- Reviewed keyed contact sheet on light/dark backgrounds and decoded first/middle/end frames. TypeScript and10 Screen2 tests passed. Android bundle result recorded in HANDOFF.
- ADB has no connected device. No real device screenshot, playback verification, installation or OTA claim.
