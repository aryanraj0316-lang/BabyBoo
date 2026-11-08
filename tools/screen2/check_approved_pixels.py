"""Confirm the approved appearance is unchanged outside the permitted patches."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'design/screen2/approved_writing'
metrics=json.loads((OUT/'registration.json').read_text())
reference=np.array(Image.open(OUT/'local/reference.png').convert('RGBA'))
allowed=np.zeros(reference.shape[:2],dtype=bool)
allowed[90*6:133*6,30*6:85*6]=True
for r in metrics['eyeRects']:
    x0,y0=int(r['x']*6)-5,int(r['y']*6)-5
    x1,y1=int((r['x']+r['width'])*6)+6,int((r['y']+r['height'])*6)+6
    allowed[y0:y1,x0:x1]=True
counts={}
for file in sorted((OUT/'local').glob('down-*.png'))+[(OUT/'local/rest.png')]:
    current=np.array(Image.open(file).convert('RGBA'))
    count=int((np.any(reference!=current,axis=2)&~allowed).sum())
    counts[file.name]=count
    if count:raise AssertionError(f'{file.name} changed {count} pixels outside eye/hand area')
(OUT/'protected-pixels.json').write_text(json.dumps({'comparison':'headless approved bitmap vs every writing preview','changedPixelsOutsideEyeAndWritingRegion':counts,'passed':True},indent=2))
sheet=Image.new('RGB',(1280,400),'#FFFEFC');draw=ImageDraw.Draw(sheet)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
for i,(name,label) in enumerate([('reference','Approved source'),('down-0','Focused / ready'),('down-4','Typing / one ink line'),('rest','Dismissed or Go')]):
    im=Image.open(OUT/f'local/{name}.png').convert('RGB').resize((320,318))
    sheet.paste(im,(i*320,38));draw.text((i*320+8,10),label,font=font,fill='#284934')
sheet.save(OUT/'local/contact.png')
print('PASS: zero changed pixels outside the permitted eye/hand/card region in all 8 previews.')
