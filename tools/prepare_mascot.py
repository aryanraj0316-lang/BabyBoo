#!/usr/bin/env python
"""BabyBoo mascot asset pipeline.

Turns the single flat render (assets/mascot/buddy_source.png) into a 2.5D rig:
matte, separated parts with reconstructed hidden fur, face-feature sprites,
normal maps, rig.json, manifest.json, a generated asset module for the app,
and a QA contact sheet.

Usage (from the repo root):
    python tools/prepare_mascot.py            # full run
    python tools/prepare_mascot.py --scale 0.5

Layered artist art can replace any derived part: drop full-frame PNGs
(1254 x 1254, same framing as the source) into assets/mascot/artist/ named
after the part (head.png, arm_wave.png, eye_l.png, ...) or a pose
(pose_yawn.png, pose_cheer.png, pose_sleepy.png) and re-run. The manifest
marks those parts `source: "artist"` and the app picks them up through the
regenerated asset module, with no hand-written code changes.

Requires: numpy, opencv-python, pillow. `rembg` is optional (--rembg); the
default colour/edge matte works offline and suits the flat cream background.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import mascot_shapes as SH  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets/mascot/buddy_source.png'
OUT = ROOT / 'assets/mascot'
ARTIST = OUT / 'artist'
DOCS = ROOT / 'docs'
GEN_TS = ROOT / 'src/onboarding/hero/mascot/mascotAssets.generated.ts'
N = SH.SOURCE_SIZE
SHADOW_RGB = np.array([0.12, 0.03, 0.63], np.float32)  # chin shadow tint
SEEDS = {'ear_l': 1, 'ear_r': 2, 'torso': 3, 'arm_rest': 4, 'leg_l': 5, 'leg_r': 6, 'arm_wave': 7, 'head': 8}

# ---------------------------------------------------------------------------
# Colour helpers
# ---------------------------------------------------------------------------


def to_lab(rgb01):
    u8 = np.clip(rgb01 * 255 + 0.5, 0, 255).astype(np.uint8)
    lab = cv2.cvtColor(u8, cv2.COLOR_RGB2LAB).astype(np.float32)
    lab[..., 0] *= 100.0 / 255.0
    lab[..., 1:] -= 128.0
    return lab


def to_lab_f(rgb01):
    """Float-precision sRGB -> CIELAB (D65)."""
    c = np.clip(rgb01, 0, 1).astype(np.float64)
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124564, 0.3575761, 0.1804375],
                  [0.2126729, 0.7151522, 0.0721750],
                  [0.0193339, 0.1191920, 0.9503041]])
    xyz = lin @ M.T
    xyz /= np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    L = 116 * f[..., 1] - 16
    a = 500 * (f[..., 0] - f[..., 1])
    b = 200 * (f[..., 1] - f[..., 2])
    return np.stack([L, a, b], -1)


def lab_f_to_rgb(lab):
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    fy = (L + 16) / 116
    fx = fy + a / 500
    fz = fy - b / 200
    def finv(t):
        return np.where(t ** 3 > 0.008856, t ** 3, (t - 16 / 116) / 7.787)
    xyz = np.stack([finv(fx) * 0.95047, finv(fy), finv(fz) * 1.08883], -1)
    Minv = np.array([[3.2404542, -1.5371385, -0.4985314],
                     [-0.9692660, 1.8760108, 0.0415560],
                     [0.0556434, -0.2040259, 1.0572252]])
    lin = xyz @ Minv.T
    lin = np.clip(lin, 0, 1)
    return np.where(lin <= 0.0031308, lin * 12.92, 1.055 * lin ** (1 / 2.4) - 0.055)


def lum(rgb):
    return rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def masked_blur(img, mask, sigma):
    m = mask.astype(np.float32)
    if img.ndim == 3:
        num = cv2.GaussianBlur(img * m[..., None], (0, 0), sigma)
        den = cv2.GaussianBlur(m, (0, 0), sigma)[..., None]
    else:
        num = cv2.GaussianBlur(img * m, (0, 0), sigma)
        den = cv2.GaussianBlur(m, (0, 0), sigma)
    return num / np.maximum(den, 1e-6)


def smooth_noise(shape, sigma, seed):
    r = np.random.default_rng(seed).standard_normal(shape).astype(np.float32)
    r = cv2.GaussianBlur(r, (0, 0), sigma)
    return r / (r.std() + 1e-6)


# ---------------------------------------------------------------------------
# Masks
# ---------------------------------------------------------------------------


def signed_distance(mask):
    m = mask.astype(np.uint8)
    inside = cv2.distanceTransform(m, cv2.DIST_L2, 5)
    outside = cv2.distanceTransform(1 - m, cv2.DIST_L2, 5)
    return inside - outside


def soft_mask(mask, width=1.0, fuzz=0.0, seed=0):
    sd = signed_distance(mask)
    if fuzz > 0:
        sd = sd + fuzz * smooth_noise(mask.shape, 1.2, seed)
    return np.clip(0.5 + sd / (2 * width), 0, 1).astype(np.float32)


def poly_mask(points, smooth=True):
    pts = SH.catmull_rom_closed(points) if smooth else np.asarray(points, float)
    m = np.zeros((N, N), np.uint8)
    cv2.fillPoly(m, [np.round(pts * 4).astype(np.int32)], 1, lineType=cv2.LINE_8, shift=2)
    return m.astype(bool)


def ellipse_mask(center, radii, angle):
    m = np.zeros((N, N), np.uint8)
    cv2.ellipse(m, (tuple(int(round(c)) for c in center),
                    (int(round(radii[0] * 2)), int(round(radii[1] * 2))), angle), 1, -1)
    return m.astype(bool)


def circle_mask(center, r):
    yy, xx = np.mgrid[0:N, 0:N]
    return (xx - center[0]) ** 2 + (yy - center[1]) ** 2 <= r * r


def head_mask(rgb=None):
    """Head = fitted ellipse cut by the chin, with the boundary pulled in where
    it crosses the ears so it follows the real head/ear seam."""
    (cx, cy), (w, h), ang = SH.HEAD_ELLIPSE
    th = np.deg2rad(ang)
    ax, ay = w / 2, h / 2
    ts = np.linspace(0, 2 * np.pi, 1440, endpoint=False)
    ex = cx + ax * np.cos(ts) * np.cos(th) - ay * np.sin(ts) * np.sin(th)
    ey = cy + ax * np.cos(ts) * np.sin(th) + ay * np.sin(ts) * np.cos(th)
    pts = np.stack([ex, ey], 1)
    if rgb is not None:
        lab = cv2.cvtColor((np.clip(rgb, 0, 1) * 255).astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
        offs = np.zeros(len(ts))
        ear_zone = np.zeros(len(ts), bool)
        for (ec, er) in (SH.EAR_L, SH.EAR_R):
            ear_zone |= (ex - ec[0]) ** 2 + (ey - ec[1]) ** 2 < (er + 4) ** 2
        for i in np.nonzero(ear_zone)[0]:
            nrm = np.array([cx - ex[i], cy - ey[i]])
            nrm /= np.linalg.norm(nrm)
            for s_ in np.arange(-6, 18, 0.5):
                q = pts[i] + nrm * s_
                ok = True
                for k in (0, 1.5, 3.0):
                    qq = pts[i] + nrm * (s_ + k)
                    if lab[int(qq[1]), int(qq[0]), 1] > 160:  # ear pink / rim
                        ok = False
                        break
                if ok:
                    offs[i] = s_ + 0.5
                    break
        # smooth offsets along the contour
        offs = np.convolve(np.r_[offs[-15:], offs, offs[:15]], np.ones(15) / 15, 'same')[15:-15]
        for i in range(len(ts)):
            nrm = np.array([cx - ex[i], cy - ey[i]])
            nrm /= np.linalg.norm(nrm)
            pts[i] = pts[i] + nrm * offs[i]
    m = np.zeros((N, N), np.uint8)
    cv2.fillPoly(m, [np.round(pts * 4).astype(np.int32)], 1, shift=2)
    yy, xx = np.mgrid[0:N, 0:N]
    return m.astype(bool) & (yy <= SH.chin_y(xx))


def bbox(mask, pad=6):
    ys, xs = np.nonzero(mask)
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, N)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, N)
    return int(x0), int(y0), int(x1), int(y1)


# ---------------------------------------------------------------------------
# Step 1: matte
# ---------------------------------------------------------------------------


def compute_matte(rgb, use_rembg=False):
    lab = to_lab(rgb)
    border = np.concatenate([lab[:24].reshape(-1, 3), lab[-24:].reshape(-1, 3),
                             lab[:, :24].reshape(-1, 3), lab[:, -24:].reshape(-1, 3)])
    bg_lab = np.median(border, 0)
    bg_rgb = np.median(np.concatenate([rgb[:24].reshape(-1, 3), rgb[-24:].reshape(-1, 3)]), 0)
    chroma = np.sqrt((lab[..., 1] - bg_lab[1]) ** 2 + (lab[..., 2] - bg_lab[2]) ** 2)
    # Near the floor the baked contact shadow is purple-tinted; demand much
    # stronger chroma there so the matte stops at the fur, not the shadow.
    yy = np.mgrid[0:rgb.shape[0], 0:rgb.shape[1]][0].astype(np.float32)
    floor = smoothstep(1095.0, 1135.0, yy)
    hard = chroma > (14 + 24 * floor)
    # Background = low-chroma pixels connected to the border; anything enclosed
    # (eye highlights, white glints) is foreground.
    low = (~hard).astype(np.uint8)
    # Erode first so thin pale seams inside the bear (ear/head junction) do not
    # connect to the background, then grow back within the low-chroma area.
    low_e = cv2.erode(low, np.ones((5, 5), np.uint8))
    n, lbl = cv2.connectedComponents(low_e, connectivity=4)
    border_labels = set(np.unique(np.concatenate([lbl[0], lbl[-1], lbl[:, 0], lbl[:, -1]])))
    bg = np.isin(lbl, [l for l in border_labels if l != 0]) & (low_e == 1)
    bg = (cv2.dilate(bg.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0) & (low == 1)
    fg_solid = ~bg
    alpha = np.clip((chroma - (5.0 + 26 * floor)) / ((24.0 + 34 * floor) - (5.0 + 26 * floor)), 0, 1)
    alpha = (alpha * alpha * (3 - 2 * alpha)).astype(np.float32)
    inside = cv2.distanceTransform(fg_solid.astype(np.uint8), cv2.DIST_L2, 5)
    outside = cv2.distanceTransform((~fg_solid).astype(np.uint8), cv2.DIST_L2, 5)
    alpha[inside > 3.0] = 1.0
    alpha[(outside > 8.0)] = 0.0
    alpha[(floor > 0.5) & ~fg_solid] = 0.0
    if use_rembg:
        try:
            from rembg import remove  # type: ignore
            rb = np.asarray(remove(Image.fromarray((rgb * 255).astype(np.uint8)))).astype(np.float32)[..., 3] / 255
            alpha = np.minimum(np.maximum(alpha, rb * (inside > 0)), 1)
        except Exception as e:  # pragma: no cover
            print('rembg unavailable, using colour matte:', e)
    # Decontaminate edge colours (remove the cream fringe).
    a3 = np.maximum(alpha, 1e-3)[..., None]
    fg = (rgb - (1 - alpha[..., None]) * bg_rgb) / a3
    fg = np.where(alpha[..., None] > 0.02, np.clip(fg, 0, 1), rgb)
    # Very thin alpha: blend toward interior colour to avoid noisy fringe.
    interior = masked_blur(rgb, alpha > 0.95, 3.0)
    t = smoothstep(0.02, 0.35, alpha)[..., None]
    fg = fg * t + interior * (1 - t)
    return alpha, fg.astype(np.float32), bg_rgb


# ---------------------------------------------------------------------------
# Step 3: hidden-fur reconstruction
# ---------------------------------------------------------------------------


def fur_detail_tile(fg, known, size=160, seed=0):
    """High-frequency fur texture from the largest clean patch of `known`."""
    dist = cv2.distanceTransform(known.astype(np.uint8), cv2.DIST_L2, 5)
    y, x = np.unravel_index(np.argmax(dist), dist.shape)
    half = int(max(16, min(size // 2, dist[y, x] * 0.7)))
    patch = fg[y - half:y + half, x - half:x + half]
    hf = patch - cv2.GaussianBlur(patch, (0, 0), 2.2)
    return hf


def tile_detail(hf, shape, seed):
    th, tw = hf.shape[:2]
    big = np.concatenate([hf, hf[:, ::-1]], 1)
    big = np.concatenate([big, big[::-1]], 0)
    ry, rx = np.random.default_rng(seed).integers(0, [th, tw])
    reps = (shape[0] // big.shape[0] + 2, shape[1] // big.shape[1] + 2, 1)
    tiled = np.tile(big, reps)[ry:ry + shape[0], rx:rx + shape[1]]
    return tiled


def reconstruct(fg, known, target, donor_known=None, seed=0, region=None):
    """Fill `target` pixels from `known` neighbours (Telea low frequency plus
    synthesised fur detail). Returns a new colour image."""
    if not target.any():
        return fg.copy()
    x0, y0, x1, y1 = region or bbox(target | known, pad=24)
    sub = fg[y0:y1, x0:x1]
    k = known[y0:y1, x0:x1]
    tgt = target[y0:y1, x0:x1]
    lf = masked_blur(sub, k, 3.0)
    hole = (~k).astype(np.uint8)
    u8 = np.clip(lf * 255 + 0.5, 0, 255).astype(np.uint8)
    filled = cv2.inpaint(u8, hole, 9, cv2.INPAINT_TELEA).astype(np.float32) / 255
    filled = cv2.GaussianBlur(filled, (0, 0), 1.5) * hole[..., None] + lf * (1 - hole[..., None])
    hf_src = fur_detail_tile(fg, donor_known if donor_known is not None else known, seed=seed)
    detail = tile_detail(hf_src, sub.shape[:2], seed)
    # Match detail strength to the visible fur near the hole.
    near = cv2.dilate(hole, np.ones((25, 25), np.uint8)).astype(bool) & k
    vis_hf = sub - cv2.GaussianBlur(sub, (0, 0), 2.2)
    gain = (vis_hf[near].std() / (detail.std() + 1e-6)) if near.any() else 1.0
    synth = np.clip(filled + detail * gain, 0, 1)
    out = fg.copy()
    o = out[y0:y1, x0:x1]
    o[tgt] = synth[tgt]
    out[y0:y1, x0:x1] = o
    return out


# ---------------------------------------------------------------------------
# Feature extraction helpers
# ---------------------------------------------------------------------------


def solve_foreground(orig, base, alpha):
    a = np.maximum(alpha, 1e-3)[..., None]
    f = (orig - (1 - alpha[..., None]) * base) / a
    return np.clip(f, 0, 1)


def feature_alpha(orig, base, core, ring, edge_lum):
    lb, lo = lum(base), lum(orig)
    a_l = np.clip((lb - lo) / np.maximum(lb - edge_lum, 1e-3), 0, 1)
    lab_o, lab_b = to_lab(orig), to_lab(base)
    dc = np.sqrt(((lab_o[..., 1:] - lab_b[..., 1:]) ** 2).sum(-1))
    a_c = np.clip(dc / 40.0, 0, 1)
    a = np.maximum(a_l, a_c) * ring
    a = np.maximum(a, core.astype(np.float32))
    return cv2.GaussianBlur(a, (0, 0), 0.6)


def fit_eye(gray, hint):
    dark = (gray < 0.24).astype(np.uint8)
    n, lbl, st, cen = cv2.connectedComponentsWithStats(dark)
    best = min(range(1, n), key=lambda i: (cen[i][0] - hint[0]) ** 2 + (cen[i][1] - hint[1]) ** 2)
    comp = (lbl == best).astype(np.uint8)
    comp = cv2.morphologyEx(comp, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    cnts, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    (cx, cy), (w, h), ang = cv2.fitEllipse(max(cnts, key=cv2.contourArea))
    return (cx, cy), (w / 2, h / 2), ang


def mouth_mask_from(rgb, box):
    """Mouth = dark interior component plus the pink tongue touching it."""
    x0, y0, x1, y1 = box
    sub = rgb[y0:y1, x0:x1]
    lab = to_lab(sub)
    l = lab[..., 0]
    fur_l = np.median(l[:8])
    dark = (l < fur_l - 22).astype(np.uint8)
    dark = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lbl, st, _ = cv2.connectedComponentsWithStats(dark)
    big = 1 + int(np.argmax(st[1:, 4]))
    comp = (lbl == big)
    ys, xs = np.nonzero(comp)
    bx0, bx1, by0, by1 = xs.min() - 4, xs.max() + 4, ys.min() - 4, ys.max() + 40
    near = np.zeros_like(comp)
    near[max(by0, 0):by1, max(bx0, 0):bx1] = True
    tongue = near & (lab[..., 1] > 38) & (l < fur_l + 8)
    m = (comp | tongue).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    n, lbl, st, _ = cv2.connectedComponentsWithStats(m)
    big = 1 + int(np.argmax(st[1:, 4]))
    comp = (lbl == big).astype(np.uint8)
    cnts, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    filled = np.zeros_like(comp)
    cv2.drawContours(filled, cnts, -1, 1, -1)
    full = np.zeros(rgb.shape[:2], bool)
    full[y0:y1, x0:x1] = filled.astype(bool)
    return full


# ---------------------------------------------------------------------------
# Normal maps
# ---------------------------------------------------------------------------


def dome_height(mask, strength=0.55, profile=1.0):
    d = cv2.distanceTransform(mask.astype(np.uint8), cv2.DIST_L2, 5)
    r = max(d.max(), 1.0)
    t = np.clip(d / r, 0, 1)
    h = np.sqrt(np.clip(1 - (1 - t) ** 2, 0, 1)) ** profile
    return h * r * strength


def height_to_normal(h, mask, blur=3.0):
    h = cv2.GaussianBlur(h.astype(np.float32), (0, 0), blur)
    gx = cv2.Sobel(h, cv2.CV_32F, 1, 0, ksize=3) / 8.0
    gy = cv2.Sobel(h, cv2.CV_32F, 0, 1, ksize=3) / 8.0
    n = np.dstack([-gx, -gy, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    n[~mask] = (0, 0, 1)
    return n.astype(np.float32)


# ---------------------------------------------------------------------------
# I/O
# ---------------------------------------------------------------------------


def save_rgba(path, rgb, alpha, crop, scale):
    x0, y0, x1, y1 = crop
    c = rgb[y0:y1, x0:x1]
    a = alpha[y0:y1, x0:x1]
    if scale != 1.0:
        w = max(1, int(round((x1 - x0) * scale)))
        h = max(1, int(round((y1 - y0) * scale)))
        pre = cv2.resize(c * a[..., None], (w, h), interpolation=cv2.INTER_AREA)
        a = cv2.resize(a, (w, h), interpolation=cv2.INTER_AREA)
        c = pre / np.maximum(a[..., None], 1e-4)
    out = np.dstack([np.clip(c, 0, 1), np.clip(a, 0, 1)])
    Image.fromarray((out * 255 + 0.5).astype(np.uint8), 'RGBA').save(path, optimize=True)


def save_normal(path, n, alpha, crop, scale):
    x0, y0, x1, y1 = crop
    nn = n[y0:y1, x0:x1]
    a = alpha[y0:y1, x0:x1]
    if scale != 1.0:
        w = max(1, int(round((x1 - x0) * scale)))
        h = max(1, int(round((y1 - y0) * scale)))
        nn = cv2.resize(nn, (w, h), interpolation=cv2.INTER_AREA)
        nn /= np.linalg.norm(nn, axis=2, keepdims=True) + 1e-6
        a = cv2.resize(a, (w, h), interpolation=cv2.INTER_AREA)
    enc = np.dstack([nn * 0.5 + 0.5, (a > 0.003).astype(np.float32)])
    Image.fromarray((np.clip(enc, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA').save(path, optimize=True)


def load_artist(name):
    p = ARTIST / f'{name}.png'
    if not p.exists():
        return None
    im = np.asarray(Image.open(p).convert('RGBA')).astype(np.float32) / 255
    if im.shape[:2] != (N, N):
        im = cv2.resize(im, (N, N), interpolation=cv2.INTER_AREA)
    a = im[..., 3]
    c = im[..., :3]
    return c, a


# ---------------------------------------------------------------------------
# Mouth model (vector shapes shared with the app)
# ---------------------------------------------------------------------------


MOUTH_PTS = 48


def resample_closed(pts, n):
    pts = np.asarray(pts, float)
    seg = np.linalg.norm(np.diff(np.vstack([pts, pts[:1]]), axis=0), axis=1)
    cum = np.r_[0, np.cumsum(seg)]
    t = np.linspace(0, cum[-1], n, endpoint=False)
    out = []
    closed = np.vstack([pts, pts[:1]])
    for ti in t:
        i = min(np.searchsorted(cum, ti, side='right') - 1, len(pts) - 1)
        f = (ti - cum[i]) / max(seg[i], 1e-9)
        out.append(closed[i] * (1 - f) + closed[i + 1] * f)
    return np.array(out)


def fit_mouth_model(mmask, src):
    """Contour-based mouth model: the real outline resampled to MOUTH_PTS
    points, clockwise from the left corner, plus a fitted tongue ellipse."""
    cnts, _ = cv2.findContours(mmask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cnts, key=cv2.contourArea)[:, 0, :].astype(float)
    c = cv2.GaussianBlur(c.reshape(-1, 1, 2), (1, 9), 0).reshape(-1, 2) if len(c) > 20 else c
    # Image coords: y down. cv2 contours are clockwise on screen already;
    # start at the left-most point (left corner region, upper part).
    xs = c[:, 0]
    left_ids = np.nonzero(xs < xs.min() + 3)[0]
    start = left_ids[np.argmin(c[left_ids, 1])]
    c = np.roll(c, -start, axis=0)
    if np.cross(c[len(c) // 8] - c[0], c[len(c) // 4] - c[0]) < 0:
        c = c[::-1]
        c = np.roll(c, 1, axis=0)
    smile = resample_closed(c, MOUTH_PTS)
    # Tongue: fit to the top boundary of the pink region inside the mouth.
    lab = to_lab(src)
    tongue = mmask & (lab[..., 1] > 38) & (lab[..., 0] > 55)
    tongue = cv2.morphologyEx(tongue.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)).astype(bool)
    ty, tx = np.nonzero(tongue)
    cols = np.unique(tx)
    tops = np.array([[x, ty[tx == x].min()] for x in cols if (tx == x).sum() > 3], float)
    cx = float(tops[:, 0].mean())
    # parabola y = top + k (x - cx)^2
    A_ = np.c_[np.ones(len(tops)), (tops[:, 0] - cx) ** 2]
    top, k = np.linalg.lstsq(A_, tops[:, 1], rcond=None)[0]
    half_w = (tops[:, 0].max() - tops[:, 0].min()) / 2
    rx = float(max(half_w * 1.05, 20))
    ry = float(np.clip(2 * k * rx * rx, rx * 0.5, rx * 1.1))
    tongue_model = {'c': [cx, float(top + ry)], 'r': [rx, ry]}
    return smile, tongue_model


def derive_mouth_shapes(smile, tongue):
    """Morph targets with the same point order as `smile`."""
    sm = np.asarray(smile)
    xs, ys = sm[:, 0], sm[:, 1]
    cx = (xs.min() + xs.max()) / 2
    top, bot = ys.min(), ys.max()
    w, h = xs.max() - xs.min(), bot - top
    # parameter around the outline from the centroid, used to map onto an O
    cen = sm.mean(0)
    ang = np.arctan2(sm[:, 1] - cen[1], sm[:, 0] - cen[0])

    def corner_weight(p):
        return np.clip(np.abs(p[:, 0] - cx) / (w / 2), 0, 1) ** 2

    # Softer smile: corners 8% of mouth height lower, opening 18% smaller.
    soft = sm.copy()
    soft[:, 1] = top + (soft[:, 1] - top) * 0.82
    soft[:, 1] += h * 0.08 * corner_weight(sm)
    soft[:, 0] = cx + (soft[:, 0] - cx) * 0.95
    # Small content smile (sleepy).
    small = sm.copy()
    small[:, 0] = cx + (small[:, 0] - cx) * 0.62
    small[:, 1] = top + (small[:, 1] - top) * 0.42 + h * 0.10
    # Rounded O (yawn): 56% of the smile width, taller than wide.
    orx, ory = w * 0.28, h * 0.58
    ocy = top + h * 0.55
    o = np.stack([cx + orx * np.cos(ang), ocy + ory * np.sin(ang)], 1)
    tc, tr = np.array(tongue['c']), np.array(tongue['r'])
    tongues = {
        'smile': {'c': tc.tolist(), 'r': tr.tolist()},
        'soft': {'c': [float(tc[0]), float(top + (tc[1] - top) * 0.82)], 'r': (tr * [0.95, 0.82]).tolist()},
        'small': {'c': [float(cx), float(top + (tc[1] - top) * 0.42 + h * 0.10)], 'r': (tr * [0.6, 0.42]).tolist()},
        'o': {'c': [float(cx), float(ocy + ory * 0.85)], 'r': [float(orx * 0.85), float(ory * 0.55)]},
    }
    shapes = {k: [[round(float(x), 2), round(float(y), 2)] for x, y in v]
              for k, v in (('smile', sm), ('soft', soft), ('small', small), ('o', o))}
    return shapes, tongues


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--scale', type=float, default=0.5, help='runtime texture scale')
    ap.add_argument('--rembg', action='store_true')
    ap.add_argument('--no-sheet', action='store_true')
    args = ap.parse_args()
    scale = args.scale

    src = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32) / 255
    assert src.shape[:2] == (N, N), 'expected 1254 x 1254 source'
    print('matte...')
    m_alpha, fg, bg_rgb = compute_matte(src, args.rembg)
    save_rgba(OUT / 'buddy_rgba.png', fg, m_alpha, (0, 0, N, N), 1.0)
    # Half-size static fallback for the app.
    save_rgba(OUT / 'buddy_static.png', fg, m_alpha, (0, 0, N, N), 0.4)

    # ---- full-extent part masks ------------------------------------------
    F = {
        'head': head_mask(src),
        'ear_l': circle_mask(*SH.EAR_L),
        'ear_r': circle_mask(*SH.EAR_R),
        'arm_wave': poly_mask(SH.ARM_WAVE),
        'arm_rest': poly_mask(SH.ARM_REST),
        'torso': poly_mask(SH.TORSO),
        'leg_l': ellipse_mask(*SH.LEG_L),
        'leg_r': ellipse_mask(*SH.LEG_R),
    }
    front_region = poly_mask(SH.ARM_WAVE_FRONT, smooth=False)
    F['arm_wave_front'] = F['arm_wave'] & front_region
    # Restrict the torso to the matte where it is the visible outer edge.
    soft_w = {k: 1.0 for k in F}
    fuzz = {'head': 0.8, 'ear_l': 0.8, 'ear_r': 0.8}
    A = {}
    for i, (name, m) in enumerate(F.items()):
        A[name] = soft_mask(m, soft_w[name], fuzz.get(name, 0.0), seed=i) * m_alpha
    # Where the arm joins the shoulder (torso behind it) use a wide feather so
    # the junction blends into the body when the arm swings.
    wide = soft_mask(F['arm_wave'], 7.0)
    junction = cv2.dilate(F['torso'].astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool) & ~F['head']
    jw = cv2.GaussianBlur(junction.astype(np.float32), (0, 0), 4.0)
    A['arm_wave'] = (soft_mask(F['arm_wave'], 1.0) * (1 - jw) + np.minimum(wide, soft_mask(F['arm_wave'], 1.0)) * jw) * m_alpha
    # The front copy of the arm uses a soft cut so the seam over the arm is invisible.
    A['arm_wave_front'] = A['arm_wave'] * cv2.GaussianBlur(front_region.astype(np.float32), (0, 0), 2.0)

    def cover(names):
        c = np.zeros((N, N), np.float32)
        for nm in names:
            c = 1 - (1 - c) * (1 - A[nm])
        return c

    # Movers in front of each part (parts whose motion can reveal it).
    movers = {
        'ear_l': ['head'], 'ear_r': ['head'],
        'torso': ['arm_wave', 'head'], 'arm_rest': ['head'],
        'leg_l': [], 'leg_r': [],
        'arm_wave': ['head'], 'head': ['arm_wave_front'],
    }
    head_known = (A['head'] > 0.5) & (cover(['arm_wave_front']) < 0.5)
    forehead = head_known & (np.mgrid[0:N, 0:N][0] < 470) & (np.mgrid[0:N, 0:N][0] > 300)

    colors = {}
    sources = {}
    yy_, xx_ = np.mgrid[0:N, 0:N]

    # Chin shadow: the head casts a soft shadow on the arm, shoulder and torso.
    # Split it into a head-attached layer so it moves with the head instead
    # of staying baked into the parts below.
    d_head = cv2.distanceTransform((~F['head']).astype(np.uint8), cv2.DIST_L2, 5)
    body_below = (m_alpha > 0.5) & (yy_ > 640) & ~F['arm_wave_front']
    band = body_below & (d_head > 0) & (d_head < 30)
    ref = body_below & (d_head >= 30) & (d_head < 70)
    x0, y0, x1, y1 = bbox(band | ref, 8)
    sub = fg[y0:y1, x0:x1]
    lf_ref = masked_blur(sub, ref[y0:y1, x0:x1], 4.0)
    hole = (~ref[y0:y1, x0:x1]).astype(np.uint8)
    lf_fill = cv2.inpaint((np.clip(lf_ref, 0, 1) * 255).astype(np.uint8), hole, 12,
                          cv2.INPAINT_TELEA).astype(np.float32) / 255
    lf_fill = cv2.GaussianBlur(lf_fill, (0, 0), 4.0)
    lf_band = masked_blur(sub, band[y0:y1, x0:x1] | ref[y0:y1, x0:x1], 2.5)
    # The shadow is a blue-violet tint (blue barely drops), so model it as a
    # coloured layer: O = U (1 - a) + SHADOW_RGB a.
    pb = SHADOW_RGB - lf_fill
    a_s = np.clip(((lf_band - lf_fill) * pb).sum(-1) / np.maximum((pb * pb).sum(-1), 1e-4), 0, 0.85)
    a_s = np.where(band[y0:y1, x0:x1], a_s, 0.0)
    a_s = cv2.GaussianBlur(a_s, (0, 0), 1.5).astype(np.float32)
    shadow_a = np.zeros((N, N), np.float32)
    shadow_a[y0:y1, x0:x1] = a_s * band[y0:y1, x0:x1]
    fg_u = fg.copy()
    au = shadow_a[y0:y1, x0:x1][..., None]
    fg_u[y0:y1, x0:x1] = np.clip((sub - au * SHADOW_RGB) / np.maximum(1 - au, 0.15), 0, 1)
    print(f'chin shadow: max opacity {shadow_a.max():.2f}')

    def rotational_fill(img, known, target, center):
        out = img.copy()
        ys, xs = np.nonzero(target)
        dx, dy = xs - center[0], ys - center[1]
        todo = np.ones(len(xs), bool)
        for k in range(1, 180):
            for sgn in (1, -1):
                a = np.deg2rad(k * sgn)
                qx = np.round(center[0] + dx * np.cos(a) - dy * np.sin(a)).astype(int)
                qy = np.round(center[1] + dx * np.sin(a) + dy * np.cos(a)).astype(int)
                ok = todo & (qx >= 0) & (qx < N) & (qy >= 0) & (qy < N)
                ok[ok] = known[qy[ok], qx[ok]]
                out[ys[ok], xs[ok]] = img[qy[ok], qx[ok]]
                todo &= ~ok
            if not todo.any():
                break
        if todo.any():
            out[ys[todo], xs[todo]] = masked_blur(img, known, 6)[ys[todo], xs[todo]]
        return out

    def mirror_fill(img, known, target):
        """Each hidden pixel copies its mirror image across the nearest known
        pixel (like BORDER_REFLECT along an arbitrary edge): colour and fur
        texture stay continuous at the seam."""
        from scipy import ndimage
        _, (iy, ix) = ndimage.distance_transform_edt(~known, return_indices=True)
        ys, xs = np.nonzero(target)
        qy, qx = iy[ys, xs], ix[ys, xs]
        my, mx = 2 * qy - ys, 2 * qx - xs
        ok = (my >= 0) & (my < N) & (mx >= 0) & (mx < N)
        ok[ok] = known[my[ok], mx[ok]]
        out = img.copy()
        out[ys[ok], xs[ok]] = img[my[ok], mx[ok]]
        out[ys[~ok], xs[~ok]] = img[qy[~ok], qx[~ok]]
        return out

    for name in ['ear_l', 'ear_r', 'torso', 'arm_rest', 'leg_l', 'leg_r', 'arm_wave', 'head']:
        art = load_artist(name)
        if art is not None:
            colors[name], A[name] = art
            sources[name] = 'artist'
            continue
        sources[name] = 'derived'
        cov = cover(movers[name])
        if name == 'arm_wave':
            cov = cov * (1 - cv2.GaussianBlur(front_region.astype(np.float32), (0, 0), 2.0))
        target = F[name] & (cov > 0.995)
        known = (A[name] > 0.5) & (cov < 0.5)
        print(f'reconstruct {name}: {int(target.sum())} px hidden')
        base = fg_u if name in ('torso', 'arm_rest', 'arm_wave') else fg
        if name in ('ear_l', 'ear_r'):
            clean = known & (A[name] > 0.98) & (cv2.distanceTransform((cov < 0.02).astype(np.uint8), cv2.DIST_L2, 5) > 8)
            fillm = F[name] & ~clean
            col = mirror_fill(base, clean, fillm)
            # Deeper hidden fur (never revealed by small twitches) is smoothed.
            dk = cv2.distanceTransform((~clean).astype(np.uint8), cv2.DIST_L2, 5)
            wdeep = np.clip((dk - 8) / 10, 0, 1)[..., None]
            col = col * (1 - wdeep) + masked_blur(col, F[name], 4.0) * wdeep
            col = np.where(fillm[..., None], cv2.GaussianBlur(col, (0, 0), 1.0) * 0.6 + col * 0.4, col)
            colors[name] = np.where(fillm[..., None], col, base)
        else:
            donor = forehead if name == 'head' else known
            colors[name] = reconstruct(base, known, target, donor_known=donor, seed=SEEDS[name])
        if name in ('arm_wave', 'head', 'ear_l', 'ear_r', 'torso'):
            A[name] = np.maximum(A[name], soft_mask(F[name], 1.0, fuzz.get(name, 0.0)) * (cov > 0.5))
    colors['arm_wave_front'] = colors['arm_wave']
    sources['arm_wave_front'] = sources['arm_wave']

    # ---- face features ---------------------------------------------------
    # Layer order at runtime: face_base -> cheeks -> mouth -> eyes -> highlights.
    # Each layer is solved against the composite of the layers beneath it so
    # the neutral pose reproduces the source.
    print('face features...')
    T0 = colors['head'].copy()
    gray = lum(src)
    eyes = {}
    for side, hint in (('l', SH.EYE_L_HINT), ('r', SH.EYE_R_HINT)):
        (cx, cy), (rx, ry), ang = fit_eye(gray, hint)
        eyes[side] = {'c': [float(cx), float(cy)], 'r': [float(rx), float(ry)], 'ang': float(ang)}
    face_known = head_known.copy()
    eye_regions = {}
    for side, e in eyes.items():
        outer = ellipse_mask(e['c'], (e['r'][0] + 25, e['r'][1] + 25), e['ang'])
        core = ellipse_mask(e['c'], (e['r'][0] - 2, e['r'][1] - 2), e['ang'])
        inner = ellipse_mask(e['c'], (e['r'][0] + 21, e['r'][1] + 21), e['ang'])
        eye_regions[side] = (outer, core, inner)
        face_known &= ~outer
    mmask = mouth_mask_from(src, SH.MOUTH_BOX)
    m_outer = cv2.dilate(mmask.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (45, 45))).astype(bool)
    m_inner = cv2.dilate(mmask.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (37, 37))).astype(bool)
    m_core = cv2.erode(mmask.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    face_known &= ~m_outer
    # Cheeks: fit the blush as a smooth gaussian on top of a smooth fur colour
    # field (quadratic), using only visible fur. The blush is removed first so
    # eye/mouth reconstruction never drags pink into the face base.
    cheeks = {}
    head_F = F['head']
    lab_src_f = to_lab_f(src).astype(np.float32)
    no_feat = ~m_outer & ~eye_regions['l'][0] & ~eye_regions['r'][0]
    delta_total = np.zeros((N, N, 3), np.float32)
    yy, xx = np.mgrid[0:N, 0:N]
    for side, (cc, cr) in (('l', SH.CHEEK_L), ('r', SH.CHEEK_R)):
        win = circle_mask(cc, cr + 70)
        valid = win & head_known & no_feat & (A['head'] > 0.99)
        valid &= cv2.erode(head_known.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
        x0, y0, x1, y1 = bbox(win, 2)
        lab_lf = cv2.GaussianBlur(lab_src_f[y0:y1, x0:x1], (0, 0), 4.0)
        vv = valid[y0:y1, x0:x1]
        ys, xs = np.nonzero(vv)
        ys, xs = ys[::3], xs[::3]
        Y = lab_lf[ys, xs]
        u = (xs + x0 - cc[0]) / 100.0
        v = (ys + y0 - cc[1]) / 100.0
        P = np.stack([np.ones_like(u), u, v, u * u, u * v, v * v], 1)
        best = None
        for ox in range(-30, 31, 6):
            for oy in range(-30, 31, 6):
                for sx in (34, 42, 50, 58, 66, 76):
                    for sy in (30, 38, 46, 54, 62, 72):
                        g = np.exp(-0.5 * (((xs + x0 - cc[0] - ox) / sx) ** 2 + ((ys + y0 - cc[1] - oy) / sy) ** 2))
                        M = np.c_[P, g]
                        coef, *_ = np.linalg.lstsq(M, Y, rcond=None)
                        r = float(((M @ coef - Y) ** 2).sum())
                        if best is None or r < best[0]:
                            best = (r, ox, oy, sx, sy, coef)
        _, ox, oy, sx, sy, coef = best
        # Refine: a free-form radial profile g(rho) shared by all three Lab
        # channels (blush = one opacity field times one colour shift), fitted
        # by alternating least squares together with the quadratic fur field.
        knots = np.arange(0, 3.61, 0.3)
        def tents(rho):
            Bm = np.zeros(rho.shape + (len(knots),), np.float32)
            for k_, kn in enumerate(knots):
                Bm[..., k_] = np.clip(1 - np.abs(rho - kn) / 0.3, 0, 1)
            return Bm[..., :-1]  # zero at the outer knot
        rho_s = np.sqrt(((xs + x0 - cc[0] - ox) / sx) ** 2 + ((ys + y0 - cc[1] - oy) / sy) ** 2)
        Tb = tents(rho_s)
        w_ = np.exp(-0.5 * knots[:-1] ** 2)  # start from the gaussian
        K = coef[6].copy()
        for _ in range(8):
            g_s = Tb @ w_
            M = np.c_[P, g_s]
            cf, *_ = np.linalg.lstsq(M, Y, rcond=None)
            K = cf[6]
            R = Y - P @ cf[:6]  # residual to explain with g * K
            # least squares for w_: R[:, c] ~ (Tb @ w_) * K[c]
            Ms = np.vstack([Tb * K[c_] for c_ in range(3)])
            ys_ = np.concatenate([R[:, c_] for c_ in range(3)])
            w_, *_ = np.linalg.lstsq(Ms, ys_, rcond=None)
            w_ = np.clip(w_, 0, None)
            sc = w_.max()
            w_ /= sc
            K *= sc
        print(f'cheek {side}: centre offset ({ox},{oy}) sigma ({sx},{sy}) dLab {np.round(K, 1)} profile {np.round(w_, 2)}')
        rho_full = np.sqrt(((xx - cc[0] - ox) / sx) ** 2 + ((yy - cc[1] - oy) / sy) ** 2)
        g_full = np.interp(rho_full, knots, np.r_[w_, 0.0], right=0.0).astype(np.float32)
        g_full = cv2.GaussianBlur(g_full, (0, 0), 2.0) * head_F
        delta_total += g_full[..., None] * K[None, None, :].astype(np.float32)
        cheeks[side] = {'g': g_full, 'c': [float(cc[0] + ox), float(cc[1] + oy)],
                        'r': float(max(sx, sy) * 2.2), 'sigma': [float(sx), float(sy)], 'dLab': [float(k) for k in K]}
    T0d = np.where(head_F[..., None], lab_f_to_rgb(to_lab_f(T0) - delta_total), T0).astype(np.float32)
    # The part of the head hidden under the paw was reconstructed with blush in
    # it; rebuild it from the deblushed face so it is not over-corrected.
    notch = head_F & ~head_known
    hk = cv2.erode(head_known.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    T0d = reconstruct(T0d, hk, notch | (head_F & ~hk & (cv2.dilate(notch.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0)),
                      donor_known=forehead, seed=21)
    a_cheek = np.zeros((N, N), np.float32)
    c_cheek = np.zeros((N, N, 3), np.float32)
    alpha_peak = 1.0  # the source blush saturates red; anything lower clips
    for side in ('l', 'r'):
        a_side = (cheeks[side]['g'] * alpha_peak).astype(np.float32)
        solved = np.clip((T0 - (1 - a_side[..., None]) * T0d) / np.maximum(a_side[..., None], 1e-3), 0, 1)
        sel = (a_side > 0.2) & head_known & no_feat
        pink = np.median(solved[sel], 0).astype(np.float32)
        a_side = np.where(a_side > 0.004, a_side, 0).astype(np.float32) * (A['head'] > 0.01)
        cheeks[side]['alpha'] = a_side
        # Per-pixel colour where the fur is visible (exact), smooth pink elsewhere.
        vis_c = head_known & no_feat & (a_side > 0.01)
        vis_soft = cv2.GaussianBlur(vis_c.astype(np.float32), (0, 0), 3.0)[..., None]
        rgb = solved * vis_soft + pink * (1 - vis_soft)
        rgb = np.where(vis_c[..., None], solved, rgb).astype(np.float32)
        cheeks[side]['rgb'] = rgb
        cheeks[side]['color'] = pink
        a_cheek = np.maximum(a_cheek, a_side)
        c_cheek = np.where((a_side > 0)[..., None], rgb, c_cheek)

    feat_target = (eye_regions['l'][0] | eye_regions['r'][0] | m_outer)
    base_inp_d = reconstruct(T0d, face_known, feat_target, donor_known=forehead, seed=11)
    # Feature-free face as it looks with the blush on top (what eyes/mouth sit on).
    base_inp = base_inp_d * (1 - a_cheek[..., None]) + c_cheek * a_cheek[..., None]

    def split_feature(inner, outer, core, edge_lum):
        w = soft_mask(inner, 1.5)[..., None]
        base_final = src * (1 - w) + base_inp * w
        a = feature_alpha(src, base_final, core, soft_mask(outer, 2.0), edge_lum=edge_lum)
        diff = np.abs(src - base_final).max(-1)
        a = np.maximum(a, np.clip(diff / 0.55, 0, 1)) * (soft_mask(outer, 1.5))
        a = np.maximum(a, core.astype(np.float32))
        fgc = solve_foreground(src, base_final, a)
        return base_final, a.astype(np.float32), fgc

    T = T0.copy()
    eye_sprites = {}
    for side, e in eyes.items():
        outer, core, inner = eye_regions[side]
        base_final, a, fgc = split_feature(inner, outer, core, 0.10)
        T = np.where(outer[..., None], base_final, T)
        g = lum(src)
        med = cv2.medianBlur((g * 255).astype(np.uint8), 99).astype(np.float32) / 255
        hl = core & (((g - med) > 0.07) | (g > 0.33))
        hl = cv2.dilate(hl.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool) & core
        x0, y0, x1, y1 = bbox(outer, 4)
        u8 = (np.clip(fgc[y0:y1, x0:x1], 0, 1) * 255).astype(np.uint8)
        ball = fgc.copy()
        ball[y0:y1, x0:x1] = cv2.inpaint(u8, hl[y0:y1, x0:x1].astype(np.uint8), 7, cv2.INPAINT_TELEA).astype(np.float32) / 255
        ball[y0:y1, x0:x1] = np.where(hl[y0:y1, x0:x1, None],
                                      cv2.GaussianBlur(ball[y0:y1, x0:x1], (0, 0), 2.0), ball[y0:y1, x0:x1])
        ah = np.clip(((fgc - ball) / np.maximum(1 - ball, 1e-3)).mean(-1), 0, 1) * hl
        ah = cv2.GaussianBlur(ah, (0, 0), 0.5)
        # Split into a static socket halo (glow + shading, stays with the face)
        # and the eyeball (moves with gaze, clipped by lids). The halo's inner
        # area is filled with continued socket shading so a moving or closing
        # eyeball never reveals bare fur.
        sd = signed_distance(ellipse_mask(e['c'], e['r'], e['ang']))
        # Eyeball keeps the dark rim and its blue glow (up to ~8 px outside).
        wb = np.clip(0.5 + (sd + 8.0) / 3.0, 0, 1).astype(np.float32)
        ball_a = a * wb
        halo_a = np.where(ball_a < 0.995, a * (1 - wb) / np.maximum(1 - ball_a, 1e-3), 0).astype(np.float32)
        # Fill the halo's centre smoothly from the soft socket shading further out.
        src_ring = (sd < -9.0) & (sd > -18.0)
        pm = fgc * halo_a[..., None]
        fill_c = masked_blur(pm, src_ring, 10.0)
        fill_a = masked_blur(halo_a, src_ring, 10.0)
        wi = np.clip(0.5 + (sd + 9.0) / 3.0, 0, 1)[..., None]
        pm = pm * (1 - wi) + fill_c * wi
        ha_full = (halo_a * (1 - wi[..., 0]) + fill_a * wi[..., 0]).astype(np.float32)
        halo_rgb = np.clip(pm / np.maximum(ha_full[..., None], 1e-4), 0, 1)
        eye_sprites[side] = {'ball': ball, 'alpha': ball_a.astype(np.float32), 'hl_alpha': ah, 'outer': outer,
                             'core': core, 'halo_rgb': halo_rgb, 'halo_a': ha_full.astype(np.float32)}
        e['highlights'] = []
        n_, lbl_, st_, cen_ = cv2.connectedComponentsWithStats((ah > 0.2).astype(np.uint8))
        for i in range(1, n_):
            if st_[i, 4] > 6:
                e['highlights'].append([float(cen_[i][0]), float(cen_[i][1]), float(np.sqrt(st_[i, 4] / np.pi))])

    base_final, m_alpha_f, mouth_rgb = split_feature(m_inner, m_outer, m_core, 0.12)
    T = np.where(m_outer[..., None], base_final, T)
    smile, tongue_model = fit_mouth_model(mmask, src)
    mouth_shapes, mouth_tongues = derive_mouth_shapes(smile, tongue_model)
    ml = (float(smile[:, 0].min()), 0); mr = (float(smile[:, 0].max()), 0)
    mt = (0, float(smile[:, 1].min())); mb = (0, float(smile[:, 1].max()))
    lab_src = to_lab(src)
    interior = mmask & (lab_src[..., 1] < 30)
    tongue = mmask & (lab_src[..., 1] >= 30) & (lab_src[..., 0] > 55)

    def mean_hex(m):
        c = np.median(src[m], 0) if m.any() else np.array([0.3, 0.1, 0.4])
        return '#%02x%02x%02x' % tuple(int(v * 255 + 0.5) for v in c)
    ty, tx = np.nonzero(tongue)
    mouth_colors = {
        'interiorTop': mean_hex(interior & (yy_ < mt[1] + 18) & ~tongue),
        'interiorBottom': mean_hex(interior & (yy_ >= mt[1] + 35) & ~tongue),
        'tongue': mean_hex(tongue & (yy_ > ty.mean())),
        'tongueLight': mean_hex(tongue & (yy_ <= ty.mean())),
        'rim': mean_hex(m_outer & ~mmask & (lum(src) < np.median(lum(src[head_known])) - 0.05)),
    }

    # face_base so that face_base (+) cheeks == T everywhere on the head.
    # Outside the eye/mouth zones the face base is simply the deblushed fur;
    # inside them it is solved so face (+) cheeks reproduces T.
    face = np.clip((T - a_cheek[..., None] * c_cheek) / np.maximum(1 - a_cheek[..., None], 0.1), 0, 1)
    wf = smoothstep(0.75, 0.95, a_cheek)[..., None]
    face = face * (1 - wf) + base_inp_d * wf
    feat_zone = soft_mask(feat_target, 2.0)[..., None]
    face = base_inp_d * (1 - feat_zone) + face * feat_zone
    head_rgb = np.where(head_F[..., None], face, T)

    colors['face_base'] = head_rgb
    colors['head'] = head_rgb
    fb = SH.FACE_BASE
    A['face_base'] = (soft_mask(ellipse_mask(fb[0], fb[1], 0), fb[2]) * (A['head'] > 0.99)).astype(np.float32)

    # ---- normal maps -----------------------------------------------------
    print('normals...')
    L_src = lum(src)
    normals = {}
    for name in ['ear_l', 'ear_r', 'torso', 'arm_rest', 'leg_l', 'leg_r', 'arm_wave', 'head']:
        m = A[name] > 0.5
        h = dome_height(m, strength=0.55 if name == 'head' else 0.45)
        h += cv2.GaussianBlur(L_src, (0, 0), 22) * 18.0 * m
        normals[name] = height_to_normal(h, m, blur=4.0)
    normals['arm_wave_front'] = normals['arm_wave']
    normals['face_base'] = normals['head']
    for side, e in eyes.items():
        m = eye_sprites[side]['outer']
        h = dome_height(ellipse_mask(e['c'], e['r'], e['ang']), strength=0.8)
        normals[f'eye_{side}'] = height_to_normal(h, m, blur=2.0)

    # ---- write textures ---------------------------------------------------
    print('writing textures...')
    parts_meta = {}

    def emit(name, rgb, alpha, normal, z, pivot, max_rot, polygon=None):
        crop = bbox(alpha > 0.003, 4)
        save_rgba(OUT / f'{name}.png', rgb, alpha, crop, scale)
        if normal is not None:
            save_normal(OUT / f'{name}_n.png', normal, alpha, crop, scale)
        if polygon is None:
            cnts, _ = cv2.findContours((alpha > 0.15).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            c = max(cnts, key=cv2.contourArea)
            hull = cv2.approxPolyDP(c, 3.0, True)[:, 0, :]
            polygon = hull.tolist()
        parts_meta[name] = {
            'file': f'{name}.png',
            'normal': f'{name}_n.png' if normal is not None else None,
            'rect': [crop[0], crop[1], crop[2] - crop[0], crop[3] - crop[1]],
            'pivot': list(pivot),
            'z': z,
            'maxRotationDeg': max_rot,
            'polygon': polygon,
            'source': sources.get(name, 'derived'),
        }

    for z, name in enumerate(SH.Z_ORDER):
        pv = SH.PIVOTS.get(name, SH.PIVOTS.get('arm_wave'))
        emit(name, colors[name], A[name], normals[name], z, pv, SH.MAX_ROT.get(name, 0))
    emit('face_base', colors['face_base'], A['face_base'], normals['face_base'], 7.5,
         SH.PIVOTS['face_base'], 0)
    for side, e in eyes.items():
        es = eye_sprites[side]
        art = load_artist(f'eye_{side}')
        if art is not None:
            es['ball'], es['alpha'] = art
            sources[f'eye_{side}'] = 'artist'
        emit(f'eye_halo_{side}', es['halo_rgb'], es['halo_a'], None, 7.59, e['c'], 0)
        emit(f'eye_{side}', es['ball'], es['alpha'], normals[f'eye_{side}'], 7.6, e['c'], 0)
        white = np.ones((N, N, 3), np.float32)
        emit(f'highlight_{side}', white, es['hl_alpha'], None, 7.7, e['c'], 0)
    for side, ch in cheeks.items():
        emit(f'cheek_{side}', ch['rgb'], ch['alpha'], None, 7.55, ch['c'], 0)
    emit('mouth', mouth_rgb, m_alpha_f, None, 7.58, SH.PIVOTS['mouth'], 0)
    emit('chin_shadow', np.broadcast_to(SHADOW_RGB, (N, N, 3)).astype(np.float32), shadow_a, None, 6.5, SH.PIVOTS['head'], 0)
    # eyes_open: both eyes with highlights, for the manifest / contact sheet.
    eo_rgb = src.copy()
    eo_a = np.maximum(eye_sprites['l']['alpha'], eye_sprites['r']['alpha'])
    emit('eyes_open', eo_rgb, eo_a, None, 7.6, SH.PIVOTS['eyes'], 0)

    # Optional extra poses from the artist folder.
    poses = {}
    for pose in ('pose_yawn', 'pose_cheer', 'pose_sleepy'):
        art = load_artist(pose)
        if art is not None:
            emit(pose, art[0], art[1], None, 7.9, SH.PIVOTS['head'], 0)
            poses[pose] = parts_meta[pose]['file']
            sources[pose] = 'artist'

    # Eyelid colour: fur just above each eye.
    lid = {}
    for side, e in eyes.items():
        band = ellipse_mask((e['c'][0], e['c'][1] - e['r'][1] - 14), (e['r'][0] * 0.8, 8), 0) & head_known
        lid[side] = '#%02x%02x%02x' % tuple(int(v * 255 + 0.5) for v in np.median(src[band], 0))
    fur_mid = '#%02x%02x%02x' % tuple(int(v * 255 + 0.5) for v in np.median(src[head_known], 0))

    rig = {
        'version': 1,
        'sourceSize': N,
        'textureScale': scale,
        'zOrder': SH.Z_ORDER,
        'parts': parts_meta,
        'eyes': eyes,
        'mouth': {
            'shapes': mouth_shapes,
            'tongue': mouth_tongues,
            'colors': mouth_colors,
            'bbox': [float(ml[0]), float(mt[1]), float(mr[0] - ml[0]), float(mb[1] - mt[1])],
        },
        'cheeks': {s: {'c': c['c'], 'r': c['r']} for s, c in cheeks.items()},
        'eyelid': {'colorL': lid['l'], 'colorR': lid['r'], 'fur': fur_mid},
        'head': {'ellipse': [SH.HEAD_ELLIPSE[0][0], SH.HEAD_ELLIPSE[0][1],
                             SH.HEAD_ELLIPSE[1][0] / 2, SH.HEAD_ELLIPSE[1][1] / 2, SH.HEAD_ELLIPSE[2]]},
        'seat': list(SH.PIVOTS['torso']),
        'silhouetteBounds': list(bbox(m_alpha > 0.15, 0)),
        'poses': poses,
    }
    (OUT / 'rig.json').write_text(json.dumps(rig, indent=1))

    manifest = {
        'version': 1,
        'generatedFrom': 'assets/mascot/buddy_source.png',
        'textureScale': scale,
        'parts': {k: {'file': v['file'], 'normal': v['normal'], 'source': v['source']}
                  for k, v in parts_meta.items()},
        'optionalPoses': {p: (p in poses) for p in ('pose_yawn', 'pose_cheer', 'pose_sleepy')},
        'artistFolder': 'assets/mascot/artist/',
    }
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=1))
    write_generated_ts(parts_meta, poses)

    # ---- QA: reassembly diff + contact sheet --------------------------------
    if not args.no_sheet:
        import mascot_contact_sheet as CS  # noqa: E402
        CS.build(src, rig, OUT, DOCS, bg_rgb)
    total = sum(os.path.getsize(OUT / f) for f in os.listdir(OUT) if f.endswith('.png') and f not in ('buddy_source.png', 'buddy_rgba.png'))
    print(f'done. runtime textures on disk: {total / 1e6:.2f} MB')


def write_generated_ts(parts_meta, poses):
    lines = [
        '// AUTO-GENERATED by tools/prepare_mascot.py. Do not edit by hand.',
        '// Re-run the pipeline after adding artist art to assets/mascot/artist/.',
        '/* eslint-disable */',
        '',
        'export const MASCOT_TEXTURES = {',
    ]
    for name, meta in parts_meta.items():
        lines.append(f"  {json.dumps(name)}: require('../../../../assets/mascot/{meta['file']}'),")
    lines.append('} as const;')
    lines.append('')
    lines.append('export const MASCOT_NORMALS = {')
    for name, meta in parts_meta.items():
        if meta['normal']:
            lines.append(f"  {json.dumps(name)}: require('../../../../assets/mascot/{meta['normal']}'),")
    lines.append('} as const;')
    lines.append('')
    lines.append("export const MASCOT_STATIC = require('../../../../assets/mascot/buddy_static.png');")
    lines.append('')
    lines.append('export const MASCOT_SOURCES: Record<string, "derived" | "artist"> = ' +
                 json.dumps({k: v['source'] for k, v in parts_meta.items()}) + ';')
    lines.append('')
    GEN_TS.parent.mkdir(parents=True, exist_ok=True)
    GEN_TS.write_text('\n'.join(lines))


if __name__ == '__main__':
    main()
