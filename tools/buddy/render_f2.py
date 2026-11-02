"""F2 verification renders (dev-only), all through the headless harness.

    python tools/buddy/render_f2.py

Writes to design/buddy/f2/:
  presets.png         every preset beside its reference, with face metrics
  presets_metrics.txt the numbers
  master_overlay.png  Buddy posed waving like the master, 50% over it (page bg and #1A1A1E)
  arm_crop.png        the resting arm next to the master's
  mouth_crop.png      the mouth (soft inner edge, smooth tongue) next to the master's
  turn_strip.png      headTurn -1 .. +1 (face kept central, no sliver eye)
  motion_*.png        frame-exact strips from the Lab script (blink, wave, hop)
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
OUT = ROOT / 'design/buddy/f2'
TMP = ROOT / 'design/buddy/_work/f2'

REFS = {
    'watching': ('turn_34_left', False), 'delighted': ('expr_happy', False), 'giggle': ('expr_laugh_closed', False),
    'worried': ('act_worried_paws', False), 'scared': ('expr_worried', False), 'startled': ('expr_surprised', False),
    'yawn': ('act_yawn', False), 'sleepy': ('act_sleepy', False), 'asleep': ('eyes_closed_smile', False),
    'pointing': ('act_point_right', True), 'celebrate': ('joy_arms_up', False), 'wave': ('joy_wave', False),
    'happy': ('cel_settle', False),
}
BG = (0xF6, 0xF3, 0xFF)
DARK = (0x1A, 0x1A, 0x1E)


def harness(args: dict) -> None:
    r = subprocess.run(['node', 'tools/harness/run.cjs', 'rig', json.dumps(args)], capture_output=True, text=True, cwd=ROOT)
    if r.returncode:
        raise SystemExit(r.stderr[-2000:])


def font(size):
    try:
        return ImageFont.truetype('arial.ttf', size)
    except OSError:
        return ImageFont.load_default()


def on(bg, img):
    t = Image.new('RGBA', img.size, bg + (255,))
    t.alpha_composite(img)
    return t.convert('RGB')


def bbox(img: Image.Image):
    a = np.array(img)[..., 3] > 128
    ys, xs = np.nonzero(a)
    return xs.min(), ys.min(), xs.max(), ys.max()


def fit_to(img: Image.Image, h: int) -> Image.Image:
    x0, y0, x1, y1 = bbox(img)
    c = img.crop((x0, y0, x1 + 1, y1 + 1))
    k = h / c.height
    return c.resize((max(1, int(c.width * k)), h), Image.LANCZOS)


def face_points(img: Image.Image) -> dict:
    """Eye centres and mouth anchor, as fractions of the figure's height from its top-left."""
    f = extract(np.array(img))
    h = img.height
    out = {}
    eyes = sorted(f.get('eyes', []), key=lambda e: e['cx'])
    if len(eyes) == 2:
        out['eyeL'] = (eyes[0]['cx'] / h, eyes[0]['cy'] / h)
        out['eyeR'] = (eyes[1]['cx'] / h, eyes[1]['cy'] / h)
    m = f.get('mouth')
    if m and m['area'] > 20:
        out['mouth'] = (m['cx'] / h, m['top'] / h)
    return out


