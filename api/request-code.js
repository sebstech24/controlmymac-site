import {
  assignCode,
  consumeRateLimit,
  findExistingEmailHash,
  markDeliveryFailed,
  markDeliverySent,
} from "./_lib/database.js";
import { sendCodeEmail } from "./_lib/brevo.js";
import {
  canonicalEmail,
  clientIp,
  decrypt,
  decryptOptional,
  encrypt,
  fingerprint,
  ipRateBucket,
  isValidEmail,
  normalizeEmail,
  normalizeLocale,
  signUnsubscribeToken,
} from "./_lib/security.js";
import { verifyTurnstile } from "./_lib/turnstile.js";

// v3: single opt-in. Ticking the required box on the form is the consent; there is no
// separate confirmation email any more (api/confirm-newsletter.js only serves old links).
const CONSENT_VERSION = "sebastian-apps-perks-v3-2026-09-26";
// Brand-new addresses (not re-sends) one IP, or IPv6 /64, may claim per day.
const NEW_CODES_PER_IP = 3;
const NEW_CODE_WINDOW_SECONDS = 24 * 60 * 60;
const REQUIRED_ENV = [
  "DATABASE_URL",
  "BREVO_API_KEY",
  "BREVO_SENDER_EMAIL",
  "BREVO_MARKETING_LIST_ID",
  "EMAIL_HASH_SECRET",
  "CODE_ENCRYPTION_KEY",
  "UNSUBSCRIBE_SECRET",
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

// errorKey names the matching message in assets/offer.js so the form can show it
// in the visitor's language.
function failure(status, errorKey, error, extra = {}) {
  return json({ ok: false, error, errorKey, ...extra }, status);
}

function tooManyAttempts() {
  return failure(429, "errRate", "Too many attempts. Please try again in ten minutes.");
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
    return failure(503, "errUnavailable", "The free-month gift isn't available right now.", {
      configured: false,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return failure(400, "errCheck", "Invalid request.");
  }

  if (typeof body.website === "string" && body.website.trim()) {
    return json({ ok: true, queued: false }, 200);
  }

  const email = normalizeEmail(body.email);
  const locale = normalizeLocale(body.locale);
  if (!isValidEmail(email)) {
    return failure(400, "errEmail", "Please enter a valid email address.");
  }
  if (body.marketingOptIn !== true) {
    return failure(
      400,
      "errConsent",
      "Please agree to join Sebastian Apps emails to receive this subscriber welcome gift.",
    );
  }

  if (currentMode === "preview") {
    return json({
      ok: true,
      queued: false,
      preview: true,
      message: "Preview only. No email was sent and nothing was saved.",
    });
  }

  const ip = clientIp(request.headers);
  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return failure(400, "errCheck", "Please complete the security check and try again.");
  }

  // Aliases of one inbox (Gmail dots, +tags, googlemail.com, ...) share one key, so an
  // address can only ever be linked to one code. Rows saved before this existed were
  // hashed from the plain lowercased address; keep recognising those.
  const secret = process.env.EMAIL_HASH_SECRET;
  const canonicalHash = fingerprint(canonicalEmail(email), secret);
  const legacyHash = fingerprint(email, secret);
  const rateKey = fingerprint(`request:${ip}:${canonicalHash}`, secret);
  if (!(await consumeRateLimit(rateKey))) return tooManyAttempts();

  const existingHash = await findExistingEmailHash([legacyHash, canonicalHash]);
  if (!existingHash) {
    const ipKey = fingerprint(`new-code-ip:${ipRateBucket(ip)}`, secret);
    if (!(await consumeRateLimit(ipKey, NEW_CODES_PER_IP, NEW_CODE_WINDOW_SECONDS))) {
      return tooManyAttempts();
    }
  }

  const assigned = await assignCode({
    emailHash: existingHash || canonicalHash,
    emailCiphertext: encrypt(email, process.env.CODE_ENCRYPTION_KEY),
    locale,
    marketingRequested: true,
    consentVersion: CONSENT_VERSION,
  });
  if (assigned?.outcome === "already_claimed") {
    return failure(
      409,
      "errClaimed",
      "This email address has already received its free-month code. Each address can claim the gift once.",
    );
  }
  if (!assigned?.code_ciphertext) {
    return json({
      ok: true,
      queued: true,
      message: "Your request is queued. Your free-month code will be emailed as soon as it is ready.",
    });
  }

  const code = decrypt(assigned.code_ciphertext, process.env.CODE_ENCRYPTION_KEY);
  const redemptionUrl = decryptOptional(
    assigned.redemption_url_ciphertext,
    process.env.CODE_ENCRYPTION_KEY,
  );
  const token = signUnsubscribeToken(assigned.request_id, process.env.UNSUBSCRIBE_SECRET);
  const siteUrl = (process.env.PUBLIC_SITE_URL || "https://controlmymac.com").replace(/\/$/, "");

  let providerMessageId;
  try {
    providerMessageId = await sendCodeEmail({
      requestId: assigned.request_id,
      attempt: assigned.attempt,
      email,
      locale,
      code,
      redemptionUrl,
      expiresAt: assigned.expires_at,
      autoRenews: process.env.FREE_MONTH_AUTO_RENEWS === "true",
      unsubscribeUrl: `${siteUrl}/api/unsubscribe?token=${encodeURIComponent(token)}`,
    });
    await markDeliverySent(assigned.request_id, providerMessageId);
  } catch (error) {
    await markDeliveryFailed(assigned.request_id, error);
    return failure(502, "errGeneric", "We could not send the email yet. Please try again shortly.");
  }

  return json({ ok: true, queued: false, reused: assigned.reused === true });
}
