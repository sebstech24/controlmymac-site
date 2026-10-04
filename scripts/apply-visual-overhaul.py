#!/usr/bin/env python3
"""Rebuild the picture sections of the 16 homepages (visual overhaul, Oct 2026).

Reads each homepage, keeps every translated sentence, and swaps in:
  - the hero picture (iPhone Grid screenshot next to a drawn Mac screen),
  - the side-scrolling feature rail (replaces the 8 cards and the old
    "See it on your iPhone" row, whose screenshots now sit in the slides),
  - a picture on each "Made for anyone" card and each pairing step.

Run from the repo root:  python3 scripts/apply-visual-overhaul.py
Safe to run again: a page that already has the rail is left alone.
"""
import html
import random
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# folder -> (previous, next) button labels
LOCALES = {
    "": ("Previous", "Next"),
    "de": ("Zurück", "Weiter"),
    "es": ("Anterior", "Siguiente"),
    "fr": ("Précédent", "Suivant"),
    "it": ("Precedente", "Successivo"),
    "ja": ("前へ", "次へ"),
    "ko": ("이전", "다음"),
    "nl": ("Vorige", "Volgende"),
    "pl": ("Wstecz", "Dalej"),
    "pt": ("Anterior", "Próximo"),
    "ru": ("Назад", "Далее"),
    "sl": ("Nazaj", "Naprej"),
    "tr": ("Önceki", "Sonraki"),
    "uk": ("Назад", "Далі"),
    "zh": ("上一个", "下一个"),
    "zh-hant": ("上一個", "下一個"),
}

PHONE_W, PHONE_H = 480, 1042
PAD_W, PAD_H = 1000, 750

MENU = '<div class="mac-menu"><i></i><i></i><i></i><i></i><i></i></div>'
DOCK = '<div class="mac-dock"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'
BAR = '<div class="mw-bar"></div>'
PICKS = '<i class="hero-tile"></i><div class="tiles"><i></i><i></i><i></i><i></i></div><i class="mc"></i>'
CHEVRON_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>'
CHEVRON_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'


def qr_svg():
    """A QR-looking pattern for the pairing pictures. Decorative: it does not scan."""
    n = 21
    rng = random.Random(24)
    on = [[rng.random() < 0.46 for _ in range(n)] for _ in range(n)]
    for oy, ox in ((0, 0), (0, n - 7), (n - 7, 0)):
        for y in range(-1, 8):
            for x in range(-1, 8):
                yy, xx = oy + y, ox + x
                if 0 <= yy < n and 0 <= xx < n:
                    ring = y in (0, 6) or x in (0, 6)
                    core = 2 <= y <= 4 and 2 <= x <= 4
                    on[yy][xx] = 0 <= y <= 6 and 0 <= x <= 6 and (ring or core)
    path = "".join(f"M{x} {y}h1v1h-1z" for y in range(n) for x in range(n) if on[y][x])
    return f'<svg viewBox="0 0 {n} {n}" aria-hidden="true"><path d="{path}"/></svg>'


QR = qr_svg()


def mac(scene, inner):
    return f'<div class="mac"><div class="mac-screen {scene}">{MENU}{inner}{DOCK}</div></div>'


def window(body, extra=""):
    return f'<div class="mw{extra}">{BAR}<div class="mw-body">{body}</div></div>'


def shot(folder, name, alt="", cls=""):
    c = f' class="{cls}"' if cls else ""
    return (f'<img{c} src="/assets/shots/v2/{folder}/{name}.webp" alt="{alt}" loading="lazy" decoding="async" '
            f'width="{PHONE_W}" height="{PHONE_H}">')


def phone(folder, name, alt="", extra=""):
    return f'<div class="phone">{shot(folder, name, alt)}{extra}</div>'


EDIT_BODY = ('<i class="view"></i><div class="bins"><i></i><i></i><i></i><i></i></div>'
             '<div class="tl"><span><i></i><i></i><i></i></span><span><i></i><i></i></span><span><i></i><i></i></span></div>'
             '<i class="head"></i><i class="cut"></i>')
CALL_BODY = '<i></i><i></i><i></i><i></i><div class="bar"><i></i><i></i><i></i><i></i></div>'
SIDE = '<div class="side"><i></i><i></i><i></i></div>'


def text_of(fragment):
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def attr(text):
    return html.escape(text, quote=True)


