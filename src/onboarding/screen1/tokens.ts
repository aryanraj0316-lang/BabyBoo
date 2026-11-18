/**
 * Onboarding screen 1: every colour, size, ratio, timing and easing.
 *
 * Tune the screen here. Components read these values and hold no magic
 * numbers of their own. Sizes are in points unless a name says otherwise;
 * "ratio" values are fractions of the named reference size.
 */

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

export const palette = {
  bg: { top: '#E7F5E6', bottom: '#FFFFF1' },
  ink: { primary: '#213F30', secondary: '#506757' },
  brand: { lavender: '#A99BF0', lavenderDeep: '#7B6BE0' },
  cta: {
    fill: '#6347A5',
    fillPressed: '#52398D',
    label: '#FFFFFF',
  },
  dot: { core: '#EEF1FE', ring: '#5B74EE', glow: '#6A86FB' },
  battery: { green: '#34C759', amber: '#FF9F0A', red: '#FF3B30' },
  phone: {
    bezelTop: '#1C1C1F',
    bezelBottom: '#0E0E10',
    hairline: '#3A3A42', // the 1px lighter outer edge
    button: '#26262B',
    camera: '#050506',
    screenOff: '#000000',
  },
  statusBar: { ink: '#FFFFFF', inkOnLight: '#1B1A24' }, // white over reels, dark over the light home wallpaper
  reelUi: {
    icon: 'rgba(255,255,255,0.95)',
    skeleton: 'rgba(255,255,255,0.55)',
    skeletonSoft: 'rgba(255,255,255,0.35)',
    progressTrack: 'rgba(255,255,255,0.30)',
    progressFill: 'rgba(255,255,255,0.95)',
    scrim: 'rgba(0,0,0,0.22)', // neutral soft bottom shade so the overlay UI reads
  },
  /** Scene halo colours per phone state (Phase 3 tweens between them). */
  halo: {
    cool: '#8E9BFF', // blue-violet while reels play
    off: '#C9C4E8', // near nothing at shutdown
    warm: '#FFC6B4', // peach-lavender on unlock
  },
  /** One shadow language: tinted lavender, never grey. */
  shadowTint: 'rgba(54, 73, 48, 1)',
  languageToggle: {
    track: 'rgba(255, 255, 255, 0.65)',
    thumb: '#FFFFFF',
    label: '#607365',
    labelActive: '#213F30',
  },
} as const;

// ---------------------------------------------------------------------------
// Depth and surfaces
// ---------------------------------------------------------------------------

/** One radius scale. The phone's outer radius scales with the phone. */
export const radius = { s: 8, m: 16, l: 24, phoneOuter: 44 } as const;

/**
 * Soft, large-radius, low-opacity, lavender-tinted shadow (two layers).
 * `blur` is the CSS-style blur radius; Skia takes half of it as sigma.
 */
export const shadow = {
  ambient: { dx: 0, dy: 24, blur: 48, opacity: 0.14 },
  key: { dx: 0, dy: 4, blur: 12, opacity: 0.08 },
} as const;

// ---------------------------------------------------------------------------
// Buddy sizing (decisions log: Buddy max 159pt on every device)
// ---------------------------------------------------------------------------

export const buddy = {
  /** Max displayed height of the watching frame's visible fur, in points. */
  maxHeightPt: 145,
  /** Buddy's height as a fraction of the phone's outer height. */
  heightOfPhone: 0.4,
  /** How far Buddy's visible fur overlaps the phone's right edge, as a fraction of his visible width. */
  overlapOfWidth: 0.12,
} as const;

// ---------------------------------------------------------------------------
// Phone mockup (all ratios scale with the phone, so it looks the same everywhere)
// ---------------------------------------------------------------------------

