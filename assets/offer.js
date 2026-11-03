/* Control My Mac — subscriber gift (47% off Lifetime since 4 Nov 2026; a free month before) (homepage only, no deps).
   Fail-closed: the offer link appears only when GET /api/request-code reports
   the service is configured (CODE_DELIVERY_MODE=ready or preview). While the
   switch is off, nothing on the page changes. On localhost, ?offer-preview=1
   shows the flow for design review without calling the API. */
(function () {
  "use strict";

  var COPY = {
    en: {
      link: "Get a free month or 47% off Lifetime",
      note: "Subscriber welcome gift · Your choice · Unsubscribe anytime",
      eyebrow: "A small thank-you",
      heading: "Which welcome gift should I send you?",
      choiceLegend: "Pick your gift",
      choiceMonth: "One free month of Full App",
      choiceMonthNote: "No payment, does not renew",
      choiceLifetime: "47% off Full App Lifetime",
      choiceLifetimeNote: "Pay once, keep it forever",
      emailLabel: "Email address",
      placeholder: "you@example.com",
      consent: "Yes, I’m 16 or older. Send me occasional news about Control My Mac and Sebastian’s other apps.",
      required: "Required",
      detail: "Your email includes your personal code and simple steps to redeem it. You’ll also get occasional app news and promo codes for small tools designed to make everyday life easier and better. Unsubscribe anytime.",
      privacyLead: "How we handle your email:",
      privacyLink: "Privacy Policy",
      preparing: "Preparing the secure form…",
      submit: "Send the code",
      sending: "Sending…",
      fine: "Nothing is paid on this site. If you pick 47% off Lifetime, you pay the discounted price in the App Store. You can unsubscribe from updates at any time.",
      errEmail: "Enter a valid email address to continue.",
      errConsent: "Join the news emails to receive the subscriber welcome gift.",
      errWait: "Please wait for the security check to finish.",
      errTurnstile: "The security check could not load. Please try again.",
      errUnavailable: "The subscriber gift isn't available right now. Please try again later.",
      errCheck: "Please check your email address and complete the security check, then try again.",
      errRate: "Too many attempts. Please try again in ten minutes.",
      errGeneric: "The code could not be sent. Please try again.",
      errClaimed: "This email address has already received its code. Each address can claim the gift once.",
      okEyebrow: "Request received",
      okHeading: "Check your inbox.",
      okCopy: "We accepted the request for {email}. Your email contains your personal code, a button to redeem it in the App Store, the in-app steps, and an unsubscribe link.",
      okQueued: "We accepted the request for {email}. Your code will be emailed as soon as it is ready.",
      okPreview: "Preview only. No email was sent and nothing was saved.",
      done: "Done",
      close: "Close",
      security: "Security check"
    },
    de: {
      link: "Hol dir einen Gratismonat oder Full App auf Lebenszeit 47 % günstiger",
      note: "Willkommensgeschenk für Abonnenten · Du hast die Wahl · Jederzeit abmelden",
      eyebrow: "Ein kleines Dankeschön",
      heading: "Welches Willkommensgeschenk soll ich dir schicken?",
      choiceLegend: "Wähle dein Geschenk",
      choiceMonth: "Ein Gratismonat Full App",
      choiceMonthNote: "Keine Zahlung, keine automatische Verlängerung",
      choiceLifetime: "Full App auf Lebenszeit 47 % günstiger",
      choiceLifetimeNote: "Einmal zahlen, für immer behalten",
      emailLabel: "E-Mail-Adresse",
      placeholder: "du@beispiel.de",
      consent: "Ja, ich bin mindestens 16 Jahre alt. Schick mir gelegentlich Neuigkeiten zu Control My Mac und Sebastians anderen Apps.",
      required: "Erforderlich",
      detail: "Deine E-Mail enthält deinen persönlichen Code und einfache Schritte zum Einlösen. Außerdem bekommst du gelegentlich App-Neuigkeiten und Aktionscodes für kleine Tools, die den Alltag einfacher und besser machen. Jederzeit abmelden.",
      privacyLead: "So gehen wir mit deiner E-Mail-Adresse um:",
      privacyLink: "Datenschutzerklärung",
      preparing: "Sicheres Formular wird vorbereitet …",
      submit: "Code senden",
      sending: "Wird gesendet …",
      fine: "Auf dieser Website wird nichts bezahlt. Wenn du 47 % Rabatt auf den Kauf auf Lebenszeit wählst, zahlst du den reduzierten Preis im App Store. Du kannst Updates jederzeit abbestellen.",
      errEmail: "Gib eine gültige E-Mail-Adresse ein, um fortzufahren.",
      errConsent: "Melde dich für die E-Mails mit Neuigkeiten an, um das Willkommensgeschenk zu erhalten.",
      errWait: "Bitte warte, bis die Sicherheitsprüfung abgeschlossen ist.",
      errTurnstile: "Die Sicherheitsprüfung konnte nicht geladen werden. Bitte versuche es erneut.",
      errUnavailable: "Das Willkommensgeschenk ist gerade nicht verfügbar. Bitte versuche es später erneut.",
      errCheck: "Prüfe deine E-Mail-Adresse, schließe die Sicherheitsprüfung ab und versuche es erneut.",
      errRate: "Zu viele Versuche. Bitte versuche es in zehn Minuten erneut.",
      errGeneric: "Der Code konnte nicht gesendet werden. Bitte versuche es erneut.",
      errClaimed: "An diese E-Mail-Adresse wurde der Code bereits geschickt. Jede Adresse kann das Geschenk nur einmal erhalten.",
      okEyebrow: "Anfrage erhalten",
      okHeading: "Schau in dein Postfach.",
      okCopy: "Wir haben die Anfrage für {email} angenommen. Deine E-Mail enthält deinen persönlichen Code, einen Button zum Einlösen im App Store, die Schritte in der App und einen Abmeldelink.",
      okQueued: "Wir haben die Anfrage für {email} angenommen. Dein Code kommt per E-Mail, sobald er bereit ist.",
      okPreview: "Nur Vorschau. Es wurde keine E-Mail gesendet und nichts gespeichert.",
      done: "Fertig",
      close: "Schließen",
      security: "Sicherheitsprüfung"
    },
    fr: {
      link: "Obtenez un mois gratuit ou 47 % de réduction sur l’achat à vie",
      note: "Cadeau de bienvenue pour les abonnés · Au choix · Désabonnement à tout moment",
      eyebrow: "Un petit merci",
      heading: "Quel cadeau de bienvenue dois-je vous envoyer ?",
      choiceLegend: "Choisissez votre cadeau",
      choiceMonth: "Un mois gratuit de Full App",
      choiceMonthNote: "Aucun paiement, sans renouvellement",
      choiceLifetime: "47 % de réduction sur Full App à vie",
      choiceLifetimeNote: "Un seul paiement, à vous pour toujours",
      emailLabel: "Adresse e-mail",
      placeholder: "vous@exemple.fr",
      consent: "Oui, j’ai 16 ans ou plus. Envoyez-moi de temps en temps des nouvelles de Control My Mac et des autres apps de Sebastian.",
      required: "Obligatoire",
      detail: "Votre e-mail contient votre code personnel et des étapes simples pour l’utiliser. Vous recevrez aussi de temps en temps des nouvelles d’apps et des codes promo pour de petits outils conçus pour simplifier et améliorer le quotidien. Désabonnement à tout moment.",
      privacyLead: "Comment nous traitons votre adresse e-mail\u00a0:",
      privacyLink: "Politique de confidentialité",
      preparing: "Préparation du formulaire sécurisé…",
      submit: "Envoyer le code",
      sending: "Envoi…",
      fine: "Aucun paiement sur ce site. Si vous choisissez 47 % de réduction sur l’achat à vie, vous payez le prix réduit dans l’App Store. Vous pouvez vous désabonner des mises à jour à tout moment.",
      errEmail: "Saisissez une adresse e-mail valide pour continuer.",
      errConsent: "Inscrivez-vous aux e-mails d’actualité pour recevoir le cadeau de bienvenue.",
      errWait: "Veuillez patienter jusqu’à la fin de la vérification de sécurité.",
      errTurnstile: "La vérification de sécurité n’a pas pu se charger. Veuillez réessayer.",
      errUnavailable: "Le cadeau pour les abonnés n’est pas disponible pour le moment. Veuillez réessayer plus tard.",
      errCheck: "Vérifiez votre adresse e-mail et terminez la vérification de sécurité, puis réessayez.",
      errRate: "Trop de tentatives. Veuillez réessayer dans dix minutes.",
      errGeneric: "Le code n’a pas pu être envoyé. Veuillez réessayer.",
      errClaimed: "Cette adresse e-mail a déjà reçu son code. Chaque adresse ne peut profiter du cadeau qu’une seule fois.",
      okEyebrow: "Demande reçue",
      okHeading: "Consultez votre boîte de réception.",
      okCopy: "Nous avons accepté la demande pour {email}. Votre e-mail contient votre code personnel, un bouton pour l’utiliser dans l’App Store, les étapes dans l’app et un lien de désabonnement.",
      okQueued: "Nous avons accepté la demande pour {email}. Votre code vous sera envoyé par e-mail dès qu’il sera prêt.",
      okPreview: "Aperçu uniquement. Aucun e-mail n’a été envoyé et rien n’a été enregistré.",
      done: "Terminé",
      close: "Fermer",
      security: "Vérification de sécurité"
    },
    it: {
      link: "Ottieni un mese gratis o il 47% di sconto sull’acquisto a vita",
      note: "Regalo di benvenuto per gli iscritti · Scegli tu · Disiscriviti quando vuoi",
      eyebrow: "Un piccolo grazie",
      heading: "Quale regalo di benvenuto ti mando?",
      choiceLegend: "Scegli il tuo regalo",
      choiceMonth: "Un mese gratis di Full App",
      choiceMonthNote: "Nessun pagamento, non si rinnova",
      choiceLifetime: "47% di sconto su Full App a vita",
      choiceLifetimeNote: "Paghi una volta, è tuo per sempre",
      emailLabel: "Indirizzo email",
      placeholder: "tu@esempio.it",
      consent: "Sì, ho almeno 16 anni. Inviami ogni tanto novità su Control My Mac e sulle altre app di Sebastian.",
      required: "Obbligatorio",
      detail: "La tua email contiene il tuo codice personale e semplici passaggi per riscattarlo. Di tanto in tanto riceverai anche novità sulle app e codici promozionali per piccoli strumenti pensati per rendere la vita di tutti i giorni più semplice e migliore. Disiscriviti quando vuoi.",
      privacyLead: "Come trattiamo il tuo indirizzo email:",
      privacyLink: "Informativa sulla privacy",
      preparing: "Preparazione del modulo sicuro…",
      submit: "Invia il codice",
      sending: "Invio…",
      fine: "Su questo sito non si paga nulla. Se scegli il 47% di sconto sull’acquisto a vita, paghi il prezzo scontato nell’App Store. Puoi disiscriverti dagli aggiornamenti in qualsiasi momento.",
      errEmail: "Inserisci un indirizzo email valido per continuare.",
      errConsent: "Iscriviti alle email di novità per ricevere il regalo di benvenuto.",
      errWait: "Attendi il completamento del controllo di sicurezza.",
      errTurnstile: "Impossibile caricare il controllo di sicurezza. Riprova.",
      errUnavailable: "Il regalo per gli iscritti non è disponibile al momento. Riprova più tardi.",
      errCheck: "Controlla l’indirizzo email e completa il controllo di sicurezza, poi riprova.",
      errRate: "Troppi tentativi. Riprova tra dieci minuti.",
      errGeneric: "Impossibile inviare il codice. Riprova.",
      errClaimed: "Questo indirizzo email ha già ricevuto il suo codice. Ogni indirizzo può ricevere il regalo una sola volta.",
      okEyebrow: "Richiesta ricevuta",
      okHeading: "Controlla la tua casella di posta.",
      okCopy: "Abbiamo accettato la richiesta per {email}. La tua email contiene il tuo codice personale, un pulsante per riscattarlo nell’App Store, i passaggi nell’app e un link per disiscriverti.",
      okQueued: "Abbiamo accettato la richiesta per {email}. Il tuo codice ti arriverà via email non appena sarà pronto.",
      okPreview: "Solo anteprima. Nessuna email è stata inviata e nulla è stato salvato.",
      done: "Fine",
      close: "Chiudi",
      security: "Controllo di sicurezza"
    },
    es: {
      link: "Consigue un mes gratis o un 47 % de descuento en la compra de por vida",
      note: "Regalo de bienvenida para suscriptores · Tú eliges · Date de baja cuando quieras",
      eyebrow: "Un pequeño agradecimiento",
      heading: "¿Qué regalo de bienvenida te envío?",
      choiceLegend: "Elige tu regalo",
      choiceMonth: "Un mes gratis de Full App",
      choiceMonthNote: "Sin pago, no se renueva",
      choiceLifetime: "47 % de descuento en Full App de por vida",
      choiceLifetimeNote: "Pagas una vez y es tuyo para siempre",
      emailLabel: "Correo electrónico",
      placeholder: "tu@ejemplo.com",
      consent: "Sí, tengo 16 años o más. Envíame de vez en cuando novedades de Control My Mac y de las otras apps de Sebastian.",
      required: "Obligatorio",
      detail: "Tu correo incluye tu código personal y unos pasos sencillos para canjearlo. También recibirás de vez en cuando novedades de apps y códigos promocionales de pequeñas herramientas pensadas para hacer el día a día más fácil y mejor. Date de baja cuando quieras.",
      privacyLead: "Cómo tratamos tu correo electrónico:",
      privacyLink: "Política de privacidad",
      preparing: "Preparando el formulario seguro…",
      submit: "Enviar el código",
      sending: "Enviando…",
      fine: "En este sitio no se paga nada. Si eliges el 47 % de descuento en la compra de por vida, pagas el precio con descuento en el App Store. Puedes darte de baja de las novedades en cualquier momento.",
      errEmail: "Introduce un correo electrónico válido para continuar.",
      errConsent: "Suscríbete a los correos de novedades para recibir el regalo de bienvenida.",
      errWait: "Espera a que termine la comprobación de seguridad.",
      errTurnstile: "No se pudo cargar la comprobación de seguridad. Inténtalo de nuevo.",
      errUnavailable: "El regalo para suscriptores no está disponible ahora mismo. Inténtalo más tarde.",
      errCheck: "Revisa tu correo electrónico y completa la comprobación de seguridad; luego inténtalo de nuevo.",
      errRate: "Demasiados intentos. Inténtalo de nuevo en diez minutos.",
      errGeneric: "No se pudo enviar el código. Inténtalo de nuevo.",
      errClaimed: "Esta dirección de correo ya recibió su código. Cada dirección puede recibir el regalo una sola vez.",
      okEyebrow: "Solicitud recibida",
      okHeading: "Revisa tu bandeja de entrada.",
      okCopy: "Hemos aceptado la solicitud para {email}. Tu correo contiene tu código personal, un botón para canjearlo en el App Store, los pasos en la app y un enlace para darte de baja.",
      okQueued: "Hemos aceptado la solicitud para {email}. Te enviaremos el código por correo en cuanto esté listo.",
      okPreview: "Solo vista previa. No se envió ningún correo ni se guardó nada.",
      done: "Listo",
      close: "Cerrar",
      security: "Comprobación de seguridad"
    },
    pt: {
      link: "Ganhe um mês grátis ou 47% de desconto na compra vitalícia",
      note: "Presente de boas-vindas para inscritos · Você escolhe · Cancele quando quiser",
      eyebrow: "Um pequeno agradecimento",
      heading: "Qual presente de boas-vindas devo enviar para você?",
      choiceLegend: "Escolha seu presente",
      choiceMonth: "Um mês grátis do Full App",
      choiceMonthNote: "Sem pagamento, não é renovado",
      choiceLifetime: "47% de desconto no Full App vitalício",
      choiceLifetimeNote: "Pague uma vez, é seu para sempre",
      emailLabel: "Endereço de e-mail",
      placeholder: "voce@exemplo.com",
      consent: "Sim, tenho 16 anos ou mais. Quero receber novidades ocasionais do Control My Mac e dos outros apps do Sebastian.",
      required: "Obrigatório",
      detail: "Seu e-mail traz seu código pessoal e passos simples para resgatá-lo. De vez em quando, você também vai receber novidades de apps e códigos promocionais de pequenas ferramentas feitas para deixar o dia a dia mais fácil e melhor. Cancele a inscrição quando quiser.",
      privacyLead: "Como tratamos seu e-mail:",
      privacyLink: "Política de Privacidade",
      preparing: "Preparando o formulário seguro…",
      submit: "Enviar o código",
      sending: "Enviando…",
      fine: "Nenhum pagamento neste site. Se você escolher 47% de desconto na compra vitalícia, paga o preço com desconto na App Store. Você pode cancelar a inscrição nas novidades a qualquer momento.",
      errEmail: "Digite um endereço de e-mail válido para continuar.",
      errConsent: "Inscreva-se nos e-mails de novidades para receber o presente de boas-vindas.",
      errWait: "Aguarde a verificação de segurança terminar.",
      errTurnstile: "Não foi possível carregar a verificação de segurança. Tente novamente.",
      errUnavailable: "O presente para inscritos não está disponível no momento. Tente novamente mais tarde.",
      errCheck: "Confira seu endereço de e-mail e conclua a verificação de segurança; depois tente novamente.",
      errRate: "Muitas tentativas. Tente novamente em dez minutos.",
      errGeneric: "Não foi possível enviar o código. Tente novamente.",
      errClaimed: "Este endereço de e-mail já recebeu seu código. Cada endereço pode receber o presente uma única vez.",
      okEyebrow: "Pedido recebido",
      okHeading: "Confira sua caixa de entrada.",
      okCopy: "Aceitamos o pedido para {email}. Seu e-mail traz seu código pessoal, um botão para resgatá-lo na App Store, os passos no app e um link para cancelar a inscrição.",
      okQueued: "Aceitamos o pedido para {email}. Seu código será enviado por e-mail assim que estiver pronto.",
      okPreview: "Apenas prévia. Nenhum e-mail foi enviado e nada foi salvo.",
      done: "Concluído",
      close: "Fechar",
      security: "Verificação de segurança"
    },
    nl: {
      link: "Krijg een gratis maand of 47% korting op de levenslange aankoop",
      note: "Welkomstcadeau voor abonnees · Jij kiest · Altijd afmelden",
      eyebrow: "Een klein bedankje",
      heading: "Welk welkomstcadeau mag ik je sturen?",
      choiceLegend: "Kies je cadeau",
      choiceMonth: "Een gratis maand Full App",
      choiceMonthNote: "Geen betaling, wordt niet verlengd",
      choiceLifetime: "47% korting op Full App levenslang",
      choiceLifetimeNote: "Eén keer betalen, voor altijd van jou",
      emailLabel: "E-mailadres",
      placeholder: "jij@voorbeeld.nl",
      consent: "Ja, ik ben 16 jaar of ouder. Stuur me af en toe nieuws over Control My Mac en de andere apps van Sebastian.",
      required: "Verplicht",
      detail: "Je e-mail bevat je persoonlijke code en eenvoudige stappen om hem in te wisselen. Je krijgt ook af en toe app-nieuws en promocodes voor kleine tools die het dagelijks leven makkelijker en beter maken. Altijd afmelden.",
      privacyLead: "Zo gaan we om met je e-mailadres:",
      privacyLink: "Privacybeleid",
      preparing: "Beveiligd formulier wordt voorbereid…",
      submit: "Code versturen",
      sending: "Versturen…",
      fine: "Op deze site betaal je niets. Kies je 47% korting op de levenslange aankoop, dan betaal je de kortingsprijs in de App Store. Je kunt je altijd afmelden voor updates.",
      errEmail: "Vul een geldig e-mailadres in om door te gaan.",
      errConsent: "Meld je aan voor de nieuwsmails om het welkomstcadeau te ontvangen.",
      errWait: "Wacht tot de beveiligingscontrole klaar is.",
      errTurnstile: "De beveiligingscontrole kon niet worden geladen. Probeer het opnieuw.",
      errUnavailable: "Het welkomstcadeau is nu niet beschikbaar. Probeer het later opnieuw.",
      errCheck: "Controleer je e-mailadres en voltooi de beveiligingscontrole, en probeer het daarna opnieuw.",
      errRate: "Te veel pogingen. Probeer het over tien minuten opnieuw.",
      errGeneric: "De code kon niet worden verstuurd. Probeer het opnieuw.",
      errClaimed: "Dit e-mailadres heeft zijn code al ontvangen. Elk adres kan het cadeau maar één keer krijgen.",
      okEyebrow: "Aanvraag ontvangen",
      okHeading: "Kijk in je inbox.",
      okCopy: "We hebben de aanvraag voor {email} geaccepteerd. Je e-mail bevat je persoonlijke code, een knop om hem in de App Store in te wisselen, de stappen in de app en een afmeldlink.",
      okQueued: "We hebben de aanvraag voor {email} geaccepteerd. Je code wordt gemaild zodra hij klaar is.",
      okPreview: "Alleen voorbeeld. Er is geen e-mail verstuurd en niets opgeslagen.",
      done: "Klaar",
      close: "Sluiten",
      security: "Beveiligingscontrole"
    },
    ja: {
      link: "Full Appの無料1か月か、買い切り47%オフを受け取る",
      note: "登録特典 · お好きな方を選べます · いつでも配信停止可能",
      eyebrow: "ささやかなお礼です",
      heading: "どちらの登録特典をお送りしましょうか？",
      choiceLegend: "特典を選んでください",
      choiceMonth: "Full Appの無料1か月",
      choiceMonthNote: "お支払い不要、自動更新なし",
      choiceLifetime: "Full Appの買い切りが47%オフ",
      choiceLifetimeNote: "一度の購入でずっと使える",
      emailLabel: "メールアドレス",
      placeholder: "you@example.com",
      consent: "はい、16歳以上です。Control My MacとSebastianのほかのアプリのお知らせをときどき受け取ります。",
      required: "必須",
      detail: "メールには、専用コードとかんたんな利用手順が記載されています。毎日の暮らしをもっと簡単で快適にする小さなツールについて、アプリのお知らせやプロモーションコードもときどきお届けします。いつでも配信停止できます。",
      privacyLead: "メールアドレスの取り扱いについて：",
      privacyLink: "プライバシーポリシー",
      preparing: "安全なフォームを準備しています…",
      submit: "コードを送信",
      sending: "送信中…",
      fine: "このサイトでのお支払いはありません。買い切り47%オフを選んだ場合は、割引価格をApp Storeでお支払いいただきます。お知らせの配信はいつでも停止できます。",
      errEmail: "続けるには有効なメールアドレスを入力してください。",
      errConsent: "登録特典を受け取るには、お知らせメールに登録してください。",
      errWait: "セキュリティチェックが完了するまでお待ちください。",
      errTurnstile: "セキュリティチェックを読み込めませんでした。もう一度お試しください。",
      errUnavailable: "登録特典は現在ご利用いただけません。しばらくしてからもう一度お試しください。",
      errCheck: "メールアドレスを確認し、セキュリティチェックを完了してから、もう一度お試しください。",
      errRate: "試行回数が多すぎます。10分後にもう一度お試しください。",
      errGeneric: "コードを送信できませんでした。もう一度お試しください。",
      errClaimed: "このメールアドレスには、すでにコードをお送りしています。特典は1つのアドレスにつき1回限りです。",
      okEyebrow: "リクエストを受け付けました",
      okHeading: "受信トレイをご確認ください。",
      okCopy: "{email} へのリクエストを受け付けました。メールには、あなた専用のコード、App Storeで引き換えるためのボタン、アプリ内での手順、配信停止リンクが含まれています。",
      okQueued: "{email} へのリクエストを受け付けました。コードは準備ができ次第メールでお送りします。",
      okPreview: "プレビューのみです。メールは送信されず、何も保存されていません。",
      done: "完了",
      close: "閉じる",
      security: "セキュリティチェック"
    },
    zh: {
      link: "免费领取一个月，或终身买断立减 47%",
      note: "订阅欢迎礼 · 任你选择 · 可随时退订",
      eyebrow: "一点小心意",
      heading: "我该送你哪份欢迎礼？",
      choiceLegend: "选择你的礼物",
      choiceMonth: "Full App 免费一个月",
      choiceMonthNote: "无需付款，不会续订",
      choiceLifetime: "Full App 终身买断立减 47%",
      choiceLifetimeNote: "一次付款，永久使用",
      emailLabel: "电子邮件地址",
      placeholder: "you@example.com",
      consent: "是的，我已年满 16 岁。请偶尔向我发送 Control My Mac 和 Sebastian 其他应用的新闻。",
      required: "必填",
      detail: "你的邮件包含你的专属代码和简单的兑换步骤。你还会不定期收到 App 新闻，以及一些让日常生活更轻松、更美好的小工具的优惠代码。可随时退订。",
      privacyLead: "我们如何处理你的邮箱地址：",
      privacyLink: "隐私政策",
      preparing: "正在准备安全表单…",
      submit: "发送代码",
      sending: "正在发送…",
      fine: "本网站不收取任何费用。如果你选择终身买断立减 47%，需在 App Store 支付优惠后的价格。你可以随时退订更新。",
      errEmail: "请输入有效的电子邮件地址以继续。",
      errConsent: "订阅新闻邮件即可领取订阅欢迎礼。",
      errWait: "请等待安全检查完成。",
      errTurnstile: "无法加载安全检查。请重试。",
      errUnavailable: "订阅欢迎礼目前无法领取。请稍后再试。",
      errCheck: "请检查你的电子邮件地址并完成安全检查，然后重试。",
      errRate: "尝试次数过多。请在十分钟后重试。",
      errGeneric: "无法发送代码。请重试。",
      errClaimed: "这个邮箱已经领取过代码。每个邮箱只能领取一次礼物。",
      okEyebrow: "已收到请求",
      okHeading: "请查看你的收件箱。",
      okCopy: "我们已接受 {email} 的请求。你的邮件中包含专属代码、在 App Store 中兑换的按钮、App 内兑换步骤以及退订链接。",
      okQueued: "我们已接受 {email} 的请求。代码准备好后会立即通过邮件发送给你。",
      okPreview: "仅为预览。没有发送邮件，也没有保存任何内容。",
      done: "完成",
      close: "关闭",
      security: "安全检查"
    },
    ko: {
      link: "Full App 무료 한 달 또는 평생 구매 47% 할인 받기",
      note: "구독자 환영 선물 · 원하는 선물 선택 · 언제든지 구독 취소",
      eyebrow: "작은 감사의 선물",
      heading: "어떤 환영 선물을 보내 드릴까요?",
      choiceLegend: "선물을 선택하세요",
      choiceMonth: "Full App 무료 한 달",
      choiceMonthNote: "결제 없음, 자동 갱신 없음",
      choiceLifetime: "Full App 평생 구매 47% 할인",
      choiceLifetimeNote: "한 번 결제로 평생 사용",
      emailLabel: "이메일 주소",
      placeholder: "you@example.com",
      consent: "네, 저는 16세 이상입니다. Control My Mac과 Sebastian의 다른 앱 소식을 가끔 받겠습니다.",
      required: "필수",
      detail: "이메일에는 개인 코드와 간단한 사용 방법이 들어 있습니다. 일상을 더 쉽고 좋게 만드는 작은 도구에 대한 앱 소식과 프로모션 코드도 가끔 보내 드립니다. 언제든지 구독을 취소할 수 있습니다.",
      privacyLead: "이메일 주소 처리 방식:",
      privacyLink: "개인정보 처리방침",
      preparing: "보안 양식을 준비하는 중…",
      submit: "코드 보내기",
      sending: "보내는 중…",
      fine: "이 사이트에서는 결제하지 않습니다. 평생 구매 47% 할인을 선택하면 할인된 가격을 App Store에서 결제합니다. 소식 수신은 언제든지 취소할 수 있습니다.",
      errEmail: "계속하려면 올바른 이메일 주소를 입력하세요.",
      errConsent: "구독자 환영 선물을 받으려면 소식 이메일을 구독하세요.",
      errWait: "보안 확인이 끝날 때까지 기다려 주세요.",
      errTurnstile: "보안 확인을 불러올 수 없습니다. 다시 시도하세요.",
      errUnavailable: "지금은 구독자 환영 선물을 받을 수 없습니다. 나중에 다시 시도하세요.",
      errCheck: "이메일 주소를 확인하고 보안 확인을 완료한 다음 다시 시도하세요.",
      errRate: "시도 횟수가 너무 많습니다. 10분 후에 다시 시도하세요.",
      errGeneric: "코드를 보낼 수 없습니다. 다시 시도하세요.",
      errClaimed: "이 이메일 주소로는 이미 코드를 보내 드렸습니다. 선물은 주소당 한 번만 받을 수 있습니다.",
      okEyebrow: "요청이 접수되었습니다",
      okHeading: "받은 편지함을 확인하세요.",
      okCopy: "{email}에 대한 요청을 접수했습니다. 이메일에는 전용 코드, App Store에서 바로 사용할 수 있는 버튼, 앱에서 사용하는 방법, 구독 취소 링크가 들어 있습니다.",
      okQueued: "{email}에 대한 요청을 접수했습니다. 코드가 준비되는 대로 이메일로 보내 드립니다.",
      okPreview: "미리보기입니다. 이메일이 전송되지 않았고 아무것도 저장되지 않았습니다.",
      done: "완료",
      close: "닫기",
      security: "보안 확인"
    },
    ru: {
      link: "Получите бесплатный месяц или скидку 47% на пожизненный доступ",
      note: "Приветственный подарок подписчикам · На ваш выбор · Отписаться можно в любой момент",
      eyebrow: "Небольшое спасибо",
      heading: "Какой приветственный подарок вам отправить?",
      choiceLegend: "Выберите подарок",
      choiceMonth: "Бесплатный месяц Full App",
      choiceMonthNote: "Без оплаты, не продлевается",
      choiceLifetime: "Скидка 47% на пожизненный доступ к Full App",
      choiceLifetimeNote: "Платите один раз, пользуйтесь всегда",
      emailLabel: "Адрес эл. почты",
      placeholder: "you@example.com",
      consent: "Да, мне 16 лет или больше. Присылайте мне иногда новости о Control My Mac и других приложениях Sebastian Škoić s.p.",
      required: "Обязательно",
      detail: "В письме будут ваш личный код и простые шаги для активации. Также мы будем иногда присылать новости приложений и промокоды на небольшие инструменты, которые делают повседневную жизнь проще и лучше. Отписаться можно в любой момент.",
      privacyLead: "Как мы обращаемся с вашим адресом:",
      privacyLink: "Политика конфиденциальности",
      preparing: "Подготовка защищённой формы…",
      submit: "Отправить код",
      sending: "Отправка…",
      fine: "На этом сайте ничего не нужно оплачивать. Если вы выберете скидку 47% на пожизненный доступ, цену со скидкой вы заплатите в App Store. Отписаться от новостей можно в любой момент.",
      errEmail: "Введите действительный адрес эл. почты, чтобы продолжить.",
      errConsent: "Подпишитесь на письма с новостями, чтобы получить приветственный подарок.",
      errWait: "Дождитесь окончания проверки безопасности.",
      errTurnstile: "Не удалось загрузить проверку безопасности. Попробуйте ещё раз.",
      errUnavailable: "Подарок для подписчиков сейчас недоступен. Попробуйте позже.",
      errCheck: "Проверьте адрес эл. почты и пройдите проверку безопасности, затем попробуйте ещё раз.",
      errRate: "Слишком много попыток. Попробуйте ещё раз через десять минут.",
      errGeneric: "Не удалось отправить код. Попробуйте ещё раз.",
      errClaimed: "На этот адрес уже отправлен код. Каждый адрес может получить подарок только один раз.",
      okEyebrow: "Запрос получен",
      okHeading: "Проверьте почту.",
      okCopy: "Мы приняли запрос для {email}. В письме будут ваш личный код, кнопка для активации в App Store, шаги в приложении и ссылка для отписки.",
      okQueued: "Мы приняли запрос для {email}. Код придёт на почту, как только будет готов.",
      okPreview: "Только предпросмотр. Письмо не отправлено, ничего не сохранено.",
      done: "Готово",
      close: "Закрыть",
      security: "Проверка безопасности"
    },
    pl: {
      link: "Odbierz darmowy miesiąc lub 47 % zniżki na Lifetime",
      note: "Prezent powitalny dla subskrybentów · Ty wybierasz · Wypisz się w każdej chwili",
      eyebrow: "Małe podziękowanie",
      heading: "Który prezent powitalny mam Ci wysłać?",
      choiceLegend: "Wybierz prezent",
      choiceMonth: "Darmowy miesiąc Full App",
      choiceMonthNote: "Bez płatności, nie odnawia się",
      choiceLifetime: "47 % zniżki na Full App Lifetime",
      choiceLifetimeNote: "Płacisz raz, masz na zawsze",
      emailLabel: "Adres e-mail",
      placeholder: "ty@przyklad.pl",
      consent: "Tak, mam ukończone 16 lat. Wysyłaj mi od czasu do czasu nowości o Control My Mac i Twoich pozostałych aplikacjach.",
      required: "Wymagane",
      detail: "Twój e-mail zawiera osobisty kod i proste kroki jego realizacji. Od czasu do czasu otrzymasz też nowości o aplikacjach i kody promocyjne na małe narzędzia, które ułatwiają i umilają codzienne życie. Wypisz się w każdej chwili.",
      privacyLead: "Jak przetwarzamy Twój adres e-mail:",
      privacyLink: "Polityka prywatności",
      preparing: "Przygotowywanie bezpiecznego formularza…",
      submit: "Wyślij kod",
      sending: "Wysyłanie…",
      fine: "Na tej stronie nic nie płacisz. Jeśli wybierzesz 47 % zniżki na Lifetime, obniżoną cenę zapłacisz w App Store. Z aktualizacji możesz się wypisać w każdej chwili.",
      errEmail: "Wpisz prawidłowy adres e-mail, aby kontynuować.",
      errConsent: "Zapisz się na e-maile z nowościami, aby otrzymać prezent powitalny.",
      errWait: "Poczekaj na zakończenie weryfikacji bezpieczeństwa.",
      errTurnstile: "Nie udało się wczytać weryfikacji bezpieczeństwa. Spróbuj ponownie.",
      errUnavailable: "Prezent dla subskrybentów jest teraz niedostępny. Spróbuj ponownie później.",
      errCheck: "Sprawdź adres e-mail i dokończ weryfikację bezpieczeństwa, a potem spróbuj ponownie.",
      errRate: "Zbyt wiele prób. Spróbuj ponownie za dziesięć minut.",
      errGeneric: "Nie udało się wysłać kodu. Spróbuj ponownie.",
      errClaimed: "Ten adres e-mail otrzymał już swój kod. Każdy adres może odebrać prezent tylko raz.",
      okEyebrow: "Prośba przyjęta",
      okHeading: "Sprawdź skrzynkę odbiorczą.",
      okCopy: "Przyjęliśmy prośbę dla {email}. Twój e-mail zawiera osobisty kod, przycisk do realizacji w App Store, kroki w aplikacji i link do wypisania się.",
      okQueued: "Przyjęliśmy prośbę dla {email}. Twój kod wyślemy e-mailem, gdy tylko będzie gotowy.",
      okPreview: "Tylko podgląd. Nie wysłano żadnego e-maila i nic nie zapisano.",
      done: "Gotowe",
      close: "Zamknij",
      security: "Weryfikacja bezpieczeństwa"
    },
    tr: {
      link: "Ücretsiz bir ay ya da ömür boyu Full App’te %47 indirim al",
      note: "Abonelere hoş geldin hediyesi · Seçim senin · İstediğin zaman aboneliği bırak",
      eyebrow: "Küçük bir teşekkür",
      heading: "Sana hangi hoş geldin hediyesini göndereyim?",
      choiceLegend: "Hediyeni seç",
      choiceMonth: "Bir ay ücretsiz Full App",
      choiceMonthNote: "Ödeme yok, yenilenmez",
      choiceLifetime: "Ömür boyu Full App’te %47 indirim",
      choiceLifetimeNote: "Bir kez öde, sonsuza dek kullan",
      emailLabel: "E-posta adresi",
      placeholder: "sen@ornek.com",
      consent: "Evet, 16 yaşında veya daha büyüğüm. Bana ara sıra Control My Mac ve Sebastian'ın diğer uygulamaları hakkında haberler gönder.",
      required: "Zorunlu",
      detail: "E-postanda kişisel kodun ve kodu kullanmak için basit adımlar bulunur. Ayrıca ara sıra uygulama haberleri ve günlük hayatı daha kolay ve daha iyi hâle getiren küçük araçlar için promosyon kodları alırsın. İstediğin zaman aboneliği bırakabilirsin.",
      privacyLead: "E-posta adresini nasıl işlediğimiz:",
      privacyLink: "Gizlilik Politikası",
      preparing: "Güvenli form hazırlanıyor…",
      submit: "Kodu gönder",
      sending: "Gönderiliyor…",
      fine: "Bu sitede ödeme yapılmaz. Ömür boyu Full App’te %47 indirimi seçersen indirimli fiyatı App Store’da ödersin. Güncellemelerden istediğin zaman çıkabilirsin.",
      errEmail: "Devam etmek için geçerli bir e-posta adresi gir.",
      errConsent: "Hoş geldin hediyesini almak için haber e-postalarına kaydol.",
      errWait: "Lütfen güvenlik kontrolünün bitmesini bekle.",
      errTurnstile: "Güvenlik kontrolü yüklenemedi. Lütfen tekrar dene.",
      errUnavailable: "Hoş geldin hediyesi şu anda kullanılamıyor. Lütfen daha sonra tekrar dene.",
      errCheck: "E-posta adresini kontrol et ve güvenlik kontrolünü tamamla, sonra tekrar dene.",
      errRate: "Çok fazla deneme. Lütfen on dakika sonra tekrar dene.",
      errGeneric: "Kod gönderilemedi. Lütfen tekrar dene.",
      errClaimed: "Bu e-posta adresine kod zaten gönderildi. Her adres hediyeyi yalnızca bir kez alabilir.",
      okEyebrow: "İstek alındı",
      okHeading: "Gelen kutunu kontrol et.",
      okCopy: "{email} için isteği kabul ettik. E-postanda sana özel kod, App Store’da kullanmak için bir düğme, uygulama içi adımlar ve abonelikten çıkma bağlantısı bulunuyor.",
      okQueued: "{email} için isteği kabul ettik. Kodun hazır olur olmaz e-postayla gönderilecek.",
      okPreview: "Yalnızca önizleme. E-posta gönderilmedi ve hiçbir şey kaydedilmedi.",
      done: "Bitti",
      close: "Kapat",
      security: "Güvenlik kontrolü"
    },
    "zh-hant": {
      link: "免費一個月，或永久版現省 47%",
      note: "訂閱歡迎禮 · 任你選擇 · 可隨時取消訂閱",
      eyebrow: "一點小心意",
      heading: "我該寄給你哪一份歡迎禮？",
      choiceLegend: "選擇你的贈禮",
      choiceMonth: "Full App 免費一個月",
      choiceMonthNote: "不需付款，不會續訂",
      choiceLifetime: "Full App 永久版現省 47%",
      choiceLifetimeNote: "一次付清，永久使用",
      emailLabel: "電子郵件地址",
      placeholder: "you@example.com",
      consent: "好，我已年滿 16 歲。請不定期寄 Control My Mac 和 Sebastian 其他 App 的最新消息給我。",
      required: "必填",
      detail: "寄給你的電子郵件內含你的專屬代碼和簡單的兌換步驟。你也會不定期收到 App 的最新消息，以及一些能讓日常生活更輕鬆、更美好的小工具優惠代碼。可隨時取消訂閱。",
      privacyLead: "我們如何處理你的電子郵件地址：",
      privacyLink: "隱私權政策",
      preparing: "正在準備安全表單…",
      submit: "寄送代碼",
      sending: "正在寄送…",
      fine: "本網站不會收取任何費用。如果你選擇永久版現省 47%，優惠後的價格是在 App Store 支付。你可以隨時取消訂閱最新消息。",
      errEmail: "請輸入有效的電子郵件地址以繼續。",
      errConsent: "要領取訂閱歡迎禮，請先訂閱最新消息電子郵件。",
      errWait: "請等待安全檢查完成。",
      errTurnstile: "無法載入安全檢查。請再試一次。",
      errUnavailable: "目前無法領取訂閱歡迎禮。請稍後再試。",
      errCheck: "請檢查你的電子郵件地址並完成安全檢查，然後再試一次。",
      errRate: "嘗試次數過多。請在十分鐘後再試一次。",
      errGeneric: "無法寄送代碼。請再試一次。",
      errClaimed: "這個電子郵件地址已經領取過代碼。每個地址只能領取一次贈禮。",
      okEyebrow: "已收到申請",
      okHeading: "請查看你的收件匣。",
      okCopy: "我們已受理 {email} 的申請。寄給你的電子郵件內含你的專屬代碼、在 App Store 兌換的按鈕、在 App 內兌換的步驟，以及取消訂閱的連結。",
      okQueued: "我們已受理 {email} 的申請。代碼準備好後，會立即以電子郵件寄給你。",
      okPreview: "僅供預覽。沒有寄出任何電子郵件，也沒有儲存任何內容。",
      done: "完成",
      close: "關閉",
      security: "安全檢查"
    },
    uk: {
      link: "Отримати безкоштовний місяць або знижку 47% на довічний доступ",
      note: "Вітальний подарунок для підписників · На ваш вибір · Відписатися можна будь-коли",
      eyebrow: "Невелика подяка",
      heading: "Який вітальний подарунок вам надіслати?",
      choiceLegend: "Оберіть подарунок",
      choiceMonth: "Безкоштовний місяць Full App",
      choiceMonthNote: "Без оплати, не поновлюється",
      choiceLifetime: "Знижка 47% на довічний доступ до Full App",
      choiceLifetimeNote: "Платите один раз, користуєтеся завжди",
      emailLabel: "Адреса е-пошти",
      placeholder: "you@example.com",
      consent: "Так, мені 16 років або більше. Надсилайте мені час від часу новини про Control My Mac та інші програми Sebastian Škoić s.p.",
      required: "Обовʼязково",
      detail: "У листі буде ваш особистий код і прості кроки, як його використати. Час від часу ви також отримуватимете новини про програми й промокоди на невеликі інструменти, створені, щоб робити повсякденне життя простішим і кращим. Відписатися можна будь-коли.",
      privacyLead: "Як ми обробляємо вашу адресу е-пошти:",
      privacyLink: "Політика приватності",
      preparing: "Підготовка захищеної форми…",
      submit: "Надіслати код",
      sending: "Надсилання…",
      fine: "На цьому сайті нічого платити не потрібно. Якщо ви оберете знижку 47% на довічний доступ, ціну зі знижкою ви сплатите в App Store. Від новин можна відписатися будь-коли.",
      errEmail: "Щоб продовжити, введіть дійсну адресу е-пошти.",
      errConsent: "Щоб отримати вітальний подарунок для підписників, підпишіться на листи з новинами.",
      errWait: "Зачекайте, доки завершиться перевірка безпеки.",
      errTurnstile: "Не вдалося завантажити перевірку безпеки. Спробуйте ще раз.",
      errUnavailable: "Подарунок для підписників зараз недоступний. Спробуйте пізніше.",
      errCheck: "Перевірте адресу е-пошти й пройдіть перевірку безпеки, а потім спробуйте ще раз.",
      errRate: "Забагато спроб. Спробуйте ще раз за десять хвилин.",
      errGeneric: "Не вдалося надіслати код. Спробуйте ще раз.",
      errClaimed: "На цю адресу е-пошти вже надіслано код. Кожна адреса може отримати подарунок лише один раз.",
      okEyebrow: "Запит отримано",
      okHeading: "Перевірте пошту.",
      okCopy: "Ми прийняли запит для адреси {email}. У листі — ваш особистий код, кнопка, щоб використати його в App Store, кроки в програмі та посилання для відписки.",
      okQueued: "Ми прийняли запит для адреси {email}. Код надішлемо е-поштою, щойно він буде готовий.",
      okPreview: "Лише попередній перегляд. Жодного листа не надіслано, і нічого не збережено.",
      done: "Готово",
      close: "Закрити",
      security: "Перевірка безпеки"
    },
    sl: {
      link: "Pridobite brezplačen mesec ali 47 % popusta za Lifetime",
      note: "Darilo za dobrodošlico naročnikom e-novic · Izbira je vaša · Odjava kadar koli",
      eyebrow: "Majhna zahvala",
      heading: "Katero darilo za dobrodošlico naj vam pošljem?",
      choiceLegend: "Izberite darilo",
      choiceMonth: "Brezplačen mesec Full App",
      choiceMonthNote: "Brez plačila, se ne podaljša",
      choiceLifetime: "47 % popusta za Full App Lifetime",
      choiceLifetimeNote: "Plačate enkrat, imate za vedno",
      emailLabel: "E-poštni naslov",
      placeholder: "you@example.com",
      consent: "Da, imam 16 let ali več. Občasno mi pošiljajte novice o aplikaciji Control My Mac in o vaših drugih aplikacijah.",
      required: "Obvezno",
      detail: "E-poštno sporočilo, ki ga boste prejeli, vsebuje vašo osebno kodo in preprosta navodila za unovčenje. Občasno boste prejemali tudi novice o aplikacijah in promocijske kode za majhna orodja, zasnovana za lažje in boljše vsakdanje življenje. Odjavite se lahko kadar koli.",
      privacyLead: "Kako ravnamo z vašim e-poštnim naslovom:",
      privacyLink: "Pravilnik o zasebnosti",
      preparing: "Pripravljanje varnega obrazca …",
      submit: "Pošljite mi kodo",
      sending: "Pošiljanje …",
      fine: "Na tem spletnem mestu ne plačate ničesar. Če izberete 47 % popusta za Lifetime, znižano ceno plačate v trgovini App Store. Od novic se lahko kadar koli odjavite.",
      errEmail: "Za nadaljevanje vnesite veljaven e-poštni naslov.",
      errConsent: "Če želite prejeti darilo za dobrodošlico, se naročite na e-poštne novice.",
      errWait: "Počakajte, da se varnostno preverjanje konča.",
      errTurnstile: "Varnostnega preverjanja ni bilo mogoče naložiti. Poskusite znova.",
      errUnavailable: "Darilo za naročnike trenutno ni na voljo. Poskusite znova pozneje.",
      errCheck: "Preverite e-poštni naslov in opravite varnostno preverjanje, nato poskusite znova.",
      errRate: "Preveč poskusov. Poskusite znova čez deset minut.",
      errGeneric: "Kode ni bilo mogoče poslati. Poskusite znova.",
      errClaimed: "Na ta e-poštni naslov je bila koda že poslana. Vsak naslov lahko darilo prejme samo enkrat.",
      okEyebrow: "Zahteva je prejeta",
      okHeading: "Preverite e-poštni predal.",
      okCopy: "Zahtevo za naslov {email} smo sprejeli. E-poštno sporočilo vsebuje vašo osebno kodo, gumb za unovčenje v trgovini App Store, navodila za unovčenje v aplikaciji in povezavo za odjavo.",
      okQueued: "Zahtevo za naslov {email} smo sprejeli. Kodo vam bomo poslali po e-pošti, takoj ko bo pripravljena.",
      okPreview: "Samo predogled. Nobeno e-poštno sporočilo ni bilo poslano in nič ni bilo shranjeno.",
      done: "Dokončano",
      close: "Zapri",
      security: "Varnostno preverjanje"
    },
    cs: {
      link: "Získejte měsíc zdarma nebo slevu 47 % na Lifetime",
      note: "Uvítací dárek pro odběratele · Vyberete si sami · Odhlášení kdykoli",
      eyebrow: "Malé poděkování",
      heading: "Jaký uvítací dárek vám mám poslat?",
      choiceLegend: "Vyberte si dárek",
      choiceMonth: "Měsíc Full App zdarma",
      choiceMonthNote: "Bez platby, neobnovuje se",
      choiceLifetime: "Sleva 47 % na Full App Lifetime",
      choiceLifetimeNote: "Jednou zaplatíte, máte navždy",
      emailLabel: "E-mailová adresa",
      placeholder: "vy@example.com",
      consent: "Ano, je mi 16 let nebo více. Posílejte mi občas novinky o Control My Mac a vašich dalších aplikacích.",
      required: "Povinné",
      detail: "E-mail obsahuje váš osobní kód a jednoduchý postup, jak ho uplatnit. Občas vám také pošleme novinky o aplikacích a promo kódy na malé nástroje, které mají usnadnit a zlepšit každodenní život. Odhlásit se můžete kdykoli.",
      privacyLead: "Jak nakládáme s vaším e-mailem:",
      privacyLink: "Zásady ochrany osobních údajů",
      preparing: "Připravuje se zabezpečený formulář…",
      submit: "Odeslat kód",
      sending: "Odesílání…",
      fine: "Na tomto webu se nic neplatí. Pokud si vyberete slevu 47 % na Lifetime, zlevněnou cenu zaplatíte v App Storu. Odběr novinek můžete kdykoli zrušit.",
      errEmail: "Pro pokračování zadejte platnou e-mailovou adresu.",
      errConsent: "Přihlaste se k odběru e-mailů s novinkami, abyste získali uvítací dárek pro odběratele.",
      errWait: "Počkejte prosím, až se dokončí bezpečnostní kontrola.",
      errTurnstile: "Bezpečnostní kontrolu se nepodařilo načíst. Zkuste to prosím znovu.",
      errUnavailable: "Dárek pro odběratele teď není k dispozici. Zkuste to prosím později.",
      errCheck: "Zkontrolujte prosím e-mailovou adresu, dokončete bezpečnostní kontrolu a zkuste to znovu.",
      errRate: "Příliš mnoho pokusů. Zkuste to prosím znovu za deset minut.",
      errGeneric: "Kód se nepodařilo odeslat. Zkuste to prosím znovu.",
      errClaimed: "Na tuto e-mailovou adresu už byl kód odeslán. Každá adresa může dárek získat jen jednou.",
      okEyebrow: "Žádost přijata",
      okHeading: "Podívejte se do schránky.",
      okCopy: "Žádost pro adresu {email} jsme přijali. E-mail obsahuje váš osobní kód, tlačítko pro uplatnění v App Storu, postup v aplikaci a odkaz pro odhlášení.",
      okQueued: "Žádost pro adresu {email} jsme přijali. Kód vám pošleme e-mailem, jakmile bude připraven.",
      okPreview: "Pouze náhled. Žádný e-mail nebyl odeslán a nic se neuložilo.",
      done: "Hotovo",
      close: "Zavřít",
      security: "Bezpečnostní kontrola"
    },
    sk: {
      link: "Získajte mesiac zadarmo alebo zľavu 47 % na Lifetime",
      note: "Uvítací darček pre odberateľov · Vyberiete si sami · Odhlásiť sa môžete kedykoľvek",
      eyebrow: "Malé poďakovanie",
      heading: "Aký uvítací darček vám mám poslať?",
      choiceLegend: "Vyberte si darček",
      choiceMonth: "Mesiac Full App zadarmo",
      choiceMonthNote: "Bez platby, neobnovuje sa",
      choiceLifetime: "Zľava 47 % na Full App Lifetime",
      choiceLifetimeNote: "Zaplatíte raz, máte navždy",
      emailLabel: "E-mailová adresa",
      placeholder: "you@example.com",
      consent: "Áno, mám aspoň 16 rokov. Posielajte mi občas novinky o Control My Mac a vašich ďalších aplikáciách.",
      required: "Povinné",
      detail: "Váš e-mail bude obsahovať osobný kód a jednoduchý postup, ako ho uplatniť. Občas dostanete aj novinky o aplikáciách a promo kódy na malé nástroje, ktoré majú uľahčiť a zlepšiť každodenný život. Odhlásiť sa môžete kedykoľvek.",
      privacyLead: "Ako nakladáme s vaším e-mailom:",
      privacyLink: "Zásady ochrany súkromia",
      preparing: "Pripravuje sa zabezpečený formulár…",
      submit: "Poslať kód",
      sending: "Odosiela sa…",
      fine: "Na tejto stránke sa nič neplatí. Ak si vyberiete zľavu 47 % na Lifetime, zľavnenú cenu zaplatíte v App Store. Z odberu noviniek sa môžete odhlásiť kedykoľvek.",
      errEmail: "Ak chcete pokračovať, zadajte platnú e-mailovú adresu.",
      errConsent: "Ak chcete získať uvítací darček pre odberateľov, prihláste sa na odber e-mailov s novinkami.",
      errWait: "Počkajte, kým sa dokončí bezpečnostná kontrola.",
      errTurnstile: "Bezpečnostnú kontrolu sa nepodarilo načítať. Skúste to, prosím, znova.",
      errUnavailable: "Darček pre odberateľov teraz nie je dostupný. Skúste to, prosím, neskôr.",
      errCheck: "Skontrolujte svoju e-mailovú adresu, dokončite bezpečnostnú kontrolu a skúste to znova.",
      errRate: "Príliš veľa pokusov. Skúste to, prosím, znova o desať minút.",
      errGeneric: "Kód sa nepodarilo odoslať. Skúste to, prosím, znova.",
      errClaimed: "Táto e-mailová adresa už svoj kód dostala. Každá adresa si môže darček vyžiadať iba raz.",
      okEyebrow: "Žiadosť prijatá",
      okHeading: "Pozrite si doručenú poštu.",
      okCopy: "Žiadosť pre adresu {email} sme prijali. Váš e-mail obsahuje osobný kód, tlačidlo na jeho uplatnenie v App Store, postup v aplikácii a odkaz na odhlásenie z odberu.",
      okQueued: "Žiadosť pre adresu {email} sme prijali. Kód vám pošleme e-mailom hneď, ako bude pripravený.",
      okPreview: "Iba ukážka. Žiadny e-mail sa neodoslal a nič sa neuložilo.",
      done: "Hotovo",
      close: "Zatvoriť",
      security: "Bezpečnostná kontrola"
    },
    sv: {
      link: "Få en gratis månad eller 47 % rabatt på livstidsköpet",
      note: "Välkomstgåva till prenumeranter · Du väljer · Avsluta prenumerationen när du vill",
      eyebrow: "Ett litet tack",
      heading: "Vilken välkomstgåva ska jag skicka till dig?",
      choiceLegend: "Välj din gåva",
      choiceMonth: "En gratis månad av Full App",
      choiceMonthNote: "Ingen betalning, förnyas inte",
      choiceLifetime: "47 % rabatt på Full App för livstid",
      choiceLifetimeNote: "Betala en gång, behåll den för alltid",
      emailLabel: "E-postadress",
      placeholder: "du@exempel.se",
      consent: "Ja, jag är 16 år eller äldre. Skicka nyheter om Control My Mac och Sebastians andra appar till mig då och då.",
      required: "Obligatoriskt",
      detail: "Mejlet du får innehåller din personliga kod och enkla steg för att lösa in den. Du får också då och då appnyheter och kampanjkoder för små verktyg som är gjorda för att göra vardagen enklare och bättre. Avsluta prenumerationen när du vill.",
      privacyLead: "Så hanterar vi din e-postadress:",
      privacyLink: "Integritetspolicy",
      preparing: "Förbereder det säkra formuläret…",
      submit: "Skicka koden",
      sending: "Skickar…",
      fine: "Ingen betalning sker på den här webbplatsen. Om du väljer 47 % rabatt på livstidsköpet betalar du det rabatterade priset i App Store. Du kan avsluta prenumerationen på uppdateringar när du vill.",
      errEmail: "Ange en giltig e-postadress för att fortsätta.",
      errConsent: "Anmäl dig till nyhetsutskicken för att få välkomstgåvan till prenumeranter.",
      errWait: "Vänta tills säkerhetskontrollen är klar.",
      errTurnstile: "Det gick inte att läsa in säkerhetskontrollen. Försök igen.",
      errUnavailable: "Välkomstgåvan är inte tillgänglig just nu. Försök igen senare.",
      errCheck: "Kontrollera din e-postadress och slutför säkerhetskontrollen, och försök sedan igen.",
      errRate: "För många försök. Försök igen om tio minuter.",
      errGeneric: "Det gick inte att skicka koden. Försök igen.",
      errClaimed: "Den här e-postadressen har redan fått sin kod. Varje adress kan hämta gåvan en gång.",
      okEyebrow: "Begäran mottagen",
      okHeading: "Kolla din inkorg.",
      okCopy: "Vi har tagit emot begäran för {email}. Mejlet du får innehåller din personliga kod, en knapp för att lösa in den i App Store, stegen i appen och en länk för att avsluta prenumerationen.",
      okQueued: "Vi har tagit emot begäran för {email}. Din kod skickas med e-post så fort den är klar.",
      okPreview: "Endast förhandsvisning. Inget e-postmeddelande skickades och ingenting sparades.",
      done: "Klar",
      close: "Stäng",
      security: "Säkerhetskontroll"
    },
    no: {
      link: "Få en gratis måned eller 47 % rabatt på livstidskjøpet",
      note: "Velkomstgave til abonnenter · Du velger · Meld deg av når som helst",
      eyebrow: "En liten takk",
      heading: "Hvilken velkomstgave skal jeg sende deg?",
      choiceLegend: "Velg gaven din",
      choiceMonth: "En gratis måned med Full App",
      choiceMonthNote: "Ingen betaling, fornyes ikke",
      choiceLifetime: "47 % rabatt på Full App for livstid",
      choiceLifetimeNote: "Betal én gang, behold den for alltid",
      emailLabel: "E-postadresse",
      placeholder: "deg@eksempel.no",
      consent: "Ja, jeg er 16 år eller eldre. Send meg av og til nyheter om Control My Mac og Sebastians andre apper.",
      required: "Obligatorisk",
      detail: "E-posten inneholder din personlige kode og enkle trinn for å løse den inn. Du får også av og til appnyheter og kampanjekoder for små verktøy som skal gjøre hverdagen enklere og bedre. Meld deg av når som helst.",
      privacyLead: "Slik behandler vi e-postadressen din:",
      privacyLink: "Personvernerklæring",
      preparing: "Klargjør det sikre skjemaet…",
      submit: "Send koden",
      sending: "Sender…",
      fine: "Ingen betaling på dette nettstedet. Hvis du velger 47 % rabatt på livstidskjøpet, betaler du den rabatterte prisen i App Store. Du kan melde deg av oppdateringer når som helst.",
      errEmail: "Skriv inn en gyldig e-postadresse for å fortsette.",
      errConsent: "Abonner på e-postene med nyheter for å få velkomstgaven til abonnenter.",
      errWait: "Vent til sikkerhetskontrollen er ferdig.",
      errTurnstile: "Sikkerhetskontrollen kunne ikke lastes inn. Prøv igjen.",
      errUnavailable: "Velkomstgaven er ikke tilgjengelig akkurat nå. Prøv igjen senere.",
      errCheck: "Kontroller e-postadressen din og fullfør sikkerhetskontrollen, og prøv deretter igjen.",
      errRate: "For mange forsøk. Prøv igjen om ti minutter.",
      errGeneric: "Koden kunne ikke sendes. Prøv igjen.",
      errClaimed: "Denne e-postadressen har allerede fått koden sin. Hver adresse kan hente gaven én gang.",
      okEyebrow: "Forespørselen er mottatt",
      okHeading: "Sjekk innboksen din.",
      okCopy: "Vi har godtatt forespørselen for {email}. E-posten inneholder din personlige kode, en knapp for å løse den inn i App Store, trinnene i appen og en lenke for å melde seg av.",
      okQueued: "Vi har godtatt forespørselen for {email}. Koden sendes på e-post så snart den er klar.",
      okPreview: "Bare forhåndsvisning. Ingen e-post ble sendt, og ingenting ble lagret.",
      done: "Ferdig",
      close: "Lukk",
      security: "Sikkerhetskontroll"
    },
    da: {
      link: "Få en gratis måned eller 47 % rabat på Lifetime",
      note: "Velkomstgave til abonnenter · Du vælger selv · Afmeld når som helst",
      eyebrow: "Et lille tak",
      heading: "Hvilken velkomstgave skal jeg sende dig?",
      choiceLegend: "Vælg din gave",
      choiceMonth: "En gratis måned med Full App",
      choiceMonthNote: "Ingen betaling, fornyes ikke",
      choiceLifetime: "47 % rabat på Full App Lifetime",
      choiceLifetimeNote: "Betal én gang, behold den for altid",
      emailLabel: "E-mailadresse",
      placeholder: "you@example.com",
      consent: "Ja, jeg er fyldt 16 år. Send mig en gang imellem nyheder om Control My Mac og Sebastians andre apps.",
      required: "Påkrævet",
      detail: "Din e-mail indeholder din personlige kode og enkle trin til at indløse den. Du får også en gang imellem nyheder om appen og tilbudskoder til små værktøjer, der skal gøre hverdagen lettere og bedre. Afmeld når som helst.",
      privacyLead: "Sådan behandler vi din e-mailadresse:",
      privacyLink: "Privatlivspolitik",
      preparing: "Klargør den sikre formular…",
      submit: "Send koden",
      sending: "Sender…",
      fine: "Der betales ikke noget på dette websted. Hvis du vælger 47 % rabat på Lifetime, betaler du den nedsatte pris i App Store. Du kan afmelde opdateringer når som helst.",
      errEmail: "Indtast en gyldig e-mailadresse for at fortsætte.",
      errConsent: "Tilmeld dig nyhedsmailene for at modtage velkomstgaven til abonnenter.",
      errWait: "Vent, til sikkerhedstjekket er færdigt.",
      errTurnstile: "Sikkerhedstjekket kunne ikke indlæses. Prøv igen.",
      errUnavailable: "Velkomstgaven til abonnenter er ikke tilgængelig lige nu. Prøv igen senere.",
      errCheck: "Tjek din e-mailadresse, gennemfør sikkerhedstjekket, og prøv igen.",
      errRate: "For mange forsøg. Prøv igen om ti minutter.",
      errGeneric: "Koden kunne ikke sendes. Prøv igen.",
      errClaimed: "Denne e-mailadresse har allerede fået sin kode. Hver adresse kan kun få gaven én gang.",
      okEyebrow: "Anmodning modtaget",
      okHeading: "Tjek din indbakke.",
      okCopy: "Vi har accepteret anmodningen for {email}. Din e-mail indeholder din personlige kode, en knap til at indløse den i App Store, trinnene i appen og et link til at afmelde dig.",
      okQueued: "Vi har accepteret anmodningen for {email}. Din kode sendes på e-mail, så snart den er klar.",
      okPreview: "Kun forhåndsvisning. Der blev ikke sendt nogen e-mail, og intet blev gemt.",
      done: "Færdig",
      close: "Luk",
      security: "Sikkerhedstjek"
    },
    fi: {
      link: "Hanki ilmainen kuukausi tai 47 %:n alennus Lifetimesta",
      note: "Tervetuliaislahja tilaajille · Sinä valitset · Tilauksen voi perua milloin tahansa",
      eyebrow: "Pieni kiitos",
      heading: "Minkä tervetuliaislahjan lähetän sinulle?",
      choiceLegend: "Valitse lahjasi",
      choiceMonth: "Ilmainen kuukausi Full Appia",
      choiceMonthNote: "Ei maksua, ei uusiudu",
      choiceLifetime: "47 %:n alennus Full App Lifetimesta",
      choiceLifetimeNote: "Maksa kerran, pidä ikuisesti",
      emailLabel: "Sähköpostiosoite",
      placeholder: "you@example.com",
      consent: "Kyllä, olen vähintään 16-vuotias. Lähetä minulle silloin tällöin uutisia Control My Macista ja Sebastianin muista sovelluksista.",
      required: "Pakollinen",
      detail: "Saamassasi viestissä on henkilökohtainen koodisi ja yksinkertaiset ohjeet sen lunastamiseen. Saat myös silloin tällöin sovellusuutisia ja tarjouskoodeja pieniin työkaluihin, jotka tekevät arjesta helpompaa ja parempaa. Voit perua tilauksen milloin tahansa.",
      privacyLead: "Näin käsittelemme sähköpostiosoitettasi:",
      privacyLink: "Tietosuojakäytäntö",
      preparing: "Valmistellaan suojattua lomaketta…",
      submit: "Lähetä koodi",
      sending: "Lähetetään…",
      fine: "Tällä sivustolla ei makseta mitään. Jos valitset 47 %:n alennuksen Lifetimesta, maksat alennetun hinnan App Storessa. Voit perua päivitysten tilauksen milloin tahansa.",
      errEmail: "Jatka kirjoittamalla kelvollinen sähköpostiosoite.",
      errConsent: "Liity uutislistalle saadaksesi tilaajien tervetuliaislahjan.",
      errWait: "Odota, että turvatarkistus valmistuu.",
      errTurnstile: "Turvatarkistusta ei voitu ladata. Yritä uudelleen.",
      errUnavailable: "Tilaajien tervetuliaislahja ei ole juuri nyt saatavilla. Yritä myöhemmin uudelleen.",
      errCheck: "Tarkista sähköpostiosoitteesi ja suorita turvatarkistus. Yritä sitten uudelleen.",
      errRate: "Liian monta yritystä. Yritä uudelleen kymmenen minuutin kuluttua.",
      errGeneric: "Koodia ei voitu lähettää. Yritä uudelleen.",
      errClaimed: "Tähän sähköpostiosoitteeseen on jo lähetetty koodi. Jokainen osoite voi hakea lahjan vain kerran.",
      okEyebrow: "Pyyntö vastaanotettu",
      okHeading: "Tarkista sähköpostisi.",
      okCopy: "Pyyntö osoitteelle {email} on vastaanotettu. Saamassasi viestissä on henkilökohtainen koodisi, painike sen lunastamiseen App Storessa, ohjeet sovelluksessa tehtäviin vaiheisiin sekä linkki tilauksen perumiseen.",
      okQueued: "Pyyntö osoitteelle {email} on vastaanotettu. Koodisi lähetetään sähköpostiisi heti, kun se on valmis.",
      okPreview: "Vain esikatselu. Sähköpostia ei lähetetty, eikä mitään tallennettu.",
      done: "Valmis",
      close: "Sulje",
      security: "Turvatarkistus"
    },
    hu: {
      link: "Egy ingyenes hónap vagy 47% kedvezmény a Lifetime árából",
      note: "Üdvözlőajándék feliratkozóknak · Ön választ · Bármikor leiratkozhat",
      eyebrow: "Egy kis köszönet",
      heading: "Melyik üdvözlőajándékot küldjem el Önnek?",
      choiceLegend: "Válassza ki az ajándékát",
      choiceMonth: "Egy hónap ingyenes Full App",
      choiceMonthNote: "Fizetés nélkül, nem újul meg",
      choiceLifetime: "47% kedvezmény a Full App Lifetime árából",
      choiceLifetimeNote: "Egyszer fizet, örökre az Öné",
      emailLabel: "E-mail-cím",
      placeholder: "you@example.com",
      consent: "Igen, legalább 16 éves vagyok. Időnként küldjenek híreket a Control My Mac appról és a többi appjukról.",
      required: "Kötelező",
      detail: "Az e-mailben megtalálja az egyéni kódját és a beváltás egyszerű lépéseit. Időnként app-híreket és promóciós kódokat is kap olyan apró eszközökhöz, amelyek megkönnyítik és jobbá teszik a mindennapokat. Bármikor leiratkozhat.",
      privacyLead: "Így kezeljük az e-mail-címét:",
      privacyLink: "Adatvédelmi tájékoztató",
      preparing: "A biztonságos űrlap előkészítése…",
      submit: "Kód küldése",
      sending: "Küldés…",
      fine: "Ezen az oldalon nincs fizetés. Ha a Lifetime 47%-os kedvezményét választja, a kedvezményes árat az App Store-ban fizeti ki. A hírlevelekről bármikor leiratkozhat.",
      errEmail: "A folytatáshoz adjon meg érvényes e-mail-címet.",
      errConsent: "Az üdvözlőajándékhoz iratkozzon fel a hírlevélre.",
      errWait: "Várja meg, amíg a biztonsági ellenőrzés befejeződik.",
      errTurnstile: "A biztonsági ellenőrzést nem sikerült betölteni. Próbálja újra.",
      errUnavailable: "A feliratkozói ajándék jelenleg nem érhető el. Próbálja újra később.",
      errCheck: "Ellenőrizze az e-mail-címet, végezze el a biztonsági ellenőrzést, majd próbálja újra.",
      errRate: "Túl sok próbálkozás. Próbálja újra tíz perc múlva.",
      errGeneric: "A kódot nem sikerült elküldeni. Próbálja újra.",
      errClaimed: "Erre az e-mail-címre már elküldtük a kódot. Minden cím egyszer igényelheti az ajándékot.",
      okEyebrow: "Kérés megérkezett",
      okHeading: "Nézze meg a postaládáját.",
      okCopy: "A kérést elfogadtuk a következő címre: {email}. Az e-mailben megtalálja az egyéni kódját, egy gombot a beváltáshoz az App Store-ban, az appon belüli lépéseket és egy leiratkozási hivatkozást.",
      okQueued: "A kérést elfogadtuk a következő címre: {email}. A kódot e-mailben küldjük el, amint elkészül.",
      okPreview: "Csak előnézet. Nem küldtünk e-mailt, és semmit sem mentettünk el.",
      done: "Kész",
      close: "Bezárás",
      security: "Biztonsági ellenőrzés"
    },
    ro: {
      link: "Primiți o lună gratuită sau o reducere de 47% la Lifetime",
      note: "Cadou de bun venit pentru abonați · La alegerea dvs. · Dezabonare oricând",
      eyebrow: "Un mic mulțumesc",
      heading: "Ce cadou de bun venit să vă trimit?",
      choiceLegend: "Alegeți cadoul",
      choiceMonth: "O lună gratuită de Full App",
      choiceMonthNote: "Fără plată, nu se reînnoiește",
      choiceLifetime: "Reducere de 47% la Full App Lifetime",
      choiceLifetimeNote: "Plătiți o dată, păstrați pentru totdeauna",
      emailLabel: "Adresă de e-mail",
      placeholder: "you@example.com",
      consent: "Da, am 16 ani sau mai mult. Trimiteți-mi din când în când noutăți despre Control My Mac și celelalte aplicații ale dvs.",
      required: "Obligatoriu",
      detail: "E-mailul pe care îl primiți conține codul dvs. personal și pași simpli pentru a-l valorifica. Veți primi, de asemenea, din când în când noutăți despre aplicații și coduri promoționale pentru mici instrumente create să facă viața de zi cu zi mai simplă și mai bună. Vă puteți dezabona oricând.",
      privacyLead: "Cum tratăm adresa dvs. de e-mail:",
      privacyLink: "Politica de confidențialitate",
      preparing: "Se pregătește formularul securizat…",
      submit: "Trimiteți codul",
      sending: "Se trimite…",
      fine: "Pe acest site nu se plătește nimic. Dacă alegeți reducerea de 47% la Lifetime, prețul redus îl plătiți în App Store. Vă puteți dezabona de la noutăți oricând.",
      errEmail: "Introduceți o adresă de e-mail validă pentru a continua.",
      errConsent: "Abonați-vă la e-mailurile cu noutăți pentru a primi cadoul de bun venit pentru abonați.",
      errWait: "Așteptați să se termine verificarea de securitate.",
      errTurnstile: "Verificarea de securitate nu s-a putut încărca. Încercați din nou.",
      errUnavailable: "Cadoul pentru abonați nu este disponibil în acest moment. Încercați din nou mai târziu.",
      errCheck: "Verificați adresa de e-mail și finalizați verificarea de securitate, apoi încercați din nou.",
      errRate: "Prea multe încercări. Încercați din nou peste zece minute.",
      errGeneric: "Codul nu a putut fi trimis. Încercați din nou.",
      errClaimed: "Această adresă de e-mail a primit deja codul. Fiecare adresă poate primi cadoul o singură dată.",
      okEyebrow: "Cerere primită",
      okHeading: "Verificați-vă căsuța de e-mail.",
      okCopy: "Am acceptat cererea pentru {email}. E-mailul pe care îl primiți conține codul personal, un buton pentru a-l valorifica în App Store, pașii din aplicație și un link de dezabonare.",
      okQueued: "Am acceptat cererea pentru {email}. Codul vă va fi trimis prin e-mail imediat ce este gata.",
      okPreview: "Doar previzualizare. Nu a fost trimis niciun e-mail și nu s-a salvat nimic.",
      done: "Gata",
      close: "Închideți",
      security: "Verificare de securitate"
    },
    el: {
      link: "Αποκτήστε έναν δωρεάν μήνα ή έκπτωση 47% στο Full App εφ’ όρου ζωής",
      note: "Δώρο καλωσορίσματος για εγγεγραμμένους · Εσείς επιλέγετε · Διαγραφή από τη λίστα όποτε θέλετε",
      eyebrow: "Ένα μικρό ευχαριστώ",
      heading: "Ποιο δώρο καλωσορίσματος να σας στείλω;",
      choiceLegend: "Επιλέξτε το δώρο σας",
      choiceMonth: "Ένας δωρεάν μήνας Full App",
      choiceMonthNote: "Χωρίς πληρωμή, χωρίς ανανέωση",
      choiceLifetime: "Έκπτωση 47% στο Full App εφ’ όρου ζωής",
      choiceLifetimeNote: "Πληρώνετε μία φορά, το κρατάτε για πάντα",
      emailLabel: "Διεύθυνση email",
      placeholder: "you@example.com",
      consent: "Ναι, είμαι 16 ετών και άνω. Στείλτε μου περιστασιακά νέα για το Control My Mac και τις άλλες εφαρμογές του Sebastian.",
      required: "Υποχρεωτικό",
      detail: "Το email σας περιλαμβάνει τον προσωπικό σας κωδικό και απλά βήματα για την εξαργύρωσή του. Θα λαμβάνετε επίσης περιστασιακά νέα εφαρμογών και κωδικούς προσφοράς για μικρά εργαλεία που φτιάχνονται ώστε η καθημερινότητα να γίνεται πιο εύκολη και καλύτερη. Μπορείτε να διαγραφείτε από τη λίστα όποτε θέλετε.",
      privacyLead: "Πώς χειριζόμαστε το email σας:",
      privacyLink: "Πολιτική απορρήτου",
      preparing: "Γίνεται προετοιμασία της ασφαλούς φόρμας…",
      submit: "Αποστολή του κωδικού",
      sending: "Αποστολή…",
      fine: "Δεν γίνεται καμία πληρωμή σε αυτόν τον ιστότοπο. Αν επιλέξετε την έκπτωση 47% στο Full App εφ’ όρου ζωής, πληρώνετε τη μειωμένη τιμή στο App Store. Μπορείτε να διαγραφείτε από τις ενημερώσεις όποτε θέλετε.",
      errEmail: "Εισαγάγετε μια έγκυρη διεύθυνση email για να συνεχίσετε.",
      errConsent: "Εγγραφείτε στα email με νέα για να λάβετε το δώρο καλωσορίσματος για εγγεγραμμένους.",
      errWait: "Περιμένετε να ολοκληρωθεί ο έλεγχος ασφαλείας.",
      errTurnstile: "Ο έλεγχος ασφαλείας δεν μπόρεσε να φορτωθεί. Δοκιμάστε ξανά.",
      errUnavailable: "Το δώρο για εγγεγραμμένους δεν είναι διαθέσιμο αυτή τη στιγμή. Δοκιμάστε ξανά αργότερα.",
      errCheck: "Ελέγξτε τη διεύθυνση email σας και ολοκληρώστε τον έλεγχο ασφαλείας· μετά δοκιμάστε ξανά.",
      errRate: "Πάρα πολλές προσπάθειες. Δοκιμάστε ξανά σε δέκα λεπτά.",
      errGeneric: "Ο κωδικός δεν μπόρεσε να σταλεί. Δοκιμάστε ξανά.",
      errClaimed: "Σε αυτή τη διεύθυνση email έχει ήδη σταλεί ο κωδικός. Κάθε διεύθυνση μπορεί να λάβει το δώρο μία φορά.",
      okEyebrow: "Το αίτημα ελήφθη",
      okHeading: "Ελέγξτε τα εισερχόμενά σας.",
      okCopy: "Δεχτήκαμε το αίτημα για τη διεύθυνση {email}. Το email σας περιέχει τον προσωπικό σας κωδικό, ένα κουμπί για να τον εξαργυρώσετε στο App Store, τα βήματα μέσα στην εφαρμογή και έναν σύνδεσμο διαγραφής από τη λίστα.",
      okQueued: "Δεχτήκαμε το αίτημα για τη διεύθυνση {email}. Ο κωδικός σας θα σταλεί με email μόλις είναι έτοιμος.",
      okPreview: "Μόνο προεπισκόπηση. Δεν στάλθηκε email και δεν αποθηκεύτηκε τίποτα.",
      done: "Τέλος",
      close: "Κλείσιμο",
      security: "Έλεγχος ασφαλείας"
    }
  };

  var LANG_MAP = { "pt-br": "pt", "zh-hans": "zh", "zh-hant": "zh-hant", "nb": "no" };
  var pageLang = (document.documentElement.lang || "en").toLowerCase();
  var locale = LANG_MAP[pageLang] || pageLang.split("-")[0];
  var t = COPY[locale] || COPY.en;
  window.cmmOfferCopy = t; // shared form words, reused by assets/waitlist.js
  // English lives at the site root, every other language under /<locale>/.
  var privacyHref = COPY[locale] && locale !== "en" ? "/" + locale + "/privacy" : "/privacy";

  var ICON_GIFT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>';
  var ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var localPreview = isLocal && /[?&]offer-preview=1\b/.test(location.search);

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }
  function text(tag, cls, value) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    node.textContent = value;
    return node;
  }
  function fill(template, email) {
    var parts = template.split("{email}");
    var frag = document.createDocumentFragment();
    parts.forEach(function (part, i) {
      frag.appendChild(document.createTextNode(part));
      if (i < parts.length - 1) {
        var strong = document.createElement("strong");
        strong.textContent = email;
        frag.appendChild(strong);
      }
    });
    return frag;
  }

  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = function () { resolve(window.turnstile); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function fetchStatus() {
    if (localPreview) return Promise.resolve({ configured: true, preview: true, turnstileSiteKey: null });
    return fetch("/api/request-code", { headers: { Accept: "application/json" }, cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : { configured: false }; })
      .catch(function () { return { configured: false }; });
  }

  function mount(status) {
    var cta = document.querySelector(".hero .cta");
    if (!cta || document.querySelector("[data-offer-link]")) return;

    var trigger = el("button", "offer-link");
    trigger.type = "button";
    trigger.setAttribute("data-offer-link", "");
    trigger.innerHTML = ICON_GIFT;
    trigger.appendChild(text("span", null, t.link));
    trigger.insertAdjacentHTML("beforeend", ICON_ARROW);
    var note = text("p", "offer-note", t.note);
    var slot = cta.parentElement.querySelector(".hg-text");
    if (slot) { slot.insertAdjacentElement("afterbegin", note); slot.insertAdjacentElement("afterbegin", trigger); }
    else { cta.insertAdjacentElement("afterend", trigger); trigger.insertAdjacentElement("afterend", note); }

    var scrim, panel, form, emailInput, consentInput, messageEl, submitBtn, turnstileBox, widgetId;
    var token = "";
    var previousOverflow = "";

    function setMessage(value) {
      messageEl.textContent = value || "";
      messageEl.hidden = !value;
    }

    function close() {
      if (!scrim) return;
      if (widgetId !== undefined && window.turnstile) {
        try { window.turnstile.remove(widgetId); } catch (e) {}
      }
      widgetId = undefined;
      token = "";
      document.removeEventListener("keydown", onKey);
      scrim.remove();
      scrim = null;
      document.body.style.overflow = previousOverflow;
      trigger.focus();
    }

    function onKey(event) {
      if (event.key === "Escape") { close(); return; }
      if (event.key === "Tab" && panel) {
        var focusables = panel.querySelectorAll("button, input, a[href], iframe");
        if (!focusables.length) return;
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }

    function showSuccess(email, mode) {
      panel.innerHTML = "";
      panel.appendChild(closeButton());
      var box = el("div", "offer-success");
      box.appendChild(text("p", "offer-eyebrow", t.okEyebrow));
      var h = text("h2", null, t.okHeading);
      h.id = "offer-title";
      box.appendChild(h);
      var p = el("p", "offer-copy");
      p.appendChild(fill(mode === "queued" ? t.okQueued : t.okCopy, email));
      box.appendChild(p);
      if (mode === "preview") box.appendChild(text("p", "offer-preview-note", t.okPreview));
      var done = text("button", "btn btn-primary offer-submit", t.done);
      done.type = "button";
      done.addEventListener("click", close);
      box.appendChild(done);
      panel.appendChild(box);
      done.focus();
    }

    function closeButton() {
      var b = el("button", "offer-close", ICON_CLOSE);
      b.type = "button";
      b.setAttribute("aria-label", t.close);
      b.addEventListener("click", close);
      return b;
    }

    function open() {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      scrim = el("div", "offer-scrim");
      scrim.addEventListener("mousedown", function (e) { if (e.target === scrim) close(); });
      panel = el("section", "offer-panel glass");
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("aria-labelledby", "offer-title");
      panel.appendChild(closeButton());

      var eyebrow = el("p", "offer-eyebrow", ICON_GIFT);
      eyebrow.appendChild(text("span", null, t.eyebrow));
      panel.appendChild(eyebrow);
      var h = text("h2", null, t.heading);
      h.id = "offer-title";
      panel.appendChild(h);

      form = el("form", "offer-form");
      form.noValidate = true;
      var label = text("label", "offer-label", t.emailLabel);
      label.htmlFor = "offer-email";
      emailInput = el("input", "offer-input");
      emailInput.id = "offer-email";
      emailInput.type = "email";
      emailInput.name = "email";
      emailInput.autocomplete = "email";
      emailInput.placeholder = t.placeholder;

      var consentBox = el("div", "offer-consent");
      var checkRow = el("label", "offer-check");
      checkRow.htmlFor = "offer-consent";
      consentInput = el("input");
      consentInput.id = "offer-consent";
      consentInput.type = "checkbox";
      consentInput.required = true;
      consentInput.setAttribute("aria-describedby", "offer-consent-detail");
      var consentText = text("span", null, t.consent + " ");
      consentText.appendChild(text("small", "offer-required", t.required));
      checkRow.appendChild(consentInput);
      checkRow.appendChild(consentText);
      var detail = text("p", "offer-detail", t.detail);
      detail.id = "offer-consent-detail";
      // Who gets the address and why, at the moment it is collected (GDPR Art. 13). Opens in
      // a new tab so the half-filled form stays put.
      // A full-width colon (ja, zh) already carries its own space.
      var privacy = text("p", "offer-detail offer-privacy", t.privacyLead + (/：$/.test(t.privacyLead) ? "" : " "));
      var privacyLink = text("a", null, t.privacyLink);
      privacyLink.href = privacyHref;
      privacyLink.target = "_blank";
      privacyLink.rel = "noopener";
      privacy.appendChild(privacyLink);
      consentBox.appendChild(checkRow);
      consentBox.appendChild(detail);
      consentBox.appendChild(privacy);

      var honeypot = el("input", "offer-hp");
      honeypot.type = "text";
      honeypot.name = "website";
      honeypot.tabIndex = -1;
      honeypot.autocomplete = "off";
      honeypot.setAttribute("aria-hidden", "true");

      turnstileBox = el("div", "offer-turnstile");
      turnstileBox.setAttribute("aria-label", t.security);
      var preparing = text("p", "offer-preparing", t.preparing);
      messageEl = el("p", "offer-error");
      messageEl.setAttribute("role", "alert");
      messageEl.hidden = true;
      submitBtn = text("button", "btn btn-primary offer-submit", t.submit);
      submitBtn.type = "submit";
      var fine = text("p", "offer-fine", t.fine);

      // The visitor picks one gift; an address only ever gets one code (the server keeps the first).
      var choice = el("fieldset", "offer-choice");
      choice.appendChild(text("legend", "offer-label", t.choiceLegend));
      [["free_month", t.choiceMonth, t.choiceMonthNote], ["lifetime47", t.choiceLifetime, t.choiceLifetimeNote]].forEach(function (item, i) {
        var row = el("label", "offer-option");
        var radio = el("input");
        radio.type = "radio";
        radio.name = "offer";
        radio.value = item[0];
        radio.checked = i === 0;
        var words = el("span");
        words.appendChild(text("strong", null, item[1]));
        words.appendChild(text("small", null, item[2]));
        row.appendChild(radio);
        row.appendChild(words);
        choice.appendChild(row);
      });

      [choice, label, emailInput, consentBox, honeypot, turnstileBox, preparing, messageEl, submitBtn, fine].forEach(function (n) { form.appendChild(n); });
      panel.appendChild(form);
      scrim.appendChild(panel);
      document.body.appendChild(scrim);
      document.addEventListener("keydown", onKey);
      emailInput.focus();

      if (status.preview || !status.turnstileSiteKey) {
        preparing.remove();
      } else {
        loadTurnstile().then(function (turnstile) {
          if (!scrim) return;
          preparing.remove();
          widgetId = turnstile.render(turnstileBox, {
            sitekey: status.turnstileSiteKey,
            callback: function (value) { token = value; },
            "expired-callback": function () { token = ""; },
            "error-callback": function () { token = ""; setMessage(t.errTurnstile); },
            theme: "auto",
            language: pageLang
          });
        }).catch(function () {
          preparing.remove();
          setMessage(t.errTurnstile);
        });
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var email = emailInput.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMessage(t.errEmail); emailInput.focus(); return; }
        if (!consentInput.checked) { setMessage(t.errConsent); consentInput.focus(); return; }
        if (!status.preview && status.turnstileSiteKey && !token) { setMessage(t.errWait); return; }
        setMessage("");
        submitBtn.disabled = true;
        submitBtn.textContent = t.sending;

        if (localPreview) {
          window.setTimeout(function () { showSuccess(email, "preview"); }, 400);
          return;
        }
        fetch("/api/request-code", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            email: email,
            locale: locale,
            marketingOptIn: true,
            offer: (form.querySelector("input[name=offer]:checked") || {}).value || "free_month",
            turnstileToken: token,
            website: honeypot.value
          })
        }).then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (result) {
            if (response.ok && result.ok) {
              showSuccess(email, result.preview ? "preview" : (result.queued ? "queued" : "sent"));
              return;
            }
            // The API names the matching message (errEmail, errClaimed, ...); fall back to the
            // status code for older responses.
            var key = result && result.errorKey;
            var msg = (typeof key === "string" && /^err[A-Z]\w*$/.test(key) &&
                Object.prototype.hasOwnProperty.call(t, key)) ? t[key]
              : response.status === 409 ? t.errClaimed
              : response.status === 429 ? t.errRate
              : response.status === 400 ? t.errCheck
              : response.status === 503 ? t.errUnavailable
              : t.errGeneric;
            throw new Error(msg);
          });
        }).catch(function (error) {
          setMessage(error && error.message && error.message.indexOf("fetch") === -1 ? error.message : t.errGeneric);
          submitBtn.disabled = false;
          submitBtn.textContent = t.submit;
          if (widgetId !== undefined && window.turnstile) { try { window.turnstile.reset(widgetId); } catch (e) {} }
          token = "";
        });
      });
    }

    trigger.addEventListener("click", open);
  }

  function start() {
    fetchStatus().then(function (status) {
      if (status && status.configured) mount(status);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
