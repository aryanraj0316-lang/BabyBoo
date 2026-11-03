# Reviewed phone capture

Recorded and reviewed 2026-11-03, approximately 20:43 +05:30 (Asia/Calcutta), on an authorized Vivo V2432 connected by USB.

- `buddy-assembly-phone.mp4`: original adb screenrecord output, requested 20-second capture, encoded duration 19.674056 seconds, 720 x 1600. No audio was recorded.
- `contact-01.png`, `contact-02.png`: extracted at 2 samples/second. Both sheets were visually reviewed.
- `master-and-phone.png`: source master on left, crop of the larger phone Buddy from extracted frame 156 on right. Same 720px scene width; original backgrounds retained.
- `phone-neutral.png`: larger phone Buddy cropped from extracted frame 168, both arms resting.
- `frames/`: 197 locally extracted frames at 10 samples/second. Frames 65, 156 and 168 were individually inspected. Repeated samples do not represent new display frames.

The capture shows the cutout lab at two sizes, changing among master pose, neutral, turns, nods, +/-8 degree tilts and squash. Facial artwork changes position and foreshortens with the head. Lab buttons and warning overlay are absent throughout the reviewed contact sheets. Android system bars remain visible.

This is a slideshow of discrete static diagnostics at 1.6-second intervals, not the smooth animation spike. The video stream's variable-frame average is approximately 2.08 fps, reflecting this mostly static capture; no 60fps or smooth-motion pass is claimed. Breathing, blink playback, elbow wave, hop and ear animation remain pending assembly approval.

Visible remaining differences: harder head edge than master, raised-arm overlap and head/body overlap differ, foot-pad alignment differs, and extreme turns expose a thin far-eye sliver and different ear silhouette. Overall likeness thresholds remain unverified. Phone evidence confirms rendering on the device, not user approval of its appearance.

## Capture recovery

The initial build failed because the Gradle init script applied to included builds without an :app project. An explicit null guard fixed that; the review APK built successfully (485 tasks; 3m56s) and installed using adb install -r.

The initial cold deep link displayed onboarding. Resending it to the running activity opened the correct lab, verified by its UI title and pulled screenshot. Recording mode used escaped remote-shell ampersands. The warning overlay was dismissed before capture.

First screenrecord attempt failed with INVALID_LAYER_STACK because the physical display was OFF. Waking the screen and specifying physical display ID 4627039422300187648 succeeded. Raw screenshots/UI dumps from troubleshooting remain local and are not review deliverables.
