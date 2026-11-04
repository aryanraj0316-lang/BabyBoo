"""Checkpoint A: inventory and contact sheets of existing assets, no processing."""
import json,hashlib
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'design/buddy/image_frame_audit';OUT.mkdir(exist_ok=True)
ASSETS=ROOT/'assets/onboarding/screen1/buddy'
ROWS=[
 ('watching','watch_34_left','Reels / 0-7s','turnaround: top-middle'),
 ('concerned','worried_wavy','Battery alert / 7.6s','expressions: bottom-right'),
 ('worried','worried_paws','Critical drain / below 10%','actions: top-right'),
 ('yawning','yawn','Power off / 12.5-14s','actions: bottom-left'),
 ('sleepy','sleepy','Dark rest / 14-15.5s','actions: bottom-middle'),
 ('surprised','surprised','Wake tap / 15.5s','expressions: bottom third'),
 ('pointing','point_left','Swipe up / 17.2-18.1s','actions: bottom-right, pre-mirrored'),
 ('celebrating','arms_up','Unlocked / 19s','joy: top-right'),
 ('waving','wave','After celebration / before 21.5s','joy: top-left'),
 ('idle','happy_front','Rest / 21.5-23.2s','celebrate: bottom-right'),
]
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
manifest=json.loads((ASSETS/'manifest.json').read_text())
report=[]
for state,key,event,source in ROWS:
    path=ASSETS/f'buddy_{key}@3x.webp'
    im=Image.open(path).convert('RGBA');hist=im.getchannel('A').histogram()
    report.append(dict(state=state,path=path.relative_to(ROOT).as_posix(),size=list(im.size),bytes=path.stat().st_size,alpha_bounds=list(im.getchannel('A').getbbox()),transparent_pixels=hist[0],partial_alpha_pixels=sum(hist[1:255]),source=source,approved_story_event=event,sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
for kind,color,ink in [('dark','#1A1A1E','#F6F3FF'),('light','#F6F3FF','#292233')]:
    board=Image.new('RGB',(1600,1100),color);draw=ImageDraw.Draw(board)
    draw.text((24,15),'CHECKPOINT A / EXISTING BUDDY IMAGE FRAMES',font=font(28),fill=ink)
    draw.text((24,54),'Same 160 x 159 pt canvas, shared baseline / no pose edits / labels use the approved 24s story',font=font(19),fill=ink)
    for i,((state,key,event,source),info) in enumerate(zip(ROWS,report)):
        x=(i%5)*320;y=100+(i//5)*440
        draw.text((x+12,y),state.upper(),font=font(23),fill=ink)
        draw.text((x+12,y+33),event,font=font(15),fill=ink)
        # Same uniform scale for all existing canvases; no per-pose fitting.
        im=Image.open(ROOT/info['path']).convert('RGBA');im=im.resize((288,286),Image.Resampling.LANCZOS)
        panel=Image.new('RGBA',im.size,color);panel.alpha_composite(im);board.paste(panel.convert('RGB'),(x+16,y+63))
        baseline=y+63+round(manifest['baselinePt']*1.8)
        draw.line((x+10,baseline,x+310,baseline),fill='#77717E',width=1)
        draw.line((x+160,baseline-4,x+160,baseline+4),fill='#77717E',width=1)
        draw.text((x+12,y+359),f'buddy_{key}',font=font(16),fill=ink)
        draw.text((x+12,y+381),'@3x.webp / '+str(round(info['bytes']/1024))+' KiB',font=font(15),fill=ink)
        draw.text((x+12,y+405),source,font=font(14),fill=ink)
    draw.text((24,1003),'REFERENCE: buddy_master.png / Current implementation is 11s; final brief is 24s. No app changes in this audit.',font=font(18),fill=ink)
    draw.text((24,1035),'Concerned/worried order is a proposal. Sleepy also covers dark rest. Existing point-left frame is already mirrored.',font=font(18),fill=ink)
    board.save(OUT/f'selected_frames_{kind}.png')
    if kind=='light':
        master=Image.open(ROOT/'design/buddy/buddy_master.png').convert('RGB');master.thumbnail((220,220),Image.Resampling.LANCZOS)
        # Separate reference card: avoid obscuring any selected pose or label.
        master.save(OUT/'master_reference.jpg',quality=95)
inventory=[]
for path in sorted(ASSETS.glob('*.webp')):
    im=Image.open(path)
    inventory.append(dict(path=path.relative_to(ROOT).as_posix(),size=list(im.size),bytes=path.stat().st_size,mode=im.mode))
(OUT/'asset_audit.json').write_text(json.dumps({'selected':report,'existing_webp_inventory':inventory,'normalization':manifest,'runtime_loop_seconds':11,'approved_brief_loop_seconds':24},indent=2))
print(json.dumps({'selected_count':len(report),'existing_webp_count':len(inventory),'selected_bytes':sum(r['bytes'] for r in report),'all_transparent':all(r['transparent_pixels']>0 and r['partial_alpha_pixels']>0 for r in report),'dimensions':sorted(set(tuple(r['size']) for r in report))},indent=2))
