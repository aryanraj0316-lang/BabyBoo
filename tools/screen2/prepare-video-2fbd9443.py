from pathlib import Path
import cv2,numpy as np,json,hashlib
from PIL import Image,ImageDraw
ROOT=Path.cwd();out=ROOT/'assets/onboarding/screen2/buddy';review=ROOT/'design/screen2/review_2fbd9443/integration';review.mkdir(parents=True,exist_ok=True)
src=Path('C:/Users/LENOVO/Downloads/gemini_generated_video_2fbd9443.mp4');cap=cv2.VideoCapture(str(src));frames=[]
while True:
 ok,bgr=cap.read()
 if not ok:break
 f=cv2.cvtColor(bgr[:,320:980],cv2.COLOR_BGR2RGB).astype(np.float32)
 diff=f[:,:,1]-np.maximum(f[:,:,0],f[:,:,2]);seed=((diff<-10)&(f[:,:,2]>65)).astype(np.uint8)
 contours,_=cv2.findContours(seed,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE);body=np.zeros(seed.shape,np.uint8);cv2.drawContours(body,[max(contours,key=cv2.contourArea)],-1,255,cv2.FILLED)
 interior=cv2.erode(body,np.ones((5,5),np.uint8))>0;vicinity=cv2.dilate(body,np.ones((7,7),np.uint8))>0
 a=np.clip((20-diff)/40,0,1);a[~vicinity]=0;a[interior]=1
 bg=np.median(f[(diff>40)&(~vicinity)],axis=0);correct=f.copy();edge=(a>.02)&(a<1);correct[edge]=np.clip((f[edge]-(1-a[edge,None])*bg)/a[edge,None],0,255)
 yy,xx=np.where(body>0);bottom=yy.max();_,fx=np.where(body[bottom-35:bottom+1]>0);cx=(fx.min()+fx.max())/2
 scale=.67;mat=np.float32([[scale,0,240-scale*cx],[0,scale,465-scale*bottom]])
 premul=cv2.warpAffine(np.dstack((correct*a[:,:,None],a*255)),mat,(480,477),flags=cv2.INTER_AREA);alpha=premul[:,:,3]/255;rgb=np.zeros((477,480,3),np.float32);np.divide(premul[:,:,:3],alpha[:,:,None],out=rgb,where=alpha[:,:,None]>.001)
 rgba=np.rint(np.clip(np.dstack((rgb,premul[:,:,3])),0,255)).astype(np.uint8);frames.append(Image.fromarray(rgba))
cap.release();asset=out/'buddy-writing-video.webp';frames[0].save(asset,save_all=True,append_images=frames[1:],duration=[round((i+1)*1000/24)-round(i*1000/24) for i in range(len(frames))],loop=1,quality=92,method=1,alpha_quality=100)
for name,i in [('start',0),('end',len(frames)-1)]:frames[i].save(out/f'buddy-writing-{name}.webp',quality=94,alpha_quality=100)
board=Image.new('RGB',(1440,994),'#FBFAF5');draw=ImageDraw.Draw(board)
for n,i in enumerate([0,48,96,144,192,239]):
 bg=Image.new('RGBA',(480,477),'#FBFAF5' if n<3 else '#17251E');bg.alpha_composite(frames[i]);board.paste(bg.convert('RGB'),((n%3)*480,(n//3)*497));draw.text(((n%3)*480+12,(n//3)*497+478),f'{i/24:.1f}s',fill='#777777')
board.save(review/'keyed-contact.jpg');(review/'preparation.json').write_text(json.dumps({'source':str(src),'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'frames':len(frames),'fps':24,'bytes':asset.stat().st_size,'size':[480,477],'processing':'Chroma removal, protected interior pen/card, planted feet registration; no facial edits, no synthesized motion'},indent=2));print(len(frames),asset.stat().st_size)
