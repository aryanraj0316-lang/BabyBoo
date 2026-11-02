"""Bake each part's lighting from a reference, in the part's own local frame.

For every fur part, the reference lightness (CIELAB L*) is fitted with a cubic
polynomial in the part's normalised local coordinates (u = qx/rx, v = qy/ry,
after undoing the part's rotation). The fit only uses the part's own clean fur:
pixels hidden by parts drawn above it, face features, pads, pinks and a band
near every part boundary are left out, so contact shadows between parts are
NOT baked in (they stay dynamic in the shader). The polynomial travels with
the part, so a rigged part keeps its lighting as it moves.

    python tools/buddy/bake_light.py            # front and 3/4
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from regions import classify, lab  # noqa: E402
from shapes import mask  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
FIT = ROOT / 'design/buddy/_work/fit'
MATTE = ROOT / 'design/buddy/_work/matte'
DRAW_ORDER = ['earL', 'earR', 'body', 'armL', 'armR', 'footL', 'footR', 'head']
# The master: the resting paw sits in front of its foot; the raised arm and paw are in front of the head.
DRAW_ORDERS = {'master': ['earL', 'earR', 'body', 'armR', 'footL', 'footR', 'pawR', 'head', 'armL', 'pawL']}
BAND = 6  # px kept clear of every part boundary (where contact shading lives)
RIDGE = 1e-3


def terms(u: np.ndarray, v: np.ndarray) -> np.ndarray:
    """Cubic basis: 1, u, v, u2, uv, v2, u3, u2v, uv2, v3."""
    return np.stack([np.ones_like(u), u, v, u * u, u * v, v * v, u ** 3, u * u * v, u * v * v, v ** 3], -1)


def local(part: dict, xs: np.ndarray, ys: np.ndarray):
    c, s = np.cos(part['rot']), np.sin(part['rot'])
    dx, dy = xs - part['cx'], ys - part['cy']
    qx = dx * c + dy * s
    qy = -dx * s + dy * c
    ry = np.where(qy < 0, part['ryTop'], part['ryBot'])
    return qx / part['rx'], qy / ry


def bake(ref: str) -> dict:
    sil = json.loads((FIT / f'{ref}_silhouette.json').read_text())
    parts = sil['parts']
    rgba = np.array(Image.open(MATTE / f'{ref}.png').convert('RGBA'))
    h, w = rgba.shape[:2]
    reg = classify(rgba)
    L = lab(rgba[..., :3])[..., 0]
    clean = reg['fur'] & (rgba[..., 3] >= 250)
    # Keep away from face features, pads and pinks (they are drawn separately).
    other = ~reg['fur'] & (rgba[..., 3] >= 128)
    clean &= cv2.dilate(other.astype(np.uint8), np.ones((9, 9), np.uint8)) == 0
    masks = {k: mask(p, (h, w)) for k, p in parts.items()}
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    out = {}
    order = DRAW_ORDERS.get(ref, DRAW_ORDER)
    for i, name in enumerate(order):
        own = masks[name].copy()
        for above in order[i + 1:]:
            own &= ~masks[above]
        # Stay clear of every boundary (the part's own and the parts in front of it).
        own = cv2.erode(own.astype(np.uint8), np.ones((2 * BAND + 1, 2 * BAND + 1), np.uint8)) > 0
        sel = own & clean
        if sel.sum() < 80:
            out[name] = None
            continue
        u, v = local(parts[name], xs[sel], ys[sel])
        A = terms(u, v)
        coef = np.linalg.solve(A.T @ A + RIDGE * np.eye(A.shape[1]) * len(u), A.T @ L[sel])
        resid = float(np.sqrt(np.mean((A @ coef - L[sel]) ** 2)))
        out[name] = {'coef': [float(c) for c in coef], 'rmsL': resid, 'pixels': int(sel.sum())}
    return out


def main() -> None:
    res = {ref: bake(ref) for ref in ['front', 'turn_34_left', 'master']}
    (FIT / 'light_poly.json').write_text(json.dumps(res, indent=1))
    for ref, parts in res.items():
        print(ref, {k: (round(v['rmsL'], 2), v['pixels']) if v else None for k, v in parts.items()})


if __name__ == '__main__':
    main()
