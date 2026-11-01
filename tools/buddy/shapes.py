"""The shape family Buddy is built from, shared by the fitter and the app.

A part is a generalised superellipse in its own frame (centre cx, cy;
rotation rot in radians): half-width rx, half-heights ryTop / ryBot above and
below the centre, and roundness exponents nTop / nBot (2 = ellipse, higher =
squarer). The same formula is evaluated in the app's SkSL shader, so a fitted
part renders exactly as it was fitted.
"""

from __future__ import annotations

import numpy as np

PART_KEYS = ('cx', 'cy', 'rx', 'ryTop', 'ryBot', 'nTop', 'nBot', 'rot')


def radial(part: dict, xs: np.ndarray, ys: np.ndarray) -> np.ndarray:
    """Superellipse 'radius' of each point: < 1 inside, 1 on the outline."""
    c, s = np.cos(-part['rot']), np.sin(-part['rot'])
    dx, dy = xs - part['cx'], ys - part['cy']
    qx = dx * c - dy * s
    qy = dx * s + dy * c
    top = qy < 0
    ry = np.where(top, part['ryTop'], part['ryBot'])
    n = np.where(top, part['nTop'], part['nBot'])
    return (np.abs(qx / part['rx']) ** n + np.abs(qy / ry) ** n) ** (1.0 / n)


_GRIDS: dict = {}


def grid(shape: tuple[int, int], scale: float) -> tuple[np.ndarray, np.ndarray]:
    """Pixel-centre coordinates in reference units, cached per (shape, scale)."""
    key = (shape, scale)
    if key not in _GRIDS:
        h, w = shape
        ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
        _GRIDS[key] = ((xs + 0.5) / scale, (ys + 0.5) / scale)
    return _GRIDS[key]


def mask(part: dict, shape: tuple[int, int], scale: float = 1.0) -> np.ndarray:
    xs, ys = grid(shape, scale)
    return radial(part, xs, ys) <= 1.0


def outline(part: dict, n: int = 96) -> np.ndarray:
    """Points on the outline (for drawing and overlays)."""
    t = np.linspace(0, 2 * np.pi, n, endpoint=False)
    ct, st = np.cos(t), np.sin(t)
    top = st < 0
    ry = np.where(top, part['ryTop'], part['ryBot'])
    nn = np.where(top, part['nTop'], part['nBot'])
    px = part['rx'] * np.sign(ct) * np.abs(ct) ** (2 / nn)
    py = ry * np.sign(st) * np.abs(st) ** (2 / nn)
    c, s = np.cos(part['rot']), np.sin(part['rot'])
    return np.stack([part['cx'] + px * c - py * s, part['cy'] + px * s + py * c], 1)
