import {
  findRequestForUnsubscribe,
  markMarketingRemoved,
  markMarketingUnsubscribed,
} from "./_lib/database.js";
import { unsubscribeContact } from "./_lib/brevo.js";
import {
  SUPPORTED_LOCALES,
  decrypt,
  escapeHtml,
  normalizeLocale,
  verifyUnsubscribeToken,
} from "./_lib/security.js";

const COPY = {
  en: {
    invalidTitle: "Link expired", invalidBody: "This unsubscribe link is not valid.",
    askTitle: "Stop Sebastian Apps emails?", askBody: "You will keep any codes already sent to you. This only stops future news and offers.",
    button: "Unsubscribe",
    goneTitle: "Already removed", goneBody: "This address is no longer on the list.",
    doneTitle: "You are unsubscribed", doneBody: "You will not receive future Sebastian Apps marketing emails.",
  },
  de: {
    invalidTitle: "Link abgelaufen", invalidBody: "Dieser Abmeldelink ist ungültig.",
    askTitle: "Keine E-Mails mehr von Sebastian Apps?", askBody: "Bereits erhaltene Codes behältst du. Du bekommst nur keine Neuigkeiten und Angebote mehr.",
    button: "Abmelden",
    goneTitle: "Bereits entfernt", goneBody: "Diese Adresse steht nicht mehr auf der Liste.",
    doneTitle: "Du bist abgemeldet", doneBody: "Du erhältst keine Marketing-E-Mails von Sebastian Apps mehr.",
  },
  es: {
    invalidTitle: "Enlace caducado", invalidBody: "Este enlace para darte de baja no es válido.",
    askTitle: "¿Dejar de recibir correos de Sebastian Apps?", askBody: "Conservarás los códigos que ya te hayamos enviado. Solo dejarás de recibir novedades y ofertas.",
    button: "Darme de baja",
    goneTitle: "Dirección ya eliminada", goneBody: "Esta dirección ya no está en la lista.",
    doneTitle: "Te has dado de baja", doneBody: "Ya no recibirás correos promocionales de Sebastian Apps.",
  },
  fr: {
    invalidTitle: "Lien expiré", invalidBody: "Ce lien de désabonnement n’est pas valide.",
    askTitle: "Ne plus recevoir les e-mails Sebastian Apps\u00a0?", askBody: "Vous conservez les codes déjà reçus. Seules les prochaines nouvelles et offres s’arrêtent.",
    button: "Se désabonner",
    goneTitle: "Adresse déjà retirée", goneBody: "Cette adresse ne figure plus sur la liste.",
    doneTitle: "Désabonnement effectué", doneBody: "Vous ne recevrez plus d’e-mails marketing de Sebastian Apps.",
  },
  it: {
    invalidTitle: "Link scaduto", invalidBody: "Questo link per annullare l’iscrizione non è valido.",
    askTitle: "Non ricevere più email da Sebastian Apps?", askBody: "Conserverai i codici già ricevuti. Smetterai solo di ricevere novità e offerte.",
    button: "Annulla l’iscrizione",
    goneTitle: "Indirizzo già rimosso", goneBody: "Questo indirizzo non è più nella lista.",
    doneTitle: "Iscrizione annullata", doneBody: "Non riceverai più email promozionali da Sebastian Apps.",
  },
  ja: {
    invalidTitle: "リンクの有効期限が切れています", invalidBody: "この配信停止リンクは無効です。",
    askTitle: "Sebastian Appsのメール配信を停止しますか？", askBody: "すでにお送りしたコードはそのままご利用いただけます。停止されるのは今後のお知らせとオファーのみです。",
    button: "配信を停止",
    goneTitle: "すでに削除されています", goneBody: "このアドレスはリストに登録されていません。",
    doneTitle: "配信を停止しました", doneBody: "今後、Sebastian Appsからマーケティングメールは届きません。",
  },
  ko: {
    invalidTitle: "만료된 링크", invalidBody: "이 수신 거부 링크는 유효하지 않습니다.",
    askTitle: "Sebastian Apps 이메일 수신을 중단할까요?", askBody: "이미 받은 코드는 그대로 사용할 수 있습니다. 앞으로의 소식과 혜택 이메일만 중단됩니다.",
    button: "수신 거부",
    goneTitle: "이미 삭제됨", goneBody: "이 주소는 더 이상 목록에 없습니다.",
    doneTitle: "수신 거부되었습니다", doneBody: "앞으로 Sebastian Apps 마케팅 이메일을 받지 않습니다.",
  },
  nl: {
    invalidTitle: "Link verlopen", invalidBody: "Deze afmeldlink is niet geldig.",
    askTitle: "Geen e-mails meer van Sebastian Apps?", askBody: "Codes die je al hebt ontvangen, blijf je houden. Je krijgt alleen geen nieuws en aanbiedingen meer.",
    button: "Afmelden",
    goneTitle: "Al verwijderd", goneBody: "Dit adres staat niet meer op de lijst.",
    doneTitle: "Je bent afgemeld", doneBody: "Je ontvangt geen marketing-e-mails van Sebastian Apps meer.",
  },
  pl: {
    invalidTitle: "Link wygasł", invalidBody: "Ten link do wypisania się jest nieprawidłowy.",
    askTitle: "Zrezygnować z e-maili Sebastian Apps?", askBody: "Już wysłane kody pozostają Twoje. Przestaniesz tylko otrzymywać nowości i oferty.",
    button: "Wypisz mnie",
    goneTitle: "Adres już usunięty", goneBody: "Tego adresu nie ma już na liście.",
    doneTitle: "Wypisano z listy", doneBody: "Nie będziesz już otrzymywać e-maili marketingowych od Sebastian Apps.",
  },
  pt: {
    invalidTitle: "Link expirado", invalidBody: "Este link de cancelamento não é válido.",
    askTitle: "Parar de receber e-mails da Sebastian Apps?", askBody: "Você continua com os códigos que já recebeu. Isso só interrompe novidades e ofertas futuras.",
    button: "Cancelar inscrição",
    goneTitle: "Endereço já removido", goneBody: "Este endereço não está mais na lista.",
    doneTitle: "Inscrição cancelada", doneBody: "Você não vai mais receber e-mails de marketing da Sebastian Apps.",
  },
  ru: {
    invalidTitle: "Ссылка устарела", invalidBody: "Эта ссылка для отписки недействительна.",
    askTitle: "Отписаться от писем Sebastian Apps?", askBody: "Уже полученные коды останутся у вас. Вы просто перестанете получать новости и предложения.",
    button: "Отписаться",
    goneTitle: "Адрес уже удалён", goneBody: "Этого адреса больше нет в списке.",
    doneTitle: "Вы отписались", doneBody: "Вы больше не будете получать рекламные письма Sebastian Apps.",
  },
  tr: {
    invalidTitle: "Bağlantının süresi doldu", invalidBody: "Bu abonelikten çıkma bağlantısı geçerli değil.",
    askTitle: "Sebastian Apps e-postaları durdurulsun mu?", askBody: "Size daha önce gönderilen kodlar geçerliliğini korur. Yalnızca haberler ve teklifler durur.",
    button: "Abonelikten çık",
    goneTitle: "Adres zaten kaldırıldı", goneBody: "Bu adres artık listede değil.",
    doneTitle: "Abonelikten çıktınız", doneBody: "Artık Sebastian Apps pazarlama e-postaları almayacaksınız.",
  },
  zh: {
    invalidTitle: "链接已失效", invalidBody: "此退订链接无效。",
    askTitle: "不再接收 Sebastian Apps 邮件？", askBody: "已发送给您的代码仍然有效。退订只会停止今后的新闻和优惠。",
    button: "退订",
    goneTitle: "已移除", goneBody: "此邮箱已不在列表中。",
    doneTitle: "已退订", doneBody: "您将不再收到 Sebastian Apps 的营销邮件。",
  },
};

