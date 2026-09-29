#!/usr/bin/env python3
"""Additive Grid-pivot edits to existing English pages (plan: _Marketing/PIVOT-GRID-FIRST.md 4.2; Sebastian approved
29 Sep 2026). Run ONLY after "Site: Grid-first copy for iOS 1.2.4 (13 locales)" is on main and this branch is rebased
onto it: those pages were held by an auto-publish job that aborts if they change.

Every edit is an exact-text replacement that must match exactly once, so a changed page stops the script instead of
being patched in the wrong place. Re-running is safe: edits already applied are skipped.

  1. US visitors saw euro prices on the English homepage, /pro, /one-hand, /support and /present: show US dollars, name the
     euro prices. Trademark notes for Adobe, Blackmagic and Apple products on pages whose new copy names them.
  2. /one-hand: new section "Two-hand shortcuts become one tap".
  3. /iphone-as-mouse-for-mac: a Grid block before "More guides".
  4. /stream-deck-alternative: FAQ (+ FAQPage data) and two more guide cards.
  5. Footer guide row on the English pages: + Macro pad for Mac.
  6. sitemap.xml: the four new guides.
"""
import datetime, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TODAY = datetime.date.today().isoformat() if len(sys.argv) < 2 else sys.argv[1]
changed = set()


def edit(path, old, new, marker=None):
    p = os.path.join(ROOT, path)
    t = open(p, encoding="utf-8").read()
    if (marker or new) in t:
        return
    n = t.count(old)
    if n != 1:
        raise SystemExit(f"STOP: {path}: expected 1 match, found {n}:\n{old[:200]}")
    open(p, "w", encoding="utf-8").write(t.replace(old, new))
    changed.add(path)


EURO = "In euro countries Full App is €4.99 a month or €19.99 once, and the App Store always shows the price for your country before you buy."

# 1. prices ----------------------------------------------------------------------------------------------------------
edit("index.html", '<p class="amt">€0</p>', '<p class="amt">$0</p>')
edit("index.html", '<p class="amt">€4.99<span>/month</span></p>', '<p class="amt">$3.99<span>/month</span></p>')
edit("index.html", '<p class="amt" style="margin-top:var(--sp-m)">€19.99<span> once</span></p>',
     '<p class="amt" style="margin-top:var(--sp-m)">$17.99<span> once</span></p>')
t = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
old_faq = "It's €4.99/month after a free 7-day trial, or €19.99 once, bought in the iPhone or iPad app through Apple."
new_faq = ("It's $3.99/month after a free 7-day trial, or $17.99 once, in the US (€4.99 or €19.99 in euro countries), "
           "bought in the iPhone or iPad app through Apple.")
if old_faq in t:
    if t.count(old_faq) != 2:
        raise SystemExit(f"STOP: index.html FAQ price sentence found {t.count(old_faq)} times, expected 2 (JSON-LD + page)")
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(t.replace(old_faq, new_faq))
    changed.add("index.html")
edit("index.html", '<p class="price-note">Every feature is listed above',
     f'<p class="price-note">Prices shown are US prices. {EURO} Every feature is listed above')
edit("index.html", '    {"@type":"Offer","name":"Full App (monthly)","price":"4.99","priceCurrency":"EUR"}\n',
     '    {"@type":"Offer","name":"Full App (monthly)","price":"4.99","priceCurrency":"EUR"},\n'
     '    {"@type":"Offer","name":"Full App (lifetime)","price":"17.99","priceCurrency":"USD"},\n'
     '    {"@type":"Offer","name":"Full App (monthly)","price":"3.99","priceCurrency":"USD"}\n', marker='"priceCurrency":"USD"')

edit("pro.html", '<p class="amt">€0</p>', '<p class="amt">$0</p>')
edit("pro.html", '<p class="amt">€19.99<span> once</span></p>', '<p class="amt">$17.99<span> once</span></p>')
edit("pro.html", "or €4.99/month — free 7-day trial, then auto-renews unless cancelled",
     "or $3.99/month, free 7-day trial, then auto-renews unless cancelled")
edit("pro.html", '<p class="price-note">Lifetime means lifetime.', f'<p class="price-note">Prices shown are US prices. {EURO} Lifetime means lifetime.')
edit("pro.html", "auto-renews at €4.99/month unless you cancel", "auto-renews at $3.99/month in the US (€4.99 in euro countries) unless you cancel")

edit("support.html", "auto-renews into a 4.99 EUR per month subscription unless you cancel before it ends",
     "auto-renews into a $3.99 per month subscription in the US (4.99 EUR in euro countries) unless you cancel before it ends")
edit("support.html", "Full App is 4.99 EUR per month or 19.99 EUR lifetime (a one-time purchase),",
     "Full App is $3.99 per month or $17.99 lifetime (a one-time purchase) in the US, or 4.99 EUR and 19.99 EUR in euro countries,")
edit("support.html", "auto-renews at €4.99/month unless you cancel</strong>",
     "auto-renews at $3.99/month in the US (€4.99 in euro countries) unless you cancel</strong>")
