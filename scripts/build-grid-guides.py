#!/usr/bin/env python3
"""Builds the English-only Grid guide pages (Grid-first pivot, 29 Sep 2026; plan in
_Marketing/PIVOT-GRID-FIRST.md section 4.3).

The header, App Store badge and footer are copied from stream-deck-alternative.html so the guides always match the
current site chrome. Re-run after that page changes:  python3 scripts/build-grid-guides.py [template.html]
Like the other English guides, these pages have NO i18n.js (its auto-redirect would send other languages to 404s).
"""
import html, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "stream-deck-alternative.html")
SITE = "https://www.controlmymac.com"
CHECKED = "September 2026"
t = open(TEMPLATE, encoding="utf-8").read()
HEADER = re.search(r'<header class="site-header">.*?</header>', t, re.S).group(0)
STORE = re.search(r'<div class="hero-store">.*?</div>', t, re.S).group(0)
FOOTER = re.search(r'<footer class="site-footer">.*?</footer>', t, re.S).group(0)

GUIDES = [  # (url, card title, card text) for "More guides" and the footer guide row
    ("/stream-deck-alternative", "Stream Deck alternative", "A Grid for every Mac app on the iPhone you already own."),
    ("/premiere-pro-shortcuts-iphone", "Premiere Pro", "A ready-made Grid of Premiere Pro shortcuts."),
    ("/davinci-resolve-shortcuts-iphone", "DaVinci Resolve", "A ready-made Grid of DaVinci Resolve shortcuts."),
    ("/final-cut-pro-shortcuts-iphone", "Final Cut Pro", "A ready-made Grid of Final Cut Pro shortcuts."),
    ("/macro-pad-for-mac", "Macro pad for Mac", "Turn your iPhone into a pad of one-tap Mac shortcuts."),
    ("/one-hand", "One-handed Mac", "Two-hand shortcuts become one tap."),
]
ICON = ('<div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/>'
        '<rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/>'
        '<rect x="14" y="14" width="7" height="7" rx="2"/></svg></div>')
CTA = ('<div class="cta">\n      <a class="btn btn-primary" data-dl-cta href="/download">Download free for Mac</a>\n'
       '      <a class="btn btn-quiet" data-dl-alt hidden href="/download.dmg">Download the .dmg anyway</a>\n    </div>')
SHOTS = {
    "premiere": ("grid-premiere.webp", "A Premiere Pro Grid on iPhone in dark mode with Razor, Selection, Add Edit, Ripple Delete, Add Marker, Snap, Zoom In, Zoom Out and Export buttons, and Auto-Switch turned on",
                 "A real Grid for Premiere Pro, switched in by itself."),
    "menu": ("grid-menu.webp", "The grid menu on iPhone listing a Default grid for all other apps and separate grids that switch in for Zoom, Excel, Premiere Pro, Photoshop and Chrome, with Manage Grids and How App Grids Work",
             "One Grid per Mac app. Default covers the rest."),
    "zoom": ("grid-zoom.webp", "A Zoom Grid on iPhone with Mute, Video, Share Screen, Raise Hand, Chat, Participants, Gallery View, Record and Leave buttons",
             "Any app with keyboard shortcuts can have its own Grid."),
}


def shot(key):
    f, alt, cap = SHOTS[key]
    return (f'<figure class="shot">\n          <img src="/assets/shots/{f}" loading="lazy" width="330" height="717" alt="{html.escape(alt)}">\n'
            f'          <figcaption>{html.escape(cap)}</figcaption>\n        </figure>')


def page(p):
    url = SITE + p["path"]
    faq_ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", a)}} for q, a in p["faq"]]}
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": p["crumb"], "item": url}]}
    rows = "\n".join(f'            <tr><th scope="row">{html.escape(b)}</th><td>{html.escape(k)}</td><td>{html.escape(w)}</td></tr>'
                     for b, k, w in p["buttons"])
    steps = "\n".join(f"        <h3>{i}. {html.escape(h)}</h3>\n        <p>{b}</p>" for i, (h, b) in enumerate(p["steps"], 1))
    faq = "\n".join(f"        <details>\n          <summary>{html.escape(q)}</summary>\n          <p>{a}</p>\n        </details>" for q, a in p["faq"])
    guides = "\n".join(f'        <a class="card use" href="{u}">\n          {ICON}\n          <h3>{html.escape(n)}</h3>\n          <p>{html.escape(d)}</p>\n        </a>'
                       for u, n, d in GUIDES if u != p["path"])
    footer = FOOTER.replace('Control My Mac is not affiliated with Elgato.', 'Control My Mac is not affiliated with Elgato. ' + p["tm"])
    footer = re.sub(r'<nav class="fguides" aria-label="Guides">.*?</nav>', '<nav class="fguides" aria-label="Guides">' + " ".join(
        f'<a href="{u}">{html.escape(n)}</a>' for u, n in [("/iphone-as-mouse-for-mac", "iPhone as a mouse for Mac"),
        ("/stream-deck-alternative", "Stream Deck alternative"), ("/compare", "Compare Mac remote apps"),
        ("/macro-pad-for-mac", "Macro pad for Mac"), ("/premiere-pro-shortcuts-iphone", "Premiere Pro shortcuts"),
        ("/davinci-resolve-shortcuts-iphone", "DaVinci Resolve shortcuts"), ("/final-cut-pro-shortcuts-iphone", "Final Cut Pro shortcuts")]) + '</nav>', footer, flags=re.S)
    e = html.escape
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="apple-itunes-app" content="app-id=6781458180">
<meta name="robots" content="index, follow, max-image-preview:large">
<title>{e(p["title"])}</title>
<meta name="description" content="{e(p["desc"])}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Control My Mac">
<meta property="og:title" content="{e(p["og"])}">
<meta property="og:description" content="{e(p["desc"])}">
<meta property="og:url" content="{url}">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="{SITE}/assets/og-v2.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Control My Mac: a Grid of one-tap Mac shortcuts, a trackpad and a keyboard on your iPhone or iPad">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(p["og"])}">
<meta name="twitter:description" content="{e(p["desc"])}">
<meta name="twitter:image" content="{SITE}/assets/og-v2.png">
<meta name="theme-color" content="#0b0d12" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#f7f8fb" media="(prefers-color-scheme: light)">
<link rel="icon" type="image/png" href="/assets/control-my-mac-icon.png">
<link rel="apple-touch-icon" href="/assets/control-my-mac-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/icon-192.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet" href="/assets/site.css">
<script type="application/ld+json">
{json.dumps(crumbs, ensure_ascii=False)}
</script>
<script type="application/ld+json">
{json.dumps(faq_ld, ensure_ascii=False)}
</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

