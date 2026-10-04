#!/usr/bin/env python3
"""Builds the English-only press page (/press) and the press kit zip.

    python3 scripts/build-press-kit.py

Writes press.html, assets/press/thumbs/*.webp, assets/press/og-press.jpg and
assets/press/control-my-mac-press-kit.zip. The full-size PNGs in assets/press/ are the sources; the text
lives in this file, so the page, its structured data and the facts file inside the zip always match.

Before a rebuild, re-check the facts below (versions, prices, languages) and update CHECKED.
The header is copied from compare.html so the page matches the current site chrome. Like the other English guides,
the page has NO i18n.js (its auto-redirect would send other languages to 404s).

Still waiting on Sebastian (leave out until he answers, no placeholders): founder quotes, founder photo.
"""
import html, io, json, os, re, zipfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRESS = os.path.join(ROOT, "assets", "press")
SITE = "https://www.controlmymac.com"
URL = SITE + "/press"

# ---------------------------------------------------------------- facts (checked against the live sources)
CHECKED = "5 October 2026"
IOS_VERSION, IOS_DATE = "1.2.6", "3 October 2026"        # itunes.apple.com/lookup?id=6781458180&country=us
MAC_VERSION, MAC_DATE = "1.2.7", "4 October 2026"        # appcast.xml
FIRST_RELEASE = "30 June 2026"
YOUTUBE_ID = "tFjjSwfIPU0"                               # same video as the homepage (data-yt on index.html)
EMAIL = "sebastian@controlmymac.com"
APP_STORE = "https://apps.apple.com/app/id6781458180"
LANGUAGES = ["English", "German", "French", "Italian", "Spanish", "Portuguese (Brazil)", "Dutch", "Polish", "Turkish",
             "Russian", "Ukrainian", "Slovenian", "Japanese", "Korean", "Simplified Chinese", "Traditional Chinese"]
LANG_LIST = ", ".join(LANGUAGES[:-1]) + " and " + LANGUAGES[-1]
SOCIAL = [("TikTok", "https://www.tiktok.com/@sebs_tech"), ("Instagram", "https://www.instagram.com/sebs_tech"),
          ("YouTube", "https://www.youtube.com/@Sebs_tech")]

TITLE = "Press Kit: Facts, Images and Demo Video | Control My Mac"
DESCRIPTION = ("Press kit for Control My Mac, the shortcut deck for every Mac app on iPhone and iPad: quick facts, "
               "ready-to-copy descriptions, images, app icon and demo video.")
OG_TITLE = "Control My Mac press kit"

ONE_SENTENCE = ("Control My Mac turns an iPhone or iPad into a shortcut deck for every Mac app: big one-tap buttons that "
                "switch by themselves as you change apps, plus a trackpad and keyboard you run with one finger.")
DESCRIPTIONS = [  # (id, heading, text)
    ("desc-sentence", "One sentence", ONE_SENTENCE),
    ("desc-50", "Short", "Control My Mac turns your iPhone or iPad into a shortcut deck for your Mac. Every Mac app can get "
     "its own Grid of one-tap buttons that switches in by itself. Press a shortcut on your Mac and it's saved. One finger "
     "also runs the trackpad and keyboard. No account."),
    ("desc-120", "Long", "Control My Mac turns the iPhone or iPad you already own into a shortcut deck for your Mac. Every "
     "Mac app can have its own Grid of one-tap buttons that switches in by itself when that app is in front: editing "
     "shortcuts in your video editor, tab controls in your browser. To add a shortcut, press it once on your Mac. When you "
     "need more than buttons, the same finger runs the rest of the Mac: trackpad, live or draft keyboard, app launcher and "
     "window switching. Everything works one-handed, so two-hand shortcuts become a single tap. Phone and Mac connect "
     "directly over Bluetooth or Wi-Fi, encrypted, with no account. The Mac app is free; the full Grid is an optional "
     "upgrade."),
    ("desc-about", "About Control My Mac", "Control My Mac is an iPhone and iPad app with a free Mac companion, made by "
     "solo developer Sebastian Škoić in Slovenia. It turns the phone or tablet into a shortcut deck that follows whichever "
     "Mac app is in front, plus a trackpad, keyboard, app launcher and window switcher, all usable with one finger. It "
     "needs no account, the apps collect no data, and phone and Mac connect directly over Bluetooth or Wi-Fi with "
     f"encryption. Available in {len(LANGUAGES)} languages on the App Store; the Mac app is at controlmymac.com."),
]
BIO = ("Sebastian Škoić is a solo app developer from Slovenia and the tech creator behind Sebs_Tech, with more than 30,000 "
       "followers across TikTok, Instagram and YouTube. He designed, built and ships Control My Mac on his own: the iPhone "
       "and iPad app, the Mac app and the website.")