export const phone = {
  /** Outer height / outer width. A modern 19.5:9 phone with its bezel. */
  aspect: 2.06,
  /** Bezel thickness as a fraction of the outer width. */
  bezelOfWidth: 0.034,
  /** Outer radius at the reference outer width below; scaled with the phone. */
  radiusRefWidth: 193,
  hairlineWidth: 1,
  /** Small round punch-hole camera at the top centre (Android style). */
  camera: { diameterOfScreen: 0.052, centreFromTopOfScreen: 0.058 },
  buttons: {
    thickness: 1.6, // how far each button stands out from the bezel
    // Positions as fractions of the outer height, from the top.
    volumeUp: { top: 0.2, length: 0.075 },
    volumeDown: { top: 0.295, length: 0.075 },
    power: { top: 0.245, length: 0.11 },
  },
  /** Faint diagonal glass sheen: stays visible on a black screen. */
  sheen: { opacity: 0.05, from: 0.0, to: 0.55 },
} as const;

// ---------------------------------------------------------------------------
// Scene: halo and contact shadow
// ---------------------------------------------------------------------------

export const halo = {
  /** Radius as a multiple of the phone's outer height. */
  radiusOfPhoneHeight: 0.62,
  /** Centre, relative to the phone's centre, as fractions of the phone's height. */
  offsetYOfPhoneHeight: 0.02,
  opacity: 0.12,
} as const;

export const contactShadow = {
  /** One merged floor shadow under the phone and Buddy. */
  heightOfBuddy: 0.075,
  /** Extends this far past the phone's left edge and Buddy's right edge, as a fraction of Buddy's height. */
  overhangOfBuddy: 0.04,
  blurOfBuddy: 0.05, // Skia blur sigma as a fraction of Buddy's height
  opacity: 0.22,
  /** One soft stationary ground shadow, tucked beneath the seated silhouette. */
  buddyWidthOfCanvas: 0.82,
  buddyAmbientOpacity: 0.14,
  buddyBlurOfHeight: 0.055,
} as const;

// ---------------------------------------------------------------------------
// Phone screen content
// ---------------------------------------------------------------------------

export const statusBar = {
  fontSizeOfScreen: 0.055, // relative to the screen width
  sidePaddingOfScreen: 0.075,
  time: '7:30',
  battery: {
    widthOfScreen: 0.085,
    heightOfScreen: 0.04,
    level: 0.23, // Beat 1
  },
} as const;

export const reelUi = {
  railRightOfScreen: 0.055, // right inset of the action rail
  railIconOfScreen: 0.082, // icon size
  railGapOfScreen: 0.075, // gap between icon groups
  railBottomOfScreen: 0.22, // bottom of the rail from the screen bottom
  countBar: { widthOfScreen: 0.06, heightOfScreen: 0.014 },
  caption: {
    leftOfScreen: 0.06,
    bottomOfScreen: 0.085,
    lineHeightOfScreen: 0.02,
    gapOfScreen: 0.022,
    widthsOfScreen: [0.52, 0.34],
  },
  progress: { heightOfScreen: 0.008, bottomOfScreen: 0.035, sideOfScreen: 0.06 },
  scrimOfScreen: 0.42, // height of the soft bottom shade
} as const;

/**
 * Five designed reel clips: background gradient (top, bottom) and shape colours.
 * No lavender or violet anywhere, so Buddy and the page always stand apart
 * from the phone screen. Reel 1 is the one seen at rest and in the
 * reduced-motion still, so its lower half (where Buddy overlaps) is mint.
 */
export const reels = [
  { id: 'balloons', bg: ['#3CC6CC', '#A8F0C8'], shapes: ['#FF7A8A', '#FFD45E', '#FFFFFF'] }, // teal to mint
  { id: 'stars', bg: ['#16406A', '#2B8FB0'], shapes: ['#FFE27A', '#FFFFFF', '#FF9E80'] }, // night ocean
  { id: 'ball', bg: ['#FFC48C', '#FF7F6E'], shapes: ['#FFFFFF', '#3CC6CC', '#FFE27A'] }, // sunset peach to coral
  { id: 'clouds', bg: ['#4FB3F6', '#8FE3D8'], shapes: ['#FFFFFF', '#FFFFFF', '#FFE27A'] }, // sky to aqua
  { id: 'bubbles', bg: ['#C8EB7A', '#4FC48A'], shapes: ['#FFFFFF', '#FFE27A', '#3CC6CC'] }, // lime to green
] as const;

// ---------------------------------------------------------------------------
// Page layout
// ---------------------------------------------------------------------------

