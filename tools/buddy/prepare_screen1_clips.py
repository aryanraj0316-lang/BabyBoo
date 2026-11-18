"""Prepare reviewed video frames as transparent OTA-compatible image atlases."""
from pathlib import Path
import json
import hashlib
import cv2
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'design/screen1/gemini_review'
OUT=ROOT/'assets/onboarding/screen1/buddy/clips'
OUT.mkdir(exist_ok=True)
edl=json.loads((BASE/'assembly_preview/edit_decisions.json').read_text())
FPS=24; COLS=6; ROWS=6; W=320; H=318; PAD=2; CW=W+PAD*2; CH=H+PAD*2
UNTIL=21.5
clip5=BASE/'clip05/gemini_clip05_celebrate_original.mp4'
edl['sourceSha256']['05']='1dd165031c738322facdb013a69fd0971b905e539903d28f84347a6bfb2992ee'
edl['registrations']['05']=edl['registrations']['04']
# Every moving span uses the original source speed (one source second per
# story second). Trimming unused material shortens the loop to21.5 seconds.
segments=[(0,4,'01',0,4),(4,6.4,'02',1.1,3.5),(6.4,8.6,'02',3.5,5.7),
 (8.6,9.85,'03',1.125,2.375),(9.85,10.3,'03',2.375,2.825),
 (10.3,13,'03',2.825,5.525),(13,13.4,'04',1.5,1.9),
 (13.4,13.65,'04',1.9,2.15),(13.65,14.65,'04',2.65,3.65),
 (14.65,16.5,'04',3.65,5.5),(16.5,21.5,'05',1.5,6.5)]
assert all(abs((b-a)-(end-start))<1e-6 for a,b,_,start,end in segments)
schedule=[]
for i in range(round(UNTIL*FPS)):
    t=i/FPS;a,b,sid,start,end=next(e for e in segments if e[0]<=t<e[1])
    frame=round((start+t-a)*24)
    schedule.append((sid,frame))
