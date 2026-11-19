"""Key existing user video; stabilize seat and export browser-native alpha WebP."""
from pathlib import Path
import cv2,numpy as np,json
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'design/website-mascot-animation/integration';OUT.mkdir(exist_ok=True)
src=ROOT/'design/website-mascot-animation/review_0b5f4e2d/buddy_website_loop_original.mp4'
cap=cv2.VideoCapture(str(src));frames=[];protected=True
while True:
 ok,bgr=cap.read()
 if not ok:break
 rgb=cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB);f=rgb.astype(np.float32)
 diff=f[:,:,1]-np.maximum(f[:,:,0],f[:,:,2])
 seed=((diff < -12)&(f[:,:,2]>70)).astype(np.uint8)
 cs,_=cv2.findContours(seed,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
 body=np.zeros(seed.shape,np.uint8);cv2.drawContours(body,[max(cs,key=cv2.contourArea)],-1,255,cv2.FILLED)
 inside=(cv2.erode(body,np.ones((5,5),np.uint8))>0)&(diff<18)
 vicinity=cv2.dilate(body,np.ones((11,11),np.uint8))>0
 a=np.clip((18-diff)/40,0,1);a[~vicinity]=0;a[inside]=1
 bg=np.median(f[(diff>70)&(~vicinity)],axis=0)
 edge=(a>.01)&(a<1);correct=f.copy();correct[edge]=np.clip((f[edge]-(1-a[edge,None])*bg)/a[edge,None],0,255)
 assert np.array_equal(correct[inside],f[inside])
 yy,xx=np.where(body>0);bottom=int(yy.max());_,feet=np.where(body[bottom-45:bottom+1]>0);cx=(feet.min()+feet.max())/2
 scale=.69;mat=np.float32([[scale,0,240-scale*cx],[0,scale,465-scale*bottom]])
 rgba=cv2.warpAffine(np.dstack((correct*a[:,:,None],a*255)),mat,(480,477),flags=cv2.INTER_AREA)
 alpha=rgba[:,:,3]/255;colour=np.zeros((477,480,3),np.float32);np.divide(rgba[:,:,:3],alpha[:,:,None],out=colour,where=alpha[:,:,None]>.001)
 frames.append(Image.fromarray(np.rint(np.clip(np.dstack((colour,rgba[:,:,3])),0,255)).astype(np.uint8)))
cap.release()
# A short dissolve between nearly matching whole poses removes the seam snap.
# Blend premultiplied colour to preserve clean transparent fur edges.
first=np.array(frames[0]).astype(np.float32);first[:,:,:3]*=first[:,:,3:4]/255
for j in range(6):
 i=len(frames)-6+j;v=np.array(frames[i]).astype(np.float32);v[:,:,:3]*=v[:,:,3:4]/255
 t=(j+1)/6;v=v*(1-t)+first*t;a=v[:,:,3:4]/255
 np.divide(v[:,:,:3],a,out=v[:,:,:3],where=a>.001)
 frames[i]=Image.fromarray(np.rint(np.clip(v,0,255)).astype(np.uint8))
asset=ROOT/'public/buddy-idle-loop.webp'
frames[0].save(asset,save_all=True,append_images=frames[1:],duration=[round((i+1)*1000/24)-round(i*1000/24) for i in range(len(frames))],loop=0,quality=83,method=3,alpha_quality=100,minimize_size=True)
decoded=Image.open(asset);assert decoded.n_frames==len(frames)
sheet=Image.new('RGB',(1200,660),'#0e0c17');d=ImageDraw.Draw(sheet)
for n,i in enumerate([0,24,48,72,96,120,144,168,192,216,234,239]):
 decoded.seek(i);im=decoded.convert('RGBA');im.thumbnail((196,290));x=n%6*200;y=n//6*330
 sheet.paste(im,(x,y+25),im);d.text((x+5,y+5),f'{i/24:.2f}s',fill='white')
sheet.save(OUT/'dark-background-review.jpg',quality=95)
decoded.seek(0);first=np.array(decoded.convert('RGBA'));decoded.seek(decoded.n_frames-1);last=np.array(decoded.convert('RGBA'))
report={'frames':len(frames),'size':[480,477],'durationMs':10000,'bytes':asset.stat().st_size,'opaqueSourceInteriorProtectedBeforeEncoding':True,'transparentBackground':bool((first[:,:,3]==0).any()),'lastFrameMatchesFirst':bool(np.array_equal(first,last)),'seam':'250ms whole-pose premultiplied dissolve','registration':'fixed scale; planted feet midpoint240/baseline465','sourceArtworkRegenerated':False}
(OUT/'preparation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
