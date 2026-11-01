"""Render the F1 comparison set with the harness (dev-only).

    python tools/buddy/render_f1.py <iteration> [mode ...]

For each view and shading mode: a render at the reference's scale and its
side-by-side; plus the front render beside the master at the master's head
scale, and 2x crops of the arms, feet and head/body junction (render vs master).
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from features import extract  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
FIT = ROOT / 'design/buddy/_work/fit'
MATTE = ROOT / 'design/buddy/_work/matte'
OUT = ROOT / 'design/buddy/f1'
VIEWS = [('front', 'front'), ('threeQuarter', 'turn_34_left')]
FRONT_EYE_SPACING = 0.463  # eye spacing in head widths (front sheet)
FRONT_EYE_Y = 0.0107  # eye line below the head centre, head widths
# 2x crops. The master's pose differs from the neutral render, so each image gets its own
# boxes on its own parts: the master's in master pixels (its raised arm is on the viewer's
# left, so the viewer's right side is used), the render's from the model's parts.
MASTER_CROPS = {
    'arm (viewer right)': (640, 560, 900, 900),
    'foot (viewer right)': (700, 840, 980, 1060),
    'head / body junction': (300, 560, 760, 760),
}
RENDER_PARTS = {'arm (viewer right)': ('armR', 0.33), 'foot (viewer right)': ('footR', 0.3), 'head / body junction': ('junction', 0.3)}


def harness(args: dict) -> None:
    r = subprocess.run(['node', 'tools/harness/run.cjs', 'buddy', json.dumps(args)], capture_output=True, text=True, cwd=ROOT)
    if r.returncode:
        raise SystemExit(r.stderr[-2000:])


def font(size: int):
    try:
        return ImageFont.truetype('arial.ttf', size)
    except OSError:
        return ImageFont.load_default()


def master_frame():
    m = Image.open(MATTE / 'master.png').convert('RGBA')
    e = extract(np.array(m))['eyes']
    unit = abs(e[1]['cx'] - e[0]['cx']) / FRONT_EYE_SPACING
    cx = (e[0]['cx'] + e[1]['cx']) / 2
    cy = (e[0]['cy'] + e[1]['cy']) / 2 - FRONT_EYE_Y * unit
    return m, unit, cx, cy


def model_parts() -> dict:
    """The front view's parts from the generated model (head-width units, head centre origin)."""
    src = (ROOT / 'src/onboarding/screen1/buddy/buddyModel.ts').read_text(encoding='utf-8')
    model = json.loads(src[src.index('{'):src.index('} as const') + 1])
    return model['views']['front']['parts']


def on(bg, img):
    t = Image.new('RGBA', img.size, bg + (255,))
    t.alpha_composite(img)
    return t.convert('RGB')


def main() -> None:
    it = sys.argv[1]
    modes = sys.argv[2:] or ['baked', 'procedural']
    OUT.mkdir(parents=True, exist_ok=True)
    unit_ref = 2 * json.loads((FIT / 'front_silhouette.json').read_text())['parts']['head']['rx']
    for view, ref in VIEWS:
        s = json.loads((FIT / f'{ref}_silhouette.json').read_text())
        h = s['parts']['head']
        w, hh = s['shape']
        for mode in modes:
            out = FIT / f'render_{ref}_{mode}.png'
            harness({'out': str(out), 'width': w, 'height': hh, 'x': h['cx'], 'y': h['cy'], 'headWidth': unit_ref,
                     'view': view, 'mode': mode})
            subprocess.run(['python', 'tools/buddy/compare.py', ref, str(out), str(OUT / f'cmp_{ref}_it{it}_{mode}.png'),
                            f'F1 iteration {it}: {view}, {mode} shading'], cwd=ROOT, check=True)

    # The front render beside the master at the master's head scale, every mode in one sheet.
    m, unit, cx, cy = master_frame()
    cols = [('master', m)]
    for mode in modes:
        p = FIT / f'render_master_scale_{mode}.png'
        harness({'out': str(p), 'width': m.width, 'height': m.height, 'x': cx, 'y': cy, 'headWidth': unit, 'view': 'front', 'mode': mode})
        cols.append((f'render ({mode})', Image.open(p).convert('RGBA')))
    f = font(26)
    sheet = Image.new('RGB', (len(cols) * (m.width + 10) + 10, 2 * (m.height + 10) + 60), (60, 60, 68))
    d = ImageDraw.Draw(sheet)
    d.text((10, 10), f'F1 iteration {it}: master vs renders (neutral front, no rig), same head scale', font=f, fill=(240, 240, 245))
    for row, bg in enumerate([(0xF6, 0xF3, 0xFF), (0x1A, 0x1A, 0x1E)]):
        for col, (name, img) in enumerate(cols):
            x, y = 10 + col * (m.width + 10), 50 + row * (m.height + 10)
            sheet.paste(on(bg, img), (x, y))
            d.text((x + 10, y + 10), name, font=f, fill=(110, 110, 125) if row == 0 else (200, 200, 210))
    sheet.resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS).save(OUT / f'cmp_master_it{it}.png')

    # Crops: each image on its own parts.
    model = model_parts()
    rows = []
    for name, box in MASTER_CROPS.items():
        tiles = [on((0x1A, 0x1A, 0x1E), m).crop(box)]
        bw, bh = box[2] - box[0], box[3] - box[1]
        part, _ = RENDER_PARTS[name]
        if part == 'junction':
            hp = model['head']
            px, py = cx + hp['cx'] * unit, cy + (hp['cy'] + hp['ryBot']) * unit
        else:
            px, py = cx + model[part]['cx'] * unit, cy + model[part]['cy'] * unit
        rbox = (int(px - bw / 2), int(py - bh / 2), int(px + bw / 2), int(py + bh / 2))
        tiles += [on((0x1A, 0x1A, 0x1E), img).crop(rbox) for _, img in cols[1:]]
        rows.append((name, tiles))
    tw = max(t.width for _, ts in rows for t in ts)
    th = max(t.height for _, ts in rows for t in ts)
    crop_sheet = Image.new('RGB', (len(cols) * (tw + 10) + 10, len(rows) * (th + 40) + 50), (60, 60, 68))
    d = ImageDraw.Draw(crop_sheet)
    d.text((10, 10), f'F1 iteration {it}: 2x crops on #1A1A1E   columns: ' + ', '.join(n for n, _ in cols), font=font(22), fill=(240, 240, 245))
    for r, (name, tiles) in enumerate(rows):
        y = 50 + r * (th + 40)
        d.text((10, y), name, font=font(20), fill=(220, 220, 230))
        for c, t in enumerate(tiles):
            crop_sheet.paste(t, (10 + c * (tw + 10), y + 28))
    crop_sheet.save(OUT / f'crops_it{it}.png')
    print('rendered iteration', it, modes)


if __name__ == '__main__':
    main()