{HEADER}

<main id="main">
  <section class="hero wrap">
    <p class="pill">{e(p["pill"])}</p>
    <h1>{p["h1"]}</h1>
    <p class="sub">{p["sub"]}</p>
    {CTA}
    <p class="cta-note" data-dl-note>macOS 14+ · iOS/iPadOS 18+ · Free Mac app · No account</p>

    {STORE}
  </section>

  <section class="band">
    <div class="wrap">
      <h2 class="h2">{e(p["grid_h2"])}</h2>
      <p class="lead">{p["grid_lead"]}</p>
      <div class="table-wrap">
        <table class="cmp">
          <thead>
            <tr><th scope="col">Button</th><th scope="col">Mac shortcut</th><th scope="col">What it does</th></tr>
          </thead>
          <tbody>
{rows}
          </tbody>
        </table>
      </div>
      <p class="cmp-note">{p["source_note"]}</p>
    </div>
  </section>

  <section>
    <div class="wrap">
      <h2 class="h2">{e(p["steps_h2"])}</h2>
      <p class="lead">{p["steps_lead"]}</p>
      <div class="prose">
{steps}
      </div>
      <div class="shot-row">
        {shot(p["shots"][0])}
        {shot(p["shots"][1])}
      </div>
    </div>
  </section>

  <section class="band">
    <div class="wrap">
      <h2 class="h2">Good to know</h2>
      <div class="prose">
{p["honest"]}
      </div>
    </div>
  </section>

  <section id="faq">
    <div class="wrap">
      <h2 class="h2">Questions people ask</h2>
      <div class="prose faq">
{faq}
      </div>
    </div>
  </section>

  <section class="band">
    <div class="wrap">
      <h2 class="h2">More guides</h2>
      <div class="grid-uses">
{guides}
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="final">
        <h2 class="h2">{e(p["final_h2"])}</h2>
        <p class="lead">The Mac app is free. Start the 7-day free trial of Full App on iPhone or iPad to give every Mac app its own Grid. If you don't keep it, Essentials stays free with the trackpad, keyboard basics and one Grid button.</p>
        {CTA}
        <p class="cta-note">macOS 14+ · Apple silicon · Intel Macs up to <a href="https://github.com/sebstech24/controlmymac-site/releases/download/v1.2.3/ControlMyMac-1.2.3.dmg">version 1.2.3</a> · No account</p>
      </div>
    </div>
  </section>
</main>

{footer}

<script src="/assets/site.js" defer></script>
</body>
</html>
"""


HONEST_COMMON = """        <p><strong>Full App.</strong> A Grid for each Mac app and Auto-Switch are part of Full App ($3.99 a month or $17.99 once in the US, with a 7-day free trial). The free Essentials plan includes one Grid button, so you can try the idea first.</p>
        <p><strong>Keyboard shortcuts only.</strong> Each button sends a key combo, or a few in a row, to your Mac. It doesn't run plugins, scripts or typed text, so anything you can't do with a keyboard shortcut in {app} is out of reach for the Grid too.</p>
        <p><strong>Learning from the Mac.</strong> Recording a shortcut by pressing it on the Mac needs the Input Monitoring permission for the Mac app. It only listens while you're recording and saves just the combo. You can also set every shortcut by hand.</p>
        <p><strong>Your shortcuts, not ours.</strong> The list above uses {app}'s default Mac shortcuts. If you've changed yours, record them from your Mac instead and the buttons will always match.</p>"""


def app_steps(app):
    return [
        (f"Open {app} on your Mac", f"Bring {app} to the front. Control My Mac on your iPhone or iPad sees which app is in front."),
        (f"Tap “Grid for {app}”", f"In the Grid, the button names the app that's in front. One tap makes a Grid just for {app}, starting as a copy of your Default grid."),
        ("Add your buttons", "Tap Edit Grid, add a button, then press the shortcut on your Mac's keyboard to record it, or pick the keys by hand. Rename it and drag it where your thumb rests."),
        ("Leave Auto-Switch on", f"From now on the {app} Grid appears by itself whenever {app} is in front, and every other app uses Default. Turn Auto-Switch off if you want one Grid to stay put."),
    ]


PAGES = []
# App pages are filled in below from verified vendor shortcut lists (see PREMIERE/RESOLVE/FCP).
from grid_guides_data import PAGES as DATA_PAGES  # noqa: E402

for p in DATA_PAGES:
    p.setdefault("steps", app_steps(p["app"]) if p.get("app") else p.get("steps"))
    p.setdefault("honest", HONEST_COMMON.format(app=p.get("app", "your apps")) + p.get("honest_extra", ""))
    out = os.path.join(ROOT, p["path"].lstrip("/") + ".html")
    open(out, "w", encoding="utf-8").write(page(p))
    print("wrote", os.path.relpath(out, ROOT), len(p["buttons"]), "buttons")
