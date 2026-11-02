"""Build src/onboarding/screen1/buddy/buddyModel.ts from the measurements.

Views: `front` (turnaround top-left, symmetric parts) and `threeQuarter`
(turnaround top-middle, head turned toward the phone: headTurn -0.5). Each
view stores its parts and its face and pad features explicitly (left and
right), in units of the FRONT head width (both views come from one sheet at
one scale, so Buddy keeps his size when he turns), with the origin at that
view's head centre and y down.

The master wins on colours, eye size and highlights. Hand refinements live in
tools/buddy/model_overrides.json and are applied last.

    python tools/buddy/build_model.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from skimage.color import lab2rgb

sys.path.insert(0, str(Path(__file__).resolve().parent))
from features import _components, extract  # noqa: E402
from regions import classify, lab  # noqa: E402
from shapes import mask  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
FIT = ROOT / 'design/buddy/_work/fit'
MATTE = ROOT / 'design/buddy/_work/matte'
OVERRIDES = Path(__file__).resolve().parent / 'model_overrides.json'
OUT = ROOT / 'src/onboarding/screen1/buddy/buddyModel.ts'

# Master eye size relative to the front sheet (eye r / eye spacing: master 0.198, front 0.186).
MASTER_EYE_SCALE = 0.198 / 0.186
VIEWS = {'front': 'front', 'threeQuarter': 'turn_34_left'}


def hex_of(labv) -> str:
    rgb = np.clip(lab2rgb(np.array(labv, float)[None, None, :])[0, 0], 0, 1)
    return '#%02X%02X%02X' % tuple(int(round(c * 255)) for c in rgb)


def r4(v):
    if isinstance(v, dict):
        return {k: r4(x) for k, x in v.items()}
    if isinstance(v, (list, tuple)):
        return [r4(x) for x in v]
    if isinstance(v, (float, np.floating)):
        return round(float(v), 4)
    return v


class ToModel:
    """Reference pixels -> model units (front head width, origin at this view's head centre)."""

    def __init__(self, head: dict, unit_px: float):
        self.head, self.unit = head, unit_px

    def __call__(self, x, y):
        return [(x - self.head['cx']) / self.unit, (y - self.head['cy']) / self.unit]

    def scale(self, v):
        return v / self.unit


# The master's mouth top edge arches gently (top-edge mid point vs the corner line,
# as a fraction of the mouth width); the master wins on the face.
MASTER_TOP_SAG = -0.047


def mouth_shape(rgba: np.ndarray, T: ToModel) -> dict:
    """Mouth outline: left and right corners, the deepest point, the top-edge arch, the tongue."""
    reg = classify(rgba)
    # The mouth is the largest dark-interior blob (stray specks elsewhere can share its colour).
    _, labm, statm, _ = cv2.connectedComponentsWithStats(reg['mouth'].astype(np.uint8))
    m = labm == 1 + int(np.argmax(statm[1:, cv2.CC_STAT_AREA]))
    # The tongue fills the bottom of the mouth: take the pink that touches the dark interior.
    near = cv2.dilate(m.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    _, lab0, _, _ = cv2.connectedComponentsWithStats(reg['pink'].astype(np.uint8))
    ids = np.unique(lab0[near & reg['pink']])
    whole = m | np.isin(lab0, ids[ids > 0])
    joined = cv2.morphologyEx(whole.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    _, lab_, _, _ = cv2.connectedComponentsWithStats(joined)
    i = int(np.bincount(lab_[m]).argmax())
    shape_mask = lab_ == i
    ys, xs = np.nonzero(shape_mask)
    x0, x1 = xs.min(), xs.max()
    left_y = ys[xs <= x0 + 1].min()
    right_y = ys[xs >= x1 - 1].min()
    deepest = int(np.argmax(ys))
    width = x1 - x0 + 1
    out = {
        'left': T(x0, left_y), 'right': T(x1, right_y), 'bottom': T(xs[deepest], ys[deepest]),
        'topSag': T.scale(MASTER_TOP_SAG * width),
    }
    tongue = shape_mask & reg['pink']
    ty, tx = np.nonzero(tongue)
    if ty.size:
        tcx, tcy = T(tx.mean(), ty.mean())
        out['tongue'] = {'cx': tcx, 'cy': tcy, 'rx': T.scale((tx.max() - tx.min() + 1) / 2),
                         'ry': T.scale((ty.max() - ty.min() + 1) / 2)}
    return out


def fur_tone(rgba: np.ndarray) -> list[float]:
    fur = classify(rgba)['fur'] & (rgba[..., 3] >= 250)
    fur = cv2.erode(fur.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
    return [float(v) for v in np.percentile(lab(rgba[..., :3])[..., 0][fur], [5, 50, 95])]


def build_view(ref: str, unit_px: float) -> tuple[dict, list[float]]:
    sil = json.loads((FIT / f'{ref}_silhouette.json').read_text())
    parts_px = sil['parts']
    head = parts_px['head']
    T = ToModel(head, unit_px)
    rgba = np.array(Image.open(MATTE / f'{ref}.png').convert('RGBA'))
    f = extract(rgba)
    reg = classify(rgba)
    shape = rgba.shape[:2]

    parts = {}
    for k, p in parts_px.items():
        cx, cy = T(p['cx'], p['cy'])
        parts[k] = {'cx': cx, 'cy': cy, 'rx': T.scale(p['rx']), 'ryTop': T.scale(p['ryTop']), 'ryBot': T.scale(p['ryBot']),
                    'nTop': p['nTop'], 'nBot': p['nBot'], 'rot': p['rot']}

    # Eyes keep their measured shape per view; their size follows the master.
    eyes = [{'c': T(e['cx'], e['cy']),
             'rx': T.scale(min(e['rx'], e['ry'])) * MASTER_EYE_SCALE,
             'ry': T.scale(max(e['rx'], e['ry'])) * MASTER_EYE_SCALE} for e in f['eyes']]
    blush = [{'c': T(b['cx'], b['cy']), 'r': T.scale(b['r'])} for b in f['blush']]

    # Inner ears: the visible pink is cut off by the head, so measure the full circle around it.
    inner = []
    for side in ('earL', 'earR'):
        pink = reg['pink'] & mask(parts_px[side], shape)
        if pink.sum() < 30:
            continue
        cnts, _ = cv2.findContours(pink.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        (x, y), r = cv2.minEnclosingCircle(max(cnts, key=cv2.contourArea))
        inner.append({'side': side, 'c': T(x, y), 'r': T.scale(r)})

    # Pads: the heart is measured on this view; the toe beans follow the master's arrangement
    # around it (the master wins on pads), mirrored to each foot's outer side.
    foot_beans = json.loads((FIT / 'master_pads.json').read_text())['footBeans']
    pads = []
    blobs = _components(reg['pad'], 6)
    for side in ('footL', 'footR'):
        fm = mask(parts_px[side], shape)
        mine = sorted([b for b in blobs if fm[int(b['c'][1]), int(b['c'][0])]], key=lambda b: -b['area'])
        if not mine:
            continue
        heart = mine[0]
        hr = np.sqrt(heart['area'] / np.pi)
        outer = -1 if side == 'footL' else 1
        hx, hy = heart['c']
        pads.append({'side': side, 'heart': {'c': T(hx, hy), 'r': T.scale(hr)},
                     'beans': [[*T(hx + outer * bx * hr, hy + by * hr), T.scale(br * hr)] for bx, by, br in foot_beans]})

    # Ear fur sits in the head's shade: measure its own colour (ear minus head minus pink).
    ear_fur = np.zeros(shape, bool)
    for side in ('earL', 'earR'):
        ear_fur |= mask(parts_px[side], shape)
    ear_fur &= ~mask(head, shape) & reg['fur'] & (rgba[..., 3] >= 200)
    ear_lab = [float(v) for v in np.median(lab(rgba[..., :3])[ear_fur], axis=0)]

    polys = json.loads((FIT / 'light_poly.json').read_text())[ref]
    view = {
        # This sheet's fur lightness (L* p5, p50, p95): the baked lighting is re-toned to the master's.
        'tone': fur_tone(rgba),
        'parts': parts,
        'lightPoly': {k: (v['coef'] if v else None) for k, v in polys.items()},
        'eyes': eyes,
        'blush': blush,
        'innerEars': inner,
        'mouth': mouth_shape(rgba, T),
        'pads': pads,
        'floorY': max(parts[k]['cy'] + max(parts[k]['ryBot'], parts[k]['rx']) for k in parts if k.startswith(('foot', 'body'))),
    }
    return view, ear_lab


# Terms of the baked lighting cubic that are odd in u (flip sign to mirror left/right).
ODD_U = (1, 4, 6, 8)


def mirror_poly(coef):
    return None if coef is None else [(-c if i in ODD_U else c) for i, c in enumerate(coef)]


class Derot:
    """Master pixels -> model units with the head's tilt undone (for head-attached features)."""

    def __init__(self, head: dict):
        self.hx, self.hy, self.w = head['cx'], head['cy'], 2 * head['rx']
        self.c, self.s = np.cos(-head['rot']), np.sin(-head['rot'])

    def __call__(self, x, y):
        dx, dy = x - self.hx, y - self.hy
        return [(dx * self.c - dy * self.s) / self.w, (dx * self.s + dy * self.c) / self.w]

    def scale(self, v):
        return v / self.w


# The master's resting arm (viewer's right), placed by hand from its visible crease
# (master pixels): the shoulder emerges from under the head, the paw rests on the tummy
# just above the foot. One limb: shoulder circle -> paw circle.
MASTER_ARM = {'shoulder': (748, 735), 'ra': 72, 'paw': (697, 870), 'rb': 74, 'pawR': 86}
OUTLINE_POINTS = 72


def polar_outline(m: np.ndarray, to_model, mirror_x: float) -> list:
    """A star-shaped region's outline, resampled by angle and mirror-averaged (symmetric)."""
    ys, xs = np.nonzero(m)
    cnts, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    pts = np.array([to_model(x, y) for x, y in max(cnts, key=cv2.contourArea)[:, 0, :]])
    cy = pts[:, 1].mean()
    ang = np.arctan2(pts[:, 1] - cy, pts[:, 0] - mirror_x)
    rad = np.hypot(pts[:, 1] - cy, pts[:, 0] - mirror_x)
    order = np.argsort(ang)
    ang, rad = ang[order], rad[order]
    grid = np.linspace(-np.pi, np.pi, OUTLINE_POINTS, endpoint=False)
    r = np.interp(grid, ang, rad, period=2 * np.pi)
    r_mirror = np.interp(np.pi - grid, ang, rad, period=2 * np.pi)
    r = (r + r_mirror) / 2
    # Smooth the outline (a soft, even edge; no pixel lumps).
    k = 1
    r = np.convolve(np.concatenate([r[-k:], r, r[:k]]), np.ones(2 * k + 1) / (2 * k + 1), mode='same')[k:-k]
    return [[float(np.cos(a) * rr), float(cy + np.sin(a) * rr)] for a, rr in zip(grid, r)]


def build_front_from_master() -> dict:
    """The neutral front view, built from the locked master (it wins on proportions).

    The master is waving with its head tilted and turned slightly. Head-attached features
    are un-tilted around the head centre and the face is re-centred on the head; every
    left/right pair is mirror-averaged into a symmetric neutral pose. The resting arm
    (viewer's right) and its paw are mirrored onto both sides; the raised arm is not used.
    Units: the master's head width = 1, origin at the head centre.
    """
    sil = json.loads((FIT / 'master_silhouette.json').read_text())
    P = sil['parts']
    head = P['head']
    D = Derot(head)
    W = D.w
    rgba = np.array(Image.open(MATTE / 'master.png').convert('RGBA'))
    f = extract(rgba)
    reg = classify(rgba)
    shape = rgba.shape[:2]

    # Face: un-tilt, then centre on the head (the master is turned a little to the right).
    eyes = sorted([(D(e['cx'], e['cy']), e) for e in f['eyes']], key=lambda t: t[0][0])
    face_x = (eyes[0][0][0] + eyes[1][0][0]) / 2
    eye_dx = (eyes[1][0][0] - eyes[0][0][0]) / 2
    eye_y = (eyes[0][0][1] + eyes[1][0][1]) / 2
    erx = float(np.mean([min(e['rx'], e['ry']) for _, e in eyes])) / W
    ery = float(np.mean([max(e['rx'], e['ry']) for _, e in eyes])) / W
    eyes_m = [{'c': [-eye_dx, eye_y], 'rx': erx, 'ry': ery}, {'c': [eye_dx, eye_y], 'rx': erx, 'ry': ery}]

    bl = sorted([(D(b['cx'], b['cy']), b['r']) for b in f['blush']], key=lambda t: t[0][0])
    b_dx = (bl[1][0][0] - bl[0][0][0]) / 2
    b_y = (bl[0][0][1] + bl[1][0][1]) / 2
    b_r = float(np.mean([r for _, r in bl])) / W
    blush = [{'c': [-b_dx, b_y], 'r': b_r}, {'c': [b_dx, b_y], 'r': b_r}]

    # Ears and their pink cups (symmetric about the head centre).
    ears = {k: D(P[k]['cx'], P[k]['cy']) for k in ('earL', 'earR')}
    ear_dx = (ears['earR'][0] - ears['earL'][0]) / 2
    ear_y = (ears['earL'][1] + ears['earR'][1]) / 2
    ear_r = (P['earL']['rx'] + P['earR']['rx']) / 2 / W
    cups = []
    for side in ('earL', 'earR'):
        pink = reg['pink'] & mask(P[side], shape)
        cnts, _ = cv2.findContours(pink.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        (x, y), r = cv2.minEnclosingCircle(max(cnts, key=cv2.contourArea))
        c = D(x, y)
        sign = -1 if side == 'earL' else 1
        cups.append(((c[0] - ears[side][0]) * sign, c[1] - ears[side][1], r / W))
    cup_dx, cup_dy, cup_r = [float(np.mean([c[i] for c in cups])) for i in range(3)]
    inner = [{'side': 'earL', 'c': [-ear_dx - cup_dx, ear_y + cup_dy], 'r': cup_r},
             {'side': 'earR', 'c': [ear_dx + cup_dx, ear_y + cup_dy], 'r': cup_r}]

    # Mouth: measured un-tilted, then made symmetric and centred.
    mo = mouth_shape(rgba, D)
    half = (mo['right'][0] - mo['left'][0]) / 2
    corner_y = (mo['left'][1] + mo['right'][1]) / 2
    mouth = {'left': [-half, corner_y], 'right': [half, corner_y], 'bottom': [0.0, mo['bottom'][1]], 'topSag': mo['topSag']}
    # Traced outlines (un-tilted, centred on the mouth, mirror-averaged).
    from colours import tongue_mask
    _, labm, statm, _ = cv2.connectedComponentsWithStats(reg['mouth'].astype(np.uint8))
    mouth_dark = labm == 1 + int(np.argmax(statm[1:, cv2.CC_STAT_AREA]))
    tongue_px = tongue_mask(reg)
    whole = cv2.morphologyEx((mouth_dark | tongue_px).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)) > 0
    mouth_cx = (mo['left'][0] + mo['right'][0]) / 2

    def centred(x, y):
        u, v = D(x, y)
        return [u - mouth_cx, v]
    mouth_outline = polar_outline(whole, centred, 0.0)
    tongue_outline = polar_outline(tongue_px, centred, 0.0)
    if 'tongue' in mo:
        t = mo['tongue']
        mouth['tongue'] = {'cx': 0.0, 'cy': t['cy'], 'rx': t['rx'], 'ry': t['ry']}

    # Body parts are not tilted: plain scale, made symmetric about the feet's axis.
    fL, fR = P['footL'], P['footR']
    axis = (fL['cx'] + fR['cx']) / 2

    def ell(cx, cy, rx, ry, rot, n=2.0):
        return {'cx': cx, 'cy': cy, 'rx': rx, 'ryTop': ry, 'ryBot': ry, 'nTop': n, 'nBot': n, 'rot': rot}

    foot_dx = (fR['cx'] - fL['cx']) / 2 / W
    foot_y = ((fL['cy'] + fR['cy']) / 2 - head['cy']) / W
    foot_rx = (fL['rx'] + fR['rx']) / 2 / W
    foot_ry = (fL['ryTop'] + fR['ryTop']) / 2 / W
    foot_rot = (fL['rot'] - fR['rot']) / 2
    arm, paw = P['armR'], P['pawR']
    arm_dx = (arm['cx'] - axis) / W
    paw_dx = (paw['cx'] - axis) / W
    body = P['body']
    parts = {
        'earL': ell(-ear_dx, ear_y, ear_r, ear_r, 0.0),
        'earR': ell(ear_dx, ear_y, ear_r, ear_r, 0.0),
        'body': {'cx': 0.0, 'cy': (body['cy'] - head['cy']) / W, 'rx': body['rx'] / W, 'ryTop': body['ryTop'] / W,
                 'ryBot': body['ryBot'] / W, 'nTop': body['nTop'], 'nBot': body['nBot'], 'rot': 0.0},
        'armL': ell(-arm_dx, (arm['cy'] - head['cy']) / W, arm['rx'] / W, arm['ryTop'] / W, -arm['rot']),
        'armR': ell(arm_dx, (arm['cy'] - head['cy']) / W, arm['rx'] / W, arm['ryTop'] / W, arm['rot']),
        'footL': ell(-foot_dx, foot_y, foot_rx, foot_ry, foot_rot, fL['nTop']),
        'footR': ell(foot_dx, foot_y, foot_rx, foot_ry, -foot_rot, fL['nTop']),
        'pawL': ell(-paw_dx, (paw['cy'] - head['cy']) / W, paw['rx'] / W, paw['rx'] / W, 0.0),
        'pawR': ell(paw_dx, (paw['cy'] - head['cy']) / W, paw['rx'] / W, paw['rx'] / W, 0.0),
        'head': {'cx': 0.0, 'cy': 0.0, 'rx': 0.5, 'ryTop': head['ryTop'] / W, 'ryBot': head['ryBot'] / W,
                 'nTop': head['nTop'], 'nBot': head['nBot'], 'rot': 0.0},
    }

    # Arms: one hand-placed limb each (mirrored); the arm 'parts' become the limb's bounding
    # ellipse, used for contact shading and draw order. No separate paws in this view.
    (sx, sy), (px_, py_) = MASTER_ARM['shoulder'], MASTER_ARM['paw']
    a = [(sx - axis) / W, (sy - head['cy']) / W]
    b = [(px_ - axis) / W, (py_ - head['cy']) / W]
    ra, rb = MASTER_ARM['ra'] / W, MASTER_ARM['rb'] / W
    limbs = {'armR': {'ax': a[0], 'ay': a[1], 'bx': b[0], 'by': b[1], 'ra': ra, 'rb': rb},
             'armL': {'ax': -a[0], 'ay': a[1], 'bx': -b[0], 'by': b[1], 'ra': ra, 'rb': rb}}
    # The rig's arm at rest (viewer-right side; the left mirrors it): shoulder, paw, radii.
    arm_rest = {'shoulder': a, 'paw': b, 'ra': ra, 'rb': rb, 'pawR': MASTER_ARM['pawR'] / W}
    for side, lm in limbs.items():
        cx_, cy_ = (lm['ax'] + lm['bx']) / 2, (lm['ay'] + lm['by']) / 2
        half_len = np.hypot(lm['bx'] - lm['ax'], lm['by'] - lm['ay']) / 2
        parts[side] = ell(cx_, cy_, max(ra, rb), half_len + max(ra, rb), 0.0)
    del parts['pawL'], parts['pawR']

    # Pads on each foot, relative to the foot, mirror-averaged.
    blobs = _components(reg['pad'], 6)
    per_foot = []
    for side in ('footL', 'footR'):
        fm = mask(P[side], shape)
        mine = sorted([b for b in blobs if fm[int(b['c'][1]), int(b['c'][0])]], key=lambda b: -b['area'])
        heart = mine[0]
        sign = -1 if side == 'footL' else 1
        hr = np.sqrt(heart['area'] / np.pi)
        beans = sorted(mine[1:4], key=lambda b: np.arctan2(b['c'][1] - heart['c'][1], (b['c'][0] - heart['c'][0]) * sign))
        per_foot.append({'heart': [(heart['c'][0] - P[side]['cx']) * sign / W, (heart['c'][1] - P[side]['cy']) / W, hr / W],
                         'beans': [[(b['c'][0] - P[side]['cx']) * sign / W, (b['c'][1] - P[side]['cy']) / W,
                                    np.sqrt(b['area'] / np.pi) / W] for b in beans]})
    hx_, hy_, hr_ = [float(np.mean([p['heart'][i] for p in per_foot])) for i in range(3)]
    beans_avg = np.mean([p['beans'] for p in per_foot], axis=0)
    pads = []
    for side, sign in (('footL', -1), ('footR', 1)):
        fp = parts[side]
        pads.append({'side': side, 'heart': {'c': [fp['cx'] + sign * hx_, fp['cy'] + hy_], 'r': hr_},
                     'beans': [[fp['cx'] + sign * bx, fp['cy'] + by, br] for bx, by, br in beans_avg]})

    polys = json.loads((FIT / 'light_poly.json').read_text())['master']
    coef = {k: (v['coef'] if v else None) for k, v in polys.items()}
    light = {'earL': coef['earL'], 'earR': coef['earR'], 'body': coef['body'], 'head': coef['head'],
             'footL': coef['footL'], 'footR': coef['footR'],
             'armR': coef['armR'], 'armL': mirror_poly(coef['armR']),
             'pawR': coef['pawR'], 'pawL': mirror_poly(coef['pawR'])}
    return {
        'tone': fur_tone(rgba),
        'parts': parts,
        'lightPoly': light,
        'eyes': eyes_m,
        'blush': blush,
        'innerEars': inner,
        'mouth': mouth,
        'mouthOutline': mouth_outline,
        'tongueOutline': tongue_outline,
        'limbs': limbs,
        'armRest': arm_rest,
        'pads': pads,
        'floorY': max(parts[k]['cy'] + parts[k]['ryBot'] for k in ('footL', 'footR')),
        'faceOffset': face_x,
    }


def turn_delta(unit_px: float) -> dict:
    """How each face feature moves from the front sheet to the 3/4 sheet (headTurn -0.5).

    Both come from the same turnaround sheet at one scale, in head widths around each
    view's head centre, so the delta can be applied to the master-based front face.
    """
    f, _ = build_view('front', unit_px)
    q, _ = build_view('turn_34_left', unit_px)
    d = lambda a, b: [b[0] - a[0], b[1] - a[1]]
    ears = {k: d([f['parts'][k]['cx'], f['parts'][k]['cy']], [q['parts'][k]['cx'], q['parts'][k]['cy']]) for k in ('earL', 'earR')}
    inner = {}
    for side in ('earL', 'earR'):
        a = next(i for i in f['innerEars'] if i['side'] == side)
        b = next(i for i in q['innerEars'] if i['side'] == side)
        inner[side] = {'d': d(a['c'], b['c']), 'r': b['r'] / a['r']}
    mid = lambda m: [(m['left'][0] + m['right'][0]) / 2, (m['left'][1] + m['right'][1]) / 2]
    mw = lambda m: m['right'][0] - m['left'][0]
    return {
        'eyes': [{'d': d(a['c'], b['c']), 'rx': b['rx'] / a['rx'], 'ry': b['ry'] / a['ry']} for a, b in zip(f['eyes'], q['eyes'])],
        'blush': [{'d': d(a['c'], b['c']), 'r': b['r'] / a['r']} for a, b in zip(f['blush'], q['blush'])],
        'ears': ears,
        'innerEars': inner,
        'mouth': {'d': d(mid(f['mouth']), mid(q['mouth'])), 'width': mw(q['mouth']) / mw(f['mouth'])},
    }


def build() -> dict:
    colours = json.loads((FIT / 'colours.json').read_text())
    unit_px = 2 * json.loads((FIT / 'front_silhouette.json').read_text())['parts']['head']['rx']

    # The front view is built from the master; the 3/4 view from the turnaround sheet.
    views = {'front': build_front_from_master()}
    views['threeQuarter'], ear_fur = build_view('turn_34_left', unit_px)

    # Highlights come from the master and are fixed to the light (same offset in both eyes).
    mf = extract(np.array(Image.open(MATTE / 'master.png').convert('RGBA')))
    mh = [(e['highlights'][0], e) for e in mf['eyes'] if e['highlights']]
    highlight = {
        'dx': float(np.mean([(h['cx'] - e['cx']) / e['r_equiv'] for h, e in mh])),
        'dy': float(np.mean([(h['cy'] - e['cy']) / e['r_equiv'] for h, e in mh])),
        'r': float(np.mean([h['r'] / e['r_equiv'] for h, e in mh])),
    }

    master_rgba = np.array(Image.open(MATTE / 'master.png').convert('RGBA'))
    master_tone = fur_tone(master_rgba)
    lab_colours = dict(colours['master'])
    from colours import tongue_mask
    tm = tongue_mask(classify(master_rgba))
    # The lit part of the tongue: its brightest quarter (the top rows blend into the dark mouth).
    tl = lab(master_rgba[..., :3])[tm]
    lab_colours['tongueTop'] = [float(v) for v in np.median(tl[tl[:, 0] >= np.percentile(tl[:, 0], 75)], axis=0)]
    lab_colours['earFur'] = ear_fur
    rig = json.loads((FIT / 'rig_measure.json').read_text())
    model = {
        'units': 'head width = 1; origin at each view head centre; y down',
        'turnDelta': turn_delta(unit_px),
        'pawPads': rig['pawPads'],
        # Gaze slides the face on the head (measured on the gaze grid), in eye radii at full gaze.
        'gaze': {'faceX': 0.5, 'faceY': 0.45, 'eyeExtra': 0.15},
        'colours': {k: hex_of(v) for k, v in lab_colours.items()},
        'coloursLab': lab_colours,
        'highlight': highlight,
        'masterTone': master_tone,
        'views': views,
    }
    if OVERRIDES.exists():
        deep_merge(model, json.loads(OVERRIDES.read_text()))
    return model


def deep_merge(a: dict, b: dict) -> None:
    for k, v in b.items():
        if k.startswith('_'):
            continue
        if isinstance(v, dict) and isinstance(a.get(k), dict):
            deep_merge(a[k], v)
        else:
            a[k] = v


def main() -> None:
    model = r4(build())
    OUT.parent.mkdir(parents=True, exist_ok=True)
    body = json.dumps(model, indent=2, ensure_ascii=False)
    OUT.write_text(
        '// AUTO-GENERATED by tools/buddy/build_model.py from measurements of design/buddy/.\n'
        '// Do not edit by hand: put refinements in tools/buddy/model_overrides.json.\n'
        '/* eslint-disable */\n\n'
        f'export const BUDDY_MODEL = {body} as const;\n\n'
        'export type BuddyModel = typeof BUDDY_MODEL;\n'
        'export type BuddyView = keyof typeof BUDDY_MODEL.views;\n'
    )
    print('wrote', OUT.relative_to(ROOT))
    for k, v in model['views'].items():
        print(k, 'eyes', len(v['eyes']), 'blush', len(v['blush']), 'innerEars', len(v['innerEars']),
              'pads', [len(p['beans']) for p in v['pads']])


if __name__ == '__main__':
    main()
