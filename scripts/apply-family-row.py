#!/usr/bin/env python3
"""Footer row "More apps from Sebs_Tech: …" linking the developer's other app sites, on every page with the footer.

    python3 scripts/apply-family-row.py

Same row as the site kit's sites (~/Coding/App Release/site-kit/frontend/family.json is the list). Idempotent:
the row sits between <!-- family:start --> and <!-- family:end --> right after the "Made by Sebs_Tech" line.
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FAMILY = json.load(open(os.path.expanduser("~/Coding/App Release/site-kit/frontend/family.json"), encoding="utf-8"))
MORE = {"en": "More apps from Sebs_Tech:", "cs": "Další aplikace od Sebs_Tech:", "da": "Flere apps fra Sebs_Tech:",
        "de": "Weitere Apps von Sebs_Tech:", "el": "Περισσότερες εφαρμογές από Sebs_Tech:", "es": "Más apps de Sebs_Tech:",
        "fi": "Muita Sebs_Techin sovelluksia:", "fr": "Autres apps de Sebs_Tech :", "hu": "Sebs_Tech további alkalmazásai:",
        "it": "Altre app di Sebs_Tech:", "ja": "Sebs_Tech のほかのアプリ：", "ko": "Sebs_Tech의 다른 앱:",
        "nl": "Meer apps van Sebs_Tech:", "no": "Flere apper fra Sebs_Tech:", "pl": "Więcej aplikacji od Sebs_Tech:",
        "pt": "Mais apps da Sebs_Tech:", "ro": "Alte aplicații de la Sebs_Tech:", "ru": "Другие приложения Sebs_Tech:",
        "sk": "Ďalšie aplikácie od Sebs_Tech:", "sl": "Druge aplikacije Sebs_Tech:", "sv": "Fler appar från Sebs_Tech:",
        "tr": "Sebs_Tech'in diğer uygulamaları:", "uk": "Інші застосунки Sebs_Tech:", "zh": "Sebs_Tech 的更多应用：",
        "zh-hant": "Sebs_Tech 的更多應用程式："}
MADE = re.compile(r'(\n[ \t]*<p class="fmade">[^\n]*</p>)(\n[ \t]*<!-- family:start -->.*?<!-- family:end -->)?')


def row(lang):
    links = []
    for f in FAMILY:
        if f["id"] == "control-my-mac":
            continue
        href = f["url"] + (f["langPath"].format(lang=lang) if lang != "en" and lang in f["langs"] else "/")
        links.append(f'<a href="{href}">{f["name"]}</a>')
    return f'\n  <!-- family:start --><p class="fmade ffamily">{MORE[lang]} {" · ".join(links)}</p><!-- family:end -->'


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
