"""Offline timing review of four supplied videos; stills mark missing Clip05."""
from pathlib import Path
import cv2
import numpy as np
import subprocess
import json
import hashlib

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'design/screen1/gemini_review'
OUT = BASE / 'assembly_preview'
OUT.mkdir(exist_ok=True)
FPS = 30
assert json.loads((ROOT/'design/screen1/gemini_handoff/screen1_timing.json').read_text())['loopSeconds'] == 26
sources = {
    '01': BASE/'clip01/gemini_clip01_watch_original.mp4',
    '02': BASE/'clip02/gemini_clip02_concern_original.mp4',
    '03': BASE/'clip03/gemini_clip03_yawn_sleep_original.mp4',
    '04': BASE/'clip04/gemini_clip04_wake_point_original.mp4',
}
# output start/end, source id, source start/end, narrative label
edits = [
    (0,7.6,'01',0,7.6,'Watching reels'),
    (7.6,7.9,'02',1.1,1.55,'Battery concern'),
    (7.9,10.05,'02',1.55,2.8,'Battery concern'),
    (10.05,10.5,'02',2.8,3.5,'Paws rise / low battery'),
    (10.5,12.7,'02',3.5,5.7,'Critical battery'),
    (12.7,13.6,'03',1.125,2.35,'Yawn'),
    (13.6,14.05,'03',2.35,2.8,'Settle into sleep'),
    (14.05,17.5,'03',2.8,6.25,'Peaceful sleep'),
    (17.5,17.9,'04',1.5,1.9,'Wake for parent'),
    (17.9,18.15,'04',1.9,2.15,'Surprised'),
    (18.15,19.05,'04',2.65,3.65,'Point toward unlock'),
    (19.05,21,'04',3.65,5.6,'Point toward unlock'),
    (21,22.2,'08',0,0,'Arms up / STILL PLACEHOLDER'),
    (22.2,23.5,'09',0,0,'Wave pose / STILL PLACEHOLDER'),
    (23.5,25.2,'10',0,0,'Happy rest / STILL PLACEHOLDER'),
    (25.2,26,'01png',0,0,'Watch reset / STILL PLACEHOLDER'),
]
assert edits[0][0] == 0 and edits[-1][1] == 26
assert all(a[1] == b[0] for a,b in zip(edits,edits[1:]))
schedule = []
for i in range(26*FPS):
    t=i/FPS
    e=next(e for e in edits if e[0] <= t < e[1])
    source_t=e[3]+(t-e[0])/(e[1]-e[0])*(e[4]-e[3])
    schedule.append((e[2],min(239,round(source_t*24)),e[5]))

def key(rgb):
    f=rgb.astype(np.float32)
    diff=f[:,:,1]-np.maximum(f[:,:,0],f[:,:,2])
    seed=((diff < -12)&(f[:,:,2] > 70)).astype(np.uint8)
    contours,_=cv2.findContours(seed,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    contour=max(contours,key=cv2.contourArea)
    body=np.zeros(seed.shape,np.uint8)
    cv2.drawContours(body,[contour],-1,255,cv2.FILLED)
    interior=cv2.erode(body,np.ones((5,5),np.uint8))>0
    vicinity=cv2.dilate(body,np.ones((11,11),np.uint8))>0
    alpha=np.clip((18-diff)/40,0,1)
    alpha[~vicinity]=0;alpha[interior]=1
    bg=np.median(f[(diff>70)&(~vicinity)],axis=0)
    edge=(alpha>.01)&(alpha<1)
    corrected=f.copy()
    corrected[edge]=np.clip((f[edge]-(1-alpha[edge,None])*bg)/alpha[edge,None],0,255)
    corrected[alpha==0]=0
    assert np.array_equal(corrected[interior],f[interior])
    return np.dstack((corrected*alpha[:,:,None],alpha*255)),body

cache={};registrations={};source_hashes={}
for sid,path in sources.items():
    needed={f for s,f,_ in schedule if s==sid}
    cap=cv2.VideoCapture(str(path));assert cap.get(cv2.CAP_PROP_FPS)==24
    index=0;mat=None
    while True:
        ok,bgr=cap.read()
        if not ok:break
        if index in needed:
            rgba,body=key(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB))
            if mat is None:
                yy,xx=np.where(body>0)
                bottom=int(yy.max());top=int(yy.min())
                root=float(xx[yy > bottom-.2*(bottom-top)].mean())
                scale=280/(bottom-top+1)
                mat=np.array([[scale,0,160-scale*root],[0,scale,310-scale*bottom]],np.float32)
                registrations[sid]={'sourceFrame':index,'fixedAffine':mat.tolist(),
                    'targetCanvas':[320,318],'targetBaseline':310,'initialVisibleHeight':280}
            small=cv2.warpAffine(rgba,mat,(320,318),flags=cv2.INTER_AREA,borderMode=cv2.BORDER_CONSTANT)
            cache[(sid,index)]=np.rint(np.clip(small,0,255)).astype(np.uint8)
        index+=1
    cap.release()
    assert all((sid,f) in cache for f in needed)
    source_hashes[sid]=hashlib.sha256(path.read_bytes()).hexdigest()
    print(f'Prepared clip{sid}: {len(needed)} selected source frames',flush=True)

