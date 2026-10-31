"""Normalize the cut Buddy frames and export the app assets + contact sheet.

Every frame is scaled so the head (widest point, ears excluded) has the same
width, then placed on one shared canvas anchored bottom-centre: the sitting
baseline (lowest fur row) on a fixed line, the seat centre on the middle.

Run (plain Python is fine, no model needed):
    python tools/buddy/normalize.py            # QA + contact sheet + export
    python tools/buddy/normalize.py --qa       # head-width QA overlay only
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from detect import SHEETS  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
MATTE = ROOT / 'design/buddy/_work/matte'
WORK = ROOT / 'design/buddy/_work'
EXPORT = ROOT / 'assets/onboarding/screen1/buddy'
SHEET_OUT = ROOT / 'design/buddy/buddy_contact_sheet.png'

# Normalized head width in points. Assets are written at 2x and 3x.
# 106pt is the largest size at which no app frame needs upscaling at 3x (the
# smallest source head, buddy_happy_front, is 318px wide). export() refuses to
# upscale, so raising this fails loudly instead of silently softening the fur.
HEAD_PT = 106
SCALES = (2, 3)
MAX_BYTES_3X = 150_000

# App frames: export name -> (source frame, mirrored). Section 7 of the brief.
EXPORTS: dict[str, tuple[str, bool]] = {
    'buddy_watch_34_left': ('turn_34_left', False),
    'buddy_worried_paws': ('act_worried_paws', False),
    'buddy_worried_wavy': ('expr_worried', False),
    'buddy_yawn': ('act_yawn', False),
    'buddy_sleepy': ('act_sleepy', False),
    'buddy_surprised': ('expr_surprised', False),
    'buddy_point_left': ('act_point_right', True),
    'buddy_arms_up': ('joy_arms_up', False),
    'buddy_wave': ('joy_wave', False),
    'buddy_happy_front': ('cel_happy_front', False),
}

# Head size. The head is the largest round shape in Buddy's upper body, so the
# largest circle that fits inside the silhouette there (a distance-transform
# peak) measures it: ears are too small and arms too thin to change it, and it
# barely changes as he turns. It is converted to head width (widest point,
# ears excluded) with one ratio measured on the clean front-facing frames.
HEAD_WIDTH_PER_DIAMETER = 1.20

# Frames where paws press against the head, which lets a bigger circle fit.
# Each sheet is drawn at one scale (clean frames on a sheet agree within ~3%),
# so these take the median head size of the clean frames on their sheet.
PAWS_ON_HEAD = {'joy_arms_up', 'joy_giggle', 'joy_cover_eyes', 'cel_arms_up', 'cel_peek'}


def all_frames() -> list[str]:
    return [n for names in SHEETS.values() for n in names if n is not None]


def load(name: str) -> np.ndarray:
    return np.array(Image.open(MATTE / f'{name}.png').convert('RGBA'))


def head_circle(a: np.ndarray) -> tuple[int, int, float]:
    """Centre and radius of the largest circle inside the upper silhouette."""
    ys, _ = np.nonzero(a)
    top, bottom = int(ys.min()), int(ys.max())
    dt = cv2.distanceTransform(a.astype(np.uint8), cv2.DIST_L2, 5)
    dt[top + int((bottom - top) * 0.62):] = 0  # the head, not the body
    cy, cx = np.unravel_index(int(np.argmax(dt)), dt.shape)
    return int(cx), int(cy), float(dt[cy, cx])


def measure(name: str, rgba: np.ndarray) -> dict:
    a = rgba[..., 3] > 128
    ys, xs = np.nonzero(a)
    top, bottom = int(ys.min()), int(ys.max())
    h = bottom - top + 1

    # Baseline: the lowest row with a meaningful amount of fur.
    counts = a.sum(axis=1)
    baseline = bottom
    while baseline > top and counts[baseline] < 6:
        baseline -= 1

    # Seat centre: middle of the fur in the bottom 12% (feet and seat).
    seat = a[baseline - int(h * 0.12): baseline + 1]
    sx = np.nonzero(seat.any(axis=0))[0]
    seat_cx = (int(sx.min()) + int(sx.max())) / 2

    cx, cy, r = head_circle(a)
    return dict(top=top, baseline=baseline, seat_cx=seat_cx, head_cx=cx, head_cy=cy, head_r=r)


def resolve_head_widths(metrics: dict[str, dict]) -> None:
    """Fill head_w (px); paws-on-head frames take their sheet's clean median."""
    for sheet, names in SHEETS.items():
        clean = [metrics[n]['head_r'] for n in names if n and n not in PAWS_ON_HEAD]
        median_r = float(np.median(clean))
        for n in names:
            if n is None:
                continue
            m = metrics[n]
            m['head_from_sheet'] = n in PAWS_ON_HEAD
            r = median_r if m['head_from_sheet'] else m['head_r']
            m['head_w'] = 2 * r * HEAD_WIDTH_PER_DIAMETER


