import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, randomBytes } from "node:crypto";
import {
  decrypt,
  encrypt,
  isValidEmail,
  normalizeEmail,
  normalizeLocale,
  signUnsubscribeToken,
  verifyUnsubscribeToken,
} from "../api/_lib/security.js";
import { renderCodeEmail } from "../api/_lib/email-content.js";
import { sendCodeEmail } from "../api/_lib/brevo.js";
import {
  createAppStoreConnectToken,
  parseOfferCodeCsv,
} from "../api/_lib/apple-offers.js";
import { GET as requestCodeStatus, POST as requestCode } from "../api/request-code.js";
import { GET as maintainOffers } from "../api/cron/maintain-offers.js";

test("normalizes and validates email input", () => {
  assert.equal(normalizeEmail("  Person@Example.COM "), "person@example.com");
  assert.equal(isValidEmail("person@example.com"), true);
  assert.equal(isValidEmail("not-an-email"), false);
  assert.equal(normalizeLocale("pt-BR"), "pt");
  assert.equal(normalizeLocale("xx"), "en");
});

test("encrypts personal values and verifies unsubscribe tokens", () => {
  const key = randomBytes(32).toString("base64");
  const ciphertext = encrypt("person@example.com", key);
  assert.notEqual(ciphertext, "person@example.com");
  assert.equal(decrypt(ciphertext, key), "person@example.com");

  const token = signUnsubscribeToken("request-123", "unsubscribe-secret");
  assert.equal(verifyUnsubscribeToken(token, "unsubscribe-secret"), "request-123");
  assert.equal(verifyUnsubscribeToken(`${token}x`, "unsubscribe-secret"), null);
});

test("parses Apple offer-code CSV including quoted commas", () => {
  const rows = parseOfferCodeCsv([
    "Offer Code,Redemption URL,Notes",
    'FREE-ONE,https://apps.apple.com/redeem?code=FREE-ONE,"first, row"',
    "FREE-TWO,https://apps.apple.com/redeem?code=FREE-TWO,second",
  ].join("\n"));
  assert.deepEqual(rows, [
    { code: "FREE-ONE", redemptionUrl: "https://apps.apple.com/redeem?code=FREE-ONE" },
    { code: "FREE-TWO", redemptionUrl: "https://apps.apple.com/redeem?code=FREE-TWO" },
  ]);
});

test("creates a correctly shaped App Store Connect JWT", () => {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const token = createAppStoreConnectToken({
    issuerId: "issuer",
    keyId: "key-id",
    privateKey: privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
    now: 1_700_000_000_000,
  });
  const parts = token.split(".");
  assert.equal(parts.length, 3);
  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  assert.deepEqual(header, { alg: "ES256", kid: "key-id", typ: "JWT" });
  assert.equal(payload.aud, "appstoreconnect-v1");
  assert.equal(payload.exp - payload.iat, 900);
});

test("renders one manual-code email in every supported language", () => {
  for (const locale of ["en", "de", "es", "fr", "it", "ja", "ko", "nl", "pl", "pt", "ru", "tr", "zh"]) {
    const email = renderCodeEmail({
      locale,
      code: "FREE-MONTH-123",
      expiresAt: "2027-01-15T08:00:00.000Z",
      autoRenews: false,
      confirmationUrl: "https://controlmymac.com/api/confirm-newsletter?token=test",
      unsubscribeUrl: "https://controlmymac.com/api/unsubscribe?token=test",
    });
    assert.ok(email.subject.length > 5, locale);
    assert.match(email.html, /FREE-MONTH-123/);
    assert.doesNotMatch(email.html, /SEBASTIAN15|lifetime|apps\.apple\.com\/redeem|Redeem your free month|click the button/i);
    assert.match(email.html, /confirm-newsletter\?token=test/);
    assert.match(email.html, /unsubscribe\?token=test/);
    assert.doesNotMatch(email.html, /\bundefined\b|\bnull\b/);
  }
});

