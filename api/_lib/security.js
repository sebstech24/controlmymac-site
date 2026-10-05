import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";

export const SUPPORTED_LOCALES = new Set([
  "en", "de", "es", "fr", "it", "ja", "ko", "nl", "pl", "pt", "ru", "sl", "tr", "uk", "zh", "zh-hant",
  "cs", "sk", "sv", "no", "da", "fi", "hu", "ro", "el",
]);

/**
 * Rebuilds a PEM private key however it was pasted into an environment variable:
 * real newlines, literal "\\n" sequences, or a single line whose newlines became
 * spaces (Vercel's one-line value field). The base64 body is re-wrapped at 64 characters.
 */
export function normalizePem(value, fallbackLabel = "PRIVATE KEY") {
  const text = String(value || "").replaceAll("\\n", "\n").replaceAll("\r", "").trim();
  const match = text.match(/-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/);
  const label = match ? match[1] : fallbackLabel;
  const body = (match ? match[2] : text).replace(/\s+/g, "");
  const lines = body.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----\n`;
}

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);
// Apple IDs share one name across these domains: x@me.com, x@mac.com and x@icloud.com
// are the same inbox or do not exist, so they can never belong to two people.
const APPLE_DOMAINS = new Set(["icloud.com", "me.com", "mac.com"]);

/**
 * One key per real inbox, used ONLY to decide whether an address already got a code.
 * Email is still sent to the address the person typed.
 * - lowercase, trimmed, trailing dots removed from the domain
 * - "+tag" dropped on every domain (Gmail, iCloud, Outlook/Hotmail/Live, Fastmail, ...)
 * - Gmail ignores dots, and googlemail.com is the same inbox as gmail.com
 * - icloud.com, me.com and mac.com fold together (shared Apple ID namespace)
 * Yahoo's "-" disposable addresses and Outlook/Hotmail/Live (separate namespaces) are
 * deliberately left as distinct addresses.
 */
export function canonicalEmail(value) {
  const email = normalizeEmail(value);
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return email;
  let local = email.slice(0, at);
  let domain = email.slice(at + 1).replace(/\.+$/, "");
  const plus = local.indexOf("+");
  if (plus > 0) local = local.slice(0, plus);
  if (GMAIL_DOMAINS.has(domain)) {
    domain = "gmail.com";
    local = local.replaceAll(".", "") || local;
  } else if (APPLE_DOMAINS.has(domain)) {
    domain = "icloud.com";
  }
  return `${local}@${domain}`;
}

function firstHeaderValue(headers, name) {
  return String(headers.get(name) || "").split(",")[0].trim();
}

/**
 * The visitor's IP as Vercel reports it. Vercel sets x-real-ip and overwrites
 * x-forwarded-for at its edge, so visitors cannot forge them. cf-connecting-ip is
 * ignored on purpose: Vercel passes it through untouched, so anyone can send one.
 */
export function clientIp(headers) {
  const ip = firstHeaderValue(headers, "x-real-ip") || firstHeaderValue(headers, "x-forwarded-for");
  return ip.toLowerCase().slice(0, 64) || "unknown";
}

function ipv6Groups(address) {
  const halves = address.split("::");
  if (halves.length > 2) return null;
  const split = (part) => (part ? part.split(":") : []);
  const head = split(halves[0]);
  const tail = halves.length === 2 ? split(halves[1]) : [];
  const last = tail.length ? tail : head;
  // An embedded IPv4 tail (64:ff9b::1.2.3.4) takes the space of two groups.
  if (last.length && last[last.length - 1].includes(".")) last.splice(-1, 1, "0", "0");
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  return groups.every((group) => /^[0-9a-f]{1,4}$/.test(group)) ? groups : null;
}

/**
 * What the per-IP cap counts against: the IPv4 address, or the /64 network for IPv6.
 * A home or phone normally owns a whole IPv6 /64 (like a household behind one IPv4),
 * so counting single IPv6 addresses would let one device rotate through billions.
 */
export function ipRateBucket(ip) {
  const value = String(ip || "").trim().toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  const mapped = value.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return mapped[1];
  if (!value.includes(":")) return value || "unknown";
  const groups = ipv6Groups(value);
  if (!groups) return value;
  return `${groups.slice(0, 4).map((group) => group.padStart(4, "0")).join(":")}::/64`;
}

export function isValidEmail(email) {
  return email.length >= 6 &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function normalizeLocale(value) {
  const tag = String(value || "en").toLowerCase().replaceAll("_", "-");
  let locale = tag.split("-")[0];
  // Norwegian: Bokmål, Nynorsk and the plain "no" tag all use the /no pages.
  if (locale === "nb" || locale === "nn") locale = "no";
  // Chinese: Traditional for the Hant script and for Taiwan, Hong Kong and Macau.
  if (locale === "zh") return /-hans\b/.test(tag) ? "zh" : /-(hant|tw|hk|mo)\b/.test(tag) ? "zh-hant" : "zh";
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

/** Like decrypt, for optional fields: a missing or unreadable value gives null instead of throwing. */
export function decryptOptional(value, secret) {
  if (!value) return null;
  try {
    return decrypt(value, secret);
  } catch {
    return null;
  }
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
