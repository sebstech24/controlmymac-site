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

  // Showcase reel: a real pause/play button (WCAG 2.2.2) — hover/focus
  // pause stays as a bonus, this is the persistent mechanism.
  var marqueeToggle = document.querySelector("[data-marquee-toggle]");
  var marquee = document.querySelector(".marquee");
  if (marqueeToggle && marquee) {
    marqueeToggle.addEventListener("click", function () {
      var paused = marquee.classList.toggle("is-paused");
      marqueeToggle.setAttribute("aria-pressed", paused ? "true" : "false");
    });
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
