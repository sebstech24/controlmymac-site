#!/usr/bin/env python3
"""One-off (22 Oct 2026), safe to re-run: Apple's official App Store badge replaces the site's own App Store button.

Apple allows only its own badge artwork, one badge per page, and asks for a credit line for Apple and the Apple logo.
  * Pages with the download area (homepages): the badge is already there (scripts/store-buttons.py), so the second
    App Store button in the pricing section becomes a plain "Open in the App Store" button (the words of each
    language's get-iphone.html).
  * Every other page: its one App Store button becomes the badge in the page's language, and the footer gets the
    Apple credit line from scripts/store-buttons.json.

    python3 scripts/apply-app-store-badge.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COPY = json.load(open(os.path.join(ROOT, "scripts", "store-buttons.json"), encoding="utf-8"))["copy"]
LANGS = set(COPY) - {"en"}
OLD = re.compile(r'<a class="btn btn-appstore" href="(https://apps\.apple\.com/[^"]*)" aria-label="([^"]*)">.*?</a>', re.S)
TM_START, TM_END = "<!-- tm:start -->", "<!-- tm:end -->"
BADGE_H = 44


def badge_width(lang):
    head = open(os.path.join(ROOT, "assets", "badges", "app-store", lang + ".svg"), encoding="utf-8").read(3000)
    _, _, w, h = (float(n) for n in re.search(r'viewBox="([\d.\s-]+)"', head).group(1).split())
    return round(BADGE_H * w / h)


def main():
    changed = []
    for dirpath, _, files in os.walk(ROOT):
        rel_dir = os.path.relpath(dirpath, ROOT)
        lang = "en" if rel_dir == "." else rel_dir
        if lang != "en" and lang not in LANGS:
            continue
        for name in sorted(f for f in files if f.endswith(".html")):
            path = os.path.join(dirpath, name)
            page = open(path, encoding="utf-8").read()
            if not OLD.search(page):
                continue
            if "<!-- get:start" in page:  # the download area already shows the badge
                open_words = re.search(r'btn btn-primary" href="https://apps\.apple\.com/[^"]*">([^<]*)</a>',
                                       open(os.path.join(dirpath, "get-iphone.html"), encoding="utf-8").read()).group(1)
                new = OLD.sub(lambda m: f'<a class="btn btn-primary" href="{m.group(1)}">{open_words}</a>', page)
            else:
                width = badge_width(lang)
                new = OLD.sub(lambda m: (f'<a class="store-badge" href="{m.group(1)}" aria-label="{m.group(2)}">'
                                         f'<img src="/assets/badges/app-store/{lang}.svg" alt="" width="{width}" '
                                         f'height="{BADGE_H}"></a>'), page)
                if TM_START not in new:
                    tail = "</div>\n</footer>"
                    if new.count(tail) != 1:
                        sys.exit(f"{path}: the footer changed shape")
                    credit = COPY[lang]["tm_apple"].replace("&", "&amp;")
                    new = new.replace(tail, f'  {TM_START}<p class="fmade ftm">{credit}</p>{TM_END}\n' + tail)
            assert len(OLD.findall(new)) == 0, path
            open(path, "w", encoding="utf-8").write(new)
            changed.append(os.path.relpath(path, ROOT))
    print(len(changed), "pages changed")


if __name__ == "__main__":
    main()
