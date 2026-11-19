"""Video compositing trial: donor head67c27c23, writing body580657ec."""
from pathlib import Path
import cv2,numpy as np,subprocess,json
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'design/screen2/head_merge_67c27c23'
BODY=ROOT/'design/screen2/gemini_580657ec/original.mp4';HEAD=OUT/'head_source_original.mp4'
def matte(rgb):
 f=rgb.astype(np.float32);diff=f[:,:,1]-np.maximum(f[:,:,0],f[:,:,2]);seed=((diff<-12)&(f[:,:,2]>70)).astype('uint8')
 cs,_=cv2.findContours(seed,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE);body=np.zeros(seed.shape,'uint8');cv2.drawContours(body,[max(cs,key=cv2.contourArea)],-1,255,cv2.FILLED)
 inside=(cv2.erode(body,np.ones((5,5),'uint8'))>0)&(diff<18);vic=cv2.dilate(body,np.ones((11,11),'uint8'))>0
 a=np.clip((18-diff)/40,0,1);a[~vic]=0;a[inside]=1;bg=np.median(f[::8,::8][((diff>70)&(~vic))[::8,::8]],axis=0)
 edge=(a>.01)&(a<1);f[edge]=np.clip((f[edge]-(1-a[edge,None])*bg)/a[edge,None],0,255)
 return np.dstack((f*a[:,:,None],a*255))
def over(top,bottom):
 a=top[:,:,3:4]/255;return np.concatenate((top[:,:,:3]+bottom[:,:,:3]*(1-a),top[:,:,3:4]+bottom[:,:,3:4]*(1-a)),axis=2)
def compose(body,head):
 b=matte(body);h=matte(head);hh,ww=b.shape[:2];yy,xx=np.mgrid[:hh,:ww]
 # Cut at the existing collar; restore the original pen/paw as foreground.
 keep=np.clip((yy-475)/10,0,1).astype(np.float32)
 base=b*keep[:,:,None]
 mask=np.zeros((hh,ww),np.uint8)
 cv2.ellipse(mask,(640,272),(187,160),0,0,360,255,-1)
 cv2.ellipse(mask,(497,151),(77,79),0,0,360,255,-1)
 cv2.ellipse(mask,(777,150),(78,80),0,0,360,255,-1)
 mask[:300]=255
 mask=cv2.GaussianBlur(mask,(5,5),.8).astype(float)/255
 h*=mask[:,:,None]
 # Fixed registration preserves the donor's real head turn/nod.
 h=cv2.warpAffine(h,np.float32([[1,0,20],[0,1,55]]),(ww,hh),flags=cv2.INTER_LINEAR)
 result=over(h,base)
 foreground=np.zeros((hh,ww),np.uint8)
 pts=np.array([[551,427],[568,430],[599,474],[618,517],[596,530],[535,545],[485,518],[471,481],[487,450],[521,435]])
 cv2.fillPoly(foreground,[pts],255);foreground=cv2.GaussianBlur(foreground,(5,5),.7)/255
 result=over(b*foreground[:,:,None],result)
 return result
if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser();parser.add_argument('--preview',action='store_true');args=parser.parse_args()
 bc=cv2.VideoCapture(str(BODY));hc=cv2.VideoCapture(str(HEAD));samples=[]
 times=[0,2,4,6,8,9.9] if args.preview else [i/24 for i in range(240)]
 proc=None
 if not args.preview:proc=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s','640x636','-r','24','-i','-','-an','-c:v','libx264','-crf','17','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/'merged-context-preview.mp4')],stdin=subprocess.PIPE)
 for i,t in enumerate(times):
  if args.preview:
   bc.set(cv2.CAP_PROP_POS_MSEC,t*1000);hc.set(cv2.CAP_PROP_POS_MSEC,max(1.8,t)*1000)
   ok,b=bc.read();ok2,h=hc.read()
  else:
   ok,b=bc.read()
   if i==0:
    hc.set(cv2.CAP_PROP_POS_FRAMES,43);ok2,held_head=hc.read()
   if i<=43:h=held_head;ok2=True
   else:ok2,h=hc.read()
  assert ok and ok2
  r=compose(cv2.cvtColor(b,cv2.COLOR_BGR2RGB),cv2.cvtColor(h,cv2.COLOR_BGR2RGB))
  # Fixed crop/layout, no face reshaping or regenerated pixels.
  r=r[35:700,300:940];r=cv2.resize(r,(640,636),interpolation=cv2.INTER_AREA)
  a=r[:,:,3:4]/255;rgb=np.rint(np.clip(r[:,:,:3]+(1-a)*np.array([250,248,245]),0,255)).astype('uint8')
  if proc:proc.stdin.write(rgb.tobytes())
  if args.preview or i in [0,48,96,144,192,239]:samples.append((t,Image.fromarray(rgb)))
 if proc:proc.stdin.close();assert proc.wait()==0
 sheet=Image.new('RGB',(1440,700),'#faf8f5');d=ImageDraw.Draw(sheet)
 for i,(t,im) in enumerate(samples):
  im.thumbnail((320,320));x=i%3*480;y=i//3*350;sheet.paste(im,(x+80,y+24));d.text((x+10,y+5),f'Merged {t:.2f}s',fill='black')
 sheet.save(OUT/('merge-still-trial.jpg' if args.preview else 'merged-video-contact.jpg'),quality=95)
 print('Prepared compositing trial',flush=True)
