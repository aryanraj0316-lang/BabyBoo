"""Review sheets from the SAME Skia renderer used by the device lab."""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'design/buddy/assembly_review'
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
master=Image.open(ROOT/'design/buddy/buddy_master.png').convert('RGBA')
def bg(im,color='#F6F3FF'):
    out=Image.new('RGBA',im.size,color);out.alpha_composite(im);return out.convert('RGB')
a=Image.open(OUT/'assembled_master.png').convert('RGBA');n=Image.open(OUT/'assembled_neutral.png').convert('RGBA')
render=bg(a,'#FFFCF7');neutral=bg(n)
overlay=Image.blend(master.convert('RGB'),render,.5)
overlay.save(OUT/'overlay_50.png');render.save(OUT/'master_pose_on_light.png');neutral.save(OUT/'neutral_on_light.png')
board=Image.new('RGB',(2100,780),'#F6F3FF');d=ImageDraw.Draw(board)
for i,(label,im) in enumerate([('MASTER',master),('ASSEMBLY / MASTER POSE',render),('50% OVERLAY',overlay)]):
    d.text((i*700+24,20),label,font=font(25),fill='#282236');im=im.resize((700,700),Image.Resampling.LANCZOS);board.paste(im,(i*700,65))
board.save(OUT/'assembly_comparison.png')
labels=['Turn -1','Turn -0.5 (3/4)','Front','Turn +0.5','Turn +1','Nod up','Nod down','Tilt -8 deg','Tilt +8 deg','Squash 0.88']
strip=Image.new('RGB',(2000,900),'#F6F3FF');d=ImageDraw.Draw(strip)
for i,label in enumerate(labels):
    im=bg(Image.open(OUT/f'head_{i}.png')).crop((180,100,1120,940));im.thumbnail((385,355),Image.Resampling.LANCZOS)
    x=(i%5)*400;y=(i//5)*450;strip.paste(im,(x+(400-im.width)//2,y+60));d.text((x+18,y+20),label,font=font(23),fill='#282236')
strip.save(OUT/'face_projection_strip.png')
ref=Image.open(OUT/'reference_three_quarter.png').crop((90,0,480,350)).convert('RGB')
turn=bg(Image.open(OUT/'head_1.png'),'white').crop((180,130,1120,880))
board=Image.new('RGB',(1300,680),'#F6F3FF');d=ImageDraw.Draw(board)
for x,label,im in [(0,'3/4 REFERENCE',ref),(650,'3/4 RENDER / SURFACE FACE',turn)]:
    im.thumbnail((620,550),Image.Resampling.LANCZOS)
    # Upscale the reference as well so each image is visibly comparable.
    scale=min(620/im.width,550/im.height);im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    board.paste(im,(x+(650-im.width)//2,80+(550-im.height)//2));d.text((x+18,25),label,font=font(25),fill='#282236')
board.save(OUT/'three_quarter_comparison.png')
# Pixel eye measurements (ellipse axes; black mask excludes lavender and mouth).
def eyes(path):
    rgb=np.array(Image.open(path).convert('RGB'));lab=cv2.cvtColor(rgb,cv2.COLOR_RGB2LAB).astype(float)
    rgba=np.array(Image.open(path).convert('RGBA'))
    mask=(lab[...,0]<65)&(np.hypot(lab[...,1]-128,lab[...,2]-128)<40)&(rgba[...,3]>200)
    cs,_=cv2.findContours(mask.astype('uint8'),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    cs=sorted(sorted(cs,key=cv2.contourArea,reverse=True)[:2],key=lambda c:cv2.boundingRect(c)[0])
    return [dict(center=list(cv2.fitEllipse(c)[0]),axes=list(cv2.fitEllipse(c)[1])) for c in cs]
e=eyes(OUT/'head_1.png');measure=json.loads((OUT/'face_reference_measurements.json').read_text())
metrics=dict(head_target_aspect=.856,head_source_aspect=674/836,vertical_stretch=.856/(674/836),reference_far_near_width=measure['far_near_width_ratio'],reference_far_near_height=measure['far_near_height_ratio'],rendered_far_near_width=e[0]['axes'][0]/e[1]['axes'][0],rendered_far_near_height=e[0]['axes'][1]/e[1]['axes'][1],rendered_eyes=e)
(OUT/'assembly_metrics.json').write_text(json.dumps(metrics,indent=2));print(json.dumps(metrics,indent=2))

# Rendered face parts, displayed at the same scale on both review backgrounds.
names=['eye_left','eye_right','eye_closed_left','eye_closed_right','mouth_happy','mouth_o','mouth_closed','mouth_worried','blush_left','blush_right']
board=Image.new('RGB',(1800,950));d=ImageDraw.Draw(board)
for row,color in enumerate(['#F6F3FF','#1A1A1E']):
    y0=row*475;d.rectangle((0,y0,1800,y0+475),fill=color)
    ink='#282236' if row==0 else '#F6F3FF'
    d.text((24,y0+15),'RENDERED FACE PARTS / '+color,font=font(24),fill=ink)
    for i,name in enumerate(names):
        im=Image.open(OUT/'face'/f'{name}.png').convert('RGBA');im.thumbnail((160,150),Image.Resampling.LANCZOS)
        x=(i%5)*360;y=y0+65+(i//5)*200
        board.paste(im,(x+(360-im.width)//2,y+(150-im.height)//2),im)
        d.text((x+18,y+153),name.replace('_',' '),font=font(20),fill=ink)
board.save(OUT/'face_parts_review.png')
# Enlarged foot overlay lets reviewers inspect its height and slant.
overlay.crop((700,900,1070,1230)).resize((740,660),Image.Resampling.LANCZOS).save(OUT/'right_foot_overlay.png')