for sid,name in [('08','08_buddy_arms_up.png'),('09','09_buddy_wave.png'),
                 ('10','10_buddy_happy_front.png'),('01png','01_buddy_watch_34_left.png')]:
    src=cv2.imread(str(ROOT/'design/screen1/gemini_handoff/upload'/name),cv2.IMREAD_UNCHANGED)
    rgba=cv2.cvtColor(src,cv2.COLOR_BGRA2RGBA).astype(np.float32)
    rgba[:,:,:3]*=rgba[:,:,3,None]/255
    rgba=cv2.resize(rgba,(320,318),interpolation=cv2.INTER_AREA)
    cache[(sid,0)]=np.rint(rgba).astype(np.uint8)

log=(OUT/'encode.log').open('w')
proc=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','warning','-y','-f','rawvideo',
    '-pix_fmt','rgb24','-s','960x640','-r',str(FPS),'-i','-','-an','-c:v','libx264',
    '-crf','18','-preset','fast','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',
    str(OUT/'buddy_26s_timing_preview.mp4')],stdin=subprocess.PIPE,stderr=log)
diagnostics=[]
for i,(sid,frame,label) in enumerate(schedule):
    rgba=cache[(sid,frame)];a=rgba[:,:,3,None].astype(np.float32)/255
    panels=[]
    for color,ink in [((246,243,255),(45,40,55)),((26,26,30),(246,243,255))]:
        panel=np.full((640,480,3),color,np.uint8)
        panel[140:458,80:400]=np.rint(np.clip(rgba[:,:,:3]+(1-a)*np.array(color),0,255)).astype(np.uint8)
        cv2.putText(panel,f'{i/FPS:05.2f}s / 26.00s',(20,40),cv2.FONT_HERSHEY_SIMPLEX,.7,ink,1,cv2.LINE_AA)
        cv2.putText(panel,label,(20,520),cv2.FONT_HERSHEY_SIMPLEX,.53,ink,1,cv2.LINE_AA)
        cv2.putText(panel,'ASSET TIMING REVIEW / APP UNCHANGED',(20,565),cv2.FONT_HERSHEY_SIMPLEX,.43,ink,1,cv2.LINE_AA)
        if i/FPS>=21:cv2.putText(panel,'CLIP 05 MISSING: APPROVED STILL IMAGES',(20,600),cv2.FONT_HERSHEY_SIMPLEX,.43,(190,120,40),1,cv2.LINE_AA)
        panels.append(panel)
    preview=np.concatenate(panels,axis=1)
    proc.stdin.write(preview.tobytes())
    diagnostics.append({'outputTime':i/FPS,'source':sid,'sourceFrame':frame,'label':label})
proc.stdin.close();assert proc.wait()==0;log.close()
(OUT/'edit_decisions.json').write_text(json.dumps({'duration':26,'fps':FPS,'frames':len(schedule),
    'missing':'Clip05 blocked by Gemini video-generation limit; original approved PNG placeholders from21-26s',
    'sourceSha256':source_hashes,'registrations':registrations,'edits':edits,
    'interpolation':'nearest original video frame; no generated motion, optical flow or facial edits',
    'perFrame':diagnostics},indent=2),encoding='utf-8')
print('Rendered 780-frame offline preview; no app files changed.',flush=True)
