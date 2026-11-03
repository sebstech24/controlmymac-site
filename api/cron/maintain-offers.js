import {
  claimNextDelivery,
  importCodeRows,
  inventoryCounts,
  markDeliveryFailed,
  markDeliverySent,
  markMarketingRemoved,
  markMarketingSubscribed,
  pendingBatches,
  pendingMarketingRequests,
  pendingMarketingRemovals,
  batchIdForRequest,
  upsertBatch,
} from "../_lib/database.js";
import {
  createOfferBatch,
  fetchBatchValues,
  offerForBatch,
  prepareCodeRows,
} from "../_lib/apple-offers.js";
import {
  sendCodeEmail,
  subscribeContact,
  unsubscribeContact,
} from "../_lib/brevo.js";
import { decrypt, decryptOptional, signUnsubscribeToken } from "../_lib/security.js";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function importReadyBatches() {
  let imported = 0;
  for (const batch of await pendingBatches()) {
    const values = await fetchBatchValues(batch.id);
    if (!values) continue;
    const rows = prepareCodeRows(
      values,
      batch.expires_at,
      process.env.CODE_ENCRYPTION_KEY,
      process.env.EMAIL_HASH_SECRET,
    );
    imported += await importCodeRows(batch.id, rows);
  }
  return imported;
}

async function messageInput(delivery) {
  const email = decrypt(delivery.email_ciphertext, process.env.CODE_ENCRYPTION_KEY);
  const code = decrypt(delivery.code_ciphertext, process.env.CODE_ENCRYPTION_KEY);
  const token = signUnsubscribeToken(delivery.request_id, process.env.UNSUBSCRIBE_SECRET);
  const siteUrl = (process.env.PUBLIC_SITE_URL || "https://controlmymac.com").replace(/\/$/, "");
  return {
    requestId: delivery.request_id,
    attempt: delivery.attempt,
    email,
    locale: delivery.locale,
    code,
    redemptionUrl: decryptOptional(delivery.redemption_url_ciphertext, process.env.CODE_ENCRYPTION_KEY),
    expiresAt: delivery.expires_at,
    autoRenews: process.env.FREE_MONTH_AUTO_RENEWS === "true",
    offer: offerForBatch(await batchIdForRequest(delivery.request_id)),
    unsubscribeUrl: `${siteUrl}/api/unsubscribe?token=${encodeURIComponent(token)}`,
  };
}

async function deliverQueued(limit = 50) {
  let sent = 0;
  for (let index = 0; index < limit; index += 1) {
    const delivery = await claimNextDelivery();
    if (!delivery) break;
    const input = await messageInput(delivery);
    try {
      const messageId = await sendCodeEmail(input);
      await markDeliverySent(delivery.request_id, messageId);
      sent += 1;
    } catch (error) {
      await markDeliveryFailed(delivery.request_id, error);
    }
  }
  return sent;
}

async function repairMarketingList() {
  let repaired = 0;
  for (const request of await pendingMarketingRequests(50)) {
    const email = decrypt(request.email_ciphertext, process.env.CODE_ENCRYPTION_KEY);
    try {
      await subscribeContact({ email, locale: request.locale });
      await markMarketingSubscribed(request.id);
      repaired += 1;
    } catch {
      // Retry on the next scheduled run.
    }
  }
  return repaired;
}

async function repairUnsubscribes() {
  let repaired = 0;
  for (const request of await pendingMarketingRemovals(50)) {
    const email = decrypt(request.email_ciphertext, process.env.CODE_ENCRYPTION_KEY);
    try {
      await unsubscribeContact(email);
      await markMarketingRemoved(request.id);
      repaired += 1;
    } catch {
      // Retry on the next scheduled run.
    }
  }
  return repaired;
}

export async function GET(request) {
  if (!authorized(request)) return json({ ok: false }, 401);
  if (process.env.CODE_DELIVERY_MODE !== "ready") {
    return json({ ok: false, disabled: true }, 503);
  }

  const imported = await importReadyBatches();
  const inventory0 = await inventoryCounts();
  const unused = {
    free_month: inventory0.unused - (inventory0.unused_lifetime || 0),
    lifetime47: inventory0.unused_lifetime || 0,
  };
  const threshold = Math.max(25, Number(process.env.OFFER_CODE_LOW_WATERMARK || 100));
  const pending = (await pendingBatches()).map((batch) => offerForBatch(batch.id));
  const createdBatches = [];
  // Keep both gifts stocked; each top-up batch expires after about 170 days (Apple's limit is 6 months).
  for (const offer of ["free_month", "lifetime47"]) {
    if (unused[offer] >= threshold || pending.includes(offer)) continue;
    const quantity = Math.min(25000, Math.max(500, Number(process.env.OFFER_CODE_BATCH_SIZE || 500)));
    const batch = await createOfferBatch(offer, { quantity });
    await upsertBatch({ ...batch, source: "apple_api", environment: "PRODUCTION", state: "generating" });
    createdBatches.push(batch.id);
  }

  const sent = await deliverQueued();
  const repairedUnsubscribes = await repairUnsubscribes();
  const repairedSubscriptions = await repairMarketingList();
  const inventory = await inventoryCounts();
  return json({
    ok: true,
    imported,
    createdBatches,
    sent,
    repairedUnsubscribes,
    repairedSubscriptions,
    inventory,
  });
}
