import { escapeHtml, normalizeLocale } from "./security.js";

const COPY = {
  en: {
    subject: "Your free month of Control My Mac",
    preview: "Your personal code and in-app redemption steps are inside.",
    heading: "Your free month is ready",
    intro: "Thanks for joining Sebastian Apps emails. Here is your personal one-month Control My Mac code.",
    codeLabel: "Your code",
    instructionsTitle: "Enter the code in Control My Mac",
    steps: ["Open Control My Mac on your iPhone or iPad.", "Open Settings and find the Mode section.", "Tap Redeem Offer Code, then enter the code above."],
    expires: "Redeem it before {date}.",
    noRenew: "This offer does not renew automatically.",
    renews: "After the free month, the subscription renews at the standard price unless you cancel it.",
    eligibility: "An Apple Account and Apple offer eligibility are required.",
    ignore: "If you did not request this email, you can safely ignore it.",
    unsubscribe: "Unsubscribe from Sebastian Apps emails",
  },
  de: {
    subject: "Dein kostenloser Monat Control My Mac",
    preview: "Dein persönlicher Code und die Schritte zum Einlösen in der App sind enthalten.",
    heading: "Dein kostenloser Monat ist bereit",
    intro: "Danke, dass du Sebastian Apps-E-Mails abonniert hast. Hier ist dein persönlicher Code für einen Monat Control My Mac.",
    codeLabel: "Dein Code",
    instructionsTitle: "Code in Control My Mac eingeben",
    steps: ["Öffne Control My Mac auf deinem iPhone oder iPad.", "Öffne Einstellungen und suche den Bereich Modus.", "Tippe auf Angebotscode einlösen und gib den obigen Code ein."],
    expires: "Löse ihn vor dem {date} ein.", noRenew: "Dieses Angebot verlängert sich nicht automatisch.", renews: "Nach dem kostenlosen Monat verlängert sich das Abonnement zum regulären Preis, sofern du nicht kündigst.", eligibility: "Ein Apple Account und die Teilnahmeberechtigung für das Apple-Angebot sind erforderlich.", ignore: "Falls du diese E-Mail nicht angefordert hast, kannst du sie ignorieren.", unsubscribe: "Sebastian Apps-E-Mails abbestellen",
  },
  es: {
    subject: "Tu mes gratis de Control My Mac", preview: "Incluye tu código personal y los pasos para canjearlo en la app.", heading: "Tu mes gratis está listo", intro: "Gracias por suscribirte a los correos de Sebastian Apps. Este es tu código personal para un mes de Control My Mac.", codeLabel: "Tu código", instructionsTitle: "Introduce el código en Control My Mac", steps: ["Abre Control My Mac en tu iPhone o iPad.", "Abre Ajustes y busca la sección Modo.", "Pulsa Canjear código de oferta e introduce el código de arriba."], expires: "Canjéalo antes del {date}.", noRenew: "Esta oferta no se renueva automáticamente.", renews: "Después del mes gratis, la suscripción se renueva al precio estándar salvo que la canceles.", eligibility: "Se requiere una cuenta de Apple y cumplir los requisitos de la oferta.", ignore: "Si no solicitaste este correo, puedes ignorarlo.", unsubscribe: "Cancelar los correos de Sebastian Apps",
  },
  fr: {
    subject: "Votre mois gratuit de Control My Mac", preview: "Votre code personnel et les étapes d’activation dans l’app sont inclus.", heading: "Votre mois gratuit est prêt", intro: "Merci de vous être inscrit aux e-mails Sebastian Apps. Voici votre code personnel pour un mois de Control My Mac.", codeLabel: "Votre code", instructionsTitle: "Saisissez le code dans Control My Mac", steps: ["Ouvrez Control My Mac sur votre iPhone ou iPad.", "Ouvrez Réglages et trouvez la section Mode.", "Touchez Utiliser un code d’offre, puis saisissez le code ci-dessus."], expires: "Utilisez-le avant le {date}.", noRenew: "Cette offre ne se renouvelle pas automatiquement.", renews: "Après le mois gratuit, l’abonnement est renouvelé au tarif standard sauf si vous l’annulez.", eligibility: "Un compte Apple et l’éligibilité à l’offre Apple sont requis.", ignore: "Si vous n’avez pas demandé cet e-mail, vous pouvez l’ignorer.", unsubscribe: "Se désabonner des e-mails Sebastian Apps",
  },
  it: {
    subject: "Il tuo mese gratuito di Control My Mac", preview: "Troverai il tuo codice personale e i passaggi per riscattarlo nell’app.", heading: "Il tuo mese gratuito è pronto", intro: "Grazie per esserti iscritto alle email di Sebastian Apps. Ecco il tuo codice personale per un mese di Control My Mac.", codeLabel: "Il tuo codice", instructionsTitle: "Inserisci il codice in Control My Mac", steps: ["Apri Control My Mac sul tuo iPhone o iPad.", "Apri Impostazioni e trova la sezione Modalità.", "Tocca Riscatta codice offerta e inserisci il codice qui sopra."], expires: "Riscattalo entro il {date}.", noRenew: "Questa offerta non si rinnova automaticamente.", renews: "Dopo il mese gratuito, l’abbonamento si rinnova al prezzo standard salvo annullamento.", eligibility: "Sono necessari un account Apple e l’idoneità all’offerta Apple.", ignore: "Se non hai richiesto questa email, puoi ignorarla.", unsubscribe: "Annulla l’iscrizione alle email Sebastian Apps",
  },
  nl: {
    subject: "Je gratis maand Control My Mac", preview: "Je persoonlijke code en stappen voor inwisselen in de app staan binnenin.", heading: "Je gratis maand staat klaar", intro: "Bedankt dat je je hebt aangemeld voor e-mails van Sebastian Apps. Dit is je persoonlijke code voor één maand Control My Mac.", codeLabel: "Je code", instructionsTitle: "Voer de code in Control My Mac in", steps: ["Open Control My Mac op je iPhone of iPad.", "Open Instellingen en zoek het onderdeel Modus.", "Tik op Aanbiedingscode inwisselen en voer de code hierboven in."], expires: "Wissel de code in vóór {date}.", noRenew: "Dit aanbod wordt niet automatisch verlengd.", renews: "Na de gratis maand wordt het abonnement tegen de standaardprijs verlengd, tenzij je opzegt.", eligibility: "Een Apple Account en geschiktheid voor het Apple-aanbod zijn vereist.", ignore: "Heb je deze e-mail niet aangevraagd, dan kun je hem negeren.", unsubscribe: "Afmelden voor e-mails van Sebastian Apps",
  },
  pl: {
    subject: "Bezpłatny miesiąc Control My Mac", preview: "Wiadomość zawiera osobisty kod i instrukcję realizacji w aplikacji.", heading: "Bezpłatny miesiąc jest gotowy", intro: "Dziękujemy za zapisanie się na wiadomości Sebastian Apps. Oto osobisty kod na miesiąc Control My Mac.", codeLabel: "Twój kod", instructionsTitle: "Wpisz kod w Control My Mac", steps: ["Otwórz Control My Mac na iPhonie lub iPadzie.", "Otwórz Ustawienia i znajdź sekcję Tryb.", "Stuknij Zrealizuj kod oferty, a następnie wpisz powyższy kod."], expires: "Zrealizuj go przed {date}.", noRenew: "Ta oferta nie odnawia się automatycznie.", renews: "Po bezpłatnym miesiącu subskrypcja odnowi się w standardowej cenie, chyba że ją anulujesz.", eligibility: "Wymagane jest konto Apple oraz spełnienie warunków oferty Apple.", ignore: "Jeśli ta wiadomość nie została przez Ciebie zamówiona, możesz ją zignorować.", unsubscribe: "Zrezygnuj z e-maili Sebastian Apps",
  },
  pt: {
    subject: "Seu mês grátis do Control My Mac", preview: "Seu código pessoal e os passos para resgatá-lo no app estão aqui.", heading: "Seu mês grátis está pronto", intro: "Obrigado por se inscrever nos e-mails da Sebastian Apps. Aqui está seu código pessoal para um mês do Control My Mac.", codeLabel: "Seu código", instructionsTitle: "Digite o código no Control My Mac", steps: ["Abra o Control My Mac no iPhone ou iPad.", "Abra Ajustes e procure a seção Modo.", "Toque em Resgatar código da oferta e digite o código acima."], expires: "Resgate antes de {date}.", noRenew: "Esta oferta não é renovada automaticamente.", renews: "Depois do mês grátis, a assinatura é renovada pelo preço normal, a menos que você a cancele.", eligibility: "É necessário ter uma Conta Apple e ser elegível para a oferta da Apple.", ignore: "Se você não pediu este e-mail, pode ignorá-lo.", unsubscribe: "Cancelar a inscrição nos e-mails da Sebastian Apps",
  },
  ru: {
    subject: "Бесплатный месяц Control My Mac", preview: "Внутри ваш персональный код и инструкция по активации в приложении.", heading: "Ваш бесплатный месяц готов", intro: "Спасибо за подписку на письма Sebastian Apps. Вот ваш персональный код на один месяц Control My Mac.", codeLabel: "Ваш код", instructionsTitle: "Введите код в Control My Mac", steps: ["Откройте Control My Mac на iPhone или iPad.", "Откройте Настройки и найдите раздел Режим.", "Нажмите Активировать код предложения и введите код выше."], expires: "Активируйте код до {date}.", noRenew: "Это предложение не продлевается автоматически.", renews: "После бесплатного месяца подписка продлится по обычной цене, если вы ее не отмените.", eligibility: "Требуются аккаунт Apple и соответствие условиям предложения Apple.", ignore: "Если вы не запрашивали это письмо, просто проигнорируйте его.", unsubscribe: "Отписаться от писем Sebastian Apps",
  },
  tr: {
    subject: "Bir aylık ücretsiz Control My Mac", preview: "Kişisel kodunuz ve uygulama içi kullanma adımları bu e-postada.", heading: "Ücretsiz ayınız hazır", intro: "Sebastian Apps e-postalarına katıldığınız için teşekkürler. İşte bir aylık kişisel Control My Mac kodunuz.", codeLabel: "Kodunuz", instructionsTitle: "Kodu Control My Mac’e girin", steps: ["iPhone veya iPad’inizde Control My Mac’i açın.", "Ayarlar’ı açın ve Mod bölümünü bulun.", "Teklif Kodunu Kullan’a dokunun ve yukarıdaki kodu girin."], expires: "Kodu {date} tarihinden önce kullanın.", noRenew: "Bu teklif otomatik olarak yenilenmez.", renews: "Ücretsiz aydan sonra iptal etmediğiniz sürece abonelik standart fiyatla yenilenir.", eligibility: "Bir Apple Hesabı ve Apple teklifine uygunluk gereklidir.", ignore: "Bu e-postayı istemediyseniz yok sayabilirsiniz.", unsubscribe: "Sebastian Apps e-postalarından ayrıl",
  },
  ja: {
    subject: "Control My Macを1か月無料で利用できます", preview: "専用コードとアプリ内での入力手順をご案内します。", heading: "1か月無料コードをご利用いただけます", intro: "Sebastian Appsのメールにご登録いただきありがとうございます。Control My Macを1か月利用できる専用コードです。", codeLabel: "専用コード", instructionsTitle: "Control My Macでコードを入力", steps: ["iPhoneまたはiPadでControl My Macを開きます。", "設定を開き、モードの項目を探します。", "オファーコードを利用をタップし、上のコードを入力します。"], expires: "{date}までに引き換えてください。", noRenew: "このオファーは自動更新されません。", renews: "無料期間終了後、キャンセルしない限り通常価格で更新されます。", eligibility: "Apple AccountとAppleのオファー利用資格が必要です。", ignore: "このメールをリクエストしていない場合は無視してください。", unsubscribe: "Sebastian Appsのメール配信を停止",
  },
  ko: {
    subject: "Control My Mac 1개월 무료 이용권", preview: "개인 코드와 앱 안에서 입력하는 방법이 포함되어 있습니다.", heading: "무료 1개월 이용권이 준비되었습니다", intro: "Sebastian Apps 이메일을 구독해 주셔서 감사합니다. Control My Mac 1개월 개인 코드입니다.", codeLabel: "개인 코드", instructionsTitle: "Control My Mac에 코드 입력하기", steps: ["iPhone 또는 iPad에서 Control My Mac을 여세요.", "설정을 열고 모드 섹션을 찾으세요.", "혜택 코드 사용을 탭한 다음 위 코드를 입력하세요."], expires: "{date} 전에 사용하세요.", noRenew: "이 혜택은 자동으로 갱신되지 않습니다.", renews: "무료 기간이 끝나면 취소하지 않는 한 표준 가격으로 구독이 갱신됩니다.", eligibility: "Apple 계정과 Apple 혜택 이용 자격이 필요합니다.", ignore: "이 이메일을 요청하지 않았다면 무시하셔도 됩니다.", unsubscribe: "Sebastian Apps 이메일 수신 거부",
  },
  zh: {
    subject: "Control My Mac 免费使用一个月", preview: "邮件内含您的专属代码和应用内兑换步骤。", heading: "您的免费一个月已准备好", intro: "感谢订阅 Sebastian Apps 邮件。这是您的 Control My Mac 一个月专属代码。", codeLabel: "您的代码", instructionsTitle: "在 Control My Mac 中输入代码", steps: ["在 iPhone 或 iPad 上打开 Control My Mac。", "打开设置，找到模式部分。", "轻点兑换优惠代码，然后输入上方代码。"], expires: "请在{date}之前兑换。", noRenew: "此优惠不会自动续订。", renews: "免费期结束后，除非取消，否则订阅将按标准价格续订。", eligibility: "需要 Apple 账户并符合 Apple 优惠资格。", ignore: "如果您没有请求此邮件，可以忽略它。", unsubscribe: "退订 Sebastian Apps 邮件",
  },
};

