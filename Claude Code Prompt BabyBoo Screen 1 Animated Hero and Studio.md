# Claude Code Prompt: BabyBoo Screen 1 Animated Hero and Animation Studio

How to use: put the mascot image in the project at `assets/mascot/buddy_source.png`, then paste everything from section 1 down into Claude Code as one task. Written 25 October 2026.

## 1. Mission

You are a senior React Native graphics engineer and motion designer. Build the animated hero for Screen 1 of the BabyBoo onboarding, plus a developer-facing Animation Studio to tune it.

BabyBoo is a parental-control app for toddlers and young children. When a parent-set timer ends, it fakes a dead-battery shutdown so the parent is not the one who ends screen time. The mascot is Buddy, a purple plush-style bear who acts as a gentle helper. Screen 1 must show the product working in about five seconds, with no reading needed.

The hero is one canvas containing two things that react to each other:

1. **A phone demo** with a plain, believable battery-down simulation: a cartoon plays, the battery drains, a short low-battery notice appears, the screen dims and goes black. A finger then appears, taps the dead screen, and swipes a capital A with one free-form gesture to wake the phone.
2. **Buddy**, a 2.5D, softly lit, interactive mascot who watches the phone, reacts to each beat, and responds to the parent's touch and device tilt.

The tone is calm, warm and professional. Nothing is exaggerated: no explosions, no screen shake, no flashing, no cartoon smoke, no slapstick.

## 2. Read this first: constraints and the quality gate

- The source art is **one flat render** (about 1254 x 1254 px): a fluffy purple bear with pink inner ears, pink cheeks, large glossy black eyes with two white highlights each, an open smile, his left paw raised in a wave, sitting upright on a cream background. It has no layers and no side or back views.
- Because of that, **true 3D rotation is impossible**. The goal is a convincing **2.5D soft-toy look**: separated body parts on a rig, a normal-mapped lighting shader, a contact shadow, facial-feature parallax for small head turns (about 12 degrees of apparent turn at most), and device-tilt parallax.
- **Do not change the character design.** No eyebrows, no new colors, no changed proportions. Every drawn expression (blinks, yawn) must match the render style: soft gradients, glossy eyes, pink tongue and mouth interior.
- **Quality gate.** After the asset pipeline (section 4), export a contact sheet of every part and pose. If any inpainting seam, halo, ghost edge or fur mismatch is visible at 2x zoom, **stop**, do not ship it, and write `docs/hero-feasibility.md` listing exactly which layered PNG parts or poses are needed. Make the pipeline accept replacement layered art through a manifest (section 4) so better art can be dropped in with no code changes.
- Never use real brand, show or character imagery inside the phone demo.

## 3. Stack and architecture

- Expo SDK 52, React Native, TypeScript, Android first, iOS must also work. This needs a development build, not Expo Go.
- Install with `npx expo install` where possible: `@shopify/react-native-skia` (rendering and SkSL shaders), `react-native-reanimated` (UI-thread animation), `expo-sensors` (DeviceMotion for tilt parallax), `expo-haptics`, `expo-audio` or the project's existing audio utility, `expo-clipboard`, `expo-file-system`, `expo-sharing`, `@react-native-async-storage/async-storage`.
- Draw everything inside **one Skia `Canvas`**. Drive every animated value with Reanimated shared values and `useDerivedValue` so nothing waits on the JS thread during playback.
- Keep timeline math pure and free of React so the Vite web companion can reuse it.
- Suggested layout:

```
src/onboarding/hero/
  HeroStage.tsx            main component
  heroConfig.ts            types and defaults (section 10)
  heroTimeline.ts          pure beat and easing math
  mascot/                  MascotLayer.tsx, rig.ts, expressions.ts, lighting.ts
  phone/                   PhoneLayer.tsx, StatusBar.tsx, CartoonScene.tsx,
                           DeadBattery.tsx, PatternDemo.tsx, Finger.tsx
  audio.ts
  studio/                  HeroStudioScreen.tsx and panels
app/dev/hero-studio.tsx    route, dev builds only
assets/mascot/             generated outputs from the pipeline
tools/prepare_mascot.py    asset pipeline
```

