"""Colour-match Buddy frames that came from separate generations.

Only the body fur is measured: opaque pixels away from the soft edge, in
Buddy's lavender range. Eyes, mouth, pink ears, blush and the deeper violet
foot pads fall outside that range and are left out.

The correction is one global adjustment per frame (never per region), made
in CIELAB because HSL saturation barely registers differences in pastel fur:
  - hue: a small rotation in the a*b* plane
  - chroma: a gain that depends on hue, one value for the lavender fur and
    one for the pink, blended smoothly (near-neutral eyes and highlights
    barely move)
  - lightness: an L* curve with 0 and 100 pinned (black and white stay put)
"""

from __future__ import annotations

import cv2
import numpy as np

# Body fur, in OpenCV HLS_FULL terms: hue in degrees, L and S in 0..1.
# Measured by clustering the reference frame: the fur shades sit at hue
# 254-259, L 0.71-0.87, S 0.79-0.93. Excluded by these ranges:
#   pink ears and blush  hue ~307          mouth   hue ~285, L 0.24
#   foot pads            L 0.60, S 0.61    eyes    L 0.05
#   white highlights     S 0.01
FUR_HUE = (244.0, 268.0)
FUR_SAT = (0.75, 1.0)
FUR_LIGHT = (0.66, 0.92)
# The matte leaves the fur interior at alpha 250-254, not 255.
OPAQUE = 250


def to_hls(rgb: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(rgb.astype(np.float32) / 255.0, cv2.COLOR_RGB2HLS_FULL)


def fur_mask(rgba: np.ndarray) -> np.ndarray:
    hls = to_hls(rgba[..., :3])
    h, l, s = hls[..., 0], hls[..., 1], hls[..., 2]
    opaque = (rgba[..., 3] >= OPAQUE).astype(np.uint8)
    inner = cv2.erode(opaque, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))) > 0
    return (
        inner
        & (h >= FUR_HUE[0]) & (h <= FUR_HUE[1])
        & (s >= FUR_SAT[0]) & (s <= FUR_SAT[1])
        & (l >= FUR_LIGHT[0]) & (l <= FUR_LIGHT[1])
    )


def fur_stats(rgba: np.ndarray) -> dict[str, float]:
    """Median fur colour: HSL (hue deg, sat, light 0..1) and CIELAB (L*, C*, h deg)."""
    m = fur_mask(rgba)
    hls = to_hls(rgba[..., :3])[m]
    lab = to_lab(rgba[..., :3])[m]
    return {
        'hue': float(np.median(hls[:, 0])),
        'sat': float(np.median(hls[:, 2])),
        'light': float(np.median(hls[:, 1])),
        'L': float(np.median(lab[:, 0])),
        'C': float(np.median(np.hypot(lab[:, 1], lab[:, 2]))),
        'h': float(np.median(np.degrees(np.arctan2(lab[:, 2], lab[:, 1])))),
        'pixels': int(m.sum()),
    }


def delta_e(s: dict[str, float], ref: dict[str, float]) -> float:
    """Colour difference of the fur medians (CIE76 in L*C*h form)."""
    dh = 2 * np.sqrt(s['C'] * ref['C']) * np.sin(np.radians(s['h'] - ref['h']) / 2)
    return float(np.sqrt((s['L'] - ref['L']) ** 2 + (s['C'] - ref['C']) ** 2 + dh ** 2))


def to_lab(rgb: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(rgb.astype(np.float32) / 255.0, cv2.COLOR_RGB2Lab)


# Pink (inner ears, blush) in OpenCV HLS_FULL terms; measured at hue ~307.
PINK_HUE = (290.0, 335.0)
PINK_SAT_MIN = 0.5
PINK_LIGHT_MIN = 0.6

# CIELAB hue angles for the chroma blend: fur sits near -57 deg, pink near
# -30 deg. Below FUR_EDGE the fur gain applies, above PINK_EDGE the pink gain,
# with a smooth blend in between.
FUR_EDGE = -50.0
PINK_EDGE = -38.0


def pink_mask(rgba: np.ndarray) -> np.ndarray:
    hls = to_hls(rgba[..., :3])
    opaque = (rgba[..., 3] >= OPAQUE).astype(np.uint8)
    inner = cv2.erode(opaque, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))) > 0
    return (
        inner
        & (hls[..., 0] >= PINK_HUE[0]) & (hls[..., 0] <= PINK_HUE[1])
        & (hls[..., 2] >= PINK_SAT_MIN) & (hls[..., 1] >= PINK_LIGHT_MIN)
    )


def chroma_at(rgba: np.ndarray, mask: np.ndarray) -> float:
    lab = to_lab(rgba[..., :3])[mask]
    return float(np.median(np.hypot(lab[:, 1], lab[:, 2])))


def apply(rgba: np.ndarray, c: dict[str, float]) -> np.ndarray:
    """One global colour transform in CIELAB: hue rotation, chroma gain, L* curve.

    HSL saturation sits near its ceiling for pastel fur and barely registers
    the differences between frames, so the match is done in CIELAB, which
    tracks perceived lightness and colourfulness. The chroma gain depends on
    each pixel's hue: lavender gets the fur gain, pink gets its own gain, so
    lifting pale fur does not over-saturate the blush. The L* curve pins 0 and
    100, and near-neutral pixels (black eyes, white highlights) have almost no
    chroma to scale, so they stay as they are.
    """
    lab = to_lab(rgba[..., :3])
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    L = 100.0 * np.clip(L / 100.0, 0, 1) ** c['L_gamma']
    t = np.radians(c['h_shift'])
    a1 = a * np.cos(t) - b * np.sin(t)
    b1 = a * np.sin(t) + b * np.cos(t)
    hue = np.degrees(np.arctan2(b1, a1))
    w = np.clip((hue - FUR_EDGE) / (PINK_EDGE - FUR_EDGE), 0, 1)
    w = w * w * (3 - 2 * w)  # smoothstep
    gain = c['C_gain'] * (1 - w) + c['C_gain_pink'] * w
    rgb = cv2.cvtColor(np.dstack([L, a1 * gain, b1 * gain]).astype(np.float32), cv2.COLOR_Lab2RGB)
    out = rgba.copy()
    out[..., :3] = np.clip(rgb * 255.0 + 0.5, 0, 255).astype(np.uint8)
    return out


IDENTITY = {'h_shift': 0.0, 'C_gain': 1.0, 'C_gain_pink': 1.0, 'L_gamma': 1.0}


def match(rgba: np.ndarray, ref: dict[str, float], ref_pink_C: float, passes: int = 4) -> tuple[np.ndarray, dict[str, float]]:
    """Find the global transform that puts this frame's fur and pink medians on the reference.

    Medians move slightly non-linearly (pixels cross the mask edges), so the
    parameters are refined over a few passes against the original pixels.
    The pink is measured at the same pixel positions throughout.
    """
    pink = pink_mask(rgba)
    c = dict(IDENTITY)
    for _ in range(passes):
        out = apply(rgba, c)
        s = fur_stats(out)
        c['h_shift'] += ref['h'] - s['h']
        c['C_gain'] *= ref['C'] / s['C']
        c['C_gain_pink'] *= ref_pink_C / chroma_at(out, pink)
        c['L_gamma'] *= float(np.log(ref['L'] / 100.0) / np.log(s['L'] / 100.0))
    return apply(rgba, c), c