export const page = {
  marginH: 24,
  topBarHeight: 44,
  /** Fixed gap from the floor (phone bottom, Buddy's baseline) to the headline. */
  floorToHeadline: 28,
  /** Spare height is shared out above the scene and below the CTA. */
  spareAbove: 0.40,
  spareBelow: 0.60,
  /** Minimum air between the language toggle and the top of the phone. */
  minAirAbove: 8,
  /** Air below the CTA, added to the bottom safe-area inset. */
  ctaBottomGap: 22,
} as const;

// ---------------------------------------------------------------------------
// Typography: the project's system font, three styles only
// ---------------------------------------------------------------------------

export const type = {
  headline: { size: 27, weight: '600' as const, family: { android: 'serif', ios: 'Georgia', default: 'Georgia' }, lineHeight: { latin: 1.18, devanagari: 1.5 }, letterSpacing: -0.55 },
  subline: { size: 15, weight: '400' as const, family: { android: 'sans-serif', ios: 'System', default: 'system-ui' }, lineHeight: { latin: 1.5, devanagari: 1.7 } },
  cta: { size: 17, weight: '600' as const, family: { android: 'sans-serif', ios: 'System', default: 'system-ui' } },
  /** Language toggle labels reuse the subline style at a smaller size. */
  toggle: { size: 13 },
  /** Large accessibility font sizes are honoured up to this multiplier. */
  maxFontScale: 1.4,
} as const;

export const textBlock = {
  headlineToSubline: 10,
  sublineToCta: 20,
  maxWidth: 360, // keeps line length comfortable on wide screens
} as const;

/** Quiet dialogue surface. Opacity only; never moves Buddy or the bubble. */
export const speechBubble = {
  maxWidth: 140, phoneGap: 8, headGap: 9, edgeInset: 12,
  paddingH: 12, paddingV: 10, radius: 16, tail: 8,
  fontSize: 13, lineHeight: 19,
  surface: '#FFFEF7', ink: '#303A34', shadow: '#3C4938',
  fadeSeconds: 0.075, // 150ms fade-through between adjacent text turns
} as const;

export const cta = {
  height: 56, // minimum; grows with large accessibility fonts
  paddingV: 8,
  radius: 20,
  pressScale: 0.97,
} as const;

export const languageToggle = {
  height: 30,
  paddingH: 12,
  thumbInset: 3,
} as const;

// ---------------------------------------------------------------------------
// Motion tokens (section 9). Only these are used.
// ---------------------------------------------------------------------------

export const ease = {
  standard: [0.2, 0.0, 0.0, 1.0],
  decelerate: [0.2, 0.8, 0.2, 1.0],
  accelerate: [0.4, 0.0, 1.0, 1.0],
} as const;

export const spring = {
  snappy: { stiffness: 520, dampingRatio: 0.75 },
  soft: { stiffness: 220, dampingRatio: 0.85 },
  bouncy: { stiffness: 320, dampingRatio: 0.6 },
} as const;

export const duration = { frame: 150, short: 250, medium: 400, long: 600 } as const;

// ---------------------------------------------------------------------------
// The demo (Phase 3): one master clock, named beats. Times in seconds.
// ---------------------------------------------------------------------------

// Extra quiet time requested before the parent hand-off. Later beats move
// together so the A gesture and ending keep their existing durations.
const extraSleep = 2.0;
/** Start the battery reaction after ~1.6 reel scrolls. */
export const introTrim = 3.6;
/** Cut unused watching/holding time rather than stretching the supplied clips. */
const endingTrim = 4.5;
export const demo = {
  loop: 24.0 + extraSleep - endingTrim,
  beats: {
    reels: 0, // Beat 1
    battery: 7.5 - introTrim, // Beat 2
    shutdown: 8.4, // Beat 3
    unlock: 15.5 + extraSleep - endingTrim, // Beat 4: draw A on the dark screen
    unlocked: 19.0 + extraSleep - endingTrim, // Beat 5
    rest: 21.5 + extraSleep - endingTrim, // Beat 6
  },
  /** Composed still for reduced motion: unlocked home screen, Buddy waving, warm halo. */
  stillTime: 20.8 + extraSleep - endingTrim,
} as const;