const CONFIRM_COPY = {
  en: { title: "One last step", body: "Confirm this address to receive Sebastian Apps news, launch offers, and occasional free codes.", link: "Confirm future emails" },
  de: { title: "Noch ein letzter Schritt", body: "Bestätige diese Adresse, um Neuigkeiten, Startangebote und gelegentliche kostenlose Codes von Sebastian Apps zu erhalten.", link: "Zukünftige E-Mails bestätigen" },
  es: { title: "Un último paso", body: "Confirma esta dirección para recibir novedades, ofertas de lanzamiento y códigos gratuitos ocasionales de Sebastian Apps.", link: "Confirmar futuros correos" },
  fr: { title: "Une dernière étape", body: "Confirmez cette adresse pour recevoir les nouveautés, offres de lancement et codes gratuits occasionnels de Sebastian Apps.", link: "Confirmer les futurs e-mails" },
  it: { title: "Un ultimo passaggio", body: "Conferma questo indirizzo per ricevere novità, offerte di lancio e codici gratuiti occasionali di Sebastian Apps.", link: "Conferma le future email" },
  nl: { title: "Nog één stap", body: "Bevestig dit adres voor nieuws, lanceringsaanbiedingen en af en toe gratis codes van Sebastian Apps.", link: "Toekomstige e-mails bevestigen" },
  pl: { title: "Jeszcze jeden krok", body: "Potwierdź ten adres, aby otrzymywać wiadomości, oferty premierowe i okazjonalne bezpłatne kody Sebastian Apps.", link: "Potwierdź przyszłe e-maile" },
  pt: { title: "Só falta um passo", body: "Confirme este endereço para receber novidades, ofertas de lançamento e códigos gratuitos ocasionais da Sebastian Apps.", link: "Confirmar e-mails futuros" },
  ru: { title: "Остался один шаг", body: "Подтвердите адрес, чтобы получать новости, стартовые предложения и периодические бесплатные коды Sebastian Apps.", link: "Подтвердить будущие письма" },
  tr: { title: "Son bir adım", body: "Sebastian Apps haberleri, lansman teklifleri ve zaman zaman ücretsiz kodlar almak için bu adresi doğrulayın.", link: "Gelecek e-postaları doğrula" },
  ja: { title: "あと1ステップ", body: "Sebastian Appsのニュース、リリース特典、無料コードを受け取るには、このメールアドレスを確認してください。", link: "今後のメールを確認" },
  ko: { title: "마지막 한 단계", body: "Sebastian Apps 소식, 출시 혜택 및 가끔 제공되는 무료 코드를 받으려면 이 주소를 확인하세요.", link: "향후 이메일 확인" },
  zh: { title: "最后一步", body: "确认此邮箱，以接收 Sebastian Apps 新闻、发布优惠和不定期免费代码。", link: "确认今后的邮件" },
};

