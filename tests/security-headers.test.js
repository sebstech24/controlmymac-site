// Browser security headers (vercel.json, sent on every page). The Content-Security-Policy only runs scripts
// from files and the few inline scripts whose hash it lists, so a new or edited inline script must be added
// there (this test prints the hash) or the browser silently refuses to run it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const rule = JSON.parse(readFileSync(path.join(root, "vercel.json"), "utf8")).headers.find((h) => h.source === "/(.*)");
const header = (key) => rule.headers.find((h) => h.key === key)?.value;
const pages = readdirSync(root, { recursive: true })
  .filter((p) => p.endsWith(".html") && !/^(node_modules|\.claude|\.git)\//.test(p));

test("every page gets the security headers", () => {
  assert.match(header("Content-Security-Policy"), /frame-ancestors 'none'/);
  assert.equal(header("X-Frame-Options"), "DENY");
  assert.equal(header("X-Content-Type-Options"), "nosniff");
  assert.equal(header("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.ok(header("Permissions-Policy"));
});

test("every inline script on every page is allowed by the Content-Security-Policy", () => {
  const csp = header("Content-Security-Policy");
  assert.ok(pages.length > 200, "pages found");
  for (const p of pages) {
    const html = readFileSync(path.join(root, p), "utf8");
    assert.doesNotMatch(html, /\son[a-z]+="|href="javascript:/, `${p}: inline event handlers never run under the policy`);
    for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (/\bsrc=/.test(attrs) || /type="application\/(ld\+)?json"/.test(attrs)) continue;
      const hash = `'sha256-${createHash("sha256").update(body).digest("base64")}'`;
      assert.ok(csp.includes(hash), `${p}: add ${hash} to script-src in vercel.json`);
    }
  }
});

test("the policy allows what the pages load from elsewhere", () => {
  const csp = header("Content-Security-Policy");
  const assets = ["site.js", "stats.js", "offer.js", "waitlist.js"]
    .map((f) => readFileSync(path.join(root, "assets", f), "utf8")).join("\n");
  const hosts = new Set(assets.match(/https:\/\/(challenges\.cloudflare\.com|www\.youtube-nocookie\.com|eu\.i\.posthog\.com)/g));
  assert.equal(hosts.size, 3);
  for (const host of hosts) assert.ok(csp.includes(host), host);
  assert.match(csp, /script-src[^;]* https:\/\/eu-assets\.i\.posthog\.com/); // PostHog's loader in stats.js fetches array.js from there
});
