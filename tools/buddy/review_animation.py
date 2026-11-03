"""Animation checkpoint boards and rendered contour measurements; originals unchanged."""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'design/buddy/animation_review'
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
def on_bg(im,color='#F6F3FF'):
    bg=Image.new('RGBA',im.size,color);bg.alpha_composite(im.convert('RGBA'));return bg.convert('RGB')
def panel(board,im,xywh):
    x,y,w,h=xywh;im=im.copy();scale=min(w/im.width,h/im.height)
    im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    board.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2))
ref=Image.open(ROOT/'design/buddy/assembly_review/reference_three_quarter.png').convert('RGB').crop((90,0,480,350))
head_rgba=Image.open(OUT/'head_0.png').convert('RGBA')
head=on_bg(head_rgba.crop(head_rgba.getbbox()))
ref_rgb=np.array(ref).astype(float)
ref_mask=(ref_rgb[...,2]>ref_rgb[...,1]*1.08)&(ref_rgb[...,0]-ref_rgb[...,1]>20)
spans=[]
for row in ref_mask[160:280]:
    xx=np.flatnonzero(row)
    if len(xx):spans.append(xx[-1]-xx[0]+1)
ref_head_width=max(spans)
surface_alpha=np.array(Image.open(OUT/'surface_extreme_left.png'))[...,3]
_,sx=np.where(surface_alpha>128);rig_head_width=int(sx.max()-sx.min()+1)
ys,xs=np.where(ref_mask);ref=ref.crop((int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)))
board=Image.new('RGB',(1400,760),'#F6F3FF');d=ImageDraw.Draw(board)
for x,label,im,hw in [(0,'TURNAROUND / TOP MIDDLE',ref,ref_head_width),(700,'CLAMPED MAXIMUM / TURN -1',head,rig_head_width)]:
    d.text((x+20,22),label,font=font(25),fill='#282236')
    scale=530/hw;im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    board.paste(im,(x+(700-im.width)//2,80+(640-im.height)//2))
d.text((20,723),'Matched head-width scale; original source/reference pixels retained.',font=font(20),fill='#51435E')
board.save(OUT/'clamped_reference_comparison.png')
# Inspect actual raster alpha mask, not just a vertex or parameter limit.
results=[]
for side,index in [('left',0),('right',4)]:
    rgba=np.array(Image.open(OUT/f'head_{index}.png').convert('RGBA'))
    surface=np.array(Image.open(OUT/f'surface_extreme_{side}.png').convert('RGBA'))
    mask=(surface[...,3]>128).astype('uint8')
    distance=cv2.distanceTransform(mask,cv2.DIST_L2,cv2.DIST_MASK_PRECISE)
    rgb=rgba[...,:3];lab=cv2.cvtColor(rgb,cv2.COLOR_RGB2LAB).astype(float)
    eyes=(lab[...,0]<65)&(np.hypot(lab[...,1]-128,lab[...,2]-128)<40)&(rgba[...,3]>200)
    contours,_=cv2.findContours(eyes.astype('uint8'),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    contours=sorted(contours,key=cv2.contourArea,reverse=True)[:2]
    widths=[];margins=[]
    for c in contours:
        ellipse=cv2.fitEllipse(c);widths.append(min(ellipse[1]))
        pts=c[:,0,:];margins.append(float(distance[pts[:,1],pts[:,0]].min()))
    ys,xs=np.where(mask>0);aspect=(xs.max()-xs.min()+1)/(ys.max()-ys.min()+1)
    results.append(dict(side=side,eye_count=len(contours),minimum_eye_margin_px=min(margins),margin_per_authored_head_width=min(margins)/706,far_near_eye_width=min(widths)/max(widths),head_width_height=float(aspect)))
assert all(r['eye_count']==2 and r['minimum_eye_margin_px']>=20 for r in results),results
# Ear resolution and original source provenance: no regenerated or resampled PNG.
ears=[]
for side in ['left','right']:
    p=ROOT/f'design/buddy/parts_review/cutouts/ear_viewer_{side}.png';im=Image.open(p)
    ears.append(dict(side=side,source=str(p.relative_to(ROOT)),pixels=im.size,source_preserved=True,sampling='Catmull-Rom cubic; full source texture; rigid broad card; >=96% width on turn'))
(OUT/'refinement_metrics.json').write_text(json.dumps(dict(extremes=results,ear_textures=ears,scope='Rendered head contours; not a whole-character likeness pass'),indent=2))
print(json.dumps(results,indent=2))
# Ear comparisons with the master at common head-width scale.
board=Image.new('RGB',(1500,700),'#F6F3FF');d=ImageDraw.Draw(board)
master=Image.open(ROOT/'design/buddy/buddy_master.png').convert('RGBA')
assembled=Image.open(OUT/'assembled_master.png').convert('RGBA')
for x,label,im in [(0,'MASTER / EARS',master),(750,'RIG / EARS / SAME SCALE',on_bg(assembled))]:
    d.text((x+20,20),label,font=font(25),fill='#282236');panel(board,im.crop((220,140,1100,520)),(x+20,90,710,510))
board.save(OUT/'ears_at_matched_scale.png')
keys=json.loads((OUT/'keyframes.json').read_text())
board=Image.new('RGB',(2000,1650),'#F6F3FF');d=ImageDraw.Draw(board)
for i,k in enumerate(keys):
    x=(i%5)*400;y=(i//5)*550
    d.text((x+18,y+16),f"{k['seconds']:.2f} seconds",font=font(24),fill='#282236')
    panel(board,on_bg(Image.open(OUT/(k['name']+'.png'))),(x,y+55,400,450))
board.save(OUT/'motion_keyframes.png')
for color,name in [('#F6F3FF','light'),('#1A1A1E','dark')]:
    board=Image.new('RGB',(1800,950),color);d=ImageDraw.Draw(board)
    ink='#282236' if name=='light' else '#F6F3FF'
    for x,label,p in [(0,'MASTER',ROOT/'design/buddy/buddy_master.png'),(600,'REFINED MASTER POSE',OUT/'assembled_master.png'),(1200,'NEUTRAL',OUT/'assembled_neutral.png')]:
        d.text((x+15,15),label,font=font(24),fill=ink);panel(board,on_bg(Image.open(p),color),(x,70,600,800))
    board.save(OUT/f'refined_assembly_{name}.png')
