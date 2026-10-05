import { escapeHtml, normalizeLocale } from "./security.js";

export const APP_STORE_APP_ID = "6781458180";

// The sender named in every email's footer, next to the site and its privacy page.
const SENDER_NAME = "Sebastian Apps";
// The sender's postal address, shown after the name; COPY[locale].country names the country.
const SENDER_STREET_CITY = "Šturmova ulica 7A, Ljubljana";
const SITE_URL = "https://controlmymac.com";

/**
 * Button and label names exactly as the Control My Mac iPhone/iPad app shows them in 1.2 and
 * 1.2.1 (Settings, the Mode section, its Unlock button, and "Have a promo code?" at the bottom
 * of the paywall). Source: cmm-custom-grid/native/MacRemoteControlPhone/MacRemoteControlPhone/
 * Localizable.xcstrings (pt = pt-BR, zh = zh-Hans).
 */
const APP_LABELS = {
  en: { settings: "Settings", mode: "Mode", unlock: "Unlock", promo: "Have a promo code?" },
  de: { settings: "Einstellungen", mode: "Modus", unlock: "Freischalten", promo: "Hast du einen Aktionscode?" },
  es: { settings: "Ajustes", mode: "Modo", unlock: "Desbloquear", promo: "¿Tienes un código promocional?" },
  fr: { settings: "Réglages", mode: "Mode", unlock: "Débloquer", promo: "Vous avez un code promotionnel ?" },
  it: { settings: "Impostazioni", mode: "Modalità", unlock: "Sblocca", promo: "Hai un codice promozionale?" },
  ja: { settings: "設定", mode: "モード", unlock: "ロック解除", promo: "プロモコードをお持ちですか？" },
  ko: { settings: "설정", mode: "모드", unlock: "잠금 해제", promo: "프로모션 코드가 있나요?" },
  nl: { settings: "Instellingen", mode: "Modus", unlock: "Ontgrendelen", promo: "Heb je een promotiecode?" },
  pl: { settings: "Ustawienia", mode: "Tryb", unlock: "Odblokuj", promo: "Masz kod promocyjny?" },
  pt: { settings: "Ajustes", mode: "Modo", unlock: "Desbloquear", promo: "Tem um código promocional?" },
  ru: { settings: "Настройки", mode: "Режим", unlock: "Разблокировать", promo: "Есть промокод?" },
  tr: { settings: "Ayarlar", mode: "Mod", unlock: "Aç", promo: "Promosyon kodunuz mu var?" },
  zh: { settings: "设置", mode: "模式", unlock: "解锁", promo: "有促销代码？" },
  "zh-hant": { settings: "設定", mode: "模式", unlock: "解鎖", promo: "有優惠代碼嗎？" },
  uk: { settings: "Параметри", mode: "Режим", unlock: "Розблокувати", promo: "Маєте промокод?" },
  sl: { settings: "Nastavitve", mode: "Način", unlock: "Odkleni", promo: "Imate promocijsko kodo?" },
  cs: { settings: "Nastavení", mode: "Režim", unlock: "Odemknout", promo: "Máte promo kód?" },
  sk: { settings: "Nastavenia", mode: "Režim", unlock: "Odomknúť", promo: "Máte promo kód?" },
  sv: { settings: "Inställningar", mode: "Läge", unlock: "Lås upp", promo: "Har du en kampanjkod?" },
  no: { settings: "Innstillinger", mode: "Modus", unlock: "Lås opp", promo: "Har du en kampanjekode?" },
  da: { settings: "Indstillinger", mode: "Tilstand", unlock: "Lås op", promo: "Har du en tilbudskode?" },
  fi: { settings: "Asetukset", mode: "Tila", unlock: "Avaa", promo: "Onko sinulla tarjouskoodi?" },
  hu: { settings: "Beállítások", mode: "Mód", unlock: "Feloldás", promo: "Van promóciós kódja?" },
  ro: { settings: "Configurări", mode: "Mod", unlock: "Deblocați", promo: "Aveți un cod promoțional?" },
  el: { settings: "Ρυθμίσεις", mode: "Λειτουργία", unlock: "Ξεκλείδωμα", promo: "Έχετε κωδικό προσφοράς;" },
};

/**
 * Apple's own name for the App Store account-menu item, as Apple's support article
 * "How to redeem your Apple Gift Card" (support.apple.com/118242, iPhone) words it in each
 * language, September 2026. Apple has already renamed it to the short "Redeem Code" form in
 * some languages; the others still show the longer "gift card or code" name.
 */
const APPLE_REDEEM_LABEL = {
  en: "Redeem Code",
  de: "Code einlösen",
  es: "Canjear código o tarjeta regalo",
  fr: "Utiliser un code",
  it: "Usa carta regalo o codice promozionale",
  ja: "コードを使う",
  ko: "코드 교환",
  nl: "Wissel cadeaubon of code in",
  pl: "Zrealizuj kartę upominkową lub kod",
  pt: "Resgatar Código",
  ru: "Погасить подарочную карту или код",
  tr: "Hediye Kartı veya Kod Kullan",
  zh: "兑换代码",
  "zh-hant": "兌換禮品卡或代碼",
  uk: "Активувати подарункову карту чи код",
  sl: "Redeem Code",
  cs: "Uplatnit poukázku nebo kód",
  sk: "Uplatniť darčekovú kartu alebo kód",
  sv: "Lös in presentkort eller kod",
  no: "Løs inn gavekort eller kode",
  da: "Indløs gavekort eller kode",
  fi: "Lunasta lahjakortti tai koodi",
  hu: "Ajándékkártya vagy kód beváltása",
  ro: "Valorificați un card cadou sau un cod",
  el: "Εξαργύρωση δωροκάρτας ή κωδικού",
};

// How each language quotes an on-screen label.
const QUOTES = {
  en: ["“", "”"], de: ["„", "“"], es: ["«", "»"], fr: ["«\u00a0", "\u00a0»"], it: ["«", "»"],
  ja: ["「", "」"], ko: ["‘", "’"], nl: ["‘", "’"], pl: ["„", "”"], pt: ["“", "”"],
  ru: ["«", "»"], tr: ["“", "”"], zh: ["“", "”"], "zh-hant": ["「", "」"], uk: ["«", "»"], sl: ["»", "«"], cs: ["„", "“"], sk: ["„", "“"], sv: ["”", "”"], no: ["«", "»"], da: ["»", "«"], fi: ["”", "”"], hu: ["„", "”"], ro: ["„", "”"], el: ["«", "»"],
};

// Punctuation between a label and its value, and between two sentences, in the plain-text version.
const COLON = { fr: "\u00a0: ", ja: "：", zh: "：", "zh-hant": "：" };
const SENTENCE_GAP = { ja: "", zh: "", "zh-hant": "" };

