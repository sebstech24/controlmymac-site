-- 2026-09-26: one free-month code per email address, ever.
--
-- Before: once an address's code expired, asking again handed out a fresh code, and the
-- daily cron did the same for a failed re-send whose code had expired.
-- After:
--   * code still valid        -> the SAME code is sent again (outcome 'reused')
--   * address already received a code that has since expired
--                             -> nothing is sent (outcome 'already_claimed'; the API
--                                answers 409 with errorKey "errClaimed")
--   * a code that expired before ANY email reached the person is still replaced.
-- Both functions also return the request's attempt number, which the API uses for the
-- Brevo idempotency key.
--
-- Single opt-in (same day): the double opt-in email step is gone. assign_offer_code now sets
-- marketing_confirmed_at when a request with consent is accepted, so the daily Brevo list
-- sync adds the address once the code email has been sent. Anyone can type any address into
-- the form, so:
--   * an unsubscribe sticks: a new request never re-confirms or re-subscribes the address
--     (before, it cleared the unsubscribe and waited for a new confirmation click);
--   * an 'already_claimed' request sends nothing and changes nothing stored about the
--     address: its stored address, language and consent are put back.
-- An old row that never clicked its confirmation link is confirmed only when a new request
-- for it is accepted; api/confirm-newsletter.js keeps serving links already sent.
--
-- Idempotent: safe to run more than once. Run it as one transaction (psql -f, or paste
-- the whole file into the Neon SQL editor). Apply it before deploying the matching API
-- code; the old API code keeps working against these functions in the meantime.
-- db/code-delivery.sql carries the same definitions for fresh databases.

begin;

-- The new result columns change the functions' return shape, which CREATE OR REPLACE
-- cannot do by itself. Drop the old shapes only (a no-op on re-runs).
do $$
begin
  if to_regprocedure('assign_offer_code(text, text, text, boolean, text)') is not null
    and not exists (
      select 1
      from pg_proc
      where oid = to_regprocedure('assign_offer_code(text, text, text, boolean, text)')
        and 'outcome' = any(proargnames)
    ) then
    drop function assign_offer_code(text, text, text, boolean, text);
  end if;

  if to_regprocedure('claim_next_code_delivery()') is not null
    and not exists (
      select 1
      from pg_proc
      where oid = to_regprocedure('claim_next_code_delivery()')
        and 'attempt' = any(proargnames)
    ) then
    drop function claim_next_code_delivery();
  end if;
end;
$$;

create or replace function assign_offer_code(
  p_email_hash text,
  p_email_ciphertext text,
  p_locale text,
  p_marketing_requested boolean,
  p_consent_text_version text
) returns table (
  request_id uuid,
  code_ciphertext text,
  redemption_url_ciphertext text,
  expires_at timestamptz,
  reused boolean,
  marketing_subscribed_at timestamptz,
  outcome text,
  attempt integer
)
language plpgsql
as $$
declare
  v_before code_requests%rowtype;
  v_request code_requests%rowtype;
  v_code offer_codes%rowtype;
