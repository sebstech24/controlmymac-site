/* Control My Mac — language switcher + first-visit redirect (client-side, no deps).
   English lives at the root (/, /pro, /support, ...). Each language lives under a
   prefix (/de/, /fr/, ...). The visitor's choice is remembered in localStorage +
   cookie; first-time visitors are sent to the version matching their browser
   language. Choosing a language (incl. English) sticks and stops auto-redirects. */
(function () {
  "use strict";

  var LOCALES = [
    { code: "en", name: "English",    hreflang: "en" },
    { code: "de", name: "Deutsch",    hreflang: "de" },
    { code: "fr", name: "Français",   hreflang: "fr" },
    { code: "it", name: "Italiano",   hreflang: "it" },
    { code: "es", name: "Español",    hreflang: "es" },
    { code: "pt", name: "Português",  hreflang: "pt-BR" },
    { code: "nl", name: "Nederlands", hreflang: "nl" },
    { code: "ja", name: "日本語",      hreflang: "ja" },
    { code: "zh", name: "中文",        hreflang: "zh-Hans" },
    { code: "ko", name: "한국어",      hreflang: "ko" },
    { code: "ru", name: "Русский",    hreflang: "ru" },
    { code: "pl", name: "Polski",     hreflang: "pl" },
    { code: "tr", name: "Türkçe",     hreflang: "tr" }
  ];
  var CODES = LOCALES.map(function (l) { return l.code; });
  var KEY = "cmm_lang";

  function getStored() {
    try { var v = localStorage.getItem(KEY); if (v) return v; } catch (e) {}
    var m = document.cookie.match(/(?:^|;\s*)cmm_lang=([a-z]{2})/);
    return m ? m[1] : null;
  }
  function setStored(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
    document.cookie = KEY + "=" + v + "; path=/; max-age=31536000; samesite=lax";
  }

  // Current locale + the path with any locale prefix stripped ("bare" English path).
  var parts = location.pathname.split("/");
  var current = "en";
  if (CODES.indexOf(parts[1]) > -1 && parts[1] !== "en") { current = parts[1]; parts.splice(1, 1); }
  var bare = parts.join("/");
  if (bare === "") bare = "/";

  function match(tag) {
    tag = (tag || "").toLowerCase();
    var primary = tag.split("-")[0];
    return CODES.indexOf(primary) > -1 ? primary : null;
  }
  function detect() {
    var langs = navigator.languages || [navigator.language || "en"];
    for (var i = 0; i < langs.length; i++) { var m = match(langs[i]); if (m) return m; }
    return "en";
  }
  function go(code) {
    var target = code === "en" ? bare : "/" + code + (bare === "/" ? "/" : bare);
    location.replace(target + location.search + location.hash);
  }

  // First-visit / remembered redirect — only ever triggered from an English (unprefixed) URL,
  // so a visitor deliberately on /de/… is never bounced away.
  var stored = getStored();
  if (current === "en") {
    if (stored && stored !== "en" && CODES.indexOf(stored) > -1) { go(stored); return; }
    if (!stored) {
      var want = detect();
      if (want !== "en") { setStored(want); go(want); return; }
    }
  } else {
    setStored(current); // landing directly on a localized page records that preference
  }

  // Build the switcher UI (progressive enhancement; hidden until JS populates it).
  function build() {
    var host = document.querySelector("[data-i18n-switch]");
    if (!host) return;
    var cur = LOCALES.filter(function (l) { return l.code === current; })[0] || LOCALES[0];
    host.hidden = false;
    host.innerHTML = "";

    var btn = document.createElement("button");
    btn.className = "lang-btn";
    btn.type = "button";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Choose language");
    btn.innerHTML = '<span aria-hidden="true">🌐</span> <span class="lang-cur">' + cur.code.toUpperCase() + "</span>";

    var menu = document.createElement("ul");
    menu.className = "lang-menu";
    menu.setAttribute("role", "listbox");
    menu.hidden = true;

    LOCALES.forEach(function (l) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.lang = l.hreflang;
      a.textContent = l.name;
      a.href = l.code === "en" ? bare : "/" + l.code + (bare === "/" ? "/" : bare);
      if (l.code === current) { a.setAttribute("aria-current", "true"); li.className = "is-active"; }
      a.addEventListener("click", function () { setStored(l.code); });
      li.appendChild(a);
      menu.appendChild(li);
    });

    function close() { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", function (e) { if (!host.contains(e.target)) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    host.appendChild(btn);
    host.appendChild(menu);
  }

  if (document.readyState !== "loading") build();
  else document.addEventListener("DOMContentLoaded", build);
})();
