import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import vm from "node:vm";
import { renderCodeEmail, redemptionUrlFor } from "../api/_lib/email-content.js";
import { SUPPORTED_LOCALES, encrypt, escapeHtml, signUnsubscribeToken } from "../api/_lib/security.js";
import { setDatabaseClient } from "../api/_lib/database.js";
import { POST as requestCode } from "../api/request-code.js";
import { GET as maintainOffers } from "../api/cron/maintain-offers.js";
import { GET as unsubscribePage, POST as unsubscribe } from "../api/unsubscribe.js";

const LOCALES = [...SUPPORTED_LOCALES];
const ENCRYPTION_KEY = randomBytes(32).toString("base64");
const STORED_URL = "https://apps.apple.com/redeem?ctx=offercodes&id=6781458180&code=CMMSTORED123";
const FALLBACK = (code) => `https://apps.apple.com/redeem?ctx=offercodes&id=6781458180&code=${code}`;

// Phrases from the removed "one last step: confirm future emails" box, in every language.
const OLD_CONFIRM_TEXT = [
  "confirm-newsletter", "One last step", "Confirm future emails", "Noch ein letzter Schritt",
  "Zukünftige E-Mails bestätigen", "Un último paso", "Confirmar futuros correos", "Une dernière étape",
  "Confirmer les futurs e-mails", "Un ultimo passaggio", "Conferma le future email", "Nog één stap",
  "Toekomstige e-mails bevestigen", "Jeszcze jeden krok", "Potwierdź przyszłe e-maile", "Só falta um passo",
  "Confirmar e-mails futuros", "Остался один шаг", "Подтвердить будущие письма", "Son bir adım",
  "Gelecek e-postaları doğrula", "あと1ステップ", "今後のメールを確認", "마지막 한 단계", "향후 이메일 확인",
  "最后一步", "确认今后的邮件",
];

// The "does not renew" wording (FREE_MONTH_AUTO_RENEWS=false, the live Apple offer).
const NO_RENEW = {
  en: "does not renew automatically", de: "verlängert sich nicht automatisch", es: "no se renueva automáticamente",
  fr: "ne se renouvelle pas automatiquement", it: "non si rinnova automaticamente", ja: "自動更新されない",
  ko: "자동으로 갱신되지 않으므로", nl: "niet automatisch verlengd", pl: "nie odnawia się automatycznie",
  pt: "não é renovado automaticamente", ru: "не продлевается автоматически", tr: "otomatik olarak yenilenmez",
  zh: "不会自动续订",
};

function render(locale, overrides = {}) {
  return renderCodeEmail({
    locale,
    code: "CMMSTORED123",
    expiresAt: "2027-01-15T08:00:00.000Z",
    autoRenews: false,
    redemptionUrl: STORED_URL,
    unsubscribeUrl: "https://controlmymac.com/api/unsubscribe?token=test",
    ...overrides,
  });
}

test("every language's email is free of the old confirm-emails step", () => {
  for (const locale of LOCALES) {
    const email = render(locale, { confirmationUrl: "https://controlmymac.com/api/confirm-newsletter?token=old" });
    for (const phrase of OLD_CONFIRM_TEXT) {
      assert.ok(!email.html.includes(phrase), `${locale} html still has "${phrase}"`);
      assert.ok(!email.text.includes(phrase), `${locale} text still has "${phrase}"`);
    }
    assert.doesNotMatch(email.subject + email.text, /confirm|bestätig|bevestig|potwierdź|подтверд|確認|确认/i, locale);
  }
});

// Words from the old "if this wasn't you, you can ignore this email" advice. Under single
// opt-in that advice is false: ignoring the email still puts the address on the list once
// the code email has gone out, so only unsubscribing keeps a stranger off it.
const IGNORE_ADVICE = [
  "ignore", "ignorieren", "ignorar", "ignorez", "ignorare", "negeren", "zignoruj", "проигнорируйте",
  "yok say", "無視", "무시", "忽略",
];

test("no language tells someone who didn't ask to just ignore the email", () => {
  for (const locale of LOCALES) {
    const { html, text } = render(locale);
    for (const word of IGNORE_ADVICE) {
      assert.ok(!html.toLowerCase().includes(word), `${locale} html still says "${word}"`);
      assert.ok(!text.toLowerCase().includes(word), `${locale} text still says "${word}"`);
    }
  }
});

