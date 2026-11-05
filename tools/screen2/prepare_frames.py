"""Checkpoint A: normalize existing/generated raster art; never edits app code.

Reuses Screen 1's head-distance/seat/baseline measurement and premultiplied
resampling, without running that pipeline's export() or modifying Screen 1.
"""
from pathlib import Path
import hashlib
import json
import shutil
import sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools/buddy'))
from normalize import measure, place, HEAD_WIDTH_PER_DIAMETER

OUT = ROOT / 'design/screen2/checkpoint_a'
EXPORT = ROOT / 'assets/onboarding/screen2/buddy'
CANVAS = (160, 159)
BASELINE = 155
HEAD = 106
ROWS = [
    ('greeting', '1. Greeting', 'Reused approved Screen 1 wave'),
    ('name_attentive', '2. Name entry', 'Clasped paws / head bowed'),
    ('age_ready', '3. Age selection', 'Blank cream card / attentive'),
    ('age_proud', '4. Age confirmed', 'Blank card / viewer-facing'),
    ('colour_badge', '5. Colour selected', 'Blank disk / paw touches edge'),
    ('friend_complete', '6. Friend Card complete', 'Larger blank card / delighted'),
]


def font(size):
    return ImageFont.truetype('C:/Windows/Fonts/arial.ttf', size)


def main():
    EXPORT.mkdir(parents=True, exist_ok=True)
    report = {'canvasPt': list(CANVAS), 'headWidthPt': HEAD, 'baselinePt': BASELINE,
              'status': 'checkpoint-A candidates; not approved or integrated', 'frames': {}}
    for key, title, caption in ROWS:
        if key == 'greeting':
            source = ROOT / 'assets/onboarding/screen1/buddy/buddy_wave@3x.webp'
            scale = 1
            metrics = {'baseline': BASELINE * 3, 'head_w': HEAD * 3, 'seat_cx': 240}
        else:
            source = OUT / f'generated/buddy_{key}-original.png'
            rgba = np.array(Image.open(source).convert('RGBA'))
            metrics = measure(key, rgba)
            metrics['head_w'] = 2 * metrics['head_r'] * HEAD_WIDTH_PER_DIAMETER
            scale = HEAD * 3 / metrics['head_w']
            if scale > 1:
                raise ValueError(f'{key}: would upscale source')
        entry = {'source': source.relative_to(ROOT).as_posix(), 'exports': [],
                 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                 'measurements': metrics, 'scaleTo3x': scale}
        for density in (2, 3):
            dst = EXPORT / f'buddy_{key}@{density}x.webp'
            if key == 'greeting':
                shutil.copyfile(ROOT / f'assets/onboarding/screen1/buddy/buddy_wave@{density}x.webp', dst)
            else:
                # Scaling/placement only. Preserve native alpha; no paint,
                # relighting, warping, face changes or per-body-part edits.
                result = place(rgba, metrics, False, HEAD * density / metrics['head_w'],
                               (CANVAS[0] * density, CANVAS[1] * density), BASELINE * density)
                result.save(dst, 'WEBP', quality=90, method=6)
            im = Image.open(dst).convert('RGBA')
            arr = np.array(im)
            alpha = arr[..., 3]
            bounds = im.getchannel('A').getbbox()
            # Blank cream props can later take native UI text/colour. Bounds
            # are measured in shared canvas points, never used to draw Buddy.
            rgb = arr[..., :3].astype('int16')
            cream = (rgb[..., 0] > 215) & (rgb[..., 1] > 200) & (rgb[..., 2] > 155) & \
                    (rgb[..., 0] > rgb[..., 2] + 5) & (alpha > 245)
            count, labels, stats, _ = cv2.connectedComponentsWithStats(cream.astype('uint8'))
            prop = None
            if key not in ('greeting', 'name_attentive') and count > 1:
                x, y, w, h, area = stats[1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])]
                prop = [round(float(v) / density, 2) for v in (x, y, w, h)]
            visible_bounds = Image.fromarray((alpha > 8).astype('uint8') * 255).getbbox()
            item = {'path': dst.relative_to(ROOT).as_posix(), 'size': list(im.size),
                    'bytes': dst.stat().st_size, 'alphaBounds': list(bounds),
                    'visibleAlphaBounds': list(visible_bounds),
                    'zeroAlphaPixels': int((alpha == 0).sum()),
                    'partialAlphaPixels': int(((alpha > 0) & (alpha < 255)).sum()),
                    'blankPropBoundsPt': prop}
            if min(visible_bounds[:2]) <= 0 or visible_bounds[2] >= im.width or visible_bounds[3] >= im.height:
                item['edgeWarning'] = 'visible alpha touches canvas edge; inspect for clipping'
            entry['exports'].append(item)
        report['frames'][key] = entry

    (EXPORT / 'manifest.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    for theme, bg, ink in [('light', '#F6F3FF', '#292333'), ('dark', '#1A1A1E', '#F6F3FF')]:
        board = Image.new('RGB', (1200, 1110), bg)
        draw = ImageDraw.Draw(board)
        master = Image.open(ROOT / 'design/buddy/buddy_master.png').convert('RGB')
        master.thumbnail((132, 132), Image.Resampling.LANCZOS)
        board.paste(master, (20, 12))
        draw.text((175, 18), 'SCREEN 2 / CHECKPOINT A', font=font(29), fill=ink)
        draw.text((175, 60), 'Six candidate stills / master at left / no app integration', font=font(20), fill=ink)
        draw.text((175, 94), 'Common 160 x 159 pt canvas / 155 pt baseline / blank props', font=font(18), fill=ink)
        for i, (key, title, caption) in enumerate(ROWS):
            x = (i % 3) * 400
            y = 158 + (i // 3) * 450
            draw.text((x + 20, y), title, font=font(24), fill=ink)
            im = Image.open(EXPORT / f'buddy_{key}@3x.webp').convert('RGBA')
            im = im.convert('RGBa').resize((320, 318), Image.Resampling.LANCZOS).convert('RGBA')
            cell = Image.new('RGBA', im.size, bg)
            cell.alpha_composite(im)
            board.paste(cell.convert('RGB'), (x + 40, y + 45))
            line_y = y + 45 + BASELINE * 2
            draw.line((x + 25, line_y, x + 375, line_y), fill='#797582', width=1)
            draw.line((x + 200, line_y - 4, x + 200, line_y + 4), fill='#797582', width=1)
            draw.text((x + 20, y + 372), f'buddy_{key}@3x.webp', font=font(17), fill=ink)
            draw.text((x + 20, y + 400), caption, font=font(17), fill=ink)
        draw.text((20, 1067), '2x + 3x transparent WebP / 1 reused + 5 generated / awaiting likeness approval', font=font(20), fill=ink)
        board.save(OUT / f'contact_sheet_{theme}.png')
    print(json.dumps({k: v['exports'][-1] for k, v in report['frames'].items()}, indent=2))


if __name__ == '__main__':
    main()