`HeroStage` props: `width`, `height`, `config`, `language` (`en` or `hi`), `paused`, `onBeat(beatId)`. The language picker, headline and Get Started button are normal React Native views outside the canvas, so only the demo text inside the phone needs translating.

## 4. Asset pipeline: `tools/prepare_mascot.py`

Run in Python with OpenCV, NumPy, Pillow and `rembg` (or a color and edge matte if rembg is unavailable offline). Outputs go to `assets/mascot/`.

1. **Matte.** Remove the cream background, producing `buddy_rgba.png` with clean antialiased alpha and no cream fringe. Check edges on both a dark and a light background.
2. **Part masks.** View the image and define polygon masks with feathered edges for: `head`, `ear_l`, `ear_r`, `arm_wave` (the raised arm and paw), `torso`, `arm_rest` (the lower right arm), `leg_l`, `leg_r`, `eyes` (both glossy eyes with highlights), `cheeks` (the pink blush), `mouth`, `face_base` (the fur around the face features). Save them in `rig.json` with, for each part: `polygon`, `pivot`, `z` order, and `maxRotationDeg`.
3. **Inpaint occlusions.** Where a moving part reveals hidden fur (behind the raised arm, under the head, behind the ears), fill with OpenCV Telea or patch-based inpainting, then add matching fur texture noise. Never leave a hole or a flat color patch.
4. **Normal map.** Build `buddy_normal.png` from a height field made from the alpha distance transform, blurred, plus a gentle low-frequency luminance term, so the body reads as rounded and puffy. Keep fur-scale detail out of the normals; fur sheen comes from the shader.
5. **Face features.** Extract `eyes_open.png` with its two highlights as a separate sprite, and the face area without eyes, mouth and cheeks, so the eyes, mouth and cheeks can move and change independently. Rebuild the mouth interior and cheeks as clean vector shapes if the extracted ones look soft.
6. **Manifest.** Write `manifest.json` listing every part file and a `source: 'derived' | 'artist'` flag. If layered artist PNGs exist in `assets/mascot/artist/`, the app must prefer them automatically. Support optional extra poses: `pose_yawn`, `pose_cheer`, `pose_sleepy`.
7. **Contact sheet.** Export `docs/mascot-contact-sheet.png`: each part, the reassembled bear against the original (a difference image), and every expression, at 1x and 2x.

Texture budget: no texture larger than 2048 px on either side. Keep total mascot textures under 25 MB in memory.

## 5. The mascot rig and behaviors

**Placement.** Buddy sits at the lower left of the phone, about 38% of the canvas width, one paw resting on the phone's bottom edge. His seat touches a soft contact shadow on an invisible floor plane. The phone is the front-most object, and Buddy's raised paw can pass in front of the phone's edge when he waves.

**Idle layer (always running):**

- Breathing: torso scale about 1.0 to 1.015 over 3.2 s, head following with a small delay, ears lagging a few degrees (secondary motion).
- Blink every 3 to 6 s at random, 140 ms down and 120 ms up, sometimes a double blink. A blink squashes the eye sprite vertically and draws a fur-colored eyelid edge with a soft shadow. Pick whichever of the two looks better at 2x and expose it in the studio as `blinkStyle`.
- Ear twitch every 8 to 14 s, 6 to 8 degrees.
- Apply squash and stretch about the seat on every spring, preserving volume (scaleX = 1 / scaleY approximately).

**Gaze.** Eyes move inside a small ellipse (about 6% of eye width). The glossy highlights stay nearly fixed, shifting at most a quarter of the eye movement, so the eyes look wet and real. Gaze targets, in priority order: the fingertip while it is on screen, then a touch point anywhere on screen, then the phone's cartoon content, then the battery icon during the drain, then a slow idle drift.

