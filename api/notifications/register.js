import { consumeRateLimit, upsertPushDevice } from "../_lib/database.js";
import { encrypt, fingerprint, normalizeLocale } from "../_lib/security.js";

const REQUIRED_ENV = ["DATABASE_URL", "EMAIL_HASH_SECRET", "CODE_ENCRYPTION_KEY"];

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function isReady() {
  return process.env.PUSH_REGISTRATION_MODE === "ready" &&
    REQUIRED_ENV.every((name) => Boolean(process.env[name]));
}

function remoteIp(request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  return (request.headers.get("cf-connecting-ip") || forwarded.split(",")[0] || "unknown").trim();
}

export function GET() {
  return json({ configured: isReady() });
}

export async function POST(request) {
  if (!isReady()) return json({ ok: false, configured: false }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  const deviceToken = String(body.deviceToken || "").trim().toLowerCase();
  const installationId = String(body.installationId || "").trim().toLowerCase();
  const environment = body.environment === "sandbox" ? "sandbox" :
    body.environment === "production" ? "production" : null;
  const appVersion = String(body.appVersion || "unknown").trim().slice(0, 80);
  if (!/^[a-f0-9]{64,200}$/.test(deviceToken) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(installationId) ||
      !environment) {
    return json({ ok: false, error: "Invalid registration." }, 400);
  }

  const secret = process.env.EMAIL_HASH_SECRET;
  const installationHash = fingerprint(`push-installation:${installationId}`, secret);
  const tokenHash = fingerprint(`push-token:${deviceToken}`, secret);
  const rateKey = fingerprint(`push-register:${remoteIp(request)}:${installationHash}`, secret);
  if (!(await consumeRateLimit(rateKey, 20, 600))) {
    return json({ ok: false, error: "Too many attempts." }, 429);
  }

  await upsertPushDevice({
    installationHash,
    tokenHash,
    tokenCiphertext: encrypt(deviceToken, process.env.CODE_ENCRYPTION_KEY),
    environment,
    locale: normalizeLocale(body.locale),
    appVersion,
  });
  return json({ ok: true });
}
