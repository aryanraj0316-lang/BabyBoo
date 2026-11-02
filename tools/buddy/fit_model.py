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


def fit(name: str, params, parts_fn, scale: float = 0.3, iters: int = 6000, ignore=None) -> dict:
    rgba = np.array(Image.open(MATTE / f'{name}.png').convert('RGBA'))
    full = rgba[..., 3] > 128
    h, w = full.shape
    small = np.array(Image.fromarray(full.astype(np.uint8) * 255).resize((int(w * scale), int(h * scale)), Image.BILINEAR)) > 127
    keep = np.ones_like(small)
    if ignore is not None:
        keep = ~(np.array(Image.fromarray(ignore.astype(np.uint8) * 255).resize(small.shape[::-1], Image.BILINEAR)) > 127)
    names = [p[0] for p in params]
    x0 = np.array([p[1] for p in params], float)
    lo = np.array([p[2] for p in params], float)
    hi = np.array([p[3] for p in params], float)
    span = np.maximum(hi - lo, 1e-9)  # lo == hi fixes a parameter

    def unpack(z):
        return dict(zip(names, lo + np.clip(z, 0, 1) * span))

    def loss(z):
        u = union(parts_fn(unpack(z)), small.shape, scale)
        return 1.0 - iou(u & keep, small & keep)

    z0 = (x0 - lo) / span
    res = minimize(loss, z0, method='Powell', options={'maxfev': iters, 'xtol': 1e-3, 'ftol': 1e-5})
    v = unpack(res.x)
    parts = parts_fn(v)
    full_keep = ~ignore if ignore is not None else np.ones_like(full)
    score = iou(union(parts, full.shape, 1.0) & full_keep, full & full_keep)
    return {'values': v, 'parts': parts, 'iou': score, 'shape': [w, h]}


def main() -> None:
    name = sys.argv[1] if len(sys.argv) > 1 else 'front'
    if name == 'master_head':
        refit_master_head()
        return
    OUT.mkdir(parents=True, exist_ok=True)
    params, parts_fn = VIEWS[name]
    result = fit(name, params, parts_fn, scale=0.15 if name == 'master' else 0.3, iters=9000)
    (OUT / f'{name}_silhouette.json').write_text(json.dumps(result, indent=1))
    print(name, 'silhouette IoU', round(result['iou'], 4))



