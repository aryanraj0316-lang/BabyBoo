"""Bake Buddy's fur grain into a small seamless tiling texture.

Takes a clean, evenly lit fur patch from the master render, keeps only the
fine grain (lightness divided by a blurred copy, so the lighting is removed),
and makes it tile seamlessly. The shader samples it as its detail layer, so
the plush grain matches the references without computing noise per frame.

    python tools/buddy/bake_fur.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from features import extract  # noqa: E402
from regions import lab  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
MATTE = ROOT / 'design/buddy/_work/matte/master.png'
OUT_PNG = ROOT / 'assets/onboarding/screen1/buddy/fur.png'
OUT_META = ROOT / 'design/buddy/_work/fit/fur.json'
SIZE = 160  # texture size in master pixels
LOW_CUT = 4  # cycles per tile removed as lighting, not grain
MARGIN = 25


def tileable(img: np.ndarray) -> np.ndarray:
    """Periodic component of the periodic-plus-smooth decomposition (Moisan 2011).

    Removes only the smooth part that makes opposite edges disagree, so the
    texture tiles seamlessly with no blending seams.
    """
    h, w = img.shape
    v = np.zeros_like(img, dtype=np.float64)
    v[0, :] += img[-1, :] - img[0, :]
    v[-1, :] += img[0, :] - img[-1, :]
    v[:, 0] += img[:, -1] - img[:, 0]
    v[:, -1] += img[:, 0] - img[:, -1]
    q = np.arange(h).reshape(-1, 1)
    r = np.arange(w).reshape(1, -1)
    denom = 2 * np.cos(2 * np.pi * q / h) + 2 * np.cos(2 * np.pi * r / w) - 4
    denom[0, 0] = 1
    s = np.fft.fft2(v) / denom
    s[0, 0] = 0
    return img - np.real(np.fft.ifft2(s))


def main() -> None:
    rgba = np.array(Image.open(MATTE).convert('RGBA'))
    feats = extract(rgba)
    eyes = feats['eyes']
    spacing = abs(eyes[1]['cx'] - eyes[0]['cx'])
    mid_x = (eyes[0]['cx'] + eyes[1]['cx']) / 2
    top_y = min(e['cy'] for e in eyes)
    # Forehead: search above and between the eyes for a window that is entirely clean
    # fur (no eyes, ears, outline or background), preferring the most evenly lit one.
    from regions import classify
    # Clean fur at least MARGIN px away from anything else (eye rims glow into the fur).
    fur = cv2.erode(classify(rgba)['fur'].astype(np.uint8), np.ones((2 * MARGIN + 1, 2 * MARGIN + 1), np.uint8)) > 0
    L = lab(rgba[..., :3])[..., 0]
    best = None
    half = SIZE // 2
    for cy in range(int(top_y - spacing * 0.9), int(top_y - spacing * 0.15), 8):
        for cx in range(int(mid_x - spacing * 0.3), int(mid_x + spacing * 0.3), 8):
            y0, x0 = cy - half, cx - half
            if y0 < 0 or x0 < 0:
                continue
            win = fur[y0:y0 + SIZE, x0:x0 + SIZE]
            if win.shape != (SIZE, SIZE) or win.mean() < 0.999:
                continue
            lit = cv2.GaussianBlur(L[y0:y0 + SIZE, x0:x0 + SIZE], (0, 0), 20)
            score = lit.std()
            if best is None or score < best[0]:
                best = (score, cx, cy)
    if best is None:
        raise SystemExit('no clean fur window found on the forehead')
    _, cx, cy = best
    patch = lab(rgba[cy - SIZE // 2: cy + SIZE // 2, cx - SIZE // 2: cx + SIZE // 2, :3])[..., 0]
    grain = patch / cv2.GaussianBlur(patch, (0, 0), 10)
    grain = tileable(grain)
    # Keep only the fine grain: drop the lowest frequencies (leftover lighting and the
    # decomposition's soft corrections). Done in the frequency domain, so it tiles perfectly.
    F = np.fft.fft2(grain)
    fy = np.fft.fftfreq(SIZE) * SIZE
    fx = np.fft.fftfreq(SIZE) * SIZE
    F[np.hypot(*np.meshgrid(fx, fy)) < LOW_CUT] = 0
    grain = np.real(np.fft.ifft2(F))
    grain = (grain - grain.mean()) / (grain.std() * 6) + 0.5  # mid-grey with +-3 sigma in range
    OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(grain * 255, 0, 255).astype(np.uint8), 'L').convert('RGB').save(OUT_PNG)
    # Head width of the master in pixels (from the eye spacing and the front ratio), so the
    # app can scale the texture to match the reference grain at any display size.
    head_px = spacing / 0.463
    OUT_META.parent.mkdir(parents=True, exist_ok=True)
    OUT_META.write_text(json.dumps({'texturePx': SIZE, 'headWidthPx': head_px, 'patchCentre': [cx, cy]}, indent=1))
    print('fur texture', OUT_PNG.relative_to(ROOT), 'covers', round(SIZE / head_px, 3), 'head widths')


if __name__ == '__main__':
    main()
