import { createHash } from "node:crypto";
import { renderCodeEmail } from "./email-content.js";
import { renderWaitlistEmail } from "./waitlist-email.js";

function deterministicIdempotencyKey(seed) {
  const value = createHash("sha256").update(seed).digest("hex").slice(0, 32).split("");
  value[12] = "4";
  value[16] = ((Number.parseInt(value[16], 16) & 3) | 8).toString(16);
  const hex = value.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function brevoRequest(path, body, { acceptDuplicate = false } = {}) {
  const response = await fetch(`https://api.brevo.com/v3${path}`, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text();
    // Brevo answers a reused idempotencyKey with a duplicate_parameter error: the first
    // request already went out, so the send counts as done.
    if (acceptDuplicate && (response.status === 400 || response.status === 409) &&
      /duplicate_parameter/i.test(detail)) {
      return { messageId: "duplicate-suppressed" };
    }
    throw new Error(`Brevo ${response.status}: ${detail.slice(0, 300)}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export async function sendCodeEmail(input) {
  const content = renderCodeEmail(input);
  // Each time the person asks (code_requests.attempts) is a new send; a retry of that same
  // ask, such as the daily cron re-delivering after a failure, reuses the key and is
  // deduplicated by Brevo for 30 minutes. Brevo reads the key from the body headers as
  // "idempotencyKey" and requires a UUID.
  const attempt = Number.isInteger(input.attempt) && input.attempt > 0 ? input.attempt : 1;
  const headers = {
    "X-Entity-Ref-ID": `control-my-mac-code-${input.requestId}-${attempt}`,
    idempotencyKey: deterministicIdempotencyKey(`${input.requestId}:free-month:${attempt}`),
  };
  if (process.env.BREVO_SANDBOX_MODE === "true") {
    headers["X-Sib-Sandbox"] = "drop";
  }
  const response = await brevoRequest("/smtp/email", {
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME || "Sebastian from Control My Mac",
    },
    replyTo: process.env.BREVO_REPLY_TO
      ? { email: process.env.BREVO_REPLY_TO, name: "Sebastian" }
      : undefined,
    to: [{ email: input.email }],
    subject: content.subject,
    htmlContent: content.html,
    textContent: content.text,
    headers,
    tags: ["control-my-mac", "free-month-code"],
  }, { acceptDuplicate: true });
  return response.messageId || "accepted";
}

export async function subscribeContact({ email, locale }) {
  const listId = Number(process.env.BREVO_MARKETING_LIST_ID);
  if (!Number.isInteger(listId) || listId <= 0) {
    throw new Error("BREVO_MARKETING_LIST_ID is required");
  }
  return brevoRequest("/contacts", {
    email,
    listIds: [listId],
    updateEnabled: true,
    attributes: { LANGUAGE: locale, APP: "Control My Mac" },
  });
}

export async function unsubscribeContact(email) {
  const listId = Number(process.env.BREVO_MARKETING_LIST_ID);
  if (!Number.isInteger(listId) || listId <= 0) {
    throw new Error("BREVO_MARKETING_LIST_ID is required");
  }
  return brevoRequest(`/contacts/lists/${listId}/contacts/remove`, {
    emails: [email],
  });
}

/** The "you're on the list" email for the Windows/Android waiting list. */
export async function sendWaitlistEmail(input) {
  const content = renderWaitlistEmail(input);
  const headers = {};
  if (process.env.BREVO_SANDBOX_MODE === "true") {
    headers["X-Sib-Sandbox"] = "drop";
  }
  const response = await brevoRequest("/smtp/email", {
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME || "Sebastian from Control My Mac",
    },
    replyTo: process.env.BREVO_REPLY_TO
      ? { email: process.env.BREVO_REPLY_TO, name: "Sebastian" }
      : undefined,
    to: [{ email: input.email }],
    subject: content.subject,
    htmlContent: content.html,
    textContent: content.text,
    headers: Object.keys(headers).length ? headers : undefined,
    tags: ["control-my-mac", "platform-waitlist"],
  });
  return response.messageId || "accepted";
}
