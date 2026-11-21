# BabyBoo pre-booking

Standalone Node 24 landing page and free launch-list reservation service. No payment or automated launch email is sent. Does not change onboarding.

## Local preview

Run `npm ci --prefix prebooking`, then `node prebooking/server.mjs`.
Open http://localhost:4180/prebook. Local development uses SQLite in ignored `prebooking/.data/`.
Set ADMIN_PASSWORD to a unique password of at least 16 characters to enable /admin (username admin). Without it, admin stays locked. Never commit credentials.

## Render free web service

Use repository aryanraj0316-lang/BabyBoo, branch onboarding-screen1-rebuild. Leave Root Directory empty.

- Build: `npm ci --prefix prebooking && node --check prebooking/server.mjs`
- Start: `node prebooking/server.mjs`
- Health check: `/healthz`
- Node: 24.15.0
- NODE_ENV: production
- DATABASE_URL: external durable PostgreSQL connection string, entered privately in Render Environment. Use the provider's TLS-enabled URL.
- ADMIN_PASSWORD: unique 16+ character secret, entered privately in Render Environment.

The root render.yaml describes the same free web configuration. Existing manually created services need their settings updated manually.

Do not use local SQLite storage on Render free: files can disappear on restart or redeployment. With no working database the page remains available, but reservations return 503 and the form shows unavailable. Health checks confirm the web process, not registration readiness; /api/config reports registration availability. No false success is returned. A failing database connection requires a restart after fixing its settings.

Free Render PostgreSQL expires after 30 days; do not rely on it for a continuing advertisement campaign. Connect a durable external PostgreSQL service, such as an owner-managed Neon project. Provider account setup and credentials remain required; no hosted database is provisioned by this repository.

Verified dashboard hostname: https://babyboo-0apz.onrender.com (deployment status must be checked separately).
Bio URL: https://babyboo-0apz.onrender.com/prebook?utm_source=instagram&utm_medium=bio&utm_campaign=prelaunch
Do not promote until a real test reservation appears in the protected dashboard and survives redeployment.

Optional paid-disk deployment: explicitly set STORAGE_DRIVER=sqlite and DATA_DIR to the mounted persistent disk directory. Never enable this mode on ephemeral free storage.

## Owner reporting and checks

/admin and /admin/export.csv require authentication. Duplicate emails are case-insensitive; the original campaign is retained. /leave marks an entry unsubscribed; fresh consent can reactivate it. Reports count reservations and requests, not verified people or app installs. Addresses are not email-verified. CSV cells are formula-escaped. Requests have consent validation, honeypot, body limits, origin checks and short-lived hashed-IP throttling. No raw IP, child details, payment data or advertising pixels are stored in reservations. Export only active consented entries for launch email and include unsubscribe links.

Run `node --test prebooking/server.test.mjs prebooking/postgres.test.mjs`.
For actual PostgreSQL coverage, set TEST_DATABASE_URL to a disposable test database first; PostgreSQL integration tests otherwise skip. Test emails use example.test. Production data must never be used as the test database.

## Creator programme (local checkpoint, not deployed)

Admin controls under /admin create invitation links for selected Instagram handles and save case-insensitive referral codes with a configurable extra-shutdowns/day bonus. Codes start unchecked/inactive in the editor. Existing reservations retain their first code and bonus; code edits never rewrite historical promises. Public signup revalidates active codes and saves the benefit snapshot. App redemption/authentication is not implemented: this site cannot alter an installed app's limit. The trial APK and its 1–2 day expiry are managed separately.

/early-access accepts private, random invitation links. Only the invitation hash is stored. Reviews require publication consent and remain pending until the owner publishes them; published content includes free-trial and creator-reported partnership disclosure. Owner can hide reviews. No reviews are fabricated or automatically published. Invite ownership is checked against the recorded handle, not against Instagram OAuth; send invitations only after confirming the handle in your DM. No DM is sent by this code.

Run `npm test --prefix prebooking`; set TEST_DATABASE_URL to a disposable PostgreSQL database for full integration coverage. Never use production data for tests.