**Face parallax.** Move `eyes`, `cheeks` and `mouth` a few pixels more than `face_base` toward the gaze direction, and rotate `head` by 2 to 4 degrees, to give a small head turn without rotating the artwork.

**Pose behaviors:**

| Behavior | What it looks like |
| :-- | :-- |
| `waveHello` | `arm_wave` swings plus or minus 18 degrees about the shoulder, three cycles, with spring settling and a small body lean |
| `watch` | gaze on the phone, a soft smile, head tilted 3 degrees toward it |
| `glanceBattery` | quick eye dart to the battery icon, ears lift 4 degrees |
| `concernedPerk` | at the warning notice, body rises 1.5% and ears tilt slightly back, no frown |
| `yawn` | head tilts back 6 degrees, eyelids lower to half, the mouth morphs into a rounded O (dark purple interior, pink tongue), held 0.7 s, then closes. Optionally one small paw-to-mouth motion if `pose_yawn` art exists |
| `curiousTilt` | head tilts 7 degrees, eyes open wider by 6% as the finger appears |
| `cheer` | `arm_wave` raised, one gentle hop (body up 3%, squash on landing), eyes squint happily, soft sparkle particles |
| `giggle` | on tap: quick squash and stretch, cheeks pulse, a soft laugh sound if audio is on, light haptic |

**Touch interactions:** tapping Buddy plays `giggle`. Touching or dragging anywhere makes Buddy's gaze follow. Tilting the device shifts the lighting direction and creates parallax: background, Buddy and phone layers move 4, 8 and 12 px at full tilt. Keep all of this subtle.

**Lighting (the 3D feel).** Render Buddy through an SkSL runtime shader using the normal map. Starting point to calibrate, not final:

```
uniform shader image;
uniform shader normalMap;
uniform float3 lightDir;     // normalized, driven by tilt and screen light
uniform float3 lightColor;
uniform float ambient;
uniform float neutralDiffuse; // value of dot(flatNormal, neutralLight)
uniform float specPower;
uniform float specAmount;
uniform float rimAmount;
half4 main(float2 xy) {
  half4 base = image.eval(xy);
  if (base.a < 0.004) return half4(0);
  float3 n = normalize(normalMap.eval(xy).rgb * 2.0 - 1.0);
  float diff = clamp(dot(n, lightDir), 0.0, 1.0);
  float3 h = normalize(lightDir + float3(0.0, 0.0, 1.0));
  float spec = pow(clamp(dot(n, h), 0.0, 1.0), specPower) * specAmount;
  float rim = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.0) * rimAmount;
  float k = ambient + (1.0 - ambient) * diff;
  float kNeutral = ambient + (1.0 - ambient) * neutralDiffuse;
  half3 lit = base.rgb * (k / kNeutral);
  lit += half3(lightColor) * (spec + rim) * base.a;
  return half4(lit, base.a);
}
```

Mind premultiplied alpha. **Calibrate so the neutral pose reproduces the original image colors (difference under 3 in Lab).** Lighting must only add depth: a soft key light, a gentle rim, a fur sheen. Never repaint or recolor the bear.

**Screen light spill (the key interaction).** Compute the phone screen's average brightness and tint each frame as shared values (`screenLuma`, `screenTint`, sampled analytically from the cartoon palette and the dim level, not by reading pixels). Feed them in as a second light on the side of Buddy facing the phone. When the screen dims and goes black, that glow fades and only ambient and key light remain. When the phone wakes, it blooms back. Also keep Buddy's contact shadow slightly softer when the phone is bright.

### The context director: how Buddy stays contextual

Buddy must always be doing something that makes sense for what the phone is doing at that moment. Build a small state machine, the **context director**, that reads the phone state and the timeline beat and chooses Buddy's behavior, so no random or mistimed animation ever plays.

**Priority rules (highest first):**

