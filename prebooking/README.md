# BabyBoo pre-booking

Independent, dependency-free Node24 service. Does not change onboarding or the existing website. Root and `/prebook` serve the same Instagram landing page. Free launch-list reservation, not a payment or Play Store pre-registration. No automated email is sent yet; connect a launch-email provider later, with unsubscribe links.

## Local preview

`node prebooking/server.mjs` → http://localhost:4180/prebook

Set `ADMIN_PASSWORD` to a unique16+character password before starting to enable `/admin`. Username: `admin`. Without a password the dashboard is locked, including locally. Do not commit passwords or include them in URLs. Local data lives under ignored `prebooking/.data/`.

## Render

Create a Blueprint from this repository using root `render.yaml`. It creates the `babyboo-prebook` Node24 service and a1GB persistent disk at `/var/data`. This is a **paid Starter service/disk configuration**, not a free-tier deployment. Deployment has not been performed. Render assigns the real public hostname; `https://babyboo-prebook.onrender.com` is only the requested name, not a claimed available/live URL. If Render adds a suffix, use the actual dashboard URL.

Build: `node --check prebooking/server.mjs`

Start: `node prebooking/server.mjs`

Health: `/healthz`

`DATA_DIR=/var/data/babyboo`, `NODE_ENV=production`. Blueprint generates `ADMIN_PASSWORD`; retrieve it from your Render service settings for owner login. SQLite/WAL stays on the persistent disk. Do not deploy without durable storage, move the DB to an ephemeral path, or enable multiple instances. Back up the DB/disk before changes. The local preview is not the deployment.

Bio URL: actual Render hostname + `/prebook?utm_source=instagram&utm_medium=bio&utm_campaign=prelaunch`.
Ad URL: actual Render hostname + `/prebook?utm_source=instagram&utm_medium=paid_social&utm_campaign=prelaunch&utm_content=ending01`.

## Owner reporting

`/admin`: password-protected counts, email/status/date/source/campaign list and `/admin/export.csv`. Auth is enforced server-side. Duplicate email submissions stay one reservation. Unsubscribe `/leave` marks inactive; fresh explicit consent can reactivate. Reports distinguish active emails from repeat requests; no claim of verified identity or install conversion. Addresses are not email-verified. CSV is private and formula-escaped. Signup POST has consent validation, honeypot, body size limit, parameterized SQL, origin checks and short-lived hashed-IP throttling. No tracking pixels, child data, payment details or raw IP are stored in the reservation DB. No email vendor connected; export only active consented entries for future launch updates and include unsubscribe links.

Test: `node --test prebooking/server.test.mjs`.