edit("support.html", "<strong>Full App</strong> (€4.99/month or €19.99 lifetime)",
     "<strong>Full App</strong> ($3.99/month or $17.99 lifetime in the US, €4.99 or €19.99 in euro countries)")
edit("present.html", "or unlock for €4.99/month or €19.99 once.",
     "or unlock for $3.99/month or $17.99 once in the US (€4.99 or €19.99 in euro countries).")
TM = ("Premiere Pro and Photoshop are trademarks of Adobe, DaVinci Resolve is a trademark of Blackmagic Design, and Final Cut "
      "Pro is a trademark of Apple Inc. Control My Mac is not affiliated with Adobe, Blackmagic Design or Apple.")
edit("stream-deck-alternative.html", "Control My Mac is not affiliated with Elgato.</p>",
     "Control My Mac is not affiliated with Elgato. " + TM + "</p>", marker="not affiliated with Adobe")
edit("iphone-as-mouse-for-mac.html", "Remote-control traffic stays encrypted and travels directly between your devices.</p>",
     "Remote-control traffic stays encrypted and travels directly between your devices. " + TM + "</p>", marker="not affiliated with Adobe")

edit("one-hand.html", "and Full App is €4.99/month or €19.99 once.",
     "and Full App is $3.99/month or $17.99 once in the US (€4.99 or €19.99 in euro countries).")

# 2. /one-hand section, placed after "How Control My Mac fills the gaps" (band) and before "More guides" ------------------
ONE_HAND = """  <section id="one-tap-shortcuts">
    <div class="wrap">
      <h2 class="h2">Two-hand shortcuts become one tap</h2>
      <p class="lead">Many Mac shortcuts need two or three keys held down at once, often at opposite ends of the keyboard. With one hand that's a stretch, and sometimes impossible. On the Grid, each one is a single button.</p>
      <div class="grid-2">
        <article class="card">
          <h3>The awkward ones, one tap each</h3>
          <p>Shift-Command-4 for a screenshot, Option-Command-Esc to force quit, Control-Command-Q to lock the screen, Control-Command-Space for emoji. Put them on your Grid and each chord becomes one press of one finger.</p>
        </article>
        <article class="card">
          <h3>No need to press them to set them up</h3>
          <p>You can record a shortcut by pressing it on the Mac once, or simply pick the keys by hand on the phone. Either way, you never have to hold the chord again.</p>
        </article>
        <article class="card">
          <h3>Every app gets its own buttons</h3>
          <p>Give your browser, your editor or your mail app its own Grid. It switches in by itself when that app comes to the front, so the right shortcuts are always under your thumb.</p>
        </article>
        <article class="card">
          <h3>Right beside the trackpad</h3>
          <p>Your favorite shortcuts can also sit in the trackpad's top row, up to 12, so pointing and shortcuts happen on the same screen without switching modes.</p>
        </article>
      </div>
      <div class="prose">
        <p>A Grid for each app, Auto-Switch and the trackpad's top row come with Full App. The free Essentials plan includes one Grid button to try it. Ready-made examples are in the <a href="/macro-pad-for-mac">macro pad guide</a>.</p>
      </div>
    </div>
  </section>

"""
edit("one-hand.html", '  <section>\n    <div class="wrap">\n      <h2 class="h2">More guides</h2>',
     ONE_HAND + '  <section>\n    <div class="wrap">\n      <h2 class="h2">More guides</h2>', marker='id="one-tap-shortcuts"')

# 3. /iphone-as-mouse-for-mac Grid block, before "More guides" ------------------------------------------------------
MOUSE_GRID = """  <section id="shortcut-deck">
    <div class="wrap">
      <h2 class="h2">Your iPhone can be a shortcut deck too</h2>
      <p class="lead">The same app gives every Mac app its own Grid of one-tap shortcut buttons. Switch apps on the Mac and the buttons on your phone switch with you.</p>
      <div class="prose">
        <p>Record a shortcut by pressing it on your Mac, or set it by hand, then tap it from anywhere in the room. See the <a href="/macro-pad-for-mac">macro pad guide</a> for a starter Grid, or ready-made Grids for <a href="/premiere-pro-shortcuts-iphone">Premiere Pro</a>, <a href="/davinci-resolve-shortcuts-iphone">DaVinci Resolve</a> and <a href="/final-cut-pro-shortcuts-iphone">Final Cut Pro</a>.</p>
      </div>
    </div>
  </section>

"""
edit("iphone-as-mouse-for-mac.html", '  <section>\n    <div class="wrap">\n      <h2 class="h2">More guides</h2>',
     MOUSE_GRID + '  <section>\n    <div class="wrap">\n      <h2 class="h2">More guides</h2>', marker='id="shortcut-deck"')

