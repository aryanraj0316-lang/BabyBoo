"""Fit the ellipsoid camera to measured 3/4 eye ratios."""
from pathlib import Path
import json
import numpy as np
from scipy.optimize import least_squares
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'design/buddy/assembly_review'
m=json.loads((OUT/'face_reference_measurements.json').read_text())
profile=np.array(json.loads((OUT/'head_surface_profile.json').read_text()))
def project(x,y,p):
    depth,yaw,cam=p;rx=.5;ry=.428
    pos=np.clip((y/ .856+.5)*96,0,96);i=min(95,int(pos));cx,rr=profile[i]*(1-(pos-i))+profile[i+1]*(pos-i)
    z=depth*np.sqrt(max(.0001,1-(y/ry)**2))*np.sqrt(max(.0001,1-((x-cx)/rr)**2))
    xx=x*np.cos(yaw)+z*np.sin(yaw);zz=-x*np.sin(yaw)+z*np.cos(yaw)
    k=(cam-z)/(cam-zz)
    return np.array([xx*k,y*k])
def ratios(p):
    import cv2
    a,b=[np.array(e['center']) for e in m['master_eyes']]
    roll=np.arctan2((b-a)[1],(b-a)[0]);cs=np.cos(roll);sn=np.sin(roll)
    rot=np.array([[cs,sn],[-sn,cs]])
    dims=[]
    for e in m['master_eyes']:
        angle=np.radians(e['angle']);c=np.cos(angle);s=np.sin(angle)
        t=np.linspace(0,2*np.pi,160,endpoint=False)
        pts=np.array([e['minor']/2*np.cos(t),e['major']/2*np.sin(t)]).T@np.array([[c,s],[-s,c]])
        pts=(pts+np.array(e['center'])-np.array([644,550]))@rot.T/706
        projected=np.array([project(x,y,p) for x,y in pts],np.float32)
        _,diam,_=cv2.fitEllipse(projected[:,None,:])
        dims.append(diam)
    return np.array([dims[0][0]/dims[1][0],dims[0][1]/dims[1][1],dims[1][0]/(m['master_eyes'][1]['minor']/706)])
target=np.array([m['far_near_width_ratio'],m['far_near_height_ratio'],m['three_quarter_eyes'][1]['minor']/m['front_eyes'][1]['minor']])
fit=least_squares(lambda p:(ratios(p)-target)*[3,3,1],[.4,-.55,4],bounds=([.15,-.9,1.1],[.75,-.25,20]),diff_step=1e-4,xtol=1e-10,ftol=1e-10,gtol=1e-10,max_nfev=600)
result=dict(depth=float(fit.x[0]),yawThreeQuarter=float(fit.x[1]),cameraDistance=float(fit.x[2]),target=target.tolist(),fitted=ratios(fit.x).tolist(),method='Least-squares fit of projected 160-point rendered eye contours to ellipse-fit far/near width and height ratios plus near-eye width relative to front reference; no arbitrary per-eye scale.')
(OUT/'face_projection_fit.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