FACTS = [  # (label, html)
    ("What it is", "An iPhone and iPad app (the remote) and a free Mac menu bar app (the receiver it pairs with)."),
    ("Maker", "Sebastian Škoić, a solo developer, also known as the tech creator Sebs_Tech."),
    ("Country", "Slovenia"),
    ("First release", f"{FIRST_RELEASE}, on the App Store"),
    ("Current versions", f"iPhone and iPad app {IOS_VERSION} ({IOS_DATE}). Mac app {MAC_VERSION} ({MAC_DATE})."),
    ("Requirements", "An iPhone or iPad with iOS or iPadOS 18 or later. A Mac with macOS 14 or later and Apple silicon "
     "(M1 or newer). Intel Macs can use Mac app 1.2.3, the last Intel version."),
    ("Connection", "Bluetooth (the default) or the same Wi-Fi network, paired by scanning a QR code. Direct between the "
     "two devices, encrypted, no account."),
    ("Prices", "Free to download. The Essentials plan is free forever and the Mac app is free. Full App is $3.99 a month "
     "after a 7-day free trial, or $17.99 once (US prices). In euro countries: €4.99 a month or €19.99 once. No ads in "
     "any plan."),
    ("Languages", f"{len(LANGUAGES)}: {LANG_LIST}."),
    ("Privacy label", "Data Not Collected (App Store)."),
    ("Category", "Productivity. Rated 4+."),
    ("Get it", f'<a href="{APP_STORE}">iPhone and iPad app on the App Store</a>. <a href="/download">Free Mac app</a>.'),
]

IMAGES_WIDE = [  # (file stem, title, caption, alt)
    ("control-my-mac-grid-three-iphones", "A Grid for every Mac app",
     "Three Grids that switch in by themselves as the Mac app changes.",
     "Three iPhones showing Control My Mac shortcut Grids: buttons for a video call app, buttons for a video editor in "
     "dark mode, and the Default grid with Copy, Paste and Undo, each with Auto-Switch turned on"),
    ("control-my-mac-grid-card", "Your shortcuts, your layout",
     "A Grid of nine shortcut buttons on iPhone, dark look.",
     "A card reading Your shortcuts, your layout next to an iPhone showing a Grid of nine shortcut buttons, among them "
     "Copy, Paste, Undo, Save and Screenshot"),
]
IMAGES_TALL = [
    ("control-my-mac-app-grids-iphone", "App grids on iPhone",
     "The list of Grids, one per Mac app.",
     "App Store screenshot titled Every app gets its own grid: an iPhone with the grid menu open, listing a Default "
     "grid for all other apps and separate Grids that switch in for five Mac apps"),
    ("control-my-mac-trackpad-iphone", "Trackpad",
     "Trackpad with tap-to-latch modifier keys.",
     "The Control My Mac trackpad on iPhone in dark mode, with Fn, Control, Option and Command keys in a row above the "
     "touch area and quick buttons below it"),
    ("control-my-mac-keyboard-iphone", "Keyboard",
     "Live keyboard. Draft is one tap away.",
     "The Control My Mac keyboard on iPhone with Live and Draft tabs, a text field that reads Type here to instantly "
     "type on your Mac, and a Mini Trackpad button"),
    ("control-my-mac-launcher-iphone", "Launcher",
     "Open Mac apps, windows and favorites.",
     "The Control My Mac Launcher on iPhone with a search field for apps, windows and favorites and three results: a "
     "running app, an open window and a favorite"),
    ("control-my-mac-mac-menu-bar-app", "Mac app",
     "The free Mac menu bar app. QR code blurred.",
     "The Control My Mac menu on the Mac showing Connected, a blurred pairing QR code, the Learn shortcuts note that "
     "says nothing else is read, stored or sent, and the paired iPhone under Known device"),
    ("control-my-mac-app-grids-ipad", "App grids on iPad",
     "The same Grids, bigger, on iPad.",
     "App Store screenshot titled Every app gets its own grid: an iPad with the grid menu open over a large Grid of "
     "shortcut buttons"),
]
ICONS = [  # (file stem, css class, title, alt)
    ("control-my-mac-icon-1024", "pk-square", "Square icon",
     "Control My Mac app icon: a white pointer with motion lines on a purple and blue gradient, full square"),
    ("control-my-mac-icon-transparent-512", "", "Rounded icon, transparent corners",
     "Control My Mac app icon with rounded corners on a transparent background"),
]