test("sends the fake free-month email through the Brevo API contract", async () => {
  const previousFetch = globalThis.fetch;
  const previousEnv = {
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL,
    BREVO_SANDBOX_MODE: process.env.BREVO_SANDBOX_MODE,
  };
  let request;
  process.env.BREVO_API_KEY = "fake-api-key";
  process.env.BREVO_SENDER_EMAIL = "hello@example.test";
  process.env.BREVO_SANDBOX_MODE = "true";
  globalThis.fetch = async (url, options) => {
    request = { url, options, body: JSON.parse(options.body) };
    return new Response(JSON.stringify({ messageId: "fake-message-id" }), { status: 201 });
  };
  try {
    const messageId = await sendCodeEmail({
      requestId: "00000000-0000-4000-8000-000000000001",
      email: "person@example.test",
      locale: "en",
      code: "CMM-FAKE-7K4P",
      expiresAt: "2027-01-15T08:00:00.000Z",
      autoRenews: false,
      confirmationUrl: "https://example.test/api/confirm-newsletter?token=fake",
      unsubscribeUrl: "https://example.test/api/unsubscribe?token=fake",
    });
    assert.equal(messageId, "fake-message-id");
    assert.equal(request.url, "https://api.brevo.com/v3/smtp/email");
    assert.equal(request.options.headers["api-key"], "fake-api-key");
    assert.equal(request.body.headers["X-Sib-Sandbox"], "drop");
    assert.deepEqual(request.body.tags, ["control-my-mac", "free-month-code"]);
    assert.match(request.body.htmlContent, /CMM-FAKE-7K4P/);
    assert.match(request.body.textContent, /Settings.*Mode.*Redeem Offer Code/s);
    assert.doesNotMatch(request.body.htmlContent, /lifetime|apps\.apple\.com\/redeem/i);
  } finally {
    globalThis.fetch = previousFetch;
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("preview endpoint requires explicit newsletter consent and never stores data", async () => {
  const previous = process.env.CODE_DELIVERY_MODE;
  process.env.CODE_DELIVERY_MODE = "preview";
  try {
    const denied = await requestCode(new Request("https://example.test/api/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "person@example.com", marketingOptIn: false }),
    }));
    assert.equal(denied.status, 400);

    const accepted = await requestCode(new Request("https://example.test/api/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "person@example.com", marketingOptIn: true }),
    }));
    assert.equal(accepted.status, 200);
    assert.deepEqual(await accepted.json(), {
      ok: true,
      queued: false,
      preview: true,
      message: "Preview only. No email was sent and nothing was saved.",
    });
  } finally {
    if (previous === undefined) delete process.env.CODE_DELIVERY_MODE;
    else process.env.CODE_DELIVERY_MODE = previous;
  }
});

test("explicit disabled mode cannot become live merely because secrets exist", async () => {
  const names = [
    "CODE_DELIVERY_MODE", "DATABASE_URL", "BREVO_API_KEY", "BREVO_SENDER_EMAIL",
    "BREVO_MARKETING_LIST_ID", "EMAIL_HASH_SECRET", "CODE_ENCRYPTION_KEY",
    "UNSUBSCRIBE_SECRET", "NEWSLETTER_CONFIRM_SECRET", "TURNSTILE_SITE_KEY",
    "TURNSTILE_SECRET_KEY", "CRON_SECRET",
  ];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  for (const name of names) process.env[name] = "fake-value";
  process.env.CODE_DELIVERY_MODE = "disabled";
  process.env.CRON_SECRET = "fake-cron-secret";
  try {
    const status = await requestCodeStatus();
    assert.deepEqual(await status.json(), {
      configured: false,
      preview: false,
      consentVersion: "sebastian-apps-perks-v2-2026-09-19",
      turnstileSiteKey: null,
    });

    const cron = await maintainOffers(new Request("https://example.test/api/cron/maintain-offers", {
      headers: { authorization: "Bearer fake-cron-secret" },
    }));
    assert.equal(cron.status, 503);
    assert.deepEqual(await cron.json(), { ok: false, disabled: true });
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