/**
 * Reel swipes. Each swipe moves the feed up one reel with spring.snappy whose
 * stiffness is scaled by `energy` (Beat 2's swipes slow down). The last one
 * stalls: it travels `stall.reach` of a reel, then settles back.
 */
export const swipes = {
  // One full scroll, then a partial second: react before showing four reels.
  times: [1.5, 3.0],
  distance: [1, 0.6],
  energy: [0.45, 0.22],
  stall: { time: 7.5 - introTrim, reach: 0.08, rise: 0.55, settle: 0.7 },
  /** Vertical stretch at full swipe speed, released as it settles. */
  stretch: 0.02,
} as const;

/** Tutorial hand appears only around the actual reel scroll events. */
export const reelGesture = {
  lead: 0.38, fadeInEnd: -0.16, fadeOutFrom: 0.44, end: 0.70,
  xOfScreen: 0.60, startYOfScreen: 0.74, travelOfScreen: 0.43,
  widthOfScreen: 0.43, aspect: 2 / 3,
  fingertipX: 0.215, fingertipY: 0.16,
  opacity: 0.78, wristTilt: 0.15, wristFlex: 0.06,
} as const;

/** Foliage uses the story's shared clock and is still under reduced motion. */
export const meadowBreeze = {
  cyclesPerLoop: 5, secondaryCycles: 3, radians: 0.055,
  branches: [
    { x: -0.055, y: -0.022, width: 0.29, rotation: -0.16, mirror: false, phase: 0 },
    { x: 1.025, y: 0.31, width: 0.20, rotation: -0.38, mirror: true, phase: 1.4 },
    { x: -0.045, y: 0.84, width: 0.26, rotation: -0.95, mirror: false, phase: 2.2 },
    { x: 1.035, y: 0.87, width: 0.23, rotation: -0.88, mirror: true, phase: 3.1 },
  ],
} as const;

export const parentGesture = {
  widthOfScreen: 0.50, aspect: 2 / 3, fingertipX: 0.14, fingertipY: 0.11,
  opacity: 0.82, wristTilt: 0.12, wristFlex: 0.035,
} as const;

export const battery = {
  start: 0.03,
  end: 0,
  drainFrom: 9.0 - introTrim,
  drainTo: 8.3,
  amberBelow: 0.23,
  redBelow: 0.10,
  /** Colour tween width around each threshold (battery fraction). */
  blend: 0.015,
  /** Fresh session after unlock. */
  home: 0.8,
} as const;

export const toast = {
  inAt: 7.6 - introTrim,
  outAt: 8.4 - introTrim,
  topOfScreen: 0.1, // resting top, below the status bar
  heightOfScreen: 0.075,
  widthOfScreen: 0.62,
  fontSizeOfScreen: 0.052,
  iconWidthOfScreen: 0.06,
  fill: 'rgba(28,28,32,0.72)', // over a backdrop blur
  blur: 10,
  text: '#FFFFFF',
} as const;

export const batteryTakeover = {
  from: 8.3 - introTrim, length: 0.7,
  background: ['#11131A', '#211D2D'],
  widthOfScreen: 0.46, heightOfScreen: 0.35, topOfScreen: 0.30,
  radiusOfWidth: 0.045, strokeOfWidth: 0.009, insetOfWidth: 0.026,
  capWidthOfScreen: 0.18, capHeightOfScreen: 0.025,
  counterSizeOfScreen: 0.25, counterYOfScreen: 0.79,
  labelSizeOfScreen: 0.080, labelYOfScreen: 0.20,
  outline: '#9C99AA', ink: '#F0EDF8', housing: '#272631',
  waveOfWidth: 0.009, waveSpeed: 3.2,
} as const;

export const emptyBattery = {
  inAt: 8.3,
  widthOfScreen: 0.26,
  heightOfScreen: 0.12, // of the screen width
  scaleFrom: 0.9,
  stroke: 'rgba(255,255,255,0.9)',
  sliverOfInner: 0.08,
} as const;

export const dim = {
  at: 8.4,
  length: 1.0,
  /** Remaining saturation and contrast when fully dim (the screen loses colour as it fades). */
  saturation: 0.15,
  contrast: 0.8,
} as const;

