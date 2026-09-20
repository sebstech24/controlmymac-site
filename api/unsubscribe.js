import {
  findRequestForUnsubscribe,
  markMarketingRemoved,
  markMarketingUnsubscribed,
} from "./_lib/database.js";
import { unsubscribeContact } from "./_lib/brevo.js";
import { decrypt, escapeHtml, verifyUnsubscribeToken } from "./_lib/security.js";

function page(title, body, token = "") {
  const action = token
    ? `<form method="post"><input type="hidden" name="token" value="${escapeHtml(token)}"><button type="submit">Unsubscribe</button></form>`
    : "";
  return new Response(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title><body style="margin:0;background:#f6f8ff;color:#17213a;font:16px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"><main style="max-width:560px;margin:12vh auto;padding:36px;border:1px solid #dfe6f5;border-radius:18px;background:white"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(body)}</p>${action}<style>button{border:0;border-radius:10px;background:#4f63ef;color:white;padding:12px 18px;font:inherit;font-weight:700;cursor:pointer}</style></main></body></html>`, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function requestIdFromToken(token) {
  if (!process.env.UNSUBSCRIBE_SECRET) return null;
  return verifyUnsubscribeToken(token, process.env.UNSUBSCRIBE_SECRET);
}

export function GET(request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!requestIdFromToken(token)) {
    return page("Link expired", "This unsubscribe link is not valid.");
  }
  return page(
    "Stop Sebastian Apps emails?",
    "You will keep any codes already sent to you. This only stops future news and offers.",
    token,
  );
}

export async function POST(request) {
  const form = await request.formData();
  const token = String(form.get("token") || "");
  const requestId = requestIdFromToken(token);
  if (!requestId) return page("Link expired", "This unsubscribe link is not valid.");

  const record = await findRequestForUnsubscribe(requestId);
  if (!record) return page("Already removed", "This address is no longer on the list.");
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
  return page("You are unsubscribed", "You will not receive future Sebastian Apps marketing emails.");
}
