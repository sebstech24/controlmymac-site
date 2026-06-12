# Control My Mac — Public Site

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
| `/smartwake` | `smartwake.html` | Product page: Smart Wake (iPhone + Apple Watch alarm, unreleased). `#privacy` / `#support` anchors double as its App Store privacy & support URLs |
| `/filepilot` | `filepilot.html` | Product page: FilePilot (Explorer-style file manager for macOS, unreleased, direct download). `#privacy` / `#support` anchors serve as its privacy & support URLs |
| — | `assets/site.css` | Shared design system (glass chrome, accent gradient, light/dark, reduced-motion/transparency fallbacks) |
| — | `assets/site.js` | Audience-choice memory for `/start` (no tracking, localStorage only), newsletter opt-in UI, donate-button seam |
| `/api/subscribe` | `api/subscribe.ts` | Vercel serverless function: adds newsletter signups to the email provider (env-var configured, see below) |
| — | `AUDIENCE-RESEARCH.md` | Public-safe research notes behind the variant messaging |

## Releases — how the download button works

Every download button on the site points at the **stable latest-release URL**:

```
https://github.com/sebstech24/controlmymac-site/releases/latest/download/ControlMyMac.dmg
```

That URL only works if the release asset is named **exactly `ControlMyMac.dmg`**. To publish or update the Mac app:

```sh
gh release create v1.0.0 "<path-to>/ControlMyMac.dmg" \
  --title "Control My Mac 1.0" \
  --notes "Initial public release."
```

No HTML changes are needed for new versions — `releases/latest` always serves the newest release, as long as each release attaches an asset named `ControlMyMac.dmg`.

## Newsletter + donations setup

The site ships with an email-capture backbone and a donate seam. **Both are dark by default**: every signup form stays hidden until the API is configured (the front-end asks `GET /api/subscribe` on load), and every donate button stays hidden until its `data-donate-url` holds a real URL. No dead forms, no dead links.

**This repo is public — never put an API key in code.** Keys live only in Vercel environment variables.

### Newsletter — Kit (kit.com), free "Newsletter" plan (~5 minutes)

Kit's free plan stores up to 10,000 subscribers with unlimited sends, and one-click CSV export of the whole list anytime (Subscribers page → select all → Export CSV).

1. Sign up free at [kit.com](https://kit.com) (Newsletter plan, no card needed), confirm your email and complete your profile / sender address.
2. Click your avatar (top right) → **Settings → Developer** (`app.kit.com/account_settings/developer_settings`).
3. Under **V4 Keys → "Add a new key"**, name it (e.g. `controlmymac-site`) and **copy it immediately** — it is shown once.
4. Vercel dashboard → your project → **Settings → Environment Variables** → add (Production, and Preview if you want to test there):
   - `NEWSLETTER_PROVIDER` = `kit`
   - `NEWSLETTER_API_KEY` = the V4 key you just copied
5. **Redeploy** (Deployments → ⋯ → Redeploy). The signup forms appear automatically: a "While it downloads — want updates?" card after any download click, and a quiet row in the footer.

Note: subscribers added via Kit's API arrive in `active` state (no automatic double opt-in). Consent is collected affirmatively on the site (visitors must submit the form themselves, next to the consent line); if you want confirmed opt-in, send a confirmation broadcast from Kit.

Switching to the runner-up **MailerLite** later (better EU data residency + a built-in "double opt-in for API & integrations" toggle, but only 500 free subscribers): sign up at mailerlite.com, **Integrations → MailerLite API → "Generate new token"**, enable double opt-in for API & integrations in the signup settings, then set `NEWSLETTER_PROVIDER` = `mailerlite`, `NEWSLETTER_API_KEY` = the token, and optionally `NEWSLETTER_GROUP_ID` = a group id. Redeploy. No code changes.

### Donations — Ko-fi, 0% platform fee (~5 minutes)

Ko-fi takes 0% of one-off tips; money lands directly and instantly in your own Stripe or PayPal account — no payout schedule, no minimum, donors need no account. Connect **Stripe** (Slovenia supported): standard EU cards cost ~1.5% + €0.25 vs PayPal's ~3.4% + €0.35.

1. Sign up at [ko-fi.com](https://ko-fi.com) and pick your page name (`ko-fi.com/yourname`).
2. **Settings → Payment options** → connect **Stripe** (and/or PayPal) — that's where donations land directly.
3. Paste your page URL (`https://ko-fi.com/yourname`) into the **two** `data-donate-url="DONATE_URL_HERE"` attributes in `index.html` (the Mac card in the pricing section, and the footer). The "Support the free Mac app" buttons unhide automatically.

## Remaining placeholders

- `APP_STORE_URL_HERE` — the de-emphasized "Coming soon to the App Store" buttons (`index.html`, all four variant pages, and `smartwake.html`). Replace with the real App Store URL once each iPhone app ships, and reword the buttons to "Download on the App Store".
- `DOWNLOAD_URL_HERE` — the "Download coming soon" buttons on `filepilot.html`. Replace with the direct-download URL once FilePilot ships.
- `DONATE_URL_HERE` — the two hidden "Support the free Mac app" buttons in `index.html` (pricing + footer). Replace with your Ko-fi page URL (see above); the buttons stay hidden until then.
