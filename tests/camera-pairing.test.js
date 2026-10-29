// Camera-app pairing: the QR is https://www.controlmymac.com/pair#payload=... (Universal Links / App Links).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(root, p), "utf8");

test("apple-app-site-association opens /pair in the iPhone app", () => {
  const aasa = JSON.parse(read(".well-known/apple-app-site-association"));
  const [d] = aasa.applinks.details;
  assert.deepEqual(d.appIDs, ["H9ZS6Y55PD.com.sebastianskoic.macremotecontrol.phone"]);
  assert.ok(d.components.some((c) => c["/"] === "/pair"));
  const vercel = JSON.parse(read("vercel.json"));
  const rule = vercel.headers.find((h) => h.source === "/.well-known/apple-app-site-association");
  assert.equal(rule.headers.find((h) => h.key === "Content-Type").value, "application/json");
});

test("assetlinks.json lists the Android app with real SHA-256 fingerprints", () => {
  const [entry] = JSON.parse(read(".well-known/assetlinks.json"));
  assert.deepEqual(entry.relation, ["delegate_permission/common.handle_all_urls"]);
  assert.equal(entry.target.package_name, "com.controlmymac.controller");
  assert.ok(entry.target.sha256_cert_fingerprints.length >= 2, "upload key and Play app-signing key");
  for (const fp of entry.target.sha256_cert_fingerprints) {
    assert.match(fp, /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
  }
});

test("/pair loads no outside scripts and drops the secret from the address bar", () => {
  const html = read("pair.html");
  assert.doesNotMatch(html, /<script[^>]+src=/);
  assert.match(html, /history\.replaceState\(null, "", location\.pathname\)/);
  assert.match(html, /<meta name="robots" content="noindex">/);
});
