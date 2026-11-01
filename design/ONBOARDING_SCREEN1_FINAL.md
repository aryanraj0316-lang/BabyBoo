# BabyBoo Onboarding Screen 1 — FINAL Brief

This is the single source of truth for onboarding screen 1. It **supersedes** design/ONBOARDING_SCREEN1_BRIEF.md, ONBOARDING_SCREEN1_REVISION_1.md and ONBOARDING_SCREEN1_REVISION_2_MASCOT.md. Where they conflict, this document wins. The decisions log stays valid unless contradicted here; append this document's decisions to it.

Read the whole document before writing code.

---

## 0. Non-negotiable process rules

1. **You do not report visual work as done until you have watched it.** After every change: record the phone screen (`adb shell screenrecord`, long enough for a full loop), pull it, extract frames, build contact sheets, and review them against this brief. If a "moving" element looks the same in consecutive frames, it is not moving enough. Fix, re-record, re-check.
2. **Frame-exact verification.** Build a dev-only render harness that renders the scene offscreen with Skia at any exact clock time and saves PNGs (e.g. every 1/30s for a whole loop, or at named key times). Use it to inspect motion frame by frame and to compare Buddy against the references at identical scale.
3. **Golden frames.** Save approved key frames (section 11) as golden images. After later changes, re-render them and report any pixel difference above a small threshold, so nothing regresses silently.
4. Stop at every checkpoint (section 12) and wait for my OK.
5. Hide all debug controls in recordings. Nothing debug-related may exist in release builds.
6. Every timing, size, colour, spring and easing lives in tokens/model files. No magic numbers in components.

---

## 1. What already exists and stays

From the approved Checkpoint 2 and the decisions log:

- Layout: scene (phone + Buddy) over headline, subline and CTA. Scene sized from Buddy's 159pt cap; phone height = 2.5× Buddy's height; fixed 36pt from the scene floor to the headline; spare height 60% above the scene, 40% below the CTA.
- Text split, EN/हिन्दी toggle, CTA #6E5CD6 (pressed #5F4DC8).
- Edge-to-edge status bar, page gradient behind it.
- Phone mockup: near-black bezel with hairline, side buttons, round punch-hole camera, glass sheen that stays visible on a black screen, status bar time 7:30.
- Scene halo (max opacity 0.35), shared contact shadow.
- Master clock on the UI thread; all animated values derived from it.
- Reduced-motion still, pause on background, accessibility (scene hidden from screen readers).

---

## 2. Buddy: a live Skia character built from the references

### 2.1 The rule

Buddy is **drawn and animated procedurally in Skia at runtime**: a rigged character whose parts move independently. **No image frames at runtime.** The six sheets in design/buddy/ (buddy_turnaround, buddy_expressions, buddy_actions, buddy_joy, buddy_celebrate, buddy_eyes_closed) are the **exact reference** for his shape, proportions, colours, face and every expression. Remove the old WebP frames from the app bundle; keep them in design/buddy/ for reference and comparison.

### 2.2 Build the model from measurements

From the references (front view = buddy_turnaround top-left; 3/4 views = turnaround top-middle and bottom-right; expressions from the other sheets):

1. Fit geometry to the reference silhouettes: head, ears and inner ears, body, arms, feet, foot pads and toe beans. Fit the curves (ellipses, superellipses or bezier paths) to the traced outlines programmatically, then refine by hand. Record everything relative to head width.
2. Locate face features precisely: eye centres, eye radius, highlight positions and sizes, blush centres and radii, mouth anchor, width and shape for each expression.
3. Sample colours in CIELAB (median over regions): fur base, fur shadow, fur highlight, rim, inner ear, blush, foot pads, toe beans, eye black, highlights, mouth interior, tongue.
4. Store it all in `buddyModel.ts`. Drawing code reads only from the model.

### 2.3 Rendering

