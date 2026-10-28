#!/usr/bin/env python3
"""Builds the Telebeam pages (English + German) and their sitemap.xml entries.

    python3 scripts/build-telebeam.py

Edit the copy here, not in the .html files. At the Google Play launch set PLAY_LIVE = True and run it again:
the "Coming soon" buttons become real "Get it on Google Play" links (the tracking links are already wired).
Facts come from the Play listing and the app's own strings (repo MirrorTV); don't add claims that aren't there.
"""
import html
import json
import os
import re
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://www.controlmymac.com"
PLAY_LIVE = False
_PLAY = "https://play.google.com/store/apps/details?id=com.sebstech.telebeam&referrer=utm_source%3D{}%26utm_medium%3Dwebsite%26utm_campaign%3Dlaunch"
PLAY = {"product": _PLAY.format("cmm-site"), "help": _PLAY.format("help-pages")}
GITHUB = "https://github.com/sebstech24/mirror-tv"
PRIVACY = "https://sebstech24.github.io/mirror-tv/privacy.html"
MAIL = "support@controlmymac.com"
TESTED = {
    "en": f'Tested on a Philips Google TV so far; if it doesn\'t run well on yours, write to <a href="mailto:{MAIL}">{MAIL}</a> during your trial.',
    "de": f'Bisher auf einem Philips-Google-TV getestet; läuft es auf deinem nicht gut, schreib während der Testphase an <a href="mailto:{MAIL}">{MAIL}</a>.',
}

T = {
    "en": dict(home="/", home_name="Control My Mac", guides="Guides", trouble="Troubleshooting", soon="Coming soon to Google Play",
               get="Get it on Google Play", privacy="Privacy policy", source="Source code", support="Support",
               lang_label="Languages", footer="Footer", skip="Skip to content", made="Made by", bc_home="Home",
               note="Telebeam is not affiliated with Apple. Mac, macOS and AirPlay are trademarks of Apple Inc. Google TV and Android TV are trademarks of Google LLC.",
               cta_note="For Google TV and Android TV · 7-day free trial · No ads · Open source (GPL-3.0)",
               faq_h="Questions people ask", more_h="More Telebeam guides", locale="en_US"),
    "de": dict(home="/de", home_name="Control My Mac", guides="Anleitungen", trouble="Hilfe", soon="Bald bei Google Play",
               get="Bei Google Play laden", privacy="Datenschutzerklärung", source="Quellcode", support="Support",
               lang_label="Sprachen", footer="Fußzeile", skip="Zum Inhalt springen", made="Gemacht von", bc_home="Start",
               note="Telebeam steht in keiner Verbindung zu Apple. Mac, macOS und AirPlay sind Marken der Apple Inc. Google TV und Android TV sind Marken von Google LLC.",
               cta_note="Für Google TV und Android TV · 7 Tage kostenlos testen · Keine Werbung · Open Source (GPL-3.0)",
               faq_h="Häufige Fragen", more_h="Weitere Telebeam-Anleitungen", locale="de_DE"),
}

# Plain drawing (no Apple artwork): a laptop sending to a TV over Wi-Fi.
DIAGRAM = {
    "en": ("Drawing: a Mac laptop sends its screen over home Wi-Fi to a Google TV running Telebeam", "Your Mac", "Same Wi-Fi", "TV with Telebeam"),
    "de": ("Zeichnung: Ein Mac-Laptop sendet seinen Bildschirm über das WLAN zu Hause an einen Google TV mit Telebeam", "Dein Mac", "Gleiches WLAN", "TV mit Telebeam"),
}


def diagram(lang):
    alt, mac, wifi, tv = DIAGRAM[lang]
    return f'''<figure class="sb-diagram"><svg viewBox="0 0 520 170" role="img" aria-label="{alt}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
<rect x="30" y="52" width="110" height="70" rx="6"/><path d="M14 130h142"/>
<path class="sb-wave" d="M218 70a60 60 0 0 1 84 0M232 86a38 38 0 0 1 56 0"/><circle class="sb-wave" cx="260" cy="100" r="4"/>
<rect x="350" y="30" width="150" height="96" rx="6"/><path d="M425 126v14M395 142h60"/>
<path class="sb-wave" d="M405 84a28 28 0 0 1 40 0"/><rect x="408" y="88" width="34" height="20" rx="2"/>
<text x="85" y="160" text-anchor="middle" stroke="none" fill="currentColor">{mac}</text>
<text x="260" y="130" text-anchor="middle" stroke="none" fill="currentColor">{wifi}</text>
<text x="425" y="165" text-anchor="middle" stroke="none" fill="currentColor">{tv}</text></svg></figure>'''


def play_button(lang, kind, extra=""):
    t = T[lang]
    if PLAY_LIVE:
        return f'<a class="btn btn-primary{extra}" href="{PLAY[kind]}">{t["get"]}</a>'
    # Wired but inert until launch, so nobody lands on Play's "not found" page.
    return f'<a class="btn btn-ghost{extra}" href="{PLAY[kind]}" aria-disabled="true" data-play-soon>{t["soon"]}</a>'


def path_of(lang, slug):
    return f"/{slug}" if lang == "en" else f"/de/{slug}"


def text_of(fragment):
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def ld(obj):
    return '<script type="application/ld+json">\n' + json.dumps(obj, ensure_ascii=False, indent=1) + "\n</script>"


# Each page: lang, slug, title, desc, og (short title), h1, pill, sub, body, faq [(q, a_html)], crumb, kind, howto
PAGES = []


def page(**p):
    PAGES.append(p)


GUIDES = {
    "en": [("mirror-mac-to-google-tv", "Mirror a Mac to Google TV", "The full setup, without an Apple TV."),
           ("mac-doesnt-see-my-tv", "Mac doesn't see my TV", "Checklist when the TV is missing from Screen Mirroring."),
           ("mirror-mac-to-sony-tv", "Sony Bravia", "Android TV and Google TV models."),
           ("mirror-mac-to-tcl-tv", "TCL", "Which TCL models can run it."),
           ("mirror-mac-to-philips-tv", "Philips", "Android TV and Google TV models."),
           ("mirror-mac-to-hisense-tv", "Hisense", "Google TV vs. VIDAA models.")],
    "de": [("mirror-mac-to-google-tv", "Mac auf Google TV spiegeln", "Die ganze Einrichtung, ohne Apple TV."),
           ("mac-doesnt-see-my-tv", "Mac findet den Fernseher nicht", "Checkliste, wenn der TV in der Bildschirmsynchronisierung fehlt."),
           ("telebeam", "Telebeam", "Alles über die App.")],
}


def guides_html(lang, current):
    cards = []
    for slug, name, desc in GUIDES[lang]:
        if slug == current:
            continue
        cards.append(f'<a class="card use" href="{path_of(lang, slug)}"><h3>{name}</h3><p>{desc}</p></a>')
    return f'''<section class="band"><div class="wrap"><h2 class="h2" id="guides">{T[lang]["more_h"]}</h2><div class="grid-uses">{"".join(cards)}</div></div></section>'''


def faq_html(lang, faq):
    items = "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in faq)
    return f'<section><div class="wrap"><h2 class="h2">{T[lang]["faq_h"]}</h2><div class="prose faq">{items}</div></div></section>'


def final_html(lang, kind, h, lead):
    t = T[lang]
    return f'''<section class="band"><div class="wrap"><div class="final"><h2 class="h2">{h}</h2><p class="lead">{lead}</p>
<div class="cta">{play_button(lang, kind)}</div><p class="cta-note">{t["cta_note"]}</p></div></div></section>'''


