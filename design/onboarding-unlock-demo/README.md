# Onboarding A-unlock demo

8seconds,1080x1920,30fps,H.264/yuv420p,silent. Extracted from existing realAndroidonboarding demonstration recording `design/screen1/gemini_review/integration/screen1-final-phone.mp4`, source10.25..18.25s. Crop720x1280at(0,150) removes outerphysicalphonestatus/navigationbars while keeping onboarding phone/Buddy/headline/CTA; Lanczos upscale. Originalscreenpixels/hand/Agesture retained. No appcode,timeline,artworkor websitechange.

Sequence: blackphone -> parenthand enters -> Aisdrawn includingcrossbar -> simulatedphoneunlocks -> Buddycelebrates. Reviewed16decodedhalfsecondframes incontact.jpg; fullffmpegdecodepasses. DesktopcopyBabyBoo_Onboarding_A_Unlock.mp4. This is the onboarding simulation, not footageof unlockinganactualphysicalphonelock.

Reproduce:
ffmpeg -ss 10.25 -i design/screen1/gemini_review/integration/screen1-final-phone.mp4 -t 8 -vf "crop=720:1280:0:150,scale=1080:1920:flags=lanczos,fps=30,setsar=1" -an -c:v libx264 -preset fast -crf 17 -pix_fmt yuv420p -movflags +faststart design/onboarding-unlock-demo/BabyBoo_Onboarding_A_Unlock.mp4

## Phone-only green version
`BabyBoo_Phone_A_Unlock_Green.mp4`:8s,1080x1920,30fps,silent H.264/yuv420p on solid#00FF00. Recorded phoneblack/home states reused; surroundingBuddy/page removed. The originalrecordinghasBuddycoveringpartofparenthand, so theexistingparent-hand.webp andnativeApath were renderedseparately, rather than delivering holes in the hand. Lower-rightoccludedphoneedge repairedusingmirroredleftbezel/screen. Motiontiming8s:blackhold->hand->Alegs/crossbar->unlock->homehold. Reviewed8decoded1ssamplesandlargehandpreview; fullffmpegdecodePASS. Scripttools/advertising/extract-phone-green.py. DesktopcopyBabyBoo_Phone_A_Unlock_Green.mp4.
