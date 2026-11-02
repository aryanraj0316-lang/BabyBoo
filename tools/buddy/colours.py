"""Median CIELAB colours of Buddy's regions (sampled from the master)."""

from __future__ import annotations

import cv2
import numpy as np

from features import _components, _filled
from regions import classify, lab


def tongue_mask(regions: dict) -> np.ndarray:
    _, labm, statm, _ = cv2.connectedComponentsWithStats(regions['mouth'].astype(np.uint8))
    if labm.max() == 0:
        return np.zeros_like(regions['mouth'])
    mouth = labm == 1 + int(np.argmax(statm[1:, cv2.CC_STAT_AREA]))
    near = cv2.dilate(mouth.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    _, lab_p, _, _ = cv2.connectedComponentsWithStats(regions['pink'].astype(np.uint8))
    ids = np.unique(lab_p[near & regions['pink']])
    return np.isin(lab_p, ids[ids > 0])


def sample(rgba: np.ndarray) -> dict[str, list[float]]:
    regions = classify(rgba)
    L = lab(rgba[..., :3])
    opaque = rgba[..., 3] >= 200
    out: dict[str, list[float]] = {}

    def med(m: np.ndarray) -> list[float]:
        return [float(v) for v in np.median(L[m], axis=0)]

    fur = regions['fur']
    # Keep the fur interior: drop a band at the silhouette (edge pixels mix with the background).
    inner = cv2.erode(opaque.astype(np.uint8), np.ones((15, 15), np.uint8)) > 0
    f = fur & inner
    lum = L[..., 0][f]
    lo, mid_lo, mid_hi, hi = np.percentile(lum, [10, 40, 60, 92])
    out['furShadow'] = med(f & (L[..., 0] <= lo))
    out['furBase'] = med(f & (L[..., 0] >= mid_lo) & (L[..., 0] <= mid_hi))
    out['furHighlight'] = med(f & (L[..., 0] >= hi))
    band = fur & opaque & ~inner
    out['furRim'] = med(band)

    eye = regions['eye']
    out['eye'] = med(eye)
    out['eyeHighlight'] = med(regions['white']) if regions['white'].any() else [100.0, 0.0, 0.0]

    eye_y = np.mean(np.nonzero(eye)[0]) if eye.any() else rgba.shape[0] * 0.4
    mouth = regions['mouth']
    mouth_box = _filled(cv2.dilate(mouth.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0) if mouth.any() else np.zeros_like(mouth)
    out['mouth'] = med(mouth)
    # The tongue is the whole pink blob touching the dark mouth interior (not just the thin
    # ring inside the interior's outline, which is the darker blend into the mouth).
    tongue = tongue_mask(regions)
    if tongue.any():
        out['tongue'] = med(tongue)
    pinks = _components(regions['pink'] & ~mouth_box, 50)
    ears = [p['mask'] for p in pinks if p['c'][1] < eye_y]
    blush = [p['mask'] for p in pinks if p['c'][1] >= eye_y]
    if ears:
        out['innerEar'] = med(np.any(ears, axis=0))
    if blush:
        b = np.any(blush, axis=0)
        # The blush is soft: its centre (strongest pink) is the colour to match.
        a_star = L[..., 1]
        out['blush'] = med(b & (a_star >= np.percentile(a_star[b], 60)))
    pads = sorted(_components(regions['pad'], 6), key=lambda c: -c['area'])
    if pads:
        big = max(p['area'] for p in pads)
        out['pad'] = med(np.any([p['mask'] for p in pads if p['area'] > big * 0.5], axis=0))
        beans = [p['mask'] for p in pads if p['area'] <= big * 0.5]
        if beans:
            out['bean'] = med(np.any(beans, axis=0))
    return out