GRID_FEATURES = [
    ("A Grid for every Mac app.", "With an app in front on the Mac, one tap gives that app its own Grid. From then on it "
     "switches in by itself whenever that app is in front. Every other app uses the Default grid. Part of Full App."),
    ("Auto-Switch on or off.", "Turn it off and the grid you picked stays put, whatever app is in front."),
    ("Learns shortcuts from the Mac.", "Start recording on the phone, press the shortcut on the Mac keyboard, and it's "
     "saved to the button. Or pick the keys by hand on the phone."),
    ("One button, one or several shortcuts.", "A button can send several key combinations back to back, under a short "
     "label you choose."),
    ("Your size, your order.", "Pick the rows and columns and drag buttons into place. The iPad gets a bigger Grid."),
    ("Shortcuts beside the trackpad.", "Up to 12 shortcut buttons can sit in the trackpad's top row, so pointing and "
     "shortcuts share one screen. Part of Full App."),
    ("Works with any Mac app that has keyboard shortcuts.", "Video editors, design tools, browsers, spreadsheets, video "
     "calls."),
    ("What it doesn't do.", "The Grid sends keyboard shortcuts only. No plugins, no streaming scenes, no smart lights, "
     "no dials."),
]
FINGER_FEATURES = [
    ("Trackpad.", "Move, click, right click, double and triple tap, press and hold to drag. Scrolling, full gestures and "
     "Mouse Hold for long drags come with Full App."),
    ("Live keyboard.", "Keystrokes appear on the Mac as you type."),
    ("Draft keyboard.", "Write and edit a whole message on the phone, with the phone's own autocorrect and dictation, "
     "then send it to the Mac in one go."),
    ("Modifier keys you tap, not hold.", "Tap Command to latch it, tap the next key, tap Command again to release."),
    ("Launcher and window switching.", "Open Mac apps, favorites and windows from the phone. Essentials has a preview; "
     "Full App removes the upgrade prompts."),
    ("Look and help.", "Light, Dark or System appearance with your own accent color, and Help Mode, where every button "
     "explains what it does until you turn it off."),
]
PLANS = [  # (Essentials, Full App)
    ("Trackpad movement, click and right click", "Everything in Essentials"),
    ("Live and Draft keyboard basics", "Scrolling, full gestures and Mini Trackpad controls"),
    ("One Grid button", "The full Grid: app grids, Auto-Switch, learning shortcuts from the Mac, rearranging"),
    ("Launcher preview", "Launcher and window switching without upgrade prompts"),
    ("Dark mode, accent colors, Help Mode", "Your own shortcut buttons, up to 12 in the trackpad's top row"),
    ("No ads, no account", "No ads, no account"),
]
PRIVACY = [
    ("No account, no servers, no analytics in the apps.", "The App Store privacy label is Data Not Collected."),
    ("Direct connection.", "Pointer moves, taps, keystrokes and launcher commands go straight from the iPhone or iPad to "
     "the paired Mac, over Bluetooth or the local network."),
    ("Encrypted.", "Every pointer and control message is encrypted and authenticated (ChaCha20-Poly1305), with a fresh "
     "key exchange for each connection (P-256). The pairing secret from the QR code is never sent over the air and is "
     "stored in the Mac's Keychain. Encryption arrived on 27 September 2026 and needs iPhone and iPad app 1.2.2 or later "
     "with Mac app 1.2.3 or later. It has not been independently audited."),
    ("Mac permissions.", "Accessibility is required, so the Mac app can move the pointer and type like a mouse and "
     "keyboard. Bluetooth, if you use it. Local Network on macOS 15 and later, for Wi-Fi. Input Monitoring is optional "
     "and only used to learn a shortcut from the Mac keyboard: it listens only while you're recording and saves just "
     "the combination you pressed."),
    ("iPhone and iPad permissions.", "Camera, only to scan the pairing QR code. Local Network, only to find the Mac."),
    ("The website is separate from the apps.", "It counts visits in aggregate and has an optional email list. The demo "
     'video is hosted on YouTube and loads only when you press play. Details are in the <a href="/privacy">privacy '
     "policy</a>."),
]
ACCESS = [
    ("One finger, end to end.", "Pointer, click, typing, shortcuts, launcher and pairing all work with one finger. Setup "
     "is a QR scan, with no codes or addresses to type."),
    ("Two-hand shortcuts become one tap.", "Shift-Command-4, Option-Command-Esc or any app shortcut can be a single Grid "
     "button. Modifier keys latch with a tap instead of being held."),
    ("No need to press the shortcut to set it up.", "Shortcuts can be picked by hand on the phone, or pressed once on "
     "the Mac."),
    ("Large, forgiving targets.", "Sized for a thumb and laid out to work in either hand."),
    ("Type at your own pace.", "The Draft keyboard uses the phone's autocorrect and dictation, then sends the finished "
     "text in one go."),
    ("Mouse Hold.", "Keeps the mouse button down for long drags. Part of Full App."),
    ("Large text.", "The app follows the system text size, up to the largest accessibility sizes."),
    ("Help Mode and a warm, low-glare dark mode.", ""),
    ("Works alongside the Mac's built-in accessibility tools.", 'The <a href="/one-hand">one-hand page</a> explains how '
     "they fit together."),
]
FAQ = [  # (question, answer html)
    ("What is Control My Mac, in one line?",
     "A shortcut deck for every Mac app on your iPhone or iPad, plus a trackpad and keyboard you run with one finger."),
    ("How does it connect to the Mac?",
     "The free Mac app shows a QR code. Scan it with the iPhone or iPad app and the two are paired. After that they talk "
     "directly over Bluetooth (the default, no network needed) or the same Wi-Fi network. Nothing goes through the "
     "internet or a server, and there is no account."),
    ("What data does it collect?",
     "None from the apps. The App Store privacy label is Data Not Collected. There is no account, no analytics and no "
     "ads in the apps, and the connection between the two devices is encrypted. The website is separate: it counts "
     'visits in aggregate and has an optional email list, both described in the <a href="/privacy">privacy policy</a>.'),
    ("Which Mac, iPhone or iPad do I need?",
     "A Mac with macOS 14 or later and Apple silicon. Intel Macs can use Mac app version 1.2.3, the last Intel version. "
     "The iPhone or iPad needs iOS or iPadOS 18 or later."),
    ("Where do I get the Mac app?",
     'It is a free download from <a href="/download">controlmymac.com/download</a>. It is signed with an Apple Developer '
     "ID, notarized by Apple, and it updates itself. It is not on the Mac App Store."),
    ("Can't macOS already do this?",
     "Not from an iPhone. As of September 2026, macOS has no built-in way to use an iPhone as a mouse or trackpad. It "
     "can share a Mac's keyboard and trackpad with another Mac or an iPad, and it can use an iPad as a second display. "
     "Neither works with an iPhone, and neither gives you shortcut buttons for each app."),
    ("How is it different from a hardware shortcut deck?",
     "Physical keys can be pressed without looking, and some hardware decks have dials or run plugins. Control My Mac "
     "sends keyboard shortcuts only. It is for people whose buttons would mostly be Mac shortcuts and who would rather "
     'use the phone they already own. The <a href="/stream-deck-alternative">deck comparison</a> has the details.'),
    ("How is it different from other remote mouse apps?",
     "Many of them cover more platforms and add extras such as media remotes. Control My Mac works only with Mac, iPhone "
     "and iPad, and spends that focus on the per-app shortcut Grid, a Draft keyboard, one-finger use from pairing "
     'onward, no ads in any plan and no account. The <a href="/compare">comparison page</a> has the details.'),
    ("Are there other apps that switch buttons by app?",
     "Yes. Switching by app is not new on its own. What Control My Mac combines is a Grid that follows the Mac app in "
     "front, learning shortcuts straight from the Mac keyboard, the whole Mac under one finger, Bluetooth with no Wi-Fi "
     "needed, and no account."),
    ("Which Mac apps does the Grid work with?",
     "Any Mac app that has keyboard shortcuts, for example video editors, design tools, browsers, spreadsheets and video "
     'call apps. Each app can have its own Grid. The <a href="/macro-pad-for-mac">macro pad guide</a> has a starter '
     "Grid and links to ready-made Grids for three video editors."),
    ("Is it good for streamers?",
     "Only for keyboard shortcuts. It does not control streaming software scenes or plugins."),
    ("What does it cost?",
     "It is free to download, with a free Essentials plan forever and a free Mac app. Full App is $3.99 a month after a "
     "7-day free trial, or $17.99 once, in the US. In euro countries it is €4.99 a month or €19.99 once. The App Store "
     "shows each country's own price. There are no ads in any plan."),
    ("Can I try the full version for a review?",
     "Yes. Full App has a 7-day free trial on the monthly plan, which renews at the monthly price unless you cancel. "
     f'For longer review access, email <a href="mailto:{EMAIL}">{EMAIL}</a>.'),
    ("Is it accessible?",
     "It is built for people with limited hand or arm use: one finger for everything, large targets, two-hand shortcuts "
     "as one tap, and support for the largest text sizes. Screen reader, switch and voice control support have not been "
     "tested on a device yet, so the app does not claim them."),
    ("Which languages does it speak?",
     f"{len(LANGUAGES)}: {LANG_LIST}. The website is in the same {len(LANGUAGES)} languages."),
    ("Does it work with Windows or Android?",
     "Not today. It is for Mac, iPhone and iPad only."),
    ("Who is behind it?",
     "Sebastian Škoić, a solo developer in Slovenia, also known as the tech creator Sebs_Tech."),
]
COVERAGE = [  # (source and date, link text, url, lang)
    ("iphone-ticker.de · 1 October 2026 · in German", "Control My Mac macht das iPhone zur Mac-Fernbedienung",
     "https://www.iphone-ticker.de/control-my-mac-macht-das-iphone-zur-mac-fernbedienung-287352/", "de"),
    ("Product Hunt · 4 October 2026", "Featured on Product Hunt",
     "https://www.producthunt.com/products/control-my-mac", None),
]
TRADEMARKS = ("Stream Deck is a trademark of Corsair Memory, Inc. iPhone, iPad, Mac, macOS and App Store are trademarks "
              "of Apple Inc. Other product names, including the app names shown in the screenshots, belong to their "
              "owners. Control My Mac is not affiliated with or endorsed by any of them.")

