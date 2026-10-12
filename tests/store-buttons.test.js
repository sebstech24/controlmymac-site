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

test("no placeholder or preview link is on a page, and a device without a link has no button", () => {
  for (const lang of langs) {
    for (const name of ["index.html", "download.html"]) {
      const html = page(lang, name);
      assert.ok(html.includes("<!-- get:start"), `${lang}/${name} has no download area`);
      assert.doesNotMatch(html, /PASTE_THE_|preview-only|toolbox\.marketingtools\.apple\.com|play\.google\.com\/intl|get\.microsoft\.com\/images/, `${lang}/${name}`);
      const area = html.slice(html.indexOf("<!-- get:start"), html.indexOf("<!-- get:end -->"));
      if (!live("windows")) { assert.ok(!area.includes(settings.copy[lang].win_btn) && !/microsoft/.test(area), `${lang}/${name} shows a Windows button`); }
      if (live("windows") && settings.links.windows.startsWith("https://apps.microsoft.com/")) {
        assert.ok(existsSync(path.join(root, "assets", "badges", "microsoft-store", `${lang}.svg`)), `Microsoft's official badge for ${lang} is missing`);
      }
      if (!live("android")) { assert.ok(!/google-play|play\.google\.com/.test(area), `${lang}/${name} shows a Google Play button`); }
      if (live("android")) {
        assert.ok(["png", "svg"].some((ext) => existsSync(path.join(root, "assets", "badges", "google-play", `${lang}.${ext}`))),
          `Google's official badge for ${lang} is missing`);
      }
    }
  }
});
