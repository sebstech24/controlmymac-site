/* Control My Mac — Windows and Android waiting list (homepage only, no deps).
   Fail-closed: the section and its footer link stay hidden unless GET /api/waitlist
   says the service is configured. The page carries its own words in a JSON block;
   the shared form words come from assets/offer.js. On localhost, ?waitlist-preview=1
   shows the form without calling the API. The security check loads only once the
   visitor starts filling in the form. */
(function () {
  "use strict";
  var section = document.querySelector("[data-waitlist]");
  if (!section) { return; }
  var box = section.querySelector("[data-waitlist-form]");
  var copyEl = section.querySelector("[data-waitlist-copy]");
  var own = {};
  try { own = JSON.parse(copyEl.textContent); } catch (e) { return; }
  var shared = window.cmmOfferCopy || {};
  function t(key) { return own[key] || shared[key] || ""; }

  var LANG_MAP = { "pt-br": "pt", "zh-hans": "zh", "zh-hant": "zh-hant", "nb": "no" };
  var pageLang = (document.documentElement.lang || "en").toLowerCase();
  var locale = LANG_MAP[pageLang] || pageLang.split("-")[0];
  var privacyHref = locale === "en" ? "/privacy" : "/" + locale + "/privacy";
  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var localPreview = isLocal && /[?&]waitlist-preview=1\b/.test(location.search);

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) { node.className = cls; }
    if (text) { node.textContent = text; }
    return node;
  }
  function check(cls, label, name) {
    var wrap = el("label", cls);
    var input = document.createElement("input");
    input.type = "checkbox";
    input.name = name;
    wrap.appendChild(input);
    wrap.appendChild(el("span", "", label));
    return { wrap: wrap, input: input };
  }

  function status() {
    if (localPreview) { return Promise.resolve({ configured: true, turnstileSiteKey: null }); }
    return fetch("/api/waitlist", { headers: { Accept: "application/json" }, cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : { configured: false }; })
      .catch(function () { return { configured: false }; });
  }

  function mount(state) {
    if (!state.configured) { return; }
    section.hidden = false;
    var links = document.querySelectorAll("[data-waitlist-link]");
    for (var i = 0; i < links.length; i++) { links[i].hidden = false; }

    var form = el("form", "wl-form");
    form.noValidate = true;
    var label = el("label", "offer-label", t("emailLabel"));
    label.htmlFor = "wl-email";
    var email = document.createElement("input");
    email.className = "offer-input";
    email.type = "email";
    email.id = "wl-email";
    email.autocomplete = "email";
    email.inputMode = "email";
    email.placeholder = t("placeholder");
    email.required = true;

    var picks = el("fieldset", "wl-picks");
    picks.appendChild(el("legend", "offer-label", t("pick")));
    var windows = check("wl-pick", "Windows", "windows");
    var android = check("wl-pick", "Android", "android");
    picks.appendChild(windows.wrap);
    picks.appendChild(android.wrap);

    var news = check("offer-check wl-news", t("news"), "news");
    var consentBox = el("p", "offer-detail wl-terms", t("consent") + " " + t("privacyLead") + " ");
    var privacy = el("a", "", t("privacyLink"));
    privacy.href = privacyHref;
    consentBox.appendChild(privacy);

    var honeypot = document.createElement("input");
    honeypot.className = "offer-hp";
    honeypot.type = "text";
    honeypot.name = "website";
    honeypot.tabIndex = -1;
    honeypot.autocomplete = "off";
    honeypot.setAttribute("aria-hidden", "true");

    var guard = el("div", "offer-turnstile");
    var message = el("p", "offer-error");
    message.setAttribute("role", "alert");
    message.hidden = true;
    var submit = el("button", "btn btn-primary offer-submit", t("submit"));
    submit.type = "submit";

    [label, email, picks, news.wrap, honeypot, guard, message, submit, consentBox].forEach(function (n) { form.appendChild(n); });
    box.appendChild(form);

    function say(text) { message.textContent = text; message.hidden = !text; }

    var token = "", widgetId, guardStarted = false;
    function startGuard() {
      if (guardStarted || !state.turnstileSiteKey) { return; }
      guardStarted = true;
      var script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = function () {
        widgetId = window.turnstile.render(guard, {
          sitekey: state.turnstileSiteKey,
          callback: function (value) { token = value; },
          "expired-callback": function () { token = ""; },
          "error-callback": function () { token = ""; say(t("errTurnstile")); },
          theme: "auto",
          language: pageLang
        });
      };
      script.onerror = function () { say(t("errTurnstile")); };
      if (window.turnstile) { script.onload(); } else { document.head.appendChild(script); }
    }
    form.addEventListener("focusin", startGuard);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      startGuard();
      var address = email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) { say(t("errEmail")); email.focus(); return; }
      if (!windows.input.checked && !android.input.checked) { say(t("errPick")); windows.input.focus(); return; }
      if (state.turnstileSiteKey && !token) { say(t("errWait")); return; }
      say("");
      submit.disabled = true;
      submit.textContent = t("sending");

      function done() {
        var thanks = el("div", "wl-done");
        thanks.setAttribute("role", "status");
        var parts = t("done").split("{email}");
        var line = el("p", "wl-done-main", parts[0]);
        line.appendChild(el("strong", "", address));
        line.appendChild(document.createTextNode(parts[1] || ""));
        thanks.appendChild(line);
        var typo = el("p", "wl-done-typo", t("doneTypo") + " ");
        var again = el("button", "wl-again", t("again"));
        again.type = "button";
        again.addEventListener("click", function () {
          box.replaceChildren();
          mount(state);
          var field = box.querySelector("input[type=email]");
          if (field) { field.focus(); }
        });
        typo.appendChild(again);
        thanks.appendChild(typo);
        box.replaceChildren(thanks);
      }
      if (localPreview) { window.setTimeout(done, 400); return; }
      fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email: address,
          locale: locale,
          windows: windows.input.checked,
          android: android.input.checked,
          news: news.input.checked,
          turnstileToken: token,
          website: honeypot.value
        })
      }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (result) {
          if (response.ok && result.ok) { done(); return; }
          var key = result && result.errorKey;
          throw new Error((typeof key === "string" && /^err[A-Z]\w*$/.test(key) && t(key)) || t("errGeneric"));
        });
      }).catch(function (error) {
        say(error && error.message && error.message.indexOf("fetch") === -1 ? error.message : t("errGeneric"));
        submit.disabled = false;
        submit.textContent = t("submit");
        if (widgetId !== undefined && window.turnstile) { try { window.turnstile.reset(widgetId); } catch (e) {} }
        token = "";
      });
    });
  }

  status().then(mount);
})();
