"""Label the encoded half-second QA sheet and check source-pose cadence/alpha bounds."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2];OUT=ROOT/'design/prebooking/cinematic'
sheet=Image.open(OUT/'contact-sheet-0.5s.jpg').convert('RGB');d=ImageDraw.Draw(sheet);font=ImageFont.truetype(str(HERE/'assets/font.ttf'),18)
for n in range(30):
 x=(n%6)*270;y=(n//6)*480;d.rounded_rectangle((x+5,y+5,x+83,y+31),radius=5,fill='#100b24');d.text((x+13,y+6),f'{n/2:04.1f}s',font=font,fill='#FFF7EF')
sheet.save(OUT/'contact-sheet-0.5s.jpg',quality=95)
frames=[min(179,int(min(n/30,13.5)*12)) for n in range(450)];holds=[];old=frames[0];run=0
for pose in frames[:405]:
 if pose!=old:holds.append(run);run=0;old=pose
 run+=1
holds.append(run)
assert set(holds)=={2,3},set(holds)
assert len(set(frames[0:30]))==12
bounds=[]
for p in sorted((HERE/'assets/frames').glob('*.png')):
 im=Image.open(p);b=im.getchannel('A').getbbox();assert b and b[0]>0 and b[1]>0 and b[2]<640 and b[3]<636;bounds.append(b)
report=json.loads((OUT/'quality-report.json').read_text());report['sourcePoseChecks']={'fps':12,'holdsAt30fps':sorted(set(holds)),'posesPerFirstSecond':len(set(frames[:30])),'sampledSourceFrames':len(bounds),'sourceAlphaUnclipped':True,'mascotMotion':'Exact bitmap sequence, whole-image bounded stop-motion transforms only'}
report['review']='Decoded0.5s contact sheet and final stills prepared for visual review; see README for observed outcome.'
(OUT/'quality-report.json').write_text(json.dumps(report,indent=2));print(report['sourcePoseChecks'])
