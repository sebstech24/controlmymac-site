#!/usr/bin/env python3
"""One-off (9 Oct 2026), safe to re-run: on every homepage

  * puts the two download buttons on the left with their notes on the right (stacked on phones), and
  * replaces the price cards with one short block: free to start, Full App monthly or lifetime, prices vary by
    country, plus the App Store button. No amounts on the homepage any more.

    python3 scripts/apply-hero-pricing.py && python3 scripts/apply-featured-strip.py
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRICING = {  # folder: (heading, line)
    "": ("Free to start", "Full App is a monthly subscription or a one-time lifetime purchase. Prices vary by country, and the App Store shows yours before you buy."),
    "cs": ("Začněte zdarma", "Full App je k dispozici jako měsíční předplatné nebo jednorázový doživotní nákup. Ceny se liší podle země a App Store vám tu vaši ukáže před nákupem."),
    "da": ("Gratis at starte", "Full App fås som månedligt abonnement eller som et engangskøb for livstid. Priserne varierer fra land til land, og App Store viser din pris, før du køber."),
    "de": ("Kostenlos starten", "Full App gibt es als Monatsabo oder als einmaligen Kauf auf Lebenszeit. Die Preise unterscheiden sich je nach Land, und der App Store zeigt dir deinen Preis vor dem Kauf."),
    "el": ("Ξεκινήστε δωρεάν", "Το Full App διατίθεται ως μηνιαία συνδρομή ή ως εφάπαξ αγορά για πάντα. Οι τιμές διαφέρουν ανά χώρα και το App Store σάς δείχνει τη δική σας πριν αγοράσετε."),
    "es": ("Empieza gratis", "Full App está disponible como suscripción mensual o como compra única de por vida. Los precios varían según el país, y el App Store te muestra el tuyo antes de comprar."),
    "fi": ("Aloita ilmaiseksi", "Full App on saatavilla kuukausitilauksena tai elinikäisenä kertaostoksena. Hinnat vaihtelevat maittain, ja App Store näyttää oman hintasi ennen ostoa."),
    "fr": ("Gratuit pour commencer", "Full App est proposé en abonnement mensuel ou en achat unique à vie. Les prix varient selon les pays, et l’App Store affiche le vôtre avant l’achat."),
    "hu": ("Kezdd ingyen", "A Full App havi előfizetésként vagy egyszeri, örökre szóló vásárlásként érhető el. Az árak országonként eltérnek, és az App Store vásárlás előtt megmutatja a tiédet."),
    "it": ("Inizia gratis", "Full App è disponibile come abbonamento mensile o come acquisto unico a vita. I prezzi variano in base al paese e l’App Store mostra il tuo prima dell’acquisto."),
    "ja": ("無料で始められます", "Full Appは月額サブスクリプション、または買い切りで利用できます。価格は国によって異なり、購入前にApp Storeでお住まいの国の価格が表示されます。"),
    "ko": ("무료로 시작하세요", "Full App은 월간 구독 또는 평생 이용 일회성 구매로 이용할 수 있습니다. 가격은 국가마다 다르며, 구매 전에 App Store에서 해당 국가의 가격을 확인할 수 있습니다."),
    "nl": ("Gratis beginnen", "Full App is er als maandabonnement of als eenmalige aankoop voor altijd. Prijzen verschillen per land, en de App Store toont jouw prijs voordat je koopt."),
    "no": ("Gratis å starte", "Full App fås som månedsabonnement eller som et engangskjøp for alltid. Prisene varierer fra land til land, og App Store viser prisen din før du kjøper."),
    "pl": ("Zacznij za darmo", "Full App jest dostępna jako miesięczna subskrypcja lub jednorazowy zakup na zawsze. Ceny różnią się w zależności od kraju, a App Store pokaże Twoją cenę przed zakupem."),
    "pt": ("Comece grátis", "O Full App está disponível como assinatura mensal ou compra única vitalícia. Os preços variam conforme o país, e a App Store mostra o seu antes da compra."),
    "ro": ("Începe gratuit", "Full App este disponibil ca abonament lunar sau ca achiziție unică pe viață. Prețurile diferă în funcție de țară, iar App Store îți arată prețul tău înainte să cumperi."),
    "ru": ("Начните бесплатно", "Full App доступен по ежемесячной подписке или как разовая покупка навсегда. Цены зависят от страны, и App Store покажет вашу цену перед покупкой."),
    "sk": ("Začnite zadarmo", "Full App je dostupná ako mesačné predplatné alebo jednorazový doživotný nákup. Ceny sa líšia podľa krajiny a App Store vám tú vašu ukáže pred nákupom."),
    "sl": ("Začni brezplačno", "Full App je na voljo kot mesečna naročnina ali enkraten doživljenjski nakup. Cene se razlikujejo glede na državo, App Store pa ti tvojo pokaže pred nakupom."),
    "sv": ("Gratis att börja", "Full App finns som månadsabonnemang eller som ett engångsköp för alltid. Priserna varierar mellan länder, och App Store visar ditt pris innan du köper."),
    "tr": ("Ücretsiz başlayın", "Full App, aylık abonelik veya tek seferlik ömür boyu satın alma olarak sunulur. Fiyatlar ülkeye göre değişir ve App Store satın almadan önce sizin fiyatınızı gösterir."),
    "uk": ("Почніть безкоштовно", "Full App доступний за щомісячною підпискою або як разова покупка назавжди. Ціни залежать від країни, а App Store покаже вашу ціну перед покупкою."),
    "zh": ("免费开始使用", "Full App 提供按月订阅或一次性买断两种方式。价格因国家或地区而异，购买前 App Store 会显示你所在地区的价格。"),
    "zh-hant": ("免費開始使用", "Full App 提供按月訂閱或一次買斷兩種方式。價格因國家或地區而異，購買前 App Store 會顯示你所在地區的價格。"),
}


def hero(page):
    if 'class="hero-get"' in page:
        return page
    m = re.search(r'[ \t]*<div class="cta">.*?</div>\n(\s*<p class="cta-note"[^>]*>.*?</p>)\n\s*'
                  r'(<div class="hero-store">.*?</div>)\n(\s*<p class="pair-note">.*?</p>)\n', page, flags=re.S)
    cta = re.search(r'<div class="cta">.*?</div>', m.group(0), flags=re.S).group(0)
    new = (f'    <div class="hero-get">\n      <div class="hg-row">\n        {cta}\n'
           f'        <div class="hg-text">{m.group(1).strip()}</div>\n      </div>\n'
           f'      <div class="hg-row">\n        {m.group(2)}\n'
           f'        <div class="hg-text">{m.group(3).strip()}</div>\n      </div>\n    </div>\n')
    return page[:m.start()] + new + page[m.end():]


def pricing(page, heading, line):
    start = page.index('<section id="pricing">')
    end = page.index("</section>", start)
    sec = page[start:end]
    if 'class="pricing"' not in sec:
        return page
    store = re.search(r'<a class="btn btn-appstore".*?</a>', page, flags=re.S).group(0)
    sec = re.sub(r'<h2 class="h2">.*?</h2>', f'<h2 class="h2">{heading}</h2>', sec, count=1, flags=re.S)
    a = sec.index('<div class="pricing">')
    b = sec.index("</p>", sec.index('<p class="price-note">')) + 4
    sec = sec[:a] + f'<p class="price-short">{line}</p>\n      <div class="cta price-cta">{store}</div>' + sec[b:]
    return page[:start] + sec + page[end:]


def main():
    for code, (heading, line) in PRICING.items():
        path = os.path.join(ROOT, code, "index.html")
        page = open(path, encoding="utf-8").read()
        new = pricing(hero(page), heading, line)
        if new != page:
            open(path, "w", encoding="utf-8").write(new)
            print("updated", os.path.relpath(path, ROOT))


if __name__ == "__main__":
    main()