# 4. /stream-deck-alternative FAQ + guide cards ------------------------------------------------------------------------
FAQ = [
    ("Can I use my iPhone as a Stream Deck?",
     "For keyboard shortcuts, yes. Control My Mac turns an iPhone or iPad into a Grid of one-tap buttons that send shortcuts to your Mac, and every Mac app can have its own Grid that switches in by itself. It doesn't run Stream Deck plugins, so for streaming software and smart lights the Stream Deck app is the better fit."),
    ("Is there a Stream Deck Mobile alternative for Mac?",
     "Control My Mac is one. It works with a free Mac companion app instead of the Stream Deck desktop software, connects over Bluetooth or Wi-Fi without an account, and adds a trackpad and keyboard to the same app. It's for Macs only."),
    ("Does it work with Premiere Pro, DaVinci Resolve or Final Cut Pro?",
     'Yes, through their keyboard shortcuts. Each of them can have its own Grid. There are ready-made starter Grids for <a href="/premiere-pro-shortcuts-iphone">Premiere Pro</a>, <a href="/davinci-resolve-shortcuts-iphone">DaVinci Resolve</a> and <a href="/final-cut-pro-shortcuts-iphone">Final Cut Pro</a>.'),
    ("Is it free?",
     "The Mac app is free, and the free Essentials plan in the iPhone and iPad app includes one Grid button. A Grid for every Mac app and Auto-Switch come with Full App: $3.99 a month in the US after a 7-day free trial, renewing until you cancel, or $17.99 once."),
]
import json  # noqa: E402
faq_html = "\n".join(f"        <details>\n          <summary>{q}</summary>\n          <p>{a}</p>\n        </details>" for q, a in FAQ)
faq_ld = json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
    {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", a)}} for q, a in FAQ]}, ensure_ascii=False)
edit("stream-deck-alternative.html", '  <section class="band">\n    <div class="wrap">\n      <h2 class="h2">More guides</h2>',
     f'  <section id="faq">\n    <div class="wrap">\n      <h2 class="h2">Questions people ask</h2>\n      <div class="prose faq">\n{faq_html}\n      </div>\n    </div>\n  </section>\n\n'
     '  <section class="band">\n    <div class="wrap">\n      <h2 class="h2">More guides</h2>', marker='<section id="faq">')
edit("stream-deck-alternative.html", "</script>\n</head>", f'</script>\n<script type="application/ld+json">\n{faq_ld}\n</script>\n</head>', marker='"FAQPage"')
CARDS = """        <a class="card use" href="/premiere-pro-shortcuts-iphone">
          <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg></div>
          <h3>Premiere Pro</h3>
          <p>A ready-made Grid of Premiere Pro shortcuts.</p>
        </a>
        <a class="card use" href="/davinci-resolve-shortcuts-iphone">
          <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg></div>
          <h3>DaVinci Resolve</h3>
          <p>A ready-made Grid of DaVinci Resolve shortcuts.</p>
        </a>
        <a class="card use" href="/final-cut-pro-shortcuts-iphone">
          <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg></div>
          <h3>Final Cut Pro</h3>
          <p>A ready-made Grid of Final Cut Pro shortcuts.</p>
        </a>
        <a class="card use" href="/macro-pad-for-mac">
          <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg></div>
          <h3>Macro pad for Mac</h3>
          <p>A starter Grid of Mac shortcuts that work in every app.</p>
        </a>
"""
t = open(os.path.join(ROOT, "stream-deck-alternative.html"), encoding="utf-8").read()
if 'href="/macro-pad-for-mac"' not in t:
    m = re.search(r'<h2 class="h2">More guides</h2>\s*<div class="grid-uses">\n', t)
    if not m:
        raise SystemExit("STOP: stream-deck-alternative.html More guides grid not found")
    t = t[:m.end()] + CARDS + t[m.end():]
    open(os.path.join(ROOT, "stream-deck-alternative.html"), "w", encoding="utf-8").write(t)
    changed.add("stream-deck-alternative.html")

# 5. footer guide row --------------------------------------------------------------------------------------------------
for f in sorted(os.listdir(ROOT)):
    if not f.endswith(".html"):
        continue
    t = open(os.path.join(ROOT, f), encoding="utf-8").read()
    m = re.search(r'(<nav class="fguides" aria-label="Guides">)(.*?)(</nav>)', t, re.S)
    if not m or "/macro-pad-for-mac" in m.group(2):
        continue
    t = t[:m.start(3)] + ' <a href="/macro-pad-for-mac">Macro pad for Mac</a>' + t[m.start(3):]
    open(os.path.join(ROOT, f), "w", encoding="utf-8").write(t)
    changed.add(f)

# 6. sitemap -----------------------------------------------------------------------------------------------------------
sm = open(os.path.join(ROOT, "sitemap.xml"), encoding="utf-8").read()
add = ""
for path in ("/macro-pad-for-mac", "/premiere-pro-shortcuts-iphone", "/davinci-resolve-shortcuts-iphone", "/final-cut-pro-shortcuts-iphone"):
    if f"<loc>https://www.controlmymac.com{path}</loc>" not in sm:
        add += f"  <url>\n    <loc>https://www.controlmymac.com{path}</loc>\n    <lastmod>{TODAY}</lastmod>\n  </url>\n"
if add:
    sm = sm.replace("</urlset>", add + "</urlset>")
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(sm)
    changed.add("sitemap.xml")

print("changed:", ", ".join(sorted(changed)) or "nothing (already applied)")
