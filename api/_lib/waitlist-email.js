import { escapeHtml, normalizeLocale } from "./security.js";
import { WAITLIST_MAIL } from "./waitlist-copy.js";

const SITE_URL = "https://www.controlmymac.com";
const SENDER = "Sebastian Apps, Šturmova ulica 7A, Ljubljana";

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