test("every language's footer names the sender and links its own privacy page", () => {
  for (const locale of LOCALES) {
    const { html, text } = render(locale);
    const home = locale === "en" ? "https://controlmymac.com" : `https://controlmymac.com/${locale}`;
    const page = new URL(`../${locale === "en" ? "" : `${locale}/`}privacy.html`, import.meta.url);
    assert.ok(existsSync(page), `${locale} privacy page is missing`);
    // The link text is the privacy page's own title.
    const title = readFileSync(page, "utf8").match(/<h1>([^<]+)<\/h1>/)?.[1];
    assert.ok(title, `${locale} privacy page has no <h1>`);
    assert.ok(
      html.includes(`Sebastian Apps · <a href="${home}" style="color:#5f6b84;text-decoration:underline">controlmymac.com</a> · `
        + `<a href="${home}/privacy" style="color:#3f4c6b;text-decoration:underline">${escapeHtml(title)}</a>`),
      `${locale} html footer`,
    );
    const lastLine = text.split("\n").at(-1);
    assert.ok(lastLine.startsWith(`Sebastian Apps · controlmymac.com · ${title}`), `${locale} text footer`);
    assert.ok(lastLine.endsWith(`${home}/privacy`), `${locale} text privacy link`);
  }
});

test("every privacy page explains the gift emails: controller, legal basis, providers, complaint right", () => {
  const read = (locale) => readFileSync(new URL(`../${locale === "en" ? "" : `${locale}/`}privacy.html`, import.meta.url), "utf8");
  const sectionCount = (html) => (html.match(/<h2>/g) || []).length;
  const english = read("en");
  for (const locale of LOCALES) {
    const html = read(locale);
    assert.equal(sectionCount(html), sectionCount(english), `${locale} has a different set of sections`);
    assert.match(html, /<div class="meta">[\s\S]*?Sebastian Apps[\s\S]*?<\/div>/, `${locale} controller`);
    assert.match(html, /\b(GDPR|DSGVO|RGPD|AVG|RODO)\b/, `${locale} legal basis`);
    for (const name of ["Vercel", "Neon", "Brevo", "Turnstile", "ICO", "support@controlmymac.com"]) {
      assert.ok(html.includes(name), `${locale} does not mention ${name}`);
    }
  }
});

test("every language's email has the code box, the redeem button with the per-code link, and the unsubscribe link", () => {
  for (const locale of LOCALES) {
    const { html, text } = render(locale);
    const href = escapeHtml(STORED_URL);
    assert.match(html, new RegExp(`<a href="${href.replace(/[?.]/g, "\\$&")}"[^>]*>[^<]+</a>`), locale);
    assert.ok(html.includes(">CMMSTORED123</p>"), `${locale} code box`);
    assert.ok(text.includes(`\n${STORED_URL}\n`), `${locale} text link`);
    assert.match(text, /(: |：)CMMSTORED123\n/, `${locale} text code`);
    assert.ok(html.includes("unsubscribe?token=test") && text.includes("unsubscribe?token=test"), locale);
    assert.ok(html.includes("controlmymac.com") && text.includes("controlmymac.com"), `${locale} footer says why`);
    assert.match(html, new RegExp(`<html lang="${locale}">`));
    assert.doesNotMatch(html + text, /\{[a-z]+\}|\bundefined\b|\bnull\b|[^.]\.\.(?!\.)/, locale);
    // Three in-app steps, in the same order in both versions.
    assert.equal((html.match(/<li /g) || []).length, 3, locale);
    assert.match(text, /\n1\. .+\n2\. .+\n3\. .+\n/, locale);
  }
});

test("the renewal line uses the no-renew wording unless auto-renewal is switched on", () => {
  for (const locale of LOCALES) {
    const off = render(locale, { autoRenews: false });
    const on = render(locale, { autoRenews: true });
    assert.ok(off.text.includes(NO_RENEW[locale]) && off.html.includes(NO_RENEW[locale]), `${locale} no-renew`);
    assert.ok(!on.text.includes(NO_RENEW[locale]), `${locale} renew variant`);
    assert.notEqual(on.text, off.text);
  }
  assert.match(render("en", { autoRenews: true }).text, /renews at the standard price unless you cancel/);
});