begin
  -- The address's row as it was before this request, locked so nothing else changes it
  -- until this transaction ends. The 'already_claimed' path below puts it back.
  select cr.* into v_before
  from code_requests as cr
  where cr.email_hash = p_email_hash
  for update;

  -- Single opt-in: ticking the form's required consent box is the confirmation, so the
  -- request is confirmed at once and the daily Brevo list sync adds the address after the
  -- code email has been sent. Anyone can submit any address, so an unsubscribe sticks: a
  -- form request never re-confirms or re-subscribes an address that unsubscribed.
  insert into code_requests (
    email_hash,
    email_ciphertext,
    locale,
    marketing_requested,
    marketing_requested_at,
    marketing_confirmed_at,
    consent_text_version
  ) values (
    p_email_hash,
    p_email_ciphertext,
    p_locale,
    p_marketing_requested,
    case when p_marketing_requested then now() else null end,
    case when p_marketing_requested then now() else null end,
    case when p_marketing_requested then p_consent_text_version else null end
  )
  on conflict (email_hash) do update
  set email_ciphertext = excluded.email_ciphertext,
      locale = excluded.locale,
      marketing_requested = code_requests.marketing_requested or excluded.marketing_requested,
      marketing_requested_at = case
        when excluded.marketing_requested and not code_requests.marketing_requested then now()
        else code_requests.marketing_requested_at
      end,
      marketing_confirmed_at = case
        when excluded.marketing_requested
          and code_requests.marketing_confirmed_at is null
          and code_requests.marketing_unsubscribed_at is null then now()
        else code_requests.marketing_confirmed_at
      end,
      consent_text_version = case
        when excluded.marketing_requested
          and code_requests.marketing_unsubscribed_at is null then excluded.consent_text_version
        else code_requests.consent_text_version
      end,
      attempts = code_requests.attempts + 1,
      last_requested_at = now()
  returning * into v_request;

  -- The address's code is still valid: send that same code again.
  if v_request.code_id is not null then
    select oc.* into v_code
    from offer_codes as oc
    where oc.id = v_request.code_id
      and oc.status in ('assigned', 'sent')
      and oc.expires_at > now();

    if found then
      return query select
        v_request.id,
        v_code.code_ciphertext,
        v_code.redemption_url_ciphertext,
        v_code.expires_at,
        true,
        v_request.marketing_subscribed_at,
        'reused'::text,
        v_request.attempts;
      return;
    end if;
  end if;

  -- The address already received a code and it has expired (or an older version of this
  -- function detached it). One code per address, ever: never hand out a replacement.
  -- Nothing is sent on this path, so the request must not change what is stored about the
  -- address: restore its address, language and consent from before the upsert (it existed
  -- then, since it has sent_at). Only attempts and last_requested_at keep the new values.
  if v_request.sent_at is not null then
    update code_requests as cr
    set status = 'sent',
        last_error = null,
        email_ciphertext = v_before.email_ciphertext,
        locale = v_before.locale,
        marketing_requested = v_before.marketing_requested,
        marketing_requested_at = v_before.marketing_requested_at,
        marketing_confirmed_at = v_before.marketing_confirmed_at,
        marketing_subscribed_at = v_before.marketing_subscribed_at,
        marketing_unsubscribed_at = v_before.marketing_unsubscribed_at,
        marketing_removed_at = v_before.marketing_removed_at,
        consent_text_version = v_before.consent_text_version
    where cr.id = v_request.id;
    return query select
      v_request.id,
      null::text,
      null::text,
      null::timestamptz,
      false,
      v_request.marketing_subscribed_at,
      'already_claimed'::text,
      v_request.attempts;
    return;
  end if;

  -- No email ever reached this person: release a code that expired undelivered.
  if v_request.code_id is not null then
    update offer_codes
    set status = 'expired', request_id = null
    where id = v_request.code_id;
    update code_requests
    set code_id = null
    where id = v_request.id;
  end if;

  select oc.* into v_code
  from offer_codes as oc
  where oc.status = 'unused'
    and oc.expires_at > now() + interval '24 hours'
  order by oc.expires_at asc, oc.created_at asc
  for update skip locked
  limit 1;

  if not found then
    update code_requests
    set status = 'queued', code_id = null, last_error = null
    where id = v_request.id;
    return query select
      v_request.id,
      null::text,
      null::text,
      null::timestamptz,
      false,
      v_request.marketing_subscribed_at,
      'queued'::text,
      v_request.attempts;
    return;
  end if;

  update offer_codes
  set status = 'assigned', request_id = v_request.id, assigned_at = now()
  where id = v_code.id;

  update code_requests
  set code_id = v_code.id, status = 'sending', last_error = null
  where id = v_request.id;

  return query select
    v_request.id,
    v_code.code_ciphertext,
    v_code.redemption_url_ciphertext,
    v_code.expires_at,
    false,
    v_request.marketing_subscribed_at,
    'assigned'::text,
    v_request.attempts;
end;
$$;

create or replace function claim_next_code_delivery()
returns table (
  request_id uuid,
  email_ciphertext text,
  locale text,
  code_ciphertext text,
  redemption_url_ciphertext text,
  expires_at timestamptz,
  attempt integer
)
language plpgsql
as $$
declare
  v_request code_requests%rowtype;
  v_code offer_codes%rowtype;
begin
  -- A failed re-send whose code has since expired must not earn a replacement code:
  -- the address already received one. Settle those requests as sent.
  update code_requests as cr
  set status = 'sent', last_error = null
  where cr.status in ('queued', 'delivery_failed')
    and cr.sent_at is not null
    and not exists (
      select 1
      from offer_codes as oc
      where oc.id = cr.code_id
        and oc.status in ('assigned', 'sent')
        and oc.expires_at > now()
    );

  select * into v_request
  from code_requests
  where status in ('queued', 'delivery_failed')
    and last_requested_at < now() - interval '2 minutes'
  order by last_requested_at asc
  for update skip locked
  limit 1;

  if not found then return; end if;

  if v_request.code_id is not null then
    select oc.* into v_code
    from offer_codes as oc
    where oc.id = v_request.code_id
      and oc.status in ('assigned', 'sent')
      and oc.expires_at > now();
  end if;

  if v_code.id is null then
    if v_request.code_id is not null then
      update offer_codes
      set status = 'expired', request_id = null
      where id = v_request.code_id;
      update code_requests set code_id = null where id = v_request.id;
    end if;

    select oc.* into v_code
    from offer_codes as oc
    where oc.status = 'unused'
      and oc.expires_at > now() + interval '24 hours'
    order by oc.expires_at asc, oc.created_at asc
    for update skip locked
    limit 1;

    if not found then return; end if;

    update offer_codes
    set status = 'assigned', request_id = v_request.id, assigned_at = now()
    where id = v_code.id;
  end if;

  update code_requests
  set code_id = v_code.id, status = 'sending', last_error = null
  where id = v_request.id;

  return query select
    v_request.id,
    v_request.email_ciphertext,
    v_request.locale,
    v_code.code_ciphertext,
    v_code.redemption_url_ciphertext,
    v_code.expires_at,
    v_request.attempts;
end;
$$;

commit;
