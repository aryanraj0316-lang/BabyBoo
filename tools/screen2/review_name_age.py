"""Make labelled QA boards from unchanged approved frames and phone captures."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'design/screen2/simple_name_age'
ASSETS = ROOT / 'assets/onboarding/screen2/buddy'

def font(size):
    return ImageFont.truetype('C:/Windows/Fonts/arial.ttf', size)

poses = [('greeting', 'Greeting'), ('name_attentive', 'Name entered'),
         ('age_ready', 'Age question'), ('age_proud', 'Age selected')]
board = Image.new('RGB', (1280, 425), '#FFFEFC')
draw = ImageDraw.Draw(board)
draw.text((20, 12), 'SCREEN 2 / APPROVED FRAMES USED IN THIS MILESTONE', fill='#315E47', font=font(22))
for i, (key, label) in enumerate(poses):
    x = i * 320
    im = Image.open(ASSETS / f'buddy_{key}@3x.webp').convert('RGBA')
    im = im.convert('RGBa').resize((280, 278), Image.Resampling.LANCZOS).convert('RGBA')
    board.paste(im, (x + 20, 64), im)
    draw.text((x + 20, 354), label, fill='#315E47', font=font(19))
    draw.text((x + 20, 384), f'buddy_{key}', fill='#6A756C', font=font(16))
board.save(OUT / 'mascot-frames.png')
if '--mascot-only' in sys.argv:
    raise SystemExit(0)

screens = [('01-greeting-keyboard', '1 / Greeting + auto keyboard'),
           ('02-name-attentive', '2 / Name + attentive Buddy'),
           ('03-age-question', '3 / Same-page age question'),
           ('04-age-selected', '4 / Age selected')]
sheet = Image.new('RGB', (1200, 748), '#F0F3ED')
draw = ImageDraw.Draw(sheet)
for i, (key, label) in enumerate(screens):
    im = Image.open(OUT / f'{key}.png').convert('RGB')
    im.thumbnail((284, 650), Image.Resampling.LANCZOS)
    sheet.paste(im, (i * 300 + 8, 48))
    draw.text((i * 300 + 8, 12), label, font=font(16), fill='#315E47')
sheet.save(OUT / 'screen-states.png')