def render(p):
    lang, slug, t = p["lang"], p["slug"], T[p["lang"]]
    url = SITE + path_of(lang, slug)
    other = "de" if lang == "en" else "en"
    paired = any(q["lang"] == other and q["slug"] == slug for q in PAGES)
    alt_links = ""
    lang_nav = ""
    if paired:
        en_url, de_url = SITE + path_of("en", slug), SITE + path_of("de", slug)
        alt_links = (f'<link rel="alternate" hreflang="en" href="{en_url}">\n<link rel="alternate" hreflang="de" href="{de_url}">\n'
                     f'<link rel="alternate" hreflang="x-default" href="{en_url}">\n')
        cur = lambda c: ' aria-current="page"' if c == lang else ""
        lang_nav = (f'<nav class="flangs" aria-label="{t["lang_label"]}"><a href="{path_of("en", slug)}" lang="en" hreflang="en"{cur("en")}>English</a> '
                    f'<a href="{path_of("de", slug)}" lang="de" hreflang="de"{cur("de")}>Deutsch</a></nav>')
    product = path_of(lang, "telebeam")
    crumbs = [(t["bc_home"], SITE + t["home"] if t["home"] != "/" else SITE + "/"), ("Telebeam", SITE + product)]
    if slug != "telebeam":
        crumbs.append((p["crumb"], url))
    blocks = [ld({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(crumbs)]})]
    if slug == "telebeam":
        blocks.append(ld({"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Telebeam: Screen Mirroring TV",
                          "alternateName": "Telebeam", "operatingSystem": "Android TV, Google TV", "applicationCategory": "UtilitiesApplication",
                          "description": p["desc"], "url": url, "image": SITE + "/assets/telebeam/og.jpg", "installUrl": PLAY["product"],
                          "inLanguage": lang, "license": "https://www.gnu.org/licenses/gpl-3.0.html", "isAccessibleForFree": False,
                          "featureList": p["features"], "sameAs": [GITHUB],
                          "publisher": {"@type": "Organization", "name": "Control My Mac", "url": SITE + "/", "email": MAIL}}))
    if p.get("howto"):
        name, steps = p["howto"]
        blocks.append(ld({"@context": "https://schema.org", "@type": "HowTo", "name": name, "inLanguage": lang,
                          "step": [{"@type": "HowToStep", "position": i + 1, "name": s, "text": d} for i, (s, d) in enumerate(steps)]}))
    if p.get("faq"):
        blocks.append(ld({"@context": "https://schema.org", "@type": "FAQPage", "inLanguage": lang, "mainEntity": [
            {"@type": "Question", "name": text_of(q), "acceptedAnswer": {"@type": "Answer", "text": text_of(a)}} for q, a in p["faq"]]}))
    brand_tm = f" {p['brand_tm']}" if p.get("brand_tm") else ""
    other_link = f'<a class="nav-optional" href="{path_of(other, slug)}" lang="{other}" hreflang="{other}">{"Deutsch" if other == "de" else "English"}</a>' if paired else ""
    flinks = "".join(f'<a href="{path_of(lang, s)}">{n}</a>' for s, n, _ in GUIDES[lang] if s != "telebeam")
    return f'''<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="index, follow, max-image-preview:large">
<title>{p["title"]}</title>
<meta name="description" content="{p["desc"]}">
<link rel="canonical" href="{url}">
{alt_links}<meta property="og:type" content="{"website" if slug == "telebeam" else "article"}">
<meta property="og:site_name" content="Telebeam">
<meta property="og:title" content="{p["og"]}">
<meta property="og:description" content="{p["desc"]}">
<meta property="og:url" content="{url}">
<meta property="og:locale" content="{t["locale"]}">
<meta property="og:image" content="{SITE}/assets/telebeam/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Telebeam: Screen Mirroring Receiver">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{p["og"]}">
<meta name="twitter:description" content="{p["desc"]}">
<meta name="twitter:image" content="{SITE}/assets/telebeam/og.jpg">
<meta name="theme-color" content="#0b0d12" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#f7f8fb" media="(prefers-color-scheme: light)">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/telebeam/icon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/telebeam/icon-192.png">
<link rel="apple-touch-icon" href="/assets/telebeam/icon-192.png">
<link rel="stylesheet" href="/assets/site.css">
<link rel="stylesheet" href="/assets/telebeam/telebeam.css">
{chr(10).join(blocks)}
</head>
<body>
<a class="skip-link" href="#main">{t["skip"]}</a>

<header class="site-header">
  <nav class="nav glass" aria-label="Primary">
    <a class="brand" href="{product}"><span class="logo" aria-hidden="true"></span>Telebeam</a>
    <div class="nav-links">
      {other_link}
      <a class="nav-optional" href="#guides">{t["guides"]}</a>
      <a href="{path_of(lang, "mac-doesnt-see-my-tv")}">{t["trouble"]}</a>
      {play_button(lang, p["kind"], " btn-small")}
    </div>
  </nav>
</header>

<main id="main">
  <section class="hero wrap">
    <p class="pill">{p["pill"]}</p>
    <h1>{p["h1"]}</h1>
    <p class="sub">{p["sub"]}</p>
    <div class="cta">{play_button(lang, p["kind"])}<a class="btn btn-quiet" href="{p.get("hero_alt", "#steps")}">{p.get("hero_alt_label", "")}</a></div>
    <p class="cta-note">{t["cta_note"]}</p>
  </section>
{p["body"]}
{faq_html(lang, p["faq"])}
{guides_html(lang, slug)}
{final_html(lang, p["kind"], p["final"][0], p["final"][1])}
</main>

<footer class="site-footer">
  <div class="wrap">
    <div class="frow">
      <div>© 2026 Telebeam</div>
      <nav class="flinks" aria-label="{t["footer"]}">
        <a href="{product}">Telebeam</a>
        {flinks}
        <a href="{PRIVACY}">{t["privacy"]}</a>
        <a href="{GITHUB}">{t["source"]}</a>
        <a href="mailto:{MAIL}">{t["support"]}</a>
        <a href="{t["home"]}">Control My Mac</a>
      </nav>
    </div>
    <p class="fnote">{t["note"]}{brand_tm}</p>
  </div>
<div class="wrap fextra">
  {lang_nav}
  <p class="fmade">{t["made"]} <a href="https://linktr.ee/sebs_tech" rel="me noopener">Sebs_Tech</a> · <a href="{t["home"]}">Control My Mac</a> · <a href="https://www.youtube.com/@Sebs_tech" rel="me noopener">YouTube</a></p>
</div>
</footer>
</body>
</html>
'''


# ---------------------------------------------------------------- English

STEPS_EN = '''<section id="steps" class="band"><div class="wrap"><h2 class="h2">Three clicks on the Mac</h2>
<p class="lead">Nothing to install on the Mac, no account, no cables. Mac and TV just need to be on the same Wi-Fi.</p>
<div class="steps">
<div class="step"><h3>Open Telebeam on your TV</h3><p>The TV shows its name and the steps, so anyone at home can do it.</p></div>
<div class="step"><h3>Click Control Center, then Screen Mirroring</h3><p>Control Center is the icon at the top right of the Mac's menu bar.</p></div>
<div class="step"><h3>Pick your TV</h3><p>Your Mac's screen appears on the big screen, with sound.</p></div>
</div></div></section>'''

