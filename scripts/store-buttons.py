#!/usr/bin/env python3
"""Builds the download area: Mac, Windows, App Store (iPhone and iPad), Google Play (Android), each with its device
icon, on every homepage and every Mac download page, in all 25 languages.

    python3 scripts/store-buttons.py            # rewrite the pages
    python3 scripts/store-buttons.py --check    # write nothing; exit 1 if a page is out of step with the settings

Everything it reads is in scripts/store-buttons.json:
  * links.windows and links.android: the ONE place for the two new links. A button is live once its link starts
    with https://, until then it is a "Coming soon" pill that opens the waiting list, or nothing at all
    (until_a_link_exists: "soon" or "hidden");
  * app_name: what the Windows and Android apps are called;
  * copy: the words, per language. "Notify me" comes from scripts/waitlist-i18n.json, the same words as the form.

Official badge artwork is used when it is in the repository, never drawn here:
  * assets/badges/app-store/<folder>.svg     Apple's "Download on the App Store" badge (black)
  * assets/badges/google-play/<folder>.png   Google's "Get it on Google Play" badge (or .svg)
  * assets/badges/microsoft-store/<folder>.svg   Microsoft's Store badge, only if links.windows is a Store link
<folder> is the language folder name, "en" for English. Without Apple's file the page keeps the site's own App Store
button. Without Google's (or Microsoft's) file that button refuses to go live.

links.windows may be a direct download link (the site's "Download for Windows" button plus a short note built from
windows_needs) or a Microsoft Store link, https://apps.microsoft.com/... (Microsoft's badge, no note).

--remote-badges is for a local look only (never commit its output): it points the badges at Apple's and Google's own
servers, so the real artwork can be seen before the files are in the repository.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONF = json.load(open(os.path.join(ROOT, "scripts", "store-buttons.json"), encoding="utf-8"))
WAITLIST = json.load(open(os.path.join(ROOT, "scripts", "waitlist-i18n.json"), encoding="utf-8"))
LANGS = list(CONF["copy"])  # "en" first, then the language folders
REMOTE = "--remote-badges" in sys.argv

START = "<!-- get:start (built by scripts/store-buttons.py; change scripts/store-buttons.json, not this block) -->"
END = "<!-- get:end -->"
TM_START, TM_END = "<!-- tm:start -->", "<!-- tm:end -->"
WAITLIST_JS = '<script src="/assets/waitlist.js" defer></script>'
BADGE_H = 44  # px on screen; Apple asks for 40 or more, Google for the same size as the badge next to it

# Device icons in the site's line style (24 grid, 1.8 stroke, round ends). Plain device shapes on purpose: Apple's and
# Google's brand rules do not allow their logos, or drawings of their products, outside the official badges.
_SVG = ('<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" '
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>')
ICON = {
    "mac": _SVG % '<rect x="4" y="4.5" width="16" height="11" rx="2"/><path d="M2 19.5h20"/>',
    "windows": _SVG % '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>',
    "phones": _SVG % ('<path d="M15 7.5V5.5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h5.5"/>'
                      '<rect x="13" y="10" width="8" height="10.5" rx="1.8"/>'),
    "android": _SVG % '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M12 5.8h.01"/>',
}
# The site's own App Store button, used until Apple's badge artwork is in assets/badges/app-store/.
APPLE_GLYPH = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 '
               '1.57-2.987 1.5-.12-1.08.42-2.22 1.05-2.95.71-.85 1.99-1.47 2.93-1.51.1.14.18.29.19.38zM17.16 9.16c-1.65-.02'
               '-3.03.96-3.82.96-.79 0-1.99-.94-3.28-.92-1.69.02-3.25.98-4.11 2.49-1.75 3.03-.45 7.51 1.25 9.97.83 1.2 1.82 '
               '2.55 3.12 2.5 1.25-.05 1.72-.81 3.24-.81 1.51 0 1.94.81 3.27.78 1.35-.02 2.2-1.22 3.03-2.43.95-1.39 1.34'
               '-2.74 1.36-2.81-.03-.01-2.61-1-2.64-3.97-.02-2.48 2.03-3.67 2.12-3.73-1.16-1.71-2.96-1.9-3.6-1.94z"/></svg>')
# Language folder -> the code Apple and Google use for the same language (only for --remote-badges).
APPLE_LOCALE = {"en": "en-us", "cs": "cs-cz", "da": "da-dk", "de": "de-de", "el": "el-gr", "es": "es-es", "fi": "fi-fi",
                "fr": "fr-fr", "hu": "hu-hu", "it": "it-it", "ja": "ja-jp", "ko": "ko-kr", "nl": "nl-nl", "no": "no-no",
                "pl": "pl-pl", "pt": "pt-br", "ro": "ro-ro", "ru": "ru-ru", "sk": "sk-sk", "sl": "sl-si", "sv": "sv-se",
                "tr": "tr-tr", "uk": "uk-ua", "zh": "zh-cn", "zh-hant": "zh-tw"}
GOOGLE_LOCALE = {"pt": "pt-br", "uk": "ua", "zh": "zh-cn", "zh-hant": "zh-tw"}
MICROSOFT_LOCALE = {"en": "en-us", "pt": "pt-br", "zh": "zh-cn", "zh-hant": "zh-tw", "no": "en-us"}
# Google's web badge PNG carries its own clear space: 646 x 250 with the badge itself 564 x 168 in the middle.
PLAY_PNG = (646, 250, 564, 168)


def live(platform):
    return CONF["links"][platform].startswith("https://")


def windows_from_store():
    """A Microsoft Store link gets Microsoft's badge; any other link is a direct download with the site's own button."""
    return CONF["links"]["windows"].startswith("https://apps.microsoft.com/")


def shown(platform):
    return live(platform) or CONF["until_a_link_exists"] == "soon"


def esc(text):
    return text.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")


def home(lang):
    return "/" if lang == "en" else "/" + lang


def page_file(lang, name):
    return os.path.join(ROOT, name) if lang == "en" else os.path.join(ROOT, lang, name)


def badge_file(store, lang):
    for ext in ("svg", "png"):
        rel = f"assets/badges/{store}/{lang}.{ext}"
        if os.path.exists(os.path.join(ROOT, rel)):
            return rel
    return None


def svg_size(path):
    head = open(path, encoding="utf-8").read(2000)
    box = re.search(r'viewBox="([\d.\s-]+)"', head)
    if box:
        _, _, w, h = (float(n) for n in box.group(1).split())
        return w, h
    return (float(re.search(r'\bwidth="([\d.]+)', head).group(1)), float(re.search(r'\bheight="([\d.]+)', head).group(1)))


def png_size(path):
    with open(path, "rb") as f:
        head = f.read(24)
    return int.from_bytes(head[16:20], "big"), int.from_bytes(head[20:24], "big")


def app_store_button(lang, href, label):
    """Apple's badge when its artwork is here, otherwise the site's own App Store button."""
    rel = badge_file("app-store", lang)
    if REMOTE:
        src, width = f"https://toolbox.marketingtools.apple.com/api/v2/badges/download-on-the-app-store/black/{APPLE_LOCALE[lang]}", ""
    elif rel:
        w, h = svg_size(os.path.join(ROOT, rel))
        src, width = "/" + rel, f' width="{round(BADGE_H * w / h)}"'
    else:
        return (f'<a class="btn btn-appstore" href="{href}" aria-label="{label}">{APPLE_GLYPH}'
                '<span class="as-txt"><small>Download on the</small><b>App&nbsp;Store</b></span></a>')
    return f'<a class="store-badge" href="{href}" aria-label="{label}"><img src="{src}" alt=""{width} height="{BADGE_H}"></a>'


def google_play_button(lang, label):
    rel = badge_file("google-play", lang)
    href = esc(CONF["links"]["android"])
    if REMOTE:
        code = GOOGLE_LOCALE.get(lang, lang)
        src, size = f"https://play.google.com/intl/en_us/badges/static/images/badges/{code}_badge_web_generic.png", PLAY_PNG
    elif not rel:
        sys.exit(f"Google Play is set to live, but assets/badges/google-play/{lang}.png (or .svg) is missing. "
                 "Google's official badge has to be in the repository first.")
    elif rel.endswith(".svg"):
        w, h = svg_size(os.path.join(ROOT, rel))
        return (f'<a class="store-badge" href="{href}" aria-label="{label}">'
                f'<img src="/{rel}" alt="" width="{round(BADGE_H * w / h)}" height="{BADGE_H}"></a>')
    else:
        src, size = "/" + rel, PLAY_PNG
        if png_size(os.path.join(ROOT, rel)) != PLAY_PNG[:2]:
            sys.exit(f"{rel} is not Google's 646 x 250 web badge; check the file before going live.")
    # The PNG's own clear space is pulled back in with negative margins, so the badge itself is BADGE_H tall.
    full_w, full_h, badge_w, badge_h = size
    k = BADGE_H / badge_h
    mx, my = (full_w - badge_w) / 2 * k, (full_h - badge_h) / 2 * k
    return (f'<a class="store-badge" href="{href}" aria-label="{label}">'
            f'<img src="{src}" alt="" width="{full_w * k:.1f}" height="{full_h * k:.1f}" '
            f'style="width:{full_w * k:.1f}px;height:{full_h * k:.1f}px;margin:-{my:.1f}px -{mx:.1f}px"></a>')


def microsoft_store_button(lang, label):
    rel = badge_file("microsoft-store", lang)
    href = esc(CONF["links"]["windows"])
    if REMOTE:
        src, width = f"https://get.microsoft.com/images/{MICROSOFT_LOCALE.get(lang, lang)}%20dark.svg", ""
    elif not rel or not rel.endswith(".svg"):
        sys.exit(f"Windows is set to a Microsoft Store link, but assets/badges/microsoft-store/{lang}.svg is missing. "
                 "Microsoft's official badge has to be in the repository first.")
    else:
        w, h = svg_size(os.path.join(ROOT, rel))
        src, width = "/" + rel, f' width="{round(BADGE_H * w / h)}"'
    return f'<a class="store-badge" href="{href}" aria-label="{label}"><img src="{src}" alt=""{width} height="{BADGE_H}"></a>'


def caption(icon, name, platform=None):
    """Device icon plus name; a differently named Windows or Android app shows its own name underneath."""
    other = CONF["app_name"].get(platform, CONF["app_name"]["site"]) if platform else CONF["app_name"]["site"]
    extra = f'<small>{esc(other)}</small>' if other != CONF["app_name"]["site"] else ""
    return f'<p class="get-cap">{ICON[icon]}<span>{name}{extra}</span></p>'


def soon_pill(platform, name, lang, waitlist_href):
    words = CONF["copy"][lang]
    return (f'<a class="get-soon" data-waitlist-href="{waitlist_href}">{ICON[platform]}<b>{name}</b>'
            f'<span>{esc(words["soon"])}</span>'
            f'<span class="get-notify" data-waitlist-link hidden>{esc(WAITLIST[lang]["submit"])}</span></a>')


def new_tiles(lang, waitlist_href):
    """Windows and Android: live tiles (go into the grid) and coming-soon pills (go under it)."""
    words = CONF["copy"][lang]
    tiles, pills = {}, []
    if live("windows"):
        if windows_from_store():
            label = esc(words["ms_aria"].replace("{name}", CONF["app_name"]["windows"]))
            button = microsoft_store_button(lang, label)
        else:  # direct download: the site's button, and what it needs in the words the Mac note already uses
            note = " · ".join([CONF["windows_needs"], words["free"], words["no_account"]])
            button = (f'<a class="btn btn-primary" href="{esc(CONF["links"]["windows"])}">{esc(words["win_btn"])}</a>\n'
                      f'          <p class="cta-note">{esc(note)}</p>')
        tiles["windows"] = ('        <div class="get-tile">\n'
                            f'          {caption("windows", "Windows", "windows")}\n'
                            f'          {button}\n'
                            '        </div>\n')
    elif shown("windows"):
        pills.append(soon_pill("windows", "Windows", lang, waitlist_href))
    if live("android"):
        label = esc(words["play_aria"].replace("{name}", CONF["app_name"]["android"]))
        tiles["android"] = ('        <div class="get-tile">\n'
                            f'          {caption("android", "Android", "android")}\n'
                            f'          {google_play_button(lang, label)}\n'
                            '        </div>\n')
    elif shown("android"):
        pills.append(soon_pill("android", "Android", lang, waitlist_href))
    row = ""
    if pills:
        row = '      <div class="get-soon-row">\n' + "".join(f"        {p}\n" for p in pills) + "      </div>\n"
    return tiles, row


def find(pattern, text, what, path):
    m = re.search(pattern, text, flags=re.S)
    if not m:
        sys.exit(f"{path}: could not find {what}. The page changed shape; update scripts/store-buttons.py.")
    return m


def homepage_block(lang, old, path):
    """The four-device area in the hero. Keeps the page's own Mac button, notes and App Store label as they are."""
    words = CONF["copy"][lang]
    mac_cta = find(r'<a class="btn btn-primary" data-dl-cta href="[^"]*">.*?</a>', old, "the Mac button", path).group(0)
    mac_alt = find(r'<a class="btn btn-quiet" data-dl-alt hidden href="[^"]*">.*?</a>', old, "the .dmg link", path).group(0)
    mac_note = find(r'<p class="cta-note" data-dl-note>.*?</p>', old, "the Mac note", path).group(0)
    pair_note = find(r'<p class="pair-note">.*?</p>', old, "the pairing note", path).group(0)
    store = find(r'<a class="(?:btn btn-appstore|store-badge)" href="(https://apps\.apple\.com/[^"]*)" aria-label="([^"]*)"', old, "the App Store button", path)
    tiles, soon_row = new_tiles(lang, "#platforms")
    return (f'{START}\n    <div class="get">\n      <div class="get-grid">\n'
            '        <div class="get-tile">\n'
            f'          {caption("mac", "Mac")}\n'
            f'          <div class="cta">\n            {mac_cta}\n            {mac_alt}\n          </div>\n'
            f'          {mac_note}\n'
            '        </div>\n'
            f'{tiles.get("windows", "")}'
            '        <div class="get-tile">\n'
            f'          {caption("phones", esc(words["phones"]))}\n'
            f'          {app_store_button(lang, store.group(1), store.group(2))}\n'
            f'          {pair_note}\n'
            '        </div>\n'
            f'{tiles.get("android", "")}'
            f'      </div>\n{soon_row}    </div>\n    {END}')


