"""Package existing Screen 1 references losslessly; no new art or app edits."""
from pathlib import Path
from datetime import datetime
import csv
import hashlib
import json
import shutil
import subprocess
import zipfile
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'design/screen1/gemini_handoff'
UPLOAD=OUT/'upload'; WEBP=OUT/'source_webp'
UPLOAD.mkdir(parents=True,exist_ok=True); WEBP.mkdir(exist_ok=True)
timing=json.loads((OUT/'screen1_timing.json').read_text())
assert timing['loopSeconds']==26,'The app timeline changed; update the authored prompt before repackaging.'
expected=['watch_34_left','worried_wavy','worried_paws','yawn','sleepy','surprised','point_left','arms_up','wave','happy_front']
titles=['Watching the phone','Mild battery concern','Critical battery / paws','Gentle yawn','Peacefully sleepy','Parent / surprised','Point toward phone LEFT','Unlocked / arms raised','One friendly wave','Happy seated rest']
order=list(dict.fromkeys(f['id'] for f in timing['buddyFrames']))
assert order==expected,'Frame map changed; review the prompt file names.'
events=timing['buddyFrames']
assert events[0]['from']==0 and events[-1]['to']==26
for a,b in zip(events,events[1:]):assert a['to']==b['from']
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
master=ROOT/'design/buddy/buddy_master.png'
shutil.copyfile(master,UPLOAD/'00_buddy_master.png')
assert sha(master)==sha(UPLOAD/'00_buddy_master.png')
manifest={'createdAt':datetime.now().astimezone().isoformat(timespec='seconds'),
 'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
 'scope':'Existing approved Screen 1 artwork only. No new mascot artwork or app changes.',
 'loopSeconds':26,'sourceCanvasPx':[480,477],'logicalCanvasPt':[160,159],'baselinePt':155,'headWidthPt':106,
 'master':{'source':str(master.relative_to(ROOT)),'upload':'upload/00_buddy_master.png','sha256':sha(master),'byteIdentical':True},'frames':[]}
artifacts=[OUT/'GEMINI_PROMPT.md',OUT/'README.md',OUT/'screen1_timing.json',UPLOAD/'00_buddy_master.png']
for i,frame_id in enumerate(order,1):
    row=next(f for f in events if f['id']==frame_id)
    stem=ROOT/row['sourceStem']
    original=stem.with_name(stem.stem+'@3x.webp')
    im=Image.open(original).convert('RGBA'); assert im.size==(480,477)
    name=f'{i:02d}_{stem.stem}.png'; destination=UPLOAD/name
    kwargs={'icc_profile':Image.open(original).info['icc_profile']} if 'icc_profile' in Image.open(original).info else {}
    im.save(destination,'PNG',compress_level=9,**kwargs)
    assert Image.open(destination).convert('RGBA').tobytes()==im.tobytes(),'PNG conversion changed decoded pixels'
    alpha=im.getchannel('A'); assert alpha.getextrema()[0]==0,'Expected transparent app artwork'
    bounds=alpha.point(lambda v:255 if v>8 else 0).getbbox()
    assert bounds and bounds[0]>0 and bounds[1]>0 and bounds[2]<480 and bounds[3]<477,'Visible artwork clips the canvas'
    copies=[]
    for density in (2,3):
        src=stem.with_name(stem.stem+f'@{density}x.webp');dst=WEBP/src.name
        shutil.copyfile(src,dst);assert sha(src)==sha(dst)
        copies.append({'file':'source_webp/'+dst.name,'sha256':sha(dst),'byteIdenticalToApp':True})
        artifacts.append(dst)
    intervals=[{'from':f['from'],'to':f['to']} for f in events if f['id']==frame_id]
    manifest['frames'].append({'id':frame_id,'title':titles[i-1],'upload':'upload/'+name,'source3x':str(original.relative_to(ROOT)),
        'source3xSha256':sha(original),'uploadSha256':sha(destination),'decodedRgbaPixelsIdentical':True,'size':[480,477],
        'visibleAlphaBounds':bounds,'intervals':intervals,'originalWebpCopies':copies})
    artifacts.append(destination)

font=lambda size:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',size)
for background,filename,ink,muted in [('#FFFEFC','contact_sheet.png','#263C30','#526052'),('#1A1A1E','contact_sheet_dark.png','#FAF7FF','#CDC5DF')]:
    sheet=Image.new('RGB',(1600,900),background);draw=ImageDraw.Draw(sheet)
    draw.text((18,12),'SCREEN 1 / EXACT APP FRAMES / 26-SECOND STORY',font=font(25),fill=ink)
    for i,entry in enumerate(manifest['frames']):
        x=(i%5)*320;y=54+(i//5)*405
        draw.text((x+10,y+5),f'{i+1:02d}  {entry["title"]}',font=font(18),fill=ink)
        draw.text((x+10,y+30),Path(entry['upload']).name,font=font(13),fill=muted)
        ranges=' / '.join(f'{r["from"]:.2f}-{r["to"]:.2f}s' for r in entry['intervals'])
        draw.text((x+10,y+51),ranges,font=font(14),fill=muted)
        im=Image.open(OUT/entry['upload']).convert('RGBA').convert('RGBa').resize((300,298),Image.Resampling.LANCZOS).convert('RGBA')
        tile=Image.new('RGBA',im.size,background);tile.alpha_composite(im)
        sheet.paste(tile.convert('RGB'),(x+10,y+78))
    draw.text((18,872),'Contact sheet is reference only. Upload individual transparent PNGs; do not generate a grid in the animation.',font=font(19),fill=muted)
    sheet.save(OUT/filename);artifacts.append(OUT/filename)

with (OUT/'frame_guide.csv').open('w',newline='',encoding='utf-8-sig') as handle:
    writer=csv.writer(handle);writer.writerow(['Upload file','Purpose','Time intervals (seconds)','Original app 3x asset'])
    for e in manifest['frames']:writer.writerow([e['upload'],e['title'],'; '.join(f'{r["from"]}-{r["to"]}' for r in e['intervals']),e['source3x']])
(OUT/'asset_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
(OUT/'GEMINI_PROMPT.txt').write_text((OUT/'GEMINI_PROMPT.md').read_text(encoding='utf-8'),encoding='utf-8',newline='\r\n')
artifacts.extend(OUT/name for name in ['frame_guide.csv','asset_manifest.json','GEMINI_PROMPT.txt'])
archive=OUT.parent/'Buddy_Screen1_Gemini.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as bundle:
    for file in artifacts:bundle.write(file,'Buddy_Screen1_Gemini/'+file.relative_to(OUT).as_posix())
with zipfile.ZipFile(archive) as bundle:
    assert bundle.testzip() is None
    for file in artifacts:assert bundle.read('Buddy_Screen1_Gemini/'+file.relative_to(OUT).as_posix())==file.read_bytes()
print(json.dumps({'frames':len(order),'originalWebpFiles':20,'uploadImagesIncludingMaster':11,'archiveFiles':len(artifacts),
 'pixelEquality':'10/10 PNGs match decoded app pixels exactly','originalFileHashes':'20/20 WebPs and master unchanged',
 'archive':str(archive),'archiveBytes':archive.stat().st_size,'zipCrcAndContents':'passed'},indent=2))
