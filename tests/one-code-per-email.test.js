import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import {
  canonicalEmail,
  clientIp,
  encrypt,
  fingerprint,
  ipRateBucket,
  normalizeEmail,
} from "../api/_lib/security.js";
import { setDatabaseClient } from "../api/_lib/database.js";
import { sendCodeEmail } from "../api/_lib/brevo.js";
import { POST as requestCode } from "../api/request-code.js";

const HASH_SECRET = "test-email-hash-secret";
const ENCRYPTION_KEY = randomBytes(32).toString("base64");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const hashOf = (value) => fingerprint(value, HASH_SECRET);

/**
 * A stand-in for the Neon tagged-template client. It answers the handful of queries the
 * request flow makes: rate-limit buckets count attempts per key like consume_rate_limit,
 * code_requests lookups read `rows`, and assign_offer_code defers to `assign`.
 */
function fakeDatabase({ rows = [], assign } = {}) {
  const calls = [];
  const buckets = new Map();
  const sql = async (strings, ...values) => {
    const text = strings.join("?");
    calls.push({ text, values });
    if (text.includes("consume_rate_limit")) {
      const [key, limit] = values;
      buckets.set(key, (buckets.get(key) || 0) + 1);
      return [{ allowed: buckets.get(key) <= limit }];
    }
    if (text.includes("from code_requests") && text.includes("email_hash = any")) {
      return rows.filter((row) => values[0].includes(row.email_hash));
    }
    if (text.includes("assign_offer_code")) return [assign(values)];
    return [];
  };
  const callsTo = (fragment) => calls.filter((call) => call.text.includes(fragment));
  return { sql, calls, rows, callsTo };
}

