import assert from "node:assert/strict";
import test from "node:test";
import { renderWaitlistReleaseEmail } from "../api/_lib/waitlist-email.js";

test("release email links only the platforms the person asked for", () => {
  const windowsOnly = renderWaitlistReleaseEmail({ locale: "en", windows: true, android: false });
  assert.equal(windowsOnly.subject, "Control My PC for Windows is out");
  assert.match(windowsOnly.text, /apps\.microsoft\.com/);
  assert.doesNotMatch(windowsOnly.text, /play\.google\.com/);

  const both = renderWaitlistReleaseEmail({ locale: "ko", windows: true, android: true });
  assert.match(both.subject, /Windows와 Android/);
  assert.match(both.text, /apps\.microsoft\.com/);
  assert.match(both.html, /<a href="https:\/\/play\.google\.com/);
});

test("languages without release copy fall back to English", () => {
  assert.equal(renderWaitlistReleaseEmail({ locale: "de", windows: false, android: true }).subject,
    "Control My PC for Android is out");
});
