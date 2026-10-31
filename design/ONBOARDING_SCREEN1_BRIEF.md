# BabyBoo Onboarding Screen 1: Full Rebuild Brief

You are rebuilding the first onboarding screen of BabyBoo. The current version looks cluttered and cheap. The goal is a calm, premium, Apple-keynote-quality screen: restrained layout, rich but purposeful motion, and a mascot who feels alive. Treat this as high-end product work, not a quick UI pass. Read this whole brief before writing any code.

Work in phases (section 12). Stop at every checkpoint and wait for my approval.

---

## 1. The story this screen tells

In about 11 seconds, with no words needed, a parent should understand the product:

1. A child is scrolling reels on a phone.
2. The battery runs down (BabyBoo's simulated battery).
3. The phone "dies" and goes dark: screen time ends because the phone ended it, not the parent.
4. A system-style swipe-up gesture unlocks the phone again, calmly, on the parent's terms.

Buddy, our lavender plush bear mascot, sits beside the phone and reacts to each moment: absorbed, then worried, then sleepy, then surprised, then delighted. The demo is the hook. The headline, subline and CTA sit below it.

---

## 2. Scope and ground rules

- Find and read the current onboarding screen 1 code first. Work in the project's existing framework, navigation, theme and conventions.
- Touch only this screen and the new components/assets it needs. Do not change other screens.
- Keep the headline, subline and CTA text exactly as they are now.
- Do not add a new dependency without asking me first. In Phase 0, propose any libraries you want and why.
- All timings, colors, sizes and easings live in one config/tokens file for this screen, so I can tune them without touching component code. No magic numbers in components.

### Recommended tech by stack (confirm in Phase 0)

- **React Native / Expo:** react-native-reanimated (v3+) for all animation on the UI thread, @shopify/react-native-skia for the glow, blur, gradient trail, masked lighting and phone glass effects. Expo Image for frame preloading and crossfades.
- **Flutter:** explicit AnimationControllers driven by one master controller, CustomPainter or fragment shaders for glow/trail/lighting, precacheImage for frames.
- **Web / PWA:** a single timeline (GSAP or Framer Motion with a master timeline), CSS transforms and opacity only, canvas or SVG for the dot and trail.

Whatever the stack, nothing that animates may run on a thread that can be blocked by app logic.

---

## 3. Mascot assets: preparation (Phase 1)

`design/buddy/` contains sheets of Buddy frames. Each is a grid on a white background.

| File | Grid | Frames (reading order) |
|---|---|---|
| buddy_turnaround.png | 3x2 | Top: front; 3/4 facing left; profile facing left. Bottom: back; profile facing right; 3/4 facing right. |
| buddy_expressions.png | 4x2 | Top: happy; laughing (eyes closed); sleepy-smug; big yawn. Bottom: surprised small "o" (head tilted); laughing; surprised "o"; worried wavy mouth. |
| buddy_actions.png | 3x2 | Top: talking 3/4; beckoning; worried with paws at chest. Bottom: yawning; sleepy content; pointing to the right. |
| buddy_joy.png | 3x2 | Top: waving; paws clasped; both arms up. Bottom: hands on cheeks giggling; content closed-eye smile; covering eyes. |
| buddy_celebrate.png | 3x2 (loose layout) | Top: peeking smile; jumping; arms up. Bottom: arms out; **DO NOT USE bottom-middle (ears off-model)**; happy front. |
| buddy_eyes_closed.png | single | Eyes closed, open happy smile. |
| buddy_lighting.png | 3x2, optional | Lighting reference on dark gray: neutral, cool phone glow, half glow, rim only, near dark, warm glow. Use only if present. |

Processing requirements:

1. Detect each frame's bounding box (frames are not on a perfect grid; detect by alpha/contrast, not fixed cell math).
2. Remove the white background with a high-quality matting model (e.g. rembg with an isnet or birefnet model, or equivalent). The fur edges must stay soft and natural: no white halo, no hard cut-out edge, no lavender eaten away. Check the edges against a dark background (#1A1A1E) and a lavender background, not just white.
3. Normalize every frame: identical head width and identical sitting baseline, anchored bottom-center, on a shared canvas size. Measure head width on each frame (the widest point of the head, excluding the ears) and scale to match. Buddy must never visibly grow, shrink or jump when frames swap.
4. Buddy is symmetric (no markings that break when mirrored), so frames may be flipped horizontally to face the phone. Generate flipped variants where the mapping in section 7 needs them.
5. Export transparent WebP (or the stack's best equivalent) at 2x and 3x, with descriptive names, e.g. `buddy_watch_34_left@3x.webp`, `buddy_worried_paws@3x.webp`, `buddy_point_left@3x.webp`. Keep each frame under ~150 KB at 3x.
6. Produce a contact sheet: every cut frame on a mid-dark background in a grid, labeled with its file name, all at the normalized scale with the baseline drawn as a thin line.

**CHECKPOINT 1:** Show me the contact sheet. Wait for my OK.

---

## 4. Visual design system

### Palette (tokens)

- `bg.top` #F6F3FF, `bg.bottom` #FFFFFF: the page gradient. Nothing else in the background except the scene halo (below).
- `ink.primary` #1B1A24, `ink.secondary` #6B6880, used for text.
- `brand.lavender` #A99BF0 and `brand.lavenderDeep` #7B6BE0, used for the CTA and accents. If the project theme already defines brand colors, use those instead and tell me.
- `dot.core` #EEF1FE, `dot.ring` #5B74EE, `dot.glow` #6A86FB.
- `battery.green` #34C759, `battery.amber` #FF9F0A, `battery.red` #FF3B30.

### Depth and surfaces

- One shadow language for the whole screen: soft, large-radius, low-opacity, tinted lavender rather than gray (e.g. 0 24 48 rgba(90, 70, 180, 0.14) plus 0 4 12 rgba(90, 70, 180, 0.08)).
- One radius scale: 8 / 16 / 24 / 44 (phone outer).
- No borders except hairlines on the phone bezel.

### Typography

Use the project's existing font family. One clear hierarchy: headline (large, tight leading, semibold), subline (regular, ink.secondary, comfortable leading), CTA label (semibold). No more than these three styles on screen.

### Scene halo

Behind the phone, a very large, very soft radial glow (blurred ~80pt, opacity 0.35-0.5) whose color follows what the phone shows: cool blue-violet while reels play, fading to almost nothing at shutdown, warm peach-lavender on unlock. This ties the phone and Buddy into one lit scene. It must be subtle. If you notice it at first glance, it is too strong.

---

## 5. Layout

- Top ~58% of the screen: the scene (phone + Buddy + halo). Bottom: headline, subline, CTA.
- **Phone mockup:** 55-60% of screen width, slightly left of center. Buddy sits to its right, overlapping the phone's bottom-right corner slightly, on the same baseline as the phone's bottom edge. Buddy's height is about 40% of the phone's height.
- Under Buddy and the phone, one shared soft contact shadow (a blurred ellipse) grounds them on the same floor.
- Text block: 8pt grid, generous whitespace, left- or center-aligned to match the existing design. Nothing overlaps anything.
- CTA: full-width within the page margins, comfortable height (52-56pt), fully rounded or 16pt radius to match the theme.
- Respect safe areas. Must look composed at 375x667 (small), 390x844 (standard) and 430x932 (large). On the small size, scale the scene down rather than letting the text get cramped.

### Phone mockup details (this is what makes it look high-end)

- Near-black bezel with a very subtle vertical gradient (#1C1C1F to #0E0E10) and a 1px lighter hairline on the outer edge.
- Screen inset with its own correct inner corner radius (outer radius minus bezel width).
- A small pill-shaped camera cutout at the top center.
- Thin side buttons (volume on the left, power on the right) as 1-2pt raised shapes.
- A glass reflection: a very faint diagonal light sheen across the screen (white, 4-6% opacity, soft gradient) that stays visible even when the screen is black, so the dead phone still reads as glass, not a black rectangle.
- The screen content is clipped exactly to the screen shape.

---

## 6. The demo timeline (Phase 3)

Drive everything from **one master clock** with named beats. Every element reads its state from that clock. No independent timers that can drift. Total loop about 11.0s. All times below are in the config file.

### Beat 1: Scrolling reels (0.0-3.5s)

- Full-screen vertical reels inside the phone. Make 5 distinct placeholder clips, each a designed mini-scene: a bright gradient background with 2-3 simple friendly shapes (stars, balloons, a ball, clouds) that animate gently inside the clip (bobbing, rotating, drifting), so each reel feels like video, not a still card.
- Overlay UI on every reel, kept generic: a thin progress bar at the bottom that fills while the reel plays; a right-side action rail of 3 generic icons (heart, comment bubble, share arrow) with counts as small skeleton bars; two skeleton caption lines at the bottom-left. No real app logos, names or UI from Instagram, TikTok, YouTube or any other platform.
- Swipe rhythm: a new reel every ~0.85s. Each swipe is fast and physical: the feed moves up one reel height with a spring (stiff, slightly underdamped, so it settles with a 2-3% overshoot). During the fast part of each swipe, add a tiny vertical stretch (scaleY 1.02) on the moving content to suggest speed, released as it settles.
- Status bar inside the phone: time on the left; signal, wifi and battery on the right. Battery at 23%, green, drawn as a proper battery glyph with a fill that can animate.
- Buddy: watching the phone, absorbed (see section 7).

### Beat 2: Battery simulation (3.5-5.5s)

- The battery fill drains smoothly from 23% to 5% over the beat. The fill color tweens green to amber below 15% and to red below 8%.
- At 4.0s, a "Battery low" toast slides down from under the status bar: a rounded pill with a frosted/blurred background (backdrop blur if the stack supports it, otherwise a translucent dark fill), a small red battery icon and the text. It enters with a spring and stays.
- The reel swipes slow: each next swipe takes longer and travels with less energy, and the last one stalls halfway and settles back. The feed feels like it is running out of steam.
- Buddy: worried (section 7).

### Beat 3: Shutdown (5.5-6.8s)

- 5.5s: the toast slides away. An empty-battery icon (outline, red sliver) fades and scales in at the screen center (0.9 to 1.0), holds 0.4s.
- 5.9s: the whole screen dims to black over 0.5s. As it dims, the content also desaturates and loses a little contrast, the way a real screen dims. No instant cut.
- The glass sheen stays visible on the black screen.
- 6.5s: a thin light-gray home indicator pill fades in at the bottom center of the black screen (30% of screen width, 4pt tall, 35% opacity).
- The scene halo fades to almost nothing. The cool light on Buddy fades out.
- Buddy: yawn, then sleepy (section 7).

### Beat 4: Swipe-up unlock with the touch-indicator dot (6.8-8.1s)

This replicates the Android / Vivo navigation tutorial style. **There is no hand or finger anywhere.**

The dot:

- Diameter ~11% of the phone screen width, minimum 20pt.
- White core `dot.core` filling ~65% of the diameter; a ring of `dot.ring`; a soft outer glow of `dot.glow` at ~45% opacity, radius ~40% of the dot diameter.
- Trail: a rounded bar exactly as wide as the white core, from the swipe start point to the dot's center, drawn behind the dot. Gradient from rgba(106,134,251,0.45) at the dot end to fully transparent at the start end. Its length always equals the distance the dot has travelled.

The motion (times relative to the start of the beat):

1. **0-150ms, appear:** the dot pops in just above the home pill, scale 0.6 to 1.0 and opacity 0 to 1, ease-out. The pill brightens to 70%.
2. **150-350ms, hold:** one gentle glow pulse (glow scale 1.0 to 1.15 to 1.0).
3. **350-800ms, swipe:** the dot travels straight up to ~45% of the screen height with cubic-bezier(0.2, 0.8, 0.2, 1): fast start, soft stop. The trail grows behind it. The black lock layer moves up with the dot at exactly the same speed (it is "held" by the dot), revealing the unlocked home screen underneath, and fades 1.0 to 0.6 as it goes. The pill moves up with the lock layer.
4. **800-1050ms, release:** the dot stops. Its core fades to 35% opacity, the ring and glow fade to 0, and it shrinks to 0.85. The trail fades out at the same time. The lock layer finishes sliding off the top and fades out (250ms, ease-in).
5. **1050-1300ms, settle:** the home screen settles from scale 0.97 to 1.0 with a soft spring.

- Buddy: surprised when the dot appears, then pointing at the phone during the swipe (section 7).

### Beat 5: Unlocked (8.1-9.8s)

- The home screen: a calm, soft wallpaper (a gentle lavender-to-peach gradient with one or two blurred soft shapes) and a 4x3 grid of generic rounded app icons in soft pastel colors with a simple glyph each. No real app icons or brands.
- As the home screen settles, the icons arrive with a staggered zoom-in (scale 0.85 to 1.0, opacity 0 to 1, ~25ms stagger, center-out), like a real phone unlocking.
- Status bar returns, battery shown at a calm level (e.g. 80%, green). This is a fresh session, not the same dying battery.
- The scene halo blooms in warm. Warm light returns on Buddy.
- Buddy: celebrates, then waves (section 7).

### Beat 6: Rest and loop (9.8-11.0s)

- Buddy settles to his happy front frame.
- At 10.6s, crossfade the entire phone screen (400ms) back to the start of Beat 1, and Buddy back to watching. The loop seam must be invisible: no jumps, no flash.

---

## 7. Buddy: performance direction

Buddy is not a slideshow. He is a character. Frame swaps carry the expressions; code carries the life between them.

### Frame mapping

| Moment | Frame |
|---|---|
| Beat 1, watching | The 3/4 turnaround frame that faces the phone (top-middle "3/4 facing left" if the phone is on his left). |
| Beat 2, start | buddy_actions top-right (worried, paws at chest). |
| Beat 2, from 4.6s | buddy_expressions bottom-right (worried wavy mouth). |
| Beat 3, 5.6s | buddy_actions bottom-left (big yawn). |
| Beat 3, 6.2s | buddy_actions bottom-middle (sleepy content). |
| Beat 4, dot appears | buddy_expressions bottom row, third (surprised "o"). |
| Beat 4, swipe | buddy_actions bottom-right, flipped so he points toward the phone. |
| Beat 5, 8.1s | buddy_joy top-right (both arms up). |
| Beat 5, 8.9s | buddy_joy top-left (waving). |
| Beat 6 | buddy_celebrate bottom-right (happy front). |

### Living motion (in code, on top of the frames)

- **Breathing:** continuous, scale 1.00 to 1.02 anchored at the bottom, ~2.2s cycle, sine ease. Always running, under everything else.
- **Idle sway:** a very slow rotation of ±1 degree around the bottom-center anchor on a cycle out of phase with breathing (~3.4s), so the motion never looks mechanical.
- **Expression changes:** never a plain swap. Each change is a 150ms crossfade with a tiny "pop": scale 0.97, then 1.03, then 1.0 on a soft spring. For big emotional changes (surprise, celebration), add anticipation: a 2pt dip before the pop.
- **Celebration bounce:** on the arms-up frame, one jump of ~8pt with squash and stretch: squash (scaleX 1.04 / scaleY 0.96) on takeoff and landing, stretch (scaleX 0.97 / scaleY 1.03) at the top. The contact shadow under him shrinks and lightens as he rises and returns as he lands.
- **Sleepy:** during the sleepy frame, breathing slows to a ~3.2s cycle with a slightly deeper amplitude, and he sinks 2pt.
- **Worried:** a slight lean (1-2 degrees) toward the phone and a small, quick breathing rhythm.
- **No fake blinks.** Do not swap to closed-eye frames for blinking. They don't match his poses and will look broken.

### Phone light on Buddy

- A gradient overlay masked to Buddy's alpha (so it only colors Buddy, never the background).
- Beats 1-2: cool blue-white light on the side facing the phone, with the far side slightly in shadow. It flickers very softly in sync with reel changes (brightness shifts of a few percent as each new reel appears).
- Beat 3: fades out over the dim. Only a faint ambient shape remains.
- Beat 5: returns as a warm, soft light.
- If `buddy_lighting.png` exists, match its intensities and direction.

### Contact shadow

A soft blurred ellipse under Buddy (and one under the phone, merged so they read as one floor). It responds to his bounce and breathing. It is never a hard shadow.

---

## 8. Text block and CTA motion

- On screen entry: the scene fades in and rises 16pt (spring), then the headline, subline and CTA follow with a 70ms stagger, each fading in and rising 12pt.
- CTA press: scale to 0.97 on press with a quick spring back, a slight darkening of the fill, and the project's standard haptic on press if the app already uses haptics elsewhere.
- Optional and subtle: a single slow light sweep across the CTA once, ~1.5s after the screen enters. Never repeat it on a loop.

---

## 9. Motion tokens

Define these in the config and use only these:

- `ease.standard`: cubic-bezier(0.2, 0.0, 0.0, 1.0)
- `ease.decelerate`: cubic-bezier(0.2, 0.8, 0.2, 1.0) (dot swipe, entrances)
- `ease.accelerate`: cubic-bezier(0.4, 0.0, 1.0, 1.0) (exits)
- `spring.snappy`: high stiffness, ~0.75 damping ratio (reel swipes, icon arrivals)
- `spring.soft`: medium stiffness, ~0.85 damping ratio (settles, entrances)
- `spring.bouncy`: ~0.6 damping ratio (Buddy pops and celebration only)
- Durations: 150 (frame crossfades), 250, 400, 600 ms.

---

## 10. Performance, accessibility, robustness

- 60fps minimum, 120fps on ProMotion/high-refresh devices. Animate only transforms, opacity and shader/gradient parameters. No layout-affecting properties in animations.
- Preload and decode every Buddy frame and reel asset before the demo starts. Show the first frame of Beat 1 static until everything is ready. No pop-in, no flashing.
- Pause the loop when the screen is not focused or the app is backgrounded, and resume cleanly.
- The demo is decorative: hide it from screen readers. The headline, subline and CTA stay fully accessible, with correct roles and labels.
- Reduced motion (system setting): show one composed still (phone unlocked showing the home screen, Buddy waving, warm halo) and no loop, no breathing, no sway.
- Remove the old screen's dead code, unused assets and unused styles.
- Add a dev-only debug control (hidden in production builds) that can pause the master clock, scrub it, and jump to any beat. Use it for QA.

---

## 11. Acceptance checklist

Do not hand this back until every item is true:

- [ ] Buddy never changes size or position when frames swap; no halo on fur edges on any background.
- [ ] Every expression change has the crossfade and pop; no hard cuts anywhere.
- [ ] The reels feel like video: shapes move inside them, and swipes are physical with a spring settle.
- [ ] The battery drain, color change and slowing swipes read clearly without any explanation.
- [ ] The shutdown dims and desaturates; the glass sheen remains on the black screen.
- [ ] The dot, trail and lock layer move together exactly; the release fades the dot rather than deleting it.
- [ ] Home screen icons arrive with the staggered zoom.
- [ ] The light on Buddy and the scene halo follow the phone (cool, dark, warm).
- [ ] The loop seam is invisible.
- [ ] Text is unchanged, nothing overlaps, and all three device sizes look composed.
- [ ] Reduced motion shows the still; the demo is hidden from screen readers.
- [ ] Steady frame rate with no dropped frames during the busiest moment (Beat 4 to Beat 5).
- [ ] No real brand logos or UI anywhere.

---

## 12. Phases and checkpoints

**Phase 0: Audit and plan.** Read the current screen. Report the stack, how the current screen is built, what you will delete, and which libraries you propose (with reasons). List any questions. **Wait for my OK.**

**Phase 1: Assets.** Section 3. **CHECKPOINT 1:** the contact sheet. **Wait for my OK.**

**Phase 2: Static layout.** Build the layout, the phone mockup, the halo, Buddy in his watching frame and the text block, with no demo animation yet. Screenshot at all three device sizes. **CHECKPOINT 2. Wait for my OK.**

**Phase 3: The demo.** Sections 6 and 7, driven by the master clock, with all values in the config file.

**Phase 4: Polish and QA.** Sections 8 to 11. Using the debug scrubber, capture screenshots at 390x844 for each beat, plus the dot at 0, 150, 500, 800 and 1050ms into Beat 4, plus Buddy's celebration at takeoff, peak and landing. Review them against this brief yourself, fix everything that is off, then show me the screenshots and the checklist with each item confirmed.

---

## Decisions log

Decisions made during the build. Where these differ from the brief above, these win.

### Phase 0 (audit)

- **Platform:** the Expo / React Native app only (`src/native/OnboardingFirstScreenNative.tsx`). The Vite web app's copy of screen 1 stays unchanged.
- **Libraries:** no new app dependencies. Reanimated 4 and Skia 2 (already installed) cover the animation; Skia's image loading replaces Expo Image. expo-haptics (already used) for the CTA.
- **Dev-only tooling:** rembg with BiRefNet (`birefnet-general`) in a git-ignored venv at `tools/.venv`. The model cache lives outside the repo (`~/.rembg`).
- **Old code:** the previous hero system (`src/onboarding/hero/`), the Animation Studio route, the old mascot pipeline and its assets are removed. A git branch and commit preserve the prior state. The Studio must not ship in release builds; a dev-only scrubber replaces it.

### Text

- The old single paragraph is split, wording kept:
  - Headline: "Screen time ends with no one being the bad guy."
  - Subline: "BabyBoo helps your child say goodbye to the phone gently." (the word "to" before "say" is dropped)
  - CTA: "Get Started", visible from screen entry.
- The Hindi text is split the same way, keeping its wording.
- The "GENTLE SCREEN TIME" tag, the dev "Skip" button and the "Skip to setup" link are removed.
- **Hindi toggle:** kept as a small, quiet control at the top. Devanagari gets extra line height and must not be cramped. Checkpoint 2 screenshots cover all three device sizes in English and Hindi.

### Colour

- **CTA fill:** #6E5CD6, white label, contrast 5.04:1. Pressed: #5F4DC8 (6.21:1). #A99BF0 is not used as a button fill.

### Buddy assets (Phase 1)

- 10 app frames, 2x and 3x WebP, one shared canvas, in `assets/onboarding/screen1/buddy/`. Pipeline: `tools/buddy/`.
- Head size is measured as the largest circle inside the head (stable across poses and turns). Frames with paws pressed against the head take their sheet's median.
- **No upscaling in the files:** normalized head width is 106pt, the largest at which no frame is upscaled at 3x. The export refuses to upscale.
- **Floor edge:** the crisper underside where the fur met the floor is left as is; the contact shadow covers it.

### Resolution and scene sizing

- **Upscaling cap:** at most 1.12x display-time upscaling of any Buddy frame, on any device. No AI upscaling for now.
- **Buddy cap:** the watching frame is at most **159pt** tall (141.8pt native × 1.12) on every device, including screens denser than 3x. The cap is in points, not a per-density upscale ratio: a point is roughly the same physical size on every device, so each source pixel covers the same physical area and 159pt looks equally sharp at 3x, 3.5x and 4x.
- **Scene sizing:** the scene is sized from Buddy's cap. Buddy is 40% of the phone height, so the phone is 2.5x Buddy's height (397pt at the cap), with a realistic phone aspect ratio. Composition proportions are identical on every device.
- **Large screens:** extra space becomes air around the scene and between the scene and the text. The phone is never enlarged on its own. The brief's 55-60% phone-width target is secondary to this.