/** Everything request-code.js needs to run in "ready" mode, with fetch faked. */
async function withLiveFlow(database, run) {
  const env = {
    CODE_DELIVERY_MODE: "ready",
    DATABASE_URL: "postgres://fake",
    BREVO_API_KEY: "fake-api-key",
    BREVO_SENDER_EMAIL: "hello@example.test",
    BREVO_MARKETING_LIST_ID: "1",
    BREVO_SANDBOX_MODE: "true",
    EMAIL_HASH_SECRET: HASH_SECRET,
    CODE_ENCRYPTION_KEY: ENCRYPTION_KEY,
    UNSUBSCRIBE_SECRET: "fake-unsubscribe-secret",
    NEWSLETTER_CONFIRM_SECRET: "fake-confirm-secret",
    TURNSTILE_SITE_KEY: "fake-site-key",
    TURNSTILE_SECRET_KEY: "fake-turnstile-secret",
  };
  const previousEnv = Object.fromEntries(Object.keys(env).map((name) => [name, process.env[name]]));
  const previousFetch = globalThis.fetch;
  const emails = [];
  Object.assign(process.env, env);
  setDatabaseClient(database.sql);
  globalThis.fetch = async (url, options) => {
    if (String(url).includes("challenges.cloudflare.com")) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    if (String(url).startsWith("https://api.brevo.com/v3/smtp/email")) {
      emails.push(JSON.parse(options.body));
      return new Response(JSON.stringify({ messageId: `fake-${emails.length}` }), { status: 201 });
    }
    throw new Error(`Unexpected fetch in test: ${url}`);
  };
  try {
    await run({ emails });
  } finally {
    globalThis.fetch = previousFetch;
    setDatabaseClient(undefined);
    for (const [name, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

function submit(email, headers = {}) {
  return requestCode(new Request("https://example.test/api/request-code", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "203.0.113.7", ...headers },
    body: JSON.stringify({ email, locale: "en", marketingOptIn: true, turnstileToken: "ok" }),
  }));
}

function codeRow(overrides = {}) {
  return {
    request_id: "00000000-0000-4000-8000-000000000001",
    code_ciphertext: encrypt("CMM-TEST-CODE", ENCRYPTION_KEY),
    redemption_url_ciphertext: null,
    expires_at: "2027-01-15T08:00:00.000Z",
    reused: false,
    marketing_subscribed_at: null,
    outcome: "assigned",
    attempt: 1,
    ...overrides,
  };
}

test("canonical email folds aliases of one inbox and keeps distinct inboxes apart", () => {
  const same = (variants, expected) => {
    for (const variant of variants) assert.equal(canonicalEmail(variant), expected, variant);
  };
  same([
    "johndoe@gmail.com",
    "John.Doe@Gmail.com",
    "  j.o.h.n.d.o.e@gmail.com ",
    "johndoe+freemonth@gmail.com",
    "john.doe+a.b@googlemail.com",
    "JohnDoe@GoogleMail.COM.",
  ], "johndoe@gmail.com");
  same(["ana+cmm@icloud.com", "ana@me.com", "Ana@MAC.com", "ana+x@me.com."], "ana@icloud.com");
  same(["person+news@outlook.com", "Person@Outlook.com"], "person@outlook.com");
  same(["person+news@hotmail.com"], "person@hotmail.com");
  same(["person+news@live.com"], "person@live.com");
  same(["first+tag@yahoo.com", "first@yahoo.com"], "first@yahoo.com");
  same(["pat+list@example.com", "Pat@Example.com.."], "pat@example.com");

  // Dots only matter on Gmail, and Yahoo's "-" addresses are separate inboxes.
  assert.equal(canonicalEmail("first.last@example.com"), "first.last@example.com");
  assert.equal(canonicalEmail("first-last@yahoo.com"), "first-last@yahoo.com");
  // Different providers are different people.
  assert.notEqual(canonicalEmail("person@hotmail.com"), canonicalEmail("person@outlook.com"));
  // Never produce an empty mailbox name.
  assert.equal(canonicalEmail("+only@example.com"), "+only@example.com");
  // The legacy key is unchanged for rows saved before canonical keys existed.
  assert.equal(normalizeEmail("  John.Doe+X@Gmail.com "), "john.doe+x@gmail.com");
});

test("reads the visitor IP from Vercel headers and ignores cf-connecting-ip", () => {
  const ipOf = (headers) => clientIp(new Headers(headers));
  assert.equal(ipOf({ "cf-connecting-ip": "198.51.100.1", "x-real-ip": "203.0.113.7" }), "203.0.113.7");
  assert.equal(ipOf({ "cf-connecting-ip": "198.51.100.1", "x-forwarded-for": "203.0.113.8, 10.0.0.1" }), "203.0.113.8");
  assert.equal(ipOf({ "x-real-ip": " 203.0.113.9 ", "x-forwarded-for": "198.51.100.2" }), "203.0.113.9");
  assert.equal(ipOf({ "cf-connecting-ip": "198.51.100.1" }), "unknown");
  assert.equal(ipOf({}), "unknown");
  assert.equal(ipOf({ "x-real-ip": "2001:DB8::1" }), "2001:db8::1");
});

test("counts IPv6 visitors per /64 network for the new-code cap", () => {
  assert.equal(ipRateBucket("203.0.113.7"), "203.0.113.7");
  assert.equal(ipRateBucket("::ffff:203.0.113.7"), "203.0.113.7");
  const home = "2001:0db8:0012:0034::/64";
  for (const address of [
    "2001:db8:12:34::1",
    "2001:db8:12:34:aaaa:bbbb:cccc:dddd",
    "2001:0DB8:0012:0034:0:0:0:ffff",
    "[2001:db8:12:34::2]",
    "2001:db8:12:34::3%en0",
  ]) {
    assert.equal(ipRateBucket(address), home, address);
  }
  assert.notEqual(ipRateBucket("2001:db8:12:35::1"), home);
  assert.equal(ipRateBucket("2001:db8::1"), "2001:0db8:0000:0000::/64");
  assert.equal(ipRateBucket("64:ff9b::203.0.113.7"), "0064:ff9b:0000:0000::/64");
  assert.equal(ipRateBucket(""), "unknown");
});

test("an address saved under the legacy hash keeps its row and gets the same code again", async () => {
  const legacyHash = hashOf("john.doe@gmail.com");
  const database = fakeDatabase({
    rows: [{ email_hash: legacyHash, has_code: true }],
    assign: () => codeRow({ reused: true, outcome: "reused", attempt: 2 }),
  });
  await withLiveFlow(database, async ({ emails }) => {
    const response = await submit("John.Doe@Gmail.com");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, queued: false, reused: true });

    const [assignCall] = database.callsTo("assign_offer_code");
    assert.equal(assignCall.values[0], legacyHash);
    const [lookup] = database.callsTo("email_hash = any");
    assert.deepEqual(lookup.values[0], [legacyHash, hashOf("johndoe@gmail.com")]);
    // A re-send is not a new code, so the per-IP cap is left alone.
    assert.equal(database.callsTo("consume_rate_limit").length, 1);

    assert.equal(emails.length, 1);
    assert.deepEqual(emails[0].to, [{ email: "john.doe@gmail.com" }]);
    assert.match(emails[0].htmlContent, /CMM-TEST-CODE/);
    assert.equal(emails[0].headers["X-Entity-Ref-ID"], "control-my-mac-code-00000000-0000-4000-8000-000000000001-2");
  });
});

