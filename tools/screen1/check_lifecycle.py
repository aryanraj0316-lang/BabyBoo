"""Physical Screen1 pause/resume and combined accessibility proof."""
from pathlib import Path
import subprocess,time,json,xml.etree.ElementTree as ET
import cv2,numpy as np

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'design/screen1/gemini_review/integration/lifecycle'
OUT.mkdir(exist_ok=True)
ADB=['adb','-s','10MF7BG5920005F']
def adb(*args):return subprocess.check_output([*ADB,*map(str,args)],text=True,encoding='utf-8',errors='replace').strip()
def shot(name):
    adb('shell','screencap','-p','/sdcard/buddy-life.png')
    adb('pull','/sdcard/buddy-life.png',OUT/f'{name}.png')
def ui(name):
    adb('shell','uiautomator','dump','/sdcard/buddy-life.xml')
    s=adb('shell','cat','/sdcard/buddy-life.xml');(OUT/f'{name}.xml').write_text(s,encoding='utf-8')
    return ET.fromstring(s)
def launch():
    adb('shell','am','force-stop','com.babyboo.app')
    return adb('shell','am','start','-W','-a','android.intent.action.VIEW','-d','babyboo:///','-p','com.babyboo.app')
template=cv2.imread(str(ROOT/'design/screen1/gemini_review/integration/lifecycle/before-background.png'))
template=cv2.cvtColor(template[710:800,425:565],cv2.COLOR_BGR2GRAY)
launch();start=time.monotonic();before_score=0
while time.monotonic()-start<30:
    raw=subprocess.check_output([*ADB,'exec-out','screencap','-p'])
    screen=cv2.imdecode(np.frombuffer(raw,np.uint8),cv2.IMREAD_COLOR)
    roi=cv2.cvtColor(screen[650:850,360:630],cv2.COLOR_BGR2GRAY)
    before_score=float(cv2.matchTemplate(roi,template,cv2.TM_CCOEFF_NORMED).max())
    if before_score>.94:
        (OUT/'before-background.png').write_bytes(raw)
        break
else:raise AssertionError('Could not identify the actual sleepy pose before backgrounding')
adb('shell','input','keyevent','KEYCODE_HOME');time.sleep(8)
warm=adb('shell','am','start','-W','-n','com.babyboo.app/.MainActivity')
time.sleep(.15);shot('after-resume')
screen=cv2.imread(str(OUT/'after-resume.png'))
roi=cv2.cvtColor(screen[650:850,360:630],cv2.COLOR_BGR2GRAY)
after_score=float(cv2.matchTemplate(roi,template,cv2.TM_CCOEFF_NORMED).max())
assert after_score>.92,'Story jumped while backgrounded'
ui('after-resume')
print('Background8s: nap preserved on warm resume.',flush=True)
transition=adb('shell','settings','get','global','transition_animation_scale')
font=adb('shell','settings','get','system','font_scale')
record=None
try:
    adb('shell','settings','put','global','transition_animation_scale','0')
    adb('shell','settings','put','system','font_scale','1.3')
    launch();time.sleep(7)
    record=subprocess.Popen([*ADB,'shell','screenrecord','--time-limit','12','--bit-rate','5000000','/sdcard/buddy-access.mp4'])
    time.sleep(1);shot('accessibility-first');first=ui('accessibility-first')
    time.sleep(3);shot('accessibility-later');later=ui('accessibility-later')
    for tree in [first,later]:
        assert any(n.get('content-desc')=='Get Started' for n in tree.iter('node')),'CTA absent under accessibility settings'
    record.wait(timeout=20);assert record.returncode==0
    adb('pull','/sdcard/buddy-access.mp4',OUT/'accessibility-phone.mp4')
finally:
    if record and record.poll() is None:record.wait(timeout=20)
    adb('shell','settings','put','global','transition_animation_scale',transition)
    adb('shell','settings','put','system','font_scale',font)
(OUT/'results.json').write_text(json.dumps({'backgroundSeconds':8,'napPreserved':True,'warmLaunch':warm,
    'sleepFaceMatchBefore':before_score,'sleepFaceMatchAfter':after_score,
    'testedFontScale':1.3,'testedTransitionScale':0,'ctaPresentInBothAccessibilityChecks':True,
    'restoredFontScale':font,'restoredTransitionScale':transition,'noProfileSubmitted':True},indent=2),encoding='utf-8')
print('Lifecycle and accessibility checks finished; settings restored.',flush=True)