page(lang="en", slug="telebeam", kind="product", crumb="Telebeam",
     title="Telebeam: Mirror Your Mac to Google TV and Android TV",
     desc="Make your Google TV or Android TV show up in your Mac's Screen Mirroring. No Apple TV, nothing to install on the Mac. Up to 4K, with sound.",
     og="Telebeam: mirror your Mac to your TV, no extra box",
     pill="For Google TV and Android TV · No Apple TV needed",
     h1='Mirror your Mac to your TV. <span class="grad">No extra box.</span>',
     sub="Telebeam turns your Google TV or Android TV into a screen mirroring receiver for the Screen Mirroring already built into your Mac. Pick the TV in Control Center and your screen is on the big screen.",
     hero_alt_label="See how it works",
     features=["Shows the TV in the Mac's built-in Screen Mirroring", "Mirror the Mac screen or use the TV as a second display",
               "Up to 4K with low delay", "Sound on the TV; the Mac's volume keys can control TV volume",
               "Works with iPhone and iPad Screen Mirroring", "No ads, no tracking, no account, no data collected"],
     body=diagram("en") + STEPS_EN + '''
<section id="features"><div class="wrap"><h2 class="h2">What you can do</h2><div class="grid">
<article class="card"><h3>Mirror or extend</h3><p>Show your MacBook or iMac screen on the TV, or use the TV as a big second display.</p></article>
<article class="card"><h3>Up to 4K, low delay</h3><p>A sharp picture with low delay, so the mouse feels right on the TV.</p></article>
<article class="card"><h3>Sound included</h3><p>Your videos, photos and web pages play with sound, and your Mac's volume keys can control the TV volume.</p></article>
<article class="card"><h3>Meetings and classrooms</h3><p>Present slides and spreadsheets on the room's TV without hunting for an adapter.</p></article>
<article class="card"><h3>iPhone and iPad too</h3><p>Open Control Center, tap Screen Mirroring and choose the TV.</p></article>
<article class="card"><h3>Made for the remote</h3><p>Big, simple screens. Name your TV the way you like, so it's easy to find in the Mac's list. If something goes wrong, the TV tells you in plain words what to do.</p></article>
</div></div></section>
<section class="band"><div class="wrap"><h2 class="h2">Works on</h2><div class="prose">
<p>Google TV and Android TV: TVs from Sony, TCL, Hisense, Philips and others, Chromecast with Google TV, Google TV Streamer, Nvidia Shield and Android TV boxes. ''' + TESTED["en"] + '''</p>
<p>Your Mac's Screen Mirroring is part of macOS and uses Apple's AirPlay technology; Telebeam is the receiver on the TV side.</p>
</div></div></section>
<section id="plans"><div class="wrap"><h2 class="h2">Plans</h2><p class="lead">Both plans unlock everything: no time limits, all future updates.</p>
<div class="pricing">
<div class="price feat"><h3>Monthly</h3><p class="per">Starts with a 7-day free trial</p><ul><li>Everything in Telebeam</li><li>Cancel any time in Google Play</li></ul></div>
<div class="price"><h3>Lifetime</h3><p class="per">Buy once and keep it</p><ul><li>Everything in Telebeam</li><li>All future updates</li></ul></div>
</div><p class="price-note">Google Play shows the price in your country before you buy. Payment and cancellation go through your Google Play account.</p></div></section>
<section id="privacy" class="band"><div class="wrap"><h2 class="h2">Private, and open source</h2><div class="grid-2">
<article class="card"><h3>Stays on your home network</h3><p>No ads, no tracking, no account, no data collected. Read the <a href="''' + PRIVACY + '''">privacy policy</a>.</p></article>
<article class="card"><h3>Open source (GPL-3.0)</h3><p>The <a href="''' + GITHUB + '''">source code is on GitHub</a>. Based on AirPlay Receiver by jqssun and UxPlay; uses FFmpeg (LGPL).</p></article>
</div></div></section>
<section><div class="wrap"><h2 class="h2">Good to know</h2><div class="prose"><ul>
<li><strong>Protected video shows black.</strong> Some streaming services block screen recording, and their videos show as a black screen. This is decided by the Mac and the streaming service, not by the TV.</li>
<li><strong>TV already has its own receiver?</strong> Telebeam picks a different name, like “Living Room (2)”, so both show up.</li>
<li><strong>Something not working?</strong> See <a href="/mac-doesnt-see-my-tv">Mac doesn't see my TV</a>, or email <a href="mailto:''' + MAIL + '''">''' + MAIL + '''</a>.</li>
<li>Made by the developer of <a href="/">Control My Mac</a>.</li>
</ul></div></div></section>''',
     faq=[("Do I need an Apple TV to mirror my Mac to my TV?", "No. With Telebeam open on a Google TV or Android TV, the TV appears in the Mac's own Screen Mirroring list. No Apple TV or other box is needed."),
          ("Do I need to install anything on the Mac?", "No. Screen Mirroring is built into macOS. Telebeam runs on the TV only, and there is no account."),
          ("Which TVs does Telebeam work on?", "Google TV and Android TV: TVs from Sony, TCL, Hisense, Philips and others, Chromecast with Google TV, Google TV Streamer, Nvidia Shield and Android TV boxes. It has been tested on a Philips Google TV so far."),
          ("Can I use the TV as a second display?", "Yes. You can mirror your Mac's screen or use the TV as a big second display."),
          ("Does it play sound on the TV?", "Yes. Sound plays on the TV, and your Mac's volume keys can control the TV volume."),
          ("Why do some streaming videos show a black screen?", "Protected video from services that block screen recording shows as black. This is decided by the Mac and the streaming service, not by the TV."),
          ("What does Telebeam cost?", "Start with a 7-day free trial on the Monthly plan, or buy Lifetime once and keep it. Google Play shows the price in your country. Payment and cancellation go through your Google Play account."),
          ("Does it work with iPhone and iPad?", "Yes. Open Control Center, tap Screen Mirroring and choose the TV."),
          ("Is Telebeam open source?", f'Yes, under GPL-3.0. The <a href="{GITHUB}">source code is on GitHub</a>.')],
     final=("Your Mac, on the big screen", "Open Telebeam on the TV, pick it in Screen Mirroring, done."))

page(lang="en", slug="mirror-mac-to-google-tv", kind="help", crumb="Mirror a Mac to Google TV",
     title="How to Mirror a Mac to Google TV (Without Apple TV) | Telebeam",
     desc="Your Google TV doesn't show up in your Mac's Screen Mirroring? Here's why, the options, and how to set it up in a few minutes without an Apple TV.",
     og="How to mirror a Mac to Google TV, without an Apple TV",
     pill="Step-by-step guide · Updated October 2026",
     h1='How to mirror a Mac to <span class="grad">Google TV</span>, without an Apple TV.',
     sub="Open Control Center on a Mac, click Screen Mirroring, and most Google TVs are simply missing from the list. Here's why, what your options are, and the setup that makes the TV appear there.",
     hero_alt_label="Jump to the steps",
     howto=("Mirror a Mac to Google TV", [
         ("Install Telebeam on the Google TV", "On the Google TV home screen, open the Apps tab or Search and look for Telebeam, then install it."),
         ("Open Telebeam on the TV", "The TV shows its name and the steps to follow."),
         ("Open Screen Mirroring on the Mac", "Click the Control Center icon at the top right of the Mac's menu bar, then click Screen Mirroring."),
         ("Choose the TV", "Pick the TV's name. The Mac's screen appears on the TV, with sound.")]),
     body='''<section class="band"><div class="wrap"><h2 class="h2">Why your Google TV isn't in the list</h2>
<p class="lead">The Mac's Screen Mirroring sends to receivers that speak Apple's AirPlay technology. A Google TV speaks Google Cast instead, unless its maker built an extra receiver in.</p>
<div class="prose"><p>So the Mac looks, finds nothing it can talk to, and the list stays empty. You have three ways around it:</p>
<ul><li><strong>An HDMI cable.</strong> Reliable and cheap if the Mac sits next to the TV. Many Macs need a USB-C to HDMI adapter.</li>
<li><strong>An Apple TV</strong> plugged into the TV. Works well, but it's another box and another remote.</li>
<li><strong>A receiver app on the Google TV.</strong> That's what Telebeam is: it makes the TV itself appear in Screen Mirroring, over your Wi-Fi.</li></ul>
<p>Google Chrome's Cast option can send a tab or your screen to a Google TV too, but it runs inside Chrome rather than the Mac's own Screen Mirroring.</p></div></div></section>
''' + diagram("en") + '''
<section id="steps"><div class="wrap"><h2 class="h2">Set it up</h2><p class="lead">A few minutes, once. After that it's three clicks on the Mac.</p><div class="prose">
<h3>1. Install Telebeam on the Google TV</h3>
<p>On the Google TV home screen, open the <strong>Apps</strong> tab or <strong>Search</strong> and look for Telebeam. You can also hold the remote's microphone button and say “Telebeam”. Install it like any other app.</p>
<h3>2. Open it on the TV</h3>
<p>Telebeam shows the TV's name and the steps. Give the TV a name you'll recognise, like “Living Room”, so it's easy to find in the Mac's list.</p>
<h3>3. On the Mac: Control Center → Screen Mirroring</h3>
<p>Click the Control Center icon at the top right of the menu bar, then <strong>Screen Mirroring</strong>. Mac and TV must be on the same Wi-Fi.</p>
<h3>4. Pick the TV</h3>
<p>Your Mac's screen appears on the TV, with sound. If nothing appears in a few seconds, choose the TV again.</p>
<h3>Mirror or second display?</h3>
<p>If the TV shows an empty desktop instead of your Mac's screen, the Mac is using it as a second display. To show the same picture on both, open System Settings → Displays → “When connected to TV” → Mirror Entire Screen. To keep it as a second display, just drag windows over to it.</p>
</div></div></section>
<section class="band"><div class="wrap"><h2 class="h2">Tips</h2><div class="prose"><ul>
<li><strong>Chromecast with Google TV or Google TV Streamer?</strong> Telebeam runs on the stick or streamer, so any TV it's plugged into works, even one that isn't a smart TV.</li>
<li><strong>Picture hidden by the screensaver?</strong> Press any button on the remote.</li>
<li><strong>Your Mac's volume keys</strong> can control the TV volume.</li>
<li><strong>Protected video shows black.</strong> Some streaming services block screen recording; that's decided by the Mac and the service, not the TV.</li>
<li><strong>iPhone or iPad?</strong> Open Control Center, tap Screen Mirroring, choose the TV.</li>
<li>TV missing from the list? Go through <a href="/mac-doesnt-see-my-tv">Mac doesn't see my TV</a>.</li>
</ul><p>''' + TESTED["en"] + '''</p></div></div></section>''',
     faq=[("Can a Google TV receive AirPlay from a Mac?", "Not out of the box on most models. Telebeam adds a receiver for the Mac's built-in Screen Mirroring, which uses Apple's AirPlay technology."),
          ("Can I mirror my Mac to Google TV without an Apple TV?", "Yes. Install Telebeam on the Google TV, open it, then choose the TV in Control Center → Screen Mirroring on the Mac."),
          ("Does it work with Chromecast with Google TV and Google TV Streamer?", "Yes. Both run Google TV, so Telebeam installs on them like on a TV."),
          ("Does it work on an older Chromecast without a remote?", "No. Those Chromecasts have no app store, so no app can be installed on them. Telebeam needs Google TV or Android TV."),
          ("Do the Mac and the TV need to be on the same Wi-Fi?", "Yes. Mirroring stays on your home network, so both must be on the same Wi-Fi."),
          ("Can I use the Google TV as a second display for my Mac?", "Yes. Mirror the Mac's screen or use the TV as a second display.")],
     final=("Put your Mac on the Google TV", "Install Telebeam on the TV, then pick it in Screen Mirroring."))