1. Beat behaviors from the timeline table (section 7) always win.
2. Touch reactions (`giggle`) play only in calm beats (`playing`, `settle`). They are ignored during `warning`, `dim`, `off`, `deadHold`, `tap`, `unlock` and `wake`.
3. Idle behaviors (breathing, blinks, ear twitch) always run, but a blink is never scheduled within 250 ms before or after a key moment: the notice sliding in, the power-off, the finger tap, or the end of the swipe.
4. Only one body action at a time, with at least 300 ms between actions. At most two secondary motions at once (for example breathing plus an ear lag).
5. Every action has about 100 ms of anticipation (a small opposite motion) and a settle. Reaction size scales with the beat: small at `warning`, largest at `cheer`.

**Contextual moments (what the viewer should notice):**

| Moment | What Buddy does |
| :-- | :-- |
| Battery crosses 15% and turns red | Eyes dart to the battery icon within 200 ms, ears lift 4 degrees |
| Notice slides in (6.0 s) | 150 ms later he leans 1.5% toward the phone, gaze stays on the notice |
| Screen dims | His smile softens slightly (mouth corners down about 8%), eyes follow the fading light |
| Screen goes black | One slow blink about 400 ms after the black, spill light gone |
| Dead hold | Yawn, then a sleepy half-blink |
| Finger appears | He notices 150 ms after it enters: eyes and head turn, `curiousTilt` |
| Swipe in progress | Gaze follows the fingertip with a 120 ms lag, so it feels alive, never perfectly locked |
| Swipe ends | Eyes widen about 6% for a beat, then the screen wakes |
| Wake | Spill light blooms back, the smile opens, then `cheer` |

**Keep-clear zones.** Measured as fractions of the phone's screen rectangle, no part of Buddy, his paw or any particle may overlap these zones in any frame: the status bar strip (top 6%), the notice area (top 6% to 16%), the swipe area (x from 15% to 85%, y from 28% to 78%), and the battery glyph area (x from 30% to 70%, y from 40% to 60%). The only allowed overlap with the phone is Buddy's body or paw over the bottom-left bezel, at most 8% of the phone's width into the glass and only in the lowest 8% of the screen height. Cheer sparkles stay outside the swipe area.

**Responsive layout.** Compute the stage from the canvas size: the phone is at most 78% of the canvas height and 54% of its width, centered at about 58% of the canvas width; Buddy is about 38% of the canvas width (clamped to 120 to 200 pt), centered at about 27%. On canvases narrower than 340 pt, shrink Buddy to 32% and reduce the bezel overlap. Verify at 320 x 560, 360 x 640, 412 x 732, 480 x 860 and 800 x 1200 pt.

**Z-order, back to front:** floor shadow, Buddy's body, the phone, Buddy's raised paw (only while waving or resting on the bezel), the finger, particles.

**Gaze math.** Compute each eye's gaze from real stage coordinates: the vector from the eye center to the target, clamped to the eye ellipse, eased with a spring (80 to 120 ms for quick glances). Add a slight convergence for near targets, never more than 4% of eye width, and never a cross-eyed look.

**Uncanny limits.** Head rotation at most 8 degrees, face parallax at most 6% of head width, no limb stretched more than 4% of its length, left and right eyes symmetric apart from gaze, and mouth shapes only from the defined set.

**Automated checks so it never looks bad.** Write `contextRules.test.ts`: sample the whole loop every 50 ms, compute the on-screen polygons of every mascot part, and assert no overlap with the keep-clear zones, nothing outside the canvas, all rotation limits respected, no overlapping body actions, and no blink inside an exclusion window. Add a **Context** panel to the studio showing the director's current state and intent, the gaze target, a toggle that draws the keep-clear zones, a log of any violations, and a **Run context test** button that scrubs the whole loop and reports them. Finally, export a frame strip (start, middle and end of every beat) at the five canvas sizes above for a human review before this is called done.

## 6. The phone demo

**Phone.** A generic modern phone, not a copy of any brand. Aspect 9 : 19.5, corner radius about 11% of its width, bezel 2.2%, a small punch-hole camera at top center, a thin metallic edge with a highlight that shifts with tilt, and a faint glass sheen band that drifts slowly across the screen even when it is black. It casts a soft shadow onto the floor plane.