test("the redeem link falls back to the app's offer-code link when the stored one is missing or not Apple's", () => {
  assert.equal(redemptionUrlFor("ABC123", STORED_URL), STORED_URL);
  assert.equal(redemptionUrlFor("ABC123", null), FALLBACK("ABC123"));
  assert.equal(redemptionUrlFor("ABC123", ""), FALLBACK("ABC123"));
  assert.equal(redemptionUrlFor("ABC123", "not a url"), FALLBACK("ABC123"));
  assert.equal(redemptionUrlFor("ABC123", "http://apps.apple.com/redeem?code=ABC123"), FALLBACK("ABC123"));
  assert.equal(redemptionUrlFor("ABC123", "https://apps.apple.com.evil.example/redeem"), FALLBACK("ABC123"));
  assert.equal(redemptionUrlFor("A B&C", undefined), FALLBACK("A%20B%26C"));

  const email = render("en", { redemptionUrl: undefined, code: "<b>X</b>" });
  assert.ok(email.html.includes("&lt;b&gt;X&lt;/b&gt;"));
  assert.ok(!email.html.includes("<b>X</b>"));
  assert.ok(email.text.includes(FALLBACK("%3Cb%3EX%3C%2Fb%3E")));
});

test("the in-app steps use exactly the labels the app shows in each language", () => {
  const catalogPath = new URL(
    "../../cmm-custom-grid/native/MacRemoteControlPhone/MacRemoteControlPhone/Localizable.xcstrings",
    import.meta.url,
  );
  const expectLabels = (locale, labels) => {
    const { text } = render(locale);
    for (const label of labels) assert.ok(text.includes(label), `${locale} is missing "${label}"`);
  };
  expectLabels("en", ["Settings", "Mode", "Unlock", "Have a promo code?", "Redeem Code"]);
  expectLabels("de", ["Einstellungen", "Modus", "Freischalten", "Hast du einen Aktionscode?", "Code einlösen"]);
  expectLabels("ja", ["設定", "モード", "ロック解除", "プロモコードをお持ちですか？", "コードを使う"]);
  if (!existsSync(catalogPath)) return; // The app repository is not checked out next to this one.
  const strings = JSON.parse(readFileSync(catalogPath, "utf8")).strings;
  const catalogLocale = { pt: "pt-BR", zh: "zh-Hans" };
  for (const locale of LOCALES.filter((value) => value !== "en")) {
    const labels = ["Settings", "Mode", "Unlock", "Have a promo code?"].map(
      (key) => strings[key].localizations[catalogLocale[locale] || locale].stringUnit.value,
    );
    expectLabels(locale, labels);
  }
});

/** A stand-in for the Neon client: answers by query text; `handlers` are tried in order. */
function fakeDatabase(handlers) {
  const calls = [];
  const sql = async (strings, ...values) => {
    const text = Array.isArray(strings) ? strings.join("?") : String(strings);
    calls.push({ text, values });
    for (const [fragment, answer] of handlers) {
      if (text.includes(fragment)) return typeof answer === "function" ? answer(values) : answer;
    }
    return [];
  };
  sql.query = async () => [{ inserted: 0 }];
  return { sql, calls };
}

