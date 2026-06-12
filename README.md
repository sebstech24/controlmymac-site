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
| — | `assets/site.js` | Audience-choice memory for `/start` (no tracking, localStorage only) |
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

## Remaining placeholders

- `APP_STORE_URL_HERE` — the de-emphasized "Coming soon to the App Store" buttons (`index.html`, all four variant pages, and `smartwake.html`). Replace with the real App Store URL once each iPhone app ships, and reword the buttons to "Download on the App Store".
- `DOWNLOAD_URL_HERE` — the "Download coming soon" buttons on `filepilot.html`. Replace with the direct-download URL once FilePilot ships.
