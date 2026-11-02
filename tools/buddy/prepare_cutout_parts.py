"""Reproducible, non-destructive Buddy part matting and approval boards.
No app files are touched. Coordinates are source-image pixels (viewer left/right).
"""
from pathlib import Path
import json
import cv2
import numpy as np
from scipy.ndimage import distance_transform_edt, binary_fill_holes
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'design/buddy'
OUT = ART / 'parts_review'
CUT = OUT / 'cutouts'
CUT.mkdir(parents=True, exist_ok=True)
# Head diameter from the existing master silhouette fit, rounded to 1 px.
HEAD_W = 706
# Cut rectangles include clear background. Target widths use the master scale,
# not the arbitrary scale at which each part was packed onto a source sheet.
PARTS = [
    ('ear_viewer_left', 'Ear / viewer left', 'buddy_parts.png', (40,90,320,380), 264, (265,177,539,441)),
    ('ear_viewer_right', 'Ear / viewer right', 'buddy_parts.png', (930,90,1210,380), 245, (804,214,1058,483)),
    ('head_blank', 'Head / blank face', 'buddy_parts_fix.png', (180,30,1060,735), 706, (280,260,1000,835)),
    ('torso', 'Torso', 'buddy_parts_fix.png', (330,735,910,1200), 470, (354,790,826,1160)),
    ('arm_viewer_left', 'Arm / viewer left / palm', 'buddy_parts.png', (45,500,360,855), 314, (126,542,470,899)),
    ('arm_viewer_right', 'Arm / viewer right / back', 'generated/arm_viewer_right_attempt3.png', None, 210, (697,804,902,1088)),
    ('foot_viewer_left', 'Foot / viewer left', 'generated/foot_viewer_left_attempt1.png', None, 245, (322,954,566,1187)),
    ('foot_viewer_right', 'Foot / viewer right', 'generated/foot_viewer_right_attempt1.png', None, 270, (744,956,1024,1189)),
]

def matte(image):
    rgba = np.array(image.convert('RGBA'))
    if rgba[...,3].min() < 255:
        return Image.fromarray(rgba)
    c = rgba[...,:3].astype(float)
    # The supplied flat gray is slightly textured. Use its observed median.
    border = np.concatenate([c[:8].reshape(-1,3),c[-8:].reshape(-1,3),c[:,:8].reshape(-1,3),c[:,-8:].reshape(-1,3)])
    bg = np.median(border, axis=0)
    excess = c.max(axis=2)-c.min(axis=2)
    seed = (excess > 13) & (c.max(axis=2)>85)
    n, labs, stats, _ = cv2.connectedComponentsWithStats(seed.astype('uint8'))
    seed = labs == (1 + np.argmax(stats[1:,cv2.CC_STAT_AREA]))
    seed = binary_fill_holes(seed)
    solid = cv2.erode(seed.astype('uint8'), np.ones((15,15),np.uint8)).astype(bool)
    _, nearest = distance_transform_edt(~solid, return_indices=True)
    f = c[nearest[0],nearest[1]]
    delta = f-bg
    a = np.clip(((c-bg)*delta).sum(axis=2)/np.maximum((delta*delta).sum(axis=2),1),0,1)
    a[solid] = 1
    support = cv2.dilate(seed.astype('uint8'),np.ones((19,19),np.uint8)).astype(bool)
    a[~support] = 0
    a[a<0.035] = 0
    # Decontaminate gray from partial coverage, retaining original interior RGB.
    rgb = np.clip((c-(1-a[...,None])*bg)/np.maximum(a[...,None],.035),0,255)
    rgb[~solid] = f[~solid]  # nearest opaque fur colour; coverage carries the fine edge strands
    return Image.fromarray(np.dstack([rgb,a*255]).astype('uint8'))

def bounds(im, threshold=8):
    a = np.array(im)[...,3]
    y,x = np.where(a>threshold)
    return (int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1))

