"""One likeness checkpoint: unchanged master, rejected pose and new candidate.

Only export/scale/composite for review. Never writes app assets or Screen 1.
"""
from pathlib import Path
import json
import sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools/buddy'))
from normalize import measure, place, HEAD_WIDTH_PER_DIAMETER

OUT = ROOT/'design/screen2/master_restore'
source = ROOT/'design/buddy/generated/buddy_screen2_master_restore-original.png'
candidate = np.array(Image.open(source).convert('RGBA'))
m = measure('master_restore_candidate', candidate)
m['head_w'] = 2*m['head_r']*HEAD_WIDTH_PER_DIAMETER
for density in (2,3):
    result = place(candidate,m,False,106*density/m['head_w'],(160*density,159*density),155*density)
    result.save(OUT/f'candidate@{density}x.webp','WEBP',quality=94,method=6)

# Measurement only: identify the coloured mascot in the opaque master.
# The master pixels themselves are never edited or background-removed.
master = np.array(Image.open(ROOT/'design/buddy/buddy_master.png').convert('RGBA'))
rgb = master[:,:,:3].astype('int16')
mask = ((rgb[:,:,2]>rgb[:,:,1]+18)&(rgb[:,:,2]>rgb[:,:,0]+5)).astype('uint8')*255
contours,_ = cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
silhouette = np.zeros_like(mask)
cv2.drawContours(silhouette,[max(contours,key=cv2.contourArea)],-1,255,cv2.FILLED)
measured = master.copy(); measured[:,:,3]=silhouette
mm = measure('master_measurement',measured)
mm['head_w']=2*mm['head_r']*HEAD_WIDTH_PER_DIAMETER
master_panel = place(master,mm,False,318/mm['head_w'],(480,477),465)
old = Image.open(ROOT/'design/screen2/writing_spike/local/frame-6.png').convert('RGBA').resize((480,477),Image.Resampling.LANCZOS)
new = Image.open(OUT/'candidate@3x.webp').convert('RGBA')
board = Image.new('RGB',(1440,600),'#FFFEFC')
d = ImageDraw.Draw(board)
font=lambda size:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',size)
titles=['Original master / reference','Rejected Screen 2 compositor','New master-based candidate']
for i,im in enumerate((master_panel,old,new)):
    panel=Image.new('RGBA',(480,477),'#FFFEFC');panel.alpha_composite(im)
    board.paste(panel.convert('RGB'),(i*480,64))
    d.text((i*480+16,18),titles[i],font=font(23),fill='#284934')
    d.line((i*480+20,529,i*480+460,529),fill='#B8C3B8',width=1)
d.text((18,562),'Same measured head width (318px) and seated baseline. Candidate only: not approved or installed.',font=font(21),fill='#506052')
board.save(OUT/'comparison.png')
(OUT/'manifest.json').write_text(json.dumps({'status':'likeness candidate only; not approved/integrated','reference':'design/buddy/buddy_master.png','source':str(source.relative_to(ROOT)),'candidateMeasurements':m,'masterMeasurements':mm,'headWidthPxInComparison':318,'baselinePxInComparison':465,'generationAttempts':1},indent=2))
print('Saved one same-scale master / previous / candidate comparison. No app changes.')
