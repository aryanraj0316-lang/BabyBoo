# Reviewed phone animation — 2026-11-03

The final 20.004-second video is a real adb recording from the connected Vivo V2432, 720x1600, 667 encoded frames, approximately 33.29fps variable capture rate. It is trimmed from seconds 1 through 21 of the preserved 21.039-second raw phone capture so the hop and landing are both visible. No audio is included.

## Reviewed evidence

- buddy-motion-phone-20s.mp4: final approval video, showing Buddy at small and large display sizes.
- contact-01.png and contact-02.png: full clip at 2 samples/second; both visually reviewed after the final trim.
- frames/: 200 local samples extracted at10fps. Individually reviewed final samples 6,144,186,194,199 for blink/face, elbow pose, airborne hop, landing squash and settling. Earlier phone attempts were also reviewed but are not final deliverables.
- master-and-phone.png: master on left, crop from final video frame144 on right at matched 720px scene scale. It is a pose/material comparison, not an exact matching-pose overlay.
- animation-metrics.txt: UI-thread frame metrics. Current-process reports approximately31.28–31.63fps; the first entry belongs to the previous process/build and must not be attributed to this build.
- gfxinfo.txt: reset before final capture. Android reported 1540 rendered frames,0 modern jank count,100% legacy jank and61ms median frame latency. These conflicting counters do not establish a60fps pass.

## What was observed

Breathing, rendered closed-eye blinks, clamped head turn, nod and +/-8-degree tilt, ear follow-through, one elbow-bending wave and one hop with landing squash are present. Eyes/blush/mouth follow the head's surface. Lab buttons, sliders and warning overlays are hidden. Android status/navigation bars remain visible.

Broad ear cards retain the full source texture, avoiding thin edge-on ears. The silhouette stays broad at the clamped extremes, and no eye sliver was visible in the reviewed turn sequence. Soft feathering and persistent shoulder-behind-head layering remove the previously flagged hard overlap/layer pop. No source art was regenerated.

## Remaining limits

**60fps target is not met.** Actual UI-thread measurements are about31fps, improved from about10fps initially and25fps after the first optimization. Video is evidence of this spike, not a release-quality performance pass. Remaining work would need further reduction of per-frame JSI/object allocation or a more declarative/native mesh update path.

Ear jiggle and breathing remain subtle at the smaller size. Source ear lighting/material is retained rather than relit; an exact colour/whole-silhouette likeness pass is not claimed. Reduced-motion and background behavior exist in code but were not separately exercised on this phone in this capture. Final animation appearance still requires explicit user approval; no onboarding timeline integration was performed.

## Runtime fixes and checks

A native-only undefined-function error came from eager worklet dependency capture. Reordered helpers and added tools/harness/checkCutoutWorklets.cjs, which checks the actual Babel-transformed dependency closures.15 worklet closures passed;8 geometry/motion tests and src TypeScript passed. Final APK built successfully and installed before recording.

Final APK SHA256:4C934F243C8A17755E25AB8B52742C8C82CB32626A9B9C5A9C8992EF9C98D99F. Head mesh20x24, face grid4x4, elbow grid6x6. Final rendered eye-to-head margins:23.19px and22px (3.29%/3.12% of authored706px head width).
