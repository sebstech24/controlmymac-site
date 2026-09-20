import { connect } from "node:http2";
import { createPrivateKey, sign } from "node:crypto";

function base64urlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function createApnsProviderToken({ teamId, keyId, privateKey, now = Date.now() }) {
  if (!teamId || !keyId || !privateKey) {
    throw new Error("APNS_TEAM_ID, APNS_KEY_ID, and APNS_PRIVATE_KEY are required");
  }
  const header = base64urlJson({ alg: "ES256", kid: keyId });
  const payload = base64urlJson({ iss: teamId, iat: Math.floor(now / 1000) });
  const signingInput = `${header}.${payload}`;
  const normalizedKey = String(privateKey).replaceAll("\\n", "\n");
  const signature = sign("sha256", Buffer.from(signingInput), {
    key: createPrivateKey(normalizedKey),
    dsaEncoding: "ieee-p1363",
  }).toString("base64url");
  return `${signingInput}.${signature}`;
}

export function apnsPayload({ title, body, version, url }) {
  const payload = {
    aps: {
      alert: { title, body },
      sound: "default",
      "thread-id": "control-my-mac-updates",
    },
  };
  if (version) payload.updateVersion = version;
  if (url) payload.url = url;
  return payload;
}

export function apnsHeaders({ deviceToken, providerToken, topic, version }) {
  const headers = {
    ":method": "POST",
    ":path": `/3/device/${deviceToken}`,
    authorization: `bearer ${providerToken}`,
    "apns-topic": topic,
    "apns-push-type": "alert",
    "apns-priority": "10",
    "apns-expiration": String(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60),
  };
  if (version) headers["apns-collapse-id"] = `control-my-mac-update-${version}`.slice(0, 64);
  return headers;
}

function apnsHost(environment) {
  return environment === "sandbox"
    ? "https://api.sandbox.push.apple.com"
    : "https://api.push.apple.com";
}

function openSession(environment) {
  return new Promise((resolve, reject) => {
    const session = connect(apnsHost(environment));
    session.once("connect", () => resolve(session));
    session.once("error", reject);
  });
}

function sendRequest(session, headers, payload) {
  return new Promise((resolve, reject) => {
    const request = session.request(headers);
    let status = 0;
    let responseBody = "";
    request.setEncoding("utf8");
    request.on("response", (responseHeaders) => {
      status = Number(responseHeaders[":status"] || 0);
    });
    request.on("data", (chunk) => { responseBody += chunk; });
    request.on("end", () => {
      let reason = null;
      try {
        reason = responseBody ? JSON.parse(responseBody).reason : null;
      } catch {
        reason = responseBody || null;
      }
      resolve({ status, reason });
    });
    request.on("error", reject);
    request.setTimeout(10_000, () => {
      request.close();
      reject(new Error("APNs request timed out"));
    });
    request.end(JSON.stringify(payload));
  });
}

async function mapWithConcurrency(items, limit, operation) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await operation(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function sendApnsBatch(devices, notification) {
  const providerToken = createApnsProviderToken({
    teamId: process.env.APNS_TEAM_ID,
    keyId: process.env.APNS_KEY_ID,
    privateKey: process.env.APNS_PRIVATE_KEY,
  });
  const topic = process.env.APNS_BUNDLE_ID || "com.sebastianskoic.macremotecontrol.phone";
  const payload = apnsPayload(notification);
  if (Buffer.byteLength(JSON.stringify(payload)) > 4096) {
    throw new Error("APNs payload exceeds 4096 bytes");
  }

  const grouped = new Map();
  for (const device of devices) {
    const group = grouped.get(device.environment) || [];
    group.push(device);
    grouped.set(device.environment, group);
  }
  const allResults = [];
  for (const [environment, environmentDevices] of grouped) {
    const session = await openSession(environment);
    try {
      const results = await mapWithConcurrency(environmentDevices, 20, async (device) => {
        try {
          const result = await sendRequest(
            session,
            apnsHeaders({
              deviceToken: device.deviceToken,
              providerToken,
              topic,
              version: notification.version,
            }),
            payload,
          );
          return { ...device, ...result };
        } catch (error) {
          return { ...device, status: 0, reason: String(error?.message || error) };
        }
      });
      allResults.push(...results);
    } finally {
      session.close();
    }
  }
  return allResults;
}

export function shouldDisableDevice(status, reason) {
  return status === 410 || [
    "BadDeviceToken",
    "DeviceTokenNotForTopic",
    "Unregistered",
  ].includes(reason);
}
