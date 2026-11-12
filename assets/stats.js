/* Visitor statistics: PostHog EU, cookieless (nothing stored on the visitor's device, so no consent banner).
   Counts page views, page leaves (scroll depth) and clicks on store / download buttons; offer.js adds the
   gift events (gift_open, gift_submit, gift_sent, gift_error). No autocapture, no session replay, no surveys,
   no form contents. The privacy page's "Visitor statistics" item describes exactly this: change both together.
   The project key comes from this script tag's data-key (build.py / the page sets it). */
(function () {
  "use strict";
  var me = document.currentScript;
  var key = me && me.getAttribute("data-key");
  if (!key || !/^phc_\w+$/.test(key)) return;

  // PostHog's own loader stub (posthog.com/docs/libraries/js), unchanged apart from the EU host.
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  posthog.init(key, {
    api_host: "https://eu.i.posthog.com",
    cookieless_mode: "always",        // no cookies, no localStorage/sessionStorage
    persistence: "memory",
    respect_dnt: true,                // Do Not Track: nothing is counted
    autocapture: false,               // only the events named here and in offer.js
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: true,
    disable_surveys: true,
    enable_heatmaps: false,
    capture_dead_clicks: false,
    capture_exceptions: false,
    advanced_disable_flags: true,     // no feature-flag calls
    disable_external_dependency_loading: true,
    person_profiles: "identified_only",
    mask_personal_data_properties: true
  });
  posthog.register({ lang: (document.documentElement.lang || "en").toLowerCase() });

  function kind(a) {
    var h = a.hostname || "";
    if (h === "apps.apple.com" || h === "itunes.apple.com") return "app_store";
    if (h === "play.google.com") return "google_play";
    if (h === "apps.microsoft.com" || h === "www.microsoft.com") return "microsoft_store";
    if (a.hasAttribute("data-dl-cta") || /\.(dmg|zip|exe|msix\w*)$/i.test(a.pathname)) return "mac_download";
    if (a.hasAttribute("data-win-cta")) return "windows_download";
    return "";
  }

  // One listener for every store and download button (capture phase: runs before other click handlers).
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var store = kind(a);
    if (!store) return;
    // Where on the page: deal-bar, header, hero, how, final, footer, pricing ... (first id or class that names it)
    var area = a.closest(".deal-bar, header, footer, .hero, .final, section[id], [id]:not(main)");
    var place = area ? (area.id || String(area.className).split(" ")[0] || area.tagName.toLowerCase()) : "page";
    posthog.capture("store_click", { store: store, place: place },
      { transport: "sendBeacon" }); // still arrives when the link leaves the page
  }, true);
})();
