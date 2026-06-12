/* Control My Mac — newsletter signup endpoint (Vercel serverless function).
 *
 *   GET  /api/subscribe           -> { configured: boolean }
 *   POST /api/subscribe {email}   -> { ok: true }
 *                                  | { ok: false, error: string }
 *                                  | { ok: false, configured: false }   (env not set)
 *
 * Zero dependencies. Provider-agnostic: the adapter is picked by env vars,
 * which live ONLY in Vercel (Project -> Settings -> Environment Variables).
 * This repo is public — no key ever appears in code.
 *
 *   NEWSLETTER_PROVIDER  "kit" (default) | "mailerlite"
 *   NEWSLETTER_API_KEY   Kit V4 API key, or MailerLite API token
 *   NEWSLETTER_GROUP_ID  optional, MailerLite only: a group id to file
 *                        new subscribers into
 *
 * Abuse resistance (best effort — serverless instances don't share memory):
 * >5 POSTs per minute per IP are rejected, and a hidden "website" honeypot
 * field silently swallows bot submissions.
 */

// Vercel's Node runtime provides process.env; declared here so the file
// type-checks without installing @types/node in a dependency-free repo.
declare const process: { env: Record<string, string | undefined> };

type Provider = "kit" | "mailerlite";

interface Config {
  provider: Provider;
  apiKey: string;
  groupId: string;
}

interface ProviderResult {
  ok: boolean;
  error: string;
}

const GENERIC_ERROR =
  "The signup service had a hiccup — please try again in a moment.";
const INVALID_EMAIL = "Please enter a valid email address.";

function getConfig(): Config | null {
  const apiKey = (process.env.NEWSLETTER_API_KEY || "").trim();
  if (!apiKey) {
    return null;
  }
  const raw = (process.env.NEWSLETTER_PROVIDER || "kit").trim().toLowerCase();
  const provider: Provider = raw === "mailerlite" ? "mailerlite" : "kit";
  return {
    provider: provider,
    apiKey: apiKey,
    groupId: (process.env.NEWSLETTER_GROUP_ID || "").trim(),
  };
}

function isValidEmail(email: string): boolean {
  return (
    email.length >= 6 &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  );
}

/* ---- best-effort in-memory rate limit: >5 req/min per IP ---- */
const WINDOW_MS = 60000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(function (t) {
    return now - t < WINDOW_MS;
  });
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    hits.forEach(function (stamps, key) {
      if (
        stamps.every(function (t) {
          return now - t >= WINDOW_MS;
        })
      ) {
        hits.delete(key);
      }
    });
  }
  return recent.length > MAX_PER_WINDOW;
}

/* ---- provider adapters (real, verified endpoints) ---- */

// Kit (kit.com) V4 — upsert; 201 = created, 200 = existing subscriber updated.
async function addToKit(
  apiKey: string,
  email: string
): Promise<ProviderResult> {
  const res = await fetch("https://api.kit.com/v4/subscribers", {
    method: "POST",
    headers: {
      "X-Kit-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email_address: email }),
  });
  if (res.status === 200 || res.status === 201) {
    return { ok: true, error: "" };
  }
  if (res.status === 422) {
    return { ok: false, error: INVALID_EMAIL };
  }
  return { ok: false, error: GENERIC_ERROR };
}

// MailerLite Connect — upsert; optional group via NEWSLETTER_GROUP_ID.
async function addToMailerLite(
  apiKey: string,
  groupId: string,
  email: string
): Promise<ProviderResult> {
  const payload: { email: string; groups?: string[] } = { email: email };
  if (groupId) {
    payload.groups = [groupId];
  }
  const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (res.status === 200 || res.status === 201) {
    return { ok: true, error: "" };
  }
  if (res.status === 422) {
    return { ok: false, error: INVALID_EMAIL };
  }
  return { ok: false, error: GENERIC_ERROR };
}

/* ---- handlers ---- */

function json(body: object, status: number): Response {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export function GET(): Response {
  return json({ configured: getConfig() !== null }, 200);
}

export async function POST(request: Request): Promise<Response> {
  const config = getConfig();
  if (config === null) {
    // Tells the front-end to keep every signup form hidden.
    return json({ ok: false, configured: false }, 200);
  }

  const forwarded = request.headers.get("x-forwarded-for") || "unknown";
  const ip = forwarded.split(",")[0].trim();
  if (isRateLimited(ip)) {
    return json(
      { ok: false, error: "Too many attempts — please try again in a minute." },
      429
    );
  }

  let body: { email?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  // Honeypot: humans never see the "website" field; bots fill it.
  // Pretend success so they move on.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return json({ ok: true }, 200);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!isValidEmail(email)) {
    return json({ ok: false, error: INVALID_EMAIL }, 400);
  }

  try {
    const result =
      config.provider === "mailerlite"
        ? await addToMailerLite(config.apiKey, config.groupId, email)
        : await addToKit(config.apiKey, email);
    if (result.ok) {
      return json({ ok: true }, 200);
    }
    // Friendly message only — provider internals never reach the client.
    return json({ ok: false, error: result.error }, 502);
  } catch (e) {
    return json({ ok: false, error: GENERIC_ERROR }, 502);
  }
}