def download_block(lang, store_href, store_label):
    """Under the Mac download: the same buttons for the other devices."""
    words = CONF["copy"][lang]
    tiles, soon_row = new_tiles(lang, home(lang) + "#platforms")
    return (f'{START}\n    <div class="get get-other">\n      <p class="get-head">{esc(words["other"])}</p>\n'
            '      <div class="get-grid">\n'
            '        <div class="get-tile">\n'
            f'          {caption("phones", esc(words["phones"]))}\n'
            f'          {app_store_button(lang, store_href, store_label)}\n'
            '        </div>\n'
            f'{tiles.get("windows", "")}{tiles.get("android", "")}'
            f'      </div>\n{soon_row}    </div>\n    {END}')


def trademark_line(lang, is_home):
    """Credit lines the brand rules ask for, for the names and badges the page shows."""
    words = CONF["copy"][lang]
    parts = [words["tm_apple"]]
    if live("android"):
        parts.append(words["tm_play"])
    if shown("android") or is_home:  # the homepage's waiting list names both anyway
        parts.append(words["tm_android"])
    if shown("windows") or is_home:
        parts.append(words["tm_windows"])
    return f'  {TM_START}<p class="fmade ftm">{esc(" ".join(parts))}</p>{TM_END}\n'


def with_trademarks(page, lang, is_home, path):
    line = trademark_line(lang, is_home)
    if TM_START in page:
        return re.sub(r"[ \t]*" + re.escape(TM_START) + ".*?" + re.escape(TM_END) + r"\n", lambda _: line, page, flags=re.S)
    tail = "</div>\n</footer>"
    if page.count(tail) != 1:
        sys.exit(f"{path}: the footer changed shape; update scripts/store-buttons.py.")
    return page.replace(tail, line + tail)