async function withEnv(env, database, run) {
  const previousEnv = Object.fromEntries(Object.keys(env).map((name) => [name, process.env[name]]));
  const previousFetch = globalThis.fetch;
  const brevo = [];
  Object.assign(process.env, env);
  setDatabaseClient(database?.sql);
  globalThis.fetch = async (url, options) => {
    if (String(url).includes("challenges.cloudflare.com")) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    if (String(url).startsWith("https://api.brevo.com/v3/")) {
      brevo.push({ url: String(url), body: JSON.parse(options.body) });
      return new Response(JSON.stringify({ messageId: "fake" }), { status: 201 });
    }
    throw new Error(`Unexpected fetch in test: ${url}`);
  };
  try {
    await run({ brevo });
  } finally {
    globalThis.fetch = previousFetch;
    setDatabaseClient(undefined);
    for (const [name, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

const LIVE_ENV = {
  CODE_DELIVERY_MODE: "ready",
  DATABASE_URL: "postgres://fake",
  BREVO_API_KEY: "fake-api-key",
  BREVO_SENDER_EMAIL: "hello@example.test",
  BREVO_MARKETING_LIST_ID: "1",
  BREVO_SANDBOX_MODE: "true",
  EMAIL_HASH_SECRET: "test-email-hash-secret",
  CODE_ENCRYPTION_KEY: ENCRYPTION_KEY,
  UNSUBSCRIBE_SECRET: "fake-unsubscribe-secret",
  TURNSTILE_SITE_KEY: "fake-site-key",
  TURNSTILE_SECRET_KEY: "fake-turnstile-secret",
  CRON_SECRET: "fake-cron-secret",
  FREE_MONTH_AUTO_RENEWS: "false",
};

test("a new request records v3 single opt-in consent and emails the stored per-code redeem link", async () => {
  const database = fakeDatabase([
    ["consume_rate_limit", [{ allowed: true }]],
    ["email_hash = any", []],
    ["assign_offer_code", [{
      request_id: "00000000-0000-4000-8000-000000000009",
      code_ciphertext: encrypt("CMMSTORED123", ENCRYPTION_KEY),
      redemption_url_ciphertext: encrypt(STORED_URL, ENCRYPTION_KEY),
      expires_at: "2027-01-15T08:00:00.000Z",
      reused: false,
      marketing_subscribed_at: null,
      outcome: "assigned",
      attempt: 1,
    }]],
  ]);
  // NEWSLETTER_CONFIRM_SECRET is no longer needed for the gift flow.
  await withEnv({ ...LIVE_ENV, NEWSLETTER_CONFIRM_SECRET: "" }, database, async ({ brevo }) => {
    const response = await requestCode(new Request("https://example.test/api/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-real-ip": "203.0.113.7" },
      body: JSON.stringify({ email: "person@example.test", locale: "fr", marketingOptIn: true, turnstileToken: "ok" }),
    }));
    assert.equal(response.status, 200);
    const assign = database.calls.find((call) => call.text.includes("assign_offer_code"));
    assert.equal(assign.values[3], true);
    assert.equal(assign.values[4], "sebastian-apps-perks-v3-2026-09-26");

    assert.equal(brevo.length, 1);
    const [email] = brevo;
    assert.equal(email.body.subject, "Votre mois gratuit de Control My Mac");
    assert.ok(email.body.htmlContent.includes(escapeHtml(STORED_URL)));
    assert.ok(email.body.textContent.includes(STORED_URL));
    assert.doesNotMatch(email.body.htmlContent + email.body.textContent, /confirm-newsletter/);
    assert.match(email.body.textContent, /ne se renouvelle pas/);
  });
});

test("the daily cron passes the stored redeem link into re-sent emails", async () => {
  let claimed = false;
  const database = fakeDatabase([
    ["from offer_code_batches", []],
    ["count(*) filter", [{ unused: 1000, allocated: 1, expired: 0 }]],
    ["as pending", [{ pending: 0 }]],
    ["claim_next_code_delivery", () => {
      if (claimed) return [];
      claimed = true;
      return [{
        request_id: "00000000-0000-4000-8000-00000000000a",
        email_ciphertext: encrypt("person@example.test", ENCRYPTION_KEY),
        locale: "de",
        code_ciphertext: encrypt("CMMSTORED123", ENCRYPTION_KEY),
        redemption_url_ciphertext: encrypt(STORED_URL, ENCRYPTION_KEY),
        expires_at: "2027-01-15T08:00:00.000Z",
        attempt: 2,
      }];
    }],
  ]);
  await withEnv(LIVE_ENV, database, async ({ brevo }) => {
    const response = await maintainOffers(new Request("https://example.test/api/cron/maintain-offers", {
      headers: { authorization: "Bearer fake-cron-secret" },
    }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).sent, 1);
    const emails = brevo.filter((call) => call.url.endsWith("/smtp/email"));
    assert.equal(emails.length, 1);
    assert.equal(emails[0].body.subject, "Dein Gratismonat für Control My Mac");
    assert.ok(emails[0].body.textContent.includes(STORED_URL));
    assert.match(emails[0].body.textContent, /„Freischalten“/);
    assert.doesNotMatch(emails[0].body.htmlContent, /confirm-newsletter/);
  });
});

test("the unsubscribe page speaks the language the gift was requested in", async () => {
  const requestId = "00000000-0000-4000-8000-00000000000b";
  const token = signUnsubscribeToken(requestId, LIVE_ENV.UNSUBSCRIBE_SECRET);
  let unsubscribed = false;
  const database = fakeDatabase([
    ["from code_requests", () => [{
      id: requestId,
      email_ciphertext: encrypt("person@example.test", ENCRYPTION_KEY),
      locale: "de",
      marketing_unsubscribed_at: unsubscribed ? "2026-09-26T10:00:00Z" : null,
      created_at: "2026-09-26T09:00:00Z",
    }]],
    ["set marketing_unsubscribed_at", () => { unsubscribed = true; return []; }],
  ]);
  await withEnv(LIVE_ENV, database, async ({ brevo }) => {
    const url = `https://example.test/api/unsubscribe?token=${encodeURIComponent(token)}`;
    const ask = await (await unsubscribePage(new Request(url, { headers: { "accept-language": "fr" } }))).text();
    assert.match(ask, /<html lang="de">/);
    assert.match(ask, /Keine E-Mails mehr von Sebastian Apps\?/);
    assert.match(ask, /<button type="submit">Abmelden<\/button>/);
    assert.equal(unsubscribed, false, "opening the page changes nothing");

    const done = await (await unsubscribe(new Request(url, {
      method: "POST",
      body: new URLSearchParams({ token }),
    }))).text();
    assert.match(done, /Du bist abgemeldet/);
    assert.equal(unsubscribed, true);
    assert.equal(brevo.filter((call) => call.url.includes("/contacts/remove")).length, 1);

    const invalid = await (await unsubscribePage(new Request("https://example.test/api/unsubscribe?token=bad", {
      headers: { "accept-language": "fr-CH,fr;q=0.9,en;q=0.8" },
    }))).text();
    assert.match(invalid, /<html lang="fr">/);
    assert.match(invalid, /Lien expiré/);
  });
  // No database and no browser hint: English.
  const plain = await (await unsubscribePage(new Request("https://example.test/api/unsubscribe?token=bad"))).text();
  assert.match(plain, /<html lang="en">/);
  assert.match(plain, /Link expired/);
});

test("form copy: every language has errClaimed and no longer promises a confirmation link", () => {
  const source = readFileSync(new URL("../assets/offer.js", import.meta.url), "utf8");
  const literal = source.match(/var COPY = (\{[\s\S]*?\n {2}\});/)?.[1];
  assert.ok(literal, "COPY object not found in assets/offer.js");
  const copy = vm.runInNewContext(`(${literal})`);
  assert.deepEqual(Object.keys(copy).sort(), [...LOCALES].sort());
  const keys = Object.keys(copy.en).sort();
  const confirmPromise = /confirm|bestätig|bevestig|potwierd|подтвержд|onayla|確認|确认|확인/i;
  for (const [locale, strings] of Object.entries(copy)) {
    assert.deepEqual(Object.keys(strings).sort(), keys, `${locale} keys`);
    assert.ok(strings.errClaimed.length > 20, `${locale} errClaimed`);
    for (const key of ["detail", "okCopy", "okQueued"]) {
      assert.doesNotMatch(strings[key], confirmPromise, `${locale}.${key}`);
    }
    assert.ok(strings.okCopy.includes("{email}"), `${locale}.okCopy placeholder`);
    // The form links the privacy page in the visitor's language, named by its own title.
    const page = new URL(`../${locale === "en" ? "" : `${locale}/`}privacy.html`, import.meta.url);
    const title = readFileSync(page, "utf8").match(/<h1>([^<]+)<\/h1>/)?.[1];
    assert.equal(strings.privacyLink, title, `${locale}.privacyLink`);
    assert.ok(strings.privacyLead.length > 5, `${locale}.privacyLead`);
  }
  assert.match(source, /privacyHref = COPY\[locale\] && locale !== "en" \? "\/" \+ locale \+ "\/privacy" : "\/privacy"/);
  assert.match(source, /privacyLink\.href = privacyHref;/);
  // The form shows the message the API names, and 409 means "already claimed".
  assert.match(source, /result\.errorKey/);
  assert.match(source, /response\.status === 409 \? t\.errClaimed/);
});

test("assign_offer_code confirms consent at request time in the migration and the full schema", () => {
  for (const file of ["../db/code-delivery.sql", "../db/2026-09-26-one-code-per-email.sql"]) {
    const sql = readFileSync(new URL(file, import.meta.url), "utf8");
    const assign = sql.match(/create or replace function assign_offer_code\([\s\S]*?\n\$\$;/)?.[0];
    assert.ok(assign, file);
    assert.match(assign, /marketing_requested_at,\n\s+marketing_confirmed_at,\n\s+consent_text_version\n/, file);
    // A known address is confirmed once, and never again after it unsubscribed.
    assert.match(
      assign,
      /marketing_confirmed_at = case\n\s+when excluded\.marketing_requested\n\s+and code_requests\.marketing_confirmed_at is null\n\s+and code_requests\.marketing_unsubscribed_at is null then now\(\)/,
      file,
    );
  }
});
