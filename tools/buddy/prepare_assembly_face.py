"""Extract the rendered happy face from original master pixels; no redrawing."""
from pathlib import Path
import json, math
import cv2
import numpy as np
from PIL import Image
from scipy.ndimage import binary_fill_holes

ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'design/buddy';OUT=ART/'assembly_review';FACE=OUT/'face'
FACE.mkdir(exist_ok=True)
H=706.;CENTER=np.array([644.,550.])
measure=json.loads((OUT/'face_reference_measurements.json').read_text())
a,b=[np.array(e['center']) for e in measure['master_eyes']]
roll=math.atan2(*(b-a)[::-1])
mat=cv2.getRotationMatrix2D(tuple(CENTER),math.degrees(roll),1)
rgb=np.array(Image.open(ART/'buddy_master.png').convert('RGB'))
upright=cv2.warpAffine(rgb,mat,(1254,1254),flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_REFLECT)

def upright_pt(x,y): return mat@np.array([x,y,1.])
def bbox(mask):
    yy,xx=np.where(mask>0);return int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)
def asset(name,box,alpha):
    x0,y0,x1,y1=box
    rgba=np.dstack([upright[y0:y1,x0:x1],alpha]).astype('uint8')
    Image.fromarray(rgba).save(FACE/f'{name}.png')
    return dict(name=name,box=list(box),x=(x0-CENTER[0])/H,y=(y0-CENTER[1])/H,w=(x1-x0)/H,h=(y1-y0)/H)

