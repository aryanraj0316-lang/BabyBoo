# BabyBoo project context

Initial inspection: 2026-11-03, Asia/Calcutta. Verify facts against current files.

- Project folder: E:/All Here/BabyBoo
- Existing source of working rules: AGENTS.md. Read it in full before working.
- package.json identifies an Expo / React Native app using Expo Router, plus a Vite web build.
- Common scripts from package.json: `npm run start`, `npm run android`, `npm run build`, `npm run lint`, `npm test`.
- These scripts have not been run or validated during memory setup. Choose checks appropriate to the actual changes.
- Read AGENTS.md for current scope and visual approval requirements. Its stated branch must be checked against the actual current branch.

Add stable, verified architecture details here as they become relevant.

- Isolated cutout lab: `src/onboarding/screen1/buddy/cutout/`; the dev route is `babyboo://dev/buddy-lab?cutout=1`. Recording mode adds `&record=1&shot=review` and hides its controls.
- Shared drawing code renders via `node tools/harness/run.cjs cutout`. It writes poses and face diagnostics to `design/buddy/assembly_review/`.
- Phone capture helper: `powershell -File tools/buddy/record-review.ps1`. Requires accessible Android SDK, Java/Gradle and ffmpeg. Builds/installs a debug review APK, checks the cutout lab title, records 20 seconds, pulls video and extracts frames. The first run required a warm deep-link retry and manual warning dismissal. Successful capture recovery is documented in design/buddy/assembly_review/recording/20261103-203519/README.md.

- Animated cutout lab: append `&record=1&shot=motion` to its dev URL. Offscreen QA: `node tools/harness/run.cjs cutout motion`, followed by `tools/.venv/Scripts/python.exe tools/buddy/review_animation.py`. Movie mode renders 600 local 30fps frames under animation_review/movie; these are internal QA, not phone evidence. Capture helper supports `-Shot motion`.
