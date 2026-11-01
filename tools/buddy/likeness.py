"""Likeness metrics (FINAL brief, section 2.4): a render against a reference.

Both images are measured with the same code (regions.py, features.py, the
silhouette fitter), at the same scale, so the numbers are like for like.

    python tools/buddy/likeness.py <reference matte name> <render png> [fuzz band px]

Silhouette IoU ignores a band around the reference outline (the outermost fur
fuzz). Distances are in % of the reference head width.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from skimage.color import deltaE_ciede2000

sys.path.insert(0, str(Path(__file__).resolve().parent))
from colours import sample  # noqa: E402
from features import extract  # noqa: E402
from fit_model import VIEWS, fit  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
MATTE = ROOT / 'design/buddy/_work/matte'
FIT = ROOT / 'design/buddy/_work/fit'


def silhouette_iou(ref: np.ndarray, ren: np.ndarray, band: int) -> float:
    a = ref[..., 3] > 128
    b = ren[..., 3] > 128
    edge = cv2.Canny(a.astype(np.uint8) * 255, 50, 150) > 0
    near = cv2.dilate(edge.astype(np.uint8), np.ones((2 * band + 1, 2 * band + 1), np.uint8)) > 0
    keep = ~near
    return float((a & b & keep).sum() / max(1, ((a | b) & keep).sum()))


def dist(p, q, w) -> float:
    return float(np.hypot(p[0] - q[0], p[1] - q[1]) / w * 100)


def measure(ref_name: str, render_path: str, band: int, head_w: float) -> dict:
    # Limits per view (section 2.4): the 3/4 view has looser silhouette and position limits.
    iou_min, pos_max = (0.95, 2.0) if ref_name == 'front' else (0.92, 3.0)
    ref = np.array(Image.open(MATTE / f'{ref_name}.png').convert('RGBA'))
    ren = np.array(Image.open(render_path).convert('RGBA'))
    fr, fn = extract(ref), extract(ren)
    rows: list[tuple[str, float, float, str]] = []  # name, value, limit, unit

    rows.append(('silhouette IoU (fuzz band excluded)', silhouette_iou(ref, ren, band), iou_min, 'min'))
    rows.append(('silhouette IoU (raw, for reference)', silhouette_iou(ref, ren, 0), iou_min, 'min'))
    for i, side in enumerate(['left', 'right']):
        e1, e2 = fr['eyes'][i], fn['eyes'][i]
        rows.append((f'eye centre {side}', dist((e1['cx'], e1['cy']), (e2['cx'], e2['cy']), head_w), pos_max, '%'))
        rows.append((f'eye radius {side}', abs(e2['r_equiv'] - e1['r_equiv']) / e1['r_equiv'] * 100, 3.0, '%r'))
    m1, m2 = fr.get('mouth'), fn.get('mouth')
    if m1 and m2:
        rows.append(('mouth anchor (top centre)', dist((m1['cx'], m1['top']), (m2['cx'], m2['top']), head_w), pos_max, '%'))
    for i, side in enumerate(['left', 'right']):
        if i < len(fr['blush']) and i < len(fn['blush']):
            b1, b2 = fr['blush'][i], fn['blush'][i]
            rows.append((f'blush centre {side}', dist((b1['cx'], b1['cy']), (b2['cx'], b2['cy']), head_w), pos_max, '%'))
        if i < len(fr['innerEars']) and i < len(fn['innerEars']):
            a1, a2 = fr['innerEars'][i], fn['innerEars'][i]
            rows.append((f'inner ear centre {side}', dist((a1['cx'], a1['cy']), (a2['cx'], a2['cy']), head_w), pos_max, '%'))
    h1 = sorted(fr['pads'][:2], key=lambda p: p['cx'])
    h2 = sorted(fn['pads'][:2], key=lambda p: p['cx'])
    for i, side in enumerate(['left', 'right']):
        if i < len(h1) and i < len(h2):
            rows.append((f'foot pad centre {side}', dist((h1[i]['cx'], h1[i]['cy']), (h2[i]['cx'], h2[i]['cy']), head_w), pos_max, '%'))

    # Ear centres and radius: the same silhouette fit run on both images.
    ref_fit = json.loads((FIT / f'{ref_name}_silhouette.json').read_text())
    tmp = FIT / '_render_for_fit.png'
    Image.fromarray(ren).save(MATTE / '_render_for_fit.png')
    params, parts_fn = VIEWS[ref_name]
    ren_fit = fit('_render_for_fit', params, parts_fn, iters=9000 if ref_name != 'front' else 6000)
    (MATTE / '_render_for_fit.png').unlink(missing_ok=True)
    tmp.unlink(missing_ok=True)
    for side in ['L', 'R']:
        e1, e2 = ref_fit['parts'][f'ear{side}'], ren_fit['parts'][f'ear{side}']
        rows.append((f'ear centre {"left" if side == "L" else "right"}', dist((e1['cx'], e1['cy']), (e2['cx'], e2['cy']), head_w), pos_max, '%'))
        rows.append((f'ear radius {"left" if side == "L" else "right"}', abs(e2['rx'] - e1['rx']) / e1['rx'] * 100, 3.0, '%r'))

    # Colours: median region colours, CIEDE2000, against this sheet and against the master
    # (the master wins on colour).
    c1, c2 = sample(ref), sample(ren)
    cm = json.loads((FIT / 'colours.json').read_text())['master']
    for key, limit in [('furBase', 3.0), ('furShadow', 3.0), ('furHighlight', 3.0), ('innerEar', 4.0), ('blush', 4.0),
                       ('tongue', 4.0), ('pad', 4.0), ('bean', 4.0)]:
        if key in c1 and key in c2:
            rows.append((f'colour {key} dE00 vs sheet', float(deltaE_ciede2000(np.array(c1[key]), np.array(c2[key]))), limit, 'dE'))
        if key in cm and key in c2:
            rows.append((f'colour {key} dE00 vs master', float(deltaE_ciede2000(np.array(cm[key]), np.array(c2[key]))), limit, 'dE'))
    return {'rows': rows}


def table(rows) -> str:
    lines = [f"{'metric':40s}{'value':>9s}{'limit':>9s}  result"]
    for name, v, lim, unit in rows:
        ok = v >= lim if unit == 'min' else v <= lim
        lim_s = f'>= {lim}' if unit == 'min' else f'<= {lim}'
        lines.append(f'{name:40s}{v:9.3f}{lim_s:>9s}  {"pass" if ok else "MISS"}')
    return '\n'.join(lines)


def main() -> None:
    ref_name, render_path = sys.argv[1:3]
    band = int(sys.argv[3]) if len(sys.argv) > 3 else 5
    head_w = 2 * json.loads((FIT / f'{ref_name}_silhouette.json').read_text())['parts']['head']['rx']
    res = measure(ref_name, render_path, band, head_w)
    print(table(res['rows']))
    out = Path(render_path).with_suffix('.metrics.json')
    out.write_text(json.dumps(res, indent=1))


if __name__ == '__main__':
    main()
