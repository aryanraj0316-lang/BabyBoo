"""Cut every Buddy frame out of its sheet with BiRefNet (via rembg).

Writes full-resolution RGBA cutouts to design/buddy/_work/matte/<frame>.png.
Run with the dev venv:  tools/.venv/Scripts/python tools/buddy/matte.py
Frames already cut are skipped unless --force is given.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from detect import LAYOUT, SHEETS, colour_mask, detect_frames  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
SHEET_DIR = ROOT / 'design/buddy'
OUT = SHEET_DIR / '_work/matte'
PAD = 48  # px of context around each detected box
MODEL = 'birefnet-general'


def keep_own_frame(alpha: np.ndarray, core: tuple[int, int, int, int]) -> np.ndarray:
    """Drop alpha islands that belong to a neighbouring frame."""
    x0, y0, x1, y1 = core
    n, lab, stats, cents = cv2.connectedComponentsWithStats((alpha > 8).astype(np.uint8))
    keep = np.zeros(alpha.shape, bool)
    for i in range(1, n):
        cx, cy = cents[i]
        if x0 <= cx <= x1 and y0 <= cy <= y1:
            keep |= lab == i
    keep = cv2.dilate(keep.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    return np.where(keep, alpha, 0).astype(np.uint8)


def remove_floor_shadow(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Grey floor shadow is not fur: zero alpha on grey pixels outside Buddy's silhouette.

    The silhouette is the fur-coloured area with its holes filled, so white
    eye highlights and other enclosed details keep their alpha.
    """
    fur = colour_mask(rgb)
    fur = cv2.morphologyEx(fur, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    contours, _ = cv2.findContours(fur, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filled = np.zeros_like(fur)
    cv2.drawContours(filled, contours, -1, 1, thickness=cv2.FILLED)
    near_fur = cv2.dilate(filled, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    return np.where(near_fur > 0, alpha, 0).astype(np.uint8)


def decontaminate(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Remove the white paper mixed into semi-transparent edge pixels.

    Observed C = a*F + (1-a)*W with W = white, so F = (C - (1-a)*W) / a.
    Where alpha is too low for that to be stable, use the nearest solid fur
    colour instead, so faint edges stay lavender rather than turning grey.
    """
    a = alpha.astype(np.float32) / 255.0
    c = rgb.astype(np.float32)
    with np.errstate(divide='ignore', invalid='ignore'):
        f = (c - (1.0 - a[..., None]) * 255.0) / np.maximum(a[..., None], 1e-3)
    f = np.clip(f, 0, 255)

    # Nearest-solid-colour fill: inpaint everything that is not clearly opaque.
    solid = (a > 0.92).astype(np.uint8)
    if solid.sum() == 0:
        return rgb
    fill = cv2.inpaint(rgb, (1 - solid) * 255, 6, cv2.INPAINT_TELEA).astype(np.float32)

    w = np.clip((a - 0.2) / 0.5, 0, 1)[..., None]  # 0 below a=.2, 1 above a=.7
    out = w * f + (1 - w) * fill
    out = np.where(a[..., None] > 0.92, c, out)
    return np.clip(out, 0, 255).astype(np.uint8)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--only', nargs='*', help='frame names to (re)cut')
    args = ap.parse_args()

    from rembg import new_session, remove  # dev-only dependency

    session = None
    OUT.mkdir(parents=True, exist_ok=True)
    for sheet, names in SHEETS.items():
        rgb_full = np.array(Image.open(SHEET_DIR / f'{sheet}.png').convert('RGB'))
        h, w = rgb_full.shape[:2]
        boxes = detect_frames(rgb_full, LAYOUT[sheet])
        for name, (x0, y0, x1, y1) in zip(names, boxes):
            if name is None:
                continue
            if args.only and name not in args.only:
                continue
            dst = OUT / f'{name}.png'
            if dst.exists() and not args.force:
                continue
            cx0, cy0 = max(0, x0 - PAD), max(0, y0 - PAD)
            cx1, cy1 = min(w, x1 + PAD), min(h, y1 + PAD)
            crop = rgb_full[cy0:cy1, cx0:cx1]
            if session is None:
                session = new_session(MODEL)
            mask = remove(Image.fromarray(crop), session=session, only_mask=True, post_process_mask=False)
            alpha = np.array(mask.convert('L'))
            alpha = keep_own_frame(alpha, (x0 - cx0, y0 - cy0, x1 - cx0, y1 - cy0))
            alpha = remove_floor_shadow(crop, alpha)
            colour = decontaminate(crop, alpha)
            Image.fromarray(np.dstack([colour, alpha])).save(dst)
            print('cut', name, crop.shape[1], 'x', crop.shape[0], flush=True)


if __name__ == '__main__':
    main()
