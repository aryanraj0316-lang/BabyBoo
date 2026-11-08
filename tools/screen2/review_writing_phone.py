"""Extract real typing frames and labelled full-screen/detail QA boards."""
from pathlib import Path
import json
import sys
import subprocess
from PIL import Image, ImageDraw, ImageFont
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / (sys.argv[1] if len(sys.argv)>1 else 'design/screen2/approved_writing/phone')
FRAMES = OUT / 'frames'
FRAMES.mkdir(exist_ok=True)
subprocess.run(['ffmpeg', '-y', '-i', str(OUT / 'phone.mp4'), '-vf', 'fps=10', str(FRAMES / '%04d.png')], check=True, capture_output=True)
files = sorted(FRAMES.glob('*.png'))
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 17)
sheet = Image.new('RGB', (1200, 950), '#F2F4EF')
draw = ImageDraw.Draw(sheet)
for i in range(12):
    index = min(len(files)-1, round(i*(len(files)-1)/11))
    im = Image.open(files[index]).convert('RGB')
    im.thumbnail((185, 425))
    x, y = (i%6)*200+7, (i//6)*475+35
    sheet.paste(im, (x,y))
    draw.text((x,y-26), f'{index/10:.1f}s', font=font, fill='#284934')
sheet.save(OUT/'contact.png')
# Native Buddy bounds obtained from the full-size screenshot during this review.
events = json.loads((OUT/'events.json').read_text(encoding='utf-8-sig'))
typing = [e for e in events if e['event']=='type']
for number, event in enumerate((typing[0], typing[4], typing[8])):
    start = int(event['seconds']*10)-1
    board = Image.new('RGB',(1200,320),'#FFFEFC')
    labels = ImageDraw.Draw(board)
    for i in range(6):
        index = max(0,min(len(files)-1,start+i))
        im = Image.open(files[index]).convert('RGB')
        im = im.crop((280,490,420,610)).resize((200,171))
        board.paste(im,(i*200,40))
        labels.text((i*200+5,10),f'{index/10:.1f}s',font=font,fill='#284934')
    board.save(OUT/f'tip-detail-{number+1}.png')
gaze = Image.new('RGB', (660, 340), '#FFFEFC')
labels = ImageDraw.Draw(gaze)
pause = next(e for e in events if e['event']=='pause')
for i,(seconds,label) in enumerate(((typing[0]['seconds']+0.3,'Typing / looking down'), (pause['seconds']+1.2,'Focused pause / still down'))):
    index = min(len(files)-1, round(seconds*10))
    face = Image.open(files[index]).convert('RGB').crop((255,340,475,525)).resize((330,278))
    gaze.paste(face,(i*330,40))
    labels.text((i*330+10,12),label,font=font,fill='#284934')
gaze.save(OUT/'gaze-comparison.png')
# Full-size screenshots show gaze after keyboard dismissal, refocus and Go.
states = [('02-written','Focused / down'), ('04-keyboard-dismissed','Dismissed / forward'),
          ('05-refocused','Refocused / down'), ('03-age','Go / forward')]
board = Image.new('RGB',(1200,748),'#F2F4EF')
draw = ImageDraw.Draw(board)
detail = Image.new('RGB',(1200,320),'#FFFEFC')
detail_draw = ImageDraw.Draw(detail)
for i,(name,label) in enumerate(states):
    im = Image.open(OUT/f'{name}.png').convert('RGB')
    pixels = np.asarray(im).astype('int16')
    region = pixels[250:1100,190:550]
    yy,xx = np.where((region[:,:,2] > region[:,:,0]+25) & (region[:,:,0] > region[:,:,1]+15) & (region[:,:,0] > 80))
    left,right = int(xx.min())+180,int(xx.max())+200
    top,bottom = int(yy.min())+240,int(yy.max())+260
    face = im.crop((left,top,right,int(top+(bottom-top)*0.64)))
    face.thumbnail((280,260))
    detail.paste(face,(i*300+10,45))
    detail_draw.text((i*300+8,12),label,font=font,fill='#284934')
    im.thumbnail((284,650))
    board.paste(im,(i*300+8,48))
    draw.text((i*300+8,12),label,font=font,fill='#284934')
board.save(OUT/'focus-states.png')
detail.save(OUT/'focus-gaze-detail.png')
print(f'Extracted {len(files)} real-device frames; full-screen and three 10fps detail boards.')
