from PIL import Image
import subprocess
from pathlib import Path
im=Image.open('public/buddy-idle-loop.webp')
p=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgba','-s','640x636','-r','24','-i','-','-an','-c:v','libvpx-vp9','-pix_fmt','yuva420p','-b:v','0','-crf','28','-deadline','realtime','-cpu-used','6','-row-mt','1','public/buddy-idle-loop.webm'],stdin=subprocess.PIPE)
for i in range(im.n_frames):
    im.seek(i)
    p.stdin.write(im.convert('RGBA').tobytes())
p.stdin.close()
assert p.wait()==0
print(Path('public/buddy-idle-loop.webm').stat().st_size)