def presets() -> None:
    H = 420
    jobs = [{'out': str(TMP / f'preset_{n}.png'), 'preset': n} for n in REFS]
    harness({'width': 700, 'height': 760, 'x': 350, 'y': 300, 'headWidth': 380, 'jobs': jobs})
    tiles, lines = [], [f"{'preset':11s} {'reference':20s} {'eye L':>7s} {'eye R':>7s} {'mouth':>7s}   (distance, % of figure height; limit 3%)"]
    for n, (ref, mirror) in REFS.items():
        r = Image.open(MATTE / f'{ref}.png').convert('RGBA')
        if mirror:
            r = r.transpose(Image.FLIP_LEFT_RIGHT)
        rr = fit_to(r, H)
        bb = fit_to(Image.open(TMP / f'preset_{n}.png').convert('RGBA'), H)
        fr, fb = face_points(rr), face_points(bb)
        vals = []
        for k in ('eyeL', 'eyeR', 'mouth'):
            if k in fr and k in fb:
                vals.append(f"{np.hypot(fr[k][0] - fb[k][0], fr[k][1] - fb[k][1]) * 100:6.1f}%")
            else:
                vals.append('    n/a')
        lines.append(f'{n:11s} {ref + (" (mirrored)" if mirror else ""):20s} ' + ' '.join(f'{v:>7s}' for v in vals))
        tiles.append((n, ref, on(BG, rr), on(BG, bb), vals))
    (OUT / 'presets_metrics.txt').write_text('\n'.join(lines) + '\n')
    tw = max(t[2].width + t[3].width for t in tiles) + 30
    cols = 3
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * tw + 20, rows * (H + 70) + 50), (60, 60, 68))
    d = ImageDraw.Draw(sheet)
    d.text((12, 12), 'F2 presets: reference (left) and rigged Buddy (right), same figure height', font=font(22), fill=(240, 240, 245))
    for i, (n, ref, a, b, vals) in enumerate(tiles):
        x, y = 12 + (i % cols) * tw, 50 + (i // cols) * (H + 70)
        sheet.paste(a, (x, y + 26))
        sheet.paste(b, (x + a.width + 8, y + 26))
        d.text((x, y + 2), f'{n}   vs {ref}   eyes {vals[0].strip()} / {vals[1].strip()}  mouth {vals[2].strip()}', font=font(17), fill=(230, 230, 240))
    sheet.save(OUT / 'presets.png')
    print('\n'.join(lines))


def master_overlay() -> None:
    h = json.loads((FIT / 'master_silhouette.json').read_text())['parts']['head']
    m = Image.open(MATTE / 'master.png').convert('RGBA')
    out = TMP / 'master_pose.png'
    params = {'headTilt': h['rot'], 'headTurn': 0.12}
    harness({'width': m.width, 'height': m.height, 'x': h['cx'], 'y': h['cy'], 'headWidth': 2 * h['rx'],
             'jobs': [{'out': str(out), 'preset': 'wave', 'params': params}]})
    r = Image.open(out).convert('RGBA')
    half = r.copy()
    half.putalpha(Image.eval(r.getchannel('A'), lambda a: a // 2))
    tiles = []
    for bg in (BG, DARK):
        t = Image.new('RGBA', m.size, bg + (255,))
        t.alpha_composite(m)
        t.alpha_composite(half)
        tiles.append(t.convert('RGB'))
    side = [on(BG, m), on(BG, r)]
    sheet = Image.new('RGB', (m.width * 4 + 50, m.height + 60), (60, 60, 68))
    d = ImageDraw.Draw(sheet)
    d.text((12, 12), 'Master pose: master | rigged Buddy (wave preset, master head tilt) | 50% overlay on page | 50% overlay on #1A1A1E',
           font=font(26), fill=(240, 240, 245))
    for i, t in enumerate(side + tiles):
        sheet.paste(t, (10 + i * (m.width + 10), 50))
    sheet.resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS).save(OUT / 'master_overlay.png')
    # Crops: resting arm (viewer right) and mouth, master vs rig, 2x of the app size.
    arm_box = (600, 640, 900, 1000)
    a = [on(DARK, m).crop(arm_box), on(DARK, r).crop(arm_box)]
    s = Image.new('RGB', (a[0].width * 2 + 30, a[0].height + 40), (60, 60, 68))
    ImageDraw.Draw(s).text((10, 8), 'Resting arm (viewer right): master | rig', font=font(18), fill=(240, 240, 245))
    s.paste(a[0], (10, 34))
    s.paste(a[1], (a[0].width + 20, 34))
    s.save(OUT / 'arm_crop.png')
    fm = extract(np.array(m))['mouth']
    fr = extract(np.array(r))['mouth']
    tiles = []
    for img, mo in ((m, fm), (r, fr)):
        cx, cy = mo['cx'], mo['top'] + mo['height'] / 2
        side_ = int(max(fm['width'], fm['height']) * 1.8)
        tiles.append(on(BG, img).crop((int(cx - side_ / 2), int(cy - side_ / 2), int(cx + side_ / 2), int(cy + side_ / 2))).resize((side_ * 2, side_ * 2), Image.LANCZOS))
    s = Image.new('RGB', (tiles[0].width * 2 + 30, tiles[0].height + 40), (60, 60, 68))
    ImageDraw.Draw(s).text((10, 8), 'Mouth: master | rig (soft inner edge, smooth tongue), 2x', font=font(18), fill=(240, 240, 245))
    s.paste(tiles[0], (10, 34))
    s.paste(tiles[1], (tiles[0].width + 20, 34))
    s.save(OUT / 'mouth_crop.png')


def strip(name: str, jobs: list, labels: list, title: str, size=(360, 420), hw=210, y=160) -> None:
    harness({'width': size[0], 'height': size[1], 'x': size[0] / 2, 'y': y, 'headWidth': hw, 'background': '#F6F3FF', 'jobs': jobs})
    ims = [Image.open(j['out']).convert('RGB') for j in jobs]
    s = Image.new('RGB', (len(ims) * (size[0] + 6) + 6, size[1] + 60), (60, 60, 68))
    d = ImageDraw.Draw(s)
    d.text((8, 8), title, font=font(18), fill=(240, 240, 245))
    for i, (im, lab) in enumerate(zip(ims, labels)):
        s.paste(im, (6 + i * (size[0] + 6), 54))
        d.text((10 + i * (size[0] + 6), 34), lab, font=font(15), fill=(220, 220, 230))
    s.save(OUT / name)


def motion() -> None:
    turns = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1]
    strip('turn_strip.png', [{'out': str(TMP / f'turn_{i}.png'), 'preset': 'happy', 'params': {'headTurn': t}} for i, t in enumerate(turns)],
          [f'headTurn {t:+.2f}' for t in turns], 'headTurn -1 -> +1 (features kept central; the narrow eye stays >= 80% wide)')
    # The Lab script, frame-exact: wave (31.0-34.0 s) at 1/15 s, hop (45.0-46.0 s) at 1/30 s, and the first blink.
    for name, t0, t1, step, title in [
        ('motion_wave.png', 32.0, 33.2, 1 / 10, 'Lab script, wave: elbow 2-beat rhythm, slight body rock (every 0.1 s)'),
        ('motion_hop.png', 45.1, 46.0, 1 / 20, 'Lab script, hop: anticipation, stretch, apex, landing squash, ears follow through (every 0.05 s)'),
        ('motion_blink.png', 1.15, 1.42, 1 / 30, 'Lab script, a blink: fast close, slower open (every 1/30 s)'),
    ]:
        ts = list(np.arange(t0, t1 + 1e-6, step))
        strip(name, [{'out': str(TMP / f'm_{name}_{i}.png'), 'script': 'lab', 'time': float(t)} for i, t in enumerate(ts)],
              [f'{t:.2f}s' for t in ts], title, size=(300, 380), hw=180, y=140)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    presets()
    master_overlay()
    motion()


if __name__ == '__main__':
    main()
