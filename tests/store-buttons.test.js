// The download area (Mac, Windows, App Store, Google Play) must match scripts/store-buttons.json on every page,
// and a button without a real link must never reach a page.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const settings = JSON.parse(readFileSync(path.join(root, "scripts", "store-buttons.json"), "utf8"));
const langs = Object.keys(settings.copy);
const page = (lang, name) => readFileSync(path.join(root, lang === "en" ? "" : lang, name), "utf8");
const live = (platform) => settings.links[platform].startsWith("https://");

test("the settings cover all 25 languages with the same words", () => {
  assert.equal(langs.length, 25);
  const keys = Object.keys(settings.copy.en).sort();
  for (const lang of langs) {
    assert.deepEqual(Object.keys(settings.copy[lang]).sort(), keys, lang);
    for (const [key, text] of Object.entries(settings.copy[lang])) {
      assert.doesNotMatch(text, /[–—]/, `${lang}.${key} has an en or em dash`);
    }
  }
});

test("every page is in step with the settings", () => {
  // Exits 1 and names the pages when someone changed the settings without running the builder.
  execFileSync("python3", [path.join(root, "scripts", "store-buttons.py"), "--check"], { stdio: "pipe" });
});

test("each page shows every app in two groups, live stores only as badges, with store tracking", () => {
  for (const lang of langs) {
    for (const name of ["index.html", "download.html"]) {
      const html = page(lang, name);
      assert.ok(html.includes("<!-- get:start"), `${lang}/${name} has no download area`);
      assert.doesNotMatch(html, /PASTE_THE_|preview-only|toolbox\.marketingtools\.apple\.com|play\.google\.com\/intl/, `${lang}/${name}`);
      const area = html.slice(html.indexOf("<!-- get:start"), html.indexOf("<!-- get:end -->"));
      const words = settings.copy[lang];
      assert.ok(area.includes(words.phone_head) && area.includes(words.computer_head), `${lang}/${name} lacks the two groups`);
      assert.ok(area.includes("data-get-qr hidden") && area.includes("/assets/qr-app.svg"), `${lang}/${name} lacks the QR code`);
      // Every App Store link in the area carries the campaign token, every Play link its referrer.
      for (const href of area.match(/https:\/\/apps\.apple\.com\/[^"]*/g)) {
        assert.match(href, new RegExp(`\\?pt=${settings.tracking.apple_pt}&amp;ct=website&amp;mt=8$`), `${lang}/${name}`);
      }
      assert.equal(/play\.google\.com/.test(area), live("android"), `${lang}/${name}: Google Play badge vs live.android`);
      assert.equal(/apps\.microsoft\.com/.test(area), live("windows"), `${lang}/${name}: Microsoft badge vs live.windows`);
      if (live("android")) {
        assert.match(area, /details\?id=com\.controlmymac\.controller&amp;referrer=utm_source%3Dcontrolmymac\.com%26utm_medium%3Dwebsite/);
        assert.ok(["png", "svg"].some((ext) => existsSync(path.join(root, "assets", "badges", "google-play", `${lang}.${ext}`))),
          `Google's official badge for ${lang} is missing`);
      }
      if (live("windows")) { assert.match(area, /9P7H2FKL3JH3\?cid=website/); }
      if (name === "index.html") {
        assert.match(area, /data-main="mac">[\s\S]*data-dl-cta href="\/download"/, `${lang}: the Mac download must stay the default main button`);
        assert.match(area, /data-main="ios" hidden/, `${lang}: no App Store main button`);
      }
    }
  }
});

test("the QR page sends phones to their store with the QR campaign", () => {
  const html = readFileSync(path.join(root, "app.html"), "utf8");
  assert.match(html, /ct=website-qr/);
  assert.match(html, /utm_medium%3Dqr/);
});