unique=list(dict.fromkeys(schedule));lookup={key:i for i,key in enumerate(unique)}
frames={};bounds=[]
registration_stats={}
for sid in ['01','02','03','04','05']:
    path=next((BASE/f'clip{sid}').glob('gemini*original.mp4'))
    assert hashlib.sha256(path.read_bytes()).hexdigest()==edl['sourceSha256'][sid]
    needed={f for s,f in unique if s==sid}
    mat=np.asarray(edl['registrations'][sid]['fixedAffine'],np.float32)
    cap=cv2.VideoCapture(str(path));i=0
    shifts=[]
    while True:
        ok,bgr=cap.read()
        if not ok:break
        if i in needed:
            f=cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB).astype(np.float32)
            diff=f[:,:,1]-np.maximum(f[:,:,0],f[:,:,2])
            seed=((diff < -12)&(f[:,:,2]>70)).astype(np.uint8)
            contours,_=cv2.findContours(seed,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
            contour=max(contours,key=cv2.contourArea)
            body=np.zeros(seed.shape,np.uint8);cv2.drawContours(body,[contour],-1,255,cv2.FILLED)
            interior=(cv2.erode(body,np.ones((5,5),np.uint8))>0)&(diff<18)
            vicinity=cv2.dilate(body,np.ones((11,11),np.uint8))>0
            a=np.clip((18-diff)/40,0,1);a[~vicinity]=0;a[interior]=1
            bg=np.median(f[(diff>70)&(~vicinity)],axis=0)
            edge=(a>.01)&(a<1);correct=f.copy()
            correct[edge]=np.clip((f[edge]-(1-a[edge,None])*bg)/a[edge,None],0,255)
            assert np.array_equal(correct[interior],f[interior])
            rgba=np.dstack((correct*a[:,:,None],a*255))
            # Register the planted feet, not the changing head/arm silhouette.
            by=np.where(body>0)[0];bottom=int(by.max())
            _,foot_x=np.where(body[max(0,bottom-45):bottom+1]>0)
            foot_center=(float(foot_x.min())+float(foot_x.max()))/2
            stable=mat.copy()
            stable[0,2]=160-stable[0,0]*foot_center
            stable[1,2]=310-stable[1,1]*bottom
            shifts.append(float(stable[0,2]-mat[0,2]))
            rgba=cv2.warpAffine(rgba,stable,(W,H),flags=cv2.INTER_AREA,borderMode=cv2.BORDER_CONSTANT)
            alpha=rgba[:,:,3]/255;rgb=np.zeros((H,W,3),np.float32)
            np.divide(rgba[:,:,:3],alpha[:,:,None],out=rgb,where=alpha[:,:,None]>.001)
            result=np.dstack((rgb,rgba[:,:,3]));result=np.rint(np.clip(result,0,255)).astype(np.uint8)
            yy,xx=np.where(result[:,:,3]>8)
            assert len(xx)>0 and xx.min()>0 and yy.min()>0 and xx.max()<W-1 and yy.max()<H-1,'Clipped sprite'
            frames[(sid,i)]=Image.fromarray(result)
            bounds.append([int(xx.min()),int(yy.min()),int(xx.max()),int(yy.max())])
        i+=1
    registration_stats[sid]={'minCorrectionX':min(shifts),'maxCorrectionX':max(shifts),'anchor':'foot silhouette midpoint / baseline310'}
    cap.release();print(f'Keyed clip{sid}: {len(needed)} frames',flush=True)
assert len(frames)==len(unique)
atlases=[]
for start in range(0,len(unique),COLS*ROWS):
    chunk=unique[start:start+COLS*ROWS];rows=(len(chunk)+COLS-1)//COLS
    sheet=Image.new('RGBA',(COLS*CW,rows*CH))
    for j,key in enumerate(chunk):sheet.paste(frames[key],((j%COLS)*CW+PAD,(j//COLS)*CH+PAD))
    name=f'buddy-clip-atlas-{len(atlases):02d}.webp';p=OUT/name
    sheet.save(p,'WEBP',quality=88,method=4,alpha_quality=100,exact=True)
    decoded=Image.open(p);assert decoded.size==sheet.size
    assert np.array_equal(np.asarray(decoded.getchannel('A')),np.asarray(sheet.getchannel('A'))),'Alpha changed'
    atlases.append({'file':name,'width':sheet.width,'height':sheet.height,'bytes':p.stat().st_size})
index=[lookup[k] for k in schedule]
target=ROOT/'src/onboarding/screen1/buddyClips.generated.ts'
requires=',\n'.join("  require('../../../assets/onboarding/screen1/buddy/clips/"+a['file']+"')" for a in atlases)
target.write_text('// Generated by tools/buddy/prepare_screen1_clips.py. Existing reviewed video pixels only.\n'
    +f'export const CLIP_FPS = {FPS};\nexport const CLIP_UNTIL = {UNTIL};\n'
    +f'export const CLIP_TILE = {{ width: {W}, height: {H}, cellWidth: {CW}, cellHeight: {CH}, padding: {PAD}, columns: {COLS}, perAtlas: {COLS*ROWS} }} as const;\n'
    +'export const CLIP_FRAME_INDEX: readonly number[] = '+json.dumps(index)+';\n'
    +'export const CLIP_SEGMENTS = '+json.dumps(segments)+' as const;\n',encoding='utf-8')
(ROOT/'src/onboarding/screen1/buddyClipAssets.generated.ts').write_text(
    '// Generated local transparent assets; old source frames remain intact.\n'
    +'export const CLIP_ATLASES = [\n'+requires+'\n] as const;\n',encoding='utf-8')
report={'fps':FPS,'watchingFps':24,'until':UNTIL,'loop':21.5,'segments':segments,'sourceSpeed':1,'timelineFrames':len(index),'uniqueFrames':len(unique),'atlases':atlases,
    'downloadBytes':sum(a['bytes'] for a in atlases),'decodedRgbaBytes':sum(a['width']*a['height']*4 for a in atlases),
    'sourceSha256':edl['sourceSha256'],'alphaUnchangedAfterWebp':True,'noClippedSprites':True,
    'registration':edl['registrations'],'stabilization':registration_stats,'clip5':'Celebration/wave/rest original source1.5-6.5s',
    'note':'RGB WebPquality88; lossless alpha; opaque source artwork protected before encoding. No new artwork or motion.'}
(BASE/'assembly_preview/production-assets.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:report[k] for k in ['uniqueFrames','downloadBytes','decodedRgbaBytes']}),flush=True)