def qa_overlay(frames: list[str], metrics: dict[str, dict]) -> None:
    """Every matte with its measured head span (red) and baseline (green)."""
    tiles = []
    for n in frames:
        im = Image.fromarray(load(n))
        bg = Image.new('RGBA', im.size, (40, 40, 46, 255))
        bg.alpha_composite(im)
        d = ImageDraw.Draw(bg)
        m = metrics[n]
        r = m['head_w'] / (2 * HEAD_WIDTH_PER_DIAMETER)
        d.ellipse([m['head_cx'] - r, m['head_cy'] - r, m['head_cx'] + r, m['head_cy'] + r], outline=(255, 60, 60), width=3)
        hw = m['head_w'] / 2
        d.line([(m['head_cx'] - hw, m['head_cy']), (m['head_cx'] + hw, m['head_cy'])], fill=(255, 200, 60), width=2)
        d.line([(0, m['baseline']), (im.width, m['baseline'])], fill=(60, 220, 120), width=2)
        d.line([(m['seat_cx'], m['baseline'] - 30), (m['seat_cx'], m['baseline'])], fill=(60, 220, 120), width=2)
        d.text((6, 6), f"{n} w={m['head_w']:.0f}" + (' (sheet)' if m['head_from_sheet'] else ''), fill=(255, 255, 255))
        tiles.append(bg.convert('RGB').resize((im.width // 2, im.height // 2)))
    cols = 6
    tw = max(t.width for t in tiles)
    th = max(t.height for t in tiles)
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * tw, rows * th), (40, 40, 46))
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * tw, (i // cols) * th))
    sheet.save(WORK / 'qa_head_width.png')


def interior_holes(frames: list[str]) -> dict[str, int]:
    """Find light interior areas the matting turned partly transparent.

    Inner ears, blush, foot pads and eye highlights all sit inside Buddy's
    outline, so every pixel inside the filled silhouette (minus a band for the
    soft fur edge) must be fully opaque. Offending pixels are painted red in
    design/buddy/_work/qa_interior.png.
    """
    report: dict[str, int] = {}
    tiles = []
    for n in frames:
        rgba = load(n)
        a = rgba[..., 3]
        sil = (a > 8).astype(np.uint8)
        contours, _ = cv2.findContours(sil, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        filled = np.zeros_like(sil)
        cv2.drawContours(filled, contours, -1, 1, thickness=cv2.FILLED)
        inner = cv2.erode(filled, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
        bad = (inner > 0) & (a < 250)
        report[n] = int(bad.sum())
        bg = Image.new('RGBA', (rgba.shape[1], rgba.shape[0]), (26, 26, 30, 255))
        bg.alpha_composite(Image.fromarray(rgba))
        vis = np.array(bg.convert('RGB'))
        vis[bad] = (255, 0, 0)
        tile = Image.fromarray(vis)
        ImageDraw.Draw(tile).text((6, 6), f'{n}: {report[n]} px', fill=(255, 255, 255))
        tiles.append(tile.resize((tile.width // 2, tile.height // 2)))
    cols = 6
    tw, th = max(t.width for t in tiles), max(t.height for t in tiles)
    sheet = Image.new('RGB', (cols * tw, ((len(tiles) + cols - 1) // cols) * th), (26, 26, 30))
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * tw, (i // cols) * th))
    sheet.save(WORK / 'qa_interior.png')
    return report


def lost_colour(frames: list[str]) -> dict[str, int]:
    """Second check, for areas that touch the outline (e.g. inner ears in profile).

    Goes back to the original sheet: every strongly coloured pixel there
    (pink ear, blush, purple pad, lavender fur core) away from the soft fur
    fringe must be opaque in the cutout. Losses are painted red in
    design/buddy/_work/qa_colour.png.
    """
    from detect import LAYOUT, detect_frames
    from matte import PAD

    sheets = {}
    report: dict[str, int] = {}
    tiles = []
    for sheet, names in SHEETS.items():
        rgb = np.array(Image.open(ROOT / f'design/buddy/{sheet}.png').convert('RGB'))
        sheets[sheet] = (rgb, detect_frames(rgb, LAYOUT[sheet]), names)
    for sheet, (rgb, boxes, names) in sheets.items():
        H, W = rgb.shape[:2]
        for n, (x0, y0, x1, y1) in zip(names, boxes):
            if n not in frames:
                continue
            cx0, cy0 = max(0, x0 - PAD), max(0, y0 - PAD)
            crop = rgb[cy0:min(H, y1 + PAD), cx0:min(W, x1 + PAD)]
            hsv = cv2.cvtColor(crop, cv2.COLOR_RGB2HSV)
            strong = (hsv[..., 1] > 70).astype(np.uint8)  # clearly coloured, not paper or fringe
            strong = cv2.erode(strong, np.ones((5, 5), np.uint8))  # skip the anti-aliased rim
            own = np.zeros_like(strong)  # only this frame's box: the padding holds neighbours
            own[y0 - cy0:y1 - cy0, x0 - cx0:x1 - cx0] = 1
            strong &= own
            a = load(n)[..., 3]
            bad = (strong > 0) & (a < 240)
            report[n] = int(bad.sum())
            vis = crop.copy()
            vis[bad] = (255, 0, 0)
            tile = Image.fromarray(vis)
            ImageDraw.Draw(tile).text((6, 6), f'{n}: {report[n]} px', fill=(0, 0, 0))
            tiles.append(tile.resize((tile.width // 2, tile.height // 2)))
    cols = 6
    tw, th = max(t.width for t in tiles), max(t.height for t in tiles)
    out = Image.new('RGB', (cols * tw, ((len(tiles) + cols - 1) // cols) * th), (255, 255, 255))
    for i, t in enumerate(tiles):
        out.paste(t, ((i % cols) * tw, (i // cols) * th))
    out.save(WORK / 'qa_colour.png')
    return report


def place(rgba: np.ndarray, m: dict, mirror: bool, k: float, canvas: tuple[int, int], base_y: float) -> Image.Image:
    """Scale by k and place on the canvas: seat centre at the middle, baseline at base_y."""
    im = Image.fromarray(rgba)
    seat_cx = m['seat_cx']
    if mirror:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
        seat_cx = im.width - 1 - seat_cx
    # Premultiplied resampling avoids dark fringes at the soft edges.
    im = im.convert('RGBa').resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).convert('RGBA')
    cw, ch = canvas
    ox = round(cw / 2 - seat_cx * k)
    oy = round(base_y - m['baseline'] * k)
    out = Image.new('RGBA', canvas, (0, 0, 0, 0))
    out.alpha_composite(im, (max(0, ox), max(0, oy)), (max(0, -ox), max(0, -oy)))
    return out


def extents(frames: list[tuple[str, bool]], metrics: dict[str, dict]) -> tuple[float, float, float]:
    """Max half-width, height above baseline and depth below it, in head units."""
    half = up = down = 0.0
    for n, mirror in frames:
        m = metrics[n]
        a = load(n)[..., 3] > 8
        ys, xs = np.nonzero(a)
        hw = m['head_w']
        left = (m['seat_cx'] - xs.min()) / hw
        right = (xs.max() - m['seat_cx']) / hw
        half = max(half, left, right)
        up = max(up, (m['baseline'] - ys.min()) / hw)
        down = max(down, (ys.max() - m['baseline']) / hw)
    return half, up, down


def canvas_for(frames, metrics, head_px: float) -> tuple[tuple[int, int], float]:
    half, up, down = extents(frames, metrics)
    margin = 0.04
    w = int(np.ceil((half + margin) * 2 * head_px / 2) * 2)
    above = (up + margin) * head_px
    below = (down + margin) * head_px
    h = int(np.ceil(above + below))
    return (w, h), above


def export(metrics: dict[str, dict]) -> dict:
    EXPORT.mkdir(parents=True, exist_ok=True)
    for old in EXPORT.glob('*.webp'):
        old.unlink()
    frames = list(EXPORTS.values())
    manifest: dict = {'headWidthPt': HEAD_PT, 'frames': {}}
    # Size the canvas in whole points so every density is an exact multiple.
    (cw_pt, ch_pt), base_pt = canvas_for(frames, metrics, HEAD_PT)
    cw_pt += cw_pt % 2
    base_pt = float(np.ceil(base_pt))
    ch_pt = max(ch_pt, int(base_pt) + 4)
    manifest['canvasPt'] = [cw_pt, ch_pt]
    manifest['baselinePt'] = base_pt
    for s in SCALES:
        head_px = HEAD_PT * s
        canvas, base_y = (cw_pt * s, ch_pt * s), base_pt * s
        for out_name, (src, mirror) in EXPORTS.items():
            m = metrics[src]
            k = head_px / m['head_w']
            if k > 1.0:
                raise SystemExit(f'{out_name}@{s}x would be upscaled {k:.3f}x from the source; lower HEAD_PT')
            img = place(load(src), m, mirror, k, canvas, base_y)
            dst = EXPORT / f'{out_name}@{s}x.webp'
            q = 90
            while True:
                img.save(dst, 'WEBP', quality=q, method=6, exact=False)
                if s != 3 or dst.stat().st_size <= MAX_BYTES_3X or q <= 60:
                    break
                q -= 5
            manifest['frames'][out_name] = {'source': src, 'mirrored': mirror}
            print(f'{dst.name}: {canvas[0]}x{canvas[1]} {dst.stat().st_size // 1024} KB q{q}')
    (EXPORT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    return manifest


def contact_sheet(metrics: dict[str, dict]) -> None:
    """Every cut frame at the normalized scale on a mid-dark background."""
    names = [(n, False) for n in all_frames()]
    names += [(src, True) for out, (src, mirror) in EXPORTS.items() if mirror]
    head_px = HEAD_PT * 1.5  # sheet scale
    canvas, base_y = canvas_for(names, metrics, head_px)
    export_name = {(src, mirror): out for out, (src, mirror) in EXPORTS.items()}
    try:
        font = ImageFont.truetype('arial.ttf', 15)
        title_font = ImageFont.truetype('arialbd.ttf', 22)
    except OSError:
        font = title_font = ImageFont.load_default()
    label_h = 44
    cols = 6
    pad = 12
    cw, ch = canvas[0] + pad * 2, canvas[1] + label_h + pad
    rows = (len(names) + cols - 1) // cols
    header = 70
    sheet = Image.new('RGBA', (cols * cw, header + rows * ch), (52, 52, 60, 255))
    d = ImageDraw.Draw(sheet)
    d.text((pad, 16), 'Buddy frames: normalized head width, shared baseline (thin line), seat centre (tick)', font=title_font, fill=(235, 235, 245))
    d.text((pad, 44), 'Lavender labels = app assets (assets/onboarding/screen1/buddy). Grey = cut but not used in the app.', font=font, fill=(180, 180, 195))
    for i, (n, mirror) in enumerate(names):
        x = (i % cols) * cw + pad
        y = header + (i // cols) * ch
        m = metrics[n]
        k = head_px / m['head_w']
        img = place(load(n), m, mirror, k, canvas, base_y)
        sheet.alpha_composite(img, (x, y))
        d.line([(x, y + base_y), (x + canvas[0], y + base_y)], fill=(150, 150, 170, 255), width=1)
        d.line([(x + canvas[0] / 2, y + base_y), (x + canvas[0] / 2, y + base_y + 6)], fill=(150, 150, 170, 255), width=1)
        out = export_name.get((n, mirror))
        label = f'{out}@3x.webp' if out else (n + (' (mirrored)' if mirror else ''))
        d.text((x, y + canvas[1] + 6), label, font=font, fill=(196, 184, 255) if out else (165, 165, 175))
        if out:
            d.text((x, y + canvas[1] + 24), f'from {n}' + (' , mirrored' if mirror else ''), font=font, fill=(130, 130, 145))
    sheet.convert('RGB').save(SHEET_OUT)
    print('contact sheet', SHEET_OUT.relative_to(ROOT), sheet.size)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--qa', action='store_true')
    args = ap.parse_args()
    frames = all_frames()
    metrics = {n: measure(n, load(n)) for n in frames}
    resolve_head_widths(metrics)
    (WORK / 'metrics.json').write_text(json.dumps(metrics, indent=1))
    qa_overlay(frames, metrics)
    holes = interior_holes(frames)
    print('interior non-opaque px:', {n: v for n, v in holes.items() if v} or 'none')
    lost = lost_colour(frames)
    print('coloured source px not opaque:', {n: v for n, v in lost.items() if v} or 'none')
    if args.qa:
        return
    export(metrics)
    contact_sheet(metrics)


if __name__ == '__main__':
    main()
