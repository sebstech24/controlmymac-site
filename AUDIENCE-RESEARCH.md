# Audience Research — Control My Mac

Notes from public web research (June 2026) on how people actually use
iPhone-as-Mac-remote apps, what competitor landing pages lead with, and what
users complain about. Used to shape the landing-page variants. Public-safe;
no internal information.

---

## How people actually use phone-as-remote apps

### 1. One-handed / accessibility use
- One-handed computing is a recurring, practical need: permanent (limited
  hand/arm mobility, one usable hand), temporary (cast, sling, RSI flare),
  and situational (nursing or holding a baby while working — a whole genre
  of "nursing at keyboard" guides exists).
- Apple's built-in mobility tools (Dwell, head pointer, Voice Control,
  Accessibility Keyboard) are powerful but heavyweight — they are assistive
  *suites*, not a quick "drive the Mac from the hand I have free" tool.
  Forum threads (e.g. Ask MetaFilter "Accessibility features for the
  one-handed") show people stitching together partial solutions.
- One-hand keyboard layouts (one-hand Dvorak, half-QWERTY) exist precisely
  because typing one-handed on a full keyboard is slow and strains the hand.
  A phone-sized keyboard *designed* for one thumb sidesteps that entirely.
- Implication: lead with "every action is one finger, end to end" and large
  targets. The composer keyboard (draft at your own pace, insert when ready)
  is a genuine differentiator vs racing a live cursor. Tone must be
  practical and respectful — a tool that fits how someone works, never a
  story about overcoming anything.

### 2. Couch / home-theater (HTPC)
- MacRumors / AVS / home-theater forum threads about Mac minis under TVs are
  evergreen. People cobble together app-specific remotes (Kodi remotes,
  Roomie, Harmony) or buy a dedicated wireless keyboard+trackpad slab for
  the coffee table.
- The recurring gap: app-specific remotes control *one* app; the moment you
  need to dismiss a dialog, type a search, or switch from Plex to a browser,
  you need a real pointer and keyboard.
- Implication: position as "the whole Mac, not a media-app remote" — pointer
  + keyboard + launcher means anything on screen is reachable from the sofa.

### 3. Presenters / educators
- Apple's own Keynote Remote pitch is "move freely while presenting" — the
  walk-around-the-room benefit is proven messaging. But Keynote Remote only
  controls Keynote.
- Real talks break out of the deck: browser demos, videos, PowerPoint,
  closing an unexpected popup. That needs a pointer and app switching, not a
  next-slide clicker.
- Venue networks are a known pain point (locked-down Wi-Fi); a Bluetooth
  fallback and zero-internet operation are practical reassurances.
- Implication: "anywhere in the room" + "more than next-slide" — full
  pointer, launcher, window switching from your hand.

### 4. Power users / multitaskers
- The phone is already on the desk; a second input surface for launching
  apps, switching windows and firing shortcuts is the appeal (Mobile Mouse
  leads with breadth: app switcher, media remote, presentation control).
- This audience is sensitive to latency, telemetry, accounts, and
  subscription resentment. They notice transport details ("local only",
  "encrypted", "no cloud round-trip") and reward a lifetime-purchase option.

---

## Competitor landing pages & complaint themes

| Competitor | Leads with | Common complaints (public reviews/docs) |
|---|---|---|
| **Remote Mouse** | Simple "phone becomes a wireless mouse" pitch; free tier | App "riddled with ads"; aggressive review-nags; micro-paywalls (landscape mode, media keys, even Ctrl/Esc and clicking gated behind purchases/subscription described as "predatory"); flaky connections; 2021 public disclosure of six unpatched security flaws in the protocol |
| **Mobile Mouse** | "Unparalleled control in the palm of your hand"; long feature list (air mouse, app switcher, Watch app) | No pricing shown on the site; vague download CTAs; reviews mention connection drops / failure to auto-reconnect |
| **Unified Remote** | Breadth (100+ remotes) | Support docs are dominated by firewall and port configuration (open ports 9511/9512, configure Windows Firewall, manual IP entry) — setup friction is the product's main documented pain |
| **Keynote Remote (Apple)** | Free, "move freely while presenting" | Keynote-only; no pointer, no app switching, no use outside presentations |

### Cross-cutting pains → our honest answers
- **Ads inside a pointing device** → no ads, anywhere.
- **Accounts / sign-ups for a local tool** → no account, ever.
- **Pay-per-key micro-paywalls and opaque pricing** → pricing on the page:
  free Mac app; Essentials stays free with trackpad movement, click, right click
  Live and Draft Keyboard basics, one Grid button and Launcher preview; Full
  App is €4.99/month or €19.99 lifetime after a free App Store 7-day Trial.
- **Shortcut grids that change with context** → Full App can assign a Grid to
  the frontmost Mac app, so the controls change automatically when the user's
  work changes.
- **Firewall/port/IP setup friction** → pair by scanning a QR code; the only
  setup notes we need are standard macOS/iOS permissions.
- **Unencrypted local protocols (Remote Mouse disclosure)** → device-to-device
  over local network or Bluetooth, encrypted, no servers.
- **Cloud dependence** → works with no internet at all.

---

## One-line insight per audience
- **One-hand:** people don't want an "accessibility suite", they want the
  whole Mac through the hand that's free — lead with one-finger end-to-end
  and large targets, in plain practical language.
- **Couch:** app-specific remotes die the moment a dialog appears — sell the
  *whole* Mac from the sofa, pointer and keyboard included.
- **Presenters:** "walk around freely" is proven messaging (Apple uses it),
  but real talks need more than next-slide — pointer, launcher, window
  switching win the comparison with Keynote Remote.
- **Power users:** they're allergic to ads, accounts and rented features —
  local-only transport, encryption, and the €19.99 lifetime option are the
  proof points.

---

## Sources (public)
- justuseapp.com Remote Mouse review pages (ads, paywalled clicks/keys, nag screens)
- thehackernews.com — "6 Unpatched Flaws Disclosed in Remote Mouse App" (2021)
- mobilemouse.com landing page; App Store reviews for Mobile Mouse
- unifiedremote.com FAQ / "How To Troubleshoot Connection Problems" / firewall tutorials
- support.apple.com — Keynote Remote guides; Mac & iPhone mobility accessibility features
- ask.metafilter.com — "Accessibility features for the one-handed (mac)"
- phdinparenting.com / onehandkeyboard.org — one-handed typing while nursing; one-hand layouts
- forums.macrumors.com / avsforum.com — Mac mini HTPC remote threads
