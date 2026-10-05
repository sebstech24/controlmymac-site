#!/usr/bin/env python3
"""Keeps the language plumbing of the static site in step with one list of locales.

Run from the repository root after adding a language folder (or any time, it is idempotent):

    python3 scripts/sync-locales.py            # rewrite files
    python3 scripts/sync-locales.py --check    # report what would change, write nothing

What it rewrites, for every page that exists:
  * the footer language list (<nav class="flangs">) on every localized page, in every language;
  * the hreflang <link> tags in the <head> of every localized page (right after the canonical link), the same
    set the sitemap carries;
  * sitemap.xml: one <url> per localized page, each with the full set of hreflang alternates;
  * the logo selector list in assets/site.css (.brand[href="/xx"] .logo).

What it does NOT do (edit by hand when adding a language):
  * assets/i18n.js (switcher + first-visit redirect), assets/site.js and assets/offer.js copy;
  * api/_lib/security.js SUPPORTED_LOCALES, api/_lib/email-content.js, api/unsubscribe.js;
  * the translated pages themselves.
"""
import os
import re
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://www.controlmymac.com"

# (folder / URL prefix, <html lang> and hreflang, extra hreflang values, name in its own language)
# Order = the order every language list on the site shows (Sebastian, 5 Oct 2026): English first, then every
# other language A-Z by its own name (Latin names, then Greek, Cyrillic, Japanese, Korean, Chinese).
# Keep assets/i18n.js and 404.html in the same order.
LOCALES = [
    ("en", "en", [], "English"),
    ("cs", "cs", [], "Čeština"),
    ("da", "da", [], "Dansk"),
    ("de", "de", [], "Deutsch"),
    ("es", "es", [], "Español"),
    ("fr", "fr", [], "Français"),
    ("it", "it", [], "Italiano"),
    ("hu", "hu", [], "Magyar"),
    ("nl", "nl", [], "Nederlands"),
    ("no", "nb", ["no"], "Norsk"),
    ("pl", "pl", [], "Polski"),
    ("pt", "pt-BR", ["pt"], "Português"),
    ("ro", "ro", [], "Română"),
    ("sk", "sk", [], "Slovenčina"),
    ("sl", "sl", [], "Slovenščina"),
    ("fi", "fi", [], "Suomi"),
    ("sv", "sv", [], "Svenska"),
    ("tr", "tr", [], "Türkçe"),
    ("el", "el", [], "Ελληνικά"),
    ("ru", "ru", [], "Русский"),
    ("uk", "uk", [], "Українська"),
    ("ja", "ja", [], "日本語"),
    ("ko", "ko", [], "한국어"),
    ("zh", "zh-Hans", [], "简体中文"),
    ("zh-hant", "zh-Hant", [], "繁體中文"),
]

# Pages that exist once per language, in sitemap order. "" is the home page.
PAGES = ["", "couch", "download", "one-hand", "present", "pro", "start", "support", "privacy"]

NAV_RE = re.compile(r'<nav class="flangs" aria-label="([^"]*)">.*?</nav>', re.S)
URL_RE = re.compile(r"  <url>\n.*?  </url>\n", re.S)
LOC_RE = re.compile(r"<loc>([^<]+)</loc>")
LASTMOD_RE = re.compile(r"<lastmod>([^<]+)</lastmod>")
# The canonical link, plus any hreflang links already sitting right after it.
CANONICAL_RE = re.compile(r'(<link rel="canonical" href="[^"]*">\n)((?:<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n)*)')


def page_file(code, page):
    name = (page or "index") + ".html"
    return os.path.join(ROOT, name) if code == "en" else os.path.join(ROOT, code, name)


def page_path(code, page):
    """Site path of a page: "/", "/pro", "/de", "/de/pro"."""
    if code == "en":
        return "/" + page
    return "/" + code + ("/" + page if page else "")


def nav_html(label, current, page):
    links = []
    for code, lang, _extra, name in LOCALES:
        if not os.path.exists(page_file(code, page)):
            continue
        cur = ' aria-current="page"' if code == current else ""
        links.append(f'<a href="{page_path(code, page)}" lang="{lang}" hreflang="{lang}"{cur}>{name}</a>')
    return f'<nav class="flangs" aria-label="{label}">' + " ".join(links) + "</nav>"


