"""Review one localized note-pose edit against the exact approved app asset."""
from pathlib import Path
import json
import sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools/buddy'))
from normalize import measure,place,HEAD_WIDTH_PER_DIAMETER
from colour import fur_stats
OUT=ROOT/'design/screen2/localized_note'
source=ROOT/'design/buddy/generated/buddy_screen2_localized_note-original.png'
rgba=np.array(Image.open(source).convert('RGBA'))
_,labels,stats,_=cv2.connectedComponentsWithStats((rgba[:,:,3]>8).astype('uint8'))
largest=1+np.argmax(stats[1:,cv2.CC_STAT_AREA])
measurement=rgba.copy();measurement[:,:,3]=np.where(labels==largest,rgba[:,:,3],0)
m=measure('localized_note',measurement);m['head_w']=2*m['head_r']*HEAD_WIDTH_PER_DIAMETER
for density in (2,3):
    im=place(rgba,m,False,106*density/m['head_w'],(160*density,159*density),155*density)
    im.save(OUT/f'candidate@{density}x.webp','WEBP',quality=94,method=6)
approved=Image.open(ROOT/'assets/onboarding/screen1/buddy/buddy_wave@3x.webp').convert('RGBA')
candidate=Image.open(OUT/'candidate@3x.webp').convert('RGBA');candidate.save(OUT/'candidate.png')
sheet=Image.new('RGB',(960,800),'#FFFEFC');d=ImageDraw.Draw(sheet)
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
for i,(title,im) in enumerate((('Approved Screen 1 artwork',approved),('Localized card + pen candidate',candidate))):
    panel=Image.new('RGBA',im.size,'#FFFEFC');panel.alpha_composite(im)
    sheet.paste(panel.convert('RGB'),(i*480,60))
    d.text((i*480+15,15),title,font=font(23),fill='#284934')
    d.line((i*480+18,525,i*480+462,525),fill='#B7C3B7')
    eye=panel.crop((140,135,360,250)).resize((440,230),Image.Resampling.LANCZOS)
    sheet.paste(eye.convert('RGB'),(i*480+20,550))
sheet.save(OUT/'comparison.png')
report={'status':'One pose candidate; NOT approved/installed/animated','reference':'assets/onboarding/screen1/buddy/buddy_wave@3x.webp','source':str(source.relative_to(ROOT)),'canvasPt':[160,159],'baselinePt':155,'headWidthPt':106,'registration':m,'furMeasurements':{'approved':fur_stats(np.array(approved)),'candidate':fur_stats(np.array(candidate))}}
(OUT/'manifest.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'contact':str(OUT/'comparison.png'),'furL':{k:round(v['L'],2) for k,v in report['furMeasurements'].items()}},indent=2))
