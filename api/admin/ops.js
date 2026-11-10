import { getDatabase, inventoryCounts, pendingBatches, upsertBatch } from "../_lib/database.js";
import { importReadyBatches } from "../cron/maintain-offers.js";
import { sendCodeEmail } from "../_lib/brevo.js";
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
