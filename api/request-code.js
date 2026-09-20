import {
  assignCode,
  consumeRateLimit,
  markDeliveryFailed,
  markDeliverySent,
} from "./_lib/database.js";
import { sendCodeEmail } from "./_lib/brevo.js";
import {
  decrypt,
  encrypt,
  fingerprint,
  isValidEmail,
  normalizeEmail,
  normalizeLocale,
  signNewsletterConfirmToken,
  signUnsubscribeToken,
} from "./_lib/security.js";
import { verifyTurnstile } from "./_lib/turnstile.js";

const CONSENT_VERSION = "sebastian-apps-perks-v2-2026-09-19";
const REQUIRED_ENV = [
  "DATABASE_URL",
  "BREVO_API_KEY",
  "BREVO_SENDER_EMAIL",
  "BREVO_MARKETING_LIST_ID",
  "EMAIL_HASH_SECRET",
  "CODE_ENCRYPTION_KEY",
  "UNSUBSCRIBE_SECRET",
  "NEWSLETTER_CONFIRM_SECRET",
  "TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
];

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function mode() {
  if (process.env.CODE_DELIVERY_MODE === "preview") return "preview";
  if (
    process.env.CODE_DELIVERY_MODE === "ready" &&
    REQUIRED_ENV.every((name) => Boolean(process.env[name]))
  ) return "ready";
  return "disabled";
}

function remoteIp(request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  return (request.headers.get("cf-connecting-ip") || forwarded.split(",")[0] || "unknown").trim();
}

export function GET() {
  const currentMode = mode();
  return json({
    configured: currentMode !== "disabled",
    preview: currentMode === "preview",
    consentVersion: CONSENT_VERSION,
    turnstileSiteKey: currentMode === "ready" ? process.env.TURNSTILE_SITE_KEY : null,
  });
}

export async function POST(request) {
  const currentMode = mode();
  if (currentMode === "disabled") {
    return json({ ok: false, configured: false }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  if (typeof body.website === "string" && body.website.trim()) {
    return json({ ok: true, queued: false }, 200);
  }

  const email = normalizeEmail(body.email);
  const locale = normalizeLocale(body.locale);
  if (!isValidEmail(email)) {
    return json({ ok: false, error: "Please enter a valid email address." }, 400);
  }
  if (body.marketingOptIn !== true) {
    return json({
      ok: false,
      error: "Please agree to join Sebastian Apps emails to receive this subscriber welcome gift.",
    }, 400);
  }

  if (currentMode === "preview") {
    return json({
      ok: true,
      queued: false,
      preview: true,
      message: "Preview only. No email was sent and nothing was saved.",
    });
  }

  const ip = remoteIp(request);
  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return json({ ok: false, error: "Please complete the security check and try again." }, 400);
  }

  const emailHash = fingerprint(email, process.env.EMAIL_HASH_SECRET);
  const rateKey = fingerprint(`request:${ip}:${emailHash}`, process.env.EMAIL_HASH_SECRET);
  if (!(await consumeRateLimit(rateKey))) {
    return json({ ok: false, error: "Too many attempts. Please try again in ten minutes." }, 429);
  }

  const assigned = await assignCode({
    emailHash,
    emailCiphertext: encrypt(email, process.env.CODE_ENCRYPTION_KEY),
    locale,
    marketingRequested: true,
    consentVersion: CONSENT_VERSION,
  });
  if (!assigned?.code_ciphertext) {
    return json({
      ok: true,
      queued: true,
      message: "Your request is queued. Your free-month code will be emailed as soon as it is ready.",
    });
  }

  const code = decrypt(assigned.code_ciphertext, process.env.CODE_ENCRYPTION_KEY);
  const token = signUnsubscribeToken(assigned.request_id, process.env.UNSUBSCRIBE_SECRET);
  const confirmToken = signNewsletterConfirmToken(
    assigned.request_id,
    process.env.NEWSLETTER_CONFIRM_SECRET,
  );
  const siteUrl = (process.env.PUBLIC_SITE_URL || "https://controlmymac.com").replace(/\/$/, "");

  let providerMessageId;
  try {
    providerMessageId = await sendCodeEmail({
      requestId: assigned.request_id,
      email,
      locale,
      code,
      expiresAt: assigned.expires_at,
      autoRenews: process.env.FREE_MONTH_AUTO_RENEWS === "true",
      confirmationUrl: `${siteUrl}/api/confirm-newsletter?token=${encodeURIComponent(confirmToken)}`,
      unsubscribeUrl: `${siteUrl}/api/unsubscribe?token=${encodeURIComponent(token)}`,
    });
    await markDeliverySent(assigned.request_id, providerMessageId);
  } catch (error) {
    await markDeliveryFailed(assigned.request_id, error);
    return json({ ok: false, error: "We could not send the email yet. Please try again shortly." }, 502);
  }

  return json({ ok: true, queued: false, reused: assigned.reused === true });
}
