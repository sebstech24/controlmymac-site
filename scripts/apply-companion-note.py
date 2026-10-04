#!/usr/bin/env python3
"""Homepages: the big download buttons say "free Mac companion app", and a short
line under the App Store button says the iPhone and iPad app needs it.
Run from the repo root. Safe to run again."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# folder -> (button, note)
TEXT = {
    "": ("Download the free Mac companion app", "The iPhone and iPad app only works together with the free Mac companion app."),
    "de": ("Kostenlose Mac-Begleit-App herunterladen", "Die iPhone- und iPad-App funktioniert nur zusammen mit der kostenlosen Begleit-App für den Mac."),
    "es": ("Descargar la app complementaria gratuita para Mac", "La app para iPhone y iPad solo funciona junto con la app complementaria gratuita para Mac."),
    "fr": ("Télécharger l’app compagnon gratuite pour Mac", "L’app iPhone et iPad ne fonctionne qu’avec l’app compagnon gratuite pour Mac."),
    "it": ("Scarica l’app companion gratuita per Mac", "L’app per iPhone e iPad funziona solo insieme all’app companion gratuita per Mac."),
    "ja": ("無料のMac用コンパニオンアプリをダウンロード", "iPhone・iPadアプリを使うには、無料のMac用コンパニオンアプリが必要です。"),
    "ko": ("무료 Mac 동반 앱 다운로드", "iPhone과 iPad 앱은 무료 Mac 동반 앱이 있어야 작동합니다."),
    "nl": ("Download de gratis companion-app voor de Mac", "De iPhone- en iPad-app werkt alleen samen met de gratis companion-app voor de Mac."),
    "pl": ("Pobierz darmową aplikację towarzyszącą na Maca", "Aplikacja na iPhone’a i iPada działa tylko razem z darmową aplikacją towarzyszącą na Maca."),
    "pt": ("Baixar o app complementar grátis para Mac", "O app para iPhone e iPad só funciona junto com o app complementar gratuito para Mac."),
    "ru": ("Скачать бесплатное приложение-компаньон для Mac", "Приложение для iPhone и iPad работает только вместе с бесплатным приложением-компаньоном для Mac."),
    "sl": ("Prenesite brezplačno spremljevalno aplikacijo za Mac", "Aplikacija za iPhone in iPad deluje samo skupaj z brezplačno spremljevalno aplikacijo za Mac."),
    "tr": ("Ücretsiz Mac yardımcı uygulamasını indir", "iPhone ve iPad uygulaması yalnızca ücretsiz Mac yardımcı uygulamasıyla birlikte çalışır."),
    "uk": ("Завантажити безкоштовну програму-компаньйон для Mac", "Програма для iPhone та iPad працює лише разом із безкоштовною програмою-компаньйоном для Mac."),
    "zh": ("免费下载 Mac 配套应用", "iPhone 和 iPad 应用需要和免费的 Mac 配套应用一起使用。"),
    "zh-hant": ("免費下載 Mac 版輔助 App", "iPhone 與 iPad App 需要配合免費的 Mac 輔助 App 才能使用。"),
}
for folder, (button, note) in TEXT.items():
    path = ROOT / folder / "index.html" if folder else ROOT / "index.html"
    src = path.read_text(encoding="utf-8")
    src, n = re.subn(r'(<a class="btn btn-primary" data-dl-cta href="[^"]*">)[^<]*(</a>)', lambda m: m.group(1) + button + m.group(2), src)
    assert n == 3, (folder, n)
    src = re.sub(r'\n    <p class="pair-note">.*?</p>', "", src)
    src, n = re.subn(r'(    <div class="hero-store">.*?\n    </div>)', lambda m: m.group(1) + f'\n    <p class="pair-note">{note}</p>', src, flags=re.S)
    assert n == 1, (folder, n)
    path.write_text(src, encoding="utf-8")
    print("ok", folder or "en")