- **Parts:** body, head, two ears (with pink inners), two arms (shoulder pivot, elbow bend, round paw), two feet (heart pad + 3 toe beans), face (eyes, highlights, blush, mouth). Each part is its own path so it can move.
- **Fur shading (SkSL runtime shader, shared by all fur parts):** fake surface normals from each part's shape for soft volume lighting (key + ambient + rim); a soft terminator; contact darkening where parts overlap; a fuzzy, noise-broken silhouette edge, never a crisp vector outline.
- **Fur micro-texture from the references:** extract small clean fur patches from the reference renders (the art is ours), turn them into a seamless tiling texture, and use it as the shader's detail layer so the plush grain matches the references. Bake it once; never compute heavy noise per pixel per frame.
- **Light uniforms:** light direction, colour and intensity. The phone's light relights Buddy through these (section 4).
- **Eyes:** glossy black with the reference's large and small highlights, highlights fixed to the light direction (they don't rotate with the head), a faint reflection of the phone light when the phone is lit.

### 2.4 Likeness standard (measured, not eyeballed)

Using the render harness, render Buddy in the neutral front pose at the reference's scale and compare with buddy_turnaround top-left:

- Silhouette overlap (IoU, ignoring the outermost fuzz band): **≥ 0.95**.
- Eye centres, mouth anchor, ear centres, blush centres, foot pad centres: each within **2% of head width** of the reference.
- Eye radius and ear radius: within **3%**.
- Colour: median fur ΔE00 **≤ 3**; pinks and pad purple **≤ 4**.

Repeat at `headTurn` −0.5 against the 3/4 reference: silhouette IoU ≥ 0.92, feature positions within 3%.

For each expression preset, render it next to its reference frame and check the face shapes (eye shape, mouth shape, blush) match: features within 3%. Report all numbers in a table.

These are the definition of "matches the reference" for this project. Report honestly where a number misses.

### 2.5 Rig parameters (all spring-smoothed unless stated)

- **Body:** rootX, rootY, squash (−1 stretched … +1 squashed, volume-preserving), bodyLean, breath.
- **Head:** headTilt, headTurn (−1 phone side … +1 away; fake 3D: features slide and foreshorten, near ear forward, far ear behind; ±0.5 must match the 3/4 references), headNod, headLag (follow-through spring).
- **Ears (each):** earAngle with a jiggle spring from head motion, earPerk 0..1.
- **Arms (each):** shoulderAngle, elbowBend, pawOpen.
- **Eyes:** gazeX/gazeY toward a gaze target in scene coordinates; eyeOpen 0…1.3; eyeShape blend: round, happyArc, sleepyLine, squeeze; blink.
- **Mouth:** mouthOpen, mouthWidth, mouthCurve, mouthShape blend: smile (open, with tongue), o, wavy, yawn, closedSmile.
- **Cheeks:** blush 0..1.5.

### 2.6 Expression presets

Data-defined targets for face and pose, each matched to its reference:

| Preset | Reference |
|---|---|
| watching | buddy_turnaround top-middle (3/4 toward the phone) |
| delighted | buddy_expressions top-left |
| giggle | buddy_expressions top-row second (happy arcs) |
| worried | buddy_actions top-right (paws at chest, wavy mouth) |
| scared | buddy_expressions bottom-right (wavy mouth, wide eyes) |
| startled / wakeSurprised | buddy_expressions bottom row, third (small "o") |
| yawn | buddy_actions bottom-left (paw at mouth, squeezed eyes) |
| sleepy | buddy_actions bottom-middle |
| asleep | buddy_eyes_closed, mouth closed, deeper droop |
| pointing | buddy_actions bottom-right, mirrored toward the phone |
| celebrate | buddy_joy top-right (both arms up) |
| wave | buddy_joy top-left |
| happy | buddy_celebrate bottom-right |

Expression changes **blend** every parameter to the new targets over 250–400ms with springs. Nothing snaps, ever.

### 2.7 Life (always on)

- Breathing: body scaleY ~1.03 with the head riding on it, 2.4s; 4s and deeper when asleep.
- Blinks every 2.5–5s (random), ~140ms (fast close, slower open), 1 in 4 a double blink; none while eyes are closed by an expression.
- Micro-saccades every 0.6–1.5s (±10% of the eye) while looking at something.
- Ear twitch every 4–8s.
- Idle sway ±2°, 3.6s, out of phase with breathing.
- Head lag and ear jiggle after every body move.
- Landing from any hop or jump: squash (scaleY 0.88 / scaleX 1.10), head and ears follow through for ~400ms.

---

## 3. Reels (real video)

