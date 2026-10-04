import { neon } from "@neondatabase/serverless";

let client;

export function getDatabase() {
  if (!client) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}

/** Tests swap in a fake tagged-template client here; production code never calls it. */
export function setDatabaseClient(fake) {
  client = fake;
}

export async function consumeRateLimit(keyHash, limit = 5, windowSeconds = 600) {
  const sql = getDatabase();
  const rows = await sql`select consume_rate_limit(${keyHash}, ${limit}, ${windowSeconds}) as allowed`;
  return rows[0]?.allowed === true;
}

/**
 * Returns whichever of the candidate email hashes already has a code request, or null.
 * A row that already holds (or once received) a code wins; otherwise the caller's order
 * decides. Used to keep recognising rows hashed before alias folding existed.
 */
export async function findExistingEmailHash(candidateHashes) {
  const hashes = [...new Set(candidateHashes.filter(Boolean))];
  if (hashes.length === 0) return null;
  const sql = getDatabase();
  const rows = await sql`
    select email_hash, (code_id is not null or sent_at is not null) as has_code
    from code_requests
    where email_hash = any(${hashes}::text[])
  `;
  if (rows.length === 0) return null;
  const rank = (row) => (row.has_code ? 0 : hashes.length) + hashes.indexOf(row.email_hash);
  return [...rows].sort((a, b) => rank(a) - rank(b))[0].email_hash;
}

export async function assignCode(input) {
  const sql = getDatabase();
  const rows = await sql`
    select * from assign_offer_code(
      ${input.emailHash},
      ${input.emailCiphertext},
      ${input.locale},
      ${input.marketingRequested},
      ${input.consentVersion}
    )
  `;
  return rows[0] || null;
}

export async function markDeliverySent(requestId, providerMessageId) {
  const sql = getDatabase();
  await sql`
    update code_requests
    set status = 'sent', provider_message_id = ${providerMessageId}, sent_at = now(), last_error = null
    where id = ${requestId}
  `;
  await sql`
    update offer_codes
    set status = 'sent', sent_at = now()
    where request_id = ${requestId}
  `;
}

export async function markDeliveryFailed(requestId, error) {
  const sql = getDatabase();
  await sql`
    update code_requests
    set status = 'delivery_failed', last_error = ${String(error).slice(0, 500)}
    where id = ${requestId}
  `;
}

export async function markMarketingSubscribed(requestId) {
  const sql = getDatabase();
  await sql`
    update code_requests
    set marketing_subscribed_at = coalesce(marketing_subscribed_at, now()),
        marketing_unsubscribed_at = null,
        marketing_removed_at = null
    where id = ${requestId}
  `;
}

export async function markMarketingConfirmed(requestId) {
  const sql = getDatabase();
  await sql`
    update code_requests
    set marketing_confirmed_at = now(), marketing_unsubscribed_at = null, marketing_removed_at = null
    where id = ${requestId}
  `;
}

export async function findRequestForUnsubscribe(requestId) {
  const sql = getDatabase();
  const rows = await sql`
    select id, email_ciphertext, locale, marketing_unsubscribed_at, created_at
    from code_requests
    where id = ${requestId}
  `;
  return rows[0] || null;
}

export async function markMarketingUnsubscribed(requestId) {
  const sql = getDatabase();
  await sql`
    update code_requests
    set marketing_unsubscribed_at = coalesce(marketing_unsubscribed_at, now())
    where id = ${requestId}
  `;
}

export async function markMarketingRemoved(requestId) {
  const sql = getDatabase();
  await sql`
    update code_requests
    set marketing_removed_at = now()
    where id = ${requestId}
  `;
}

export async function pendingMarketingRemovals(limit = 50) {
  const sql = getDatabase();
  return sql`
    select id, email_ciphertext
    from code_requests
    where marketing_unsubscribed_at is not null
      and marketing_removed_at is null
    order by marketing_unsubscribed_at asc
    limit ${limit}
  `;
}

export async function pendingMarketingRequests(limit = 50) {
  const sql = getDatabase();
  return sql`
    select id, email_ciphertext, locale
    from code_requests
    where marketing_requested = true
      and marketing_confirmed_at is not null
      and marketing_subscribed_at is null
      and marketing_unsubscribed_at is null
      and sent_at is not null
    order by sent_at asc
    limit ${limit}
  `;
}

export async function inventoryCounts() {
  const sql = getDatabase();
  const rows = await sql`
    select
      count(*) filter (where status = 'unused' and expires_at > now() + interval '24 hours')::int as unused,
      count(*) filter (where status in ('assigned', 'sent'))::int as allocated,
      count(*) filter (where status = 'expired' or expires_at <= now())::int as expired
    from offer_codes
  `;
  const pending = await sql`
    select count(*)::int as pending
    from code_requests
    where status in ('queued', 'delivery_failed')
  `;
  return {
    ...rows[0],
    pending: pending[0]?.pending || 0,
  };
}