export const homePill = {
  inAt: 9.9,
  widthOfScreen: 0.3,
  height: 4,
  bottomOfScreen: 0.025,
  opacity: 0.35,
  activeOpacity: 0.7, // brightened while the dot is on it
  color: '#D9D9DE',
} as const;

/** Beat 4 timings, relative to demo.beats.unlock (seconds). */
export const unlock = {
  appear: [0, 0.35],
  hold: [0.35, 0.65],
  swipe: [0.65, 2.75],
  release: [2.75, 3.5],
  settle: [3.15, 3.9],
  // Authored finger strokes: one loose up/down stroke, then a lifted crossbar.
  // Each starts with a point, followed by cubic control/control/end triples.
  aStrokes: [
    [[0.21, 0.72], [0.25, 0.69], [0.285, 0.58], [0.315, 0.54],
     [0.35, 0.49], [0.385, 0.435], [0.408, 0.395],
     [0.432, 0.36], [0.465, 0.30], [0.486, 0.314],
     [0.502, 0.322], [0.507, 0.375], [0.522, 0.412],
     [0.545, 0.475], [0.578, 0.54], [0.595, 0.574],
     [0.622, 0.642], [0.654, 0.702], [0.695, 0.73]],
    [[0.29, 0.58], [0.36, 0.56], [0.39, 0.589], [0.45, 0.574],
     [0.52, 0.565], [0.57, 0.548], [0.66, 0.552]],
  ],
  aLegEnd: 0.36, aSidesEnd: 0.72, aCrossbarStart: 0.82,
  /** How far the dot travels, as a fraction of the screen height. */
  travelOfScreen: 0.45,
  lockFadeTo: 0.6,
} as const;

export const dot = {
  diameterOfScreen: 0.11,
  minDiameter: 20,
  coreOfDiameter: 0.65,
  ringWidthOfDiameter: 0.09,
  glowRadiusOfDiameter: 0.4,
  glowOpacity: 0.45,
  glowPulse: 1.15,
  appearScale: 0.6,
  releaseScale: 0.85,
  releaseCoreOpacity: 0.35,
  /** Gap between the home pill and the dot's centre, as a fraction of the dot diameter. */
  aboveHomePill: 0.9,
  trailColor: [106, 134, 251] as const, // dot.glow as RGB
  trailOpacity: 0.45,
} as const;

export const home = {
  scaleFrom: 0.97,
  wallpaper: ['#E6DEFF', '#FFE2D2'], // gentle lavender to peach
  blobs: [
    { x: 0.25, y: 0.3, r: 0.5, color: 'rgba(255,255,255,0.45)' },
    { x: 0.8, y: 0.72, r: 0.45, color: 'rgba(255,196,170,0.45)' },
  ],
  blobBlurOfScreen: 0.12,
  grid: { cols: 4, rows: 3, topOfScreen: 0.16, sideOfScreen: 0.1, iconOfScreen: 0.15, rowGapOfScreen: 0.075 },
  iconRadiusOfIcon: 0.28,
  glyphOfIcon: 0.46,
  glyphColor: 'rgba(255,255,255,0.95)',
  /** Soft pastel icon colours, one per icon. */
  iconColors: [
    '#FFB3A7', '#9ED9C8', '#A7C7FF', '#FFD98A',
    '#C7B8FF', '#8FD3E8', '#FFC2DA', '#B9E59A',
    '#FFCFA3', '#A3E3D0', '#D5C2FF', '#9EC9F0',
  ],
  iconsFrom: 3.25, // relative to the unlock beat: as the home screen settles
  stagger: 0.025,
  iconScaleFrom: 0.85,
  iconDuration: 0.25,
} as const;

/** Scene halo states (palette.halo colours) and when they change. */
export const haloTimeline = {
  dimFactor: 0.08, // what is left of the halo at shutdown
  warmAt: demo.beats.unlock + unlock.release[0],
  warmLength: 0.9,
} as const;

/** Loop seam: the phone screen and Buddy crossfade back to Beat 1. */
export const loopSeam = { at: demo.loop - 0.8, length: 0.8 } as const;

// ---------------------------------------------------------------------------
// Buddy: performance (section 7)
// ---------------------------------------------------------------------------