- Source clips: design/reels/source/ (git-ignored; never commit the originals). Use only clips without identifiable people, logos or brands. Do not use 8888807 (gaming). Keep a design/reels/SOURCES.md with each clip's Pexels URL and creator.
- Encode with ffmpeg: most active ~3s section, 9:16, 540×960, 30fps, H.264 main, no audio, faststart, each file ≤ ~500KB, plus a first-frame JPEG poster. Show me the poster strip with sizes before wiring them in.
- Play inside the phone screen, clipped to its shape, via Skia video (or propose a library and ask first). Only the current and next reel decoding at once. No lavender/violet-dominant clips.
- Keep the coded reel UI overlay (action rail, caption lines, progress bar) on top.

---

## 4. The demo timeline (loop ≈ 24s)

A global `speed` token (default 1.0) scales all durations. Nothing important happens in under 400ms. Buddy's acting is in italics.

### Beat 1 — Absorbed (0.0–7.0s)
- 5 reels, ~1.3s each, swipe ~500ms with a soft spring settle and slight overshoot. Battery 34%, green.
- Phone light: cool, flickering slightly with each reel.
- *watching, head turned toward the phone; eyes follow each swipe up and back with a small head-bob; on reel 3 a giggle with a little bounce and ear jiggle.*

### Beat 2 — Battery takeover (7.0–12.5s)
1. 7.0s: status bar battery → 20%, amber; the icon pulses twice.
2. 7.6s: "Battery low · 20%" frosted banner springs down. The reel slows (playback to ~0.6×). No more swipes.
3. 8.4s: **takeover**: the status bar battery icon morphs (shared-element, ~700ms, spring) into a large centred battery filling most of the phone screen; behind it the reel dims to ~30%, desaturates and blurs; the banner slides away.
4. 9.1–11.6s: liquid fill with a moving wave drains 20% → 1%; a large percentage counts down in step; fill amber → red below 10%; below 5% the battery pulses (1.0 → 1.04 every 600ms) with a red outline glow; at 1% a vibration shake (±4pt, 3 cycles, 300ms).
5. 11.6–12.5s: drains to 0%, the outline blinks twice, a small plug icon appears and fades.
- Phone light on Buddy and the halo: cool → amber → dim red.
- *worried as the banner drops (paws to chest, lean toward the phone, eyes on the battery); trembles in short bursts during the drain, eyes tracking the falling fill; startled at the shake: 10pt hop back, squash on landing, ears flick.*

### Beat 3 — Power off (12.5–14.0s)
- Brightness flare (+15%, 80ms) → the image collapses vertically to a thin bright line (~350ms, ease-in) → the line shrinks to a glowing dot (~200ms) → the dot fades (~250ms). Black remains; the glass sheen stays.
- Light on Buddy goes out; the halo fades almost to nothing.
- *eyes wide (1.3), following the line and dot; then yawn (arm to mouth, stretch up); then sleepy (eyes close, ears droop, head tilts, body sinks).*

### Beat 4 — Dark rest (14.0–15.5s)
- Black screen.
- *asleep: deep slow breathing, gentle nod; optional single "z" rising and fading.*

### Beat 5 — Wake and unlock (15.5–19.0s)
Touch-indicator dot: white core #EEF1FE, ring #5B74EE, glow #6A86FB, comet trail as wide as the core fading to transparent; no hand or finger.
1. 15.5s: the dot fades in at the middle of the lower third and taps (1.0 → 0.85 → 1.0, ripple ring expanding and fading, 500ms).
2. 15.9s: the lock screen fades in (400ms): soft gradient wallpaper, large "7:30", the date, a padlock above the clock, "Swipe up to unlock" with a bobbing chevron; the home pill brightens.
3. 16.6s: the dot moves to just above the home pill (300ms) and pulses once (300ms).
4. 17.2s: swipe up to ~55% of the screen height over 900ms (decelerate); the trail grows; the lock screen moves with the dot exactly; the padlock opens.
5. 18.1s: the dot dims and shrinks (300ms); the lock screen slides off the top and fades.
- *wakeSurprised on the tap (eyes pop open, ears perk, a jolt); eyes lock onto the dot and track it exactly; pointing during the swipe, arm extended toward the phone and following the dot's height.*

### Beat 6 — Unlocked (19.0–21.5s)
- Home screen at full brightness and saturation (no leftover overlay), icons arriving with a centre-out staggered zoom. Battery 80%, green. Halo and Buddy's light bloom warm.
- *celebrate: anticipation dip, 28pt jump (stretch on take-off, squash on landing, contact shadow shrinking to 60% at the top), arms up, ears and head follow through; then wave: one arm waving from the elbow in a 2-beat rhythm with a slight body rock, delighted face, head turning to look at the viewer.*