e = html.escape


def words(text):
    return len(text.split())


def plain(text):
    return html.unescape(re.sub(r"<[^>]+>", "", text))


def thumb(stem, width):
    """Makes the WebP thumbnail and returns (thumb w, thumb h, full w, full h, full size in MB)."""
    src = os.path.join(PRESS, stem + ".png")
    im = Image.open(src)
    w, h = im.size
    size = (width, round(h * width / w))
    im.resize(size, Image.LANCZOS).save(os.path.join(PRESS, "thumbs", stem + ".webp"), quality=82, method=6)
    return size[0], size[1], w, h, os.path.getsize(src) / 1e6


def figure(item, width):
    stem, title, caption, alt = item
    tw, th, w, h, mb = thumb(stem, width)
    size = f"{mb:.1f} MB" if mb >= 1 else f"{round(mb * 1000)} KB"
    return (f'        <figure class="pk-img">\n'
            f'          <a class="pk-thumb" href="/assets/press/{stem}.png"><img src="/assets/press/thumbs/{stem}.webp" '
            f'loading="lazy" decoding="async" width="{tw}" height="{th}" alt="{e(alt)}"></a>\n'
            f'          <figcaption><strong>{e(title)}</strong>{e(caption)} '
            f'<a href="/assets/press/{stem}.png" download>PNG, {w} × {h}, {size}</a></figcaption>\n'
            f'        </figure>')


