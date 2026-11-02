"""F2 measurements for the rig, written to design/buddy/_work/fit/rig_measure.json.

- gaze: eye-centre offsets in the 3x3 gaze grid relative to the centre cell, in eye
  radii (rows: up / level / down; columns: viewer-left / centre / viewer-right). The
  whole face also shifts a little; that shift is measured separately.
- pawPads: the master's raised paw pads (heart + 4 beans) in paw radii from the paw centre.

    python tools/buddy/measure_f2.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from detect import _cuts, colour_mask  # noqa: E402
from features import _components, extract  # noqa: E402
from regions import classify  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
FIT = ROOT / 'design/buddy/_work/fit'
MATTE = ROOT / 'design/buddy/_work/matte'


def gaze() -> dict:
    rgb = np.array(Image.open(ROOT / 'design/buddy/buddy_gaze_grid.png').convert('RGB'))
    m = colour_mask(rgb)
    cells = []
    for y0, y1 in _cuts(m.sum(axis=1), 3):
        band = m[y0:y1]
        for x0, x1 in _cuts(band.sum(axis=0), 3):
            cell = rgb[y0:y1, x0:x1]
            cm = colour_mask(cell) > 0
            rgba = np.dstack([cell, np.where(cm, 255, 0).astype(np.uint8)])
            f = extract(rgba)
            eyes = sorted(f['eyes'], key=lambda e: e['cx'])[:2]
            ys, xs = np.nonzero(cm[: int(cm.shape[0] * 0.75)])  # head + ears (not the body at the bottom)
            head_c = ((xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2)
            ec = (np.mean([e['cx'] for e in eyes]), np.mean([e['cy'] for e in eyes]))
            er = np.mean([e['r_equiv'] for e in eyes])
            mo = f.get('mouth')
            cells.append({'eye': ec, 'head': head_c, 'r': er, 'mouth': (mo['cx'], mo['top']) if mo else ec})
    centre = cells[4]
    out = {'eyeOffset': [], 'faceOffset': []}
    for c in cells:
        # Eye movement within the face: eye offset minus the mouth's (the face shift).
        face = ((c['mouth'][0] - centre['mouth'][0]) / c['r'], (c['mouth'][1] - centre['mouth'][1]) / c['r'])
        eye = ((c['eye'][0] - centre['eye'][0]) / c['r'], (c['eye'][1] - centre['eye'][1]) / c['r'])
        out['eyeOffset'].append([round(eye[0] - face[0], 3), round(eye[1] - face[1], 3)])
        out['faceOffset'].append([round(face[0], 3), round(face[1], 3)])
    return out


def paw_pads() -> dict:
    sil = json.loads((FIT / 'master_silhouette.json').read_text())
    paw = sil['parts']['pawL']
    r = paw['rx']
    rgba = np.array(Image.open(MATTE / 'master.png').convert('RGBA'))
    blobs = _components(classify(rgba)['pad'], 6)
    near = [b for b in blobs if np.hypot(b['c'][0] - paw['cx'], b['c'][1] - paw['cy']) < r * 1.2]
    near.sort(key=lambda b: -b['area'])
    heart, beans = near[0], near[1:5]
    rel = lambda b: [(b['c'][0] - paw['cx']) / r, (b['c'][1] - paw['cy']) / r, float(np.sqrt(b['area'] / np.pi)) / r]
    return {'heart': rel(heart), 'beans': [rel(b) for b in beans]}


def main() -> None:
    res = {'gaze': gaze(), 'pawPads': paw_pads()}
    (FIT / 'rig_measure.json').write_text(json.dumps(res, indent=1))
    g = res['gaze']
    print('eye offsets (eye radii), rows top->bottom:')
    for i in range(3):
        print('  ', g['eyeOffset'][i * 3:i * 3 + 3], '  face', g['faceOffset'][i * 3:i * 3 + 3])
    print('paw pads', res['pawPads'])


if __name__ == '__main__':
    main()
