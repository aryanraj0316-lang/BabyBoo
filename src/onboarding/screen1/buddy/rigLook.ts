/**
 * Buddy rig tuning: proportions and ranges of the rig's moves. Lengths are in head
 * widths. The drawing and rig code hold no numbers of their own.
 */
export const RIG_LOOK = {
  // Body
  squashX: 0.1, // squash +1: body scaleX 1.10 ...
  squashY: 0.12, // ... and scaleY 0.88 (volume-preserving feel)
  breathScale: 0.03, // breath 1: body scaleY 1.03, head rides on it
  footSpread: 0.04,
  // Head
  neckOfChin: 0.75, // neck pivot, as a fraction of the head's lower half-height
  headSquashX: 0.06,
  headSquashY: 0.08,
  nodDrop: 0.02,
  nodFace: 0.05,
  // headTurn: the measured 3/4 deltas, scaled toward the centre (the reference pushes the
  // face to the outline; Buddy keeps it more central) and clamped.
  turnCentral: 0.7,
  minEyeWidth: 0.8, // the narrower eye never drops below this share of its front width
  minMouthWidth: 0.8,
  faceMargin: 0.06, // features stay this far inside the head outline
  mouthDepthForClamp: 0.08,
  // Ears
  earHinge: 0.72, // hinge point, as a fraction of the way from the head centre to the ear
  earPerkLift: 0.03,
  earPerkStretch: 0.08,
  // Arms
  shoulderY: 0.15, // the shoulder sits up under the head (hidden by it)
  shoulderXScale: 1.0,
  restStraightness: 0.97, // rest reach / arm length: the elbow bends a little at rest
  upperArmShare: 0.5,
  ikAwayFrom: [0, 0.15] as [number, number], // IK bends the elbow away from this point (head / chest)
  padFollow: 0.3, // how much the paw pads tilt with the forearm
  // Eyes
  squeezeHeight: 0.85,
  squeezeThick: 0.34,
  squeezeDepth: 0.9,
  // Mouth: the traced smile, slightly larger (the master's mouth reads bigger than the trace)
  smileScale: 1.08,
  tongueGrow: 1.12,
  tongueDrop: 0.008,
  // Mouth shapes (other than the traced smile)
  mouthO: { rx: 0.05, ry: 0.06 },
  mouthYawn: { rx: 0.072, ry: 0.092 },
  mouthLine: 0.017,
  wavyAmp: 0.011,
  closedCurve: 0.024,
  curveAmount: 0.03,
} as const;