def drop_last_sentence(lead):
    """The lead's last sentence told people to hover a card; the cards are gone."""
    ends = [m.end() for m in re.finditer(r"[.!?](?=\s)|[。！？]", lead.rstrip())]
    body = lead.rstrip()
    ends = [e for e in ends if e < len(body)]
    if not ends:
        raise SystemExit("lead has one sentence only: " + lead)
    return body[:ends[-1]]


def build(path, folder, labels):
    src = path.read_text(encoding="utf-8")
    if "data-rail" in src:
        return False
    shots = folder or "en"

    # ---------- hero picture ----------
    stage = re.search(r'    <div class="stage" aria-hidden="true">.*?\n    </div>\n(?=  </section>)', src, re.S)
    assert stage, f"{path}: hero stage not found"
    hero = ""
    src = src[:stage.start()] + hero + src[stage.end():]

    # ---------- features ----------
    feat = re.search(r'  <section id="features">.*?  </section>\n', src, re.S)
    assert feat, f"{path}: features not found"
    block = feat.group(0)
    h2 = re.search(r'<h2 class="h2">(.*?)</h2>', block).group(1)
    lead = drop_last_sentence(re.search(r'<p class="lead">(.*?)</p>', block).group(1))
    cards = []
    for art in re.findall(r"<article.*?</article>", block, re.S):
        tag = re.search(r'<span class="tag".*?</span>', art, re.S)
        cards.append({
            "tag": tag.group(0) if tag else "",
            "ico": re.search(r'<div class="ico">.*?</div>', art, re.S).group(0),
            "svg": re.search(r"<svg.*?</svg>", art, re.S).group(0),
            "h3": re.search(r"<h3>(.*?)</h3>", art, re.S).group(1),
            "p": re.search(r"<p>(.*?)</p>", art, re.S).group(1),
            "demo": [text_of(t) for t in re.findall(r'<span class="d-text">(.*?)</span>', art)],
        })
    assert len(cards) == 8, f"{path}: expected 8 feature cards, got {len(cards)}"
    trackpad, composer, live, grid, launcher, windows, keys, dark = cards

    old = re.search(r'  <section id="screenshots">.*?  </section>\n\n', src, re.S)
    assert old, f"{path}: screenshots section not found"
    alts = re.findall(r'alt="(.*?)"', old.group(0))
    assert len(alts) == 3, f"{path}: expected 3 screenshot descriptions"
    alt_trackpad, alt_launcher, alt_keyboard = alts

    def copy(*items):
        out = []
        for index, card in enumerate(items):
            piece = (card["ico"] if index == 0 else "") + card["tag"] + f'<h3>{card["h3"]}</h3><p>{card["p"]}</p>'
            out.append(piece if index == 0 else f'<div class="slide-more">{piece}</div>')
        return '<div class="slide-copy">' + "".join(out) + "</div>"

    def name(card):
        return attr(text_of(card["h3"]))

    sent = html.escape(composer["demo"][0])
    typed = html.escape(live["demo"][0])
    slides = [
        (grid, "#8b5cf6", copy(grid),
         '<div class="duo">'
         + mac("sc-switch", window(CALL_BODY, " one sc-call") + window(EDIT_BODY, " two sc-edit")
               + '<i class="mc"></i><i class="clk one"></i><i class="clk two"></i>')
         + f'<div class="phone">{shot(shots, "hero-zoom", name(grid))}{shot(shots, "hero-premiere", "", "alt")}</div></div>'),
        (trackpad, "#4f8cff", copy(trackpad),
         '<div class="duo">' + mac("sc-picks", window(PICKS))
         + phone(shots, "trackpad", attr(html.unescape(alt_trackpad)), '<i class="tap" style="--x:50%;--y:44%;--dur:6s"></i>') + "</div>"),
        (composer, "#2f6cf0", copy(composer),
         '<div class="duo">' + mac("sc-chat", window(SIDE + f'<div class="thread"><i></i><i></i><span class="sent">{sent}</span></div>'))
         + phone(shots, "keyboard-draft", attr(html.unescape(alt_keyboard))) + "</div>"),
        (live, "#f2a93b", copy(live),
         '<div class="duo">' + mac("sc-note", window(SIDE + f'<div class="page"><div class="typed">{typed}<i class="cover"></i></div><i></i><i></i><i></i></div>'))
         + phone(shots, "keyboard-live", name(live)) + "</div>"),
        (keys, "#ec4899", copy(keys),
         '<div class="duo">' + mac("sc-note sc-keys", window(SIDE + '<div class="page"><i></i><i></i><i></i></div>')
                                   + '<i class="marquee"></i><div class="hud"><b>⇧</b><b>⌘</b><b>4</b></div>')
         + phone(shots, "shortcuts", name(keys)) + "</div>"),
        (launcher, "#35b55f", copy(launcher, windows),
         '<div class="duo">' + mac("sc-launch", window("") + window("", " two"))
         + phone(shots, "launcher", attr(html.unescape(alt_launcher)), '<i class="tap" style="--x:50%;--y:30%;--dur:8s"></i>') + "</div>"),
        (dark, "#7c5cff", copy(dark),
         '<div class="duo duo-solo">'
         f'<div class="pad"><img src="/assets/shots/v2/{shots}/ipad-trackpad.webp" alt="" loading="lazy" decoding="async" width="{PAD_W}" height="{PAD_H}"></div>'
         + phone(shots, "look", name(dark)) + "</div>"),
    ]
    dots = "".join(
        f'<button class="rail-dot" type="button" data-rail-to="{i}" aria-label="{name(card)}" title="{name(card)}">{card["svg"]}</button>'
        for i, (card, _, _, _) in enumerate(slides))
    body = "\n".join(
        f'          <article class="slide" style="--glow:{glow}">\n            {text}\n            <div class="slide-art">{art}</div>\n          </article>'
        for _, glow, text, art in slides)
    rail = (
        '  <section id="features">\n'
        '    <div class="wrap">\n'
        f'      <h2 class="h2">{h2}</h2>\n'
        f'      <p class="lead">{lead}</p>\n'
        '    </div>\n'
        '    <div class="rail" data-rail>\n'
        '      <div class="rail-nav">\n'
        f'        <button class="rail-arrow" type="button" data-rail-prev aria-label="{attr(labels[0])}">{CHEVRON_L}</button>\n'
        f'        <div class="rail-dots">{dots}</div>\n'
        f'        <button class="rail-arrow" type="button" data-rail-next aria-label="{attr(labels[1])}">{CHEVRON_R}</button>\n'
        '      </div>\n'
        f'      <div class="rail-track" tabindex="0" role="group" aria-label="{attr(text_of(h2))}">\n'
        f'{body}\n'
        '      </div>\n'
        '    </div>\n'
        '  </section>\n'
    )
    src = src.replace(block, rail)
    src = src.replace(old.group(0), "")

    # ---------- "Made for anyone" pictures ----------
    pictures = iter(["one-hand", "couch", "present", "pro"])

    def use(match):
        return (match.group(0) + f'\n          <img class="use-img" src="/assets/people/{next(pictures)}.svg" alt="" '
                'loading="lazy" decoding="async" width="640" height="400">')

    src, count = re.subn(r'<a class="card use" href="[^"]*">', use, src)
    assert count == 4, f"{path}: expected 4 audience cards, got {count}"

    # ---------- pairing steps pictures ----------
    arts = iter([
        '<div class="step-art" aria-hidden="true"><div class="mac"><div class="mac-screen">'
        '<div class="mac-menu"><i></i><i></i><i></i><b></b><i></i></div>'
        f'<div class="pop"><span class="qr">{QR}</span><i></i></div>{DOCK}</div></div></div>',
        '<div class="step-art" aria-hidden="true"><div class="phone"><div class="app-home">'
        '<img src="/assets/control-my-mac-icon.png" alt="" loading="lazy" decoding="async" width="512" height="512"><i></i></div></div></div>',
        '<div class="step-art" aria-hidden="true"><div class="phone"><div class="cam">'
        f'<span class="qr">{QR}</span><i class="frame"></i><i class="beam"></i></div></div></div>',
    ])
    src, count = re.subn(r'<div class="step">\n', lambda m: m.group(0) + "          " + next(arts) + "\n", src)
    assert count == 3, f"{path}: expected 3 steps, got {count}"

    path.write_text(src, encoding="utf-8")
    return True


def main():
    changed = 0
    for folder, labels in LOCALES.items():
        path = ROOT / folder / "index.html" if folder else ROOT / "index.html"
        if build(path, folder, labels):
            changed += 1
            print("rebuilt", path.relative_to(ROOT))
        else:
            print("already done", path.relative_to(ROOT))
    print(changed, "pages changed")


if __name__ == "__main__":
    sys.exit(main())
