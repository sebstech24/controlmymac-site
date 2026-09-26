import { createPrivateKey, sign } from "node:crypto";
import { encrypt, fingerprint, normalizePem } from "./security.js";

const APP_STORE_API = "https://api.appstoreconnect.apple.com";

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function createAppStoreConnectToken({ issuerId, keyId, privateKey, now = Date.now() }) {
  const issuedAt = Math.floor(now / 1000);
  const header = base64UrlJson({ alg: "ES256", kid: keyId, typ: "JWT" });
  const payload = base64UrlJson({
    iss: issuerId,
    iat: issuedAt,
    exp: issuedAt + 15 * 60,
    aud: "appstoreconnect-v1",
  });
  const unsigned = `${header}.${payload}`;
  const signature = sign("sha256", Buffer.from(unsigned), {
    key: createPrivateKey(normalizePem(privateKey)),
    dsaEncoding: "ieee-p1363",
  }).toString("base64url");
  return `${unsigned}.${signature}`;
}

function appleConfig() {
  const config = {
    issuerId: process.env.APP_STORE_CONNECT_ISSUER_ID,
    keyId: process.env.APP_STORE_CONNECT_KEY_ID,
    privateKey: process.env.APP_STORE_CONNECT_PRIVATE_KEY,
    offerCodeId: process.env.APPLE_FREE_MONTH_OFFER_CODE_ID,
  };
  if (Object.values(config).some((value) => !value)) {
    throw new Error("App Store Connect offer-code credentials are incomplete");
  }
  return config;
}

async function appleRequest(path, options = {}) {
  const config = appleConfig();
  const token = createAppStoreConnectToken(config);
  return fetch(`${APP_STORE_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: options.accept || "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export function defaultExpirationDate(now = new Date()) {
  const result = new Date(now);
  result.setUTCDate(result.getUTCDate() + 170);
  return result.toISOString().slice(0, 10);
}

export async function createFreeMonthBatch({ quantity = 500, expirationDate } = {}) {
  if (!Number.isInteger(quantity) || quantity < 500 || quantity > 25000) {
    throw new Error("Apple production batches must contain 500 to 25,000 codes");
  }
  const config = appleConfig();
  const date = expirationDate || defaultExpirationDate();
  const response = await appleRequest("/v1/subscriptionOfferCodeOneTimeUseCodes", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "subscriptionOfferCodeOneTimeUseCodes",
        attributes: { numberOfCodes: quantity, expirationDate: date },
        relationships: {
          offerCode: {
            data: { type: "subscriptionOfferCodes", id: config.offerCodeId },
          },
        },
      },
    }),
  });
  const body = await response.json();
  if (!response.ok || !body?.data?.id) {
    throw new Error(`Apple batch creation failed (${response.status}): ${JSON.stringify(body).slice(0, 600)}`);
  }
  return {
    id: body.data.id,
    expectedCount: quantity,
    expiresAt: `${date}T08:00:00.000Z`,
  };
}

function parseCsvLine(line) {
  const cells = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      cells.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }
  cells.push(value.trim());
  return cells;
}

export function parseOfferCodeCsv(csv) {
  const lines = String(csv || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = parseCsvLine(lines[0]).map((value) => value.toLowerCase().replace(/[^a-z]/g, ""));
  const codeIndex = header.findIndex((value) => value === "code" || value.endsWith("offercode"));
  const urlIndex = header.findIndex((value) => value.includes("redemptionurl") || value === "url");
  if (codeIndex >= 0) {
    return lines.slice(1).map(parseCsvLine).map((cells) => ({
      code: cells[codeIndex],
      redemptionUrl: urlIndex >= 0 ? cells[urlIndex] : "",
    })).filter((row) => row.code);
  }
  // The App Store Connect API returns one-time codes without a header row: "CODE,https://apps.apple.com/redeem?...".
  const rows = lines.map(parseCsvLine).map((cells) => ({
    code: cells[0],
    redemptionUrl: /^https:\/\//.test(cells[1] || "") ? cells[1] : "",
  })).filter((row) => /^[A-Za-z0-9-]{6,}$/.test(row.code || ""));
  if (!rows.length) throw new Error("Apple CSV does not contain an offer-code column");
  return rows;
}

export async function fetchBatchValues(batchId) {
  const response = await appleRequest(
    `/v1/subscriptionOfferCodeOneTimeUseCodes/${encodeURIComponent(batchId)}/values`,
    { method: "GET", accept: "text/csv" },
  );
  if (response.status === 404 || response.status === 409 || response.status === 425) return null;
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Apple code download failed (${response.status}): ${text.slice(0, 500)}`);
  }
  const values = parseOfferCodeCsv(text);
  return values.length ? values : null;
}

export function prepareCodeRows(values, expiresAt, encryptionSecret, fingerprintSecret) {
  return values.map(({ code, redemptionUrl }) => ({
    code_fingerprint: fingerprint(code, fingerprintSecret),
    code_ciphertext: encrypt(code, encryptionSecret),
    redemption_url_ciphertext: redemptionUrl ? encrypt(redemptionUrl, encryptionSecret) : null,
    expires_at: expiresAt,
  }));
}
