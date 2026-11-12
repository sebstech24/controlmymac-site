import { escapeHtml, normalizeLocale } from "./security.js";
import { WAITLIST_MAIL } from "./waitlist-copy.js";

const SITE_URL = "https://www.controlmymac.com";
const SENDER = "Sebastian Škoić s.p., Šturmova ulica 7A, 1211 Ljubljana-Šmartno";

/** Plain confirmation email for the Windows/Android waiting list (words: scripts/waitlist-i18n.json). */
export function renderWaitlistEmail({ locale, windows, android, news }) {
  const code = normalizeLocale(locale);
  const t = WAITLIST_MAIL[code] || WAITLIST_MAIL.en;
  const platforms = windows && android ? t.mailBoth : windows ? "Windows" : "Android";
  const fill = (text) => text.replaceAll("{platforms}", platforms);
  const lines = [t.mailHello, fill(t.mailIntro), t.mailSpam];
  if (news) lines.push(t.mailNews);
  lines.push(t.mailLeave);
  const privacyUrl = `${SITE_URL}${code === "en" ? "" : `/${code}`}/privacy`;
  const footer = `${SENDER}, ${t.mailCountry}`;
  const text = `${lines.join("\n\n")}\n\nSebastian\n\n${footer}\n${t.mailPrivacy}: ${privacyUrl}\n`;
  const html =
    `<!doctype html><html lang="${escapeHtml(code)}"><body style="margin:0;padding:24px;background:#f5f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0d1220">` +
    `<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px;font-size:16px;line-height:1.55">` +
    lines.map((line) => `<p style="margin:0 0 16px">${escapeHtml(line)}</p>`).join("") +
    `<p style="margin:0 0 24px">Sebastian</p>` +
    `<p style="margin:0;font-size:12.5px;color:#5b6577">${escapeHtml(footer)} · <a href="${privacyUrl}" style="color:#5b6577">${escapeHtml(t.mailPrivacy)}</a></p>` +
    `</div></body></html>`;
  return { subject: fill(t.mailSubject), text, html };
}

// The one release email the waiting list signed up for (Nov 2026). Only the languages
// that are on the list have copy; anyone else gets English.
const STORE = {
  windows: "https://apps.microsoft.com/detail/9P7H2FKL3JH3",
  android: "https://play.google.com/store/apps/details?id=com.controlmymac.controller",
};
const RELEASE_MAIL = {
  en: {
    subject: "Control My PC for {platforms} is out",
    both: "Windows and Android",
    intro: "You asked me to email you when Control My PC for {platforms} came out. It’s out now, and free to start.",
    windows: "On your Windows PC, install Control My PC from the Microsoft Store: {url}",
    android: "On your Android phone, install Control My PC from Google Play: {url}",
    phone: "On an iPhone or iPad, the phone app is Control My Mac. Open www.controlmymac.com/get on your phone and it takes you to the right store.",
    pair: "Then scan the QR code your computer shows, and your phone becomes a trackpad and keyboard for it.",
    last: "This was the one email you signed up for, so I won’t write again about it. Questions? Just reply.",
  },
  ko: {
    subject: "{platforms}용 Control My PC가 출시되었습니다",
    both: "Windows와 Android",
    intro: "{platforms}용 Control My PC가 출시되면 이메일로 알려 달라고 하셨지요. 지금 출시되었고, 무료로 시작할 수 있습니다.",
    windows: "Windows PC에서는 Microsoft Store에서 Control My PC를 설치하세요: {url}",
    android: "Android 휴대폰에서는 Google Play에서 Control My PC를 설치하세요: {url}",
    phone: "iPhone이나 iPad에서는 휴대폰 앱 이름이 Control My Mac입니다. 휴대폰에서 www.controlmymac.com/get을 열면 맞는 스토어로 이동합니다.",
    pair: "그다음 컴퓨터에 표시되는 QR 코드를 스캔하면 휴대폰이 그 컴퓨터의 트랙패드와 키보드가 됩니다.",
    last: "신청하신 이메일은 이번 한 통뿐이므로 이 건으로 다시 연락드리지 않겠습니다. 궁금한 점이 있으면 이 이메일에 답장해 주세요.",
  },
};

export function renderWaitlistReleaseEmail({ locale, windows, android }) {
  const code = normalizeLocale(locale);
  const t = RELEASE_MAIL[code] || RELEASE_MAIL.en;
  const footerCopy = WAITLIST_MAIL[code] || WAITLIST_MAIL.en;
  const platforms = windows && android ? t.both : windows ? "Windows" : "Android";
  const fill = (text) => text.replaceAll("{platforms}", platforms);
  const lines = [fill(t.intro)];
  if (windows) lines.push(t.windows.replace("{url}", STORE.windows));
  if (android) lines.push(t.android.replace("{url}", STORE.android));
  lines.push(t.phone, t.pair, t.last);
  const privacyUrl = `${SITE_URL}${code === "en" ? "" : `/${code}`}/privacy`;
  const footer = `${SENDER}, ${footerCopy.mailCountry}`;
  const linkify = (line) =>
    escapeHtml(line).replace(/https:\/\/\S+/g, (url) => `<a href="${url}" style="color:#3b5bdb">${url}</a>`);
  const text = `${lines.join("\n\n")}\n\nSebastian\n\n${footer}\n${footerCopy.mailPrivacy}: ${privacyUrl}\n`;
  const html =
    `<!doctype html><html lang="${escapeHtml(code)}"><body style="margin:0;padding:24px;background:#f5f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0d1220">` +
    `<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px;font-size:16px;line-height:1.55">` +
    lines.map((line) => `<p style="margin:0 0 16px">${linkify(line)}</p>`).join("") +
    `<p style="margin:0 0 24px">Sebastian</p>` +
    `<p style="margin:0;font-size:12.5px;color:#5b6577">${escapeHtml(footer)} · <a href="${privacyUrl}" style="color:#5b6577">${escapeHtml(footerCopy.mailPrivacy)}</a></p>` +
    `</div></body></html>`;
  return { subject: fill(t.subject), text, html };
}
