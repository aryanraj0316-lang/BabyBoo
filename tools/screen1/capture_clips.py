"""Device review of actual Screen1. Never completes/persists a child profile."""
from pathlib import Path
import subprocess
import time
import json
import re
import xml.etree.ElementTree as ET
import argparse

ROOT=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser()
parser.add_argument('mode',choices=['en','hi','reduced','large'])
parser.add_argument('--final',action='store_true',help='Record final always-visible CTA version')
args=parser.parse_args()
OUT=ROOT/'design/screen1/gemini_review/integration'/(('final-' if args.final else '')+args.mode)
OUT.mkdir(parents=True,exist_ok=True)
ADB=['adb','-s','10MF7BG5920005F']
def adb(*args):
    return subprocess.check_output([*ADB,*map(str,args)],text=True,encoding='utf-8',errors='replace').strip()
def dump(name):
    adb('shell','uiautomator','dump','/sdcard/screen1-clips-ui.xml')
    xml=adb('shell','cat','/sdcard/screen1-clips-ui.xml')
    (OUT/f'{name}.xml').write_text(xml,encoding='utf-8')
    return ET.fromstring(xml)
def capture(name):
    adb('shell','screencap','-p','/sdcard/screen1-clips.png')
    adb('pull','/sdcard/screen1-clips.png',OUT/f'{name}.png')
def tap(node):
    assert node is not None,'Expected UI control absent'
    x0,y0,x1,y1=map(int,re.findall(r'\d+',node.attrib['bounds']))
    adb('shell','input','tap',(x0+x1)//2,(y0+y1)//2)
def cta(ui):
    return [n for n in ui.iter('node') if n.get('content-desc') in ['Get Started','शुरू करें']]
events=[]
original_transition=adb('shell','settings','get','global','transition_animation_scale')
original_font=adb('shell','settings','get','system','font_scale')
record=None
try:
    if args.mode=='reduced':adb('shell','settings','put','global','transition_animation_scale','0')
    if args.mode=='large':adb('shell','settings','put','system','font_scale','1.3')
    adb('logcat','-c')
    adb('shell','am','force-stop','com.babyboo.app')
    if args.mode=='hi':
        adb('shell','am','start','-W','-a','android.intent.action.VIEW','-d','babyboo:///','-p','com.babyboo.app')
        time.sleep(5)
        ui=dump('language-before')
        node=next((n for n in ui.iter('node') if n.get('text')=='हिन्दी' or n.get('content-desc')=='Switch to Hindi'),None)
        if node is None:
            node=next((n for n in ui.iter('node') if 'हिन्दी' in n.get('content-desc','')),None)
        tap(node);time.sleep(.5)
    duration=39 if args.final else (57 if args.mode=='en' else 36)
    record=subprocess.Popen([*ADB,'shell','screenrecord','--time-limit',str(duration),
        '--bit-rate','6000000','/sdcard/screen1-clips-record.mp4'],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    started=time.monotonic()
    if args.mode!='hi':
        time.sleep(.5)
        adb('shell','am','start','-W','-a','android.intent.action.VIEW','-d','babyboo:///','-p','com.babyboo.app')
    targets=[7,18,33] if args.final else ([7,23,33,54] if args.mode=='en' else [6,17,32])
    for target in targets:
        delay=target-(time.monotonic()-started)
        if delay>0:time.sleep(delay)
        capture(f'{target:02d}s')
        if target in [7,33,6,32]:
            ui=dump(f'{target:02d}s-ui')
            events.append({'seconds':time.monotonic()-started,'ctaPresent':bool(cta(ui)),
                'debugControls':any('debug-' in n.get('content-desc','') for n in ui.iter('node'))})
        print(f'{args.mode}: captured{target}s',flush=True)
    record.wait(timeout=65)
    assert record.returncode==0,record.stderr.read().decode(errors='replace')
    adb('pull','/sdcard/screen1-clips-record.mp4',OUT/'phone.mp4')
    (OUT/'logcat.txt').write_text(adb('logcat','-d','-s','ReactNativeJS:V','AndroidRuntime:E','libc:F'),encoding='utf-8')
    (OUT/'meminfo.txt').write_text(adb('shell','dumpsys','meminfo','com.babyboo.app'),encoding='utf-8')
    if args.mode=='en':
        ui=dump('before-navigation')
        tap(next(iter(cta(ui)),None));time.sleep(2);capture('navigation-screen2')
        ui=dump('screen2')
        back=next((n for n in ui.iter('node') if n.get('text')=='Back' or n.get('content-desc')=='Back'),None)
        tap(back);time.sleep(2);capture('back-to-screen1');dump('returned-screen1')
    (OUT/'events.json').write_text(json.dumps({'mode':args.mode,'events':events,
        'alwaysVisibleCtaVersion':args.final,
        'originalTransitionScale':original_transition,'originalFontScale':original_font,
        'noProfileSubmitted':True},indent=2),encoding='utf-8')
    if args.final:
        assert events and all(e['ctaPresent'] and not e['debugControls'] for e in events),'Final CTA/debug visibility check failed'
finally:
    if record and record.poll() is None:
        record.wait(timeout=65)
    if args.mode=='reduced':adb('shell','settings','put','global','transition_animation_scale',original_transition)
    if args.mode=='large':adb('shell','settings','put','system','font_scale',original_font)
print(f'Completed{args.mode}; settings restored.',flush=True)
