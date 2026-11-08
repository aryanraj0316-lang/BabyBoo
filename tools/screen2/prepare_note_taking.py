"""Normalize one note-taking still and compare with the previous card frame."""
from pathlib import Path
import sys
import json
from PIL import Image, ImageDraw, ImageFont
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools/buddy'))
from normalize import measure, place, HEAD_WIDTH_PER_DIAMETER
OUT = ROOT / 'design/screen2/note_taking'
ASSETS = ROOT / 'assets/onboarding/screen2/buddy'
source = ROOT / 'design/buddy/generated/buddy_screen2_note_taking-original.png'
rgba = np.array(Image.open(source).convert('RGBA'))
m = measure('note_taking', rgba)
m['head_w'] = 2 * m['head_r'] * HEAD_WIDTH_PER_DIAMETER
entries = []
for density in (2, 3):
    scale = 106 * density / m['head_w']
    assert scale <= 1
    im = place(rgba, m, False, scale, (160 * density, 159 * density), 155 * density)
    path = ASSETS / f'buddy_note_taking@{density}x.webp'
    im.save(path, 'WEBP', quality=90, method=6)
    alpha = np.array(Image.open(path).getchannel('A'))
    bounds = Image.fromarray((alpha > 8).astype('uint8') * 255).getbbox()
    assert bounds[0] > 0 and bounds[1] > 0 and bounds[2] < 160 * density and bounds[3] < 159 * density
    entries.append({'file': path.relative_to(ROOT).as_posix(), 'bytes': path.stat().st_size,
                    'size': list(im.size), 'visibleAlphaBounds': bounds})
(OUT / 'manifest.json').write_text(json.dumps({'source': source.relative_to(ROOT).as_posix(),
    'canvasPt': [160, 159], 'headWidthPt': 106, 'baselinePt': 155, 'exports': entries}, indent=2))

board = Image.new('RGB', (960, 600), '#FFFEFC')
d = ImageDraw.Draw(board)
font = lambda n: ImageFont.truetype('C:/Windows/Fonts/arial.ttf', n)
d.text((20, 14), 'AGE STEP / PREVIOUS CARD AND NEW NOTE-TAKING POSE', fill='#315E47', font=font(24))
for i, (name, label) in enumerate([('age_ready', 'Previous: presenting card'), ('note_taking', 'New: supporting card and holding pen')]):
    im = Image.open(ASSETS / f'buddy_{name}@3x.webp').convert('RGBA')
    im = im.convert('RGBa').resize((400, 398), Image.Resampling.LANCZOS).convert('RGBA')
    panel = Image.new('RGBA', im.size, '#FFFEFC'); panel.alpha_composite(im)
    x = i * 480 + 40
    board.paste(panel.convert('RGB'), (x, 80))
    d.line((x, 80 + 155 * 2.5, x + 400, 80 + 155 * 2.5), fill='#96958C', width=1)
    d.text((i * 480 + 16, 510), label, fill='#315E47', font=font(21))
board.save(OUT / 'comparison.png')
print(json.dumps(entries, indent=2))
