"""Silent 1080x1920 brand end-card. Existing website Buddy pixels; no new mascot art."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,subprocess,json,math
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'design/prebooking';OUT.mkdir(exist_ok=True)
W,H,FPS,SECONDS=1080,1920,24,12
FONT=ROOT/'public/fonts/nunito-variable.ttf'
def font(size,weight=800):
 f=ImageFont.truetype(str(FONT),size)
 try:f.set_variation_by_axes([weight])
 except Exception:pass
 return f
def text(draw,y,value,size=72,fill='#F7F3FA',weight=850):
 f=font(size,weight);box=draw.textbbox((0,0),value,font=f);draw.text(((W-(box[2]-box[0]))/2,y),value,font=f,fill=fill)
yy,xx=np.mgrid[0:H,0:W];glow=np.exp(-(((xx-690)/710)**2+((yy-960)/750)**2))
base=np.zeros((H,W,3),np.uint8)
for c,(a,b) in enumerate([(15,27),(12,17),(24,38)]):base[:,:,c]=a+glow*b
BG=Image.fromarray(base);del xx,yy,glow,base
animation=Image.open(ROOT/'public/buddy-idle-loop.webp')
target=OUT/'BabyBoo_Prebooking_Instagram_1080x1920.mp4'
pipe=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(target)],stdin=subprocess.PIPE)
for n in range(FPS*SECONDS):
 t=n/FPS;im=BG.copy().convert('RGBA');d=ImageDraw.Draw(im)
 # Graphic accents advance on twos; mascot retains its native24fps motion.
 tick=math.floor(t*12)/12;reveal=min(1,tick/.7);ease=1-(1-reveal)**3
 d.arc((-370,400,1460,1650),195,330,fill='#50385F',width=2);d.arc((-500,310,1590,1730),190,335,fill='#2D213B',width=2)
 text(d,105,'BabyBoo.',58,'#F8F4FC',950)
 text(d,214,'COMING TO ANDROID',21,'#B9A7C9',700)
 headline=Image.new('RGBA',(W,280));hd=ImageDraw.Draw(headline)
 if t<3:
  text(hd,5,'Little screens.',87);text(hd,105,'Calmer goodbyes.',87,'#CEAAF0')
 elif t<6:
  text(hd,5,'Time’s up.',87);text(hd,105,'Keep the calm.',87,'#CEAAF0')
 else:
  text(hd,5,'Pre-booking',94);text(hd,115,'is open.',94,'#CEAAF0')
 im.alpha_composite(headline,(0,300+round((1-ease)*24)))
 # Ground is separate from the unchanged transparent mascot.
 shadow=Image.new('RGBA',(W,H));sd=ImageDraw.Draw(shadow)
 for k in range(22,0,-1):sd.ellipse((250-k*4,1340-k,830+k*4,1390+k),fill=(9,5,16,3))
 im.alpha_composite(shadow)
 animation.seek(n%animation.n_frames);buddy=animation.convert('RGBA').convert('RGBa').resize((820,815),Image.Resampling.LANCZOS).convert('RGBA');im.alpha_composite(buddy,(130,565))
 d=ImageDraw.Draw(im)
 if t<3:
  text(d,1425,'A gentler end to screen time.',37,'#C4B8D1',600)
 elif t<6:
  # A concise visual cue explains the simulated shutdown without claiming a recording.
  amount=max(0,3-int((t-3)/.72));d.rounded_rectangle((421,1407,599,1477),radius=14,outline='#D2B2ED',width=3);d.rounded_rectangle((601,1431,611,1453),radius=3,fill='#D2B2ED');
  if amount:d.rounded_rectangle((432,1418,432+int(155*amount/3),1466),radius=6,fill='#CAA7EB')
  text(d,1502,f'{amount}%  ·  A little rest for the phone.',31,'#C4B8D1',600)
 else:
  text(d,1430,'Reserve your launch notification.',36,'#CABDD5',600)
  d.rounded_rectangle((145,1540,935,1664),radius=62,fill='#DFC3F4');text(d,1565,'Link in bio',49,'#24152F',900);d.line((717,1606,743,1580),fill='#24152F',width=4);d.line((720,1580,743,1580,743,1603),fill='#24152F',width=4)
  text(d,1705,'Free to reserve. No payment needed.',26,'#B5A5C2',650)
  text(d,1750,'BabyBoo for Android · Launch date coming soon',22,'#9F91AE',600)
 rgb=im.convert('RGB')
 if n in [36,108,204,276]:rgb.save(OUT/f'ad-frame-{n:03d}.jpg',quality=94)
 pipe.stdin.write(rgb.tobytes())
pipe.stdin.close();assert pipe.wait()==0
# Social sharing thumbnail, with no invented URL or availability claims.
share=BG.resize((1200,630));sd=ImageDraw.Draw(share);sd.text((70,80),'BabyBoo.',font=font(56,950),fill='#F8F4FC');sd.text((70,200),'Pre-booking is open.',font=font(56,850),fill='#D9B8F4');sd.text((70,300),'A gentler goodbye to screen time.',font=font(28,600),fill='#CFC2DA');sd.text((70,435),'Join the Android launch list',font=font(28,800),fill='#F8F4FC');animation.seek(0);b=animation.convert('RGBA').resize((500,497),Image.Resampling.LANCZOS);share.paste(b,(710,100),b);share.save(ROOT/'prebooking/public/share.jpg',quality=92)
(OUT/'ad-spec.json').write_text(json.dumps({'video':str(target),'size':[W,H],'fps':FPS,'duration':SECONDS,'audio':False,'mascotSource':'public/buddy-idle-loop.webp','motion':'Original native24fps mascot; graphics use restrained stepped12fps accents, no new character/body-part animation','timeline':['0-3s Little screens / Calmer goodbyes','3-6s simulated3%-0%battery cue','6-12s Pre-booking is open / Link in bio / free launch notification'],'publicURL':'Not baked in; actual Render hostname awaits deployment'},indent=2))
print(target, target.stat().st_size,flush=True)
