/* Control My Mac — tiny shared script.
   Remembers which audience page the visitor chose (localStorage only,
   this device only). Never force-redirects. */
(function () {
  "use strict";
  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };
  var analyticsScript = document.createElement("script");
  analyticsScript.defer = true;
  analyticsScript.src = "/_vercel/insights/script.js";
  document.head.appendChild(analyticsScript);

  var KEY = "cmm-audience";
  var DOWNLOAD_PAGE_URL = "https://controlmymac.com/download";
  var PAGES = {
    "one-hand": { href: "/one-hand", label: "One-finger control" },
    "couch":    { href: "/couch",    label: "Couch mode" },
    "present":  { href: "/present",  label: "Presenting" },
    "pro":      { href: "/pro",      label: "Power-user deck" }
  };

  function get() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function set(v) {
    try {
      if (v === null) { localStorage.removeItem(KEY); }
      else { localStorage.setItem(KEY, v); }
    } catch (e) { /* private mode — fine, just don't remember */ }
  }

  // Visiting a variant page records the choice.
  var audience = document.body.getAttribute("data-audience");
  if (audience && PAGES[audience]) { set(audience); }

  // "Just show me everything" forgets the choice.
  var clears = document.querySelectorAll("[data-clear-audience]");
  for (var i = 0; i < clears.length; i++) {
    clears[i].addEventListener("click", function () { set(null); });
  }

  // Feature demos: hover/focus plays them via CSS; a tap (or Enter/Space)
  // toggles playback so touch-only and keyboard users get the same demos.
  var demoCards = document.querySelectorAll("[data-demo-card]");
  function toggleDemo() {
    var playing = this.classList.toggle("is-playing");
    this.setAttribute("aria-pressed", playing ? "true" : "false");
  }
  for (var d = 0; d < demoCards.length; d++) {
    demoCards[d].addEventListener("click", toggleDemo);
    demoCards[d].addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleDemo.call(this);
      }
    });
  }

  // Platform-aware download CTAs. Default markup is a plain .dmg link,
  // so no JS (or an unrecognised platform) keeps today's behavior.
  // On a non-Mac the primary becomes a hand-off to the visitor's Mac:
  // the share sheet where available (AirDrop / Messages / Mail), else
  // copy-link with a brief inline confirmation. Quiet "[data-dl-alt]"
  // links keep the raw .dmg reachable, and "[data-dl-note]" helper
  // text explains the two-device hand-off.
  var platform =
    (navigator.userAgentData && navigator.userAgentData.platform) ||
    navigator.platform || "";
  // Case-insensitive: Chromium reports "macOS", WebKit "MacIntel".
  // maxTouchPoints guard: iPads masquerade as "MacIntel".
  var isMac = platform.toLowerCase().indexOf("mac") === 0 &&
    navigator.maxTouchPoints <= 1;
  var canShare = typeof navigator.share === "function";
  var canCopy = !!(navigator.clipboard && navigator.clipboard.writeText);
  var dlCtas = document.querySelectorAll("[data-dl-cta]");

  function handoffClick(e) {
    e.preventDefault();
    var el = this;
    if (canShare) {
      navigator.share({
        title: "Control My Mac",
        url: DOWNLOAD_PAGE_URL
      }).catch(function () { /* visitor closed the sheet — fine */ });
    } else {
      navigator.clipboard.writeText(DOWNLOAD_PAGE_URL).then(function () {
        if (el.getAttribute("data-dl-copied")) { return; }
        el.setAttribute("data-dl-copied", "1");
        var label = el.textContent;
        el.textContent = "Link copied — open it on your Mac";
        setTimeout(function () {
          el.textContent = label;
          el.removeAttribute("data-dl-copied");
        }, 2000);
      });
    }
  }

  if (!isMac && (canShare || canCopy)) {
    var mainLabel = canShare ? "Send it to your Mac" : "Copy link for your Mac";
    for (var k = 0; k < dlCtas.length; k++) {
      dlCtas[k].textContent = dlCtas[k].getAttribute("data-dl-label") || mainLabel;
      dlCtas[k].setAttribute("aria-live", "polite"); // announces "Link copied…"
      dlCtas[k].addEventListener("click", handoffClick);
    }
    var dlAlts = document.querySelectorAll("[data-dl-alt]");
    for (var a = 0; a < dlAlts.length; a++) { dlAlts[a].hidden = false; }
    var dlNotes = document.querySelectorAll("[data-dl-note]");
    var noteText = canShare
      ? "You're on your iPhone — AirDrop or message this link to yourself, then open it on your Mac to download."
      : "Copy the link, then open it on your Mac to download the free app.";
    for (var n = 0; n < dlNotes.length; n++) { dlNotes[n].textContent = noteText; }
  }

  // On the selector page, offer a quiet way back to the stored choice.
  var resume = document.querySelector("[data-resume]");
  if (resume) {
    var stored = get();
    var page = stored && PAGES[stored];
    if (page) {
      var link = resume.querySelector("a");
      if (link) {
        link.href = page.href;
        link.textContent = page.label;
        resume.classList.add("show");
      }
    }
  }

  // ------------------------------------------------------------
  // Donate seam. Buttons ship hidden with data-donate-url set to a
  // placeholder; once the attribute holds a real URL they appear.
  // Same pattern as the other unset-URL seams: no dead links, ever.
  // ------------------------------------------------------------
  var donateEls = document.querySelectorAll("[data-donate-url]");
  for (var dn = 0; dn < donateEls.length; dn++) {
    var donateUrl = donateEls[dn].getAttribute("data-donate-url") || "";
    if (/^https?:\/\//.test(donateUrl)) {
      donateEls[dn].setAttribute("href", donateUrl);
      donateEls[dn].setAttribute("target", "_blank");
      donateEls[dn].setAttribute("rel", "noopener");
      donateEls[dn].hidden = false;
    }
  }

  // ------------------------------------------------------------
  // Newsletter opt-in. Everything stays hidden unless GET
  // /api/subscribe says the provider env vars are configured —
  // no dead forms on an unconfigured deploy or local preview.
  // The download itself is never blocked or intercepted: clicking
  // a CTA downloads exactly as before, and a small card simply
  // appears nearby afterwards.
  // ------------------------------------------------------------
  var SUB_KEY = "cmm-subscribed";
  var CONSENT_TEXT = "Occasional emails about updates, deals, and new apps " +
    "from the same developer. No spam, unsubscribe anytime.";

  function hasSubscribed() {
    try { return localStorage.getItem(SUB_KEY) === "1"; } catch (e) { return false; }
  }
  function rememberSubscribed() {
    try { localStorage.setItem(SUB_KEY, "1"); } catch (e) { /* fine */ }
  }
  function looksLikeEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  // Builds one self-contained signup unit ("card" near a CTA, or the
  // quieter footer "row"). All wiring is local to the element.
  function createSignup(kind) {
    var box = document.createElement("div");
    box.className = "signup " + (kind === "card" ? "signup-card" : "signup-row");

    var title = document.createElement("p");
    title.className = "signup-title";
    if (kind === "card") {
      // On a non-Mac the CTA is a hand-off (share/copy), not a download.
      title.textContent = isMac
        ? "While it downloads — want updates?"
        : "While you're here — want updates?";
    } else {
      title.textContent = "Want occasional updates?";
    }
    box.appendChild(title);

    if (kind === "card") {
      var close = document.createElement("button");
      close.type = "button";
      close.className = "signup-close";
      close.setAttribute("aria-label", "Dismiss");
      close.innerHTML = "&times;";
      close.addEventListener("click", function () {
        if (box.parentNode) { box.parentNode.removeChild(box); }
      });
      box.appendChild(close);
    }

    var form = document.createElement("form");
    form.className = "signup-form";
    form.setAttribute("novalidate", "");

    var inputId = "nl-" + Math.random().toString(36).slice(2, 8);
    var label = document.createElement("label");
    label.className = "visually-hidden";
    label.setAttribute("for", inputId);
    label.textContent = "Email address";

    var input = document.createElement("input");
    input.type = "email";
    input.id = inputId;
    input.name = "email";
    input.required = true;
    input.autocomplete = "email";
    input.placeholder = "you@example.com";
    input.className = "signup-input";

    // Honeypot — visually removed, skipped by keyboard and screen
    // readers; only bots fill it. The API silently drops those.
    var pot = document.createElement("input");
    pot.type = "text";
    pot.name = "website";
    pot.tabIndex = -1;
    pot.autocomplete = "off";
    pot.setAttribute("aria-hidden", "true");
    pot.className = "signup-pot";

    var btn = document.createElement("button");
    btn.type = "submit";
    btn.className = "btn btn-primary signup-btn";
    btn.textContent = "Notify me";

    form.appendChild(label);
    form.appendChild(input);
    form.appendChild(pot);
    form.appendChild(btn);
    box.appendChild(form);

    var consent = document.createElement("p");
    consent.className = "signup-consent";
    consent.textContent = CONSENT_TEXT;
    box.appendChild(consent);

    var msg = document.createElement("p");
    msg.className = "signup-msg";
    msg.setAttribute("role", "status");
    msg.hidden = true;
    box.appendChild(msg);

    function showError(text) {
      msg.textContent = text;
      msg.classList.add("is-error");
      msg.hidden = false;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = input.value.trim();
      if (!looksLikeEmail(email)) {
        showError("Please enter a valid email address.");
        return;
      }
      btn.disabled = true;
      btn.textContent = "Adding…";
      fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, website: pot.value })
      }).then(function (r) {
        return r.json();
      }).then(function (data) {
        if (data && data.ok) {
          form.hidden = true;
          consent.hidden = true;
          msg.hidden = true;
          title.textContent = "You're on the list — thanks!";
          rememberSubscribed();
        } else {
          showError((data && data.error) ||
            "Something went wrong — please try again later.");
          btn.disabled = false;
          btn.textContent = "Notify me";
        }
      }).catch(function () {
        showError("Couldn't reach the signup service — please try again later.");
        btn.disabled = false;
        btn.textContent = "Notify me";
      });
    });

    return box;
  }

  // Shows the post-download card near the clicked CTA. Never blocks
  // the click itself (no preventDefault here), shows at most one card.
  function showSignupCard(cta) {
    if (hasSubscribed()) { return; }
    if (document.querySelector(".signup-card")) { return; }
    var card = createSignup("card");
    var anchor;
    if (cta.closest && cta.closest(".nav")) {
      // Nav pill can't host a card; drop it just below the header.
      anchor = document.querySelector(".site-header") || cta;
    } else {
      anchor = (cta.closest && cta.closest(".cta")) || cta;
    }
    if (anchor.insertAdjacentElement) {
      anchor.insertAdjacentElement("afterend", card);
    }
  }

  // Footer row: fill the static slot when a page has one, otherwise
  // append to the footer — every page gets it from this one file.
  function enableSignupUI() {
    if (hasSubscribed()) { return; }
    var slot = document.querySelector("[data-signup-row]");
    if (slot) {
      slot.appendChild(createSignup("row"));
      slot.hidden = false;
    } else {
      var footWrap = document.querySelector(".site-footer .wrap");
      if (footWrap) { footWrap.appendChild(createSignup("row")); }
    }
    for (var c = 0; c < dlCtas.length; c++) {
      dlCtas[c].addEventListener("click", function () {
        showSignupCard(this);
      });
    }
  }

  /* Newsletter signup intentionally disabled for now (hidden everywhere). */
})();