def sync_navs(check):
    changed = []
    for code, _lang, _extra, _name in LOCALES:
        for page in PAGES:
            path = page_file(code, page)
            if not os.path.exists(path):
                continue
            html = open(path, encoding="utf-8").read()
            match = NAV_RE.search(html)
            if not match:
                print(f"  no language list in {os.path.relpath(path, ROOT)}")
                continue
            new = html[: match.start()] + nav_html(match.group(1), code, page) + html[match.end():]
            if new != html:
                changed.append(os.path.relpath(path, ROOT))
                if not check:
                    open(path, "w", encoding="utf-8").write(new)
    return changed


def hreflang_html(page):
    lines = []
    for alt_code, lang, extra, _name in LOCALES:
        if not os.path.exists(page_file(alt_code, page)):
            continue
        for value in [lang] + extra:
            lines.append(f'<link rel="alternate" hreflang="{value}" href="{SITE}{page_path(alt_code, page)}">')
    lines.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}{page_path("en", page)}">')
    return "\n".join(lines) + "\n"


def sync_hreflang(check):
    changed = []
    for code, _lang, _extra, _name in LOCALES:
        for page in PAGES:
            path = page_file(code, page)
            if not os.path.exists(path):
                continue
            html = open(path, encoding="utf-8").read()
            match = CANONICAL_RE.search(html)
            if not match:
                print(f"  no canonical link in {os.path.relpath(path, ROOT)}")
                continue
            new = html[: match.end(1)] + hreflang_html(page) + html[match.end():]
            if new != html:
                changed.append(os.path.relpath(path, ROOT))
                if not check:
                    open(path, "w", encoding="utf-8").write(new)
    return changed


def sitemap_block(code, page, lastmod):
    lines = ["  <url>", f"    <loc>{SITE}{page_path(code, page)}</loc>", f"    <lastmod>{lastmod}</lastmod>"]
    for alt_code, lang, extra, _name in LOCALES:
        if not os.path.exists(page_file(alt_code, page)):
            continue
        for value in [lang] + extra:
            lines.append(f'    <xhtml:link rel="alternate" hreflang="{value}" href="{SITE}{page_path(alt_code, page)}"/>')
    lines.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}{page_path("en", page)}"/>')
    lines.append("  </url>")
    return "\n".join(lines) + "\n"


def sync_sitemap(check):
    path = os.path.join(ROOT, "sitemap.xml")
    xml = open(path, encoding="utf-8").read()
    blocks = URL_RE.findall(xml)
    head = xml[: xml.index(blocks[0])]
    tail = xml[xml.rindex(blocks[-1]) + len(blocks[-1]):]
    lastmods = {LOC_RE.search(b).group(1): LASTMOD_RE.search(b).group(1) for b in blocks}
    localized = {SITE + page_path(code, page) for code, *_ in LOCALES for page in PAGES}
    today = date.today().isoformat()
    out = []
    for page in PAGES:
        for code, *_ in LOCALES:
            if os.path.exists(page_file(code, page)):
                loc = SITE + page_path(code, page)
                out.append(sitemap_block(code, page, lastmods.get(loc, today)))
    # English-only pages (guides, comparisons) keep their blocks untouched, after the localized ones.
    out += [b for b in blocks if LOC_RE.search(b).group(1) not in localized]
    new = head + "".join(out) + tail
    if new != xml and not check:
        open(path, "w", encoding="utf-8").write(new)
    return new != xml, len(out)


def sync_css(check):
    path = os.path.join(ROOT, "assets", "site.css")
    css = open(path, encoding="utf-8").read()
    codes = [code for code, *_ in LOCALES if code == "en" or os.path.isdir(os.path.join(ROOT, code))]
    selector = ",".join(f'.brand[href="{page_path(code, "")}"] .logo' for code in codes)
    new = re.sub(r'(?:\.brand\[href="/[a-z-]*"\] \.logo,?)+(?=\{)', selector, css, count=1)
    if new != css and not check:
        open(path, "w", encoding="utf-8").write(new)
    return new != css


def main():
    check = "--check" in sys.argv
    navs = sync_navs(check)
    hreflangs = sync_hreflang(check)
    sitemap_changed, urls = sync_sitemap(check)
    css_changed = sync_css(check)
    verb = "would change" if check else "changed"
    print(f"language lists {verb}: {len(navs)} pages")
    print(f"hreflang tags {verb}: {len(hreflangs)} pages")
    print(f"sitemap.xml {verb}: {sitemap_changed} ({urls} URLs)")
    print(f"assets/site.css {verb}: {css_changed}")


if __name__ == "__main__":
    main()
