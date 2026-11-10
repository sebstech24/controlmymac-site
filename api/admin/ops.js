import { getDatabase, inventoryCounts, pendingBatches, upsertBatch } from "../_lib/database.js";
import { importReadyBatches } from "../cron/maintain-offers.js";
import { sendCodeEmail, sendWaitlistReleaseEmail } from "../_lib/brevo.js";
import { decrypt } from "../_lib/security.js";
import { renderWaitlistReleaseEmail } from "../_lib/waitlist-email.js";
import { randomUUID } from "node:crypto";
import statements from "../_lib/offer-choice-migration.js";

// One-off operations for the free-month / 47%-off-Lifetime choice (4 Nov 2026), run with
// Authorization: Bearer $OPS_TOKEN. migrate = apply api/_lib/offer-choice-migration.js (idempotent);
// seed = register the first 47%-off batch made by hand on 3 Nov 2026 (production) or its
// sandbox twin (preview databases never get real codes); import = download generating
// Apple batches into the pool; selftest = assign one code from
// each pool to throwaway addresses inside a block that always rolls back, and report.
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

const SELFTEST = `
do $$
declare
  v_first uuid; v_free uuid; v_outcome text;
  v_lifetime text; v_again text; v_free_batch text;
  v_hash text := 'ops-selftest-' || gen_random_uuid();
begin
  select a.request_id into v_first
  from assign_offer_code(v_hash, 'x', 'en', true, 'ops-selftest', 'lifetime47') a;
  select oc.batch_id into v_lifetime from offer_codes oc where oc.request_id = v_first;
  -- The same address asking again, now for the other gift, must get its first code back.
  select a.outcome into v_outcome
  from assign_offer_code(v_hash, 'x', 'en', true, 'ops-selftest', 'free_month') a;
  select oc.batch_id into v_again from offer_codes oc where oc.request_id = v_first;
  select a.request_id into v_free
  from assign_offer_code('ops-selftest-' || gen_random_uuid(), 'x', 'en', true, 'ops-selftest', 'free_month') a;
  select oc.batch_id into v_free_batch from offer_codes oc where oc.request_id = v_free;
  raise exception 'OPS_SELFTEST lifetime=% second_request=%/% free=%', v_lifetime, v_outcome, v_again, v_free_batch;
end $$`;

export async function POST(request) { return GET(request); }

export async function GET(request) {
  const token = process.env.OPS_TOKEN;
  if (!token || request.headers.get("authorization") !== `Bearer ${token}`) return json({ ok: false }, 401);
  const step = new URL(request.url).searchParams.get("step");
  const sql = getDatabase();
  if (step === "migrate") {
    for (const statement of statements) await sql.query(statement);
    return json({ ok: true, applied: statements.length });
  }
  if (step === "seed") {
    const live = process.env.VERCEL_ENV === "production";
    const batch = live
      ? { id: "lifetime:8ab04556-c0c1-4f53-a7c2-e87451b62536", source: "apple_api", environment: "PRODUCTION" }
      : { id: "lifetime:5d30b5e1-aed5-4a0e-9737-ebe16e773d0d", source: "sandbox", environment: "SANDBOX" };
    const existing = await sql`select state from offer_code_batches where id = ${batch.id}`;
    if (!existing.length) {
      await upsertBatch({ ...batch, expectedCount: 500, expiresAt: "2027-04-23T08:00:00.000Z", state: "generating" });
    }
    return json({ ok: true, batch: batch.id, alreadyThere: existing.length > 0 });
  }
  if (step === "testmail") {
    // One real email to the owner's own inbox with an Apple sandbox (test) code, to see the
    // finished Lifetime email in a mail app before going live. Address and code come in the body.
    const { email, code, locale = "en" } = await request.json().catch(() => ({}));
    if (!email || !/^[A-Z0-9]{8,}$/.test(code || "")) return json({ ok: false, error: "email and code needed" }, 400);
    const messageId = await sendCodeEmail({
      requestId: randomUUID(), attempt: 1, email, locale, code, redemptionUrl: null,
      expiresAt: "2027-04-23T08:00:00.000Z", autoRenews: false, offer: "lifetime47",
      unsubscribeUrl: "https://controlmymac.com/",
    });
    return json({ ok: true, messageId: Boolean(messageId) });
  }
  if (step === "waitlist") {
    // Counts only, never addresses: who is waiting for which platform, in which language.
    const rows = await sql`
      select locale, wants_windows, wants_android,
             count(*)::int as people,
             count(notified_windows_at)::int as told_windows,
             count(notified_android_at)::int as told_android,
             count(confirmation_sent_at)::int as confirmed_sent
      from platform_waitlist
      group by locale, wants_windows, wants_android
      order by people desc`;
    const total = rows.reduce((sum, row) => sum + row.people, 0);
    return json({ ok: true, total, rows });
  }
  if (step === "waitlist-release") {
    // The one "it's out" email. preview = what each person would get (no addresses);
    // send (only with confirm=send-to-waitlist) = send it and mark the row, so a re-run skips them.
    const params = new URL(request.url).searchParams;
    const rows = await sql`
      select id, email_ciphertext, locale,
             wants_windows and notified_windows_at is null as windows,
             wants_android and notified_android_at is null as android
      from platform_waitlist
      where (wants_windows and notified_windows_at is null)
         or (wants_android and notified_android_at is null)
      order by created_at`;
    if (params.get("mode") !== "send" || params.get("confirm") !== "send-to-waitlist") {
      return json({
        ok: true,
        pending: rows.length,
        emails: rows.map(({ locale, windows, android }) => ({
          locale, windows, android, ...renderWaitlistReleaseEmail({ locale, windows, android }), html: undefined,
        })),
      });
    }
    let sent = 0;
    const failed = [];
    for (const row of rows) {
      try {
        const email = decrypt(row.email_ciphertext, process.env.CODE_ENCRYPTION_KEY);
        await sendWaitlistReleaseEmail({ id: row.id, email, locale: row.locale, windows: row.windows, android: row.android });
        await sql`
          update platform_waitlist
          set notified_windows_at = case when ${row.windows} then now() else notified_windows_at end,
              notified_android_at = case when ${row.android} then now() else notified_android_at end,
              updated_at = now()
          where id = ${row.id}`;
        sent += 1;
      } catch (error) {
        failed.push({ locale: row.locale, error: String(error?.message || error).slice(0, 200) });
      }
    }
    return json({ ok: failed.length === 0, sent, failed });
  }
  if (step === "import") {
    const imported = await importReadyBatches();
    return json({ ok: true, imported, inventory: await inventoryCounts(), generating: await pendingBatches() });
  }
  if (step === "selftest") {
    try {
      await sql.query(SELFTEST);
      return json({ ok: false, error: "self-test did not roll back" }, 500);
    } catch (error) {
      const message = String(error?.message || error);
      const match = message.match(/OPS_SELFTEST .*/);
      return json({ ok: Boolean(match), result: match ? match[0] : message.slice(0, 300) });
    }
  }
  return json({ ok: false, error: "unknown step" }, 400);
}