// {settings}, {mode}, {unlock} and {promo} become the app's labels, {redeem} Apple's.
const COPY = {
  en: {
    subject: "Your free month of Control My Mac",
    preview: "Your personal code, plus two quick ways to redeem it.",
    heading: "Your free month is ready",
    intro: "Thanks for joining Sebastian Apps emails. Here is your personal code for a free month of Full App in Control My Mac.",
    codeLabel: "Your code",
    button: "Redeem in the App Store",
    appTitle: "Or redeem in the app",
    steps: ["Open Control My Mac and tap {settings}.", "In the {mode} section, tap {unlock}.", "At the bottom, tap {promo} and enter your code."],
    store: "Or: App Store → your account picture → {redeem}",
    expires: "Redeem it before {date}.",
    noRenew: "The free month does not renew automatically, so you will not be charged.",
    renews: "After the free month, the subscription renews at the standard price unless you cancel it.",
    eligibility: "An Apple Account is required and Apple’s offer eligibility rules apply. Each code can be redeemed once.",
    why: "You’re getting this email because you asked for the free month on controlmymac.com and agreed to receive Sebastian Apps emails.",
    ignore: "If this wasn’t you, unsubscribe below and you won’t get any more emails from us.",
    unsubscribe: "Unsubscribe from Sebastian Apps emails",
    privacy: "Privacy Policy",
    country: "Slovenia",
  },
  de: {
    subject: "Dein Gratismonat für Control My Mac",
    preview: "Dein persönlicher Code und zwei schnelle Wege, ihn einzulösen.",
    heading: "Dein Gratismonat ist bereit",
    intro: "Danke, dass du dich für die E-Mails von Sebastian Apps angemeldet hast. Hier ist dein persönlicher Code für einen Gratismonat Full App in Control My Mac.",
    codeLabel: "Dein Code",
    button: "Im App Store einlösen",
    appTitle: "Oder direkt in der App einlösen",
    steps: ["Öffne Control My Mac und tippe auf {settings}.", "Tippe im Bereich {mode} auf {unlock}.", "Tippe ganz unten auf {promo} und gib deinen Code ein."],
    store: "Oder: App Store → dein Profilbild → {redeem}",
    expires: "Löse ihn vor dem {date} ein.",
    noRenew: "Der Gratismonat verlängert sich nicht automatisch, es entstehen also keine Kosten.",
    renews: "Nach dem kostenlosen Monat verlängert sich das Abonnement zum regulären Preis, sofern du nicht kündigst.",
    eligibility: "Du brauchst einen Apple Account, und es gelten Apples Teilnahmebedingungen für Angebote. Jeder Code lässt sich einmal einlösen.",
    why: "Du bekommst diese E-Mail, weil du auf controlmymac.com den Gratismonat angefordert und den E-Mails von Sebastian Apps zugestimmt hast.",
    ignore: "Warst du das nicht, melde dich unten ab – dann bekommst du keine weiteren E-Mails von uns.",
    unsubscribe: "Von den E-Mails von Sebastian Apps abmelden",
    privacy: "Datenschutzerklärung",
    country: "Slowenien",
  },
  es: {
    subject: "Tu mes gratis de Control My Mac",
    preview: "Tu código personal y dos formas rápidas de canjearlo.",
    heading: "Tu mes gratis está listo",
    intro: "Gracias por suscribirte a los correos de Sebastian Apps. Aquí tienes tu código personal para un mes gratis de Full App en Control My Mac.",
    codeLabel: "Tu código",
    button: "Canjear en el App Store",
    appTitle: "O canjéalo en la app",
    steps: ["Abre Control My Mac y toca {settings}.", "En la sección {mode}, toca {unlock}.", "Al final de la pantalla, toca {promo} e introduce tu código."],
    store: "O bien: App Store → tu foto de perfil → {redeem}",
    expires: "Canjéalo antes del {date}.",
    noRenew: "El mes gratis no se renueva automáticamente, así que no se te cobrará nada.",
    renews: "Después del mes gratis, la suscripción se renueva al precio estándar salvo que la canceles.",
    eligibility: "Necesitas una cuenta de Apple y se aplican los requisitos de Apple para ofertas. Cada código se puede canjear una sola vez.",
    why: "Recibes este correo porque pediste el mes gratis en controlmymac.com y aceptaste recibir correos de Sebastian Apps.",
    ignore: "Si no has sido tú, date de baja con el enlace de abajo y no volverás a recibir correos nuestros.",
    unsubscribe: "Darme de baja de los correos de Sebastian Apps",
    privacy: "Política de privacidad",
    country: "Eslovenia",
  },
  fr: {
    subject: "Votre mois gratuit de Control My Mac",
    preview: "Votre code personnel et deux façons rapides de l’utiliser.",
    heading: "Votre mois gratuit vous attend",
    intro: "Merci de vous être inscrit aux e-mails Sebastian Apps. Voici votre code personnel pour un mois gratuit de Full App dans Control My Mac.",
    codeLabel: "Votre code",
    button: "Utiliser dans l’App Store",
    appTitle: "Ou utilisez-le dans l’app",
    steps: ["Ouvrez Control My Mac et touchez {settings}.", "Dans la section {mode}, touchez {unlock}.", "Tout en bas, touchez {promo} et saisissez votre code."],
    store: "Ou\u00a0: App Store → votre photo de profil → {redeem}",
    expires: "Utilisez-le avant le {date}.",
    noRenew: "Le mois gratuit ne se renouvelle pas automatiquement\u00a0: rien ne vous sera facturé.",
    renews: "Après le mois gratuit, l’abonnement est renouvelé au tarif standard sauf si vous l’annulez.",
    eligibility: "Un compte Apple est nécessaire et les conditions d’éligibilité d’Apple s’appliquent. Chaque code ne peut être utilisé qu’une seule fois.",
    why: "Vous recevez cet e-mail car vous avez demandé le mois gratuit sur controlmymac.com et accepté de recevoir les e-mails Sebastian Apps.",
    ignore: "Si ce n’était pas vous, désabonnez-vous ci-dessous et vous ne recevrez plus d’e-mails de notre part.",
    unsubscribe: "Se désabonner des e-mails Sebastian Apps",
    privacy: "Politique de confidentialité",
    country: "Slovénie",
  },
  it: {
    subject: "Il tuo mese gratis di Control My Mac",
    preview: "Il tuo codice personale e due modi rapidi per riscattarlo.",
    heading: "Il tuo mese gratis è pronto",
    intro: "Grazie per esserti iscritto alle email di Sebastian Apps. Ecco il tuo codice personale per un mese gratis di Full App in Control My Mac.",
    codeLabel: "Il tuo codice",
    button: "Riscatta nell’App Store",
    appTitle: "Oppure riscattalo nell’app",
    steps: ["Apri Control My Mac e tocca {settings}.", "Nella sezione {mode}, tocca {unlock}.", "In fondo, tocca {promo} e inserisci il tuo codice."],
    store: "Oppure: App Store → la tua foto profilo → {redeem}",
    expires: "Riscattalo prima del {date}.",
    noRenew: "Il mese gratis non si rinnova automaticamente, quindi non ti verrà addebitato nulla.",
    renews: "Dopo il mese gratuito, l’abbonamento si rinnova al prezzo standard salvo annullamento.",
    eligibility: "Serve un Apple Account e si applicano i requisiti di idoneità di Apple per le offerte. Ogni codice si può riscattare una sola volta.",
    why: "Ricevi questa email perché hai richiesto il mese gratis su controlmymac.com e hai accettato di ricevere le email di Sebastian Apps.",
    ignore: "Se non sei stato tu, annulla l’iscrizione qui sotto e non riceverai altre email da noi.",
    unsubscribe: "Annulla l’iscrizione alle email Sebastian Apps",
    privacy: "Informativa sulla privacy",
    country: "Slovenia",
  },
  nl: {
    subject: "Je gratis maand Control My Mac",
    preview: "Je persoonlijke code en twee snelle manieren om hem in te wisselen.",
    heading: "Je gratis maand staat klaar",
    intro: "Bedankt voor je aanmelding voor de e-mails van Sebastian Apps. Hier is je persoonlijke code voor een gratis maand Full App in Control My Mac.",
    codeLabel: "Je code",
    button: "Inwisselen in de App Store",
    appTitle: "Of wissel hem in de app in",
    steps: ["Open Control My Mac en tik op {settings}.", "Tik in het onderdeel {mode} op {unlock}.", "Tik helemaal onderaan op {promo} en voer je code in."],
    store: "Of: App Store → je profielfoto → {redeem}",
    expires: "Wissel de code in vóór {date}.",
    noRenew: "De gratis maand wordt niet automatisch verlengd, dus je betaalt niets.",
    renews: "Na de gratis maand wordt het abonnement tegen de standaardprijs verlengd, tenzij je opzegt.",
    eligibility: "Je hebt een Apple Account nodig en de voorwaarden van Apple voor aanbiedingen zijn van toepassing. Elke code kan één keer worden ingewisseld.",
    why: "Je krijgt deze e-mail omdat je op controlmymac.com de gratis maand hebt aangevraagd en akkoord bent gegaan met e-mails van Sebastian Apps.",
    ignore: "Was jij dit niet? Meld je dan hieronder af, dan krijg je geen e-mails meer van ons.",
    unsubscribe: "Afmelden voor e-mails van Sebastian Apps",
    privacy: "Privacybeleid",
    country: "Slovenië",
  },
  pl: {
    subject: "Twój darmowy miesiąc Control My Mac",
    preview: "Twój osobisty kod i dwa szybkie sposoby, by go zrealizować.",
    heading: "Twój darmowy miesiąc jest gotowy",
    intro: "Dziękujemy za zapisanie się na e-maile Sebastian Apps. Oto Twój osobisty kod na darmowy miesiąc Full App w Control My Mac.",
    codeLabel: "Twój kod",
    button: "Zrealizuj w App Store",
    appTitle: "Albo zrealizuj go w aplikacji",
    steps: ["Otwórz Control My Mac i stuknij {settings}.", "W sekcji {mode} stuknij {unlock}.", "Na samym dole stuknij {promo} i wpisz swój kod."],
    store: "Albo: App Store → Twoje zdjęcie profilowe → {redeem}",
    expires: "Zrealizuj go przed {date}.",
    noRenew: "Darmowy miesiąc nie odnawia się automatycznie, więc nic nie zapłacisz.",
    renews: "Po bezpłatnym miesiącu subskrypcja odnowi się w standardowej cenie, chyba że ją anulujesz.",
    eligibility: "Wymagane jest konto Apple i obowiązują zasady Apple dotyczące ofert. Każdy kod można zrealizować tylko raz.",
    why: "Ta wiadomość trafiła do Ciebie, ponieważ na controlmymac.com poproszono z tego adresu o darmowy miesiąc i wyrażono zgodę na e-maile Sebastian Apps.",
    ignore: "Jeśli to nie Ty, wypisz się poniżej, a nie dostaniesz od nas więcej wiadomości.",
    unsubscribe: "Zrezygnuj z e-maili Sebastian Apps",
    privacy: "Polityka prywatności",
    country: "Słowenia",
  },
  pt: {
    subject: "Seu mês grátis do Control My Mac",
    preview: "Seu código pessoal e duas formas rápidas de resgatá-lo.",
    heading: "Seu mês grátis está pronto",
    intro: "Obrigado por se inscrever nos e-mails da Sebastian Apps. Aqui está seu código pessoal para um mês grátis do Full App no Control My Mac.",
    codeLabel: "Seu código",
    button: "Resgatar na App Store",
    appTitle: "Ou resgate no app",
    steps: ["Abra o Control My Mac e toque em {settings}.", "Na seção {mode}, toque em {unlock}.", "Lá embaixo, toque em {promo} e digite seu código."],
    store: "Ou: App Store → sua foto de perfil → {redeem}",
    expires: "Resgate antes de {date}.",
    noRenew: "O mês grátis não é renovado automaticamente, então nada será cobrado.",
    renews: "Depois do mês grátis, a assinatura é renovada pelo preço normal, a menos que você a cancele.",
    eligibility: "É preciso ter uma Conta Apple, e as regras de elegibilidade da Apple para ofertas se aplicam. Cada código pode ser resgatado uma única vez.",
    why: "Você está recebendo este e-mail porque pediu o mês grátis em controlmymac.com e aceitou receber e-mails da Sebastian Apps.",
    ignore: "Se não foi você, cancele a inscrição abaixo e não enviaremos mais e-mails.",
    unsubscribe: "Cancelar a inscrição nos e-mails da Sebastian Apps",
    privacy: "Política de Privacidade",
    country: "Eslovênia",
  },
  ru: {
    subject: "Ваш бесплатный месяц Control My Mac",
    preview: "Ваш личный код и два быстрых способа его активировать.",
    heading: "Ваш бесплатный месяц готов",
    intro: "Спасибо за подписку на письма Sebastian Apps. Вот ваш личный код на бесплатный месяц Full App в Control My Mac.",
    codeLabel: "Ваш код",
    button: "Активировать в App Store",
    appTitle: "Или активируйте в приложении",
    steps: ["Откройте Control My Mac и нажмите {settings}.", "В разделе {mode} нажмите {unlock}.", "Внизу экрана нажмите {promo} и введите код."],
    store: "Или: App Store → фото профиля → {redeem}",
    expires: "Активируйте код до {date}.",
    noRenew: "Бесплатный месяц не продлевается автоматически, поэтому списаний не будет.",
    renews: "После бесплатного месяца подписка продлится по обычной цене, если вы ее не отмените.",
    eligibility: "Нужен аккаунт Apple; действуют условия Apple для специальных предложений. Каждый код можно активировать только один раз.",
    why: "Вы получили это письмо, потому что запросили бесплатный месяц на controlmymac.com и согласились получать письма Sebastian Apps.",
    ignore: "Если это были не вы, отпишитесь по ссылке ниже, и мы больше не будем вам писать.",
    unsubscribe: "Отписаться от писем Sebastian Apps",
    privacy: "Политика конфиденциальности",
    country: "Словения",
  },
  tr: {
    subject: "Control My Mac ücretsiz ayınız",
    preview: "Kişisel kodunuz ve kodu kullanmanın iki hızlı yolu.",
    heading: "Ücretsiz ayınız hazır",
    intro: "Sebastian Apps e-postalarına katıldığınız için teşekkürler. Control My Mac’te bir ay ücretsiz Full App için kişisel kodunuz burada.",
    codeLabel: "Kodunuz",
    button: "App Store’da kullan",
    appTitle: "Veya uygulamada kullanın",
    steps: ["Control My Mac’i açın ve {settings} öğesine dokunun.", "{mode} bölümünde {unlock} düğmesine dokunun.", "En altta {promo} seçeneğine dokunun ve kodunuzu girin."],
    store: "Veya: App Store → profil fotoğrafınız → {redeem}",
    expires: "Kodu {date} tarihinden önce kullanın.",
    noRenew: "Ücretsiz ay otomatik olarak yenilenmez, bu nedenle sizden ücret alınmaz.",
    renews: "Ücretsiz aydan sonra iptal etmediğiniz sürece abonelik standart fiyatla yenilenir.",
    eligibility: "Bir Apple Hesabı gerekir ve Apple’ın teklif uygunluk kuralları geçerlidir. Her kod yalnızca bir kez kullanılabilir.",
    why: "Bu e-postayı, controlmymac.com’da ücretsiz ayı istediğiniz ve Sebastian Apps e-postalarını almayı kabul ettiğiniz için alıyorsunuz.",
    ignore: "Bu isteği siz yapmadıysanız aşağıdan abonelikten çıkın; size başka e-posta göndermeyiz.",
    unsubscribe: "Sebastian Apps e-postalarından ayrıl",
    privacy: "Gizlilik Politikası",
    country: "Slovenya",
  },
  ja: {
    subject: "Control My Macの無料1か月コードをお届けします",
    preview: "専用コードと、かんたんな2つの利用方法をご案内します。",
    heading: "無料1か月の準備ができました",
    intro: "Sebastian Appsのメールにご登録いただきありがとうございます。Control My MacのFull Appを1か月無料で使える専用コードをお送りします。",
    codeLabel: "専用コード",
    button: "App Storeで引き換える",
    appTitle: "アプリ内で引き換える場合",
    steps: ["Control My Macを開き、{settings}をタップします。", "{mode}の項目で{unlock}をタップします。", "いちばん下の{promo}をタップし、コードを入力します。"],
    store: "または：App Store → ご自分の写真 → {redeem}",
    expires: "{date}までに引き換えてください。",
    noRenew: "無料期間は自動更新されないため、料金は発生しません。",
    renews: "無料期間終了後、キャンセルしない限り通常価格で更新されます。",
    eligibility: "Apple Accountが必要です。Appleのオファー利用条件が適用され、各コードは1回のみ利用できます。",
    why: "このメールは、controlmymac.comで無料1か月をリクエストし、Sebastian Appsからのメール受信に同意いただいたためお送りしています。",
    ignore: "お心当たりがない場合は、下のリンクから配信を停止してください。以降、メールはお送りしません。",
    unsubscribe: "Sebastian Appsのメール配信を停止",
    privacy: "プライバシーポリシー",
    country: "スロベニア",
  },
  ko: {
    subject: "Control My Mac 1개월 무료 이용 코드",
    preview: "개인 코드와 간단한 두 가지 사용 방법을 알려 드립니다.",
    heading: "무료 1개월이 준비되었습니다",
    intro: "Sebastian Apps 이메일을 구독해 주셔서 감사합니다. Control My Mac의 Full App을 1개월 동안 무료로 이용할 수 있는 개인 코드입니다.",
    codeLabel: "개인 코드",
    button: "App Store에서 사용하기",
    appTitle: "또는 앱에서 사용하기",
    steps: ["Control My Mac을 열고 {settings}을 탭하세요.", "{mode} 섹션에서 {unlock}를 탭하세요.", "맨 아래에서 {promo}를 탭한 다음 코드를 입력하세요."],
    store: "또는: App Store → 프로필 사진 → {redeem}",
    expires: "{date} 전에 사용하세요.",
    noRenew: "무료 1개월은 자동으로 갱신되지 않으므로 요금이 청구되지 않습니다.",
    renews: "무료 기간이 끝나면 취소하지 않는 한 표준 가격으로 구독이 갱신됩니다.",
    eligibility: "Apple 계정이 필요하며 Apple의 혜택 이용 조건이 적용됩니다. 각 코드는 한 번만 사용할 수 있습니다.",
    why: "controlmymac.com에서 무료 1개월을 요청하고 Sebastian Apps 이메일 수신에 동의하셔서 이 이메일을 보내 드렸습니다.",
    ignore: "본인이 요청하지 않았다면 아래에서 수신 거부해 주세요. 이후로는 이메일을 보내지 않습니다.",
    unsubscribe: "Sebastian Apps 이메일 수신 거부",
    privacy: "개인정보 처리방침",
    country: "슬로베니아",
  },
  zh: {
    subject: "Control My Mac 免费使用一个月",
    preview: "内含您的专属代码，以及两种快捷兑换方式。",
    heading: "您的免费月已准备好",
    intro: "感谢订阅 Sebastian Apps 邮件。这是您的专属代码，可免费使用 Control My Mac 的 Full App 一个月。",
    codeLabel: "您的代码",
    button: "在 App Store 中兑换",
    appTitle: "或在 App 内兑换",
    steps: ["打开 Control My Mac，轻点{settings}。", "在{mode}部分，轻点{unlock}。", "在最下方轻点{promo}，然后输入代码。"],
    store: "或者：App Store → 您的头像 → {redeem}",
    expires: "请在{date}之前兑换。",
    noRenew: "免费月不会自动续订，因此不会产生任何费用。",
    renews: "免费期结束后，除非取消，否则订阅将按标准价格续订。",
    eligibility: "需要 Apple 账户，并须符合 Apple 的优惠资格要求。每个代码只能兑换一次。",
    why: "您收到这封邮件，是因为您在 controlmymac.com 申请了免费月，并同意接收 Sebastian Apps 邮件。",
    ignore: "如果这不是您本人的操作，请点击下方链接退订，我们将不再向您发送邮件。",
    unsubscribe: "退订 Sebastian Apps 邮件",
    privacy: "隐私政策",
    country: "斯洛文尼亚",
  },
  "zh-hant": {
    subject: "你的 Control My Mac 免費一個月",
    preview: "你的專屬代碼，以及兩種快速兌換方式。",
    heading: "你的免費一個月準備好了",
    intro: "感謝你訂閱 Sebastian Apps 電子郵件。這是你的專屬代碼，可免費使用 Control My Mac 的 Full App 一個月。",
    codeLabel: "你的代碼",
    button: "在 App Store 兌換",
    appTitle: "或在 App 內兌換",
    steps: ["打開 Control My Mac，點一下{settings}。", "在{mode}區域，點一下{unlock}。", "在最下方點一下{promo}，然後輸入你的代碼。"],
    store: "或者：App Store → 你的大頭貼照 → {redeem}",
    expires: "請在 {date}前兌換。",
    noRenew: "免費的一個月結束後不會自動續訂，所以你不會被收費。",
    renews: "免費的一個月結束後，除非你先取消，否則訂閱會以標準價格續訂。",
    eligibility: "需要 Apple 帳號，並適用 Apple 的優惠資格規定。每個代碼只能兌換一次。",
    why: "你會收到這封電子郵件，是因為你在 controlmymac.com 申請了免費一個月，並同意接收 Sebastian Apps 電子郵件。",
    ignore: "如果這不是你本人申請的，請在下方取消訂閱，我們就不會再寄電子郵件給你。",
    unsubscribe: "取消訂閱 Sebastian Apps 電子郵件",
    privacy: "隱私權政策",
    country: "斯洛維尼亞",
  },
  uk: {
    subject: "Ваш безкоштовний місяць Control My Mac",
    preview: "Ваш особистий код і два швидкі способи його використати.",
    heading: "Ваш безкоштовний місяць готовий",
    intro: "Дякуємо, що підписалися на листи від Sebastian Apps. Ось ваш особистий код на безкоштовний місяць Full App у Control My Mac.",
    codeLabel: "Ваш код",
    button: "Використати в App Store",
    appTitle: "Або використайте код у програмі",
    steps: ["Відкрийте Control My Mac і торкніть {settings}.", "У розділі {mode} торкніть {unlock}.", "Унизу торкніть {promo} і введіть свій код."],
    store: "Або: App Store → фото вашого облікового запису → {redeem}",
    expires: "Використайте його до {date}.",
    noRenew: "Безкоштовний місяць не поновлюється автоматично, тож плату з вас не стягнуть.",
    renews: "Після безкоштовного місяця підписка поновиться за стандартною ціною, якщо ви її не скасуєте.",
    eligibility: "Потрібен обліковий запис Apple, і діють правила Apple щодо того, хто може скористатися пропозицією. Кожен код можна використати лише один раз.",
    why: "Ви отримали цей лист, бо попросили безкоштовний місяць на controlmymac.com і погодилися отримувати листи від Sebastian Apps.",
    ignore: "Якщо це були не ви, відпишіться нижче, і листів від нас більше не буде.",
    unsubscribe: "Відписатися від листів Sebastian Apps",
    privacy: "Політика приватності",
    country: "Словенія",
  },
  sl: {
    subject: "Vaš brezplačni mesec aplikacije Control My Mac",
    preview: "Vaša osebna koda in dva hitra načina za unovčenje.",
    heading: "Vaš brezplačni mesec je pripravljen",
    intro: "Hvala, ker ste se naročili na e-poštna sporočila Sebastian Apps. Tukaj je vaša osebna koda za brezplačen mesec Full App v aplikaciji Control My Mac.",
    codeLabel: "Vaša koda",
    button: "Unovčite v trgovini App Store",
    appTitle: "Ali pa unovčite v aplikaciji",
    steps: ["Odprite Control My Mac in tapnite {settings}.", "V razdelku {mode} tapnite {unlock}.", "Na dnu tapnite {promo} in vnesite svojo kodo."],
    store: "Ali pa: App Store → vaša profilna slika → {redeem}",
    expires: "Kodo unovčite pred {date}.",
    noRenew: "Brezplačni mesec se ne podaljša samodejno, zato vam ne bo nič zaračunano.",
    renews: "Po brezplačnem mesecu se naročnina podaljša po redni ceni, razen če jo prekličete.",
    eligibility: "Potrebujete račun Apple, veljajo pa pravila družbe Apple o upravičenosti do ponudb. Vsako kodo je mogoče unovčiti enkrat.",
    why: "To e-poštno sporočilo ste prejeli, ker ste na controlmymac.com zahtevali brezplačni mesec in privolili v prejemanje e-poštnih sporočil Sebastian Apps.",
    ignore: "Če to niste bili vi, se spodaj odjavite in od nas ne boste prejeli nobenega sporočila več.",
    unsubscribe: "Odjava od e-poštnih sporočil Sebastian Apps",
    privacy: "Pravilnik o zasebnosti",
    country: "Slovenija",
  },
  cs: {
    subject: "Váš měsíc Control My Mac zdarma",
    preview: "Váš osobní kód a dva rychlé způsoby, jak ho uplatnit.",
    heading: "Váš měsíc zdarma je připraven",
    intro: "Děkujeme, že jste se přihlásili k odběru e-mailů Sebastian Apps. Tady je váš osobní kód na měsíc Full App zdarma v aplikaci Control My Mac.",
    codeLabel: "Váš kód",
    button: "Uplatnit v App Storu",
    appTitle: "Nebo ho uplatněte přímo v aplikaci",
    steps: ["Otevřete Control My Mac a klepněte na {settings}.", "V části s názvem {mode} klepněte na {unlock}.", "Úplně dole klepněte na {promo} a zadejte svůj kód."],
    store: "Nebo: App Store → obrázek vašeho účtu → {redeem}",
    expires: "Uplatněte ho do {date}.",
    noRenew: "Měsíc zdarma se automaticky neobnovuje, takže vám nebude nic účtováno.",
    renews: "Po měsíci zdarma se předplatné obnoví za běžnou cenu, pokud ho nezrušíte.",
    eligibility: "Potřebujete účet Apple a platí pravidla společnosti Apple pro nárok na nabídky. Každý kód lze uplatnit jen jednou.",
    why: "Tento e-mail dostáváte, protože jste na controlmymac.com požádali o měsíc zdarma a souhlasili jste s příjmem e-mailů Sebastian Apps.",
    ignore: "Pokud jste to nebyli vy, odhlaste se níže a už od nás žádné e-maily nedostanete.",
    unsubscribe: "Odhlásit odběr e-mailů Sebastian Apps",
    privacy: "Zásady ochrany osobních údajů",
    country: "Slovinsko",
  },
  sk: {
    subject: "Váš bezplatný mesiac Control My Mac",
    preview: "Váš osobný kód a dva rýchle spôsoby, ako ho uplatniť.",
    heading: "Váš bezplatný mesiac je pripravený",
    intro: "Ďakujeme, že odoberáte e-maily Sebastian Apps. Tu je váš osobný kód na bezplatný mesiac Full App v aplikácii Control My Mac.",
    codeLabel: "Váš kód",
    button: "Uplatniť v App Store",
    appTitle: "Alebo ho uplatnite v aplikácii",
    steps: ["Otvorte Control My Mac a klepnite na tlačidlo {settings}.", "V sekcii {mode} klepnite na tlačidlo {unlock}.", "Dole klepnite na {promo} a zadajte svoj kód."],
    store: "Alebo: App Store → obrázok vášho účtu → {redeem}",
    expires: "Uplatnite ho pred {date}.",
    noRenew: "Bezplatný mesiac sa automaticky neobnovuje, takže vám nič neúčtujeme.",
    renews: "Po skončení bezplatného mesiaca sa predplatné obnoví za štandardnú cenu, pokiaľ ho nezrušíte.",
    eligibility: "Potrebujete Apple účet a platia pravidlá spoločnosti Apple o nároku na ponuku. Každý kód možno uplatniť iba raz.",
    why: "Tento e-mail dostávate, pretože ste si na controlmymac.com vyžiadali bezplatný mesiac a súhlasili ste s prijímaním e-mailov Sebastian Apps.",
    ignore: "Ak ste to neboli vy, odhláste sa nižšie a už od nás nedostanete žiadne ďalšie e-maily.",
    unsubscribe: "Odhlásiť sa z odberu e-mailov Sebastian Apps",
    privacy: "Zásady ochrany súkromia",
    country: "Slovinsko",
  },
  sv: {
    subject: "Din gratis månad av Control My Mac",
    preview: "Din personliga kod, plus två snabba sätt att lösa in den.",
    heading: "Din gratis månad är klar",
    intro: "Tack för att du anmälde dig till e-postutskicken från Sebastian Apps. Här är din personliga kod för en gratis månad av Full App i Control My Mac.",
    codeLabel: "Din kod",
    button: "Lös in i App Store",
    appTitle: "Eller lös in i appen",
    steps: ["Öppna Control My Mac och tryck på {settings}.", "Tryck på {unlock} i avsnittet {mode}.", "Tryck på {promo} längst ned och ange din kod."],
    store: "Eller: App Store → din profilbild → {redeem}",
    expires: "Lös in den före {date}.",
    noRenew: "Den gratis månaden förnyas inte automatiskt, så du debiteras inte.",
    renews: "Efter den gratis månaden förnyas abonnemanget till ordinarie pris om du inte avslutar det.",
    eligibility: "Ett Apple-konto krävs och Apples regler för erbjudanden gäller. Varje kod kan lösas in en gång.",
    why: "Du får det här e-postmeddelandet eftersom du begärde den gratis månaden på controlmymac.com och godkände att få e-post från Sebastian Apps.",
    ignore: "Om det inte var du, avsluta prenumerationen nedan så får du inga fler e-postmeddelanden från oss.",
    unsubscribe: "Avsluta prenumerationen på e-post från Sebastian Apps",
    privacy: "Integritetspolicy",
    country: "Slovenien",
  },
  no: {
    subject: "Din gratis måned med Control My Mac",
    preview: "Din personlige kode, pluss to raske måter å løse den inn på.",
    heading: "Den gratis måneden din er klar",
    intro: "Takk for at du abonnerer på e-postene fra Sebastian Apps. Her er din personlige kode for en gratis måned med Full App i Control My Mac.",
    codeLabel: "Din kode",
    button: "Løs inn i App Store",
    appTitle: "Eller løs inn i appen",
    steps: ["Åpne Control My Mac og trykk på {settings}.", "Trykk på {unlock} i delen {mode}.", "Trykk på {promo} nederst og skriv inn koden din."],
    store: "Eller: App Store → profilbildet ditt → {redeem}",
    expires: "Løs den inn før {date}.",
    noRenew: "Den gratis måneden fornyes ikke automatisk, så du blir ikke belastet.",
    renews: "Etter den gratis måneden fornyes abonnementet til ordinær pris med mindre du sier det opp.",
    eligibility: "Du trenger en Apple-konto, og Apples regler for hvem som kan bruke tilbudet, gjelder. Hver kode kan løses inn én gang.",
    why: "Du får denne e-posten fordi du ba om den gratis måneden på controlmymac.com og sa ja til å motta e-post fra Sebastian Apps.",
    ignore: "Hvis dette ikke var deg, kan du melde deg av nedenfor, så får du ikke flere e-poster fra oss.",
    unsubscribe: "Meld deg av e-postene fra Sebastian Apps",
    privacy: "Personvernerklæring",
    country: "Slovenia",
  },
  da: {
    subject: "Din gratis måned med Control My Mac",
    preview: "Din personlige kode og to hurtige måder at indløse den på.",
    heading: "Din gratis måned er klar",
    intro: "Tak, fordi du har tilmeldt dig e-mails fra Sebastian Apps. Her er din personlige kode til en gratis måned med Full App i Control My Mac.",
    codeLabel: "Din kode",
    button: "Indløs i App Store",
    appTitle: "Eller indløs den direkte i appen",
    steps: ["Åbn Control My Mac, og tryk på {settings}.", "Tryk på {unlock} i afsnittet {mode}.", "Tryk på {promo} nederst, og indtast din kode."],
    store: "Eller: App Store → dit profilbillede → {redeem}",
    expires: "Indløs den inden {date}.",
    noRenew: "Den gratis måned fornyes ikke automatisk, så du bliver ikke opkrævet noget.",
    renews: "Efter den gratis måned fornyes abonnementet til normalprisen, medmindre du opsiger det.",
    eligibility: "Det kræver en Apple-konto, og Apples regler for berettigelse til tilbud gælder. Hver kode kan kun indløses én gang.",
    why: "Du får denne e-mail, fordi du har bedt om den gratis måned på controlmymac.com og har sagt ja til at modtage e-mails fra Sebastian Apps.",
    ignore: "Hvis det ikke var dig, kan du afmelde dig herunder, så får du ikke flere e-mails fra os.",
    unsubscribe: "Afmeld e-mails fra Sebastian Apps",
    privacy: "Privatlivspolitik",
    country: "Slovenien",
  },
  fi: {
    subject: "Ilmainen Control My Mac -kuukautesi",
    preview: "Henkilökohtainen koodisi ja kaksi nopeaa tapaa lunastaa se.",
    heading: "Ilmainen kuukautesi on valmis",
    intro: "Kiitos, että liityit Sebastian Appsin sähköpostilistalle. Tässä on henkilökohtainen koodisi ilmaiseen kuukauteen Full Appia Control My Macissa.",
    codeLabel: "Koodisi",
    button: "Lunasta App Storessa",
    appTitle: "Tai lunasta suoraan sovelluksessa",
    steps: ["Avaa Control My Mac ja napauta {settings}.", "Napauta kohdassa {mode} painiketta {unlock}.", "Napauta aivan alhaalta kohtaa {promo} ja kirjoita koodisi."],
    store: "Tai: App Store → profiilikuvasi → {redeem}",
    expires: "Lunasta se ennen päivämäärää {date}.",
    noRenew: "Ilmainen kuukausi ei uusiudu automaattisesti, joten sinua ei veloiteta.",
    renews: "Ilmaisen kuukauden jälkeen tilaus uusiutuu normaalihintaan, ellet peruuta sitä.",
    eligibility: "Tarvitset Apple-tilin, ja Applen tarjousten kelpoisuussäännöt ovat voimassa. Jokaisen koodin voi lunastaa vain kerran.",
    why: "Saat tämän sähköpostin, koska pyysit ilmaista kuukautta osoitteessa controlmymac.com ja suostuit vastaanottamaan Sebastian Appsin sähköposteja.",
    ignore: "Jos et pyytänyt tätä itse, peru tilaus alta, niin et saa meiltä enää sähköposteja.",
    unsubscribe: "Peru Sebastian Appsin sähköpostien tilaus",
    privacy: "Tietosuojakäytäntö",
    country: "Slovenia",
  },
  hu: {
    subject: "A Control My Mac ingyenes hónapja",
    preview: "Az egyéni kódja, és két gyors mód a beváltására.",
    heading: "Az ingyenes hónap készen áll",
    intro: "Köszönjük, hogy feliratkozott a Sebastian Apps e-mailjeire. Itt az egyéni kódja a Control My Mac Full App egy ingyenes hónapjához.",
    codeLabel: "Az Ön kódja",
    button: "Beváltás az App Store-ban",
    appTitle: "Vagy váltsa be az appban",
    steps: ["Nyissa meg a Control My Mac appot, majd koppintson ide: {settings}.", "A(z) {mode} szakaszban koppintson ide: {unlock}.", "Alul koppintson ide: {promo}, majd adja meg a kódot."],
    store: "Vagy: App Store → profilkép → {redeem}",
    expires: "Váltsa be ezen időpont előtt: {date}.",
    noRenew: "Az ingyenes hónap nem újul meg automatikusan, ezért nem kerül sor fizetésre.",
    renews: "Az ingyenes hónap után az előfizetés a szokásos áron megújul, hacsak le nem mondja.",
    eligibility: "Apple-fiók szükséges, és az Apple ajánlatokra vonatkozó jogosultsági szabályai érvényesek. Minden kód egyszer váltható be.",
    why: "Azért kapja ezt az e-mailt, mert a controlmymac.com oldalon kérte az ingyenes hónapot, és beleegyezett a Sebastian Apps e-mailjeinek fogadásába.",
    ignore: "Ha nem Ön volt, iratkozzon le lent, és nem kap több e-mailt tőlünk.",
    unsubscribe: "Leiratkozás a Sebastian Apps e-mailjeiről",
    privacy: "Adatvédelmi tájékoztató",
    country: "Szlovénia",
  },
  ro: {
    subject: "Luna dvs. gratuită de Control My Mac",
    preview: "Codul dvs. personal, plus două moduri rapide de a-l valorifica.",
    heading: "Luna dvs. gratuită este pregătită",
    intro: "Vă mulțumim că v-ați abonat la e-mailurile Sebastian Apps. Iată codul dvs. personal pentru o lună gratuită de Full App în Control My Mac.",
    codeLabel: "Codul dvs.",
    button: "Valorificați în App Store",
    appTitle: "Sau valorificați în aplicație",
    steps: ["Deschideți Control My Mac și atingeți butonul {settings}.", "În secțiunea {mode}, atingeți {unlock}.", "În partea de jos, atingeți {promo} și introduceți codul."],
    store: "Sau: App Store → fotografia contului dvs. → {redeem}",
    expires: "Valorificați-l înainte de {date}.",
    noRenew: "Luna gratuită nu se reînnoiește automat, deci nu veți plăti nimic.",
    renews: "După luna gratuită, abonamentul se reînnoiește la prețul standard, dacă nu îl anulați.",
    eligibility: "Este necesar un cont Apple și se aplică regulile Apple privind eligibilitatea pentru oferte. Fiecare cod poate fi valorificat o singură dată.",
    why: "Primiți acest e-mail pentru că ați cerut luna gratuită pe controlmymac.com și ați acceptat să primiți e-mailuri Sebastian Apps.",
    ignore: "Dacă nu ați fost dvs., dezabonați-vă mai jos și nu veți mai primi e-mailuri de la noi.",
    unsubscribe: "Dezabonare de la e-mailurile Sebastian Apps",
    privacy: "Politica de confidențialitate",
    country: "Slovenia",
  },
  el: {
    subject: "Ο δωρεάν μήνας σας για το Control My Mac",
    preview: "Ο προσωπικός σας κωδικός και δύο γρήγοροι τρόποι να τον εξαργυρώσετε.",
    heading: "Ο δωρεάν μήνας σας είναι έτοιμος",
    intro: "Ευχαριστούμε που εγγραφήκατε στα email της Sebastian Apps. Ορίστε ο προσωπικός σας κωδικός για έναν δωρεάν μήνα Full App στο Control My Mac.",
    codeLabel: "Ο κωδικός σας",
    button: "Εξαργύρωση στο App Store",
    appTitle: "Ή εξαργυρώστε τον μέσα στην εφαρμογή",
    steps: ["Ανοίξτε το Control My Mac και πατήστε {settings}.", "Στην ενότητα {mode}, πατήστε {unlock}.", "Στο κάτω μέρος, πατήστε {promo} και εισαγάγετε τον κωδικό σας."],
    store: "Ή: App Store → η φωτογραφία του λογαριασμού σας → {redeem}",
    expires: "Εξαργυρώστε τον πριν από τις {date}.",
    noRenew: "Ο δωρεάν μήνας δεν ανανεώνεται αυτόματα, επομένως δεν θα υπάρξει χρέωση.",
    renews: "Μετά τον δωρεάν μήνα, η συνδρομή ανανεώνεται στην τυπική τιμή, εκτός αν την ακυρώσετε.",
    eligibility: "Απαιτείται λογαριασμός Apple και ισχύουν οι κανόνες επιλεξιμότητας προσφορών της Apple. Κάθε κωδικός μπορεί να εξαργυρωθεί μία φορά.",
    why: "Λαμβάνετε αυτό το email επειδή ζητήσατε τον δωρεάν μήνα στο controlmymac.com και συμφωνήσατε να λαμβάνετε email από τη Sebastian Apps.",
    ignore: "Αν δεν ήσασταν εσείς, διαγραφείτε από τη λίστα παρακάτω και δεν θα λάβετε άλλα email από εμάς.",
    unsubscribe: "Διαγραφή από τα email της Sebastian Apps",
    privacy: "Πολιτική απορρήτου",
    country: "Σλοβενία",
  },
};

