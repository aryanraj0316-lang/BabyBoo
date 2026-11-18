Screen1 feedback checkpoint,18November2026

Nap drift came from motion within the original source clip. Existing rendered pixels are now translated against the planted feet midpoint and baseline, before atlas export. All516frames preserve the floor within1px; sole midpoint range158-160.5px on320pxcanvas. Watching now retains24fps rather than dropping alternateframes. Fifth suppliedclip source1.5-6.5s replaces the still ending at16.5-21.5s, native speed. No timeline/UI/artwork generation changes.

Phone recording stability-final/phone.mp4 reviewed via extracted contact sheet. No crashes; oldSkPathdeprecationwarnings remain. TypeScript/27tests/nativebuild pass. Multiple-static-atlas-node experiment rejected because devicejank increased; originalsingleAtlas renderer retained. Finalreportedjank3.64%vsbaseline2.02%in separate30sruns; do not claim full performance issue resolved. Native24fps material and nap drift are corrected; occasionaldevice frame drops remain.

Android preview OTA published and server-readback verified: group64511d5c-25f0-4b11-b85a-0a7f908a755b, update01a1ee34-dd65-70f6-a312-ead549c8a71d, runtime1.0.0, sourcea0636c0. Production untouched. Phone has locally installed tested APK; debug-build OTA fetch not claimed.