BRANDS = [
    dict(slug="mirror-mac-to-sony-tv", brand="Sony", crumb="Mirror a Mac to a Sony TV",
         title="How to Mirror a Mac to a Sony Bravia TV | Telebeam",
         desc="Mirror your Mac to a Sony Bravia with Google TV or Android TV, without an Apple TV. How to check your model, install Telebeam, and connect.",
         tm="Sony and Bravia are trademarks of Sony Group Corporation. Telebeam is not affiliated with Sony.",
         which='''<p>Sony Bravia TVs from recent years run either <strong>Google TV</strong> (a home screen with tabs like For you and Apps) or the older <strong>Android TV</strong> (rows of apps with the Google Play Store among them). Telebeam is made for both. Check your model on Sony's support site if you're unsure.</p>''',
         builtin='''<p>Some Bravia models already include Apple's receiver, and then the Mac lists the TV by itself. Check first: open Control Center → Screen Mirroring on the Mac with the TV on. If your Bravia is already there, you may not need Telebeam. If it isn't, Telebeam adds it. If both are present, Telebeam names itself “TV name (2)”, so you can tell them apart and pick whichever works better for you.</p>''',
         install='''<ul><li><strong>Google TV models:</strong> open the <strong>Apps</strong> tab or <strong>Search</strong> on the home screen and look for Telebeam, or press the remote's Google Assistant/microphone button and say “Telebeam”.</li>
<li><strong>Android TV models:</strong> press <strong>Home</strong>, open the <strong>Google Play Store</strong> app from the Apps row and search for Telebeam.</li></ul>''',
         faq=[("Does my Sony TV support mirroring from a Mac?", "Some Bravia models have Apple's receiver built in and appear in the Mac's Screen Mirroring list by themselves. On Bravia models with Google TV or Android TV that don't, Telebeam adds the TV to the list."),
              ("Has Telebeam been tested on Sony TVs?", "Not yet. It is made for Google TV and Android TV and has been tested on a Philips Google TV so far. If it doesn't run well on your Bravia, write to support@controlmymac.com during your trial.")]),
    dict(slug="mirror-mac-to-tcl-tv", brand="TCL", crumb="Mirror a Mac to a TCL TV",
         title="How to Mirror a Mac to a TCL TV (Google TV) | Telebeam",
         desc="Mirror your Mac to a TCL Google TV or Android TV without an Apple TV. Which TCL models can run Telebeam, how to install it, and how to connect.",
         tm="TCL is a trademark of TCL Corporation. Roku is a trademark of Roku, Inc. Fire TV is a trademark of Amazon.com, Inc. or its affiliates. Telebeam is not affiliated with these companies.",
         which='''<p>TCL sells TVs with different systems depending on the model and country: <strong>Google TV</strong> and <strong>Android TV</strong> models, but also <strong>Roku TV</strong> and <strong>Fire TV</strong> models. Telebeam only runs on the Google TV and Android TV ones. The system is usually in the model name or on the box; if the home screen shows Google's Apps tab or the Google Play Store, you're set.</p>
<p>Have a TCL Roku TV or Fire TV? Telebeam can't be installed there. A Chromecast with Google TV or Google TV Streamer plugged into the TV can run it instead.</p>''',
         builtin='''<p>Some TCL models come with a screen mirroring receiver built in (we haven't checked which ones), and then the Mac may already list the TV. Check first in Control Center → Screen Mirroring. If both the built-in receiver and Telebeam are running, Telebeam names itself “TV name (2)” so both show up; pick the one that works better for you.</p>''',
         install='''<ul><li><strong>Google TV models:</strong> open the <strong>Apps</strong> tab or <strong>Search</strong> on the home screen and look for Telebeam.</li>
<li><strong>Android TV models:</strong> press <strong>Home</strong>, open the <strong>Google Play Store</strong> and search for Telebeam.</li></ul>''',
         faq=[("Does Telebeam work on a TCL Roku TV?", "No. Telebeam runs on Google TV and Android TV only. On a TCL Roku TV or Fire TV, a Chromecast with Google TV or Google TV Streamer plugged into the TV can run it instead."),
              ("Has Telebeam been tested on TCL TVs?", "Not yet. It is made for Google TV and Android TV and has been tested on a Philips Google TV so far. If it doesn't run well on your TCL, write to support@controlmymac.com during your trial.")]),
    dict(slug="mirror-mac-to-philips-tv", brand="Philips", crumb="Mirror a Mac to a Philips TV",
         title="How to Mirror a Mac to a Philips TV (Google TV) | Telebeam",
         desc="Mirror your Mac to a Philips Google TV or Android TV without an Apple TV. Which Philips models can run Telebeam, how to install it, and how to connect.",
         tm="Philips is a trademark of Koninklijke Philips N.V. Telebeam is not affiliated with Philips or TP Vision.",
         which='''<p>Philips TVs run different systems depending on the model: <strong>Google TV</strong> and <strong>Android TV</strong> on many models, and other systems (such as Saphi or Titan OS) on some others. Telebeam only runs on the Google TV and Android TV models. If your home screen has Google's Apps tab or the Google Play Store, you're set.</p>
<p>Telebeam has been tested on a Philips Google TV, the only brand tested so far.</p>''',
         builtin='''<p>Some Philips models come with a screen mirroring receiver built in (we haven't checked which ones), and then the Mac may already list the TV. Check first in Control Center → Screen Mirroring. If both are running, Telebeam names itself “TV name (2)” so both show up; pick the one that works better for you.</p>''',
         install='''<ul><li><strong>Google TV models:</strong> open the <strong>Apps</strong> tab or <strong>Search</strong> on the home screen and look for Telebeam.</li>
<li><strong>Android TV models:</strong> press <strong>Home</strong>, open the <strong>Google Play Store</strong> and search for Telebeam.</li></ul>''',
         faq=[("Does Telebeam work on every Philips TV?", "No, only on Philips models with Google TV or Android TV. Models with other systems can't install it; a Chromecast with Google TV or Google TV Streamer plugged into the TV can run it instead."),
              ("Has Telebeam been tested on Philips TVs?", "Yes, on a Philips Google TV. That's the only TV it has been tested on so far.")]),
    dict(slug="mirror-mac-to-hisense-tv", brand="Hisense", crumb="Mirror a Mac to a Hisense TV",
         title="How to Mirror a Mac to a Hisense TV (Google TV) | Telebeam",
         desc="Mirror your Mac to a Hisense Google TV or Android TV without an Apple TV. Google TV vs. VIDAA models, how to install Telebeam, and how to connect.",
         tm="Hisense and VIDAA are trademarks of their respective owners. Roku is a trademark of Roku, Inc. Fire TV is a trademark of Amazon.com, Inc. or its affiliates. Telebeam is not affiliated with these companies.",
         which='''<p>Hisense sells TVs with different systems depending on the model and country: <strong>Google TV</strong> and <strong>Android TV</strong> models, and also <strong>VIDAA</strong>, Roku TV and Fire TV models. Telebeam only runs on the Google TV and Android TV ones. If your home screen has Google's Apps tab or the Google Play Store, you're set; a VIDAA home screen means it can't be installed.</p>
<p>Have a VIDAA, Roku TV or Fire TV model? A Chromecast with Google TV or Google TV Streamer plugged into the TV can run Telebeam instead.</p>''',
         builtin='''<p>Some Hisense models come with a screen mirroring receiver built in (we haven't checked which ones), and then the Mac may already list the TV. Check first in Control Center → Screen Mirroring. If both are running, Telebeam names itself “TV name (2)” so both show up; pick the one that works better for you.</p>''',
         install='''<ul><li><strong>Google TV models:</strong> open the <strong>Apps</strong> tab or <strong>Search</strong> on the home screen and look for Telebeam.</li>
<li><strong>Android TV models:</strong> press <strong>Home</strong>, open the <strong>Google Play Store</strong> and search for Telebeam.</li></ul>''',
         faq=[("Does Telebeam work on a Hisense VIDAA TV?", "No. VIDAA isn't Google TV or Android TV, so Telebeam can't be installed. A Chromecast with Google TV or Google TV Streamer plugged into the TV can run it instead."),
              ("Has Telebeam been tested on Hisense TVs?", "Not yet. It is made for Google TV and Android TV and has been tested on a Philips Google TV so far. If it doesn't run well on your Hisense, write to support@controlmymac.com during your trial.")]),
]