test("aliases of a known address resolve to its canonical row, and mail goes to the typed address", async () => {
  const canonicalHash = hashOf("johndoe@gmail.com");
  const database = fakeDatabase({
    rows: [{ email_hash: canonicalHash, has_code: true }],
    assign: () => codeRow({ reused: true, outcome: "reused", attempt: 3 }),
  });
  await withLiveFlow(database, async ({ emails }) => {
    const response = await submit("J.O.H.N.Doe+again@googlemail.com");
    assert.equal(response.status, 200);
    assert.equal(database.callsTo("assign_offer_code")[0].values[0], canonicalHash);
    assert.deepEqual(emails[0].to, [{ email: "j.o.h.n.doe+again@googlemail.com" }]);
  });
});

test("prefers the row that already holds a code when both hashes exist", async () => {
  const legacyHash = hashOf("john.doe+x@gmail.com");
  const canonicalHash = hashOf("johndoe@gmail.com");
  const database = fakeDatabase({
    rows: [
      { email_hash: legacyHash, has_code: false },
      { email_hash: canonicalHash, has_code: true },
    ],
    assign: () => codeRow({ reused: true, outcome: "reused" }),
  });
  await withLiveFlow(database, async () => {
    await submit("john.doe+x@gmail.com");
    assert.equal(database.callsTo("assign_offer_code")[0].values[0], canonicalHash);
  });
});

test("an address whose code expired is told it already claimed and gets no new code", async () => {
  const database = fakeDatabase({
    rows: [{ email_hash: hashOf("person@example.test"), has_code: true }],
    assign: () => codeRow({
      code_ciphertext: null,
      expires_at: null,
      outcome: "already_claimed",
      attempt: 4,
    }),
  });
  await withLiveFlow(database, async ({ emails }) => {
    const response = await submit("Person+second@example.test");
    assert.equal(response.status, 409);
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.equal(body.errorKey, "errClaimed");
    assert.match(body.error, /already received/);
    assert.equal(emails.length, 0);
    assert.equal(database.callsTo("update code_requests").length, 0);
  });
});

test("allows three brand-new codes per IP per day but never blocks re-sends", async () => {
  let assignCount = 0;
  const database = fakeDatabase({
    assign: (values) => {
      assignCount += 1;
      database.rows.push({ email_hash: values[0], has_code: true });
      return codeRow();
    },
  });
  await withLiveFlow(database, async ({ emails }) => {
    // cf-connecting-ip changes every time; it must not open new buckets.
    for (const [index, email] of ["one@example.test", "two@example.test", "three@example.test"].entries()) {
      const response = await submit(email, { "cf-connecting-ip": `198.51.100.${index}` });
      assert.equal(response.status, 200, email);
    }
    const blocked = await submit("four@example.test", { "cf-connecting-ip": "198.51.100.99" });
    assert.equal(blocked.status, 429);
    assert.equal((await blocked.json()).errorKey, "errRate");
    assert.equal(assignCount, 3);

    // Someone who already has a code can still get it re-sent from the same IP.
    const resend = await submit("one+again@example.test");
    assert.equal(resend.status, 200);
    assert.equal(assignCount, 4);

    // A different visitor is unaffected.
    const other = await submit("four@example.test", { "x-real-ip": "203.0.113.200" });
    assert.equal(other.status, 200);
    assert.equal(emails.length, 5);

    const ipKey = hashOf(`new-code-ip:${ipRateBucket("203.0.113.7")}`);
    const capCalls = database.callsTo("consume_rate_limit").filter((call) => call.values[0] === ipKey);
    assert.equal(capCalls.length, 4);
    for (const call of capCalls) assert.deepEqual(call.values.slice(1), [3, 86400]);
  });
});

