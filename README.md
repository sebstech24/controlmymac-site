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
| — | `scripts/store-buttons.py` + `.json` | The download area (Mac, Windows, App Store, Google Play) on every homepage and download page; the Windows and Google Play links live in the `.json` |
| — | `AUDIENCE-RESEARCH.md` | Public-safe research notes behind the variant messaging |

## After every release

Run this after every Mac or iPhone release, then commit and push what it changed (a push to `main` publishes):

```sh
python3 scripts/after-release.py --fix
```

It compares the site with what is really out (`appcast.xml`, the newest GitHub release, the live `/download.dmg`,
Apple's public lookup) and rewrites the press page facts. Without `--fix` it only reports and exits 1 when
something is stale. Apple's lookup can lag a few hours behind an approval: if it still shows the old iPhone
version, run it again later.

### Mac release

| What | Where | How |
|---|---|---|
| The DMG | GitHub release `vX.Y.Z` in this repo, file named `ControlMyMac-X.Y.Z.dmg` | `gh release create` (steps in the app repo, `native/AppStore/mac-<version>/PUBLISH.md`) |
| Update for people who already have the app | `appcast.xml`, new item on top | by hand from the release's `appcast-item.xml` |
| Download buttons | nothing | `/download.dmg` follows the newest GitHub release by itself (cached up to 30 minutes) |
| Press page "Current versions" and the facts file in the press kit zip | `press.html`, `assets/press/control-my-mac-press-kit.zip` | `after-release.py --fix` (never edit `press.html` by hand) |

The links to `v1.2.3` are the last Intel version and stay as they are.

### iPhone and iPad release

| What | Where | How |
|---|---|---|
| Press page version, date and language list | `press.html` and the kit zip | `after-release.py --fix`, once the App Store shows the new version |
| Copy about a feature that changed | the pages that describe it, in every language folder | by hand, then `scripts/sync-locales.py` |

### Only when that thing changes

| Change | Update |
|---|---|
| A new language | the new folder, switcher, sitemap, 404 list (see the app repo's `native/AppStore/l10n-nine-languages/README.md`) and `LANG_NAMES` in `scripts/after-release.py` |
| Prices | `index.html` (price cards and the four `Offer` entries in the structured data), `pro.html`, `support.html`, the same pages in every language folder, and the two price texts in `scripts/build-press-kit.py`. App Store descriptions carry no amounts, only "Prices vary by country." |
| Minimum iOS, iPadOS or macOS version | the "macOS 14+ · iOS/iPadOS 18+" lines and footers on every page, `operatingSystem` in the structured data, the Requirements fact in `scripts/build-press-kit.py` |
| What the apps collect or send | `privacy.html` and its effective date, in every language |

## Windows and Google Play buttons (prepared 12 Oct 2026, not live)

The download area shows one entry per device, each under a device icon: Mac, Windows, iPhone and iPad (App Store),
Android (Google Play). It sits in the hero of every homepage and, without the Mac entry, under the button on every
Mac download page. `scripts/store-buttons.py` builds it in all 25 languages; never edit the block between
`<!-- get:start -->` and `<!-- get:end -->` by hand.

**The one place for the two links is the top of `scripts/store-buttons.json`.**

| Setting | Now | Meaning |
|---|---|---|
| `links.windows` | `PASTE_THE_WINDOWS_DOWNLOAD_LINK_HERE` | The Windows button is live once this starts with `https://`: "Download for Windows" with a short note (details under "Windows: what is decided and known"). A Store page link here instead shows Microsoft's badge |
| `links.windows_store` | `PASTE_THE_MICROSOFT_STORE_PAGE_LINK_HERE` | Optional small "Also in the Microsoft Store" link under the Windows button |
| `links.android` | `PASTE_THE_GOOGLE_PLAY_LINK_HERE` | Same for Google Play |
| `until_a_link_exists` | `soon` | `soon`: a quiet "Coming soon" pill that opens the waiting list (`#platforms`). `hidden`: nothing |
| `app_name.windows`, `app_name.android` | `Control My PC` | Working name, not final until Sebastian confirms (recommended by the SEO chat, 12 Oct 2026; the iPhone and Mac apps stay Control My Mac). A name that differs from the site's shows under the device name on the live button, and in the Google Play label for screen readers. It appears nowhere while the device is still "Coming soon" |

To switch a button on: paste the link, then

```sh
python3 scripts/store-buttons.py     # rewrites the 50 pages
python3 scripts/sync-locales.py --check && npm test
```

commit and push. `python3 scripts/store-buttons.py --check` (also part of `npm test`) fails when the pages and the
settings are out of step.

### Official badges

Apple's and Google's rules allow only their own badge artwork, at the same height, App Store first, with clear space
around it, and no Apple, Windows or Android logos as icons (so the device icons are plain shapes).

- **Not in the repository yet** (needs Sebastian's yes: Apple's artwork comes with its Marketing Artwork License).
  Put Apple's black badges in `assets/badges/app-store/<folder>.svg` and Google's in
  `assets/badges/google-play/<folder>.png` (`<folder>` = language folder, `en` for English), then run the builder.
- Until Apple's file is there the pages keep the site's own App Store button. Without Google's file the Google Play
  button refuses to go live.
- Only if Windows goes through the Microsoft Store: Microsoft's badges in `assets/badges/microsoft-store/<folder>.svg`
  (from Microsoft's badge page, `apps.microsoft.com/badge`).
- Apple asks for one App Store badge per layout: once the official badge is in, the second App Store button on the
  homepage (pricing section) and the ones on the other pages need the same swap or a plain text button.
- `python3 scripts/store-buttons.py --remote-badges` is for a local look only (it loads the artwork from Apple's and
  Google's servers). Never commit its output; `npm test` catches it.

### Also do when Windows or Android goes live (the switch does not do these)

- Copy that says Mac only: the pairing note under the App Store button, the FAQ "Does it work with Windows or
  Android?", page titles and descriptions, the structured data (`operatingSystem`, `installUrl`), in every language.
- The "Coming soon to Windows and Android" section and its footer link (`scripts/apply-waitlist.py`): reword or
  remove once both are out, and email the waiting list. Its text says "Control My Mac is on its way to Windows PCs
  and Android phones": change it if the final name is Control My PC.
- `get-iphone.html` sends every visitor to the App Store. Decide whether Android phones should go to Google Play.
- `scripts/build-press-kit.py`: the "Get it" fact and the Windows and Android question (never edit `press.html`).
- Google Play status and plan: `Fable stuff/_Marketing/11-GOOGLE-PLAY-SAME-AS-APP-STORE.md` (on the Mac).

### Windows: what is decided and known (12 Oct 2026, from the "Control My PC: signed Windows download" chat)

Sebastian chose the Microsoft Store, with both a download button and the Store page ("signing do microsoft store ...
Installer. do both store and direct download"). Nothing is live: no Store developer account, no Store ID, and no real
iPhone has controlled the Windows build yet.

- `links.windows` gets Microsoft's installer link, `https://get.microsoft.com/installer/download/<Store ID>`. A click
  downloads a small file signed by Microsoft that installs the Store app. Nothing is hosted on this site, it picks
  normal or ARM PCs by itself, Windows shows no warning, and the Store updates the app.
- `links.windows_store` gets the Store page, `https://apps.microsoft.com/detail/<Store ID>`. It appears as a small
  "Also in the Microsoft Store" link under the button.
- The `<Store ID>` (12 characters) exists once he has opened the free Store developer account and reserved the name.
- The button downloads a Windows file, so it is the gradient main button only for Windows visitors (there the Mac
  button of the same area turns quiet); for everyone else it is a quiet button. `assets/site.js` does this. To see it
  locally add `&platform-preview=windows` to the address (localhost only).
- Under the button: "Windows 10+ · Free · No account" (`windows_needs` plus words the Mac note already uses). Facts:
  version 1.0.0, Windows 10 version 1809 or newer or Windows 11, 64-bit, about 58 MB.
- The Windows and Android apps open `controlmymac.com/download`, the Mac download page. That page now lists the other
  devices under the Mac button, so those visitors find their own download once it is live.
- The name is not settled ("For the name I want it to be the same" can mean either one): `app_name` stays the one place.
- Only if he later buys his own certificate and hosts the installer himself: **never upload Windows files as a
  normal release of this repository.** `api/download-dmg.ts` takes the `.dmg` from the **latest** release here, so a
  Windows release would break the Mac download. Use a separate public repository or `--latest=false`.
- Current notes of that chat: `~/Coding/ControlMyMac-CrossPlatform/dist/windows-release-drafts-2026-10-12/WINDOWS-DOWNLOAD-FOR-WEBSITE.md`
  (on the Mac).

Local preview of a worktree: the built-in preview serves the main checkout, so start
`python3 -m http.server 8898 --directory <worktree>` and open `http://localhost:8898/index.html?waitlist-preview=1`.

## Vercel Web Analytics

The shared site script loads Vercel Web Analytics from `/_vercel/insights/script.js`. Also enable Web Analytics in the Vercel project dashboard; Vercel creates the analytics routes after the next deployment.

## Subscriber welcome gift (prepared, not live)

The repository contains a disabled implementation for a subscriber welcome gift:

1. The visitor explicitly joins occasional Control My Mac and Sebastian Apps emails.
2. The only automatic email contains a unique Apple code for one free month, a "Redeem in the App Store" button (the code's Apple redemption link), the in-app steps, and an unsubscribe link.
3. Consent is single opt-in (since 26 Sep 2026): the required checkbox is recorded with the request, and the daily cron adds the address to the marketing list after the code email is sent. `/api/confirm-newsletter` only keeps serving confirmation links sent before that date.
4. A signed unsubscribe page removes the address from the list without invalidating a code already sent. An unsubscribe sticks: a later form request for the same address (which anyone can make) never re-subscribes it, and a request that sends nothing changes nothing stored.
5. A daily authenticated Vercel Cron imports newly generated Apple batches, fulfills queued requests, retries provider synchronization, and creates another 500-code batch when fewer than 100 remain.

The public pages do not call this API yet. `/api/request-code` remains unavailable unless `CODE_DELIVERY_MODE` and every required environment variable are explicitly configured. `CODE_DELIVERY_MODE=preview` performs no storage and sends no email.

### Test and activation sequence

1. Create a dedicated Neon database and run `db/code-delivery.sql`.
2. Copy `.env.example` to an untracked local environment file. Generate independent high-entropy values for `EMAIL_HASH_SECRET` and `UNSUBSCRIBE_SECRET` (keep an existing `NEWSLETTER_CONFIRM_SECRET` so old confirmation links still work), plus a 32-byte base64 value for `CODE_ENCRYPTION_KEY`.
3. In App Store Connect, create the one-month subscription offer with auto-renew disabled, then create the production one-time-use code batch.
4. Import a production CSV manually only if App Store Connect API import is unavailable:

   ```sh
   npm run codes:import -- AppleProductionCodes.csv cmm-production-001 2027-01-15T08:00:00.000Z manual
   ```

5. Configure a Brevo test list and authenticated sending domain. Keep `BREVO_SANDBOX_MODE=true` to validate requests without delivering messages, then change it to `false` only for controlled real-inbox tests.
6. Configure Cloudflare Turnstile test keys, use a Vercel Preview deployment, and verify: unchecked consent, invalid email, duplicates, queue exhaustion, bounce behavior, unsubscribe, all 16 languages, and production code assignment without exposing code values.
7. Only after sign-off, connect the visible form to `/api/request-code`, update the privacy page, set production secrets, and change `CODE_DELIVERY_MODE` from `disabled` to `ready`.

The App Store Connect `.p8` private key, database URL, encryption keys, Brevo key, and code values must stay in encrypted server-side environment variables. Never place them in this public repository or client-side JavaScript.

## Newsletter + donations setup

The site ships with an email-capture backbone and a donate seam. **Both are dark by default**: every signup form stays hidden until the API is configured (the front-end asks `GET /api/subscribe` on load), and every donate button stays hidden until its `data-donate-url` holds a real URL. No dead forms, no dead links.

**This repo is public — never put an API key in code.** Keys live only in Vercel environment variables.

### Newsletter and code email — Brevo

The prepared welcome-gift flow uses Brevo for transactional delivery and the newsletter list. Configure the authenticated sender domain, sender address, a dedicated list, and the `BREVO_*` values from `.env.example` in Vercel. Keep `BREVO_SANDBOX_MODE=true` during provider-contract tests. Only set it to `false` for controlled inbox tests after the sender domain is authenticated.

### Donations — Ko-fi, 0% platform fee (~5 minutes)

Ko-fi takes 0% of one-off tips; money lands directly and instantly in your own Stripe or PayPal account — no payout schedule, no minimum, donors need no account. Connect **Stripe** (Slovenia supported): standard EU cards cost ~1.5% + €0.25 vs PayPal's ~3.4% + €0.35.

1. Sign up at [ko-fi.com](https://ko-fi.com) and pick your page name (`ko-fi.com/yourname`).
2. **Settings → Payment options** → connect **Stripe** (and/or PayPal) — that's where donations land directly.
3. Paste your page URL (`https://ko-fi.com/yourname`) into the **two** `data-donate-url="DONATE_URL_HERE"` attributes in `index.html` (the Mac card in the pricing section, and the footer). The "Support the free Mac app" buttons unhide automatically.

## Remaining placeholders

- `APP_STORE_URL_HERE` — still used only by unreleased future app pages when present. Control My Mac no longer exposes an App Store placeholder on the public pages.
- `PASTE_THE_WINDOWS_DOWNLOAD_LINK_HERE`, `PASTE_THE_MICROSOFT_STORE_PAGE_LINK_HERE` and `PASTE_THE_GOOGLE_PLAY_LINK_HERE` — only in `scripts/store-buttons.json`, never on a page (see "Windows and Google Play buttons").
- `DOWNLOAD_URL_HERE` — the "Download coming soon" buttons on `filepilot.html`. Replace with the direct-download URL once FilePilot ships.
- `DONATE_URL_HERE` — the two hidden "Support the free Mac app" buttons in `index.html` (pricing + footer). Replace with your Ko-fi page URL (see above); the buttons stay hidden until then.
