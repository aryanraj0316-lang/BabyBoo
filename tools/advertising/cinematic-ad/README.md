# BabyBoo cinematic pre-booking film

New source project; rejected12-second Pillow edit is not reused as a composition.

## Deliverables

-15s /450frames /30fps /1080x1920 H.264 yuv420p,24Mbps CBR target, no audio.
-1080x1350 centre crop (portrait y285..1635), same duration/codec/bitrate.
-Last-frame PNG, portrait and4:5 crop, plus2x master still.
-`beats.json`: major transition, reveal and hit times for adding audio.
-Half-second contact sheet, safe-zone audit and encode checks.

## Run

Node24+, ffmpeg on PATH. `npm ci` inside this folder. Playwright1.58.2 and GSAP3.14.2 are pinned in package-lock.json. `npx playwright install chromium` if a compatible browser is not already installed. Optional `AD_BROWSER` selects a locally installed render-only Chromium executable. It never connects to your personal browser/profile.

The included extracted assets make the source package render-ready. To regenerate assets in the original BabyBoo repository: `python prepare-assets.py` (Pillow and NumPy required). The original header animation must remain at `public/buddy-idle-loop.webp`; the typeface is the existing self-hosted `public/fonts/nunito-variable.ttf`.

`node render.mjs --stills --quick` renders4keyframes.

`node render.mjs --preview` serves the composition for inspecting code.

`node render.mjs` renders both MP4s frame-by-frame. Optional `AD_OUTPUT_DIR` changes output directory; default is repo `design/prebooking/cinematic`.

`window.renderFrame(n)` is the only time source. GSAP is paused and sought to n/30; dust/grain seeds and all transforms are deterministic. No live timer, CSS animation, random wall-clock value or browser video decoding is used. Each render is captured at2160x3840 then ffmpeg downsamples with Lanczos. Intermediate frames are JPEG100 at2x to avoid retaining gigabytes of scratch PNGs; the final still is lossless PNG. Encode uses x264 CBR24Mbps with HRD filler, not merely a container bitrate tag.

## Exact asset constraints and editorial choices

-Buddy uses exact original transparent header animation poses, sampled every other source frame. No new face, redraw, head replacement or generated character pose.
-12distinct poses/sec at30fps uses2/3frame holds. Literal2frame holds would be15poses/sec;12fps/on-twos is literal at24fps only.
-The exact header animation has waves, head movement and blinks. It does not contain a sleepy yawn or arms-raised celebration. Those poses are NOT synthesized; room light, a crescent and sparkles carry those beats. Last1.5seconds hold the CTA/mascot composition for screenshot use, with grain/atmospheric accents retained.
-Whole-bitmap1–2px jitter, tiny rotation and<0.4% squash/stretch are applied as explicitly requested. No individual body-part deformation.
-Existing homepage logo is a text wordmark, BabyBoo in Nunito900. There is no separate approved logo image in this repo. `assets/logo.png` rasterizes that existing wordmark; no invented symbol/punctuation.
-Feature wording uses actual site behaviour: screen-time limits, calmer goodbyes and parent control. No fake availability date, app-store listing, reservation count or performance promise.
-No live URL baked in. End card says Link in bio. Pre-booking remains a free launch-notification reservation, not a payment.
-Source Buddy is640x636.2x composition rendering improves graphics/glow edges but does not invent additional fur detail.

## Typography / framing

Nunito heavy rounded typeface; headlines120–145px (CTA130px), feature/support copy40px or larger. Critical portrait elements sit in x60..1020,y250..1580. Camera push/parallax is restricted to atmosphere so safe text does not drift out of frame. Whole-picture camera motion on text would violate the fixed Instagram safe frame.

The4:5 version is an actual centre crop; its safe placement is checked separately by comparing all portrait critical boxes against y285..1635. No content is stretched to change aspect ratio.

## Review

Render checks browser errors, critical DOM bounds and fonts. Review encoded MP4 contact sheet at0.5s intervals, final still, source pose IDs, no clipping, codec/dimensions/fps/bitrate, absence of audio and full decode. See `design/prebooking/cinematic/quality-report.json` for checks actually completed. Do not interpret this README as proof a check has run.
