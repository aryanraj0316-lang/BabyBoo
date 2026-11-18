# BabyBoo website hosting

Public website: https://babyboo-app-download.mistyemery2.chatgpt.site
Owner dashboard: https://babyboo-app-download.mistyemery2.chatgpt.site/admin

Sign in through ChatGPT using the account that owns this Site. Server authorization is restricted to the configured owner email; ordinary signed-in visitors cannot see reports or change releases. Runtime ADMIN_EMAIL and COOKIE_SECRET are stored as Sites secrets, never in this source.

## Current state

The original Vite landing page is preserved. APK availability is intentionally false: no old preview APK was bundled, no APK uploaded and no public release activated. The existing file under public/ is retained locally but is excluded from the hosting export. The public button shows APK coming soon.

The dashboard supports release version/file upload, SHA-256 verification, file-header checking, activation after upload and pausing downloads. It accepts APKs up to90MiB. It does not verify Android signing certificates; use a separately verified signed release APK. Larger files would need a multipart upload workflow before use.

## What reports mean

- Browser sessions: signed, anonymous30-minute sessions, not verified unique people. Known bot/prefetch requests and HEAD requests are excluded; unknown bots and cleared/blocked cookies can still affect counts.
- No download attempt: sessions without an associated file request. This includes visitors still browsing and all sessions while no APK exists; it does not prove abandonment.
- Download attempts: a canonical download link ID. Ranges and retries using that link stay one attempt. A new link is another attempt; reporting also keeps distinct attempted-session counts.
- File served: completed server streams cover the entire file, deduplicating overlapping byte ranges. This does not prove the OS saved the file or the APK was installed/opened.
- Interrupted/failed: observed transfer failures/cancellations. Unconfirmed covers partial/in-flight requests and cases without a final completion record.
- Source/medium/campaign use first-touch utm_source, utm_medium, utm_campaign within the session. The dashboard refreshes every15seconds while visible. All-time totals and last30days daily counts are separate.

Some launch-check/hosting requests are already in the live sessions table, labelled where an explicit QA campaign was used. These are verification traffic, not claimed customer downloads. No fabricated/sample download records or APKs were added.

## Rebuild and deploy

From the BabyBoo root:

    npm run build
    node tools/website/export-site.mjs
    cd website-hosting
    node --test worker.test.mjs
    node build.mjs

The export allowlists website asset types and excludes APK/AAB/env files. The Worker embeds the existing frontend assets; downloadable binaries belong in R2. D1 migrations are under drizzle/ and are applied by Sites before Worker deployment. Never add runtime CREATE TABLE to request handlers.

Hosting identity is .openai/hosting.json. Use Sites get_site and create_source_repository_write_credential for this same project, never register a second Site. The deployment-service source checkout is C:/Users/LENOVO/.codex/site_workspaces/babyboo-app-download, separate from the app checkout. The app branch remains onboarding-screen1-rebuild. Copy only sanitized website-hosting source there, then use the Sites source helper to package and push the matching source. Credentials go through hidden stdin only.

Local preview: node local.mjs (127.0.0.1:4178). This loopback-only developer server impersonates the owner on admin routes and uses .local/reporting.sqlite; never deploy this server. The production Worker always requires platform-verified identity. Local bucket is memory-only and temporary.

## Verification limits

18 backend tests passed using actual local SQLite and an R2 test double, including cancellation, resume/overlap, session expiry/signature, identity/CSRF checks, checksum failure and pause. TypeScript and the production Vite build passed. Live HTTP checks confirmed public200, release unavailable200, both download aliases404, admin API403 and admin owner sign-in landing page200. A forged owner identity header against the public API remained403. Live D1 schema, session writes, deduplication and first-touch campaign preservation were checked; release/download tables are empty.

The browser and node-REPL automation kernels both failed to initialize; no current-version rendered-browser screenshot or owner-login browser session is claimed. ADB had no connected device, so no phone recording is claimed. End-to-end production APK delivery and install behavior remain unverified because no APK is published, as requested. Those checks must be done when the final signed APK is supplied.

## Reference theme update

Version2 preserves the existing site content/interactions and applies the supplied dark plum/lavender reference theme through src/website/reference-theme.css. It is scoped to .bb-site; native onboarding and /app are unaffected. Header, hero, statistics, numbered steps, lower sections, legal pages and admin surfaces share the palette. Existing approved seated Buddy artwork is reused; no mascot regeneration. Nunito is self-hosted with its OFL license. Public APK remains empty.

Admin anonymous access now shows an explicit sign-in page instead of an immediate redirect. Signed-in non-owners receive a readable403 page with an account-switch link. Owner API authorization, CSRF and private reporting remain unchanged. Actual owner login is not physically verified.

The version2 native Sites deployment succeeded. Live checks in design/website-reference-refresh/live-checks.json confirm the new stylesheet, font and mascot asset, public availabilityfalse, /admin sign-in page200 and private stats403. The previous version's platform screenshot was inspected as a baseline. A fresh version2 screenshot was not supplied; the browser automation kernel failed and automatic approval review blocked the default-browser launch with "blocked by policy". Therefore95%pixel similarity is a requested target, not a verified result. No numerical similarity score or completed current visual QA is claimed. Full matching-viewport visual review remains required.
