import {
  activePushDevices,
  markPushDelivered,
  markPushFailed,
} from "../_lib/database.js";
import { sendApnsBatch, shouldDisableDevice } from "../_lib/apns.js";
import { decrypt } from "../_lib/security.js";

const REQUIRED_ENV = [
  "DATABASE_URL", "CODE_ENCRYPTION_KEY", "ADMIN_API_KEY",
  "APNS_TEAM_ID", "APNS_KEY_ID", "APNS_PRIVATE_KEY", "APNS_BUNDLE_ID",
];

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function validUpdateUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["controlmymac.com", "www.controlmymac.com"].includes(url.hostname)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export async function POST(request) {
  if (!process.env.ADMIN_API_KEY ||
      request.headers.get("authorization") !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return json({ ok: false }, 401);
  }
  if (process.env.PUSH_REGISTRATION_MODE !== "ready" ||
      !REQUIRED_ENV.every((name) => Boolean(process.env[name]))) {
    return json({ ok: false, configured: false }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }
  const title = String(body.title || "").trim();
  const message = String(body.body || "").trim();
  const version = String(body.version || "").trim().slice(0, 30);
  const url = validUpdateUrl(body.url);
  if (!title || title.length > 80 || !message || message.length > 220 || (body.url && !url)) {
    return json({ ok: false, error: "Provide a title (1-80), body (1-220), and optional controlmymac.com HTTPS URL." }, 400);
  }

  const requestedLimit = Number(body.limit || 100);
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 100;
  const records = await activePushDevices(limit);
  const devices = records.map((record) => ({
    ...record,
    deviceToken: decrypt(record.token_ciphertext, process.env.CODE_ENCRYPTION_KEY),
  }));
  const results = await sendApnsBatch(devices, { title, body: message, version, url });

  let delivered = 0;
  let disabled = 0;
  let failed = 0;
  await Promise.all(results.map(async (result) => {
    if (result.status === 200) {
      delivered += 1;
      await markPushDelivered(result.token_hash);
      return;
    }
    const shouldDisable = shouldDisableDevice(result.status, result.reason);
    if (shouldDisable) disabled += 1;
    else failed += 1;
    await markPushFailed(result.token_hash, `${result.status}: ${result.reason || "APNs rejected notification"}`, shouldDisable);
  }));

  return json({ ok: failed === 0, attempted: results.length, delivered, disabled, failed });
}