/** The browser's first supported language, for links that don't lead to a stored request. */
function browserLocale(request) {
  const header = request.headers.get("accept-language") || "";
  for (const part of header.split(",")) {
    const locale = part.split(";")[0].trim().toLowerCase().split(/[-_]/)[0];
    if (SUPPORTED_LOCALES.has(locale)) return locale;
  }
  return "en";
}

function page(locale, titleKey, bodyKey, token = "") {
  const language = normalizeLocale(locale);
  const copy = COPY[language] || COPY.en;
  const title = copy[titleKey];
  const action = token
    ? `<form method="post"><input type="hidden" name="token" value="${escapeHtml(token)}"><button type="submit">${escapeHtml(copy.button)}</button></form>`
    : "";
  return new Response(`<!doctype html><html lang="${language}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title><body style="margin:0;background:#f6f8ff;color:#17213a;font:16px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"><main style="max-width:560px;margin:12vh auto;padding:36px;border:1px solid #dfe6f5;border-radius:18px;background:white"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(copy[bodyKey])}</p>${action}<style>button{border:0;border-radius:10px;background:#4f63ef;color:white;padding:12px 18px;font:inherit;font-weight:700;cursor:pointer}</style></main></body></html>`, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function requestIdFromToken(token) {
  if (!process.env.UNSUBSCRIBE_SECRET) return null;
  return verifyUnsubscribeToken(token, process.env.UNSUBSCRIBE_SECRET);
}

async function findRecord(requestId) {
  try {
    return await findRequestForUnsubscribe(requestId);
  } catch {
    return null;
  }
}

export async function GET(request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const requestId = requestIdFromToken(token);
  if (!requestId) return page(browserLocale(request), "invalidTitle", "invalidBody");
  // Read only: the page speaks the language the gift was requested in. Nothing changes until
  // the person presses the button, so link scanners opening this page unsubscribe no one.
  const record = await findRecord(requestId);
  return page(record?.locale || browserLocale(request), "askTitle", "askBody", token);
}

export async function POST(request) {
  const form = await request.formData();
  const token = String(form.get("token") || "");
  const requestId = requestIdFromToken(token);
  if (!requestId) return page(browserLocale(request), "invalidTitle", "invalidBody");

  const record = await findRequestForUnsubscribe(requestId);
  if (!record) return page(browserLocale(request), "goneTitle", "goneBody");
  if (!record.marketing_unsubscribed_at) {
    const email = decrypt(record.email_ciphertext, process.env.CODE_ENCRYPTION_KEY);
    await markMarketingUnsubscribed(requestId);
    try {
      await unsubscribeContact(email);
      await markMarketingRemoved(requestId);
    } catch {
      // The preference is effective immediately in our database. The daily
      // maintenance job keeps retrying removal from the provider list.
    }
  }
  return page(record.locale || browserLocale(request), "doneTitle", "doneBody");
}
