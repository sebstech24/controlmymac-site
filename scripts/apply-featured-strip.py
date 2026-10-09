#!/usr/bin/env python3
"""Puts the "Featured on" strip under the top section of every homepage (English and each language folder).

    python3 scripts/apply-featured-strip.py

The outlets live in COVERAGE in scripts/build-press-kit.py (newest first), so the homepages and the press page
always show the same list. After adding an outlet there, run build-press-kit.py and then this script.
"""
import importlib.util, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("press", os.path.join(ROOT, "scripts", "build-press-kit.py"))
press = importlib.util.module_from_spec(spec)
spec.loader.exec_module(press)

LABELS = {
    "": "Featured on", "cs": "Píšou o nás", "da": "Omtalt i", "de": "Bekannt aus", "el": "Έγραψαν για εμάς",
    "es": "Hablan de nosotros", "fi": "Meistä kirjoitettu", "fr": "Ils en parlent", "hu": "Rólunk írták",
    "it": "Parlano di noi", "ja": "掲載メディア", "ko": "소개된 곳", "nl": "Bekend van", "no": "Omtalt i",
    "pl": "Piszą o nas", "pt": "Falam de nós", "ro": "Au scris despre noi", "ru": "О нас пишут",
    "sk": "Píšu o nás", "sl": "O nas pišejo", "sv": "Omnämnd i", "tr": "Basında biz", "uk": "Про нас пишуть",
    "zh": "媒体报道", "zh-hant": "媒體報導",
}
START, END = "  <!-- featured:start -->", "  <!-- featured:end -->"


def main():
    for code, label in LABELS.items():
        path = os.path.join(ROOT, code, "index.html")
        if not os.path.isfile(path):
            print("missing", path); continue
        page = open(path, encoding="utf-8").read()
        block = f"{START}\n{press.featured_strip(label)}\n{END}\n"
        if START in page:
            new = re.sub(re.escape(START) + r".*?" + re.escape(END) + r"\n", lambda m: block, page, flags=re.S)
        else:
            hero = page.index('<section class="hero wrap')
            end = page.index("</section>\n", hero) + len("</section>\n")
            new = page[:end] + "\n" + block + page[end:]
        if new != page:
            open(path, "w", encoding="utf-8").write(new)
            print("updated", os.path.relpath(path, ROOT))


if __name__ == "__main__":
    main()
