"""Measure original artwork for the rendered-face assembly checkpoint."""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_fill_holes

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'design/buddy'
OUT=ART/'assembly_review'
OUT.mkdir(exist_ok=True)

def measure_eyes(rgb):
    lab=cv2.cvtColor(rgb,cv2.COLOR_RGB2LAB).astype(float)
    black=(lab[...,0]<65)&(np.hypot(lab[...,1]-128,lab[...,2]-128)<40)
    contours,_=cv2.findContours(black.astype('uint8'),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    contours=sorted(contours,key=cv2.contourArea,reverse=True)[:2]
    results=[]
    for c in sorted(contours,key=lambda c:cv2.boundingRect(c)[0]):
        (x,y),(minor,major),angle=cv2.fitEllipse(c)
        mask=np.zeros(rgb.shape[:2],np.uint8);cv2.drawContours(mask,[c],-1,255,-1)
        results.append(dict(center=[x,y],minor=minor,major=major,angle=angle,bbox=list(cv2.boundingRect(c)),area=float(cv2.contourArea(c))))
    return results

master=np.array(Image.open(ART/'buddy_master.png').convert('RGB'))
turn=np.array(Image.open(ART/'buddy_turnaround.png').convert('RGB'))
h,w=turn.shape[:2]
front=turn[:h//2,:w//3];three=turn[:h//2,w//3:2*w//3]
master_eyes=measure_eyes(master)
front_eyes=measure_eyes(front)
three_eyes=measure_eyes(three)
measure=dict(source_sizes=dict(master=list(master.shape[:2]),turnaround=list(turn.shape[:2])),master_eyes=master_eyes,front_eyes=front_eyes,three_quarter_eyes=three_eyes,far_near_width_ratio=three_eyes[0]['minor']/three_eyes[1]['minor'],far_near_height_ratio=three_eyes[0]['major']/three_eyes[1]['major'],far_near_area_ratio=three_eyes[0]['area']/three_eyes[1]['area'])
(OUT/'face_reference_measurements.json').write_text(json.dumps(measure,indent=2))
Image.fromarray(three).save(OUT/'reference_three_quarter.png')
Image.fromarray(front).save(OUT/'reference_front.png')
annotated=Image.fromarray(three);d=ImageDraw.Draw(annotated)
for e in three_eyes:
    x,y,ww,hh=e['bbox'];d.rectangle((x,y,x+ww,y+hh),outline='red',width=1)
annotated.save(OUT/'reference_three_quarter_measured.png')
print(json.dumps(measure,indent=2))
