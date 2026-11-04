# B1 device verification

2026-11-04, VivoV2432, Android serial10MF7BG5920005F. Code checkpoint6ee7ba9.

Built standalone debug APK with regular bundled dev=false JavaScript using `gradlew.bat :app:assembleDebug -PreactNativeArchitectures=arm64-v8a --console=plain`; successful in3m19s. Installed with adb install -r, then cold-launched babyboo:///.

APK SHA256:24942CEEE7F2C498A79460733FDC5C7F3D9DBA8603C7CB254E5ECB9D44763C33.

Captured device-screen.png and22.025111s phone-loop.mp4 at720x1600. Extracted220 local10fps frames and two2fps contact sheets. Reviewed screenshot, both sheets, full-size sleepy frame0003 and arms-raised frame0023. Debug controls absent. Existing system status/navigation bars remain.

Buddy images change with the existing11-second phone timeline. Watching, worry, yawn/sleep, surprise, pointing, celebration, wave and happy rest are visible. Within each still pose there is no added body transform, bounce, sway or relighting. Common floor placement is retained. No obvious stretching, clipped ears/paws, opaque background rectangle or excessive blur was visible at phone display size. Native visual review supplements the earlier TypeScript and16 timeline/layout test passes; it is not user approval.

Only app source change for B1 remains scene/Buddy.tsx. Timeline, assets, layout, text, CTA and navigation were not changed. B2 (24-second story) remains unstarted. Raw extracted frames remain local, excluded from this checkpoint's staging.