function formatDate(value, locale) {
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export function renderCodeEmail({ locale, code, expiresAt, autoRenews, confirmationUrl, unsubscribeUrl }) {
  const language = normalizeLocale(locale);
  const copy = COPY[language] || COPY.en;
  const confirmation = CONFIRM_COPY[language] || CONFIRM_COPY.en;
  const expiry = copy.expires.replace("{date}", formatDate(expiresAt, language));
  const renewal = autoRenews ? copy.renews : copy.noRenew;
  const safeCode = escapeHtml(code);

  const text = [
    copy.heading, "", copy.intro, "", `${copy.codeLabel}: ${code}`, "", copy.instructionsTitle,
    ...copy.steps.map((step, index) => `${index + 1}. ${step}`), "", expiry, renewal, copy.eligibility,
    "", confirmation.title, confirmation.body, confirmationUrl, "", copy.ignore, copy.unsubscribe, unsubscribeUrl,
  ].join("\n");

  const steps = copy.steps.map((step) => `<li style="margin:0 0 9px;padding-left:4px">${escapeHtml(step)}</li>`).join("");
  const html = `<!doctype html>
<html lang="${language}"><body style="margin:0;background:#f4f7ff;color:#17213a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<span style="display:none;max-height:0;overflow:hidden">${escapeHtml(copy.preview)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7ff"><tr><td align="center" style="padding:36px 18px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #e0e7f5;border-radius:18px"><tr><td style="padding:38px 36px">
<p style="margin:0 0 12px;color:#526ff5;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Control My Mac</p>
<h1 style="margin:0 0 18px;font-size:30px;line-height:1.15;letter-spacing:-.03em">${escapeHtml(copy.heading)}</h1>
<p style="margin:0 0 24px;color:#56637d;font-size:16px;line-height:1.6">${escapeHtml(copy.intro)}</p>
<p style="margin:0 0 8px;color:#6b7690;font-size:13px;font-weight:700">${escapeHtml(copy.codeLabel)}</p>
<p style="margin:0 0 26px;padding:18px;border:1px solid #dce3f4;border-radius:12px;background:#f3f5fb;text-align:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:22px;font-weight:800;letter-spacing:.08em;word-break:break-all">${safeCode}</p>
<h2 style="margin:0 0 12px;font-size:19px;letter-spacing:-.02em">${escapeHtml(copy.instructionsTitle)}</h2>
<ol style="margin:0 0 22px;padding-left:22px;color:#56637d;font-size:14px;line-height:1.55">${steps}</ol>
<p style="margin:0;color:#6b7690;font-size:13px;line-height:1.55">${escapeHtml(expiry)} ${escapeHtml(renewal)} ${escapeHtml(copy.eligibility)}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:20px;border:1px solid #e3e7f1;border-radius:12px"><tr><td style="padding:20px">
<h2 style="margin:0 0 8px;font-size:18px;letter-spacing:-.02em">${escapeHtml(confirmation.title)}</h2>
<p style="margin:0 0 10px;color:#626d84;font-size:13px;line-height:1.55">${escapeHtml(confirmation.body)}</p>
<p style="margin:0"><a href="${escapeHtml(confirmationUrl)}" style="color:#344bc5;text-decoration:underline;font-weight:700">${escapeHtml(confirmation.link)}</a></p>
</td></tr></table>
<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #edf0f6;color:#8a93a7;font-size:12px;line-height:1.5">${escapeHtml(copy.ignore)}<br><a href="${escapeHtml(unsubscribeUrl)}" style="color:#667390">${escapeHtml(copy.unsubscribe)}</a></p>
</td></tr></table></td></tr></table></body></html>`;

  return { subject: copy.subject, html, text };
}
