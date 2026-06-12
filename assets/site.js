/* Control My Mac — tiny shared script.
   Remembers which audience page the visitor chose (localStorage only,
   this device only). Never force-redirects. */
(function () {
  "use strict";
  var KEY = "cmm-audience";
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
  var SITE_URL = "https://controlmymac.com/";
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
        text: "Open this on your Mac to download the free app",
        url: SITE_URL
      }).catch(function () { /* visitor closed the sheet — fine */ });
    } else {
      navigator.clipboard.writeText(SITE_URL).then(function () {
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
})();
