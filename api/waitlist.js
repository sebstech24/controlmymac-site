import { consumeRateLimit, joinPlatformWaitlist } from "./_lib/database.js";
import {
  canonicalEmail,
  clientIp,
  encrypt,
  fingerprint,
  ipRateBucket,
  isValidEmail,
  normalizeEmail,
  normalizeLocale,
} from "./_lib/security.js";
import { verifyTurnstile } from "./_lib/turnstile.js";

// Windows and Android waiting list. Stores the address for one release announcement per
// platform; it never touches the Sebastian Apps mailing list or the free-month codes.
const CONSENT_VERSION = "platform-waitlist-v1-2026-10-05";
const JOINS_PER_IP = 10;
const JOIN_WINDOW_SECONDS = 24 * 60 * 60;
const REQUIRED_ENV = [
  "DATABASE_URL",
  "EMAIL_HASH_SECRET",
  "CODE_ENCRYPTION_KEY",
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

function configured() {
  return REQUIRED_ENV.every((name) => Boolean(process.env[name]));
}

// errorKey names the matching message in assets/waitlist.js so the form can show it
// in the visitor's language.
function failure(status, errorKey, error) {
  return json({ ok: false, error, errorKey }, status);
}

export function GET() {
  const ready = configured();
  return json({
    configured: ready,
    consentVersion: CONSENT_VERSION,
    turnstileSiteKey: ready ? process.env.TURNSTILE_SITE_KEY : null,
  });
}

export async function POST(request) {
  if (!configured()) {
    return failure(503, "errUnavailable", "The list isn't available right now.");
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return failure(400, "errCheck", "Invalid request.");
  }

  if (typeof body.website === "string" && body.website.trim()) {
    return json({ ok: true });
  }

  const email = normalizeEmail(body.email);
  const windows = body.windows === true;
  const android = body.android === true;
  if (!isValidEmail(email)) {
    return failure(400, "errEmail", "Please enter a valid email address.");
  }
  if (!windows && !android) {
    return failure(400, "errPick", "Pick Windows, Android or both.");
  }
  if (body.consent !== true) {
    return failure(400, "errConsent", "Please tick the box to join the list.");
  }

  const ip = clientIp(request.headers);
  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return failure(400, "errCheck", "Please complete the security check and try again.");
  }

  const secret = process.env.EMAIL_HASH_SECRET;
  const emailHash = fingerprint(`waitlist:${canonicalEmail(email)}`, secret);
  const allowed =
    (await consumeRateLimit(fingerprint(`waitlist:${ip}:${emailHash}`, secret))) &&
    (await consumeRateLimit(
      fingerprint(`waitlist-ip:${ipRateBucket(ip)}`, secret),
      JOINS_PER_IP,
      JOIN_WINDOW_SECONDS,
    ));
  if (!allowed) {
    return failure(429, "errRate", "Too many attempts. Please try again later.");
  }

  await joinPlatformWaitlist({
    emailHash,
    emailCiphertext: encrypt(email, process.env.CODE_ENCRYPTION_KEY),
    locale: normalizeLocale(body.locale),
    windows,
    android,
    consentVersion: CONSENT_VERSION,
  });
  return json({ ok: true });
}
