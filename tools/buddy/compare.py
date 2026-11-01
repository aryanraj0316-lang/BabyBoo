"""Side-by-side and 50% overlay of a render against its reference.

    python tools/buddy/compare.py <reference matte name> <render png> <out png> [title]

Rows: page background (#F6F3FF) and #1A1A1E. Columns: reference, render,
50% overlay (render over reference).
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
MATTE = ROOT / 'design/buddy/_work/matte'
BACKGROUNDS = [((0xF6, 0xF3, 0xFF), 'page #F6F3FF'), ((0x1A, 0x1A, 0x1E), '#1A1A1E')]


def compose(ref: Image.Image, render: Image.Image, title: str) -> Image.Image:
    w, h = ref.size
    try:
        font = ImageFont.truetype('arial.ttf', 16)
    except OSError:
        font = ImageFont.load_default()
    pad, top = 12, 30
    out = Image.new('RGB', (pad + 3 * (w + pad), top + len(BACKGROUNDS) * (h + pad) + 24), (60, 60, 68))
    d = ImageDraw.Draw(out)
    d.text((pad, 6), title, font=font, fill=(240, 240, 245))
    for row, (bg, label) in enumerate(BACKGROUNDS):
        y = top + row * (h + pad)
        overlay = render.copy()
        overlay.putalpha(Image.eval(render.getchannel('A'), lambda a: a // 2))
        for col, (img, name) in enumerate([(ref, 'reference'), (render, 'render'), (None, '50% overlay')]):
            tile = Image.new('RGBA', (w, h), bg + (255,))
            if img is None:
                tile.alpha_composite(ref)
                tile.alpha_composite(overlay)
            else:
                tile.alpha_composite(img)
            x = pad + col * (w + pad)
            out.paste(tile.convert('RGB'), (x, y))
            d.text((x + 6, y + 6), f'{name} / {label}', font=font, fill=(120, 120, 130) if row == 0 else (200, 200, 210))
    return out


def main() -> None:
    ref_name, render_path, out_path = sys.argv[1:4]
    title = sys.argv[4] if len(sys.argv) > 4 else ''
    ref = Image.open(MATTE / f'{ref_name}.png').convert('RGBA')
    render = Image.open(render_path).convert('RGBA')
    compose(ref, render, title).save(out_path)


if __name__ == '__main__':
    main()