for b in BRANDS:
    name = b["brand"]
    page(lang="en", slug=b["slug"], kind="help", crumb=b["crumb"], title=b["title"], desc=b["desc"], brand_tm=b["tm"],
         og=f"How to mirror a Mac to a {name} TV",
         pill=f"{name} TV guide · Updated October 2026",
         h1=f'How to mirror a Mac to a <span class="grad">{name} TV</span>.',
         sub=f"Your Mac can show its screen on a {name} TV over Wi-Fi with its own built-in Screen Mirroring, no Apple TV needed, as long as the TV runs Google TV or Android TV. Here's how to check, install and connect.",
         hero_alt_label="Jump to the steps",
         body=f'''<section class="band"><div class="wrap"><h2 class="h2">Does your {name} TV qualify?</h2><div class="prose">{b["which"]}</div></div></section>
<section><div class="wrap"><h2 class="h2">Already has a receiver built in?</h2><div class="prose">{b["builtin"]}</div></div></section>
<section id="steps" class="band"><div class="wrap"><h2 class="h2">Set it up</h2><div class="prose">
<h3>1. Install Telebeam on the {name} TV</h3>{b["install"]}
<h3>2. Open Telebeam on the TV</h3><p>It shows the TV's name and the steps. Rename the TV in Telebeam if you like, so it's easy to find.</p>
<h3>3. On the Mac: Control Center → Screen Mirroring → pick the TV</h3><p>Mac and TV must be on the same Wi-Fi. Your Mac's screen appears on the TV, with sound. Empty desktop instead? System Settings → Displays → “When connected to TV” → Mirror Entire Screen.</p>
<p>More detail in the <a href="/mirror-mac-to-google-tv">Google TV guide</a>. TV not in the list? See <a href="/mac-doesnt-see-my-tv">Mac doesn't see my TV</a>.</p>
<p>{TESTED["en"]}</p>
</div></div></section>''',
         faq=b["faq"] + [("Do I need an Apple TV?", f"No. With Telebeam on a {name} TV that runs Google TV or Android TV, the TV appears in the Mac's own Screen Mirroring list."),
                         ("Do I need to install anything on the Mac?", "No. Screen Mirroring is built into macOS; Telebeam runs on the TV only.")],
         final=(f"Your Mac on your {name} TV", "Install Telebeam on the TV, then pick it in Screen Mirroring."))

page(lang="en", slug="mac-doesnt-see-my-tv", kind="help", crumb="Mac doesn't see my TV", brand_tm="Netflix is a trademark of Netflix, Inc.",
     title="Mac Doesn't Show My TV in Screen Mirroring: Fixes | Telebeam",
     desc="Your TV is missing from the Mac's Screen Mirroring list, or shows an empty desktop or black video? Go through this checklist, from Wi-Fi to the TV's name.",
     og="Mac doesn't show my TV in Screen Mirroring",
     pill="Troubleshooting · Updated October 2026",
     h1='Mac doesn\'t show your TV in <span class="grad">Screen Mirroring</span>?',
     sub="Go through this list from the top. Most of the time it's the Wi-Fi: the Mac and the TV have to be on the same network, and able to see each other on it.",
     hero_alt="#checklist", hero_alt_label="Start the checklist",
     body='''<section id="checklist" class="band"><div class="wrap"><h2 class="h2">The TV is missing from the list</h2><div class="prose">
<h3>1. Is Telebeam open on the TV?</h3><p>The TV only shows up while Telebeam is open. Open it and wait until it shows the TV's name.</p>
<h3>2. Same Wi-Fi on both</h3><p>The Mac and the TV must be on the same Wi-Fi. Compare the network name on the Mac (Wi-Fi in Control Center) with the one in the TV's network settings. If your router has separate names for 2.4 GHz and 5 GHz, put both devices on the same one to rule it out.</p>
<h3>3. Guest networks and isolation</h3><p>Guest networks, hotel and many office or school networks keep devices from seeing each other (often called “AP isolation” or “client isolation” in router settings). Use your main home network, or turn the isolation off in the router.</p>
<h3>4. The Mac's firewall and VPN</h3><p>If the Mac's firewall is set to block all incoming connections, the TV can't answer. Check System Settings → Network → Firewall → Options. Some VPN apps also hide devices on the home network; switch the VPN off and try again.</p>
<h3>5. Restart the simple way</h3><p>Close and reopen Telebeam on the TV, turn the Mac's Wi-Fi off and on, and if that doesn't help, restart the TV. Then open Screen Mirroring again.</p>
</div></div></section>
<section><div class="wrap"><h2 class="h2">The TV shows up, but…</h2><div class="prose">
<h3>…there are two TVs with almost the same name</h3><p>Your TV has its own mirroring receiver built in as well. Telebeam then names itself with “(2)” at the end, like “Living Room (2)”, so both show up. Pick the “(2)” one for Telebeam. You can rename the TV in Telebeam.</p>
<h3>…nothing happens after I pick it</h3><p>If nothing appears in a few seconds, choose the TV again in Screen Mirroring on the Mac.</p>
<h3>…I see an empty desktop, not my screen</h3><p>The Mac is using the TV as a second display. On the Mac: System Settings → Displays → “When connected to TV” → Mirror Entire Screen.</p>
<h3>…the picture is hidden by the screensaver</h3><p>Press any button on the TV's remote.</p>
<h3>…videos from a streaming service are black</h3><p>Protected video (from services that block screen recording) shows as a black screen. That's decided by the Mac and the streaming service, not by the TV, and no setting on the TV changes it.</p>
<h3>…it says “Connection lost” or “The TV's network changed”</h3><p>The Wi-Fi dropped or one of the devices moved to another network. Put the Mac on the TV's Wi-Fi, then choose the TV again.</p>
<h3>Still stuck?</h3><p>Email <a href="mailto:''' + MAIL + '''">''' + MAIL + '''</a> with your Mac model, macOS version and TV model.</p>
</div></div></section>''',
     faq=[("Why doesn't my TV show up in Screen Mirroring on my Mac?", "Most often the Mac and TV aren't on the same Wi-Fi, or the network keeps devices apart (guest networks, AP isolation). Also check that Telebeam is open on the TV and that the Mac's firewall isn't blocking all incoming connections."),
          ("Why does my TV appear twice in Screen Mirroring?", "The TV has its own mirroring receiver built in too. Telebeam then adds “(2)” to its name so both show up; pick the “(2)” one."),
          ("Why do I only see an empty desktop on the TV?", "The Mac is using the TV as a second display. Open System Settings → Displays → “When connected to TV” → Mirror Entire Screen."),
          ("Why is Netflix or other streaming video black when I mirror?", "Protected video from services that block screen recording shows as black. That's decided by the Mac and the streaming service, not by the TV."),
          ("Does screen mirroring work on a guest or hotel Wi-Fi?", "Often not. Those networks usually stop devices from seeing each other. Use your main home network.")],
     final=("Back on the big screen", "Still stuck? Email support@controlmymac.com with your Mac and TV model."))

