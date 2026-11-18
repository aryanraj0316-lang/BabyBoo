# Screen1 reviewed-clip integration

Verified 2026-11-18 14:05 +0530. User authorized finishing Screen1 except missing Clip05, full phone checks, then an OTA publish. Later instructions take priority: GetStarted is visible immediately; use1full+.6partial scroll before the reaction; battery3% to0%; shortened21.5s loop with native-speed source animation; natural detailed ground shadow.

## Result
Four supplied Gemini clips are keyed/cropped into existing transparent2x image atlases, rendered through the installed Skia image renderer. No Blender, body-part rig, new mascot artwork, added native dependency or separate playback clock. Pure shared story time selects the existing rendered pixels. Original10stillWebPs remain unchanged and supply reduced-motion, missing-media fallback and the16.5-21.5s Clip05 ending. Clip05 was NOT generated because Gemini reached its quota; the app keeps its existing still ending, without prototype labels.

The loop is21.5s: watch0-4; concern4-6.4; paws-near-chest6.4-8.6; yawn8.6-9.85; settle/sleep9.85-13; wake13-13.65; point13.65-16.5; existing still celebration/wave/rest/reset16.5-21.5. Phone shutdown8.4, A13.65-15.75, success16.5. Battery drains3to0from5.4-8.3. Every moving source span is1source second per story second; extra watching/sleeping material is trimmed, not slowed or extended. Quiet watch is sampled12fps; reactions24fps. CLIP_SEGMENTS exposes timings for the no-stretch regression test.

Main headline/composition/background, hand artwork, freehand A, localized speech, navigation and profile model preserved. Only Screen1 source changes. CTA now has restrained violet fill, tonal border, subtle elevation, clear left label and forward arrow, keeping original dimensions and localized text. Original hidden-until-first-loop requirement is superseded.

Grounding uses17small ground-only alpha masks from actual sole silhouettes, with tight contact and soft penumbra/ambient falloff; no changed mascot pixels. Rejected central oval/dark paw discs removed. Ground masks follow pose selection on the shared clock and are preloaded; a soft fallback remains on load error. The Hindi battery header uses shaped system-font paragraphs, and the panel's explicit layer fade prevents text leaking over reels/home.

## Verification actually completed
- TypeScript app check passed;26relevant timeline/dialogue/layout/clip tests passed, including native source speed, shortened partial-scroll story,3% drainage, ending fallback and reduced motion.
- Native arm64 debug APK with production JS/no QA controls built and installed. APK SHA256 in verification.json.
- Actual device recordings: final-en/phone.mp4 and final-hi/phone.mp4 (local raw files). Whole-sequence contacts reviewed on both; no obvious green rectangles/sparkles, clipped ears/paws or detached shoulders in sampled frames. Known generated pose/material differences at clip boundaries remain; seamless identity/loop is not claimed.
- screen1-final-phone.mp4 is a21.53s excerpt of the actual final EN phone recording (VFR frame rounding), with no boot/settings/debug screens. final-recording-contact.png decoded from this deliverable was reviewed.
- Native CTA present early and later, navigation reaches Screen2 and Back returns; no name/age/Continue submitted and no profile persisted.
- Physical8s background pause: sleepy pose recognized before and after warm resume; scores/results in lifecycle/results.json. Full app is not restarted by the resume.
- Physical font1.3 + reduced motion test: visible CTA/readable layout; Buddy ROI pixel-identical between screenshots. Both original system settings restored to1.0.
- Checked device logs: no RNJS error/native fatal in the capture windows; existing Skia Path deprecation warnings persist. Sample final EN memory PSS~750MB includes video decoders and atlases; no OOM seen here. No claim of low-memory-device coverage.

## Assets / reproduction
prepare_screen1_clips.py produces348unique320x318frames across10WebPatlases(4,064,982bytes,145,224,576decodedRGBAbytes); alpha roundtrip and unclipped sprite bounds asserted. prepare_ground_shadows.py produces17small sole/penumbra masks; original art unchanged. Source hashes and segment info: ../assembly_preview/production-assets.json. Helpers under tools/screen1 capture/review/lifecycle and restore settings. No original clips/legacy source deleted.

## OTA
Next action is the already-authorized Android preview-channel publish for runtime1.0.0. ota-before.json preserves prior update IDs. No production-channel publish authorized/performed. Device QA used a locally installed standalone build; this alone does not prove an OTA download/relaunch. Record the actual publish group/result separately after successful upload.