def tight(im):
    box=bounds(im)
    cropped=im.crop(box)
    padded=Image.new('RGBA',(cropped.width+16,cropped.height+16))
    padded.alpha_composite(cropped,(8,8))
    return padded, (box[2]-box[0],box[3]-box[1]), box

FONT_DIR=Path('C:/Windows/Fonts')
def font(n,bold=False):
    return ImageFont.truetype(str(FONT_DIR/('arialbd.ttf' if bold else 'arial.ttf')),n)

def fit_on(canvas,im,box):
    x,y,w,h=box
    im=im.copy()
    im.thumbnail((w,h),Image.Resampling.LANCZOS)
    canvas.alpha_composite(im,(int(x+(w-im.width)/2),int(y+(h-im.height)/2)))

master=Image.open(ART/'buddy_master.png').convert('RGBA')
rows=[]
images={}
for name,label,src,rect,target_width,ref_box in PARTS:
    im=Image.open(ART/src)
    if rect: im=im.crop(rect)
    im,dim,box=tight(matte(im))
    im.save(CUT/(name+'.png'))
    scale=target_width/dim[0]
    row={'name':name,'label':label,'source':src,'source_crop':rect,'alpha_bbox_within_crop':box,'visible_pixels':dim,'png_pixels':im.size,'reference_scale_width_px':target_width,'reference_scale_height_px':round(dim[1]*scale,1),'width_per_head':round(target_width/HEAD_W,4),'height_per_head':round(dim[1]*scale/HEAD_W,4),'uniform_scale':round(scale,5),'generation_attempts':int(src[-5]) if src.startswith('generated/') else 0,'reference_crop':ref_box}
    rows.append(row)
    images[name]=im

(OUT/'measurements.json').write_text(json.dumps({'master_head_width_px':HEAD_W,'measurement_note':'Master head intrinsic width excluding ears/fuzz, rounded from previous silhouette fit (705.452 px); Approximate prior fitted reference, not a new subpixel measurement. Proposed part sizes are uniform-scale assembly targets; hidden shoulder/body extent cannot be measured from the single master. Alpha bounds use >8/255; PNGs have 8 px transparent margins. These are not assembled-pose likeness metrics.','parts':rows},indent=2))