test("Brevo idempotency key is per request attempt, in the body headers, and duplicates count as sent", async () => {
  const previousFetch = globalThis.fetch;
  const previousEnv = {
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL,
  };
  process.env.BREVO_API_KEY = "fake-api-key";
  process.env.BREVO_SENDER_EMAIL = "hello@example.test";
  const bodies = [];
  let reply = () => new Response(JSON.stringify({ messageId: "fake" }), { status: 201 });
  globalThis.fetch = async (url, options) => {
    bodies.push(JSON.parse(options.body));
    return reply();
  };
  const send = (attempt) => sendCodeEmail({
    requestId: "00000000-0000-4000-8000-000000000001",
    attempt,
    email: "person@example.test",
    locale: "en",
    code: "CMM-FAKE-7K4P",
    expiresAt: "2027-01-15T08:00:00.000Z",
    autoRenews: false,
    confirmationUrl: "https://example.test/api/confirm-newsletter?token=fake",
    unsubscribeUrl: "https://example.test/api/unsubscribe?token=fake",
  });
  try {
    await send(1);
    await send(1);
    await send(2);
    const [first, retry, again] = bodies.map((body) => body.headers.idempotencyKey);
    assert.match(first, UUID);
    assert.equal(retry, first, "a retry of the same attempt reuses its key");
    assert.notEqual(again, first, "asking again is a new send");
    for (const body of bodies) assert.equal(body.headers["Idempotency-Key"], undefined);

    reply = () => new Response(JSON.stringify({
      code: "duplicate_parameter",
      message: "Request with same idempotency key already processed",
    }), { status: 400 });
    assert.equal(await send(2), "duplicate-suppressed");

    reply = () => new Response(JSON.stringify({ code: "invalid_parameter" }), { status: 400 });
    await assert.rejects(send(3), /Brevo 400/);
  } finally {
    globalThis.fetch = previousFetch;
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("the migration and the full schema define the same one-code-per-email functions", () => {
  const schema = readFileSync(new URL("../db/code-delivery.sql", import.meta.url), "utf8");
  const migration = readFileSync(new URL("../db/2026-09-26-one-code-per-email.sql", import.meta.url), "utf8");
  const extract = (sql, pattern) => {
    const match = sql.match(pattern);
    assert.ok(match, `missing ${pattern}`);
    return match[0];
  };
  const pieces = [
    /do \$\$\nbegin\n  if to_regprocedure\('assign_offer_code[\s\S]*?\n\$\$;/,
    /create or replace function assign_offer_code\([\s\S]*?\n\$\$;/,
    /create or replace function claim_next_code_delivery\(\)[\s\S]*?\n\$\$;/,
  ];
  for (const pattern of pieces) {
    assert.equal(extract(schema, pattern), extract(migration, pattern), String(pattern));
  }

  const assign = extract(migration, pieces[1]);
  assert.match(assign, /'already_claimed'::text/);
  // The "already received" check must come before any code can be released or replaced.
  assert.ok(assign.indexOf("v_request.sent_at is not null") < assign.indexOf("set status = 'expired'"));
  assert.match(migration, /^begin;$/m);
  assert.match(migration, /^commit;$/m);
});

test("a form request never undoes an unsubscribe, and an already-claimed request changes nothing stored", () => {
  for (const file of ["../db/code-delivery.sql", "../db/2026-09-26-one-code-per-email.sql"]) {
    const sql = readFileSync(new URL(file, import.meta.url), "utf8");
    const assign = sql.match(/create or replace function assign_offer_code\([\s\S]*?\n\$\$;/)?.[0];
    assert.ok(assign, file);

    // The row is read (and locked) before the upsert changes it.
    const snapshot = assign.indexOf("select cr.* into v_before");
    assert.ok(snapshot > 0, `${file}: no snapshot`);
    assert.match(assign.slice(snapshot), /^select cr\.\* into v_before\n\s+from code_requests as cr\n\s+where cr\.email_hash = p_email_hash\n\s+for update;/, file);
    assert.ok(snapshot < assign.indexOf("insert into code_requests"), `${file}: snapshot after upsert`);

    // The upsert leaves the subscribe/unsubscribe state alone, and neither re-confirms nor
    // re-records consent for an address that unsubscribed.
    const upsert = assign.slice(assign.indexOf("on conflict (email_hash) do update"), assign.indexOf("returning * into v_request;"));
    for (const column of ["marketing_subscribed_at", "marketing_unsubscribed_at", "marketing_removed_at"]) {
      assert.doesNotMatch(upsert, new RegExp(`\\b${column} =`), `${file}: upsert sets ${column}`);
    }
    for (const column of ["marketing_confirmed_at", "consent_text_version"]) {
      const clause = upsert.match(new RegExp(`\\b${column} = case[\\s\\S]*?\\bend,`))?.[0];
      assert.ok(clause, `${file}: ${column} clause`);
      assert.match(clause, /code_requests\.marketing_unsubscribed_at is null/, `${file}: ${column}`);
      assert.doesNotMatch(clause, /marketing_unsubscribed_at is not null/, `${file}: ${column}`);
    }

    // Nothing is sent on the already-claimed path, so everything the upsert may have
    // changed about the address is put back, whatever the row's status was.
    const claimed = assign.slice(assign.indexOf("if v_request.sent_at is not null then"), assign.indexOf("'already_claimed'::text"));
    const restore = claimed.match(/update code_requests as cr\n([\s\S]*?);/)?.[1];
    assert.ok(restore, `${file}: no restore update`);
    for (const column of [
      "email_ciphertext", "locale", "marketing_requested", "marketing_requested_at", "marketing_confirmed_at",
      "marketing_subscribed_at", "marketing_unsubscribed_at", "marketing_removed_at", "consent_text_version",
    ]) {
      assert.match(restore, new RegExp(`\\b${column} = v_before\\.${column}\\b`), `${file}: ${column} not restored`);
    }
    assert.match(restore, /where cr\.id = v_request\.id$/, `${file}: restore must not depend on the status`);
  }
});
