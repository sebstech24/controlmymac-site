-- Control My Mac free-month code delivery schema.
-- Run this once against the dedicated Neon database before enabling the API.

create extension if not exists pgcrypto;

create table if not exists offer_code_batches (
  id text primary key,
  source text not null check (source in ('apple_api', 'manual', 'sandbox')),
  environment text not null default 'PRODUCTION',
  expected_count integer not null default 0,
  imported_count integer not null default 0,
  expires_at timestamptz not null,
  state text not null default 'generating'
    check (state in ('generating', 'ready', 'failed', 'expired')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists code_requests (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null unique,
  email_ciphertext text not null,
  locale text not null default 'en',
  marketing_requested boolean not null default false,
  marketing_requested_at timestamptz,
  marketing_confirmed_at timestamptz,
  marketing_subscribed_at timestamptz,
  marketing_unsubscribed_at timestamptz,
  marketing_removed_at timestamptz,
  consent_text_version text,
  status text not null default 'queued'
    check (status in ('queued', 'sending', 'sent', 'delivery_failed')),
  code_id uuid,
  provider_message_id text,
  last_error text,
  attempts integer not null default 1,
  created_at timestamptz not null default now(),
  last_requested_at timestamptz not null default now(),
  sent_at timestamptz
);

-- Remove fields from the discarded promotional follow-up experiment.
drop function if exists claim_next_lifetime_offer();
drop index if exists code_requests_lifetime_offer_idx;
alter table code_requests drop column if exists lifetime_offer_status;
alter table code_requests drop column if exists lifetime_offer_attempts;
alter table code_requests drop column if exists lifetime_offer_last_attempt_at;
alter table code_requests drop column if exists lifetime_offer_sent_at;
alter table code_requests drop column if exists lifetime_offer_provider_message_id;
alter table code_requests drop column if exists lifetime_offer_last_error;

create table if not exists offer_codes (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null references offer_code_batches(id) on delete restrict,
  code_fingerprint text not null unique,
  code_ciphertext text not null,
  redemption_url_ciphertext text,
  expires_at timestamptz not null,
  status text not null default 'unused'
    check (status in ('unused', 'assigned', 'sent', 'expired')),
  request_id uuid unique references code_requests(id) on delete set null,
  assigned_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table code_requests
  drop constraint if exists code_requests_code_id_fkey;
alter table code_requests
  add constraint code_requests_code_id_fkey
  foreign key (code_id) references offer_codes(id) on delete set null;

create index if not exists offer_codes_available_idx
  on offer_codes (expires_at, created_at)
  where status = 'unused';
create index if not exists code_requests_delivery_idx
  on code_requests (status, last_requested_at);
create table if not exists rate_limit_buckets (
  key_hash text primary key,
  window_started_at timestamptz not null,
  attempts integer not null
);

-- APNs device tokens are opaque identifiers. Store only encrypted token values
-- and keyed hashes; never store a device name, Apple ID, or email association.
create table if not exists push_devices (
  id uuid primary key default gen_random_uuid(),
  installation_hash text not null,
  token_hash text not null unique,
  token_ciphertext text not null,
  environment text not null check (environment in ('sandbox', 'production')),
  locale text not null default 'en',
  app_version text not null default 'unknown',
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  last_delivery_at timestamptz,
  disabled_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_devices_active_idx
  on push_devices (last_seen_at desc)
  where enabled = true;
create index if not exists push_devices_installation_idx
  on push_devices (installation_hash);

create or replace function consume_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
as $$
declare
  v_attempts integer;
begin
  insert into rate_limit_buckets (key_hash, window_started_at, attempts)
  values (p_key_hash, now(), 1)
  on conflict (key_hash) do update
  set window_started_at = case
        when rate_limit_buckets.window_started_at < now() - make_interval(secs => p_window_seconds)
          then now()
        else rate_limit_buckets.window_started_at
      end,
      attempts = case
        when rate_limit_buckets.window_started_at < now() - make_interval(secs => p_window_seconds)
          then 1
        else rate_limit_buckets.attempts + 1
      end
  returning attempts into v_attempts;

  return v_attempts <= p_limit;
end;
$$;

-- One free-month code per email address, ever: a still-valid code is re-sent, an expired
-- one is never replaced once the address received it. Consent is single opt-in: an
-- accepted request with consent is confirmed at once, but never for an address that
-- unsubscribed, and a request that sends nothing changes nothing stored about the address.
-- Existing databases: apply db/2026-09-26-one-code-per-email.sql (same definitions,
-- wrapped in a transaction).

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

-- Windows and Android waiting list (Oct 2026). Separate from code_requests on purpose:
-- joining it does not subscribe anyone to Sebastian Apps emails.
create table if not exists platform_waitlist (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null unique,
  email_ciphertext text not null,
  locale text not null default 'en',
  wants_windows boolean not null default false,
  wants_android boolean not null default false,
  consent_text_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  notified_windows_at timestamptz,
  notified_android_at timestamptz
);
alter table platform_waitlist add column if not exists news_opt_in boolean not null default false;
alter table platform_waitlist add column if not exists news_subscribed_at timestamptz;
alter table platform_waitlist add column if not exists confirmation_sent_at timestamptz;
