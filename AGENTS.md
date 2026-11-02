# Project working rules

- Work on the current branch, `onboarding-screen1-rebuild`. Do not switch branches or create a worktree unless the user explicitly asks.
- Commit at checkpoints. Stage only task-related files and preserve unrelated changes.
- Never touch other screens. The web app and onboarding screens 2-14 are out of scope. The user will add `design/ONBOARDING_SCREENS_2_TO_14.md` later.
- Do not change the screen 1 timeline or integrate the new Buddy until the user approves the look.
- Before reporting visual work, record the phone screen with adb, pull it, extract frames/contact sheets, and review them. Hide debug controls in recordings. Report any unavailable device or unverified result honestly.
- Stop at each checkpoint and wait for explicit user approval before the next phase.

## Buddy cut-out rig

The target is `design/buddy/buddy_master.png` brought to life: the same plush fur, lighting and proportions, moving smoothly. The user's rendered-artwork 2.5D cut-out rig direction supersedes the procedural-only requirement in `design/ONBOARDING_SCREEN1_FINAL.md`. Other applicable layout, accessibility, tokens/model and verification rules remain valid.

- Start with two ears and two arms from `design/buddy/buddy_parts.png`, and the blank head, torso and two feet from `design/buddy/buddy_parts_fix.png`.
- Check proportions, colours and fur against the master. Regenerate only missing or failing parts using built-in image generation with the master attached as reference.
- Copy every generated original from Codex `generated_images` into `design/buddy/generated/`. Preserve source artwork.
- Iterate generate -> cut out -> compare -> regenerate failures, at most three generation attempts per part. Report remaining mismatches honestly.
- Parts checkpoint: show eight labelled transparent cutouts on both #F6F3FF and #1A1A1E, with dimensions relative to the master's head width. Stop for approval before building.
- Static assembly checkpoint: neutral sitting pose and a 50% master overlay. Stop for approval before animation.
- Then run the approximately three-hour Buddy Lab spike: Skia textured meshes (drawVertices), smooth elbow bends, head squash/tilt, soft overlap shadows and a live coded face measured from the master.
- Limit motion to breathing, blink, ear jiggle, head tilt +/-8 degrees, one elbow-bending arm wave and one hop with landing squash. Deliver a reviewed 20-second phone recording and a still beside the master; stop for approval.