for bg,tag,ink,sub in [('#F6F3FF','light','#201D30','#5C526E'),('#1A1A1E','dark','#F6F3FF','#C0B7D3')]:
    board=Image.new('RGBA',(1800,1350),bg)
    d=ImageDraw.Draw(board)
    d.text((40,27),'BUDDY / PARTS APPROVAL',font=font(34,True),fill=ink)
    d.text((40,75),f'{bg}  |  H = master head width = 706 px  |  viewer left/right',font=font(22),fill=sub)
    d.text((40,108),'All parts share one scale: H = 370 px on this board. Dimensions exclude transparent margin.',font=font(21),fill=sub)
    for i,r in enumerate(rows):
        x=35+(i%4)*445;y=160+(i//4)*525
        d.text((x+8,y),r['label'],font=font(22,True),fill=ink)
        dim=f"{r['width_per_head']:.3f}H wide x {r['height_per_head']:.3f}H high"
        d.text((x+8,y+32),dim,font=font(21),fill=sub)
        im=images[r['name']]
        sf=r['uniform_scale']*370/HEAD_W
        im=im.resize((round(im.width*sf),round(im.height*sf)),Image.Resampling.LANCZOS)
        board.alpha_composite(im,(x+int((425-im.width)/2),y+90+int((330-im.height)/2)))
        source='REGENERATED / attempt '+str(r['generation_attempts']) if r['generation_attempts'] else 'RETAINED / supplied artwork'
        d.text((x+8,y+436),source,font=font(19),fill=sub)
        d.text((x+8,y+466),f"Cutout: {r['visible_pixels'][0]} x {r['visible_pixels'][1]} px",font=font(19),fill=sub)
    d.text((40,1240),'Prepared for parts approval. Hidden joins will be checked in the later assembly overlay.',font=font(22),fill=sub)
    d.text((40,1280),'Local asset review only: no adb device connected; phone recording pending.',font=font(22),fill=sub)
    board.convert('RGB').save(OUT/f'parts_{tag}.png')

# Separate side-by-side reference crops; this is not an assembled pose.
board=Image.new('RGBA',(1800,1980),'#F6F3FF');d=ImageDraw.Draw(board)
d.text((30,24),'MASTER CROPS / PREPARED PARTS',font=font(32,True),fill='#201D30')
d.text((30,70),'Reference crops include occlusion. Part extent under head/body is intentionally retained.',font=font(22),fill='#5C526E')
for i,r in enumerate(rows):
    x=25+(i%2)*885;y=120+(i//2)*460
    d.text((x,y),r['label'],font=font(24,True),fill='#201D30')
    d.text((x,y+34),'Master crop',font=font(18),fill='#5C526E')
    d.text((x+430,y+34),'Prepared cutout',font=font(18),fill='#5C526E')
    ref=master.crop(r['reference_crop'])
    cut=images[r['name']]
    normalized=cut.resize((round(cut.width*r['uniform_scale']),round(cut.height*r['uniform_scale'])),Image.Resampling.LANCZOS)
    zoom=min(405/max(ref.width,normalized.width),350/max(ref.height,normalized.height))
    for j,im in enumerate([ref,normalized]):
        im=im.resize((round(im.width*zoom),round(im.height*zoom)),Image.Resampling.LANCZOS)
        board.alpha_composite(im,(x+j*430+(405-im.width)//2,y+65+(360-im.height)//2))
board.convert('RGB').save(OUT/'master_part_comparison.png')
master.crop((694,797,904,1092)).save(OUT/'master_arm_reference.png')
print('Prepared eight cutouts and review boards.')






# QA: a small display preview plus native-resolution edge crops on both backgrounds.
# PNG source pixels are preserved; no app renderer or animation is involved.
edge_board=Image.new('RGBA',(1680,890),'#F6F3FF')
ed=ImageDraw.Draw(edge_board)
ed.text((24,20),'FUR EDGES / 4x PIXEL INSPECTION',font=font(28,True),fill='#201D30')
ed.text((24,60),'Upper silhouette of each part, shown on both requested backgrounds.',font=font(20),fill='#5C526E')
for i,r in enumerate(rows):
    im=images[r['name']]
    arr=np.array(im)
    col=im.width//2
    yy=np.flatnonzero(arr[:,col,3]>32)
    top=int(yy[0]) if len(yy) else 8
    crop=im.crop((col-40,max(0,top-7),col+40,max(0,top-7)+60))
    x=20+(i%4)*415;y=110+(i//4)*385
    ed.text((x,y),r['label'],font=font(18,True),fill='#201D30')
    for k,bg in enumerate(['#F6F3FF','#1A1A1E']):
        panel=Image.new('RGBA',(320,120),bg)
        enlarged=crop.resize((320,240),Image.Resampling.NEAREST)
        panel.alpha_composite(enlarged.crop((0,0,320,120)))
        edge_board.alpha_composite(panel,(x,y+35+k*145))
edge_board.convert('RGB').save(OUT/'edge_review.png')

# Internal alpha integrity checks, not a claim of full character likeness.
checks=[]
for r in rows:
    im=np.array(images[r['name']])
    a=im[...,3]
    checks.append({'part':r['name'],'transparent_pixel_count':int((a==0).sum()),'partial_alpha_pixel_count':int(((a>0)&(a<255)).sum()),'opaque_pixel_count':int((a==255).sum()),'border_clear':bool(a[0].max()==0 and a[-1].max()==0 and a[:,0].max()==0 and a[:,-1].max()==0)})
assert all(c['border_clear'] and c['partial_alpha_pixel_count']>0 for c in checks)
(OUT/'alpha_checks.json').write_text(json.dumps(checks,indent=2))