**Status bar** (inside the screen): a time (config, default 4:15), signal and Wi-Fi icons, and a battery icon with a percentage. The battery icon is white above 15% and soft red at or below 15%, drawn as vector shapes with a fill proportional to charge.

**Cartoon content.** Procedural and generic, drawn in Skia, looping seamlessly: pastel rolling hills, drifting clouds, a sun, and a soft ball that bounces across with squash and stretch. No text, no logos, no real characters. Its time scale slows during dimming (see below).

**Battery-down simulation (keep it simple and believable):**

1. The battery starts at 20%, drains to 5% (red from 15%), then to 1%. It drains at a fast but readable rate (default 2.4 s to reach 5%), with the percentage text counting.
2. At 1%, a small system-style notice slides in from the top, about 300 ms: a battery alert icon and the single line `1% Battery. Phone needs rest.` (Hindi: `बैटरी 1%। फ़ोन को आराम चाहिए।`). It stays until the dimming ends. No other text or dialogs appear anywhere in the demo.
3. Dim: a black overlay goes from 0 to 0.78 over 1.2 s, saturation drops to about 60%, and the cartoon time scale eases from 1.0 to 0.4.
4. Power off: fade to full black over 380 ms with an ease-in curve. No collapsing line, no flash, no glitch.
5. Dead screen: black glass with the sheen only, held about 1.2 s. During the hold Buddy yawns.
6. Finger enters from the lower right, taps the screen (a soft touch ripple), and a faint dead-battery glyph fades in and out over 1.4 s (peak opacity 0.35): a battery outline with a thin red sliver at the left and a small lightning bolt in the center. This is what the child will see.
7. The finger then swipes a capital A across the screen in one free-form gesture. There is no dot grid and no connected dots: it is a plain swipe, like writing a letter with a fingertip. A soft glowing trail (a thin lavender line that fades out over about 0.9 s) follows the fingertip.
   - Draw the A as two natural strokes. Stroke one starts at the bottom left, rises to the apex and descends to the bottom right. Then the finger lifts, and stroke two adds the crossbar from left to right.
   - Store each stroke as a smoothed path of normalized points (0 to 1 inside the screen) so the gesture scales to any phone size. Render it as a cubic Bezier or Catmull-Rom curve.
   - The swipe must feel hand-drawn: slight asymmetry, about 1 to 2 degrees of baseline tilt, a small overshoot at the apex, and human speed variation. The letter must still read clearly as an A.
   - No dots, no grid and no snapping appear at any point.
   - Make the gesture configurable in the studio. Default: the A preset. Also offer a free-draw mode where the developer draws any swipe on the studio phone and it is saved as the gesture.
   - Note for the developer: the original product spec describes the real unlock as a connected-dot pattern. If the real unlock is now a free swipe, update the spec so the hero shows the same gesture the parent really uses.
8. Success: a soft radial reveal expands from where the swipe ends over 700 ms with an ease-out, the cartoon returns at full brightness, the notice is gone, the battery resets to 20%, and the finger fades out.

**Finger.** A stylized fingertip, a rounded capsule with soft shading and a subtle nail highlight, entering at about 20 degrees from vertical. Its path has human motion: ease-in and ease-out per stroke, small jitter (0.6 px) and a slight speed variation. A thin contact shadow sits under it, and a pressure ring appears at touch down. The skin tone is a studio preset (six tones, one default); never hard-code one.

## 7. Master timeline

One master clock (`t` in seconds) drives everything. The intro plays once. After that the loop runs from 1.0 s to 18.0 s and must be seamless: the state at 18.0 s equals the state at 1.0 s (phone playing, battery 20%, Buddy watching).