# ---------------------------------------------------------------- German

TESTED_DE = TESTED["de"]

page(lang="de", slug="telebeam", kind="product", crumb="Telebeam",
     title="Telebeam: Mac auf Google TV und Android TV spiegeln",
     desc="Dein Google TV oder Android TV erscheint in der Bildschirmsynchronisierung deines Mac. Kein Apple TV, nichts auf dem Mac installieren. Bis 4K, mit Ton.",
     og="Telebeam: Mac auf den Fernseher spiegeln, ohne Extra-Box",
     pill="Für Google TV und Android TV · Kein Apple TV nötig",
     h1='Spiegle deinen Mac auf den Fernseher. <span class="grad">Ohne Extra-Box.</span>',
     sub="Telebeam macht deinen Google TV oder Android TV zum Empfänger für die Bildschirmsynchronisierung, die schon in deinem Mac steckt. Wähle den Fernseher im Kontrollzentrum, und dein Bildschirm ist auf dem großen Bildschirm.",
     hero_alt_label="So funktioniert's",
     features=["Zeigt den Fernseher in der Bildschirmsynchronisierung des Mac", "Mac-Bildschirm spiegeln oder den Fernseher als zweiten Bildschirm nutzen",
               "Bis 4K mit geringer Verzögerung", "Ton auf dem Fernseher; die Lautstärketasten des Mac können die TV-Lautstärke steuern",
               "Funktioniert auch mit iPhone und iPad", "Keine Werbung, kein Tracking, kein Konto, keine Datenerfassung"],
     body=diagram("de") + '''<section id="steps" class="band"><div class="wrap"><h2 class="h2">Drei Klicks auf dem Mac</h2>
<p class="lead">Nichts auf dem Mac installieren, kein Konto, keine Kabel. Mac und Fernseher müssen nur im selben WLAN sein.</p>
<div class="steps">
<div class="step"><h3>Telebeam auf dem Fernseher öffnen</h3><p>Der Fernseher zeigt seinen Namen und die Schritte, so kann es jeder zu Hause.</p></div>
<div class="step"><h3>Kontrollzentrum, dann Bildschirmsynchronisierung</h3><p>Das Kontrollzentrum ist das Symbol oben rechts in der Menüleiste des Mac.</p></div>
<div class="step"><h3>Fernseher wählen</h3><p>Der Bildschirm deines Mac erscheint auf dem Fernseher, mit Ton.</p></div>
</div></div></section>
<section id="features"><div class="wrap"><h2 class="h2">Was du damit machen kannst</h2><div class="grid">
<article class="card"><h3>Spiegeln oder erweitern</h3><p>Zeig den Bildschirm deines MacBook oder iMac auf dem Fernseher, oder nutze den Fernseher als großen zweiten Bildschirm.</p></article>
<article class="card"><h3>Bis 4K, wenig Verzögerung</h3><p>Ein scharfes Bild mit geringer Verzögerung, damit sich die Maus auf dem Fernseher richtig anfühlt.</p></article>
<article class="card"><h3>Mit Ton</h3><p>Videos, Fotos und Webseiten laufen mit Ton, und die Lautstärketasten des Mac können die TV-Lautstärke steuern.</p></article>
<article class="card"><h3>Meetings und Unterricht</h3><p>Folien und Tabellen auf dem Fernseher im Raum zeigen, ohne nach einem Adapter zu suchen.</p></article>
<article class="card"><h3>Auch iPhone und iPad</h3><p>Kontrollzentrum öffnen, auf Bildschirmsynchronisierung tippen und den Fernseher wählen.</p></article>
<article class="card"><h3>Für die Fernbedienung gemacht</h3><p>Große, einfache Bildschirme. Benenne den Fernseher, wie du willst, damit du ihn in der Liste des Mac leicht findest. Klappt etwas nicht, sagt dir der Fernseher in klaren Worten, was zu tun ist.</p></article>
</div></div></section>
<section class="band"><div class="wrap"><h2 class="h2">Läuft auf</h2><div class="prose">
<p>Google TV und Android TV: Fernseher von Sony, TCL, Hisense, Philips und anderen, Chromecast mit Google TV, Google TV Streamer, Nvidia Shield und Android-TV-Boxen. ''' + TESTED_DE + '''</p>
<p>Die Bildschirmsynchronisierung deines Mac ist Teil von macOS und nutzt Apples AirPlay-Technik; Telebeam ist der Empfänger auf der TV-Seite.</p>
</div></div></section>
<section id="plans"><div class="wrap"><h2 class="h2">Abos</h2><p class="lead">Beide schalten alles frei: ohne Zeitlimit, mit allen künftigen Updates.</p>
<div class="pricing">
<div class="price feat"><h3>Monatlich</h3><p class="per">Beginnt mit 7 Tagen kostenlosem Test</p><ul><li>Alles in Telebeam</li><li>Jederzeit in Google Play kündbar</li></ul></div>
<div class="price"><h3>Lebenslang</h3><p class="per">Einmal kaufen und behalten</p><ul><li>Alles in Telebeam</li><li>Alle künftigen Updates</li></ul></div>
</div><p class="price-note">Google Play zeigt dir den Preis in deinem Land vor dem Kauf. Bezahlung und Kündigung laufen über dein Google-Play-Konto.</p></div></section>
<section id="privacy" class="band"><div class="wrap"><h2 class="h2">Privat und Open Source</h2><div class="grid-2">
<article class="card"><h3>Bleibt in deinem Heimnetz</h3><p>Keine Werbung, kein Tracking, kein Konto, keine Datenerfassung. Zur <a href="''' + PRIVACY + '''">Datenschutzerklärung</a> (Englisch).</p></article>
<article class="card"><h3>Open Source (GPL-3.0)</h3><p>Der <a href="''' + GITHUB + '''">Quellcode liegt auf GitHub</a>. Basiert auf AirPlay Receiver von jqssun und UxPlay; nutzt FFmpeg (LGPL).</p></article>
</div></div></section>
<section><div class="wrap"><h2 class="h2">Gut zu wissen</h2><div class="prose"><ul>
<li><strong>Geschützte Videos bleiben schwarz.</strong> Manche Streamingdienste blockieren Bildschirmaufnahmen, ihre Videos erscheinen dann schwarz. Das entscheiden der Mac und der Dienst, nicht der Fernseher.</li>
<li><strong>Hat dein Fernseher schon einen eigenen Empfänger?</strong> Telebeam wählt dann einen anderen Namen, etwa „Wohnzimmer (2)“, damit beide erscheinen.</li>
<li><strong>Klappt etwas nicht?</strong> Siehe <a href="/de/mac-doesnt-see-my-tv">Mac findet den Fernseher nicht</a>, oder schreib an <a href="mailto:''' + MAIL + '''">''' + MAIL + '''</a>.</li>
<li>Vom Entwickler von <a href="/de">Control My Mac</a>.</li>
</ul></div></div></section>''',
     faq=[("Brauche ich ein Apple TV, um meinen Mac auf den Fernseher zu spiegeln?", "Nein. Ist Telebeam auf einem Google TV oder Android TV geöffnet, erscheint der Fernseher in der Bildschirmsynchronisierung des Mac. Kein Apple TV und keine andere Box nötig."),
          ("Muss ich etwas auf dem Mac installieren?", "Nein. Die Bildschirmsynchronisierung ist in macOS eingebaut. Telebeam läuft nur auf dem Fernseher, und es gibt kein Konto."),
          ("Auf welchen Fernsehern läuft Telebeam?", "Google TV und Android TV: Fernseher von Sony, TCL, Hisense, Philips und anderen, Chromecast mit Google TV, Google TV Streamer, Nvidia Shield und Android-TV-Boxen. Getestet wurde es bisher auf einem Philips-Google-TV."),
          ("Kann ich den Fernseher als zweiten Bildschirm nutzen?", "Ja. Du kannst den Bildschirm des Mac spiegeln oder den Fernseher als großen zweiten Bildschirm nutzen."),
          ("Warum sind manche Streaming-Videos schwarz?", "Geschützte Videos von Diensten, die Bildschirmaufnahmen blockieren, erscheinen schwarz. Das entscheiden der Mac und der Dienst, nicht der Fernseher."),
          ("Was kostet Telebeam?", "Starte mit 7 Tagen kostenlosem Test im Monatsabo, oder kauf einmal Lebenslang und behalte es. Google Play zeigt den Preis in deinem Land. Bezahlung und Kündigung laufen über dein Google-Play-Konto."),
          ("Funktioniert es mit iPhone und iPad?", "Ja. Kontrollzentrum öffnen, auf Bildschirmsynchronisierung tippen und den Fernseher wählen."),
          ("Ist Telebeam Open Source?", f'Ja, unter GPL-3.0. Der <a href="{GITHUB}">Quellcode liegt auf GitHub</a>.')],
     final=("Dein Mac auf dem großen Bildschirm", "Telebeam auf dem Fernseher öffnen, in der Bildschirmsynchronisierung wählen, fertig."))

