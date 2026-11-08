"""One-candidate comparison; no app assets overwritten or character edits."""
from pathlib import Path
import sys
import json
import hashlib
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools/buddy'))
from normalize import measure, place, HEAD_WIDTH_PER_DIAMETER

OUT = ROOT / 'design/screen2/name_frame_v2'
ASSETS = ROOT / 'assets/onboarding/screen2/buddy'
source = ROOT / 'design/buddy/generated/buddy_screen2_name_attentive_v2-original.png'
rgba = np.array(Image.open(source).convert('RGBA'))
metrics = measure('name_v2', rgba)
metrics['head_w'] = 2 * metrics['head_r'] * HEAD_WIDTH_PER_DIAMETER
report = {'original': source.relative_to(ROOT).as_posix(),
          'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'status': 'single preview candidate, not approved or integrated',
          'canvasPt': [160, 159], 'baselinePt': 155, 'headWidthPt': 106, 'exports': []}
for density in (2, 3):
    scale = 106 * density / metrics['head_w']
    assert scale <= 1, 'Do not enlarge generated source'
    result = place(rgba, metrics, False, scale, (160 * density, 159 * density), 155 * density)
    path = OUT / f'buddy_name_attentive_v2@{density}x.webp'
    result.save(path, 'WEBP', quality=90, method=6)
    alpha = np.array(Image.open(path).getchannel('A'))
    bounds = Image.fromarray((alpha > 8).astype('uint8') * 255).getbbox()
    assert bounds[0] > 0 and bounds[1] > 0 and bounds[2] < 160 * density and bounds[3] < 159 * density
    report['exports'].append({'path': path.relative_to(ROOT).as_posix(), 'size': list(result.size),
                              'bytes': path.stat().st_size, 'visibleAlphaBounds': bounds})

font = lambda size: ImageFont.truetype('C:/Windows/Fonts/arial.ttf', size)
columns = [('GREETING / identity reference', ASSETS / 'buddy_greeting@3x.webp'),
           ('CURRENT / rejected name frame', ASSETS / 'buddy_name_attentive@3x.webp'),
           ('NEW / one candidate', OUT / 'buddy_name_attentive_v2@3x.webp')]
board = Image.new('RGB', (1140, 970), '#FFFEFC')
draw = ImageDraw.Draw(board)
draw.text((20, 14), 'NAME-ENTRY FRAME ONLY / SAME CANVAS AND BASELINE', fill='#315E47', font=font(25))
for row, (bg, ink) in enumerate([('#FFFEFC', '#314D3B'), ('#1A1A1E', '#F6F3FF')]):
    y = 62 + row * 445
    draw.rectangle((0, y, 1140, y + 445), fill=bg)
    for col, (label, path) in enumerate(columns):
        x = col * 380
        draw.text((x + 14, y + 12), label, font=font(18), fill=ink)
        im = Image.open(path).convert('RGBA').convert('RGBa').resize((320, 318), Image.Resampling.LANCZOS).convert('RGBA')
        panel = Image.new('RGBA', im.size, bg)
        panel.alpha_composite(im)
        board.paste(panel.convert('RGB'), (x + 30, y + 52))
        baseline = y + 52 + 155 * 2
        draw.line((x + 20, baseline, x + 360, baseline), fill='#8A858F', width=1)
        draw.text((x + 14, y + 390), path.name.replace('@3x.webp', ''), font=font(17), fill=ink)
board.save(OUT / 'comparison.png')
(OUT / 'manifest.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
