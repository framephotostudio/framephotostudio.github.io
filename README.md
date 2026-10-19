# Face Couture — iPhone & Android apps

Everything for the apps lives on this `mobile-app` branch. The live website stays on `main` and is never touched by the app build; the app pulls the site's studio code from `main` at build time, so the apps and the website always have the same looks, finishes and tools.

**Nothing is built on anyone's computer.** Every push to this branch builds both apps on GitHub (Actions tab → "Build Face Couture apps"). Test builds are attached to each run; release builds are signed and uploaded to TestFlight / Google Play automatically once the store secrets below exist.

## What is in here

| Folder | What |
|---|---|
| `app/` | The native layer: welcome screen, full-screen studio, bottom tab bar, native save/share sheet, haptics, Android back button, offline notice, review prompt (`app.js`, `app.css`, `app-early.js`); backend connection (`app-api.js`); AI tools, Pro subscription, promo codes, settings (`app-pro.js`). |
| `assets/` | App icon, adaptive Android icon, splash screen (generated from the brand emblem). |
| `backend/` | The Cloudflare Worker: one secure API for the website and both apps (AI looks, allowances, spending ceiling, promo codes, subscription webhook, analytics counts, owner dashboard at `/admin`). Tests: `cd backend && npm test`. |
| `scripts/` | `build-web.mjs` (bundles the site + MediaPipe/ONNX models so the app works offline), `native-setup.sh` (icons, splash, permissions, portrait, version numbers). |
| `store/` | Paste-ready listings, keyword set, privacy answers, screenshots for both stores. |
| `site-pages/` | Privacy, Terms, Support and Delete-my-data pages (already published at facecouture.app/privacy.html etc.). |
| `.github/workflows/` | `build-apps.yml` (test builds), `release.yml` (signed uploads). |

## Day 1 — what you do once the accounts exist

### Apple (Individual, $99/yr)
1. developer.apple.com → enroll (Individual). Wait for approval (usually < 48 h).
2. App Store Connect → Apps → + → iOS App: name **Face Couture: Glam Photo Editor**, bundle ID **app.facecouture.studio**, SKU `facecouture-ios`.
3. App Store Connect → Users and Access → Integrations → App Store Connect API → generate a key with **App Manager** role. Download the `.p8` once. Note Issuer ID and Key ID.
4. Certificates: no Mac needed. The release workflow creates the distribution certificate through the API key on its first run (see GitHub secrets below) and signs automatically after that.
5. Fill in App Information from `store/listing.md`, upload `store/screenshots/ios-6.7/*.png`, answer App Privacy from `store/privacy-labels.md`, set Support/Privacy URLs.
6. Subscriptions (can be done later, flow stays hidden until you turn Pro on): Monetization → Subscriptions → group "Face Couture Pro" → products `fc_pro_monthly` ($7.99, 14-day free trial) and `fc_pro_yearly` ($49.99, 14-day free trial). Offer Codes live under each product.
7. Agreements: accept the Paid Apps agreement and add banking/tax info (needed before any purchase, not before the free launch).

### Google Play (Personal, $25 once)
1. play.google.com/console → create developer account (identity verification takes up to a few days).
2. Create app: **Face Couture: Glam Photo Editor**, Photography, free.
3. Setup → App integrity: choose **Google-managed signing key** (default). Download nothing; GitHub uploads with a service account.
4. Setup → API access → create a Google Cloud service account, grant it **Release manager** on the app, download its JSON key.
5. Store listing from `store/listing.md`, screenshots from `store/screenshots/android/`, Data safety from `store/privacy-labels.md`, content rating questionnaire (Everyone).
6. Personal accounts must run a **closed test with 12 testers for 14 days** before production. Create a closed track, add an email list of 12 friends/clients (they must opt in and keep the app installed), then apply for production access from the dashboard after day 14.
7. Subscriptions (later): Monetize → Products → Subscriptions → `fc_pro_monthly` / `fc_pro_yearly` with a 14-day free-trial offer; promo codes under Promotions.

