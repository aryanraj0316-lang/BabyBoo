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


def build() -> dict:
    colours = json.loads((FIT / 'colours.json').read_text())
    unit_px = 2 * json.loads((FIT / 'front_silhouette.json').read_text())['parts']['head']['rx']

    views, ear_fur = {}, None
    for key, ref in VIEWS.items():
        views[key], ear = build_view(ref, unit_px)
        if key == 'front':
            ear_fur = ear

    # Highlights come from the master and are fixed to the light (same offset in both eyes).
    mf = extract(np.array(Image.open(MATTE / 'master.png').convert('RGBA')))
    mh = [(e['highlights'][0], e) for e in mf['eyes'] if e['highlights']]
    highlight = {
        'dx': float(np.mean([(h['cx'] - e['cx']) / e['r_equiv'] for h, e in mh])),
        'dy': float(np.mean([(h['cy'] - e['cy']) / e['r_equiv'] for h, e in mh])),
        'r': float(np.mean([h['r'] / e['r_equiv'] for h, e in mh])),
    }

    master_tone = fur_tone(np.array(Image.open(MATTE / 'master.png').convert('RGBA')))
    lab_colours = dict(colours['master'])
    lab_colours['earFur'] = ear_fur
    model = {
        'units': 'front head width = 1; origin at each view head centre; y down',
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