| Beat | Time (s) | Phone | Buddy |
| :-- | :-- | :-- | :-- |
| `intro` | 0.0 to 1.0 | Slides up 24 px and fades in with a spring and soft shadow | Springs in from 0.92 scale with a squash settle, then `waveHello` |
| `playing` | 1.0 to 3.6 | Cartoon plays, battery at 20% | `watch`, idle layer |
| `drain` | 3.6 to 6.0 | Battery 20% to 5% | `glanceBattery` at about 4.6 s |
| `warning` | 6.0 to 7.4 | Battery to 1%, notice slides in | `concernedPerk` |
| `dim` | 7.4 to 8.6 | Dimming and slow-down | Gaze stays on the phone, spill light falls |
| `off` | 8.6 to 9.4 | Fade to black | Spill light gone |
| `deadHold` | 9.4 to 10.6 | Black, sheen only | `yawn` |
| `tap` | 10.6 to 12.0 | Finger enters, taps, battery glyph | `curiousTilt`, gaze on the fingertip |
| `unlock` | 12.0 to 14.6 | Finger draws stroke one, lifts, draws stroke two | Gaze follows the fingertip |
| `wake` | 14.6 to 15.6 | Radial reveal, content returns | Spill light blooms back |
| `celebrate` | 15.6 to 17.0 | Normal playback | `cheer` with soft sparkles |
| `settle` | 17.0 to 18.0 | Normal playback | `waveHello` once, then `watch` |

Easing: use cubic-bezier (0.22, 1, 0.36, 1) for entrances, (0.4, 0, 0.2, 1) for state changes, and springs with damping about 14 and stiffness about 160 for mascot motion. Every duration is read from config.

When the language changes, swap the text and restart the timeline from 1.0 s. When the app goes to the background or the screen loses focus, pause the clock. On return, resume.

## 8. Performance and fallbacks

- Target 60 fps on a mid-range Android phone, with a frame budget of 8 ms for the canvas. Use at most 2x pixel density. Do not allocate objects per frame; create `Skia.Path`, paints and runtime effects once.
- Show the first frame within 300 ms, using a static render of the bear and phone while textures load.
- Pause rendering when the screen is not focused. After 60 s with no interaction, drop to 30 fps for the idle loop.
- **Reduce Motion** (`AccessibilityInfo.isReduceMotionEnabled`): show a still composition with a slow crossfade between three still frames (playing, dead, woken), no parallax, no particles.
- **Fallback:** if Skia or the shader fails to initialize, show the static bear image with a gentle Reanimated breathing transform and a simple three-frame phone crossfade. Wrap the canvas in an error boundary.

## 9. Audio and haptics

Sound is **off by default**, with a small speaker toggle. Generate short, soft WAV files with a script (sine and filtered noise envelopes, no external assets): a low-battery chirp, a power-down sweep, a wake chime, a very soft giggle. One light haptic on Buddy tap and one on the successful unlock. All of it respects the studio toggles.

## 10. The Animation Studio

Build a dev-only route `app/dev/hero-studio.tsx` (available when `__DEV__` is true, or after tapping the logo seven times). It shows the live `HeroStage` at the top and tabbed control panels below, using the same engine as the real screen. Everything changes live with no reload.

**Playback controls:** play and pause, speed (0.25x to 2x), loop or once, a timeline scrubber with a marker for each beat, step to previous or next beat, and jump to any beat by name.

**Panels and parameters (all in one config object):**

- **Timeline:** start and end time of every beat, battery start and end percentages, the drain curve.
- **Mascot:** breathing amplitude, blink interval range, `blinkStyle`, gaze strength, face parallax strength, tilt parallax strength, ear lag, wave amplitude and cycles, squash and stretch amount, cheer intensity, sparkle count.
- **Lighting:** light direction (a draggable sphere), key intensity, ambient, specular amount and power, rim amount, screen spill intensity, shadow softness and opacity.
- **Phone:** bezel color (presets), corner radius, sheen intensity, status bar time, cartoon palette presets, dim amount, banner text.
- **Finger and pattern:** skin tone preset, finger size, stroke speed, jitter, trail color and length, the `strokes` editor (draw a swipe on the studio phone to record a custom gesture, edit its points, or pick the A preset).
- **Audio:** master mute, individual sounds.
- **Debug:** show rig polygons and pivots, show the normal map, show the light vector, show the gaze target, FPS and frame-time HUD, slow motion.