def build_home(lang):
    path = page_file(lang, "index.html")
    page = open(path, encoding="utf-8").read()
    if START in page:
        a, b = page.index(START), page.index(END) + len(END)
    else:  # first run: the two-button block of 9 Oct 2026
        a = page.index('<div class="hero-get">')
        b = page.index("<!-- featured:start -->")
        b = len(page[:b].rstrip())
    page = page[:a] + homepage_block(lang, page[a:b], path) + page[b:]
    return path, with_trademarks(page, lang, True, path)


def build_download(lang):
    path = page_file(lang, "download.html")
    page = open(path, encoding="utf-8").read()
    home_page = open(page_file(lang, "index.html"), encoding="utf-8").read()
    store = find(r'<a class="(?:btn btn-appstore|store-badge)" href="(https://apps\.apple\.com/[^"]*)" aria-label="([^"]*)"', home_page,
                 "the App Store button", page_file(lang, "index.html"))
    block = download_block(lang, store.group(1), store.group(2))
    if START in page:
        a, b = page.index(START), page.index(END) + len(END)
        page = page[:a] + block + page[b:]
    else:
        hero = page.index('class="hero wrap download-hero"')
        end = page.index("  </section>", hero)
        page = page[:end] + "    " + block + "\n" + page[end:]
    # The "Coming soon" pills become links through the waiting-list script.
    if WAITLIST_JS not in page:
        site_js = '<script src="/assets/site.js" defer></script>\n'
        if page.count(site_js) != 1:
            sys.exit(f"{path}: could not find the site script tag.")
        page = page.replace(site_js, site_js + WAITLIST_JS + "\n")
    return path, with_trademarks(page, lang, False, path)


def main():
    check = "--check" in sys.argv
    if CONF["until_a_link_exists"] not in ("soon", "hidden"):
        sys.exit('until_a_link_exists must be "soon" or "hidden".')
    for platform, link in CONF["links"].items():
        if link.startswith("http://"):
            sys.exit(f"links.{platform} must start with https://")
    stale = 0
    for lang in LANGS:
        for path, new in (build_home(lang), build_download(lang)):
            if new != open(path, encoding="utf-8").read():
                stale += 1
                print(("would update " if check else "updated ") + os.path.relpath(path, ROOT))
                if not check:
                    open(path, "w", encoding="utf-8").write(new)
    state = ", ".join(f"{p}: {'LIVE' if live(p) else CONF['until_a_link_exists']}" for p in ("windows", "android"))
    print(f"{stale} page(s) {'would change' if check else 'changed'} ({state})")
    if check and stale:
        sys.exit(1)


if __name__ == "__main__":
    main()
