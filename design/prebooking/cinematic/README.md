# BabyBoo cinematic ad — delivered

New15-second HTML+GSAP/Playwright composition. Rejected12-secondPillowedit remains separate.

## Files

- `BabyBoo_Prebooking_Cinematic_1080x1920.mp4`: portrait15s/30fps/450frames/H.264/yuv420p/no audio,23.95Mbps measured.
- `BabyBoo_Prebooking_Cinematic_1080x1350.mp4`: actual4:5centre crop,24.16Mbps measured, same timings.
- `last-frame.png`:1080x1920 lossless final frame; `last-frame-4x5.png`:1080x1350; `last-frame-2160x3840.png`: supersampled master still.
- `beats.json`: major hits/reveals/transitions for independent audio production.
- `BabyBoo_Cinematic_Ad_Source.zip`: portable source including extracted exact mascot poses, wordmark/font/grain assets, dependency lock and render scripts. Generated archive is ignored in git; editable source lives at `tools/advertising/cinematic-ad/`.
- `contact-sheet-0.5s.jpg`: all30 half-second samples, visually reviewed.
- `quality-report.json`: actual ffprobe/decode/DOM safe-zone/source-pose checks.

## Review and scope

Reviewed all30 decoded half-second samples and final4:5still. No clipped critical text or mascot found in the sampled frames. Safe-zone check: all30 samples inside portrait x60..1020/y250..1580; actual critical content also fits the4:5centre crop. No browser errors. Bothfilesfullydecoded without error. No audio track. All180sourceposealpha bounds are unclipped; sourceWebPhash unchanged.

Two observed preview issues were fixed before the full render: gradient words were invisible under3D transforms, and transition bounds crossed a safe margin. First encode carried full-range yuvj420p metadata; colour-range conversion produced the required yuv420p files and the source renderer was corrected. No changes to app/onboarding/site.

Strict source preservation means no new sleepy-yawn/arms-raised poses: original home-header animation contains waving/head movement/blinks. Lighting, moon and sparkle graphics carry those requested story beats.12distinctposes/sec at30fps requires alternating2/3frameholds; exact2frameholds would be15poses/sec. Whole-image jitter/wobble/squash only, as requested. Last1.5seconds holds the CTA and mascot composition, with grain/atmosphere retained. Existing homepage BabyBoo text wordmark is reused; no standalone approved logo image exists in this repository. No invented release date/publicURL.

Graphics are rendered2160x3840 and Lanczos-downsampled. Source Buddy detail remains that of the existing640x636 animation; higher export resolution does not create new fur detail. No claim of matching another brand's production quality or numerical visual-similarity score.

Desktop delivery: `C:/Users/LENOVO/Desktop/BabyBoo_Cinematic_Ad/`.