**Pose tester:** buttons that trigger `waveHello`, `blink`, `yawn`, `curiousTilt`, `cheer`, `giggle`, look left and look right on demand.

**Config tools:** presets (`Default`, `Calm`, `Reduced`), save and load through AsyncStorage, **Copy JSON** to the clipboard, **Export file** through share, **Import JSON** from the clipboard, and **Reset to defaults**. Also an **Export frames** button that renders one PNG per beat into a strip for design review.

Config shape (extend as needed, validate with a schema, and clamp every value to a safe range):

```ts
interface HeroConfig {
  version: 1;
  speed: number;                     // 0.25 to 2
  beats: Record<string, { start: number; end: number }>;
  battery: { start: number; mid: number; end: number; redBelow: number };
  mascot: {
    breath: number; blinkMin: number; blinkMax: number;
    blinkStyle: 'squash' | 'eyelid';
    gaze: number; faceParallax: number; tiltParallax: number;
    wave: { amplitudeDeg: number; cycles: number };
    squash: number; cheer: number; sparkles: number;
  };
  lighting: {
    dir: [number, number, number]; key: number; ambient: number;
    specAmount: number; specPower: number; rim: number;
    spill: number; shadowSoftness: number; shadowOpacity: number;
  };
  phone: {
    bezel: string; radius: number; sheen: number; time: string;
    palette: string; dimAmount: number;
  };
  finger: {
    skinTone: string; size: number; speed: number; jitter: number;
    strokes: Array<Array<[number, number]>>; // normalized 0 to 1 points per stroke, no dots
  };
  audio: { enabled: boolean };
}
```

## 11. Accessibility and localization

- Mark the canvas as decorative for screen readers, and give the container one label: `Animation: a phone runs out of battery and the BabyBoo bear helps`.
- Put all strings in the i18n files with English as the source and Hindi as a placeholder marked `TODO(hi)` for a native speaker. The only strings in the demo are the notice text and the status bar time.
- Use a font with Devanagari support for the Hindi notice, and verify shaping and line breaks.
- Honor Reduce Motion and the system dark and light themes (the hero sits on the app's cream background).

## 12. Acceptance checklist

- The asset pipeline runs from a clean checkout with one command and writes the contact sheet.
- At 2x zoom there are no seams, halos, holes or fur mismatches on any pose. If there are, the work stops at `docs/hero-feasibility.md`.
- The neutral pose matches the source image colors (difference under 3 in Lab) and still looks softly 3D.
- The full 18-second loop runs at 60 fps on a mid-range Android device, with no dropped frames during the language switch, and the loop is seamless.
- Every beat matches the timeline table within 30 ms.
- Buddy visibly reacts to the phone's light going out and coming back, and his gaze follows the fingertip.
- The A is clearly legible as an A when drawn.
- The studio changes every listed parameter live, and the exported JSON re-imports to an identical result.
- Reduce Motion and the fallback render correctly.
- Nothing in the demo shows a real brand, a real show, flashing content, or extra text.

Contextual checks:

- `contextRules.test.ts` passes: no overlap with the keep-clear zones in any frame, no blink inside an exclusion window, all rotation limits respected.
- At all five canvas sizes, Buddy is fully on screen, never covers the notice, the dead-battery glyph or the swipe, and the layout still looks balanced.
- The A is a free-form swipe with a trail and no dots, and reads clearly as an A at the smallest canvas size.
- A person watching one loop with the sound off can tell what Buddy is reacting to at every beat.

## 13. What to send back

When finished, report: the files created, the contact sheet and frame strip paths, measured frame times on the test device, any parts that fell back to derived art, any asset you recommend commissioning from an artist (list each exact part and pose), and any place where you deviated from this prompt and why. Do not change the character design or the timeline structure without asking.