// Slovenian needs the month in the genitive after "do" ("do 15. januarja"), which the long month name
// from Intl is not; the numeric form ("15. 1. 2027") is correct in every sentence.
const DATE_STYLE = { sl: { year: "numeric", month: "numeric", day: "numeric", timeZone: "UTC" } };

function formatDate(value, locale) {
  const style = DATE_STYLE[locale] || { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" };
  return new Intl.DateTimeFormat(locale, style).format(new Date(value));
}

/**
 * The per-code Apple redemption link (offer_codes.redemption_url_ciphertext, decrypted by the
 * caller). Only an https://apps.apple.com link is trusted; anything else, or nothing, falls back
 * to the standard offer-code link for the app, which opens the same redemption sheet.
 */
export function redemptionUrlFor(code, redemptionUrl) {
  try {
    const url = new URL(String(redemptionUrl || ""));
    if (url.protocol === "https:" && url.hostname === "apps.apple.com") return url.toString();
  } catch {
    // Missing or malformed: use the fallback below.
  }
  return `https://apps.apple.com/redeem?ctx=offercodes&id=${APP_STORE_APP_ID}&code=${encodeURIComponent(code)}`;
}

/** Fills {name} placeholders with quoted labels; in HTML the label is also bold. */
function fillLabels(template, labels, quotes, html) {
  const [open, close] = quotes;
  return template.split(/(\{[a-z]+\})/).map((part) => {
    const key = part.startsWith("{") && part.endsWith("}") ? part.slice(1, -1) : null;
    if (key && Object.hasOwn(labels, key)) {
      return html
        ? `${escapeHtml(open)}<strong style="color:#17213a;font-weight:700">${escapeHtml(labels[key])}</strong>${escapeHtml(close)}`
        : `${open}${labels[key]}${close}`;
    }
    return html ? escapeHtml(part) : part;
  }).join("");
}

// `attempt` and the old `confirmationUrl` may still be passed by callers; neither changes the email.
export function renderCodeEmail({ locale, code, expiresAt, autoRenews, redemptionUrl, unsubscribeUrl }) {
  const language = normalizeLocale(locale);
  const copy = COPY[language] || COPY.en;
  const labels = { ...(APP_LABELS[language] || APP_LABELS.en), redeem: APPLE_REDEEM_LABEL[language] || APPLE_REDEEM_LABEL.en };
  const quotes = QUOTES[language] || QUOTES.en;
  // Some dates already end in a period (Russian "15 марта 2027 г."); don't double it.
  const expiry = copy.expires.replace("{date}", formatDate(expiresAt, language)).replace("..", ".");
  const renewal = autoRenews ? copy.renews : copy.noRenew;
  const redeemUrl = redemptionUrlFor(code, redemptionUrl);
  const colon = COLON[language] ?? ": ";
  const gap = SENTENCE_GAP[language] ?? " ";
  // English lives at the site root, every other language under /<locale>/.
  const homeUrl = language === "en" ? SITE_URL : `${SITE_URL}/${language}`;
  const privacyUrl = `${homeUrl}/privacy`;
  const siteName = new URL(SITE_URL).hostname;
  const senderAddress = `${SENDER_STREET_CITY}, ${copy.country}`;

  const text = [
    copy.heading,
    "",
    copy.intro,
    "",
    `${copy.codeLabel}${colon}${code}`,
    "",
    `${copy.button}${colon.trimEnd()}`,
    redeemUrl,
    "",
    `${copy.appTitle}${colon.trimEnd()}`,
    ...copy.steps.map((step, index) => `${index + 1}. ${fillLabels(step, labels, quotes, false)}`),
    "",
    fillLabels(copy.store, labels, quotes, false),
    "",
    `${expiry}${gap}${renewal}`,
    copy.eligibility,
    "",
    "",
    `${copy.why}${gap}${copy.ignore}`,
    `${copy.unsubscribe}${colon}${unsubscribeUrl}`,
    `${SENDER_NAME} · ${senderAddress} · ${siteName} · ${copy.privacy}${colon}${privacyUrl}`,
  ].join("\n");

  const steps = copy.steps
    .map((step) => `<li style="margin:0 0 10px;padding-left:4px">${fillLabels(step, labels, quotes, true)}</li>`)
    .join("");
  const html = `<!doctype html>
<html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${escapeHtml(copy.subject)}</title>
<style>@media (max-width:480px){.card{padding:28px 20px!important}.code{font-size:19px!important;letter-spacing:.03em!important}.button{padding:14px 18px!important}}</style></head>
<body style="margin:0;padding:0;background:#f4f7ff;color:#17213a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(copy.preview)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7ff"><tr><td align="center" style="padding:36px 16px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e0e7f5;border-radius:18px"><tr><td class="card" style="padding:36px 32px">
<p style="margin:0 0 12px;color:#4257d6;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Control My Mac</p>
<h1 style="margin:0 0 16px;color:#17213a;font-size:28px;line-height:1.2;letter-spacing:-.02em">${escapeHtml(copy.heading)}</h1>
<p style="margin:0 0 26px;color:#56637d;font-size:16px;line-height:1.6">${escapeHtml(copy.intro)}</p>
<p style="margin:0 0 8px;color:#56637d;font-size:13px;font-weight:700">${escapeHtml(copy.codeLabel)}</p>
<p class="code" style="margin:0 0 22px;padding:18px 12px;border:1px solid #cfd8f0;border-radius:12px;background:#f3f5fb;color:#17213a;text-align:center;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:22px;font-weight:800;letter-spacing:.06em;word-break:break-all;-webkit-user-select:all;user-select:all">${escapeHtml(code)}</p>
<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 32px"><tr><td align="center" bgcolor="#4f63ef" style="border-radius:12px;background:#4f63ef">
<a href="${escapeHtml(redeemUrl)}" target="_blank" rel="noopener" class="button" style="display:inline-block;padding:15px 28px;border-radius:12px;color:#ffffff;font-size:16px;font-weight:700;line-height:1.25;text-decoration:none">${escapeHtml(copy.button)}</a>
</td></tr></table>
<h2 style="margin:0 0 12px;color:#17213a;font-size:18px;line-height:1.3;letter-spacing:-.01em">${escapeHtml(copy.appTitle)}</h2>
<ol style="margin:0 0 16px;padding-left:22px;color:#56637d;font-size:15px;line-height:1.55">${steps}</ol>
<p style="margin:0 0 26px;color:#56637d;font-size:14px;line-height:1.55">${fillLabels(copy.store, labels, quotes, true)}</p>
<p style="margin:0;padding-top:20px;border-top:1px solid #edf0f6;color:#56637d;font-size:13px;line-height:1.6">${escapeHtml(expiry)}${gap}${escapeHtml(renewal)}<br>${escapeHtml(copy.eligibility)}</p>
</td></tr></table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px"><tr><td style="padding:20px 32px 0;color:#5f6b84;font-size:12px;line-height:1.6;text-align:center">
<p style="margin:0 0 6px">${escapeHtml(copy.why)}${gap}${escapeHtml(copy.ignore)}</p>
<p style="margin:0 0 6px"><a href="${escapeHtml(unsubscribeUrl)}" style="color:#3f4c6b;text-decoration:underline">${escapeHtml(copy.unsubscribe)}</a></p>
<p style="margin:0">${escapeHtml(SENDER_NAME)} · ${escapeHtml(senderAddress)} · <a href="${escapeHtml(homeUrl)}" style="color:#5f6b84;text-decoration:underline">${escapeHtml(siteName)}</a> · <a href="${escapeHtml(privacyUrl)}" style="color:#3f4c6b;text-decoration:underline">${escapeHtml(copy.privacy)}</a></p>
</td></tr></table>
</td></tr></table></body></html>`;

  return { subject: copy.subject, html, text };
}