# 3/4 view (head turned toward the phone, viewer's left): no symmetry. Near = Buddy's
# left (viewer's right), far = Buddy's right (viewer's left). Arm limits come from the
# visible creases, as for the front view.
THREE_Q_PARAMS = [
    # The head keeps the master's shape when it turns (a round head stays round); only its
    # position is fitted. Sizes in this sheet's pixels (front head width = 344.17 px).
    ('head_cx', 255, 235, 275), ('head_cy', 190, 165, 215), ('head_rx', 172.085, 172.085, 172.085),
    ('head_ryTop', 159.798, 159.798, 159.798), ('head_ryBot', 138.012, 138.012, 138.012), ('head_nTop', 1.800, 1.800, 1.800), ('head_nBot', 2.300, 2.300, 2.300),
    # Ear size is fixed to the master's (relative to head width).
    ('earF_cx', 165, 140, 190), ('earF_cy', 65, 45, 90), ('earF_r', 62.914, 62.914, 62.914),
    ('earN_cx', 395, 370, 420), ('earN_cy', 95, 70, 120), ('earN_r', 62.914, 62.914, 62.914),
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



# The locked master (waving). Its head is tilted ~9 degrees and its left arm (viewer's
# left) is raised; the resting arm (viewer's right) ends in a round paw on the tummy,
# above the foot. Arms and paws are separate parts so the rig can wave the paw later.
# The resting arm sits inside the outline, so its limits come from its visible creases.
MASTER_PARAMS = [
    ('head_cx', 555, 520, 590), ('head_cy', 410, 370, 450), ('head_rx', 350, 300, 400),
    # The chin sits at about y 690 and curves smoothly into the body (no flat 'bun' bottom).
    ('head_ryTop', 285, 240, 330), ('head_ryBot', 262, 240, 285), ('head_nTop', 2.0, 1.8, 2.6), ('head_nBot', 2.05, 1.8, 2.3),
    ('head_rot', 0.15, -0.05, 0.3),
    ('earL_cx', 305, 260, 350), ('earL_cy', 175, 130, 220), ('earL_r', 120, 95, 145),
    ('earR_cx', 838, 790, 880), ('earR_cy', 200, 155, 245), ('earR_r', 115, 90, 140),
    ('body_cx', 555, 520, 590), ('body_cy', 840, 800, 880), ('body_rx', 260, 220, 300),
    ('body_ryTop', 220, 160, 300), ('body_ryBot', 200, 170, 240), ('body_n', 2.2, 2.0, 3.0),
    ('armUp_cx', 220, 170, 270), ('armUp_cy', 610, 560, 660), ('armUp_rx', 80, 60, 105), ('armUp_ry', 150, 110, 190), ('armUp_rot', 0.6, 0.2, 1.0),
    ('pawUp_cx', 125, 90, 170), ('pawUp_cy', 465, 420, 510), ('pawUp_r', 95, 75, 120),
    ('armRest_cx', 712, 690, 735), ('armRest_cy', 790, 765, 815), ('armRest_rx', 72, 60, 85), ('armRest_ry', 110, 90, 130), ('armRest_rot', -0.12, -0.35, 0.1),
    ('pawRest_cx', 692, 670, 715), ('pawRest_cy', 875, 855, 895), ('pawRest_r', 62, 50, 75),
    ('footL_cx', 345, 310, 380), ('footL_cy', 905, 875, 935), ('footL_rx', 140, 115, 165), ('footL_ry', 125, 100, 150), ('footL_rot', 0.0, -0.5, 0.5),
    ('footR_cx', 830, 795, 865), ('footR_cy', 935, 905, 965), ('footR_rx', 120, 100, 145), ('footR_ry', 115, 95, 140), ('footR_rot', 0.0, -0.5, 0.5),
    ('foot_n', 2.1, 1.8, 3.0),
]


def master_parts(v: dict) -> dict[str, dict]:
    def ell(cx, cy, rx, ry, rot=0.0, n=2.0):
        return {'cx': cx, 'cy': cy, 'rx': rx, 'ryTop': ry, 'ryBot': ry, 'nTop': n, 'nBot': n, 'rot': rot}
    return {
        'earL': ell(v['earL_cx'], v['earL_cy'], v['earL_r'], v['earL_r']),
        'earR': ell(v['earR_cx'], v['earR_cy'], v['earR_r'], v['earR_r']),
        'body': {'cx': v['body_cx'], 'cy': v['body_cy'], 'rx': v['body_rx'], 'ryTop': v['body_ryTop'], 'ryBot': v['body_ryBot'],
                 'nTop': v['body_n'], 'nBot': v['body_n'], 'rot': 0.0},
        'armL': ell(v['armUp_cx'], v['armUp_cy'], v['armUp_rx'], v['armUp_ry'], v['armUp_rot']),
        'pawL': ell(v['pawUp_cx'], v['pawUp_cy'], v['pawUp_r'], v['pawUp_r']),
        'armR': ell(v['armRest_cx'], v['armRest_cy'], v['armRest_rx'], v['armRest_ry'], v['armRest_rot']),
        'pawR': ell(v['pawRest_cx'], v['pawRest_cy'], v['pawRest_r'], v['pawRest_r']),
        'footL': ell(v['footL_cx'], v['footL_cy'], v['footL_rx'], v['footL_ry'], v['footL_rot'], v['foot_n']),
        'footR': ell(v['footR_cx'], v['footR_cy'], v['footR_rx'], v['footR_ry'], v['footR_rot'], v['foot_n']),
        'head': {'cx': v['head_cx'], 'cy': v['head_cy'], 'rx': v['head_rx'], 'ryTop': v['head_ryTop'], 'ryBot': v['head_ryBot'],
                 'nTop': v['head_nTop'], 'nBot': v['head_nBot'], 'rot': v['head_rot']},
    }


VIEWS['master'] = (MASTER_PARAMS, master_parts)



def refit_master_head() -> None:
    """Refit only the master's head, with the raised arm and paw masked out (they overlap the
    head and stretched its crown) and a tighter crown limit. Every other part stays as fitted."""
    from shapes import mask as part_mask
    path = OUT / 'master_silhouette.json'
    prev = json.loads(path.read_text())
    rgba = np.array(Image.open(MATTE / 'master.png').convert('RGBA'))
    ignore = np.zeros(rgba.shape[:2], bool)
    for k in ('armL', 'pawL'):
        p = dict(prev['parts'][k])
        for key in ('rx', 'ryTop', 'ryBot'):
            p[key] *= 1.12
        ignore |= part_mask(p, rgba.shape[:2])
    v = prev['values']
    params = []
    for name, start, lo, hi in MASTER_PARAMS:
        if name.startswith('head_'):
            params.append((name, start, lo, hi))
        else:
            params.append((name, v[name], v[name], v[name]))
    params = [(n, *{'head_ryTop': (275, 245, 300), 'head_nTop': (2.1, 1.95, 2.5), 'head_ryBot': (262, 240, 280),
                                    'head_cx': (555, 545, 565), 'head_cy': (440, 420, 460), 'head_rx': (352, 340, 365), 'head_rot': (0.085, 0.05, 0.13)}.get(n, (st, lo, hi)))
              for n, st, lo, hi in params]
    result = fit('master', params, master_parts, scale=0.15, iters=4000, ignore=ignore)
    path.write_text(json.dumps(result, indent=1))
    print('master head refit IoU (raised paw masked)', round(result['iou'], 4),
          {k: round(x, 2) for k, x in result['values'].items() if k.startswith('head_')})


if __name__ == '__main__':
    main()
