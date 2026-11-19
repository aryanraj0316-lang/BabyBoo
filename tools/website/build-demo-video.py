"""Edit existing Android footage into the website's branded app walkthrough."""
from pathlib import Path
import cv2,numpy as np,subprocess,json
from PIL import Image,ImageDraw,ImageFont,ImageFilter
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'design/website-demo';OUT.mkdir(exist_ok=True)
SRC=ROOT/'design/screen1/gemini_review/integration/screen1-final-phone.mp4'
FONT=ROOT/'public/fonts/nunito-variable.ttf'
def font(size,weight=750):
 f=ImageFont.truetype(str(FONT),size)
 try:f.set_variation_by_axes([weight])
 except Exception:pass
 return f
W,H=720,1280;yy,xx=np.mgrid[:H,:W];glow=np.exp(-(((xx-640)/520)**2+((yy-550)/850)**2))
arr=np.zeros((H,W,3));arr[:]=[14,12,23];arr+=glow[:,:,None]*np.array([20,11,31]);BG=Image.fromarray(arr.astype('uint8'))
draw=ImageDraw.Draw(BG);draw.arc((-600,820,1300,2300),190,310,fill='#513663',width=2)
shadow=Image.new('RGBA',(W,H));sd=ImageDraw.Draw(shadow);sd.ellipse((135,1018,585,1060),fill=(0,0,0,150));shadow=shadow.filter(ImageFilter.GaussianBlur(20));BG.paste(shadow,(0,0),shadow)
cap=cv2.VideoCapture(str(SRC));frames=[]
while True:
 ok,bgr=cap.read()
 if not ok:break
 frames.append(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB))
sourcefps=cap.get(cv2.CAP_PROP_FPS);cap.release()
phases=[(0,'A gentler way to say goodbye.','Screen time, with a softer ending.'),(3.5,'Time is nearly up.','A familiar low-battery cue appears.'),(7,'The phone appears to switch off.','A quiet pause replaces the argument.'),(11.4,'Parents stay in control.','Draw your private A gesture to unlock.'),(15.6,'Back in your hands.','The phone wakes. You decide what is next.')]
def centered(d,text,y,f,fill):d.text(((W-d.textlength(text,font=f))/2,y),text,font=f,fill=fill)
video=ROOT/'public/babyboo-app-demo.mp4';proc=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','24','-i','-','-an','-c:v','libx264','-crf','20','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',str(video)],stdin=subprocess.PIPE)
samples=[]
for i in range(480):
 t=i/24;im=BG.copy();d=ImageDraw.Draw(im)
 centered(d,'BabyBoo',44,font(35,900),'#fbf8ff')
 centered(d,'A GENTLER END TO SCREEN TIME',105,font(15,650),'#bda2d7')
 # Crop only the demonstrated phone; exclude personal status bar and app CTA.
 f=frames[min(round(min(t,18.5)*sourcefps),len(frames)-1)]
 phone=Image.fromarray(f[215:978,70:685]).resize((640,794),Image.Resampling.LANCZOS)
 mask=Image.new('L',phone.size);ImageDraw.Draw(mask).rounded_rectangle((0,0,639,793),radius=32,fill=255)
 im.paste(phone,(40,195),mask)
 d=ImageDraw.Draw(im);d.rounded_rectangle((39,194,680,989),radius=33,outline='#5e4a6d',width=2)
 _,title,desc=next(p for p in reversed(phases)if t>=p[0])
 centered(d,title,1060,font(28,850),'#faf7fd');centered(d,desc,1106,font(20,500),'#c3b8cf')
 for j,p in enumerate(phases):
  x=210+j*62;d.rounded_rectangle((x,1169,x+42,1172),radius=2,fill='#c79dee'if t>=p[0]else'#46394f')
 centered(d,'Recorded in BabyBoo · Onboarding walkthrough',1220,font(14,500),'#a99ab7')
 if t>=18.5:
  overlay=Image.new('RGBA',(W,H),(14,12,23,235));im=Image.alpha_composite(im.convert('RGBA'),overlay).convert('RGB');d=ImageDraw.Draw(im)
  centered(d,'BabyBoo',474,font(64,900),'#fcf8ff');centered(d,'A calmer goodbye.',565,font(35,800),'#c49aeb');centered(d,'Screen time ends. Connection stays.',625,font(23,500),'#d2c5df')
  centered(d,'Explore BabyBoo below',727,font(19,650),'#faf7fd')
 if i in [0,96,192,288,384,456]:samples.append((t,im.copy()))
 if i==48:im.save(ROOT/'public/babyboo-app-demo-poster.jpg',quality=95)
 proc.stdin.write(np.asarray(im).tobytes())
proc.stdin.close();assert proc.wait()==0
sheet=Image.new('RGB',(1080,1280),'#0e0c17');d=ImageDraw.Draw(sheet)
for i,(t,im)in enumerate(samples):
 im.thumbnail((350,600));x=i%3*360;y=i//3*640;sheet.paste(im,(x,y+25));d.text((x+8,y+5),f'{t:.1f}s',fill='white')
sheet.save(OUT/'edit-contact.jpg',quality=95)
(OUT/'edit.json').write_text(json.dumps({'source':str(SRC),'type':'edited real Android recording of in-app onboarding demonstration; not a live session recording','duration':20,'fps':24,'dimensions':[W,H],'audio':False,'bytes':video.stat().st_size,'sourceAppChanged':False},indent=2));print('Rendered20second branded app walkthrough',video.stat().st_size,flush=True)
