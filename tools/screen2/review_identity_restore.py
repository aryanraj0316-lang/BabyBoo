"""Review original-bitmap recovery on the real phone; no artwork edits."""
from pathlib import Path
import subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'design/screen2/identity_restore/phone'
FRAMES=OUT/'frames';FRAMES.mkdir(exist_ok=True)
subprocess.run(['ffmpeg','-y','-i',str(OUT/'phone.mp4'),'-vf','fps=1',str(FRAMES/'%03d.png')],check=True,capture_output=True)
files=sorted(FRAMES.glob('*.png'))
sheet=Image.new('RGB',(1200,1440),'#F0F3ED')
draw=ImageDraw.Draw(sheet)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20)
for i in range(8):
    n=round(i*(len(files)-1)/7)
    im=Image.open(files[n]).convert('RGB');im.thumbnail((284,650))
    x,y=(i%4)*300+8,(i//4)*720+45
    sheet.paste(im,(x,y))
    draw.text((x,y-30),f'{n}s / original Buddy image',font=font,fill='#315E47')
sheet.save(OUT/'contact.png')
print(f'Extracted {len(files)} physical-phone frames; original-art recovery contact saved.')
