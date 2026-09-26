/* Control My Mac — free-month subscriber gift (homepage only, no deps).
   Fail-closed: the offer link appears only when GET /api/request-code reports
   the service is configured (CODE_DELIVERY_MODE=ready or preview). While the
   switch is off, nothing on the page changes. On localhost, ?offer-preview=1
   shows the flow for design review without calling the API. */
(function () {
  "use strict";

  var COPY = {
    en: {
      link: "Get a free month of Full App",
      note: "Subscriber welcome gift · No payment · Unsubscribe anytime",
      eyebrow: "A small thank-you",
      heading: "Where should I send your free month of Control My Mac?",
      emailLabel: "Email address",
      placeholder: "you@example.com",
      consent: "Yes, send me occasional Control My Mac and Sebastian Apps news.",
      required: "Required",
      detail: "Your email includes the free-month code and simple steps to redeem it. You’ll also get occasional app news and promo codes for small tools designed to make everyday life easier and better. Unsubscribe anytime.",
      privacyLead: "How we handle your email:",
      privacyLink: "Privacy Policy",
      preparing: "Preparing the secure form…",
      submit: "Send the code",
      sending: "Sending…",
      fine: "No payment on this site. You can unsubscribe from updates at any time.",
      errEmail: "Enter a valid email address to continue.",
      errConsent: "Join Sebastian Apps emails to receive the subscriber welcome gift.",
      errWait: "Please wait for the security check to finish.",
      errTurnstile: "The security check could not load. Please try again.",
      errUnavailable: "The free-month gift isn't available right now. Please try again later.",
      errCheck: "Please check your email address and complete the security check, then try again.",
      errRate: "Too many attempts. Please try again in ten minutes.",
      errGeneric: "The code could not be sent. Please try again.",
      errClaimed: "This email address has already received its free-month code. Each address can claim the gift once.",
      okEyebrow: "Request received",
      okHeading: "Check your inbox.",
      okCopy: "We accepted the request for {email}. Your email contains your personal code, a button to redeem it in the App Store, the in-app steps, and an unsubscribe link.",
      okQueued: "We accepted the request for {email}. Your free-month code will be emailed as soon as it is ready.",
      okPreview: "Preview only. No email was sent and nothing was saved.",
      done: "Done",
      close: "Close",
      security: "Security check"
    },
    de: {
      link: "Hol dir einen Gratismonat Full App",
      note: "Willkommensgeschenk für Abonnenten · Keine Zahlung · Jederzeit abmelden",
      eyebrow: "Ein kleines Dankeschön",
      heading: "Wohin soll ich deinen Gratismonat von Control My Mac schicken?",
      emailLabel: "E-Mail-Adresse",
      placeholder: "du@beispiel.de",
      consent: "Ja, schick mir gelegentlich Neuigkeiten zu Control My Mac und Sebastian Apps.",
      required: "Erforderlich",
      detail: "Deine E-Mail enthält den Code für den Gratismonat und einfache Schritte zum Einlösen. Außerdem bekommst du gelegentlich App-Neuigkeiten und Aktionscodes für kleine Tools, die den Alltag einfacher und besser machen. Jederzeit abmelden.",
      privacyLead: "So gehen wir mit deiner E-Mail-Adresse um:",
      privacyLink: "Datenschutzerklärung",
      preparing: "Sicheres Formular wird vorbereitet …",
      submit: "Code senden",
      sending: "Wird gesendet …",
      fine: "Auf dieser Website wird nichts bezahlt. Du kannst Updates jederzeit abbestellen.",
      errEmail: "Gib eine gültige E-Mail-Adresse ein, um fortzufahren.",
      errConsent: "Melde dich für die E-Mails von Sebastian Apps an, um das Willkommensgeschenk zu erhalten.",
      errWait: "Bitte warte, bis die Sicherheitsprüfung abgeschlossen ist.",
      errTurnstile: "Die Sicherheitsprüfung konnte nicht geladen werden. Bitte versuche es erneut.",
      errUnavailable: "Der Gratismonat ist gerade nicht verfügbar. Bitte versuche es später erneut.",
      errCheck: "Prüfe deine E-Mail-Adresse, schließe die Sicherheitsprüfung ab und versuche es erneut.",
      errRate: "Zu viele Versuche. Bitte versuche es in zehn Minuten erneut.",
      errGeneric: "Der Code konnte nicht gesendet werden. Bitte versuche es erneut.",
      errClaimed: "An diese E-Mail-Adresse wurde der Code für den Gratismonat bereits geschickt. Jede Adresse kann das Geschenk nur einmal erhalten.",
      okEyebrow: "Anfrage erhalten",
      okHeading: "Schau in dein Postfach.",
      okCopy: "Wir haben die Anfrage für {email} angenommen. Deine E-Mail enthält deinen persönlichen Code, einen Button zum Einlösen im App Store, die Schritte in der App und einen Abmeldelink.",
      okQueued: "Wir haben die Anfrage für {email} angenommen. Dein Code für den Gratismonat kommt per E-Mail, sobald er bereit ist.",
      okPreview: "Nur Vorschau. Es wurde keine E-Mail gesendet und nichts gespeichert.",
      done: "Fertig",
      close: "Schließen",
      security: "Sicherheitsprüfung"
    },
    fr: {
      link: "Obtenez un mois gratuit de Full App",
      note: "Cadeau de bienvenue pour les abonnés · Aucun paiement · Désabonnement à tout moment",
      eyebrow: "Un petit merci",
      heading: "Où dois-je envoyer votre mois gratuit de Control My Mac ?",
      emailLabel: "Adresse e-mail",
      placeholder: "vous@exemple.fr",
      consent: "Oui, envoyez-moi de temps en temps des nouvelles de Control My Mac et de Sebastian Apps.",
      required: "Obligatoire",
      detail: "Votre e-mail contient le code du mois gratuit et des étapes simples pour l’utiliser. Vous recevrez aussi de temps en temps des nouvelles d’apps et des codes promo pour de petits outils conçus pour simplifier et améliorer le quotidien. Désabonnement à tout moment.",
      privacyLead: "Comment nous traitons votre adresse e-mail\u00a0:",
      privacyLink: "Politique de confidentialité",
      preparing: "Préparation du formulaire sécurisé…",
      submit: "Envoyer le code",
      sending: "Envoi…",
      fine: "Aucun paiement sur ce site. Vous pouvez vous désabonner des mises à jour à tout moment.",
      errEmail: "Saisissez une adresse e-mail valide pour continuer.",
      errConsent: "Inscrivez-vous aux e-mails Sebastian Apps pour recevoir le cadeau de bienvenue.",
      errWait: "Veuillez patienter jusqu’à la fin de la vérification de sécurité.",
      errTurnstile: "La vérification de sécurité n’a pas pu se charger. Veuillez réessayer.",
      errUnavailable: "Le mois gratuit n’est pas disponible pour le moment. Veuillez réessayer plus tard.",
      errCheck: "Vérifiez votre adresse e-mail et terminez la vérification de sécurité, puis réessayez.",
      errRate: "Trop de tentatives. Veuillez réessayer dans dix minutes.",
      errGeneric: "Le code n’a pas pu être envoyé. Veuillez réessayer.",
      errClaimed: "Cette adresse e-mail a déjà reçu son code pour le mois gratuit. Chaque adresse ne peut profiter du cadeau qu’une seule fois.",
      okEyebrow: "Demande reçue",
      okHeading: "Consultez votre boîte de réception.",
      okCopy: "Nous avons accepté la demande pour {email}. Votre e-mail contient votre code personnel, un bouton pour l’utiliser dans l’App Store, les étapes dans l’app et un lien de désabonnement.",
      okQueued: "Nous avons accepté la demande pour {email}. Votre code du mois gratuit vous sera envoyé par e-mail dès qu’il sera prêt.",
      okPreview: "Aperçu uniquement. Aucun e-mail n’a été envoyé et rien n’a été enregistré.",
      done: "Terminé",
      close: "Fermer",
      security: "Vérification de sécurité"
    },
    it: {
      link: "Ottieni un mese gratis di Full App",
      note: "Regalo di benvenuto per gli iscritti · Nessun pagamento · Disiscriviti quando vuoi",
      eyebrow: "Un piccolo grazie",
      heading: "Dove ti mando il tuo mese gratis di Control My Mac?",
      emailLabel: "Indirizzo email",
      placeholder: "tu@esempio.it",
      consent: "Sì, inviami ogni tanto novità su Control My Mac e Sebastian Apps.",
      required: "Obbligatorio",
      detail: "La tua email contiene il codice del mese gratis e semplici passaggi per riscattarlo. Di tanto in tanto riceverai anche novità sulle app e codici promozionali per piccoli strumenti pensati per rendere la vita di tutti i giorni più semplice e migliore. Disiscriviti quando vuoi.",
      privacyLead: "Come trattiamo il tuo indirizzo email:",
      privacyLink: "Informativa sulla privacy",
      preparing: "Preparazione del modulo sicuro…",
      submit: "Invia il codice",
      sending: "Invio…",
      fine: "Nessun pagamento su questo sito. Puoi disiscriverti dagli aggiornamenti in qualsiasi momento.",
      errEmail: "Inserisci un indirizzo email valido per continuare.",
      errConsent: "Iscriviti alle email di Sebastian Apps per ricevere il regalo di benvenuto.",
      errWait: "Attendi il completamento del controllo di sicurezza.",
      errTurnstile: "Impossibile caricare il controllo di sicurezza. Riprova.",
      errUnavailable: "Il mese gratis non è disponibile al momento. Riprova più tardi.",
      errCheck: "Controlla l’indirizzo email e completa il controllo di sicurezza, poi riprova.",
      errRate: "Troppi tentativi. Riprova tra dieci minuti.",
      errGeneric: "Impossibile inviare il codice. Riprova.",
      errClaimed: "Questo indirizzo email ha già ricevuto il codice del mese gratis. Ogni indirizzo può ricevere il regalo una sola volta.",
      okEyebrow: "Richiesta ricevuta",
      okHeading: "Controlla la tua casella di posta.",
      okCopy: "Abbiamo accettato la richiesta per {email}. La tua email contiene il tuo codice personale, un pulsante per riscattarlo nell’App Store, i passaggi nell’app e un link per disiscriverti.",
      okQueued: "Abbiamo accettato la richiesta per {email}. Il codice del mese gratis ti arriverà via email non appena sarà pronto.",
      okPreview: "Solo anteprima. Nessuna email è stata inviata e nulla è stato salvato.",
      done: "Fine",
      close: "Chiudi",
      security: "Controllo di sicurezza"
    },
    es: {
      link: "Consigue un mes gratis de Full App",
      note: "Regalo de bienvenida para suscriptores · Sin pago · Date de baja cuando quieras",
      eyebrow: "Un pequeño agradecimiento",
      heading: "¿A dónde te envío tu mes gratis de Control My Mac?",
      emailLabel: "Correo electrónico",
      placeholder: "tu@ejemplo.com",
      consent: "Sí, envíame de vez en cuando novedades de Control My Mac y Sebastian Apps.",
      required: "Obligatorio",
      detail: "Tu correo incluye el código del mes gratis y unos pasos sencillos para canjearlo. También recibirás de vez en cuando novedades de apps y códigos promocionales de pequeñas herramientas pensadas para hacer el día a día más fácil y mejor. Date de baja cuando quieras.",
      privacyLead: "Cómo tratamos tu correo electrónico:",
      privacyLink: "Política de privacidad",
      preparing: "Preparando el formulario seguro…",
      submit: "Enviar el código",
      sending: "Enviando…",
      fine: "En este sitio no se paga nada. Puedes darte de baja de las novedades en cualquier momento.",
      errEmail: "Introduce un correo electrónico válido para continuar.",
      errConsent: "Suscríbete a los correos de Sebastian Apps para recibir el regalo de bienvenida.",
      errWait: "Espera a que termine la comprobación de seguridad.",
      errTurnstile: "No se pudo cargar la comprobación de seguridad. Inténtalo de nuevo.",
      errUnavailable: "El mes gratis no está disponible ahora mismo. Inténtalo más tarde.",
      errCheck: "Revisa tu correo electrónico y completa la comprobación de seguridad; luego inténtalo de nuevo.",
      errRate: "Demasiados intentos. Inténtalo de nuevo en diez minutos.",
      errGeneric: "No se pudo enviar el código. Inténtalo de nuevo.",
      errClaimed: "Esta dirección de correo ya recibió su código del mes gratis. Cada dirección puede recibir el regalo una sola vez.",
      okEyebrow: "Solicitud recibida",
      okHeading: "Revisa tu bandeja de entrada.",
      okCopy: "Hemos aceptado la solicitud para {email}. Tu correo contiene tu código personal, un botón para canjearlo en el App Store, los pasos en la app y un enlace para darte de baja.",
      okQueued: "Hemos aceptado la solicitud para {email}. Te enviaremos el código del mes gratis por correo en cuanto esté listo.",
      okPreview: "Solo vista previa. No se envió ningún correo ni se guardó nada.",
      done: "Listo",
      close: "Cerrar",
      security: "Comprobación de seguridad"
    },
    pt: {
      link: "Ganhe um mês grátis do Full App",
      note: "Presente de boas-vindas para inscritos · Sem pagamento · Cancele quando quiser",
      eyebrow: "Um pequeno agradecimento",
      heading: "Para onde devo enviar seu mês grátis do Control My Mac?",
      emailLabel: "Endereço de e-mail",
      placeholder: "voce@exemplo.com",
      consent: "Sim, quero receber novidades ocasionais do Control My Mac e da Sebastian Apps.",
      required: "Obrigatório",
      detail: "Seu e-mail traz o código do mês grátis e passos simples para resgatá-lo. De vez em quando, você também vai receber novidades de apps e códigos promocionais de pequenas ferramentas feitas para deixar o dia a dia mais fácil e melhor. Cancele a inscrição quando quiser.",
      privacyLead: "Como tratamos seu e-mail:",
      privacyLink: "Política de Privacidade",
      preparing: "Preparando o formulário seguro…",
      submit: "Enviar o código",
      sending: "Enviando…",
      fine: "Nenhum pagamento neste site. Você pode cancelar a inscrição nas novidades a qualquer momento.",
      errEmail: "Digite um endereço de e-mail válido para continuar.",
      errConsent: "Inscreva-se nos e-mails da Sebastian Apps para receber o presente de boas-vindas.",
      errWait: "Aguarde a verificação de segurança terminar.",
      errTurnstile: "Não foi possível carregar a verificação de segurança. Tente novamente.",
      errUnavailable: "O mês grátis não está disponível no momento. Tente novamente mais tarde.",
      errCheck: "Confira seu endereço de e-mail e conclua a verificação de segurança; depois tente novamente.",
      errRate: "Muitas tentativas. Tente novamente em dez minutos.",
      errGeneric: "Não foi possível enviar o código. Tente novamente.",
      errClaimed: "Este endereço de e-mail já recebeu o código do mês grátis. Cada endereço pode receber o presente uma única vez.",
      okEyebrow: "Pedido recebido",
      okHeading: "Confira sua caixa de entrada.",
      okCopy: "Aceitamos o pedido para {email}. Seu e-mail traz seu código pessoal, um botão para resgatá-lo na App Store, os passos no app e um link para cancelar a inscrição.",
      okQueued: "Aceitamos o pedido para {email}. Seu código do mês grátis será enviado por e-mail assim que estiver pronto.",
      okPreview: "Apenas prévia. Nenhum e-mail foi enviado e nada foi salvo.",
      done: "Concluído",
      close: "Fechar",
      security: "Verificação de segurança"
    },
    nl: {
      link: "Krijg een gratis maand Full App",
      note: "Welkomstcadeau voor abonnees · Geen betaling · Altijd afmelden",
      eyebrow: "Een klein bedankje",
      heading: "Waar mag ik je gratis maand Control My Mac naartoe sturen?",
      emailLabel: "E-mailadres",
      placeholder: "jij@voorbeeld.nl",
      consent: "Ja, stuur me af en toe nieuws over Control My Mac en Sebastian Apps.",
      required: "Verplicht",
      detail: "Je e-mail bevat de code voor de gratis maand en eenvoudige stappen om hem in te wisselen. Je krijgt ook af en toe app-nieuws en promocodes voor kleine tools die het dagelijks leven makkelijker en beter maken. Altijd afmelden.",
      privacyLead: "Zo gaan we om met je e-mailadres:",
      privacyLink: "Privacybeleid",
      preparing: "Beveiligd formulier wordt voorbereid…",
      submit: "Code versturen",
      sending: "Versturen…",
      fine: "Op deze site betaal je niets. Je kunt je altijd afmelden voor updates.",
      errEmail: "Vul een geldig e-mailadres in om door te gaan.",
      errConsent: "Meld je aan voor de e-mails van Sebastian Apps om het welkomstcadeau te ontvangen.",
      errWait: "Wacht tot de beveiligingscontrole klaar is.",
      errTurnstile: "De beveiligingscontrole kon niet worden geladen. Probeer het opnieuw.",
      errUnavailable: "De gratis maand is nu niet beschikbaar. Probeer het later opnieuw.",
      errCheck: "Controleer je e-mailadres en voltooi de beveiligingscontrole, en probeer het daarna opnieuw.",
      errRate: "Te veel pogingen. Probeer het over tien minuten opnieuw.",
      errGeneric: "De code kon niet worden verstuurd. Probeer het opnieuw.",
      errClaimed: "Dit e-mailadres heeft de code voor de gratis maand al ontvangen. Elk adres kan het cadeau maar één keer krijgen.",
      okEyebrow: "Aanvraag ontvangen",
      okHeading: "Kijk in je inbox.",
      okCopy: "We hebben de aanvraag voor {email} geaccepteerd. Je e-mail bevat je persoonlijke code, een knop om hem in de App Store in te wisselen, de stappen in de app en een afmeldlink.",
      okQueued: "We hebben de aanvraag voor {email} geaccepteerd. Je code voor de gratis maand wordt gemaild zodra hij klaar is.",
      okPreview: "Alleen voorbeeld. Er is geen e-mail verstuurd en niets opgeslagen.",
      done: "Klaar",
      close: "Sluiten",
      security: "Beveiligingscontrole"
    },
    ja: {
      link: "Full Appの無料1か月を受け取る",
      note: "登録特典 · お支払い不要 · いつでも配信停止可能",
      eyebrow: "ささやかなお礼です",
      heading: "Control My Macの無料1か月をどこに送りましょうか？",
      emailLabel: "メールアドレス",
      placeholder: "you@example.com",
      consent: "はい、Control My MacとSebastian Appsのお知らせをときどき受け取ります。",
      required: "必須",
      detail: "メールには無料1か月のコードと、かんたんな利用手順が記載されています。毎日の暮らしをもっと簡単で快適にする小さなツールについて、アプリのお知らせやプロモーションコードもときどきお届けします。いつでも配信停止できます。",
      privacyLead: "メールアドレスの取り扱いについて：",
      privacyLink: "プライバシーポリシー",
      preparing: "安全なフォームを準備しています…",
      submit: "コードを送信",
      sending: "送信中…",
      fine: "このサイトでのお支払いはありません。お知らせの配信はいつでも停止できます。",
      errEmail: "続けるには有効なメールアドレスを入力してください。",
      errConsent: "登録特典を受け取るには、Sebastian Appsのメールに登録してください。",
      errWait: "セキュリティチェックが完了するまでお待ちください。",
      errTurnstile: "セキュリティチェックを読み込めませんでした。もう一度お試しください。",
      errUnavailable: "無料1か月は現在ご利用いただけません。しばらくしてからもう一度お試しください。",
      errCheck: "メールアドレスを確認し、セキュリティチェックを完了してから、もう一度お試しください。",
      errRate: "試行回数が多すぎます。10分後にもう一度お試しください。",
      errGeneric: "コードを送信できませんでした。もう一度お試しください。",
      errClaimed: "このメールアドレスには、無料1か月のコードをすでにお送りしています。特典は1つのアドレスにつき1回限りです。",
      okEyebrow: "リクエストを受け付けました",
      okHeading: "受信トレイをご確認ください。",
      okCopy: "{email} へのリクエストを受け付けました。メールには、あなた専用のコード、App Storeで引き換えるためのボタン、アプリ内での手順、配信停止リンクが含まれています。",
      okQueued: "{email} へのリクエストを受け付けました。無料1か月のコードは準備ができ次第メールでお送りします。",
      okPreview: "プレビューのみです。メールは送信されず、何も保存されていません。",
      done: "完了",
      close: "閉じる",
      security: "セキュリティチェック"
    },
    zh: {
      link: "免费领取一个月 Full App",
      note: "订阅欢迎礼 · 无需付款 · 可随时退订",
      eyebrow: "一点小心意",
      heading: "我该把你的 Control My Mac 免费月发送到哪里？",
      emailLabel: "电子邮件地址",
      placeholder: "you@example.com",
      consent: "是的，偶尔向我发送 Control My Mac 和 Sebastian Apps 的新闻。",
      required: "必填",
      detail: "你的邮件包含免费月代码和简单的兑换步骤。你还会不定期收到 App 新闻，以及一些让日常生活更轻松、更美好的小工具的优惠代码。可随时退订。",
      privacyLead: "我们如何处理你的邮箱地址：",
      privacyLink: "隐私政策",
      preparing: "正在准备安全表单…",
      submit: "发送代码",
      sending: "正在发送…",
      fine: "本网站不收取任何费用。你可以随时退订更新。",
      errEmail: "请输入有效的电子邮件地址以继续。",
      errConsent: "订阅 Sebastian Apps 邮件即可领取订阅欢迎礼。",
      errWait: "请等待安全检查完成。",
      errTurnstile: "无法加载安全检查。请重试。",
      errUnavailable: "免费月目前无法领取。请稍后再试。",
      errCheck: "请检查你的电子邮件地址并完成安全检查，然后重试。",
      errRate: "尝试次数过多。请在十分钟后重试。",
      errGeneric: "无法发送代码。请重试。",
      errClaimed: "这个邮箱已经领取过免费月代码。每个邮箱只能领取一次。",
      okEyebrow: "已收到请求",
      okHeading: "请查看你的收件箱。",
      okCopy: "我们已接受 {email} 的请求。你的邮件中包含专属代码、在 App Store 中兑换的按钮、App 内兑换步骤以及退订链接。",
      okQueued: "我们已接受 {email} 的请求。免费月代码准备好后会立即通过邮件发送给你。",
      okPreview: "仅为预览。没有发送邮件，也没有保存任何内容。",
      done: "完成",
      close: "关闭",
      security: "安全检查"
    },
    ko: {
      link: "Full App 한 달 무료로 받기",
      note: "구독자 환영 선물 · 결제 없음 · 언제든지 구독 취소",
      eyebrow: "작은 감사의 선물",
      heading: "Control My Mac 무료 한 달을 어디로 보내 드릴까요?",
      emailLabel: "이메일 주소",
      placeholder: "you@example.com",
      consent: "네, Control My Mac과 Sebastian Apps 소식을 가끔 받겠습니다.",
      required: "필수",
      detail: "이메일에는 무료 한 달 코드와 간단한 사용 방법이 들어 있습니다. 일상을 더 쉽고 좋게 만드는 작은 도구에 대한 앱 소식과 프로모션 코드도 가끔 보내 드립니다. 언제든지 구독을 취소할 수 있습니다.",
      privacyLead: "이메일 주소 처리 방식:",
      privacyLink: "개인정보 처리방침",
      preparing: "보안 양식을 준비하는 중…",
      submit: "코드 보내기",
      sending: "보내는 중…",
      fine: "이 사이트에서는 결제하지 않습니다. 소식 수신은 언제든지 취소할 수 있습니다.",
      errEmail: "계속하려면 올바른 이메일 주소를 입력하세요.",
      errConsent: "구독자 환영 선물을 받으려면 Sebastian Apps 이메일을 구독하세요.",
      errWait: "보안 확인이 끝날 때까지 기다려 주세요.",
      errTurnstile: "보안 확인을 불러올 수 없습니다. 다시 시도하세요.",
      errUnavailable: "지금은 무료 한 달을 받을 수 없습니다. 나중에 다시 시도하세요.",
      errCheck: "이메일 주소를 확인하고 보안 확인을 완료한 다음 다시 시도하세요.",
      errRate: "시도 횟수가 너무 많습니다. 10분 후에 다시 시도하세요.",
      errGeneric: "코드를 보낼 수 없습니다. 다시 시도하세요.",
      errClaimed: "이 이메일 주소로는 이미 무료 한 달 코드를 보내 드렸습니다. 선물은 주소당 한 번만 받을 수 있습니다.",
      okEyebrow: "요청이 접수되었습니다",
      okHeading: "받은 편지함을 확인하세요.",
      okCopy: "{email}에 대한 요청을 접수했습니다. 이메일에는 전용 코드, App Store에서 바로 사용할 수 있는 버튼, 앱에서 사용하는 방법, 구독 취소 링크가 들어 있습니다.",
      okQueued: "{email}에 대한 요청을 접수했습니다. 무료 한 달 코드가 준비되는 대로 이메일로 보내 드립니다.",
      okPreview: "미리보기입니다. 이메일이 전송되지 않았고 아무것도 저장되지 않았습니다.",
      done: "완료",
      close: "닫기",
      security: "보안 확인"
    },
    ru: {
      link: "Получите месяц Full App бесплатно",
      note: "Приветственный подарок подписчикам · Без оплаты · Отписаться можно в любой момент",
      eyebrow: "Небольшое спасибо",
      heading: "Куда отправить ваш бесплатный месяц Control My Mac?",
      emailLabel: "Адрес эл. почты",
      placeholder: "you@example.com",
      consent: "Да, присылайте мне иногда новости Control My Mac и Sebastian Apps.",
      required: "Обязательно",
      detail: "В письме будут код бесплатного месяца и простые шаги для активации. Также мы будем иногда присылать новости приложений и промокоды на небольшие инструменты, которые делают повседневную жизнь проще и лучше. Отписаться можно в любой момент.",
      privacyLead: "Как мы обращаемся с вашим адресом:",
      privacyLink: "Политика конфиденциальности",
      preparing: "Подготовка защищённой формы…",
      submit: "Отправить код",
      sending: "Отправка…",
      fine: "На этом сайте ничего не нужно оплачивать. Отписаться от новостей можно в любой момент.",
      errEmail: "Введите действительный адрес эл. почты, чтобы продолжить.",
      errConsent: "Подпишитесь на письма Sebastian Apps, чтобы получить приветственный подарок.",
      errWait: "Дождитесь окончания проверки безопасности.",
      errTurnstile: "Не удалось загрузить проверку безопасности. Попробуйте ещё раз.",
      errUnavailable: "Бесплатный месяц сейчас недоступен. Попробуйте позже.",
      errCheck: "Проверьте адрес эл. почты и пройдите проверку безопасности, затем попробуйте ещё раз.",
      errRate: "Слишком много попыток. Попробуйте ещё раз через десять минут.",
      errGeneric: "Не удалось отправить код. Попробуйте ещё раз.",
      errClaimed: "На этот адрес уже отправлен код бесплатного месяца. Каждый адрес может получить подарок только один раз.",
      okEyebrow: "Запрос получен",
      okHeading: "Проверьте почту.",
      okCopy: "Мы приняли запрос для {email}. В письме будут ваш личный код, кнопка для активации в App Store, шаги в приложении и ссылка для отписки.",
      okQueued: "Мы приняли запрос для {email}. Код бесплатного месяца придёт на почту, как только будет готов.",
      okPreview: "Только предпросмотр. Письмо не отправлено, ничего не сохранено.",
      done: "Готово",
      close: "Закрыть",
      security: "Проверка безопасности"
    },
    pl: {
      link: "Odbierz darmowy miesiąc Full App",
      note: "Prezent powitalny dla subskrybentów · Bez płatności · Wypisz się w każdej chwili",
      eyebrow: "Małe podziękowanie",
      heading: "Gdzie mam wysłać Twój darmowy miesiąc Control My Mac?",
      emailLabel: "Adres e-mail",
      placeholder: "ty@przyklad.pl",
      consent: "Tak, wysyłaj mi od czasu do czasu nowości o Control My Mac i Sebastian Apps.",
      required: "Wymagane",
      detail: "Twój e-mail zawiera kod na darmowy miesiąc i proste kroki jego realizacji. Od czasu do czasu otrzymasz też nowości o aplikacjach i kody promocyjne na małe narzędzia, które ułatwiają i umilają codzienne życie. Wypisz się w każdej chwili.",
      privacyLead: "Jak przetwarzamy Twój adres e-mail:",
      privacyLink: "Polityka prywatności",
      preparing: "Przygotowywanie bezpiecznego formularza…",
      submit: "Wyślij kod",
      sending: "Wysyłanie…",
      fine: "Na tej stronie nic nie płacisz. Z aktualizacji możesz się wypisać w każdej chwili.",
      errEmail: "Wpisz prawidłowy adres e-mail, aby kontynuować.",
      errConsent: "Zapisz się na e-maile Sebastian Apps, aby otrzymać prezent powitalny.",
      errWait: "Poczekaj na zakończenie weryfikacji bezpieczeństwa.",
      errTurnstile: "Nie udało się wczytać weryfikacji bezpieczeństwa. Spróbuj ponownie.",
      errUnavailable: "Darmowy miesiąc jest teraz niedostępny. Spróbuj ponownie później.",
      errCheck: "Sprawdź adres e-mail i dokończ weryfikację bezpieczeństwa, a potem spróbuj ponownie.",
      errRate: "Zbyt wiele prób. Spróbuj ponownie za dziesięć minut.",
      errGeneric: "Nie udało się wysłać kodu. Spróbuj ponownie.",
      errClaimed: "Ten adres e-mail otrzymał już kod na darmowy miesiąc. Każdy adres może odebrać prezent tylko raz.",
      okEyebrow: "Prośba przyjęta",
      okHeading: "Sprawdź skrzynkę odbiorczą.",
      okCopy: "Przyjęliśmy prośbę dla {email}. Twój e-mail zawiera osobisty kod, przycisk do realizacji w App Store, kroki w aplikacji i link do wypisania się.",
      okQueued: "Przyjęliśmy prośbę dla {email}. Kod na darmowy miesiąc wyślemy e-mailem, gdy tylko będzie gotowy.",
      okPreview: "Tylko podgląd. Nie wysłano żadnego e-maila i nic nie zapisano.",
      done: "Gotowe",
      close: "Zamknij",
      security: "Weryfikacja bezpieczeństwa"
    },
    tr: {
      link: "Bir ay ücretsiz Full App al",
      note: "Abonelere hoş geldin hediyesi · Ödeme yok · İstediğin zaman aboneliği bırak",
      eyebrow: "Küçük bir teşekkür",
      heading: "Control My Mac ücretsiz ayını nereye göndereyim?",
      emailLabel: "E-posta adresi",
      placeholder: "sen@ornek.com",
      consent: "Evet, bana ara sıra Control My Mac ve Sebastian Apps haberleri gönder.",
      required: "Zorunlu",
      detail: "E-postanda ücretsiz ay kodu ve kodu kullanmak için basit adımlar bulunur. Ayrıca ara sıra uygulama haberleri ve günlük hayatı daha kolay ve daha iyi hâle getiren küçük araçlar için promosyon kodları alırsın. İstediğin zaman aboneliği bırakabilirsin.",
      privacyLead: "E-posta adresini nasıl işlediğimiz:",
      privacyLink: "Gizlilik Politikası",
      preparing: "Güvenli form hazırlanıyor…",
      submit: "Kodu gönder",
      sending: "Gönderiliyor…",
      fine: "Bu sitede ödeme yapılmaz. Güncellemelerden istediğin zaman çıkabilirsin.",
      errEmail: "Devam etmek için geçerli bir e-posta adresi gir.",
      errConsent: "Hoş geldin hediyesini almak için Sebastian Apps e-postalarına kaydol.",
      errWait: "Lütfen güvenlik kontrolünün bitmesini bekle.",
      errTurnstile: "Güvenlik kontrolü yüklenemedi. Lütfen tekrar dene.",
      errUnavailable: "Ücretsiz ay şu anda kullanılamıyor. Lütfen daha sonra tekrar dene.",
      errCheck: "E-posta adresini kontrol et ve güvenlik kontrolünü tamamla, sonra tekrar dene.",
      errRate: "Çok fazla deneme. Lütfen on dakika sonra tekrar dene.",
      errGeneric: "Kod gönderilemedi. Lütfen tekrar dene.",
      errClaimed: "Bu e-posta adresine ücretsiz ay kodu zaten gönderildi. Her adres hediyeyi yalnızca bir kez alabilir.",
      okEyebrow: "İstek alındı",
      okHeading: "Gelen kutunu kontrol et.",
      okCopy: "{email} için isteği kabul ettik. E-postanda sana özel kod, App Store’da kullanmak için bir düğme, uygulama içi adımlar ve abonelikten çıkma bağlantısı bulunuyor.",
      okQueued: "{email} için isteği kabul ettik. Ücretsiz ay kodun hazır olur olmaz e-postayla gönderilecek.",
      okPreview: "Yalnızca önizleme. E-posta gönderilmedi ve hiçbir şey kaydedilmedi.",
      done: "Bitti",
      close: "Kapat",
      security: "Güvenlik kontrolü"
    }
  };

  var LANG_MAP = { "pt-br": "pt", "zh-hans": "zh" };
  var pageLang = (document.documentElement.lang || "en").toLowerCase();
  var locale = LANG_MAP[pageLang] || pageLang.split("-")[0];
  var t = COPY[locale] || COPY.en;
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
    cta.insertAdjacentElement("afterend", trigger);
    trigger.insertAdjacentElement("afterend", note);

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

      [label, emailInput, consentBox, honeypot, turnstileBox, preparing, messageEl, submitBtn, fine].forEach(function (n) { form.appendChild(n); });
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