MIRROR_DE = "Öffne auf dem Mac Systemeinstellungen → Displays und wähle bei „Wenn mit TV-Gerät verbunden“ die Option „Ganzen Bildschirm synchronisieren“, damit der Fernseher den Mac-Bildschirm spiegelt statt als separater Bildschirm zu dienen."

page(lang="de", slug="mirror-mac-to-google-tv", kind="help", crumb="Mac auf Google TV spiegeln",
     title="Mac auf Google TV spiegeln (ohne Apple TV): Anleitung | Telebeam",
     desc="Dein Google TV fehlt in der Bildschirmsynchronisierung des Mac? Warum das so ist, welche Wege es gibt und wie du es in wenigen Minuten ohne Apple TV einrichtest.",
     og="Mac auf Google TV spiegeln, ohne Apple TV",
     pill="Schritt-für-Schritt-Anleitung · Stand Oktober 2026",
     h1='Mac auf <span class="grad">Google TV</span> spiegeln, ohne Apple TV.',
     sub="Kontrollzentrum öffnen, Bildschirmsynchronisierung klicken, und die meisten Google TVs fehlen einfach in der Liste. Hier steht, warum, welche Möglichkeiten du hast, und wie der Fernseher dort erscheint.",
     hero_alt_label="Zu den Schritten",
     howto=("Mac auf Google TV spiegeln", [
         ("Telebeam auf dem Google TV installieren", "Auf dem Startbildschirm von Google TV den Tab Apps oder die Suche öffnen, nach Telebeam suchen und installieren."),
         ("Telebeam auf dem Fernseher öffnen", "Der Fernseher zeigt seinen Namen und die Schritte."),
         ("Bildschirmsynchronisierung auf dem Mac öffnen", "Oben rechts in der Menüleiste auf das Kontrollzentrum klicken, dann auf Bildschirmsynchronisierung."),
         ("Fernseher wählen", "Den Namen des Fernsehers wählen. Der Bildschirm des Mac erscheint auf dem Fernseher, mit Ton.")]),
     body='''<section class="band"><div class="wrap"><h2 class="h2">Warum dein Google TV nicht in der Liste steht</h2>
<p class="lead">Die Bildschirmsynchronisierung des Mac sendet an Empfänger, die Apples AirPlay-Technik sprechen. Ein Google TV spricht stattdessen Google Cast, außer der Hersteller hat einen zusätzlichen Empfänger eingebaut.</p>
<div class="prose"><p>Der Mac sucht also, findet nichts, mit dem er reden kann, und die Liste bleibt leer. Es gibt drei Wege:</p>
<ul><li><strong>Ein HDMI-Kabel.</strong> Zuverlässig und günstig, wenn der Mac neben dem Fernseher steht. Viele Macs brauchen einen USB-C-auf-HDMI-Adapter.</li>
<li><strong>Ein Apple TV</strong> am Fernseher. Funktioniert gut, ist aber noch eine Box und noch eine Fernbedienung.</li>
<li><strong>Eine Empfänger-App auf dem Google TV.</strong> Das ist Telebeam: Der Fernseher selbst erscheint in der Bildschirmsynchronisierung, über dein WLAN.</li></ul>
<p>Auch die Cast-Funktion von Google Chrome kann einen Tab oder den Bildschirm an einen Google TV senden, aber sie läuft in Chrome statt in der Bildschirmsynchronisierung des Mac.</p></div></div></section>
''' + diagram("de") + '''
<section id="steps"><div class="wrap"><h2 class="h2">Einrichten</h2><p class="lead">Ein paar Minuten, einmal. Danach sind es drei Klicks auf dem Mac.</p><div class="prose">
<h3>1. Telebeam auf dem Google TV installieren</h3>
<p>Öffne auf dem Startbildschirm von Google TV den Tab <strong>Apps</strong> oder die <strong>Suche</strong> und such nach Telebeam. Du kannst auch die Mikrofontaste der Fernbedienung halten und „Telebeam“ sagen. Installiere die App wie jede andere.</p>
<h3>2. Auf dem Fernseher öffnen</h3>
<p>Telebeam zeigt den Namen des Fernsehers und die Schritte. Gib dem Fernseher einen Namen, den du wiedererkennst, etwa „Wohnzimmer“.</p>
<h3>3. Auf dem Mac: Kontrollzentrum → Bildschirmsynchronisierung</h3>
<p>Klick oben rechts in der Menüleiste auf das Kontrollzentrum, dann auf <strong>Bildschirmsynchronisierung</strong>. Mac und Fernseher müssen im selben WLAN sein.</p>
<h3>4. Fernseher wählen</h3>
<p>Der Bildschirm deines Mac erscheint auf dem Fernseher, mit Ton. Erscheint nach ein paar Sekunden nichts, wähle den Fernseher noch einmal.</p>
<h3>Spiegeln oder zweiter Bildschirm?</h3>
<p>Zeigt der Fernseher einen leeren Schreibtisch statt deines Bildschirms, nutzt der Mac ihn als zweiten Bildschirm. ''' + MIRROR_DE + ''' Willst du ihn als zweiten Bildschirm behalten, zieh Fenster einfach hinüber.</p>
</div></div></section>
<section class="band"><div class="wrap"><h2 class="h2">Tipps</h2><div class="prose"><ul>
<li><strong>Chromecast mit Google TV oder Google TV Streamer?</strong> Telebeam läuft auf dem Stick oder Streamer, also klappt es mit jedem Fernseher, an dem er steckt, auch ohne Smart-TV.</li>
<li><strong>Bild vom Bildschirmschoner verdeckt?</strong> Drück eine beliebige Taste auf der Fernbedienung.</li>
<li><strong>Die Lautstärketasten des Mac</strong> können die TV-Lautstärke steuern.</li>
<li><strong>Geschützte Videos bleiben schwarz.</strong> Manche Streamingdienste blockieren Bildschirmaufnahmen; das entscheiden der Mac und der Dienst, nicht der Fernseher.</li>
<li><strong>iPhone oder iPad?</strong> Kontrollzentrum öffnen, auf Bildschirmsynchronisierung tippen, Fernseher wählen.</li>
<li>Fernseher fehlt in der Liste? Geh <a href="/de/mac-doesnt-see-my-tv">Mac findet den Fernseher nicht</a> durch.</li>
</ul><p>''' + TESTED_DE + '''</p></div></div></section>''',
     faq=[("Kann ein Google TV AirPlay von einem Mac empfangen?", "Bei den meisten Modellen nicht ab Werk. Telebeam fügt einen Empfänger für die eingebaute Bildschirmsynchronisierung des Mac hinzu, die Apples AirPlay-Technik nutzt."),
          ("Kann ich meinen Mac ohne Apple TV auf Google TV spiegeln?", "Ja. Installiere Telebeam auf dem Google TV, öffne es und wähle den Fernseher auf dem Mac unter Kontrollzentrum → Bildschirmsynchronisierung."),
          ("Funktioniert es mit Chromecast mit Google TV und Google TV Streamer?", "Ja. Beide laufen mit Google TV, Telebeam lässt sich darauf wie auf einem Fernseher installieren."),
          ("Funktioniert es mit einem älteren Chromecast ohne Fernbedienung?", "Nein. Diese Chromecasts haben keinen App Store, darauf lässt sich keine App installieren. Telebeam braucht Google TV oder Android TV."),
          ("Müssen Mac und Fernseher im selben WLAN sein?", "Ja. Die Übertragung bleibt in deinem Heimnetz, deshalb müssen beide im selben WLAN sein.")],
     final=("Bring deinen Mac auf den Google TV", "Telebeam auf dem Fernseher installieren, dann in der Bildschirmsynchronisierung wählen."))

