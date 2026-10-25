"""QA contact sheet for the mascot rig.

Poses the runtime textures with the same transform hierarchy the app uses
(body -> head -> face features, arm about the shoulder, ears about their
bases) so seams, halos and ghost edges can be judged at 1x and 2x.

Called by prepare_mascot.py; can also run standalone:
    python tools/mascot_contact_sheet.py
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
CREAM = np.array([0xFA, 0xF8, 0xF5], np.float32) / 255


# ---------------------------------------------------------------------------
# affine helpers (3x3)
# ---------------------------------------------------------------------------

def T(x, y):
    return np.array([[1, 0, x], [0, 1, y], [0, 0, 1]], np.float64)


def S(sx, sy=None):
    sy = sx if sy is None else sy
    return np.array([[sx, 0, 0], [0, sy, 0], [0, 0, 1]], np.float64)


def R(deg):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]], np.float64)


def about(p, M):
    return T(p[0], p[1]) @ M @ T(-p[0], -p[1])


# ---------------------------------------------------------------------------
# pose definition (mirrors src/onboarding/hero/mascot/rig.ts)
# ---------------------------------------------------------------------------

NEUTRAL = dict(
    body_dy=0.0, body_sx=1.0, body_sy=1.0, lean=0.0,
    head_rot=0.0, head_dx=0.0, head_dy=0.0,
    ear_l=0.0, ear_r=0.0, arm=0.0,
    gaze=(0.0, 0.0), face_par=(0.0, 0.0),
    open_l=1.0, open_r=1.0, blink_style='eyelid', wide=1.0, squint=0.0,
    mouth={'smile': 1.0}, cheek=1.0,
)


def pose(**kw):
    p = dict(NEUTRAL)
    p.update(kw)
    return p


POSES = [
    ('neutral', pose()),
    ('look left', pose(gaze=(-1, 0), face_par=(-6, 0), head_rot=-3)),
    ('look right', pose(gaze=(1, 0.2), face_par=(6, 1), head_rot=3)),
    ('blink (squash)', pose(open_l=0.08, open_r=0.08, blink_style='squash')),
    ('blink (eyelid)', pose(open_l=0.0, open_r=0.0, blink_style='eyelid')),
    ('sleepy half-blink', pose(open_l=0.5, open_r=0.5, mouth={'small': 1.0})),
    ('yawn', pose(head_rot=-6, open_l=0.5, open_r=0.5, mouth={'o': 1.0}, ear_l=-4, ear_r=4)),
    ('curious tilt', pose(head_rot=7, wide=1.06, gaze=(1, 0.3), face_par=(4, 1), ear_l=-3, ear_r=-3)),
    ('concerned perk', pose(body_dy=-0.015, ear_l=5, ear_r=-5, mouth={'soft': 1.0}, gaze=(1, -0.6))),
    ('cheer', pose(arm=-18, body_dy=-0.03, squint=0.45, mouth={'smile': 1.0}, cheek=1.25)),
    ('wave -18', pose(arm=-18, lean=-1.0)),
    ('wave +18', pose(arm=18, lean=1.0)),
    ('giggle squash', pose(body_sx=1.035, body_sy=0.966, squint=0.3, cheek=1.3)),
    ('ear twitch', pose(ear_l=-8, ear_r=8)),
    ('head max L', pose(head_rot=-8, face_par=(-6, 0), gaze=(-1, 0))),
    ('head max R', pose(head_rot=8, face_par=(6, 0), gaze=(1, 0))),
]


# ---------------------------------------------------------------------------
# rendering
# ---------------------------------------------------------------------------

class Rig:
    def __init__(self, out_dir: Path):
        self.out = out_dir
        self.rig = json.loads((out_dir / 'rig.json').read_text())
        self.ts = self.rig['textureScale']
        self.tex = {}
        for name, meta in self.rig['parts'].items():
            im = np.asarray(Image.open(out_dir / meta['file']).convert('RGBA')).astype(np.float32) / 255
            im[..., :3] *= im[..., 3:]
            self.tex[name] = (im, meta['rect'], meta['pivot'])

    def warp(self, canvas_size, k, name, M):
        im, rect, _ = self.tex[name]
        full = S(k) @ M @ T(rect[0], rect[1]) @ S(1 / self.ts)
        return cv2.warpAffine(im, full[:2], (canvas_size, canvas_size), flags=cv2.INTER_LINEAR,
                              borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))

    def render(self, p, k=0.5, bg=CREAM, split=False):
        rig = self.rig
        size = int(round(rig['sourceSize'] * k))
        seat = rig['seat']
        P = {n: m['pivot'] for n, m in rig['parts'].items()}
        Bm = about(seat, T(0, p['body_dy'] * rig['sourceSize']) @ R(p['lean']) @ S(p['body_sx'], p['body_sy']) @ S(p.get('intro', 1.0)))
        Hm = Bm @ about(P['head'], T(p['head_dx'], p['head_dy']) @ R(p['head_rot']))
        fp = p['face_par']
        Fm = Hm @ T(fp[0], fp[1])
        FBm = Hm @ T(fp[0] * 0.35, fp[1] * 0.35)
        Am = Bm @ about(P['arm_wave'], R(p['arm']))
        acc = np.zeros((size, size, 4), np.float32)

        def over(layer, mode='over'):
            nonlocal acc
            if mode == 'atop':
                acc[..., :3] = layer[..., :3] * acc[..., 3:] + acc[..., :3] * (1 - layer[..., 3:])
            else:
                acc = layer + acc * (1 - layer[..., 3:])

        over(self.warp(size, k, 'ear_l', Hm @ about(P['ear_l'], R(p['ear_l']))))
        over(self.warp(size, k, 'ear_r', Hm @ about(P['ear_r'], R(p['ear_r']))))
        body = np.zeros_like(acc)
        body_parts = (('torso', Bm), ('arm_rest', Bm), ('leg_l', Bm), ('arm_wave', Am)) if split else             (('torso', Bm), ('arm_rest', Bm), ('leg_l', Bm), ('leg_r', Bm), ('arm_wave', Am))
        for n, M in body_parts:
            L = self.warp(size, k, n, M)
            body = L + body * (1 - L[..., 3:])
        sh = self.warp(size, k, 'chin_shadow', Hm)
        body[..., :3] = sh[..., :3] * body[..., 3:] + body[..., :3] * (1 - sh[..., 3:])
        over(body)
        over(self.warp(size, k, 'head', Hm))
        over(self.warp(size, k, 'face_base', FBm))
        for side in ('l', 'r'):
            cc = rig['cheeks'][side]['c']
            L = self.warp(size, k, f'cheek_{side}', Fm @ about(cc, S(p['cheek'] ** 0.5)))
            L *= min(1.0, p['cheek'])
            over(L)
        over(self.mouth_layer(size, k, Fm, p['mouth']))
        for side in ('l', 'r'):
            e = rig['eyes'][side]
            ew = e['r'][0] * 2
            gx, gy = p['gaze']
            off = np.array(p['eye_off'][0 if side == 'l' else 1]) if 'eye_off' in p else np.array([gx, gy]) * 0.06 * ew
            openy = p[f'open_{side}'] if p['blink_style'] == 'squash' else 1.0
            Em = Fm @ T(*off) @ about(e['c'], S(p['wide'], p['wide'] * max(openy, 0.02)))
            over(self.warp(size, k, f'eye_halo_{side}', Fm))
            eye = self.warp(size, k, f'eye_{side}', Em)
            Hl = Fm @ T(*(off * 0.25)) @ about(e['c'], S(p['wide'], p['wide'] * max(openy, 0.02)))
            hl = self.warp(size, k, f'highlight_{side}', Hl)
            hl *= float(np.clip((openy - 0.15) / 0.4, 0, 1)) ** 2 * (3 - 2 * float(np.clip((openy - 0.15) / 0.4, 0, 1)))
            closure = 1 - p[f'open_{side}'] if p['blink_style'] == 'eyelid' else 0.0
            if closure > 0 or p['squint'] > 0:
                keep, line = self.lid_masks(size, k, Fm @ T(*off), e, closure, p['squint'])
                eye *= keep[..., None]
                hl *= keep[..., None]
                over(eye)
                over(hl)
                over(line)
            else:
                over(eye)
                over(hl)
        if split:
            front = self.warp(size, k, 'leg_r', Bm)
            af = self.warp(size, k, 'arm_wave_front', Am)
            front = af + front * (1 - af[..., 3:])
            return acc, front
        over(self.warp(size, k, 'arm_wave_front', Am))
        out = acc[..., :3] + bg * (1 - acc[..., 3:])
        return np.clip(out, 0, 1), acc

    # -- vector pieces (mirrors MascotLayer.tsx) ----------------------------

    def mouth_layer(self, size, k, M, weights):
        rig = self.rig
        if abs(weights.get('smile', 0) - 1.0) < 1e-6:
            return self.warp(size, k, 'mouth', M)
        shapes = rig['mouth']['shapes']
        pts = sum(np.array(shapes[n]) * w for n, w in weights.items())
        tongue = {'c': sum(np.array(rig['mouth']['tongue'][n]['c']) * w for n, w in weights.items()),
                  'r': sum(np.array(rig['mouth']['tongue'][n]['r']) * w for n, w in weights.items())}
        ss = 4
        full = S(k * ss) @ M
        ptsc = (full[:2, :2] @ pts.T).T + full[:2, 2]
        big = size * ss
        mask = np.zeros((big, big), np.uint8)
        cv2.fillPoly(mask, [np.round(ptsc).astype(np.int32)], 255, lineType=cv2.LINE_AA)
        col = np.zeros((big, big, 3), np.float32)
        top = np.array(hex_rgb(rig['mouth']['colors']['interiorTop'])) * 0.82
        botc = np.array(hex_rgb(rig['mouth']['colors']['interiorBottom']))
        y0, y1 = ptsc[:, 1].min(), ptsc[:, 1].max()
        yy = np.clip((np.arange(big) - y0) / max(y1 - y0, 1), 0, 1)[:, None, None]
        col[:] = top * (1 - yy) + botc * yy
        tc = (full[:2, :2] @ tongue['c']) + full[:2, 2]
        tr = tongue['r'] * k * ss * math.sqrt(abs(np.linalg.det(M[:2, :2])))
        tm = np.zeros((big, big), np.uint8)
        cv2.ellipse(tm, ((float(tc[0]), float(tc[1])), (float(tr[0] * 2), float(tr[1] * 2)), 0.0), 255, -1, cv2.LINE_AA)
        tmf = (tm.astype(np.float32) / 255)[..., None]
        tcol = np.array(hex_rgb(rig['mouth']['colors']['tongue']))
        col = col * (1 - tmf) + tcol * tmf
        a = mask.astype(np.float32) / 255
        rim = cv2.GaussianBlur(a, (0, 0), 2.0 * ss * k * 2)
        edge = np.clip((a - rim) * 3, 0, 1)[..., None]
        col = col * (1 - edge * 0.5) + np.array([0.24, 0.07, 0.33]) * edge * 0.5
        layer = np.dstack([col * a[..., None], a])
        return cv2.resize(layer, (size, size), interpolation=cv2.INTER_AREA)

    def lid_masks(self, size, k, M, e, closure, squint):
        """Eyelids hide the eye (revealing the reconstructed fur beneath) behind
        a large ellipse whose edge forms the lid line; a soft lash line is
        drawn along that edge inside the eye. Mirrors MascotLayer.tsx."""
        cx, cy = e['c']
        Rr = max(e['r']) + 3.0
        yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
        full = S(k) @ M
        inv = np.linalg.inv(full)
        lx = inv[0, 0] * xx + inv[0, 1] * yy + inv[0, 2]
        ly = inv[1, 0] * xx + inv[1, 1] * yy + inv[1, 2]
        px_src = 1.0 / k  # one canvas pixel in source units
        keep = np.ones((size, size), np.float32)
        line = np.zeros((size, size), np.float32)
        in_eye = ((lx - cx) / (e['r'][0] + 4)) ** 2 + ((ly - cy) / (e['r'][1] + 4)) ** 2 <= 1
        lids = []
        if closure > 0:
            ry_l, rx_l = 1.15 * Rr, 1.35 * Rr
            bottom = (cy - Rr - 2) + (2 * Rr + 4) * closure
            lids.append((cx, bottom - ry_l, rx_l, ry_l, min(1.0, closure * 3)))
        if squint > 0:
            ry_l, rx_l = 1.1 * Rr, 1.25 * Rr
            top = (cy + Rr + 2) - (2 * Rr + 4) * squint
            lids.append((cx, top + ry_l, rx_l, ry_l, min(1.0, squint * 3)))
        for (ex, ey, rx_l, ry_l, lash) in lids:
            f = np.sqrt(((lx - ex) / rx_l) ** 2 + ((ly - ey) / ry_l) ** 2)
            d = (f - 1) * ry_l  # approx signed distance in source px (outside > 0)
            keep *= np.clip(0.5 + d / (1.2 * px_src), 0, 1)
            width = 2.0 + 2.2 * max(closure, squint) + 0.5 * px_src
            line = np.maximum(line, np.exp(-(d / width) ** 2) * in_eye * lash)
        line = cv2.GaussianBlur(line, (0, 0), 0.6)
        lash_rgb = np.array([0.27, 0.15, 0.52], np.float32)
        a = (line * 0.9).astype(np.float32)
        layer = np.dstack([lash_rgb * a[..., None], a]).astype(np.float32)
        return keep, layer


def hex_rgb(h):
    h = h.lstrip('#')
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]


# ---------------------------------------------------------------------------
# sheet
# ---------------------------------------------------------------------------

def to_lab(rgb):
    c = np.clip(rgb, 0, 1).astype(np.float64)
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124564, 0.3575761, 0.1804375],
                  [0.2126729, 0.7151522, 0.0721750],
                  [0.0193339, 0.1191920, 0.9503041]])
    xyz = lin @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def u8(img):
    return Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8))


def label(img: Image.Image, text):
    d = ImageDraw.Draw(img)
    try:
        f = ImageFont.truetype('arial.ttf', 15)
    except OSError:
        f = ImageFont.load_default()
    d.rectangle([0, 0, img.width, 20], fill=(255, 255, 255))
    d.text((4, 2), text, fill=(30, 30, 40), font=f)
    return img


def build(src, rig_unused, out_dir: Path, docs: Path, bg_rgb):
    docs.mkdir(parents=True, exist_ok=True)
    qa_dir = docs / 'mascot-qa'
    qa_dir.mkdir(exist_ok=True)
    rig = Rig(out_dir)
    k = rig.ts  # 1x = native texture resolution
    size = int(round(1254 * k))

    # --- neutral reassembly vs source -------------------------------------
    neutral, acc = rig.render(POSES[0][1], k=k, bg=np.asarray(bg_rgb, np.float32))
    src_s = cv2.resize(src, (size, size), interpolation=cv2.INTER_AREA)
    lab_a, lab_b = to_lab(neutral), to_lab(src_s)
    de = np.sqrt(((lab_a - lab_b) ** 2).sum(-1))
    m_all = acc[..., 3] > 0.02
    m_int = cv2.erode((acc[..., 3] > 0.99).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    stats = {
        'deltaE76_mean_bear': float(de[m_all].mean()),
        'deltaE76_p95_bear': float(np.percentile(de[m_all], 95)),
        'deltaE76_p99_bear': float(np.percentile(de[m_all], 99)),
        'deltaE76_mean_interior': float(de[m_int].mean()),
        'deltaE76_p99_interior': float(np.percentile(de[m_int], 99)),
        'deltaE76_max_interior': float(de[m_int].max()),
        'pixels_over_3_interior_pct': float((de[m_int] > 3).mean() * 100),
    }
    heat = np.clip(de / 6.0, 0, 1)
    heat_rgb = cv2.applyColorMap((heat * 255).astype(np.uint8), cv2.COLORMAP_INFERNO)[..., ::-1] / 255.0

    # --- poses ----------------------------------------------------------------
    renders = []
    for name, p in POSES:
        img, _ = rig.render(p, k=k)
        renders.append((name, img))
        u8(img).save(qa_dir / f'pose_{name.replace(" ", "_").replace("(", "").replace(")", "")}.png')

    # Face / arm crops at 2x (source-coordinate boxes).
    face_box = (380, 440, 960, 800)
    arm_box = (110, 520, 580, 930)
    chin_box = (360, 720, 960, 960)
    ear_box = (250, 170, 1080, 520)

    def crop2x(img, box):
        x0, y0, x1, y1 = [int(v * k) for v in box]
        c = img[y0:y1, x0:x1]
        return cv2.resize(c, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    # --- assemble sheet -------------------------------------------------------
    thumb = 300
    cols = 4
    rows = []
    # Row 1: original | reassembled | difference
    r1 = [label(u8(cv2.resize(src_s, (thumb * 2, thumb * 2))), 'source'),
          label(u8(cv2.resize(neutral, (thumb * 2, thumb * 2))), 'reassembled neutral'),
          label(u8(cv2.resize(heat_rgb, (thumb * 2, thumb * 2))),
                f'dE76 (0..6)  mean {stats["deltaE76_mean_interior"]:.2f}  p99 {stats["deltaE76_p99_interior"]:.2f}')]
    rows.append(r1)
    # Parts on a dark and light background
    parts = []
    for name in ['head', 'face_base', 'ear_l', 'ear_r', 'torso', 'arm_rest', 'leg_l', 'leg_r', 'arm_wave',
                 'arm_wave_front', 'eye_halo_l', 'eye_l', 'eye_r', 'highlight_l', 'highlight_r', 'cheek_l', 'cheek_r', 'mouth',
                 'chin_shadow']:
        im = rig.tex[name][0]
        dark = im[..., :3] + np.array([0.16, 0.16, 0.19]) * (1 - im[..., 3:])
        t = u8(dark)
        t.thumbnail((thumb, thumb))
        canvas = Image.new('RGB', (thumb, thumb), (41, 41, 48))
        canvas.paste(t, ((thumb - t.width) // 2, (thumb - t.height) // 2 + 10))
        parts.append(label(canvas, f'{name} ({rig.rig["parts"][name]["source"]})'))
    for i in range(0, len(parts), 6):
        rows.append(parts[i:i + 6])
    # Poses 1x
    pose_tiles = []
    for name, img in renders:
        t = u8(img)
        t = t.resize((thumb, thumb), Image.LANCZOS)
        pose_tiles.append(label(t, name))
    for i in range(0, len(pose_tiles), 6):
        rows.append(pose_tiles[i:i + 6])
    # 2x crops
    zoom_tiles = []
    for name, img in renders:
        box = arm_box if name.startswith('wave') or name == 'cheer' else (
            chin_box if name.startswith('head max') else (ear_box if name == 'ear twitch' else face_box))
        z = crop2x(img, box)
        t = u8(z)
        t.thumbnail((thumb * 2, thumb * 2))
        zoom_tiles.append(label(t, f'{name} @2x'))
        u8(z).save(qa_dir / f'zoom2x_{name.replace(" ", "_").replace("(", "").replace(")", "")}.png')
    for i in range(0, len(zoom_tiles), 3):
        rows.append(zoom_tiles[i:i + 3])

    W = max(sum(t.width for t in r) + 8 * (len(r) + 1) for r in rows)
    H = sum(max(t.height for t in r) + 8 for r in rows) + 8
    sheet = Image.new('RGB', (W, H), (236, 233, 240))
    y = 8
    for r in rows:
        x = 8
        for t in r:
            sheet.paste(t, (x, y))
            x += t.width + 8
        y += max(t.height for t in r) + 8
    sheet.save(docs / 'mascot-contact-sheet.png', optimize=True)
    (docs / 'mascot-qa.json').write_text(json.dumps(stats, indent=1))
    print('contact sheet:', docs / 'mascot-contact-sheet.png')
    print('neutral reassembly:', json.dumps(stats))
    return stats


if __name__ == '__main__':
    src = np.asarray(Image.open(ROOT / 'assets/mascot/buddy_source.png').convert('RGB')).astype(np.float32) / 255
    bg = np.median(np.concatenate([src[:24].reshape(-1, 3), src[-24:].reshape(-1, 3)]), 0)
    build(src, None, ROOT / 'assets/mascot', ROOT / 'docs', bg)
