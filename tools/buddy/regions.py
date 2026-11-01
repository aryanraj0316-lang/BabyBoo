"""Colour regions of a Buddy cutout, classified in CIELAB.

Every opaque pixel is assigned to the nearest of a few region colours
(measured by clustering the references): fur, pink (inner ears, blush,
tongue), pad purple, mouth interior, eye black and highlight white. Shape
fitting and the likeness metrics both read these masks, so a render and a
reference are always measured the same way.
"""

from __future__ import annotations

import numpy as np
from skimage.color import rgb2lab

# Region centres in sRGB (from k-means on the front and master references).
CENTRES: dict[str, list[tuple[int, int, int]]] = {
    'fur': [(212, 193, 252), (192, 170, 252), (175, 150, 249), (151, 123, 240)],
    'pink': [(241, 152, 231), (250, 170, 225), (247, 140, 205)],
    'pad': [(116, 89, 215), (104, 78, 205), (128, 102, 226)],
    'mouth': [(80, 19, 101), (110, 40, 120), (60, 18, 70)],
    'eye': [(12, 11, 16), (27, 26, 38), (45, 40, 60)],
    'white': [(249, 249, 249), (235, 235, 245)],
}
REGIONS = list(CENTRES)


def lab(rgb: np.ndarray) -> np.ndarray:
    return rgb2lab(rgb.astype(np.float32) / 255.0)


_C_LAB = {k: lab(np.array(v, dtype=np.uint8)[None, :, :])[0] for k, v in CENTRES.items()}


def lch(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    L = lab(rgb)
    return L[..., 0], np.hypot(L[..., 1], L[..., 2]), np.degrees(np.arctan2(L[..., 2], L[..., 1]))


# Rules in CIELAB (L*, chroma, hue angle), measured on the references:
#   fur (lit to deep shadow)  L 64-80, C 43-62, h about -57
#   foot / paw pads           L ~47,  C ~77,   h about -57; deep shadow fur can match, so pads
#                             must also be compact blobs
#   pink (ears, blush, tongue)         h about -25 (well away from the fur hue)
#   mouth interior            dark, h above -45
#   eye black                 L < 25, low chroma
#   highlight white           L > 80, low chroma (counted only inside the eyes)
def classify(rgba: np.ndarray, alpha_min: int = 200) -> dict[str, np.ndarray]:
    """Boolean mask per region (opaque pixels only)."""
    import cv2

    L, C, h = lch(rgba[..., :3])
    opaque = rgba[..., 3] >= alpha_min
    eye = opaque & (L < 25) & (C < 35)
    white_any = opaque & (L > 80) & (C < 15)
    mouth = opaque & ~eye & (L < 45) & (C > 25) & (h > -45)
    pad_colour = opaque & ~eye & ~mouth & (L < 58) & (C > 62) & (h < -45)
    # Deep shadow fur can share the pad colour, but pads are compact blobs
    # (heart pads, toe beans) and shadows are large and ragged.
    pad = np.zeros_like(pad_colour)
    n, lab_img, stats, _ = cv2.connectedComponentsWithStats(pad_colour.astype(np.uint8))
    max_area = 0.03 * opaque.sum()
    for i in range(1, n):
        area = stats[i, cv2.CC_STAT_AREA]
        if area < 20 or area > max_area:
            continue
        comp = (lab_img == i).astype(np.uint8)
        cnts, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        hull = cv2.contourArea(cv2.convexHull(cnts[0]))
        if hull > 0 and area / hull > 0.8:
            pad |= comp.astype(bool)
    pink = opaque & ~eye & ~mouth & (h > -42) & (C > 22) & (L > 50)
    # Highlights sit inside the eyes: keep white only within each eye's filled outline
    # (large highlights are holes in the black, so fill the outline rather than close it).
    cnts, _ = cv2.findContours(eye.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    filled = np.zeros(eye.shape, np.uint8)
    big = [c for c in cnts if cv2.contourArea(c) > 0.002 * opaque.sum()]
    cv2.drawContours(filled, big, -1, 1, thickness=cv2.FILLED)
    near_eye = filled > 0
    white = white_any & near_eye
    fur = opaque & ~(eye | mouth | pad | pink | white)
    return {'fur': fur, 'pink': pink, 'pad': pad, 'mouth': mouth, 'eye': eye, 'white': white}
