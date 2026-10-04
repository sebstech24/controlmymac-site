/* Press kit page: the "Copy" buttons under the ready-to-copy descriptions. */
(function () {
  "use strict";
  var buttons = document.querySelectorAll("[data-copy]");
  var status = document.getElementById("pk-status");

  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  function done(btn, ok) {
    var label = btn.getAttribute("data-label") || "Copy";
    btn.textContent = ok ? "Copied" : "Select and copy";
    btn.classList.toggle("is-done", ok);
    if (status) { status.textContent = ok ? "Copied to the clipboard." : "Copying failed. Select the text and copy it."; }
    setTimeout(function () {
      btn.textContent = label;
      btn.classList.remove("is-done");
    }, 2000);
  }

  for (var i = 0; i < buttons.length; i++) {
    (function (btn) {
      btn.setAttribute("data-label", btn.textContent);
      btn.addEventListener("click", function () {
        var source = document.getElementById(btn.getAttribute("data-copy"));
        if (!source) { return; }
        var text = source.textContent.replace(/\s+/g, " ").trim();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(
            function () { done(btn, true); },
            function () { done(btn, fallbackCopy(text)); }
          );
        } else {
          done(btn, fallbackCopy(text));
        }
      });
    })(buttons[i]);
  }
})();