page(lang="de", slug="mac-doesnt-see-my-tv", kind="help", crumb="Mac findet den Fernseher nicht", brand_tm="Netflix ist eine Marke von Netflix, Inc.",
     title="Mac zeigt den Fernseher nicht in der Bildschirmsynchronisierung | Telebeam",
     desc="Dein Fernseher fehlt in der Bildschirmsynchronisierung des Mac, oder du siehst nur einen leeren Schreibtisch oder schwarze Videos? Geh diese Checkliste durch.",
     og="Mac zeigt den Fernseher nicht in der Bildschirmsynchronisierung",
     pill="Hilfe · Stand Oktober 2026",
     h1='Dein Mac zeigt den Fernseher nicht in der <span class="grad">Bildschirmsynchronisierung</span>?',
     sub="Geh die Liste von oben durch. Meistens liegt es am WLAN: Mac und Fernseher müssen im selben Netz sein und sich darin sehen können.",
     hero_alt="#checklist", hero_alt_label="Zur Checkliste",
     body='''<section id="checklist" class="band"><div class="wrap"><h2 class="h2">Der Fernseher fehlt in der Liste</h2><div class="prose">
<h3>1. Ist Telebeam auf dem Fernseher geöffnet?</h3><p>Der Fernseher erscheint nur, solange Telebeam geöffnet ist. Öffne die App und warte, bis sie den Namen des Fernsehers zeigt.</p>
<h3>2. Dasselbe WLAN auf beiden</h3><p>Mac und Fernseher müssen im selben WLAN sein. Vergleiche den Netzwerknamen auf dem Mac (WLAN im Kontrollzentrum) mit dem in den Netzwerkeinstellungen des Fernsehers. Hat dein Router getrennte Namen für 2,4 GHz und 5 GHz, verbinde zum Test beide Geräte mit demselben.</p>
<h3>3. Gastnetze und Isolation</h3><p>Gastnetze, Hotel-WLANs und viele Büro- oder Schulnetze verhindern, dass sich Geräte gegenseitig sehen (in Routern oft „AP-Isolation“ oder „Client-Isolation“ genannt). Nutze dein normales Heimnetz oder schalte die Isolation im Router aus.</p>
<h3>4. Firewall und VPN auf dem Mac</h3><p>Blockiert die Firewall des Mac alle eingehenden Verbindungen, kann der Fernseher nicht antworten. Prüfe Systemeinstellungen → Netzwerk → Firewall → Optionen. Manche VPN-Apps verstecken außerdem Geräte im Heimnetz; schalte das VPN aus und versuch es erneut.</p>
<h3>5. Einfach neu starten</h3><p>Telebeam auf dem Fernseher schließen und neu öffnen, WLAN am Mac aus- und einschalten, und wenn das nicht hilft, den Fernseher neu starten. Dann die Bildschirmsynchronisierung wieder öffnen.</p>
</div></div></section>
<section><div class="wrap"><h2 class="h2">Der Fernseher erscheint, aber…</h2><div class="prose">
<h3>…es gibt zwei Fernseher mit fast gleichem Namen</h3><p>Dein Fernseher hat zusätzlich einen eigenen Empfänger eingebaut. Telebeam hängt dann „(2)“ an seinen Namen, etwa „Wohnzimmer (2)“, damit beide erscheinen. Wähle den mit „(2)“ für Telebeam.</p>
<h3>…nach dem Auswählen passiert nichts</h3><p>Erscheint nach ein paar Sekunden nichts, wähle den Fernseher in der Bildschirmsynchronisierung noch einmal.</p>
<h3>…ich sehe einen leeren Schreibtisch statt meines Bildschirms</h3><p>Der Mac nutzt den Fernseher als zweiten Bildschirm. ''' + MIRROR_DE + '''</p>
<h3>…das Bild ist vom Bildschirmschoner verdeckt</h3><p>Drück eine beliebige Taste auf der Fernbedienung.</p>
<h3>…Videos eines Streamingdienstes sind schwarz</h3><p>Geschützte Videos (von Diensten, die Bildschirmaufnahmen blockieren) erscheinen schwarz. Das entscheiden der Mac und der Dienst, nicht der Fernseher, und keine Einstellung am Fernseher ändert das.</p>
<h3>…es heißt „Verbindung verloren“ oder „Das Netzwerk des Fernsehers hat sich geändert“</h3><p>Das WLAN ist abgebrochen oder ein Gerät ist in ein anderes Netz gewechselt. Verbinde den Mac mit dem WLAN des Fernsehers und wähle den Fernseher erneut.</p>
<h3>Immer noch nicht?</h3><p>Schreib an <a href="mailto:''' + MAIL + '''">''' + MAIL + '''</a> mit deinem Mac-Modell, der macOS-Version und dem TV-Modell.</p>
</div></div></section>''',
     faq=[("Warum erscheint mein Fernseher nicht in der Bildschirmsynchronisierung des Mac?", "Meistens sind Mac und Fernseher nicht im selben WLAN, oder das Netz trennt Geräte voneinander (Gastnetze, AP-Isolation). Prüf außerdem, ob Telebeam auf dem Fernseher geöffnet ist und ob die Firewall des Mac nicht alle eingehenden Verbindungen blockiert."),
          ("Warum erscheint mein Fernseher zweimal?", "Der Fernseher hat zusätzlich einen eigenen Empfänger eingebaut. Telebeam hängt dann „(2)“ an seinen Namen, damit beide erscheinen; wähle den mit „(2)“."),
          ("Warum sehe ich auf dem Fernseher nur einen leeren Schreibtisch?", "Der Mac nutzt den Fernseher als zweiten Bildschirm. " + MIRROR_DE),
          ("Warum sind Netflix und andere Streaming-Videos beim Spiegeln schwarz?", "Geschützte Videos von Diensten, die Bildschirmaufnahmen blockieren, erscheinen schwarz. Das entscheiden der Mac und der Dienst, nicht der Fernseher."),
          ("Funktioniert die Bildschirmsynchronisierung im Gast- oder Hotel-WLAN?", "Oft nicht. Solche Netze verhindern meist, dass sich Geräte sehen. Nutze dein normales Heimnetz.")],
     final=("Zurück auf dem großen Bildschirm", "Immer noch nicht? Schreib an support@controlmymac.com mit Mac- und TV-Modell."))


def update_sitemap(urls):
    path = os.path.join(ROOT, "sitemap.xml")
    xml = open(path, encoding="utf-8").read()
    today = date.today().isoformat()
    for p in PAGES:  # drop our old blocks, keep everything else as it is
        loc = SITE + path_of(p["lang"], p["slug"])
        xml = re.sub(r"  <url>\n    <loc>" + re.escape(loc) + r"</loc>\n.*?  </url>\n", "", xml, flags=re.S)
    blocks = []
    for p in PAGES:
        lines = ["  <url>", f"    <loc>{SITE}{path_of(p['lang'], p['slug'])}</loc>", f"    <lastmod>{today}</lastmod>"]
        if any(q["slug"] == p["slug"] and q["lang"] != p["lang"] for q in PAGES):
            for code in ("en", "de"):
                lines.append(f'    <xhtml:link rel="alternate" hreflang="{code}" href="{SITE}{path_of(code, p["slug"])}"/>')
            lines.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}{path_of("en", p["slug"])}"/>')
        blocks.append("\n".join(lines + ["  </url>"]) + "\n")
    xml = xml.replace("</urlset>", "".join(blocks) + "</urlset>")
    open(path, "w", encoding="utf-8").write(xml)


def main():
    for p in PAGES:
        out = os.path.join(ROOT, p["slug"] + ".html") if p["lang"] == "en" else os.path.join(ROOT, "de", p["slug"] + ".html")
        open(out, "w", encoding="utf-8").write(render(p))
    update_sitemap(PAGES)
    print(f"{len(PAGES)} pages written, sitemap updated")
    print("IndexNow list:\n" + "\n".join(SITE + path_of(p["lang"], p["slug"]) for p in PAGES))


if __name__ == "__main__":
    main()