### GitHub secrets and variables (Settings → Secrets and variables → Actions)
Secrets:
- `APPSTORE_ISSUER_ID`, `APPSTORE_KEY_ID`, `APPSTORE_PRIVATE_KEY` (contents of the .p8) — enables TestFlight upload
- `APPLE_TEAM_ID` — shown at developer.apple.com → Membership details
- `IOS_DIST_CERT_P12_BASE64`, `IOS_DIST_CERT_PASSWORD` — distribution certificate. You do not need a Mac: run the release workflow once with only the APPSTORE_* secrets set and it creates the certificate for you and attaches the two values to download (artifact `ios-distribution-certificate`); save them as secrets and run again.
- `PLAY_SERVICE_ACCOUNT_JSON` — enables Play upload
- `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` — upload key (the workflow generates one for you on first run and prints the values to store)
Variables (optional until the backend exists):
- `FC_API_URL` = your Worker URL (e.g. `https://api.facecouture.app`) — switches AI tools, promo codes and analytics on
- `FC_RC_IOS`, `FC_RC_ANDROID` = RevenueCat public SDK keys — switches purchases on
- `FC_SUPPORT_EMAIL`

Then: Actions → "Release Face Couture apps" → Run workflow. iOS goes to TestFlight (you get an email, install TestFlight on your iPhone, test), Android goes to the closed testing track.

## The backend (AI looks, dashboard) — 20 minutes, when you want AI on
1. cloudflare.com → free account. `npm i -g wrangler && wrangler login`.
2. `cd backend && wrangler kv namespace create KV` → paste the id into `wrangler.toml`.
3. Secrets: `wrangler secret put OPENAI_API_KEY` (platform.openai.com → API keys; add $10–20 of credit and set a monthly budget there too), `wrangler secret put ADMIN_PASSPHRASE`, `wrangler secret put APP_SIGNING_SECRET` (any long random string).
4. `wrangler deploy`. Note the URL; optionally add a custom domain `api.facecouture.app` in the Cloudflare dashboard.
5. Open `https://<worker-url>/admin`, sign in with your passphrase. Set the monthly ceiling (default $50), allowances, seasons, promo codes. Everything there is yours to change without any store update.
6. Put the URL into the GitHub variable `FC_API_URL` and re-run the build. The website can use the same backend by serving `/api/*` from it (Cloudflare route `facecouture.app/api/*` → this Worker).

Running costs (all optional until you turn things on): Cloudflare Workers free tier covers ~100k requests/day; OpenAI image edits ≈ $0.04 (medium) to $0.17 (high) per generation — the dashboard shows live spend and a 100/1,000/10,000-user projection; RevenueCat free up to $2.5k monthly revenue; Apple $99/yr; Google $25 once.

## Subscriptions, free month, trial — how it is wired
- The paywall and purchase code ship in the app from day one but stay **hidden** until you flip **Pro** in the admin dashboard. Flipping it never charges anyone; new users then see a 14-day free trial through the store's own sheet, with price, renewal terms, Restore purchases, Privacy and Terms links (store rules).
- `pro.freeLaunchUntil` in the dashboard is informational; the switch is what matters. Users who installed during the free month simply see the trial offer when you turn Pro on.
- Pro status follows the device across reinstalls via Restore purchases; RevenueCat's webhook (`/api/webhooks/revenuecat`) keeps the server's allowance tier in sync for iPhone, Android and web.
- Promo codes: in-app codes (dashboard → Promo codes) give AI allowance or Pro for N days without the stores; store offer codes are created in App Store Connect / Play Console and redeemed through the stores.

## Seasonal looks
Halloween Oct 1–Nov 7, Thanksgiving Nov 1–30, Christmas Dec 1–31, New Year's Dec 20–Jan 3 — inclusive, every year, in the viewer's local time zone (built into the studio). The dashboard can extend, shorten or pause any season without a store update.

## Offline
Beauty Lab, all looks, frames, formats, video and saving work offline (the models are bundled). AI Looks, promo codes and purchases need a connection; the app says so.

## Privacy and security notes for your lawyer
- No account, no photos stored by us, face landmarks on-device only, AI consent checkbox, server never logs image data, keys only on the server, CORS limited to the site and apps, rate limits per device and IP, device deletion in-app and via web page. Retention: our server keeps counters only; OpenAI API retains inputs ≤30 days (abuse monitoring), no training.
- Fonts: system fonts. Icons: hand-drawn SVG. Models: MediaPipe (Apache-2.0), ONNX Runtime (MIT), face parser (MIT). Frameworks: Capacitor (MIT), plugins (MIT). RevenueCat SDK (MIT).

## Restore points
`main` is untouched by anything here. To roll the apps back, revert a commit on this branch and push — a new build starts automatically.
