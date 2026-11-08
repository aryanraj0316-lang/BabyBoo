"""Export the four-frame Screen 2 art review; never writes app assets/code."""
from pathlib import Path
import hashlib
import json
import shutil
import sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools/buddy'))
from normalize import measure, place, HEAD_WIDTH_PER_DIAMETER
from colour import fur_stats

OUT=ROOT/'design/screen2/frame_set_v3'
FRAMES=OUT/'frames'; FRAMES.mkdir(exist_ok=True)
ART=ROOT/'design/buddy/generated'
SPECS=[
 ('01_greeting','Greeting','Screen opens / before input focus',None),
 ('02_focus_down','Name input focused','Stays down during typing pauses','buddy_screen2_v3_focus_down-original.png'),
 ('03_write_down','Typing / writing variation','Small pen and paw change; eyes stay down','buddy_screen2_v3_write_down-original.png'),
 ('04_forward','Keyboard dismissed or Go','Forward gaze; reused for age selection','buddy_screen2_v3_forward-original.png'),
]
forward=np.array(Image.open(ART/SPECS[3][3]).convert('RGBA'))
# Ignore detached alpha noise for measurement only; never repaint source art.
count, labels, stats, _=cv2.connectedComponentsWithStats((forward[:,:,3]>8).astype('uint8'))
largest=1+np.argmax(stats[1:,cv2.CC_STAT_AREA])
registration=forward.copy();registration[:,:,3]=np.where(labels==largest,forward[:,:,3],0)
m=measure('v3_forward',registration)
m['head_w']=2*m['head_r']*HEAD_WIDTH_PER_DIAMETER

def eye_crop(im):
    rgb=np.array(im.convert('RGB')); a=np.array(im.convert('RGBA'))[:,:,3]
    dark=((rgb.max(axis=2)<85)&(a>230)).astype('uint8')
    dark[275:]=0; dark[:95]=0
    _,_,components,_=cv2.connectedComponentsWithStats(dark)
    candidates=[s for s in components[1:] if s[2]>15 and s[3]>20 and s[4]>180 and 0.45<s[2]/s[3]<1.7]
    eyes=sorted(candidates,key=lambda s:s[4],reverse=True)[:2]
    if len(eyes)!=2:raise ValueError('Could not identify two rendered eyes for QA')
    x=min(s[0] for s in eyes)-10;y=min(s[1] for s in eyes)-10
    right=max(s[0]+s[2] for s in eyes)+10;bottom=max(s[1]+s[3] for s in eyes)+10
    return im.crop((x,y,right,bottom)),eyes

manifest={'status':'Review candidates only; NOT approved or installed','eyeRule':'Forward matches master; down highlights lowered inside eye outlines','canvasPt':[160,159],'baselinePt':155,'headWidthPt':106,'registration':m,'masterFurMeasurement':fur_stats(np.array(Image.open(ROOT/'design/buddy/buddy_master.png').convert('RGBA'))),'frames':[]}
board=Image.new('RGB',(1920,850),'#FFFEFC'); draw=ImageDraw.Draw(board)
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
for index,(key,title,purpose,source) in enumerate(SPECS):
    if source is None:
        for density in (2,3):
            shutil.copyfile(ROOT/f'assets/onboarding/screen1/buddy/buddy_wave@{density}x.webp',FRAMES/f'{key}@{density}x.webp')
        original=ROOT/'assets/onboarding/screen1/buddy/buddy_wave@3x.webp'
    else:
        original=ART/source
        rgba=np.array(Image.open(original).convert('RGBA'))
        if rgba.shape!=forward.shape:raise ValueError('Source registration size differs')
        for density in (2,3):
            scale=106*density/m['head_w']
            assert scale<=1
            placed=place(rgba,m,False,scale,(160*density,159*density),155*density)
            placed.save(FRAMES/f'{key}@{density}x.webp','WEBP',quality=94,method=6)
    im=Image.open(FRAMES/f'{key}@3x.webp').convert('RGBA')
    im.save(FRAMES/f'{key}.png')
    panel=Image.new('RGBA',im.size,'#FFFEFC');panel.alpha_composite(im)
    x=index*480
    board.paste(panel.convert('RGB'),(x,96))
    draw.text((x+15,12),f'{index+1}. {title}',font=font(23),fill='#284934')
    draw.text((x+15,44),f'{key}.png',font=font(18),fill='#526052')
    draw.text((x+15,72),purpose,font=font(17),fill='#526052')
    draw.line((x+18,561,x+462,561),fill='#B7C3B7',width=1)
    eye,boxes=eye_crop(panel)
    factor=min(440/eye.width,175/eye.height)
    eye=eye.resize((round(eye.width*factor),round(eye.height*factor)),Image.Resampling.LANCZOS)
    board.paste(eye.convert('RGB'),(x+(480-eye.width)//2,610))
    draw.text((x+15,584),'Rendered eyes / enlarged',font=font(18),fill='#284934')
    rgba=np.array(im)
    visible=Image.fromarray(np.uint8(rgba[:,:,3]>8)*255).getbbox()
    record={'file':f'frames/{key}.png','purpose':purpose,'source':str(original.relative_to(ROOT)),'sourceSha256':hashlib.sha256(original.read_bytes()).hexdigest(),'visibleAlphaBounds':visible,'bytes3x':(FRAMES/f'{key}@3x.webp').stat().st_size,'furMeasurement':fur_stats(rgba),'eyeBoxes3x':[s.tolist() for s in boxes]}
    manifest['frames'].append(record)
draw.text((16,816),'Four unique frames for the existing name-to-age flow. Review only: no app integration or animation changes.',font=font(22),fill='#526052')
board.save(OUT/'all_frames.png')

# Eye inspection against the original master, without editing the master.
master=Image.open(ROOT/'design/buddy/buddy_master.png').convert('RGBA')
master_eye=master.crop((425,465,892,675))
eye_board=Image.new('RGB',(1920,290),'#FFFEFC'); ed=ImageDraw.Draw(eye_board)
for i,(title,eye) in enumerate([('Original master',master_eye)]+[(s[1],eye_crop(Image.open(FRAMES/f'{s[0]}@3x.webp').convert('RGBA'))[0]) for s in SPECS[1:]]):
    bg=Image.new('RGBA',eye.size,'#FFFEFC');bg.alpha_composite(eye)
    factor=min(450/bg.width,220/bg.height)
    bg=bg.resize((round(bg.width*factor),round(bg.height*factor)),Image.Resampling.LANCZOS)
    eye_board.paste(bg.convert('RGB'),(i*480+15,50))
    ed.text((i*480+15,12),title,font=font(23),fill='#284934')
eye_board.save(OUT/'eye_comparison.png')
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'frames':len(SPECS),'contactSheet':str(OUT/'all_frames.png'),'furL':[round(f['furMeasurement']['L'],2) for f in manifest['frames']]},indent=2))
