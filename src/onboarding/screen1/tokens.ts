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
  bg: { top: '#F6F3FF', bottom: '#FFFFFF' },
  ink: { primary: '#1B1A24', secondary: '#6B6880' },
  brand: { lavender: '#A99BF0', lavenderDeep: '#7B6BE0' },
  cta: {
    fill: '#6E5CD6', // white label contrast 5.04:1
    fillPressed: '#5F4DC8', // 6.21:1
    label: '#FFFFFF',
  },
  dot: { core: '#EEF1FE', ring: '#5B74EE', glow: '#6A86FB' },
  battery: { green: '#34C759', amber: '#FF9F0A', red: '#FF3B30' },
  phone: {
    bezelTop: '#1C1C1F',
    bezelBottom: '#0E0E10',
    hairline: '#3A3A42', // the 1px lighter outer edge
    button: '#26262B',
    cameraPill: '#050506',
    screenOff: '#000000',
  },
  statusBar: { ink: '#FFFFFF' },
  reelUi: {
    icon: 'rgba(255,255,255,0.95)',
    skeleton: 'rgba(255,255,255,0.55)',
    skeletonSoft: 'rgba(255,255,255,0.35)',
    progressTrack: 'rgba(255,255,255,0.30)',
    progressFill: 'rgba(255,255,255,0.95)',
    scrim: 'rgba(10,8,30,0.28)', // soft bottom shade so the overlay UI reads
  },
  /** Scene halo colours per phone state (Phase 3 tweens between them). */
  halo: {
    cool: '#8E9BFF', // blue-violet while reels play
    off: '#C9C4E8', // near nothing at shutdown
    warm: '#FFC6B4', // peach-lavender on unlock
  },
  /** One shadow language: tinted lavender, never grey. */
  shadowTint: 'rgba(90, 70, 180, 1)',
  languageToggle: {
    track: 'rgba(123, 107, 224, 0.08)',
    thumb: '#FFFFFF',
    label: '#6B6880',
    labelActive: '#1B1A24',
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
  maxHeightPt: 159,
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
  cameraPill: { widthOfScreen: 0.24, heightOfScreen: 0.062, topOfScreen: 0.03 },
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
  opacity: 0.35, // brief range 0.35-0.5; must not be noticed at first glance
} as const;

export const contactShadow = {
  /** One merged floor shadow under the phone and Buddy. */
  heightOfBuddy: 0.075,
  /** Extends this far past the phone's left edge and Buddy's right edge, as a fraction of Buddy's height. */
  overhangOfBuddy: 0.04,
  blurOfBuddy: 0.05, // Skia blur sigma as a fraction of Buddy's height
  opacity: 0.22,
} as const;

// ---------------------------------------------------------------------------
// Phone screen content
// ---------------------------------------------------------------------------

export const statusBar = {
  heightOfScreen: 0.065, // band at the top of the screen
  fontSizeOfScreen: 0.055, // relative to the screen width
  sidePaddingOfScreen: 0.075,
  time: '9:41',
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

/** Five designed reel clips: background gradient and shape colours. */
export const reels = [
  { id: 'balloons', bg: ['#7FD0FF', '#B7A8FF'], shapes: ['#FF8FB1', '#FFD36E', '#8EF0C0'] },
  { id: 'stars', bg: ['#5B4BD8', '#9C6BFF'], shapes: ['#FFE27A', '#FFFFFF', '#FFB4E1'] },
  { id: 'ball', bg: ['#FFB36B', '#FF7FA8'], shapes: ['#FFFFFF', '#4CC3FF', '#FFE27A'] },
  { id: 'clouds', bg: ['#6EE7C8', '#56B8FF'], shapes: ['#FFFFFF', '#FFFFFF', '#FFE27A'] },
  { id: 'bubbles', bg: ['#FF9AD5', '#A88BFF'], shapes: ['#FFFFFF', '#7FF2E6', '#FFE27A'] },
] as const;

// ---------------------------------------------------------------------------
// Page layout
// ---------------------------------------------------------------------------

export const page = {
  marginH: 24,
  topBarHeight: 44,
  /** Minimum air between the scene and the text block. */
  sceneTextGapMin: 16,
  /** Minimum air above the scene. */
  sceneTopGapMin: 8,
  /** Air below the CTA, added to the bottom safe-area inset. */
  ctaBottomGap: 16,
} as const;

// ---------------------------------------------------------------------------
// Typography: the project's system font, three styles only
// ---------------------------------------------------------------------------

export const type = {
  headline: { size: 26, weight: '600' as const, lineHeight: { latin: 1.18, devanagari: 1.5 }, letterSpacing: -0.4 },
  subline: { size: 16, weight: '400' as const, lineHeight: { latin: 1.45, devanagari: 1.7 } },
  cta: { size: 17, weight: '600' as const },
  /** Language toggle labels reuse the subline style at a smaller size. */
  toggle: { size: 13 },
  /** Large accessibility font sizes are honoured up to this multiplier. */
  maxFontScale: 1.4,
} as const;

export const textBlock = {
  headlineToSubline: 8,
  sublineToCta: 24,
  maxWidth: 360, // keeps line length comfortable on wide screens
} as const;

export const cta = {
  height: 54, // minimum; grows with large accessibility fonts
  paddingV: 8,
  radius: 27, // fully rounded, matching the app's primary buttons
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
