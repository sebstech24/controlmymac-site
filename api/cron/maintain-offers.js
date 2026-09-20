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
  upsertBatch,
} from "../_lib/database.js";
import {
  createFreeMonthBatch,
  fetchBatchValues,
  prepareCodeRows,
} from "../_lib/apple-offers.js";
import {
  sendCodeEmail,
  subscribeContact,
  unsubscribeContact,
} from "../_lib/brevo.js";
import { decrypt, signNewsletterConfirmToken, signUnsubscribeToken } from "../_lib/security.js";

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

async function importReadyBatches() {
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

function messageInput(delivery) {
  const email = decrypt(delivery.email_ciphertext, process.env.CODE_ENCRYPTION_KEY);
  const code = decrypt(delivery.code_ciphertext, process.env.CODE_ENCRYPTION_KEY);
  const token = signUnsubscribeToken(delivery.request_id, process.env.UNSUBSCRIBE_SECRET);
  const confirmToken = signNewsletterConfirmToken(
    delivery.request_id,
    process.env.NEWSLETTER_CONFIRM_SECRET,
  );
  const siteUrl = (process.env.PUBLIC_SITE_URL || "https://controlmymac.com").replace(/\/$/, "");
  return {
    requestId: delivery.request_id,
    email,
    locale: delivery.locale,
    code,
    expiresAt: delivery.expires_at,
    autoRenews: process.env.FREE_MONTH_AUTO_RENEWS === "true",
    confirmationUrl: `${siteUrl}/api/confirm-newsletter?token=${encodeURIComponent(confirmToken)}`,
    unsubscribeUrl: `${siteUrl}/api/unsubscribe?token=${encodeURIComponent(token)}`,
  };
}

async function deliverQueued(limit = 50) {
  let sent = 0;
  for (let index = 0; index < limit; index += 1) {
    const delivery = await claimNextDelivery();
    if (!delivery) break;
    const input = messageInput(delivery);
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
  let inventory = await inventoryCounts();
  let createdBatch = null;
  const threshold = Math.max(25, Number(process.env.OFFER_CODE_LOW_WATERMARK || 100));
  const existingPending = await pendingBatches();
  if (inventory.unused < threshold && existingPending.length === 0) {
    const quantity = Math.min(25000, Math.max(500, Number(process.env.OFFER_CODE_BATCH_SIZE || 500)));
    createdBatch = await createFreeMonthBatch({ quantity });
    await upsertBatch({
      ...createdBatch,
      source: "apple_api",
      environment: "PRODUCTION",
      state: "generating",
    });
  }

  const sent = await deliverQueued();
  const repairedUnsubscribes = await repairUnsubscribes();
  const repairedSubscriptions = await repairMarketingList();
  inventory = await inventoryCounts();
  return json({
    ok: true,
    imported,
    createdBatch: createdBatch?.id || null,
    sent,
    repairedUnsubscribes,
    repairedSubscriptions,
    inventory,
  });
}
