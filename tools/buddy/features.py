"""Measure Buddy's face and detail features from colour regions.

Works on any cutout (reference or render) so both are measured identically.
Positions are returned in pixels; `normalise` converts them to head-width
units around the head centre.
"""

from __future__ import annotations

import cv2
import numpy as np

from regions import classify


def _components(m: np.ndarray, min_area: int):
    n, lab, stats, cents = cv2.connectedComponentsWithStats(m.astype(np.uint8))
    out = []
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= min_area:
            out.append({'mask': lab == i, 'area': int(stats[i, cv2.CC_STAT_AREA]), 'c': (float(cents[i][0]), float(cents[i][1])),
                        'bbox': tuple(int(v) for v in stats[i, :4])})
    return out


def _ellipse(m: np.ndarray) -> dict:
    cnts, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cnts, key=cv2.contourArea)
    if len(c) < 5:
        x, y, w, h = cv2.boundingRect(c)
        return {'cx': x + w / 2, 'cy': y + h / 2, 'rx': w / 2, 'ry': h / 2, 'rot': 0.0}
    (cx, cy), (a, b), ang = cv2.fitEllipse(c)
    return {'cx': cx, 'cy': cy, 'rx': a / 2, 'ry': b / 2, 'rot': float(np.radians(ang))}


def _filled(m: np.ndarray) -> np.ndarray:
    cnts, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    f = np.zeros(m.shape, np.uint8)
    cv2.drawContours(f, cnts, -1, 1, thickness=cv2.FILLED)
    return f > 0


def extract(rgba: np.ndarray) -> dict:
    regions = classify(rgba)
    total = int((rgba[..., 3] > 128).sum())
    min_feature = max(10, int(total * 0.0008))
    feats: dict = {'regions': {k: int(v.sum()) for k, v in regions.items()}}

    # Eyes: the two largest black blobs (filled, so highlights count as part of the eye).
    eyes = sorted(_components(regions['eye'], min_feature), key=lambda c: -c['area'])[:2]
    eyes = sorted(eyes, key=lambda c: c['c'][0])
    feats['eyes'] = []
    for e in eyes:
        filled = _filled(e['mask'])
        ell = _ellipse(filled)
        ell['r_equiv'] = float(np.sqrt(filled.sum() / np.pi))
        hl = sorted(_components(regions['white'] & filled, 3), key=lambda c: -c['area'])
        ell['highlights'] = [{'cx': h['c'][0], 'cy': h['c'][1], 'r': float(np.sqrt(h['area'] / np.pi))} for h in hl[:2]]
        feats['eyes'].append(ell)

    eye_y = np.mean([e['cy'] for e in feats['eyes']]) if feats['eyes'] else rgba.shape[0] * 0.4

    # Pink: inner ears sit above the eyes, blush below them, the tongue inside the mouth.
    mouth = regions['mouth']
    mouth_box = _filled(cv2.dilate(mouth.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0) if mouth.any() else np.zeros_like(mouth)
    pinks = _components(regions['pink'] & ~mouth_box, min_feature)
    ears = sorted([p for p in pinks if p['c'][1] < eye_y], key=lambda c: -c['area'])[:2]
    blush = sorted([p for p in pinks if p['c'][1] >= eye_y], key=lambda c: -c['area'])[:2]
    feats['innerEars'] = [_ellipse(p['mask']) | {'area': p['area']} for p in sorted(ears, key=lambda c: c['c'][0])]
    feats['blush'] = []
    for p in sorted(blush, key=lambda c: c['c'][0]):
        ys, xs = np.nonzero(p['mask'])
        feats['blush'].append({'cx': float(xs.mean()), 'cy': float(ys.mean()), 'r': float(np.sqrt(p['area'] / np.pi))})

    # Mouth: the dark interior plus the tongue inside it.
    if mouth.any():
        whole = mouth_box & (regions['mouth'] | regions['pink'])
        comps = sorted(_components(whole, min_feature), key=lambda c: -c['area'])
        if comps:
            m = comps[0]['mask']
            ys, xs = np.nonzero(m)
            tongue = m & regions['pink']
            feats['mouth'] = {
                'cx': float((xs.min() + xs.max()) / 2), 'top': float(ys.min()), 'bottom': float(ys.max()),
                'width': float(xs.max() - xs.min() + 1), 'height': float(ys.max() - ys.min() + 1),
                'area': int(m.sum()), 'tongueArea': int(tongue.sum()),
            }
            if tongue.any():
                feats['mouth']['tongue'] = _ellipse(tongue)

    # Pads: per foot, the largest blob is the heart, the small ones are toe beans.
    pads = _components(regions['pad'], 6)
    feats['pads'] = [{'cx': p['c'][0], 'cy': p['c'][1], 'area': p['area'], 'r': float(np.sqrt(p['area'] / np.pi))}
                     for p in sorted(pads, key=lambda c: -c['area'])]
    return feats


def normalise(feats: dict, head: dict) -> dict:
    """Convert pixel features to head-width units around the head centre."""
    w = 2 * head['rx']
    def pt(x, y):
        return [(x - head['cx']) / w, (y - head['cy']) / w]
    out = {'eyes': [], 'innerEars': [], 'blush': [], 'pads': []}
    for e in feats.get('eyes', []):
        out['eyes'].append({'c': pt(e['cx'], e['cy']), 'r': e['r_equiv'] / w, 'rx': e['rx'] / w, 'ry': e['ry'] / w, 'rot': e['rot'],
                            'highlights': [{'c': pt(h['cx'], h['cy']), 'r': h['r'] / w} for h in e['highlights']]})
    for e in feats.get('innerEars', []):
        out['innerEars'].append({'c': pt(e['cx'], e['cy']), 'rx': e['rx'] / w, 'ry': e['ry'] / w, 'rot': e['rot']})
    for b in feats.get('blush', []):
        out['blush'].append({'c': pt(b['cx'], b['cy']), 'r': b['r'] / w})
    if 'mouth' in feats:
        m = feats['mouth']
        out['mouth'] = {'c': pt(m['cx'], m['top']), 'width': m['width'] / w, 'height': m['height'] / w}
        if 'tongue' in m:
            t = m['tongue']
            out['mouth']['tongue'] = {'c': pt(t['cx'], t['cy']), 'rx': t['rx'] / w, 'ry': t['ry'] / w}
    for p in feats.get('pads', []):
        out['pads'].append({'c': pt(p['cx'], p['cy']), 'r': p['r'] / w})
    return out