def bullets(items, indent="        "):
    out = []
    for lead, text in items:
        out.append(f"{indent}  <li><strong>{e(lead)}</strong>{' ' + text if text else ''}</li>")
    return f'{indent}<ul class="pk-list">\n' + "\n".join(out) + f"\n{indent}</ul>"


def build_og():
    """1200 × 630 share image cut from the three-iPhones art (Grid first, unlike the site-wide og-v2.png)."""
    im = Image.open(os.path.join(PRESS, "control-my-mac-grid-three-iphones.png")).convert("RGB")
    w, h = im.size
    crop_h = round(w * 630 / 1200)
    top = (h - crop_h) // 2
    im.crop((0, top, w, top + crop_h)).resize((1200, 630), Image.LANCZOS).save(
        os.path.join(PRESS, "og-press.jpg"), quality=86, optimize=True, progressive=True)


def facts_text():
    lines = ["CONTROL MY MAC: PRESS FACTS", f"Facts checked on {CHECKED}. Latest version of this kit: {URL}", "",
             "IN ONE SENTENCE", ONE_SENTENCE, "", "QUICK FACTS"]
    for label, value in FACTS:
        value = plain(value)
        if label == "Get it":
            value = f"iPhone and iPad app: {APP_STORE}  Mac app: {SITE}/download"
        lines.append(f"{label}: {value}")
    lines += ["", "DESCRIPTIONS"]
    for _, heading, text in DESCRIPTIONS[1:]:
        lines += [f"{heading} ({words(text)} words):", text, ""]
    lines += ["NOTE", "App grids and Auto-Switch are part of the paid Full App. The free Essentials plan includes one "
              "Grid button.", "", "ABOUT THE MAKER", BIO, "", "LINKS", f"Website: {SITE}", f"Press page: {URL}",
              f"App Store: {APP_STORE}", f"Mac app: {SITE}/download",
              f"Demo video: https://www.youtube.com/watch?v={YOUTUBE_ID}", f"Privacy policy: {SITE}/privacy"]
    lines += [f"{name}: {url}" for name, url in SOCIAL]
    lines += ["", "PRESS CONTACT", f"Sebastian Škoić, {EMAIL}", "", "USING THE FILES",
              "You may use the images, the app icon and the demo video in coverage of Control My Mac. Please don't "
              "recolor, crop, stretch or add effects to the icon. Write the name as Control My Mac, three words.", "",
              "IN THIS FOLDER", "icon/    the app icon, square (1024 × 1024) and rounded with transparent corners (512 × 512)",
              "images/  eight press images (PNG)", "", TRADEMARKS, ""]
    return "\n".join(lines)


def build_zip():
    path = os.path.join(PRESS, "control-my-mac-press-kit.zip")
    top = "Control-My-Mac-press-kit/"
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        def add(name, data, compress):
            info = zipfile.ZipInfo(top + name, date_time=(2026, 10, 4, 12, 0, 0))  # fixed date: same input, same zip
            info.external_attr = 0o644 << 16
            z.writestr(info, data, compress_type=compress)
        add("Control-My-Mac-facts.txt", facts_text().encode("utf-8"), zipfile.ZIP_DEFLATED)
        for stem, *_ in ICONS:
            add(f"icon/{stem}.png", open(os.path.join(PRESS, stem + ".png"), "rb").read(), zipfile.ZIP_STORED)
        for stem, *_ in IMAGES_WIDE + IMAGES_TALL:
            add(f"images/{stem}.png", open(os.path.join(PRESS, stem + ".png"), "rb").read(), zipfile.ZIP_STORED)
    data = buf.getvalue()
    if not os.path.exists(path) or open(path, "rb").read() != data:
        open(path, "wb").write(data)
    return len(data) / 1e6


