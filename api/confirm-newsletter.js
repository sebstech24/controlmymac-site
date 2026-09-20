import {
  findRequestForUnsubscribe,
  markMarketingConfirmed,
  markMarketingSubscribed,
} from "./_lib/database.js";
import { subscribeContact } from "./_lib/brevo.js";
import { decrypt, escapeHtml, verifyNewsletterConfirmToken } from "./_lib/security.js";

function page(title, body, token = "") {
  const action = token
    ? `<form method="post"><input type="hidden" name="token" value="${escapeHtml(token)}"><button type="submit">Confirm emails</button></form>`
    : "";
  return new Response(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title><body style="margin:0;background:#f6f8ff;color:#17213a;font:16px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"><main style="max-width:560px;margin:12vh auto;padding:36px;border:1px solid #dfe6f5;border-radius:18px;background:white"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(body)}</p>${action}<style>button{border:0;border-radius:10px;background:#4f63ef;color:white;padding:12px 18px;font:inherit;font-weight:700;cursor:pointer}</style></main></body></html>`, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function requestIdFromToken(token) {
  if (!process.env.NEWSLETTER_CONFIRM_SECRET) return null;
  return verifyNewsletterConfirmToken(token, process.env.NEWSLETTER_CONFIRM_SECRET);
}

export function GET(request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!requestIdFromToken(token)) {
    return page("Link expired", "This confirmation link is not valid.");
  }
  return page(
    "Confirm Sebastian Apps emails",
    "Confirm to receive future app news, launch offers, and occasional free codes. You can unsubscribe at any time.",
    token,
  );
}

export async function POST(request) {
  const form = await request.formData();
  const token = String(form.get("token") || "");
  const requestId = requestIdFromToken(token);
  if (!requestId) return page("Link expired", "This confirmation link is not valid.");

  const record = await findRequestForUnsubscribe(requestId);
  if (!record) return page("Link expired", "This confirmation link is not valid.");
  if (Date.now() - new Date(record.created_at).getTime() > 30 * 24 * 60 * 60 * 1000) {
    return page("Link expired", "Request a new welcome email to confirm your subscription.");
  }

  await markMarketingConfirmed(requestId);
  const email = decrypt(record.email_ciphertext, process.env.CODE_ENCRYPTION_KEY);
  try {
    await subscribeContact({ email, locale: record.locale || "en" });
    await markMarketingSubscribed(requestId);
  } catch {
    // Consent is safely recorded; the authenticated maintenance job retries Brevo.
  }
  return page("Email confirmed", "You are subscribed to Sebastian Apps emails. You can unsubscribe at any time.");
}
