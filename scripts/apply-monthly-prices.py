#!/usr/bin/env python3
"""One-off (25 Oct 2026): Full App is sold as Monthly, Yearly and Lifetime again; Weekly is no longer shown.

From 26 Oct 2026 the App Store sells Full App Monthly (7-day free trial) at exactly the amounts Weekly had in every
country (US $4.99, €5.99, SEK 69, ...), so only the period word changes, week to month, in each language. Yearly
and Lifetime are unchanged. Safe to re-run (nothing left to replace the second time).

    python3 scripts/apply-monthly-prices.py && python3 scripts/build-press-kit.py
"""
import glob
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (week words -> month words) per language, longest first; whole words only for alphabetic languages.
WORDS = {
    "en": [("Weekly", "Monthly"), ("weekly", "monthly"), ("week", "month")],
    "cs": [("týdenních", "měsíčních"), ("týdenní", "měsíční"), ("týdně", "měsíčně"), ("týden", "měsíc")],
    "da": [("ugentligt", "månedligt"), ("ugentlige", "månedlige"), ("ugen", "måneden"), ("uge", "måned")],
    "de": [("Wochen- oder", "Monats- oder"), ("wöchentliche", "monatliche"), ("Woche", "Monat")],
    "el": [("εβδομαδιαίων", "μηνιαίων"), ("εβδομαδιαία", "μηνιαία"), ("την εβδομάδα", "τον μήνα"), ("εβδομάδα", "μήνα")],
    "es": [("semanales", "mensuales"), ("semanal", "mensual"), ("a la semana", "al mes"), ("semana", "mes")],
    "fi": [("viikko- tai", "kuukausi- tai"), ("viikoittaisilla", "kuukausittaisilla"), ("viikossa", "kuukaudessa"), ("/viikko", "/kk")],
    "fr": [("hebdomadaires", "mensuels"), ("hebdomadaire", "mensuel"), ("semaine", "mois")],
    "hu": [("Ft/hét", "Ft/hó"), ("heti", "havi")],  # "hét" alone also means "seven" on these pages
    "it": [("settimanali", "mensili"), ("settimanale", "mensile"), ("a settimana", "al mese"), ("settimana", "mese")],
    "ja": [("/週", "/月"), ("週額", "月額"), ("毎週", "毎月")],
    "ko": [("/주", "/월"), ("주간 또는 연간", "월간 또는 연간"), ("주간, 연간", "월간, 연간"), ("주 ₩", "월 ₩")],
    "nl": [("wekelijkse", "maandelijkse"), ("week- of", "maand- of"), ("week", "maand")],
    "no": [("uke- eller", "måneds- eller"), ("uke", "måned")],
    "pl": [("tygodniowa", "miesięczna"), ("tygodniowe", "miesięczne"), ("tygodniowo", "miesięcznie"), ("tydzień", "miesiąc")],
    "pt": [("semanais", "mensais"), ("semanal", "mensal"), ("semana", "mês")],
    "ro": [("săptămânale", "lunare"), ("săptămânal", "lunar"), ("săptămână", "lună")],
    "ru": [("еженедельной", "ежемесячной"), ("еженедельные", "ежемесячные"), ("в неделю", "в месяц"), ("/неделю", "/месяц")],
    "sk": [("týždenné", "mesačné"), ("týždenne", "mesačne"), ("týždeň", "mesiac")],
    "sl": [("tedenska", "mesečna"), ("tedenskim", "mesečnim"), ("teden", "mesec")],
    "sv": [("vecko- eller", "månads- eller"), ("vecka", "månad")],
    "tr": [("haftalık", "aylık"), ("haftada", "ayda"), ("/hafta", "/ay")],
    "uk": [("щотижневою", "щомісячною"), ("щотижневої", "щомісячної"), ("тиждень", "місяць")],
    "zh": [("/周", "/月"), ("按周", "按月"), ("每周", "每月")],  # "周期" (billing period) stays
    "zh-hant": [("每週", "每月"), ("按週", "按月")],  # "週期" (billing period) stays
}
CJK = {"ja", "ko", "zh", "zh-hant"}
OFFER = ('"Full App (weekly)"', '"Full App (monthly)"')  # English structured data on every language page


def swap(text, lang):
    for old, new in WORDS[lang]:
        if lang in CJK:
            text = text.replace(old, new)
        else:
            text = re.sub((r"(?<!\w)" if old[0].isalnum() else "") + re.escape(old) + r"(?!\w)", new, text)
    return text


def main():
    files = {"en": glob.glob(os.path.join(ROOT, "*.html")) + [os.path.join(ROOT, "scripts", n) for n in ("build-press-kit.py", "build-grid-guides.py", "grid_guides_data.py")]}
    for lang in WORDS:
        if lang != "en":
            files[lang] = glob.glob(os.path.join(ROOT, lang, "*.html"))
    changed = 0
    for lang, paths in files.items():
        for path in sorted(paths):
            if path.endswith("press.html"):
                continue  # built by scripts/build-press-kit.py
            src = open(path, encoding="utf-8").read()
            new = swap(src, lang).replace(*OFFER)
            if new != src:
                open(path, "w", encoding="utf-8").write(new)
                changed += 1
    print(changed, "files changed")


if __name__ == "__main__":
    main()