export async function upsertBatch(batch) {
  const sql = getDatabase();
  await sql`
    insert into offer_code_batches (
      id, source, environment, expected_count, expires_at, state, last_error, updated_at
    ) values (
      ${batch.id}, ${batch.source}, ${batch.environment}, ${batch.expectedCount},
      ${batch.expiresAt}, ${batch.state}, ${batch.lastError || null}, now()
    )
    on conflict (id) do update set
      expected_count = excluded.expected_count,
      expires_at = excluded.expires_at,
      state = excluded.state,
      last_error = excluded.last_error,
      updated_at = now()
  `;
}

export async function pendingBatches() {
  const sql = getDatabase();
  return sql`
    select id, expected_count, expires_at
    from offer_code_batches
    where state = 'generating'
    order by created_at asc
  `;
}

export async function importCodeRows(batchId, rows) {
  if (rows.length === 0) return 0;
  const sql = getDatabase();
  const result = await sql.query(
    `with incoming as (
       select * from jsonb_to_recordset($1::jsonb)
       as x(code_fingerprint text, code_ciphertext text, redemption_url_ciphertext text, expires_at timestamptz)
     ), inserted as (
       insert into offer_codes (
         batch_id, code_fingerprint, code_ciphertext, redemption_url_ciphertext, expires_at
       )
       select $2, code_fingerprint, code_ciphertext, redemption_url_ciphertext, expires_at
       from incoming
       on conflict (code_fingerprint) do nothing
       returning 1
     )
     select count(*)::int as inserted from inserted`,
    [JSON.stringify(rows), batchId],
  );
  const inserted = result[0]?.inserted || 0;
  await sql`
    update offer_code_batches
    set imported_count = (select count(*)::int from offer_codes where batch_id = ${batchId}),
        state = 'ready', last_error = null, updated_at = now()
    where id = ${batchId}
  `;
  return inserted;
}

export async function claimNextDelivery() {
  const sql = getDatabase();
  const rows = await sql`select * from claim_next_code_delivery()`;
  return rows[0] || null;
}

export async function upsertPushDevice(input) {
  const sql = getDatabase();
  await sql`
    update push_devices
    set enabled = false, disabled_at = now(), updated_at = now()
    where installation_hash = ${input.installationHash}
      and token_hash <> ${input.tokenHash}
      and enabled = true
  `;
  await sql`
    insert into push_devices (
      installation_hash, token_hash, token_ciphertext, environment,
      locale, app_version, enabled, last_seen_at, disabled_at, last_error, updated_at
    ) values (
      ${input.installationHash}, ${input.tokenHash}, ${input.tokenCiphertext},
      ${input.environment}, ${input.locale}, ${input.appVersion},
      true, now(), null, null, now()
    )
    on conflict (token_hash) do update set
      installation_hash = excluded.installation_hash,
      token_ciphertext = excluded.token_ciphertext,
      environment = excluded.environment,
      locale = excluded.locale,
      app_version = excluded.app_version,
      enabled = true,
      last_seen_at = now(),
      disabled_at = null,
      last_error = null,
      updated_at = now()
  `;
}

export async function activePushDevices(limit = 100) {
  const sql = getDatabase();
  return sql`
    select token_hash, token_ciphertext, environment, locale, app_version
    from push_devices
    where enabled = true
    order by last_delivery_at asc nulls first, last_seen_at desc
    limit ${limit}
  `;
}

export async function markPushDelivered(tokenHash) {
  const sql = getDatabase();
  await sql`
    update push_devices
    set last_delivery_at = now(), last_error = null, updated_at = now()
    where token_hash = ${tokenHash}
  `;
}

export async function markPushFailed(tokenHash, error, disable = false) {
  const sql = getDatabase();
  await sql`
    update push_devices
    set last_error = ${String(error || "Unknown APNs error").slice(0, 500)},
        enabled = case when ${disable} then false else enabled end,
        disabled_at = case when ${disable} then now() else disabled_at end,
        updated_at = now()
    where token_hash = ${tokenHash}
  `;
}

/** Adds an address to the Windows/Android waiting list, or adds platforms to its existing row. */
export async function joinPlatformWaitlist(input) {
  const sql = getDatabase();
  const rows = await sql`
    insert into platform_waitlist
      (email_hash, email_ciphertext, locale, wants_windows, wants_android, news_opt_in, consent_text_version)
    values
      (${input.emailHash}, ${input.emailCiphertext}, ${input.locale}, ${input.windows}, ${input.android}, ${input.news}, ${input.consentVersion})
    on conflict (email_hash) do update set
      email_ciphertext = excluded.email_ciphertext,
      locale = excluded.locale,
      wants_windows = platform_waitlist.wants_windows or excluded.wants_windows,
      wants_android = platform_waitlist.wants_android or excluded.wants_android,
      news_opt_in = platform_waitlist.news_opt_in or excluded.news_opt_in,
      consent_text_version = excluded.consent_text_version,
      updated_at = now()
    returning id, wants_windows, wants_android
  `;
  return rows[0] || null;
}

export async function markWaitlistConfirmationSent(id, newsSubscribed) {
  const sql = getDatabase();
  await sql`
    update platform_waitlist
    set confirmation_sent_at = now(),
        news_subscribed_at = case when ${newsSubscribed} then coalesce(news_subscribed_at, now()) else news_subscribed_at end
    where id = ${id}
  `;
}
