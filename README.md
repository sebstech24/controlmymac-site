# Control My Mac — Public Site

For the current App Store build, code-delivery, subscriber email, APNs setup, testing, and launch checklist, see [`CONTROL_MY_MAC_OPERATIONS.md`](CONTROL_MY_MAC_OPERATIONS.md).

Static marketing site for [Control My Mac](https://controlmymac.com) — an iPhone app plus a free Mac menu-bar companion that lets you operate your entire Mac with one finger.

This repository contains **only** the public site, legal pages and public release assets attached through GitHub Releases. It must never contain app source code, signing material, credentials, private configuration or internal project files.

## Stack

Plain HTML + CSS + a few lines of vanilla JS. No build step, no frameworks, no external fonts or CDNs. Deployable as-is on Vercel (`vercel.json` enables `cleanUrls`, so `/start`, `/one-hand` etc. resolve without `.html`). For local preview: `python3 -m http.server` from the repo root (the pages use root-relative asset paths).

## Page map

| Path | File | Purpose |
|---|---|---|
| `/` | `index.html` | Main landing page — full feature, pricing and privacy overview |
| `/start` | `start.html` | Audience selector ("What brings you here?"), remembers the choice in `localStorage` |
| `/one-hand` | `one-hand.html` | Variant: one-handed / accessibility framing |
| `/couch` | `couch.html` | Variant: couch & home-theater framing |
| `/present` | `present.html` | Variant: presenters & educators framing |
| `/pro` | `pro.html` | Variant: power-user framing |
| `/privacy` | `privacy.html` | Privacy policy (no data collected, no account, local-only) |
| `/support` | `support.html` | Setup, pairing troubleshooting, plans, contact |
| `/download` | `download.html` | Mac companion download handoff page with GitHub and direct .dmg actions |
| `/smartwake` | `smartwake.html` | Product page: Smart Wake (iPhone + Apple Watch alarm, unreleased). `#privacy` / `#support` anchors double as its App Store privacy & support URLs |
| `/filepilot` | `filepilot.html` | Product page: FilePilot (Explorer-style file manager for macOS, unreleased, direct download). `#privacy` / `#support` anchors serve as its privacy & support URLs |
| — | `assets/site.css` | Shared design system (glass chrome, accent gradient, light/dark, reduced-motion/transparency fallbacks) |
| — | `assets/site.js` | Audience-choice memory for `/start` (no tracking, localStorage only), newsletter opt-in UI, donate-button seam |
| `/api/subscribe` | `api/subscribe.ts` | Vercel serverless function: adds newsletter signups to the email provider (env-var configured, see below) |
| — | `AUDIENCE-RESEARCH.md` | Public-safe research notes behind the variant messaging |

## Releases — how the download flow works

Every public download CTA points first at:

```
https://controlmymac.com/download
```

That page has two actions:

- **Download from GitHub** opens the public GitHub Releases page.
- **Download .dmg** opens `/download.dmg`, which redirects to the stable latest-release asset if it exists, or falls back to the GitHub Releases page instead of showing a 404.

The direct `.dmg` URL only works if the GitHub release asset is named **exactly `ControlMyMac.dmg`**. To publish or update the Mac app:

```sh
gh release create v1.0.0 "<path-to>/ControlMyMac.dmg" \
  --title "Control My Mac 1.0" \
  --notes "Initial public release."
```

No HTML changes are needed for new versions — `/download.dmg` always checks the newest GitHub release, as long as each release attaches an asset named `ControlMyMac.dmg`.

For iPhone handoff buttons, the share/copy payload is only `https://controlmymac.com/download`, so pasting on a Mac gives a usable page link rather than helper text.

## Vercel Web Analytics

The shared site script loads Vercel Web Analytics from `/_vercel/insights/script.js`. Also enable Web Analytics in the Vercel project dashboard; Vercel creates the analytics routes after the next deployment.

## Subscriber welcome gift (prepared, not live)

The repository contains a disabled implementation for a subscriber welcome gift:

1. The visitor explicitly joins occasional Control My Mac and Sebastian Apps emails.
2. The only automatic email contains a unique Apple code for one free month, manual in-app redemption steps, and a request to confirm future emails.
3. Only that confirmation click adds the address to the ongoing marketing list.
4. A signed unsubscribe page removes the address from the list without invalidating a code already sent.
5. A daily authenticated Vercel Cron imports newly generated Apple batches, fulfills queued requests, retries provider synchronization, and creates another 500-code batch when fewer than 100 remain.

The public pages do not call this API yet. `/api/request-code` remains unavailable unless `CODE_DELIVERY_MODE` and every required environment variable are explicitly configured. `CODE_DELIVERY_MODE=preview` performs no storage and sends no email.

### Test and activation sequence

1. Create a dedicated Neon database and run `db/code-delivery.sql`.
2. Copy `.env.example` to an untracked local environment file. Generate independent high-entropy values for `EMAIL_HASH_SECRET`, `UNSUBSCRIBE_SECRET`, and `NEWSLETTER_CONFIRM_SECRET`, plus a 32-byte base64 value for `CODE_ENCRYPTION_KEY`.
3. In App Store Connect, create the one-month subscription offer with auto-renew disabled, then create the production one-time-use code batch.
4. Import a production CSV manually only if App Store Connect API import is unavailable:

   ```sh
   npm run codes:import -- AppleProductionCodes.csv cmm-production-001 2027-01-15T08:00:00.000Z manual
   ```

5. Configure a Brevo test list and authenticated sending domain. Keep `BREVO_SANDBOX_MODE=true` to validate requests without delivering messages, then change it to `false` only for controlled real-inbox tests.
6. Configure Cloudflare Turnstile test keys, use a Vercel Preview deployment, and verify: unchecked consent, invalid email, duplicates, queue exhaustion, bounce behavior, unsubscribe, all 13 languages, and production code assignment without exposing code values.
7. Only after sign-off, connect the visible form to `/api/request-code`, update the privacy page, set production secrets, and change `CODE_DELIVERY_MODE` from `disabled` to `ready`.

The App Store Connect `.p8` private key, database URL, encryption keys, Brevo key, and code values must stay in encrypted server-side environment variables. Never place them in this public repository or client-side JavaScript.

## Newsletter + donations setup

The site ships with an email-capture backbone and a donate seam. **Both are dark by default**: every signup form stays hidden until the API is configured (the front-end asks `GET /api/subscribe` on load), and every donate button stays hidden until its `data-donate-url` holds a real URL. No dead forms, no dead links.

**This repo is public — never put an API key in code.** Keys live only in Vercel environment variables.

### Newsletter and code email — Brevo

The prepared welcome-gift flow uses Brevo for transactional delivery and the confirmed newsletter list. Configure the authenticated sender domain, sender address, a dedicated list, and the `BREVO_*` values from `.env.example` in Vercel. Keep `BREVO_SANDBOX_MODE=true` during provider-contract tests. Only set it to `false` for controlled inbox tests after the sender domain is authenticated.

### Donations — Ko-fi, 0% platform fee (~5 minutes)

Ko-fi takes 0% of one-off tips; money lands directly and instantly in your own Stripe or PayPal account — no payout schedule, no minimum, donors need no account. Connect **Stripe** (Slovenia supported): standard EU cards cost ~1.5% + €0.25 vs PayPal's ~3.4% + €0.35.

1. Sign up at [ko-fi.com](https://ko-fi.com) and pick your page name (`ko-fi.com/yourname`).
2. **Settings → Payment options** → connect **Stripe** (and/or PayPal) — that's where donations land directly.
3. Paste your page URL (`https://ko-fi.com/yourname`) into the **two** `data-donate-url="DONATE_URL_HERE"` attributes in `index.html` (the Mac card in the pricing section, and the footer). The "Support the free Mac app" buttons unhide automatically.

## Remaining placeholders

- `APP_STORE_URL_HERE` — still used only by unreleased future app pages when present. Control My Mac no longer exposes an App Store placeholder on the public pages.
- `DOWNLOAD_URL_HERE` — the "Download coming soon" buttons on `filepilot.html`. Replace with the direct-download URL once FilePilot ships.
- `DONATE_URL_HERE` — the two hidden "Support the free Mac app" buttons in `index.html` (pricing + footer). Replace with your Ko-fi page URL (see above); the buttons stay hidden until then.
