#!/usr/bin/env python3
"""Footer row "More apps by Sebastian Škoić: …" (his App Store developer page) linking the developer's other app sites, on every page with the footer.

    python3 scripts/apply-family-row.py

Same row as the site kit's sites (~/Coding/App Release/site-kit/frontend/family.json is the list). Idempotent:
the row sits between <!-- family:start --> and <!-- family:end --> right after the "Made by Sebs_Tech" line.
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FAMILY = json.load(open(os.path.expanduser("~/Coding/App Release/site-kit/frontend/family.json"), encoding="utf-8"))
DEV = "https://apps.apple.com/developer/sebastian-skoic/id6781458182"  # same name as in the App Store
MORE = {"en": "More apps by Sebastian Škoić", "cs": "Další aplikace od Sebastiana Škoiće", "da": "Flere apps fra Sebastian Škoić",
        "de": "Weitere Apps von Sebastian Škoić", "el": "Περισσότερες εφαρμογές από τον Sebastian Škoić", "es": "Más apps de Sebastian Škoić",
        "fi": "Sebastian Škoićin muut sovellukset", "fr": "Autres apps de Sebastian Škoić", "hu": "Sebastian Škoić további appjai",
        "it": "Altre app di Sebastian Škoić", "ja": "Sebastian Škoić のほかのアプリ", "ko": "Sebastian Škoić의 다른 앱",
        "nl": "Meer apps van Sebastian Škoić", "no": "Flere apper fra Sebastian Škoić", "pl": "Więcej aplikacji Sebastiana Škoicia",
        "pt": "Mais apps de Sebastian Škoić", "ro": "Alte aplicații de la Sebastian Škoić", "ru": "Другие приложения от Sebastian Škoić",
        "sk": "Ďalšie aplikácie od Sebastiana Škoića", "sl": "Druge aplikacije Sebastiana Škoića", "sv": "Fler appar från Sebastian Škoić",
        "tr": "Sebastian Škoić'in diğer uygulamaları", "uk": "Інші застосунки від Sebastian Škoić", "zh": "Sebastian Škoić 的更多应用",
        "zh-hant": "Sebastian Škoić 的更多應用程式"}
MADE = re.compile(r'(\n[ \t]*<p class="fmade">[^\n]*</p>)(\n[ \t]*<!-- family:start -->.*?<!-- family:end -->)?')


def row(lang):
    links = []
    for f in FAMILY:
        if f["id"] == "control-my-mac":
            continue
        href = f["url"] + (f["langPath"].format(lang=lang) if lang != "en" and lang in f["langs"] else "/")
        links.append(f'<a href="{href}">{f["name"]}</a>')
    return f'\n  <!-- family:start --><p class="fmade ffamily"><a href="{DEV}" rel="me noopener">{MORE[lang]}</a>: {" · ".join(links)}</p><!-- family:end -->'


n = 0
for d, dirs, files in os.walk(ROOT):
    dirs[:] = [x for x in dirs if x not in ("node_modules", ".git", ".vercel", "api", "db", "scripts", "tests", "assets")]
    for name in files:
        if not name.endswith(".html"):
            continue
        p = os.path.join(d, name)
        rel = os.path.relpath(p, ROOT)
        lang = rel.split(os.sep)[0] if os.sep in rel and rel.split(os.sep)[0] in MORE else "en"
        s = open(p, encoding="utf-8").read()
        new, k = MADE.subn(lambda m: m.group(1) + row(lang), s, count=1)
        if k and new != s:
            open(p, "w", encoding="utf-8").write(new)
            n += 1
print(f"{n} pages updated")
