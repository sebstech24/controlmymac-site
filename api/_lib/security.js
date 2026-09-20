import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";

export const SUPPORTED_LOCALES = new Set([
  "en", "de", "es", "fr", "it", "ja", "ko", "nl", "pl", "pt", "ru", "tr", "zh",
]);

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmail(email) {
  return email.length >= 6 &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function normalizeLocale(value) {
  const locale = String(value || "en").toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.has(locale) ? locale : "en";
}

export function fingerprint(value, secret) {
  if (!secret) throw new Error("EMAIL_HASH_SECRET is required");
  return createHmac("sha256", secret).update(value).digest("hex");
}

function encryptionKey(secret) {
  const raw = Buffer.from(String(secret || ""), "base64");
  if (raw.length !== 32) {
    throw new Error("CODE_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  }
  return raw;
}

export function encrypt(value, secret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decrypt(value, secret) {
  const parts = String(value || "").split(".");
  if (parts.length !== 3) throw new Error("Invalid encrypted value");
  const [iv, tag, encrypted] = parts.map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function signRequestToken(requestId, secret, secretName) {
  if (!secret) throw new Error(`${secretName} is required`);
  const signature = createHmac("sha256", secret).update(requestId).digest("base64url");
  return `${requestId}.${signature}`;
}

function verifyRequestToken(token, secret, secretName) {
  const value = String(token || "");
  const separator = value.lastIndexOf(".");
  if (separator < 1) return null;
  const requestId = value.slice(0, separator);
  const expected = signRequestToken(requestId, secret, secretName);
  if (expected.length !== value.length) return null;
  let mismatch = 0;
  for (let index = 0; index < value.length; index += 1) {
    mismatch |= value.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return mismatch === 0 ? requestId : null;
}

export function signUnsubscribeToken(requestId, secret) {
  return signRequestToken(requestId, secret, "UNSUBSCRIBE_SECRET");
}

export function verifyUnsubscribeToken(token, secret) {
  return verifyRequestToken(token, secret, "UNSUBSCRIBE_SECRET");
}

export function signNewsletterConfirmToken(requestId, secret) {
  return signRequestToken(requestId, secret, "NEWSLETTER_CONFIRM_SECRET");
}

export function verifyNewsletterConfirmToken(token, secret) {
  return verifyRequestToken(token, secret, "NEWSLETTER_CONFIRM_SECRET");
}
