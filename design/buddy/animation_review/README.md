# Buddy animation checkpoint

Recorded and frame-reviewed on Vivo V2432,2026-11-03. Static appearance was approved after50b944e; final animation approval is pending. Current source is isolated in Buddy Lab; no onboarding timeline or other screen changed.

## Deliverables

- recording/final-phone/buddy-motion-phone-20s.mp4: actual adb recording,20.004seconds,720x1600. Debug controls and warnings hidden.
- recording/final-phone/contact-01.png and contact-02.png: entire clip sampled at2fps; reviewed.
- recording/final-phone/master-and-phone.png: master beside a crop from the phone video.
- clamped_reference_comparison.png: maximum turn beside turnaround top-middle at matched head-width scale.
- ears_at_matched_scale.png,refined_assembly_light.png and refined_assembly_dark.png: local artwork comparisons.
- refinement_metrics.json: actual final rendered contour measurements. Eye margins23.19px/22px (3.29%/3.12% of706px head width), both complete contours. Width/height1.111/1.131 at turn extremes. Reference-side far/near eye width0.508 versus reference0.500.

## Changes

Clamped yaw to the measured3/4 reference maximum, with a more conservative opposite turn for asymmetric source eye placement. Broad-head compensation avoids egg-like thinning. Ear geometry is now broad cards with mild anchor movement, preserving at least96% of width and full277x271 source PNGs; cubic sampling retains detail. Source artwork was not regenerated/recoloured.

Softened head boundary and kept arm shoulders behind head throughout lifting. Textured elbow deformation is continuous and the resting/raised artwork transition no longer switches drawing layers. Head and face share surface projection through turn,nod,roll and squash.

A20-second motion model adds breathing,rendered-eye blinks,ear jiggle,+/-8degree head tilt,one two-beat elbow wave and one hop with anticipation/landing squash and shrinking ground shadow. One shared UI-thread Skia picture draws both display sizes. Background pause and reduced-motion still are coded; their platform behavior was not separately tested in this capture.

## Checks and limitation

Src TypeScript,8 geometry/motion tests and15 Babel-transformed worklet dependency closures passed. Final Android APK built and installed successfully. The phone-only undefined-helper error was fixed by ordering eager worklet dependencies before callers.

Actual live performance is approximately31fps, improved from10fps and then25fps across iterations; encoded video averages33.29fps. **The60fps target is not met.** The full recording and selected frames were reviewed for motions and overlap, but this is a spike checkpoint rather than a release performance pass. See recording/final-phone/README.md for native metrics and review provenance.

All requested motions appear, but ear jiggle/breathing are subtle at the small size; source lighting and fur/material differences are not a measured full likeness pass. User approval is required before the next phase.
