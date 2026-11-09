// Cookie banner with categories, driving Google Consent Mode v2. A stand-in for a real consent tool (CMP).
(function () {
  "use strict";

  function setConsent(analytics, ads) {
    Demo.save("localStorage", "demo_consent", { analytics: analytics, ads: ads });
    var adState = ads ? "granted" : "denied";
    gtag("consent", "update", {
      analytics_storage: analytics ? "granted" : "denied",
      ad_storage: adState,
      ad_user_data: adState,
      ad_personalization: adState,
    });
    Demo.push({
      event: "consent_update",
      analytics_consent: analytics ? "granted" : "denied",
      ads_consent: adState,
    });
    var banner = document.getElementById("consent");
    if (banner) banner.remove();
  }

  function showBanner() {
    if (document.getElementById("consent")) return;
    var current = Demo.load("localStorage", "demo_consent", null) || {};
    var banner = document.createElement("div");
    banner.id = "consent";
    banner.className = "consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.innerHTML =
      "<p><strong>Cookies on this test site</strong></p>" +
      "<p class='small'>We use analytics and advertising cookies to test tracking. Choose what to allow.</p>" +
      "<div id='consent-prefs' hidden>" +
      "<label class='inline'><input type='checkbox' disabled checked> Necessary (always on)</label>" +
      "<label class='inline'><input type='checkbox' id='consent-analytics'" +
      (current.analytics ? " checked" : "") + "> Analytics</label>" +
      "<label class='inline'><input type='checkbox' id='consent-ads'" +
      (current.ads ? " checked" : "") + "> Advertising</label></div>" +
      "<div class='consent-actions'>" +
      "<button class='button' data-c='all' type='button'>Accept all</button>" +
      "<button class='button secondary' data-c='none' type='button'>Reject all</button>" +
      "<button class='button secondary' data-c='prefs' type='button'>Preferences</button>" +
      "<button class='button secondary' data-c='save' type='button' hidden>Save choices</button></div>";
    banner.addEventListener("click", function (e) {
      var c = e.target.getAttribute && e.target.getAttribute("data-c");
      if (c === "all") setConsent(true, true);
      else if (c === "none") setConsent(false, false);
      else if (c === "prefs") {
        document.getElementById("consent-prefs").hidden = false;
        banner.querySelector("[data-c=save]").hidden = false;
        e.target.hidden = true;
      } else if (c === "save") {
        setConsent(document.getElementById("consent-analytics").checked, document.getElementById("consent-ads").checked);
      }
    });
    document.body.appendChild(banner);
  }

  if (!Demo.load("localStorage", "demo_consent", null)) showBanner();
  document.getElementById("cookie-settings").addEventListener("click", showBanner);
})();
