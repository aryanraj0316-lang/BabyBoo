"""Fit Buddy's part shapes to a reference silhouette.

The front view is fitted with a left/right-symmetric set of parts (head,
ears, body, arms, feet) by maximising the overlap (IoU) between the union of
the parts and the reference outline. Starting values come from reading the
reference on a grid; the optimiser refines them.

    python tools/buddy/fit_model.py front
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.optimize import minimize

sys.path.insert(0, str(Path(__file__).resolve().parent))
from shapes import mask  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
MATTE = ROOT / 'design/buddy/_work/matte'
OUT = ROOT / 'design/buddy/_work/fit'

# Symmetric front parameterisation. Each entry: name, start value (reference px), lower, upper.
FRONT_PARAMS = [
    ('axis', 247, 230, 265),
    # head
    ('head_cy', 190, 160, 220), ('head_rx', 172, 140, 200), ('head_ryTop', 135, 100, 170), ('head_ryBot', 130, 100, 170),
    ('head_nTop', 2.3, 1.8, 4.0), ('head_nBot', 2.6, 1.8, 4.0),
    # ears (mirrored)
    ('ear_dx', 135, 100, 170), ('ear_cy', 82, 55, 110), ('ear_r', 62, 45, 80),
    # body (largely hidden; the arms form its visible sides, so keep it plausible)
    ('body_cy', 400, 380, 420), ('body_rx', 125, 110, 145), ('body_ryTop', 100, 80, 125), ('body_ryBot', 92, 75, 110),
    ('body_n', 2.3, 2.0, 3.0),
    # arms (mirrored; rot is for the left arm, the right is its mirror). The outline alone cannot
    # place the arms (they sit inside it), so these limits come from the visible arm creases.
    ('arm_dx', 98, 85, 115), ('arm_cy', 382, 360, 400), ('arm_rx', 42, 35, 52), ('arm_ry', 72, 60, 88), ('arm_rot', 0.1, -0.3, 0.3),
    # feet
    ('foot_dx', 138, 110, 170), ('foot_cy', 440, 410, 470), ('foot_rx', 62, 45, 85), ('foot_ry', 50, 35, 70), ('foot_rot', -0.15, -0.7, 0.7),
    ('foot_n', 2.2, 1.8, 3.2),
]


def front_parts(v: dict) -> dict[str, dict]:
    ax = v['axis']
    ell = lambda cx, cy, rx, ry, rot=0.0, n=2.0: {'cx': cx, 'cy': cy, 'rx': rx, 'ryTop': ry, 'ryBot': ry, 'nTop': n, 'nBot': n, 'rot': rot}
    return {
        'earL': ell(ax - v['ear_dx'], v['ear_cy'], v['ear_r'], v['ear_r']),
        'earR': ell(ax + v['ear_dx'], v['ear_cy'], v['ear_r'], v['ear_r']),
        'body': {'cx': ax, 'cy': v['body_cy'], 'rx': v['body_rx'], 'ryTop': v['body_ryTop'], 'ryBot': v['body_ryBot'],
                 'nTop': v['body_n'], 'nBot': v['body_n'], 'rot': 0.0},
        'armL': ell(ax - v['arm_dx'], v['arm_cy'], v['arm_rx'], v['arm_ry'], v['arm_rot']),
        'armR': ell(ax + v['arm_dx'], v['arm_cy'], v['arm_rx'], v['arm_ry'], -v['arm_rot']),
        'footL': ell(ax - v['foot_dx'], v['foot_cy'], v['foot_rx'], v['foot_ry'], v['foot_rot'], v['foot_n']),
        'footR': ell(ax + v['foot_dx'], v['foot_cy'], v['foot_rx'], v['foot_ry'], -v['foot_rot'], v['foot_n']),
        'head': {'cx': ax, 'cy': v['head_cy'], 'rx': v['head_rx'], 'ryTop': v['head_ryTop'], 'ryBot': v['head_ryBot'],
                 'nTop': v['head_nTop'], 'nBot': v['head_nBot'], 'rot': 0.0},
    }


def union(parts: dict[str, dict], shape: tuple[int, int], scale: float) -> np.ndarray:
    m = np.zeros(shape, bool)
    for p in parts.values():
        m |= mask(p, shape, scale)
    return m


def iou(a: np.ndarray, b: np.ndarray) -> float:
    return float((a & b).sum() / max(1, (a | b).sum()))


def fit(name: str, params, parts_fn, scale: float = 0.3, iters: int = 6000) -> dict:
    rgba = np.array(Image.open(MATTE / f'{name}.png').convert('RGBA'))
    full = rgba[..., 3] > 128
    h, w = full.shape
    small = np.array(Image.fromarray(full.astype(np.uint8) * 255).resize((int(w * scale), int(h * scale)), Image.BILINEAR)) > 127
    names = [p[0] for p in params]
    x0 = np.array([p[1] for p in params], float)
    lo = np.array([p[2] for p in params], float)
    hi = np.array([p[3] for p in params], float)
    span = hi - lo

    def unpack(z):
        return dict(zip(names, lo + np.clip(z, 0, 1) * span))

    def loss(z):
        return 1.0 - iou(union(parts_fn(unpack(z)), small.shape, scale), small)

    z0 = (x0 - lo) / span
    res = minimize(loss, z0, method='Powell', options={'maxfev': iters, 'xtol': 1e-3, 'ftol': 1e-5})
    v = unpack(res.x)
    parts = parts_fn(v)
    score = iou(union(parts, full.shape, 1.0), full)
    return {'values': v, 'parts': parts, 'iou': score, 'shape': [w, h]}


def main() -> None:
    name = sys.argv[1] if len(sys.argv) > 1 else 'front'
    OUT.mkdir(parents=True, exist_ok=True)
    params, parts_fn = VIEWS[name]
    result = fit(name, params, parts_fn, iters=9000)
    (OUT / f'{name}_silhouette.json').write_text(json.dumps(result, indent=1))
    print(name, 'silhouette IoU', round(result['iou'], 4))



# 3/4 view (head turned toward the phone, viewer's left): no symmetry. Near = Buddy's
# left (viewer's right), far = Buddy's right (viewer's left). Arm limits come from the
# visible creases, as for the front view.
THREE_Q_PARAMS = [
    ('head_cx', 255, 235, 275), ('head_cy', 190, 165, 215), ('head_rx', 165, 135, 195),
    ('head_ryTop', 140, 110, 170), ('head_ryBot', 130, 100, 165), ('head_nTop', 2.3, 1.8, 4.0), ('head_nBot', 2.5, 1.8, 4.0),
    # Ear size is fixed to the front view's (same sheet, same scale): r = 64.69 +-0.5%.
    ('earF_cx', 165, 140, 190), ('earF_cy', 65, 45, 90), ('earF_r', 64.69, 64.36, 65.01),
    ('earN_cx', 395, 370, 420), ('earN_cy', 95, 70, 120), ('earN_r', 64.69, 64.36, 65.01),
    ('body_cx', 262, 240, 285), ('body_cy', 395, 375, 420), ('body_rx', 125, 105, 150),
    ('body_ryTop', 100, 80, 125), ('body_ryBot', 92, 75, 110), ('body_n', 2.3, 2.0, 3.0),
    ('armN_cx', 268, 245, 295), ('armN_cy', 388, 365, 410), ('armN_rx', 40, 32, 50), ('armN_ry', 70, 58, 85), ('armN_rot', -0.15, -0.5, 0.3),
    # The far arm shows as a bulge under the head on the left, outside the body's outline.
    ('armF_cx', 118, 100, 132), ('armF_cy', 368, 345, 395), ('armF_rx', 38, 30, 48), ('armF_ry', 62, 50, 78), ('armF_rot', 0.2, -0.3, 0.6),
    ('footF_cx', 95, 75, 120), ('footF_cy', 432, 410, 455), ('footF_rx', 52, 40, 66), ('footF_ry', 52, 40, 66), ('footF_rot', 0.0, -0.6, 0.6),
    ('footN_cx', 322, 300, 345), ('footN_cy', 446, 425, 470), ('footN_rx', 64, 50, 80), ('footN_ry', 56, 42, 70), ('footN_rot', 0.0, -0.6, 0.6),
    ('foot_n', 2.1, 1.8, 3.0),
]


def three_q_parts(v: dict) -> dict[str, dict]:
    def ell(cx, cy, rx, ry, rot=0.0, n=2.0):
        return {'cx': cx, 'cy': cy, 'rx': rx, 'ryTop': ry, 'ryBot': ry, 'nTop': n, 'nBot': n, 'rot': rot}
    # Draw order is back to front; keys follow the front view's names (L = Buddy's right, far side).
    return {
        'earL': ell(v['earF_cx'], v['earF_cy'], v['earF_r'], v['earF_r']),
        'earR': ell(v['earN_cx'], v['earN_cy'], v['earN_r'], v['earN_r']),
        'body': {'cx': v['body_cx'], 'cy': v['body_cy'], 'rx': v['body_rx'], 'ryTop': v['body_ryTop'], 'ryBot': v['body_ryBot'],
                 'nTop': v['body_n'], 'nBot': v['body_n'], 'rot': 0.0},
        'armL': ell(v['armF_cx'], v['armF_cy'], v['armF_rx'], v['armF_ry'], v['armF_rot']),
        'armR': ell(v['armN_cx'], v['armN_cy'], v['armN_rx'], v['armN_ry'], v['armN_rot']),
        'footL': ell(v['footF_cx'], v['footF_cy'], v['footF_rx'], v['footF_ry'], v['footF_rot'], v['foot_n']),
        'footR': ell(v['footN_cx'], v['footN_cy'], v['footN_rx'], v['footN_ry'], v['footN_rot'], v['foot_n']),
        'head': {'cx': v['head_cx'], 'cy': v['head_cy'], 'rx': v['head_rx'], 'ryTop': v['head_ryTop'], 'ryBot': v['head_ryBot'],
                 'nTop': v['head_nTop'], 'nBot': v['head_nBot'], 'rot': 0.0},
    }


VIEWS = {'front': (FRONT_PARAMS, front_parts), 'turn_34_left': (THREE_Q_PARAMS, three_q_parts)}


if __name__ == '__main__':
    main()
