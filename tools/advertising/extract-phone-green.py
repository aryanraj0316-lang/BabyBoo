"""Render only the existing onboarding phone and native A tutorial on chroma green."""
from pathlib import Path
import cv2,numpy as np,subprocess,json,math
from PIL import Image,ImageDraw,ImageFilter
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'design/onboarding-unlock-demo';SRC=ROOT/'design/screen1/gemini_review/integration/screen1-final-phone.mp4'
cap=cv2.VideoCapture(str(SRC))
def grab(t):
 cap.set(cv2.CAP_PROP_POS_MSEC,t*1000);ok,f=cap.read();assert ok
 f=cv2.cvtColor(f,cv2.COLOR_BGR2RGB)
 # Restore only Buddy-occluded lower-right phone; nativehand is rendered separately.
 f[640:927,340:421]=f[640:927,89:170][:,::-1]
 return Image.fromarray(f).convert('RGBA')
black=grab(8);home=grab(16.7);cap.release()
mask=Image.new('L',(347*4,695*4));d=ImageDraw.Draw(mask);d.rounded_rectangle((36,28,1356,2748),radius=288,fill=255)
for box in [(6,143,11,182),(6,201,11,258),(337,174,342,247)]:d.rounded_rectangle(tuple(v*4 for v in box),radius=12,fill=255)
mask=Image.fromarray(cv2.erode(np.asarray(mask.resize((347,695),Image.Resampling.LANCZOS)),np.ones((3,3),np.uint8)))
hand=Image.open(ROOT/'assets/onboarding/screen1/parent-hand.webp').convert('RGBA');ha=np.asarray(hand).astype(np.float32);ha[:,:,:3]*=ha[:,:,3:4]/255
strokes=[[[.21,.72],[.25,.69],[.285,.58],[.315,.54],[.35,.49],[.385,.435],[.408,.395],[.432,.36],[.465,.30],[.486,.314],[.502,.322],[.507,.375],[.522,.412],[.545,.475],[.578,.54],[.595,.574],[.622,.642],[.654,.702],[.695,.73]],[[.29,.58],[.36,.56],[.39,.589],[.45,.574],[.52,.565],[.57,.548],[.66,.552]]]
def points(raw):
 out=[]
 for k in range(0,len(raw)-1,3):
  ps=np.array(raw[k:k+4],float)
  for u in np.linspace(0,1,65):
   v=(1-u)**3*ps[0]+3*(1-u)**2*u*ps[1]+3*(1-u)*u*u*ps[2]+u**3*ps[3];out.append((101+v[0]*306,258+v[1]*656))
 return np.array(out)
paths=[points(s) for s in strokes]
def partial(pts,p):
 distances=np.r_[0,np.cumsum(np.linalg.norm(np.diff(pts,axis=0),axis=1))];target=distances[-1]*max(0,min(1,p));k=min(len(pts)-2,max(0,np.searchsorted(distances,target)-1));last=pts[k]+(pts[k+1]-pts[k])*((target-distances[k])/max(.0001,distances[k+1]-distances[k]));return np.vstack([pts[:k+1],last])
def ease(v):v=max(0,min(1,v));return v*v*(3-2*v)
p=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s','1080x1920','-r','30','-i','-','-an','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/'BabyBoo_Phone_A_Unlock_Green.mp4')],stdin=subprocess.PIPE)
for i in range(240):
 t=i/30;wake=ease((t-4.4)/.7);im=Image.blend(black,home,wake);d=ImageDraw.Draw(im);progress=max(0,min(1,(t-1.15)/2.8));main=partial(paths[0],ease(progress/.72));bar=partial(paths[1],ease((progress-.82)/.18));opacity=1-ease((t-4.25)/.4)
 if t>=1.15:
  overlay=Image.new('RGBA',im.size);od=ImageDraw.Draw(overlay)
  for segment in [main,bar]:
   if len(segment)>1:od.line([tuple(x)for x in segment],fill=(238,241,254,round(255*opacity)),width=10,joint='curve');
  im.alpha_composite(overlay)
 if .75<t<4.7 and not(.72<progress<.82):
  pt=(bar if progress>=.72 else main)[-1];a=ease((t-.75)/.3)*(1-ease((t-4.25)/.4));glow=Image.new('RGBA',im.size);gd=ImageDraw.Draw(glow);x,y=pt;gd.ellipse((x-22,y-22,x+22,y+22),fill=(106,134,251,round(a*125)));im.alpha_composite(glow.filter(ImageFilter.GaussianBlur(8)));dd=ImageDraw.Draw(im);dd.ellipse((x-17,y-17,x+17,y+17),fill=(91,116,238,round(a*255)));dd.ellipse((x-11,y-11,x+11,y+11),fill=(238,241,254,round(a*255)))
  angle=.12*math.sin(progress*math.pi*2);skew=.035*math.sin(progress*math.pi);scale=153/hand.width;rot=np.array([[math.cos(angle),-math.sin(angle)],[math.sin(angle),math.cos(angle)]]);matrix=scale*rot@np.array([[1,skew],[0,1]]);tip=np.array([.14*hand.width,.11*hand.height]);affine=np.c_[matrix,pt-matrix@tip].astype(np.float32);warped=cv2.warpAffine(ha,affine,(720,1600));alpha=warped[:,:,3:4]/255;rgb=np.zeros_like(warped[:,:,:3]);np.divide(warped[:,:,:3],alpha,out=rgb,where=alpha>.001);rgba=np.dstack((rgb,warped[:,:,3]*a*.82));im.alpha_composite(Image.fromarray(np.clip(rgba,0,255).astype(np.uint8)))
 phone=im.crop((80,240,427,935));phone.putalpha(mask);phone=phone.convert('RGBa').resize((720,1442),Image.Resampling.LANCZOS).convert('RGBA');bg=Image.new('RGBA',(1080,1920),'#00FF00');bg.alpha_composite(phone,(180,239));result=bg.convert('RGB')
 if i==70:result.save(OUT/'phone-green-preview.png')
 p.stdin.write(np.asarray(result).tobytes())
p.stdin.close();assert p.wait()==0
(OUT/'phone-green-edit.json').write_text(json.dumps({'source':str(SRC),'duration':8,'fps':30,'dimensions':[1080,1920],'background':'#00FF00','processing':'Existing recorded phone black/home states extracted, Buddy occlusion repaired with mirrored phone edge. Native onboarding A cubicpath and existing parent-hand.webp rendered separately to avoid source Buddy overlap hiding the parent hand. No mascot or page copy.'},indent=2));print('Phone-only native gesture finished')