spec=[]
for i,e in enumerate(measure['master_eyes']):
    x,y=upright_pt(*e['center']);x0,y0=int(x-85),int(y-90);x1,y1=x0+170,y0+180
    crop=upright[y0:y1,x0:x1]
    lab=cv2.cvtColor(crop,cv2.COLOR_RGB2LAB).astype(float)
    mask=(lab[...,0]<100)&(np.hypot(lab[...,1]-128,lab[...,2]-128)<48)
    cnts,_=cv2.findContours(mask.astype('uint8'),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    fill=np.zeros(mask.shape,np.uint8);cv2.drawContours(fill,[max(cnts,key=cv2.contourArea)],-1,255,-1)
    alpha=cv2.GaussianBlur(fill,(3,3),.65)
    spec.append(asset('eye_left' if i==0 else 'eye_right',(x0,y0,x1,y1),alpha))
# Dark mouth outline encloses tongue; filling its outer contour preserves both.
x,y=upright_pt(649,678);x0,y0=int(x-100),int(y-70);x1,y1=x0+200,y0+140
crop=upright[y0:y1,x0:x1]
lab=cv2.cvtColor(crop,cv2.COLOR_RGB2LAB).astype(float)
mask=(crop[...,0].astype(float)-crop[...,1].astype(float)>42)&(crop[...,0].astype(float)>crop[...,2].astype(float)*.55)
cnts,_=cv2.findContours(mask.astype('uint8'),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
fill=np.zeros(mask.shape,np.uint8);cv2.drawContours(fill,[max(cnts,key=cv2.contourArea)],-1,255,-1)
alpha=cv2.GaussianBlur(fill,(3,3),.7)
spec.append(asset('mouth_happy',(x0,y0,x1,y1),alpha))
# Rendered cheek/fur pixels with a broad feather into the blank head's fur.
for name,anchor in [('blush_left',(413,644)),('blush_right',(861,704))]:
    x,y=upright_pt(*anchor);x0,y0=int(x-90),int(y-90);x1,y1=x0+180,y0+180
    yy,xx=np.mgrid[:180,:180]
    rr=np.sqrt(((xx-90)/85)**2+((yy-90)/80)**2)
    c=upright[y0:y1,x0:x1].astype(float)
    pink=(c[...,0]-c[...,2]>-35)&(c[...,0]>180)
    xxn=(xx-90)/90; yyn=(yy-90)/90
    design=np.stack([np.ones_like(xxn),xxn,yyn,xxn**2,yyn**2,xxn*yyn],axis=-1)
    fur=(c[...,2]-c[...,0]>40)&(c[...,1]>90)&(c[...,2]>160)
    coefs=np.linalg.lstsq(design[fur],c[fur],rcond=None)[0]
    inpaint=np.clip(design@coefs,0,255)
    tint=np.array([255.,148.,223.]);delta=tint-inpaint
    a=np.clip(((c-inpaint)*delta).sum(axis=2)/np.maximum((delta*delta).sum(axis=2),1),0,1)
    a*=np.clip((1-rr)/.25,0,1)
    a[(c[...,0]<180)|(c[...,0]-c[...,2]<-45)]=0
    a=cv2.GaussianBlur(a,(3,3),.65)
    fg=np.clip((c-(1-a[...,None])*inpaint)/np.maximum(a[...,None],.04),0,255)
    fg[a<.08]=tint
    entry=asset(name,(x0,y0,x1,y1),a*255)
    Image.fromarray(np.dstack([fg,a*255]).astype('uint8')).save(FACE/f'{name}.png')
    spec.append(entry)
(OUT/'face_assets.json').write_text(json.dumps(dict(headWidth=H,center=CENTER.tolist(),masterRoll=roll,headAspect=.856,features=spec),indent=2))
Image.fromarray(upright).save(OUT/'master_unrolled.png')
print(json.dumps(spec,indent=2))

# Per-row silhouette profile: an ellipsoid surface with the approved head's outline.
head=np.array(Image.open(ART/'parts_review/cutouts/head_blank.png').convert('RGBA'))
a=head[...,3];hh,ww=a.shape
profile=[]
for v in np.linspace(0,1,97):
    row=min(hh-1,max(0,round(8+v*(hh-16))))
    xs=np.flatnonzero(a[row]>8)
    if len(xs): l=(xs.min()-8)/(ww-16)-.5;r=(xs.max()-8)/(ww-16)-.5
    else: l=-.001;r=.001
    profile.append([float((l+r)/2),float(max(.001,(r-l)/2))])
(OUT/'head_surface_profile.json').write_text(json.dumps(profile))

from scipy.ndimage import distance_transform_edt
solid=head[...,3]>240
_,nearest=distance_transform_edt(~solid,return_indices=True)
filled=head.copy();filled[...,:3]=head[nearest[0],nearest[1],:3];filled[...,3]=255
Image.fromarray(filled).save(FACE/'head_surface.png')

# Wrap source fur around the hidden side. At grazing angles a flat image contains
# almost no texels; reuse a clean rendered fur patch there instead of stretching
# one column. Low-frequency lighting comes from the same approved head artwork.
atlas_w,atlas_h=2048,1024
vv,tt=np.mgrid[0:atlas_h,0:atlas_w].astype(float);vv/=atlas_h-1;theta=-np.pi+tt/(atlas_w-1)*2*np.pi
p=np.array(profile);q=vv*96;i=np.minimum(95,q.astype(int));t=q-i
cx=p[i,0]*(1-t)+p[i+1,0]*t;rr=p[i,1]*(1-t)+p[i+1,1]*t
mapx=(8+(cx+rr*np.sin(theta)+.5)*(ww-16)).astype('float32');mapy=(8+vv*(hh-16)).astype('float32')
front=cv2.remap(filled[...,:3],mapx,mapy,cv2.INTER_LINEAR).astype(float)
low=cv2.GaussianBlur(filled[...,:3],(0,0),12)
lowx=(8+(cx+rr*.90*np.sin(theta)+.5)*(ww-16)).astype('float32')
lighting=cv2.remap(low,lowx,mapy,cv2.INTER_LINEAR).astype(float)
patch=filled[170:426,280:536,:3].astype(float)
detail=patch-cv2.GaussianBlur(patch,(0,0),3)
def mirror(v,size):
    v=np.mod(v,2*(size-1));return np.where(v<size,v,2*(size-1)-v)
px=mirror(theta*300,256).astype('float32');py=mirror(vv*(hh-16),256).astype('float32')
fur=cv2.remap(detail.astype('float32'),px,py,cv2.INTER_LINEAR)
blend=np.clip((np.abs(theta)-np.radians(55))/np.radians(28),0,1);blend=blend*blend*(3-2*blend)
wrapped=np.clip(front*(1-blend[...,None])+(lighting+fur)*blend[...,None],0,255).astype('uint8')
Image.fromarray(wrapped).save(FACE/'head_surface.png')
# Extra rendered expression states for the later animation checkpoint.
extras=[]
def isolate_extra(name,source,box,kind):
    rgb=np.array(Image.open(ART/source).convert('RGB').crop(box));c=rgb.astype(float)
    if kind=='eye': mask=(c.max(axis=2)<145)
    else: mask=(c[...,0]-c[...,1]>28)&(c[...,0]>c[...,2]*.55)&(c[...,1]<190)
    cnts,_=cv2.findContours(mask.astype('uint8'),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    fill=np.zeros(mask.shape,np.uint8);cv2.drawContours(fill,[max(cnts,key=cv2.contourArea)],-1,255,-1)
    alpha=cv2.GaussianBlur(fill,(3,3),.6)
    rgba=Image.fromarray(np.dstack([rgb,alpha]));bb=rgba.getbbox();rgba=rgba.crop(bb)
    rgba.save(FACE/f'{name}.png');extras.append(dict(name=name,source=source,sourceCrop=box,pixels=rgba.size))
isolate_extra('eye_closed_left','buddy_eyes_closed.png',(350,475,530,560),'eye')
isolate_extra('eye_closed_right','buddy_eyes_closed.png',(725,500,900,585),'eye')
isolate_extra('mouth_o','buddy_expressions.png',(930,737,982,800),'mouth')
isolate_extra('mouth_closed','buddy_expressions.png',(918,242,990,281),'eye')
isolate_extra('mouth_worried','buddy_expressions.png',(1297,740,1379,787),'eye')
(OUT/'extra_face_states.json').write_text(json.dumps(extras,indent=2))
