#!/usr/bin/env python
"""Reference frame strips for human review (start, middle and end of every
beat at the five review canvas sizes).

Buddy is composited from the real runtime textures with the exact poses the
TypeScript director produced (docs/hero-frames.json). The phone is a
schematic of the Skia phone (screen state, notice, glyph, trail, finger),
not the Skia render itself. Keep-clear zones are outlined in green.

    HERO_DUMP=1 npx vitest run frameDump
    python tools/render_frame_strip.py
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
import mascot_contact_sheet as CS  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SS = 2  # supersampling
CREAM = (250, 248, 245)


def font(sz):
    for name in ('arialbd.ttf', 'arial.ttf', 'DejaVuSans-Bold.ttf'):
        try:
            return ImageFont.truetype(name, sz)
        except OSError:
            continue
    return ImageFont.load_default()


def ts_pose(p):
    total = p['mouthSmile'] + p['mouthSoft'] + p['mouthO'] + p['mouthSmall']
    mouth = {k: v / total for k, v in (('smile', p['mouthSmile']), ('soft', p['mouthSoft']), ('o', p['mouthO']), ('small', p['mouthSmall'])) if v > 1e-4}
    return dict(
        body_dy=p['bodyDy'], body_sx=p['bodySx'], body_sy=p['bodySy'], lean=p['lean'], intro=p['introScale'],
        head_rot=p['headRot'], head_dx=p['headDx'], head_dy=p['headDy'], ear_l=p['earL'], ear_r=p['earR'], arm=p['arm'],
        gaze=(0, 0), eye_off=((p['eyeLX'], p['eyeLY']), (p['eyeRX'], p['eyeRY'])),
        face_par=(p['faceParX'], p['faceParY']), open_l=p['openL'], open_r=p['openR'], blink_style='eyelid',
        wide=p['wide'], squint=p['squint'], mouth=mouth or {'smile': 1.0}, cheek=p['cheek'],
    )


def premult_to_rgba(acc):
    a = np.clip(acc[..., 3:], 0, 1)
    rgb = np.where(a > 1e-4, acc[..., :3] / np.maximum(a, 1e-4), 0)
    return Image.fromarray((np.dstack([np.clip(rgb, 0, 1), a]) * 255 + 0.5).astype(np.uint8), 'RGBA')


def draw_phone(img, L, f, strokes, palette):
    d = ImageDraw.Draw(img, 'RGBA')
    s = SS
    P, S = L['phone'], L['screen']
    ph = f['phone']
    X = lambda v: v * s  # noqa: E731
    # floor shadow
    d.rounded_rectangle([X(P['x'] + P['w'] * 0.06), X(P['y'] + P['h'] - P['w'] * 0.04), X(P['x'] + P['w'] * 1.0), X(P['y'] + P['h'] + P['w'] * 0.05)], radius=X(P['w'] * 0.05), fill=(59, 46, 90, 30))
    d.rounded_rectangle([X(P['x']), X(P['y']), X(P['x'] + P['w']), X(P['y'] + P['h'])], radius=X(P['r']), fill=(43, 42, 51, 255))
    sx0, sy0, sw, sh = S['x'], S['y'], S['w'], S['h']
    scr = Image.new('RGBA', (int(X(sw)), int(X(sh))), (0, 0, 0, 255))
    sd = ImageDraw.Draw(scr, 'RGBA')
    W_, H_ = scr.size
    sat = ph['saturation']
    def col(c):
        r, g, b = c
        l = 0.2126 * r + 0.7152 * g + 0.0722 * b
        return tuple(int(l + (v - l) * sat) for v in (r, g, b))
    for yy in range(H_):
        u = min(1, yy / (H_ * 0.7))
        c = tuple(int(a + (b - a) * u) for a, b in zip((191, 230, 255), (232, 246, 255)))
        sd.line([(0, yy), (W_, yy)], fill=col(c))
    sd.ellipse([W_ * 0.69, H_ * 0.13 - W_ * 0.075, W_ * 0.83, H_ * 0.13 + W_ * 0.075], fill=col((255, 214, 107)))
    for base, amp, waves, phs, c in ((0.66, 0.12, 2.2, 0.6, (168, 221, 181)), (0.8, 0.09, 1.4, 2.4, (124, 203, 151))):
        pts = [(u / 32 * W_, H_ * (base - amp * (0.5 + 0.5 * math.sin(u / 32 * math.pi * waves + phs)))) for u in range(33)]
        sd.polygon([(0, H_)] + pts + [(W_, H_)], fill=col(c))
    phase = ph['phase']
    bx = -0.12 + phase * 1.24
    b2 = (phase * 2) % 1
    by = 0.705 - 4 * b2 * (1 - b2) * 0.22
    br = W_ * 0.055
    sd.ellipse([bx * W_ - br, by * H_ - br, bx * W_ + br, by * H_ + br], fill=col((255, 143, 177)))
    # status bar
    fs = max(7, int(H_ * 0.06 * 0.42))
    sd.text((W_ * 0.07, H_ * 0.012), '4:15', font=font(fs), fill=(255, 255, 255))
    bat = ph['battery']
    bw, bh = W_ * 0.075, W_ * 0.036
    bxx = W_ * 0.93 - bw
    sd.rounded_rectangle([bxx, H_ * 0.02, bxx + bw, H_ * 0.02 + bh], radius=2, outline=(255, 255, 255), width=max(1, s))
    sd.rectangle([bxx + 2, H_ * 0.02 + 2, bxx + 2 + (bw - 4) * min(1, bat / 100), H_ * 0.02 + bh - 2], fill=(255, 107, 107) if ph['red'] else (255, 255, 255))
    sd.text((bxx - fs * 2.4, H_ * 0.012), f'{round(bat)}%', font=font(fs), fill=(255, 255, 255))
    # notice
    if ph['notice'] > 0.01:
        nh = H_ * 0.085
        ny = H_ * 0.065 - (1 - ph['notice']) * (nh + H_ * 0.08)
        sd.rounded_rectangle([W_ * 0.06, ny, W_ * 0.94, ny + nh], radius=nh * 0.32, fill=(255, 255, 255, int(240 * min(1, ph['notice'] * 1.5))))
        sd.text((W_ * 0.06 + nh * 0.95, ny + nh * 0.3), '1% Battery. Phone needs rest.', font=font(max(7, int(min(nh * 0.3, W_ * 0.88 / 17)))), fill=(38, 33, 58))
        sd.rounded_rectangle([W_ * 0.06 + nh * 0.28, ny + nh * 0.36, W_ * 0.06 + nh * 0.7, ny + nh * 0.6], radius=2, outline=(226, 72, 61), width=max(1, s))
    over = Image.new('RGBA', scr.size, (0, 0, 0, int(255 * ph['dim'])))
    scr = Image.alpha_composite(scr, over)
    if ph['black'] > 0:
        blk = Image.new('RGBA', scr.size, (0, 0, 0, int(255 * ph['black'])))
        if ph['reveal'] > 0:
            m = Image.new('L', scr.size, 255)
            md = ImageDraw.Draw(m)
            cx, cy = ph['revealX'] * W_, ph['revealY'] * H_
            r = ph['reveal'] * math.hypot(W_, H_) * 1.05
            md.ellipse([cx - r, cy - r, cx + r, cy + r], fill=0)
            blk.putalpha(Image.fromarray((np.asarray(m) * ph['black']).astype(np.uint8)))
        scr = Image.alpha_composite(scr, blk)
    sd = ImageDraw.Draw(scr, 'RGBA')
    if ph['glyph'] > 0.01:
        a = int(255 * ph['glyph'])
        gw, gh = W_ * 0.3, W_ * 0.15
        gx, gy = (W_ - gw) / 2, H_ * 0.5 - gh / 2
        sd.rounded_rectangle([gx, gy, gx + gw, gy + gh], radius=gh * 0.18, outline=(255, 255, 255, a), width=max(2, s * 2))
        sd.rectangle([gx + gw * 0.07, gy + gh * 0.16, gx + gw * 0.13, gy + gh * 0.84], fill=(255, 90, 90, a))
    fi = f['finger']
    for idx, (hk, tk) in enumerate((('s1Head', 's1Tail'), ('s2Head', 's2Tail'))):
        head, tail = fi[hk], fi[tk]
        if head - tail > 0.001 and idx < len(strokes):
            pts = strokes[idx]
            n = len(pts) // 2
            cum = [0.0]
            for i in range(1, n):
                cum.append(cum[-1] + math.hypot(pts[2 * i] - pts[2 * i - 2], pts[2 * i + 1] - pts[2 * i - 1]))
            tot = cum[-1] or 1
            seg = [(pts[2 * i] * W_, pts[2 * i + 1] * H_) for i in range(n) if tail - 1e-6 <= cum[i] / tot <= head + 1e-6]
            if len(seg) > 1:
                sd.line(seg, fill=(185, 163, 255, 230), width=max(2, int(W_ * 0.016)), joint='curve')
    img.paste(scr, (int(X(sx0)), int(X(sy0))), mask=_round_mask(scr.size, X(S['r'])))
    # finger
    if fi['visible'] > 0.02:
        tx, ty = X(sx0 + fi['x'] * sw), X(sy0 + fi['y'] * sh)
        fw = X(sw * 0.14)
        ang = math.radians(20)
        cap = Image.new('RGBA', (int(fw * 1.2), int(fw * 3.6)), (0, 0, 0, 0))
        cd = ImageDraw.Draw(cap)
        cd.rounded_rectangle([fw * 0.1, 0, fw * 1.1, fw * 3.4], radius=fw / 2, fill=(237, 193, 163, int(255 * fi['visible'])))
        cd.rounded_rectangle([fw * 0.3, fw * 0.1, fw * 0.9, fw * 0.8], radius=fw * 0.28, fill=(250, 214, 190, int(200 * fi['visible'])))
        cap = cap.rotate(math.degrees(ang), expand=True, resample=Image.BICUBIC)
        img.alpha_composite(cap, (int(tx - fw * 0.35), int(ty - fw * 0.1)))
        if fi['contact'] > 0.1:
            d.ellipse([tx - fw * 0.5, ty - fw * 0.5, tx + fw * 0.5, ty + fw * 0.5], outline=(255, 255, 255, int(110 * fi['contact'])), width=s)


def _round_mask(size, r):
    m = Image.new('L', size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=r, fill=255)
    return m


def render_frame(rig, entry, f):
    W, H, L = entry['W'], entry['H'], entry['layout']
    img = Image.new('RGBA', (W * SS, H * SS), CREAM + (255,))
    B = L['buddy']
    sb = rig.rig['silhouetteBounds']
    k = B['scale'] * SS
    back, front = rig.render(ts_pose(f['pose']), k=k, split=True)
    ox = int(round((B['x'] - sb[0] * B['scale']) * SS))
    oy = int(round((B['y'] - sb[1] * B['scale']) * SS))
    # contact shadow
    d = ImageDraw.Draw(img, 'RGBA')
    seat = rig.rig['seat']
    cx = ox + seat[0] * k
    cy = oy + seat[1] * k
    w = B['width'] * SS * 0.95
    d.ellipse([cx - w / 2, cy - w * 0.07, cx + w / 2, cy + w * 0.06], fill=(59, 46, 90, 45))
    alpha = f['pose']['opacity']
    bimg = premult_to_rgba(back)
    if alpha < 1:
        bimg.putalpha(Image.fromarray((np.asarray(bimg)[..., 3] * alpha).astype(np.uint8)))
    img.alpha_composite(bimg, (ox, oy)) if ox >= 0 and oy >= 0 else img.paste(bimg, (ox, oy), bimg)
    draw_phone(img, L, f, entry['strokes'], 'meadow')
    fimg = premult_to_rgba(front)
    img.paste(fimg, (ox, oy), fimg)
    d = ImageDraw.Draw(img, 'RGBA')
    for z in L['zones'].values():
        d.rectangle([z['x'] * SS, z['y'] * SS, (z['x'] + z['w']) * SS, (z['y'] + z['h']) * SS], outline=(0, 184, 148, 160), width=1)
    A = L['allowed']
    d.rectangle([A['x'] * SS, A['y'] * SS, (A['x'] + A['w']) * SS, (A['y'] + A['h']) * SS], outline=(255, 140, 0, 200), width=1)
    for sp in f['sparkles']:
        if sp['a'] > 0.02:
            r = 6 * sp['s'] * SS
            x, y = sp['x'] * SS, sp['y'] * SS
            d.polygon([(x, y - r), (x + r * 0.3, y - r * 0.3), (x + r, y), (x + r * 0.3, y + r * 0.3), (x, y + r), (x - r * 0.3, y + r * 0.3), (x - r, y), (x - r * 0.3, y - r * 0.3)], fill=(255, 216, 107, int(255 * sp['a'])))
    gx, gy = f['gaze']
    d.ellipse([gx * SS - 4, gy * SS - 4, gx * SS + 4, gy * SS + 4], outline=(0, 160, 255, 200), width=2)
    return img.convert('RGB').resize((W, H), Image.LANCZOS)


def main():
    data = json.loads((ROOT / 'docs/hero-frames.json').read_text())
    rig = CS.Rig(ROOT / 'assets/mascot')
    out_dir = ROOT / 'docs/hero-frames'
    out_dir.mkdir(parents=True, exist_ok=True)
    for entry in data:
        W, H = entry['W'], entry['H']
        th = 300
        tw = int(W * th / H)
        tiles = []
        for f in entry['frames']:
            im = render_frame(rig, entry, f).resize((tw, th), Image.LANCZOS)
            lab = Image.new('RGB', (tw, 34), (255, 255, 255))
            ImageDraw.Draw(lab).text((4, 2), f"{f['beat']} {f['tag']} {f['t']:.2f}s", font=font(11), fill=(30, 30, 40))
            ImageDraw.Draw(lab).text((4, 17), f"{f['intent']}", font=font(10), fill=(110, 100, 140))
            tile = Image.new('RGB', (tw, th + 34), (255, 255, 255))
            tile.paste(im, (0, 0))
            tile.paste(lab, (0, th))
            tiles.append(tile)
        cols = 12
        rows = math.ceil(len(tiles) / cols)
        sheet = Image.new('RGB', (cols * (tw + 6) + 6, rows * (th + 40) + 6), (232, 228, 240))
        for i, t in enumerate(tiles):
            sheet.paste(t, (6 + (i % cols) * (tw + 6), 6 + (i // cols) * (th + 40)))
        path = out_dir / f'strip_{W}x{H}.jpg'
        sheet.save(path, quality=86)
        print('wrote', path.relative_to(ROOT))


if __name__ == '__main__':
    main()
