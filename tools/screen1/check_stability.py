"""Record a full Screen1 loop for the alignment/playback regression."""
from pathlib import Path
import subprocess,time,sys
OUT=Path('design/screen1/gemini_review/integration')/(sys.argv[1] if len(sys.argv)>1 else 'stability-phone');OUT.mkdir(exist_ok=True)
def adb(*a):return subprocess.check_output(['adb',*a])
adb('shell','am','force-stop','com.babyboo.app')
adb('logcat','-c')
adb('shell','am','start','-W','-a','android.intent.action.VIEW','-d','babyboo:///','-p','com.babyboo.app')
time.sleep(5)
adb('shell','dumpsys','gfxinfo','com.babyboo.app','reset')
p=subprocess.Popen(['adb','shell','screenrecord','--time-limit','30','--bit-rate','6000000','/sdcard/buddy-stability.mp4'])
time.sleep(12)
adb('shell','screencap','-p','/sdcard/buddy-stability.png');adb('pull','/sdcard/buddy-stability.png',str(OUT/'phone.png'))
p.wait(timeout=40)
assert p.returncode==0
adb('pull','/sdcard/buddy-stability.mp4',str(OUT/'phone.mp4'))
(OUT/'gfxinfo.txt').write_bytes(adb('shell','dumpsys','gfxinfo','com.babyboo.app'))
(OUT/'logcat.txt').write_bytes(adb('logcat','-d','-s','ReactNativeJS:V','AndroidRuntime:E','libc:F'))
(OUT/'meminfo.txt').write_bytes(adb('shell','dumpsys','meminfo','com.babyboo.app'))
print('Recorded and pulled actual phone loop',flush=True)