### Beat 7 — Rest and loop (21.5–24.0s)
- *happy, looking at the viewer, normal blinks.*
- 23.2s: 800ms crossfade of the phone screen back to Beat 1; Buddy blends back to watching. The seam must be invisible.

### Bugs that must not recur
- Nothing may show through behind the reel feed; the home screen doesn't render until the lock screen exists.
- After unlock, the home screen is exactly as bright and saturated as at rest.

---

## 5. Motion standards

- Springs: soft (damping ratio ~0.8), bouncy (~0.5), jelly (~0.35, ears and follow-through only).
- Easings: standard cubic-bezier(0.2, 0, 0, 1), decelerate (0.2, 0.8, 0.2, 1), accelerate (0.4, 0, 1, 1).
- Anticipation before every big move (small dip/squash ~120ms), follow-through after.
- Animate only transforms, opacity and shader uniforms. 60fps minimum on a mid-range Android phone, with no dropped frames visible in recordings during Beats 2, 3 and 6.

---

## 6. Buddy Lab (dev-only)

A dev screen, compiled out of release builds and unreachable in production, with: Buddy at display size and 2×; sliders for every rig parameter; buttons for every preset; light controls; a reference overlay (any design/buddy image, with opacity and alignment); and an export button that renders the current pose with the harness.

---

## 7. Phases and checkpoints

**F0 — Plan.** Summarize your approach for the shader, the rig and the render harness, and list risks. Wait for my OK.

**F1 — Likeness (static).** Neutral front pose and headTurn −0.5. Show side-by-side and 50% overlay renders against the references (on the page background and on #1A1A1E) and the metrics table from 2.4. Wait for my OK. Don't build the rig until likeness passes.

**F2 — Rig and expressions.** A Buddy Lab recording on the phone showing every preset, blinks, gaze moving around, headTurn −1 → +1, an arm wave, a hop with ear jiggle; plus a contact sheet of each preset beside its reference with the face metrics. Wait for my OK.

**F3 — Reels.** Poster strip with file sizes. Wait for my OK.

**F4 — Full demo.** Integrate everything. Verify against your own recording and the harness frames (section 0). Report with: the recording, contact sheets at 10fps for the whole loop, the key frames in section 11, and the checklist in section 8 with each item confirmed.

---

## 8. Acceptance checklist

- [ ] Buddy meets the likeness numbers in 2.4; the table is in the report.
- [ ] Soft, fuzzy, shaded plush look; no hard vector outlines.
- [ ] Nothing snaps; every expression change blends.
- [ ] Blinks, eye movement, ear wobble, arm motion and breathing are all clearly visible on the phone recording.
- [ ] Buddy's eyes follow the reels, the battery fill, the power-off line and dot, and the touch dot.
- [ ] The phone's light visibly relights Buddy (cool, amber-red, dark, warm).
- [ ] Reels are real video, smooth, nothing showing through.
- [ ] The battery takes over the whole phone screen, drains with liquid and counter, pulses and shakes.
- [ ] The phone visibly powers off (line, then dot).
- [ ] Tap to wake, lock screen, slow readable swipe, padlock opens.
- [ ] Home screen is full colour after unlock.
- [ ] Loop ≈ 24s with an invisible seam.
- [ ] 60fps on the phone with no visible stutter.
- [ ] No debug UI or Buddy Lab in release builds.

---

## 9. Out of scope

Other onboarding screens, the web app, the pre-existing type errors in app/index.tsx.

---

## 10. Decisions to log

Procedural Skia Buddy (no runtime frames); likeness standard 2.4; 24s loop with `speed` token; battery takeover, power-off and two-step unlock; real video reels with the sourcing rules; render harness and golden frames.

---

## 11. Key frames (render with the harness and save as goldens once approved)

Beat 1 at 1.0s and on reel 3's giggle; Beat 2 at banner drop, mid-takeover morph, 10%, the 1% shake; Beat 3 at the line and the dot; Beat 4 asleep; Beat 5 at the tap, lock screen shown, mid-swipe, release; Beat 6 at the jump's peak and landing, mid-wave; Beat 7 rest; the loop seam (23.6s).