def json_ld():
    img = SITE + "/assets/press/"
    person = {"@context": "https://schema.org", "@type": "Person", "@id": URL + "#sebastian", "name": "Sebastian Škoić",
              "alternateName": ["Sebs_Tech", "Sebastian Skoic"], "jobTitle": "App developer and tech creator",
              "description": BIO, "email": EMAIL, "url": URL,
              "address": {"@type": "PostalAddress", "addressCountry": "SI"},
              "sameAs": [u for _, u in SOCIAL] + ["https://linktr.ee/sebs_tech"]}
    app = {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Control My Mac",
           "operatingSystem": "iOS 18+, iPadOS 18+, macOS 14+", "applicationCategory": "UtilitiesApplication",
           "description": ONE_SENTENCE, "datePublished": "2026-06-30", "inLanguage": [
               "en", "de", "fr", "it", "es", "pt-BR", "nl", "pl", "tr", "ru", "uk", "sl", "ja", "ko", "zh-Hans", "zh-Hant"],
           "url": SITE + "/", "image": img + "control-my-mac-grid-three-iphones.png",
           "screenshot": [img + s + ".png" for s, *_ in IMAGES_TALL[:4]],
           "installUrl": APP_STORE, "downloadUrl": SITE + "/download",
           "sameAs": [APP_STORE, "https://alternativeto.net/software/control-my-mac/about/",
                      "https://www.saashub.com/control-my-mac", "https://www.producthunt.com/products/control-my-mac"],
           "offers": [{"@type": "Offer", "name": "Essentials", "price": "0", "priceCurrency": "USD", "category": "free"},
                      {"@type": "Offer", "name": "Full App (monthly)", "price": "3.99", "priceCurrency": "USD"},
                      {"@type": "Offer", "name": "Full App (lifetime)", "price": "17.99", "priceCurrency": "USD"},
                      {"@type": "Offer", "name": "Full App (monthly)", "price": "4.99", "priceCurrency": "EUR"},
                      {"@type": "Offer", "name": "Full App (lifetime)", "price": "19.99", "priceCurrency": "EUR"}],
           "author": {"@id": URL + "#sebastian"},
           "publisher": {"@type": "Organization", "name": "Control My Mac", "url": SITE + "/"}}
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": "Press kit", "item": URL}]}
    faq = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": plain(a)}} for q, a in FAQ]}
    return "\n".join(f'<script type="application/ld+json">\n{json.dumps(block, ensure_ascii=False)}\n</script>'
                     for block in (crumbs, app, person, faq))


def build_page(zip_mb):
    template = open(os.path.join(ROOT, "compare.html"), encoding="utf-8").read()
    header = re.search(r'<header class="site-header">.*?</header>', template, re.S).group(0)
    fextra = re.search(r'<div class="wrap fextra">.*?</div>', template, re.S).group(0)

    facts = "\n".join(f'            <tr><th scope="row">{e(label)}</th><td>{value}</td></tr>' for label, value in FACTS)
    copies = "\n".join(
        f'        <article class="card pk-copy">\n'
        f'          <div class="pk-copy-head"><h3>{e(heading)}</h3><span class="pk-count">{words(text)} words</span></div>\n'
        f'          <p class="pk-copy-text" id="{cid}">{e(text)}</p>\n'
        f'          <button class="btn btn-quiet btn-small pk-copy-btn" type="button" data-copy="{cid}" '
        f'aria-label="Copy: {e(heading)}">Copy</button>\n'
        f'        </article>' for cid, heading, text in DESCRIPTIONS)
    wide = "\n".join(figure(item, 1040) for item in IMAGES_WIDE)
    tall = "\n".join(figure(item, 600 if "ipad" in item[0] else 480) for item in IMAGES_TALL)
    icons = []
    for stem, cls, title, alt in ICONS:
        _, _, w, h, mb = thumb(stem, 256)
        cls_attr = f' class="{cls}"' if cls else ""
        icons.append(
            f'        <div class="pk-icon">\n'
            f'          <img{cls_attr} src="/assets/press/thumbs/{stem}.webp" '
            f'loading="lazy" decoding="async" width="128" height="128" alt="{e(alt)}">\n'
            f'          <p><strong>{e(title)}</strong><br>PNG, {w} × {h}, {round(mb * 1000)} KB</p>\n'
            f'          <a class="btn btn-quiet btn-small" href="/assets/press/{stem}.png" download>Download</a>\n'
            f'        </div>')
    plans = "\n".join(f"            <tr><td>{e(a)}</td><td>{e(b)}</td></tr>" for a, b in PLANS)
    faq = "\n".join(f"        <details>\n          <summary>{e(q)}</summary>\n          <p>{a}</p>\n        </details>"
                    for q, a in FAQ)
    coverage = "\n".join(
        f'        <li><span class="pk-src">{e(src)}</span><a href="{url}" rel="noopener"'
        + (f' hreflang="{lang}" lang="{lang}"' if lang else "") + f'>{e(text)}</a></li>'
        for src, text, url, lang in COVERAGE)
    social = " ".join(f'<a class="btn btn-quiet btn-small" href="{url}" rel="me noopener">{name}</a>' for name, url in SOCIAL)
    og_image = SITE + "/assets/press/og-press.jpg"
    og_alt = "Three iPhones showing Control My Mac shortcut Grids for different Mac apps"

    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="apple-itunes-app" content="app-id=6781458180">
