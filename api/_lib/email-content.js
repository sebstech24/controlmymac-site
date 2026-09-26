import { escapeHtml, normalizeLocale } from "./security.js";

export const APP_STORE_APP_ID = "6781458180";

// The sender named in every email's footer, next to the site and its privacy page.
const SENDER_NAME = "Sebastian Apps";
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
};

// How each language quotes an on-screen label.
const QUOTES = {
  en: ["“", "”"], de: ["„", "“"], es: ["«", "»"], fr: ["«\u00a0", "\u00a0»"], it: ["«", "»"],
  ja: ["「", "」"], ko: ["‘", "’"], nl: ["‘", "’"], pl: ["„", "”"], pt: ["“", "”"],
  ru: ["«", "»"], tr: ["“", "”"], zh: ["“", "”"],
};

// Punctuation between a label and its value, and between two sentences, in the plain-text version.
const COLON = { fr: "\u00a0: ", ja: "：", zh: "：" };
const SENTENCE_GAP = { ja: "", zh: "" };

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
  },
};

function formatDate(value, locale) {
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(value));
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
    `${SENDER_NAME} · ${siteName} · ${copy.privacy}${colon}${privacyUrl}`,
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
<p style="margin:0">${escapeHtml(SENDER_NAME)} · <a href="${escapeHtml(homeUrl)}" style="color:#5f6b84;text-decoration:underline">${escapeHtml(siteName)}</a> · <a href="${escapeHtml(privacyUrl)}" style="color:#3f4c6b;text-decoration:underline">${escapeHtml(copy.privacy)}</a></p>
</td></tr></table>
</td></tr></table></body></html>`;

  return { subject: copy.subject, html, text };
}
