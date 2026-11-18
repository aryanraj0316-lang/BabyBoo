"""Extract representative real-device frames before reporting Screen1 QA."""
from pathlib import Path
import argparse
import math
import cv2
from PIL import Image,ImageDraw,ImageFont

parser=argparse.ArgumentParser();parser.add_argument('modes',nargs='+');args=parser.parse_args()
base=Path(__file__).resolve().parents[2]/'design/screen1/gemini_review/integration'
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
for mode in args.modes:
    out=base/mode;cap=cv2.VideoCapture(str(out/'phone.mp4'));samples=[];next_t=0
    while True:
        ok,bgr=cap.read()
        if not ok:break
        t=cap.get(cv2.CAP_PROP_POS_MSEC)/1000
        if t>=next_t:
            samples.append((t,Image.fromarray(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB))));next_t+=2
    cap.release()
    assert samples,f'No video samples:{mode}'
    for page in range(math.ceil(len(samples)/18)):
        chunk=samples[page*18:page*18+18]
        sheet=Image.new('RGB',(1200,math.ceil(len(chunk)/6)*470),'#f6f3ff');d=ImageDraw.Draw(sheet)
        for i,(t,im) in enumerate(chunk):
            im.thumbnail((196,436));x=i%6*200;y=i//6*470
            sheet.paste(im,(x+(200-im.width)//2,y+25));d.text((x+4,y+3),f'{t:.1f}s',font=font,fill='#222222')
        sheet.save(out/f'review-contact-{page+1}.png')
    print(mode,len(samples),'chronological device samples',flush=True)