<meta name="robots" content="index, follow, max-image-preview:large">
<title>{e(TITLE)}</title>
<meta name="description" content="{e(DESCRIPTION)}">
<link rel="canonical" href="{URL}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Control My Mac">
<meta property="og:title" content="{e(OG_TITLE)}">
<meta property="og:description" content="{e(DESCRIPTION)}">
<meta property="og:url" content="{URL}">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="{og_image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{e(og_alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(OG_TITLE)}">
<meta name="twitter:description" content="{e(DESCRIPTION)}">
<meta name="twitter:image" content="{og_image}">
<meta name="twitter:image:alt" content="{e(og_alt)}">
<meta name="theme-color" content="#0b0d12" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#f7f8fb" media="(prefers-color-scheme: light)">
<link rel="icon" type="image/png" href="/assets/control-my-mac-icon.png">
<link rel="apple-touch-icon" href="/assets/control-my-mac-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/icon-192.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet" href="/assets/site.css">
<link rel="stylesheet" href="/assets/press/press.css">
{json_ld()}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

{header}

<main id="main">
  <section class="hero wrap">
    <p class="pill">For journalists, reviewers and creators</p>
    <h1>Control My Mac <span class="grad">press kit</span></h1>
    <p class="sub">{e(ONE_SENTENCE)}</p>
    <div class="cta">
      <a class="btn btn-primary" href="/assets/press/control-my-mac-press-kit.zip" download>Download press kit (zip, {round(zip_mb)} MB)</a>
      <a class="btn btn-quiet" href="#video">Watch the demo</a>
      <a class="btn btn-quiet" href="mailto:{EMAIL}">Email Sebastian</a>
    </div>
    <p class="cta-note">Press contact: <a href="mailto:{EMAIL}">{EMAIL}</a> · Facts checked on {CHECKED}</p>
  </section>

  <section class="band" id="facts">
    <div class="wrap">
      <h2 class="h2">Quick facts</h2>
      <p class="lead">The short version, for a fact box.</p>
      <div class="table-wrap">
        <table class="cmp pk-facts">
          <tbody>
{facts}
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <section id="descriptions">
    <div class="wrap">
      <h2 class="h2">Ready-to-copy descriptions</h2>
      <p class="lead">Use them as they are or cut them down.</p>
      <div class="pk-copies">
{copies}
      </div>
      <p class="cmp-note">App grids and Auto-Switch are part of the paid Full App. The free Essentials plan includes one Grid button.</p>
      <p class="pk-status" id="pk-status" role="status" aria-live="polite"></p>
    </div>
  </section>

  <section class="band" id="images">
    <div class="wrap">
      <h2 class="h2">Images</h2>
      <p class="lead">Tap an image for the full-size PNG. All eight are in the zip too.</p>
      <div class="pk-wide">
{wide}
      </div>
      <div class="pk-tall">
{tall}
      </div>
      <p class="cmp-note">You may use these images in coverage of Control My Mac. The app screens show demo data.</p>
    </div>
  </section>

  <section id="video">
    <div class="wrap">
      <h2 class="h2">Demo video</h2>
      <p class="lead">One minute, with sound.</p>
      <div class="hero-video" data-yt="{YOUTUBE_ID}">
        <button class="hv-play" type="button" aria-label="Play the Control My Mac video (1 minute, with sound)">
          <img src="/assets/video-cover.webp" alt="" width="1280" height="720" loading="lazy" decoding="async">
          <span class="hv-cap" aria-hidden="true"><span class="hv-cap-1">Movie night, photos, slides.</span><span class="hv-cap-2">From your seat.</span></span>
          <span class="hv-btn" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
          <span class="hv-label" aria-hidden="true">Watch the video · 1 min</span>
        </button>
      </div>
      <p class="cmp-note">The video is hosted on YouTube and loads only when you press play. To link or embed it, use <a href="https://www.youtube.com/watch?v={YOUTUBE_ID}" rel="noopener">youtube.com/watch?v={YOUTUBE_ID}</a>.</p>
    </div>
  </section>

  <section class="band" id="icon">
    <div class="wrap">
      <h2 class="h2">App icon</h2>
      <p class="lead">Please don't recolor, crop, stretch or add effects to the icon.</p>
      <div class="pk-icons">
{chr(10).join(icons)}
      </div>
      <p class="cmp-note">There is no separate wordmark. Write the name as Control My Mac, three words.</p>
    </div>
  </section>

  <section id="maker">
    <div class="wrap">
      <h2 class="h2">About the maker</h2>
      <div class="prose">
        <p>{e(BIO)}</p>
        <p>Contact: <a href="mailto:{EMAIL}">{EMAIL}</a></p>
        <div class="pk-links">{social}</div>
      </div>
    </div>
  </section>

  <section class="band" id="features">
    <div class="wrap">
      <h2 class="h2">What it does</h2>
      <p class="lead">The Grid first, then the rest of the Mac under one finger.</p>
      <div class="prose">
        <h3>The Grid: a shortcut deck that changes with each Mac app</h3>
{bullets(GRID_FEATURES)}
        <h3>One finger for the rest of the Mac</h3>
{bullets(FINGER_FEATURES)}
        <h3>Free Essentials and paid Full App</h3>
      </div>
      <div class="table-wrap pk-plans">
        <table class="cmp pk-facts">
          <thead>
            <tr><th scope="col">Essentials, free forever</th><th scope="col">Full App</th></tr>
          </thead>
          <tbody>
{plans}
          </tbody>
        </table>
      </div>
      <p class="cmp-note">Full App is $3.99 a month after a 7-day free trial, or $17.99 once, in the US. It is bought in the iPhone or iPad app through Apple.</p>
    </div>
  </section>

  <section id="privacy">
    <div class="wrap">
      <h2 class="h2">Privacy and security</h2>
      <p class="lead">Your phone and your Mac talk to each other, and nobody else.</p>
      <div class="prose">
{bullets(PRIVACY)}
      </div>
    </div>
  </section>

  <section class="band" id="accessibility">
    <div class="wrap">
      <h2 class="h2">Accessibility</h2>
      <p class="lead">Built for people who can tap a phone screen but find a mouse, a trackpad or two-hand shortcuts hard: one usable hand or arm, a weak grip, limited finger movement, tremor or hand pain.</p>
      <div class="prose">
{bullets(ACCESS)}
        <p>Control My Mac is a remote control app, not a medical or certified assistive device. Screen reader, switch and voice control support have not been tested on a device yet, so the app does not claim them.</p>
      </div>
    </div>
  </section>

  <section id="faq">
    <div class="wrap">
      <h2 class="h2">Questions journalists ask</h2>
      <div class="prose faq">
{faq}
      </div>
    </div>
  </section>

  <section class="band" id="coverage">
    <div class="wrap">
      <h2 class="h2">Coverage</h2>
      <ul class="pk-cover">
{coverage}
      </ul>
    </div>
  </section>

  <section id="contact">
    <div class="wrap">
      <div class="final">
        <h2 class="h2">Writing about Control My Mac?</h2>
        <p class="lead">Questions, review access or anything missing from this page: Sebastian answers his own email.</p>
        <div class="cta">
          <a class="btn btn-primary" href="mailto:{EMAIL}">Email {EMAIL}</a>
          <a class="btn btn-quiet" href="/assets/press/control-my-mac-press-kit.zip" download>Download press kit (zip, {round(zip_mb)} MB)</a>
        </div>
      </div>
      <div class="pk-notes" id="notes">
        <p>{e(TRADEMARKS)}</p>
        <p>Facts checked on {CHECKED}.</p>
      </div>
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="wrap">
    <div class="frow">
      <div>© 2026 Control My Mac</div>
      <nav class="flinks" aria-label="Footer">
        <a href="/">Overview</a>
        <a href="/start">Find your fit</a>
        <a href="/one-hand">One hand</a>
        <a href="/couch">Couch</a>
        <a href="/present">Presenting</a>
        <a href="/pro">Power users</a>
        <a href="/privacy">Privacy</a>
        <a href="/support">Support</a>
        <a href="/press" aria-current="page">Press</a>
        <a href="mailto:support@controlmymac.com">Contact</a>
      </nav>
    </div>
    <p class="fnote">Requires iOS or iPadOS 18+ and macOS 14+. No account is required. Remote-control traffic stays encrypted and travels directly between your devices.</p>
  </div>
{fextra}
</footer>

<script src="/assets/site.js" defer></script>
<script src="/assets/press/press.js" defer></script>
</body>
</html>
"""
    for bad in ("—", "–", "https://controlmymac.com"):
        assert bad not in page, f"not allowed on the press page: {bad!r}"
    open(os.path.join(ROOT, "press.html"), "w", encoding="utf-8").write(page)


def main():
    os.makedirs(os.path.join(PRESS, "thumbs"), exist_ok=True)
    build_og()
    zip_mb = build_zip()
    build_page(zip_mb)
    print(f"press.html written; zip {zip_mb:.1f} MB; title {len(TITLE)} chars; description {len(DESCRIPTION)} chars")
    for cid, heading, text in DESCRIPTIONS:
        print(f"  {heading}: {words(text)} words")


if __name__ == "__main__":
    main()
