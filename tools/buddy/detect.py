"""Frame detection for the Buddy reference sheets.

Frames are not on a perfect grid, so each frame is found from the image
content: pixels that are clearly coloured (Buddy is saturated lavender; the
white paper and the grey floor shadows are not) are grouped into blobs.
"""

from __future__ import annotations

import cv2
import numpy as np

# Sheet name -> (rows, cols).
LAYOUT = {'buddy_turnaround': (2, 3), 'buddy_expressions': (2, 4), 'buddy_actions': (2, 3),
          'buddy_joy': (2, 3), 'buddy_celebrate': (2, 3), 'buddy_eyes_closed': (1, 1)}

# Sheet name -> frame names in reading order. None marks a cell we never use.
SHEETS: dict[str, list[str | None]] = {
    'buddy_turnaround': [
        'front', 'turn_34_left', 'profile_left',
        'back', 'profile_right', 'turn_34_right',
    ],
    'buddy_expressions': [
        'expr_happy', 'expr_laugh_closed', 'expr_sleepy_smug', 'expr_big_yawn',
        'expr_surprised_tilt', 'expr_laugh', 'expr_surprised', 'expr_worried',
    ],
    'buddy_actions': [
        'act_talking', 'act_beckon', 'act_worried_paws',
        'act_yawn', 'act_sleepy', 'act_point_right',
    ],
    'buddy_joy': [
        'joy_wave', 'joy_clasped', 'joy_arms_up',
        'joy_giggle', 'joy_content', 'joy_cover_eyes',
    ],
    'buddy_celebrate': [
        'cel_peek', 'cel_jump', 'cel_arms_up',
        'cel_arms_out', None, 'cel_happy_front',  # bottom-middle: ears off-model
    ],
    'buddy_eyes_closed': ['eyes_closed_smile'],
}


def colour_mask(rgb: np.ndarray) -> np.ndarray:
    """Pixels that belong to Buddy rather than paper or floor shadow."""
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    s = hsv[..., 1].astype(np.int32)
    v = hsv[..., 2].astype(np.int32)
    return ((s > 28) | (v < 150)).astype(np.uint8)


def _cuts(profile: np.ndarray, parts: int) -> list[tuple[int, int]]:
    """Split a 1D extent into `parts` bands at its emptiest points."""
    n = len(profile)
    if parts == 1:
        return [(0, n)]
    prof = cv2.GaussianBlur(profile.astype(np.float32).reshape(-1, 1), (1, 21), 0).ravel()
    cuts = []
    for r in range(1, parts):
        c = n * r / parts
        lo, hi = int(c - n * 0.12), int(c + n * 0.12)
        cuts.append(lo + int(np.argmin(prof[lo:hi])))
    edges = [0, *cuts, n]
    return list(zip(edges[:-1], edges[1:]))


def detect_frames(rgb: np.ndarray, layout: tuple[int, int]) -> list[tuple[int, int, int, int]]:
    """Bounding boxes (x0, y0, x1, y1) in reading order.

    Row and column cuts are placed at the emptiest lines near where they are
    expected, then each box is fitted tightly to the content in its cell.
    """
    rows, cols = layout
    m = colour_mask(rgb)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    out: list[tuple[int, int, int, int]] = []
    for y0, y1 in _cuts(m.sum(axis=1), rows):
        band = m[y0:y1]
        for x0, x1 in _cuts(band.sum(axis=0), cols):
            cell = band[:, x0:x1]
            n, lab, stats, _ = cv2.connectedComponentsWithStats(cell)
            keep = np.zeros_like(cell)
            for i in range(1, n):
                if stats[i][4] > 400:  # drop specks
                    keep[lab == i] = 1
            ys, xs = np.nonzero(keep)
            out.append((x0 + int(xs.min()), y0 + int(ys.min()), x0 + int(xs.max()) + 1, y0 + int(ys.max()) + 1))
    return out
