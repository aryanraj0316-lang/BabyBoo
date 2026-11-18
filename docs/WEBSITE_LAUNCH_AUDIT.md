# BabyBoo website launch audit

Inspected: 2026-11-18T21:15+05:30. Branch: onboarding-screen1-rebuild.

## Existing website

- Vite/React marketing page: src/LandingPage.tsx. src/main.tsx routes / to it, /privacy to PrivacyPage and /app to the existing interactive demo.
- User confirms site is LOCAL ONLY. References to babyboo.app in source do not establish domain ownership or hosting. No hosting connection or website admin backend found.
- Download link currently targets public/BabyBoo-preview.apk: 43,941,759 bytes, filesystem date20October2026. aapt identifies com.babyboo.app, version1.0.3, versionCode4, minSDK26, targetSDK36. No application-debuggable entry in aapt output. Release authenticity/signature must still be checked before public distribution; filename is not proof of readiness.
- No visit/download event persistence, website administrator authentication or download reporting found. Native parent statistics are not website admin analytics.

## Completed repair and checks

- Fixed vite.config.ts Expo stub alias pointing at an obsolete absolute Desktop folder. It now resolves relative to the config file using fileURLToPath(new URL(...)).
- Baseline npm run build failed on that missing path. After repair, npm run build PASSED including tsc -b and Vite production bundling. Log: tools/website-baseline-build.log (ignored).
- No landing-page visual changes, onboarding or native code changes. No website deployed or APK published.

## Proposed next milestone

Preserve the existing landing page. Use server-side persistent records and a protected owner dashboard. Sites supports a server Worker with D1 for events and R2 for the APK; registration, file upload and deployment remain unperformed. The public APK must be in durable file storage rather than embedded in a Worker or committed as a large static asset. Do not migrate or rebuild the app demo to add tracking.

Download flow: ad landing URL with allowlisted UTM campaign fields -> anonymous session -> direct download endpoint -> versioned signed APK. Downloads must not depend on third-party analytics calls succeeding. Support range/resume correctly, Content-Disposition attachment, application/vnd.android.package-archive MIME, Content-Length and stable release metadata/checksum. HEAD/prefetch/bot and duplicate range requests must not inflate reported downloads.

Dashboard must distinguish observed landing sessions, download attempts, transfers started, bytes served, server-finished transfers, interrupted/failed/unknown attempts, and campaign attribution. Distinct browser sessions are not guaranteed distinct people. Derive only same-cohort conversion counts, clearly label session-level estimates and unknown outcomes; do not subtract unrelated totals and call them people who did not download.

A browser click, server response completion and APK installation are different events. Neither the website nor a successful server send proves the user saved the file or installed/opened the app. Do not label clicks or redirects as completed downloads. Installation tracking would require separately approved app instrumentation; current app claims zero telemetry, so no app tracking is in this milestone.

Use platform authentication plus server-side owner authorization for dashboard and release-upload endpoints; anonymous visitors must not be able to read individual event data or upload APKs. Do not put administrator secrets in browser code. Default to dashboard reporting instead of sending notifications to third parties.

## Decisions pending

- Public APK: existing stable1.0.3/build4 release OR a newly prepared signed release for approval. Asked user; do not silently publish the current debug build or unfinished onboarding.
- Initial audited checkpoint ready. Hosting/backend/admin implementation is next; project rule requires checkpoint approval. No Site registration or new deployment has been created yet.