/** Frame changes: [time, frame, big]. Big changes get anticipation. */
export const buddyTimeline = [
  [0, 'watch_34_left', false],
  [7.6 - introTrim, 'worried_wavy', false],
  [6.4, 'worried_paws', false],
  [8.6, 'yawn', false],
  [9.85, 'sleepy', false],
  [demo.beats.unlock, 'surprised', false],
  [demo.beats.unlock + unlock.swipe[0], 'point_left', false],
  [demo.beats.unlocked, 'arms_up', false],
  [demo.beats.unlocked + 1.2, 'wave', false],
  [demo.beats.rest, 'happy_front', false],
  [loopSeam.at, 'watch_34_left', false],
] as const;

export const buddyMotion = {
  crossfade: 0.15, // duration.frame
  pop: { down: 0.97, up: 1.03, downAt: 0.05, upAt: 0.16 },
  anticipation: { dip: 2, lead: 0.08 },
  breath: {
    amplitude: 0.02,
    period: 2.2,
    sleepy: { period: 3.2, amplitude: 0.03, sink: 2, from: 6.2, to: 6.8 },
    worried: { period: 1.5, amplitude: 0.012, lean: -1.5, from: 3.5, to: 5.6 }, // degrees; negative leans left, toward the phone
    blend: 0.3,
  },
  sway: { degrees: 1, period: 3.4 },
  bounce: {
    at: 8.1 + 0.16, // after the arms-up pop
    height: 8,
    takeoff: 0.08,
    air: 0.4,
    land: 0.08,
    recover: 0.19,
    squash: { x: 1.04, y: 0.96 },
    stretch: { x: 0.97, y: 1.03 },
    shadowShrink: 0.25,
    shadowLighten: 0.4,
  },
} as const;

/** Phone light on Buddy: a gradient masked to his alpha (srcATop). */
export const buddyLight = {
  cool: { color: '#DCE6FF', intensity: 0.22 },
  warm: { color: '#FFD7C2', intensity: 0.18 },
  farShadow: { color: '#2A2560', intensity: 0.1 },
  ambient: 0.04, // what remains in the dark
  flicker: { amount: 0.04, decay: 0.25 },
  /** The lit side spans this fraction of the canvas width from the phone side. */
  reach: 0.75,
} as const;

/**
 * The designed mini-scene in each reel (same order as `reels`). Positions and
 * sizes are fractions of the reel: x and r of its width, y of its height.
 * Each shape bobs by `bob` (fraction of the height) and may drift and spin,
 * so every reel reads as video, not a still card.
 */
export const reelShapes = {
  bobSpeed: 2.2, // radians per second
  scenes: [
    // balloons: [x, y, r, bob, phase]
    { kind: 'balloons', items: [[0.32, 0.36, 0.11, 0.012, 0], [0.62, 0.28, 0.13, 0.012, 1.3], [0.48, 0.5, 0.1, 0.014, 2.4]] },
    { kind: 'stars', items: [[0.28, 0.28, 0.08, 0.01, 0], [0.68, 0.4, 0.11, 0.01, 1], [0.44, 0.58, 0.065, 0.012, 2]] },
    { kind: 'ball', items: [[0.5, 0.44, 0.16, 0.03, 0], [0.24, 0.24, 0.05, 0.008, 1.7], [0.78, 0.6, 0.04, 0.01, 0.6]] },
    { kind: 'clouds', items: [[0.26, 0.36, 0.09, 0.008, 0], [0.62, 0.52, 0.08, 0.008, 1.5], [0.72, 0.22, 0.09, 0.006, 0.4]] },
    { kind: 'bubbles', items: [[0.3, 0.32, 0.08, 0.016, 0], [0.64, 0.44, 0.12, 0.014, 1.1], [0.42, 0.62, 0.06, 0.018, 2.2]] },
  ],
  /** Star spin and cloud drift. */
  spinSpeed: 0.6, // radians per second
  drift: 0.03, // fraction of the width
  balloonString: { lengthOfHeight: 0.16, width: 1, color: 'rgba(255,255,255,0.8)' },
  highlight: 'rgba(255,255,255,0.45)',
} as const;
