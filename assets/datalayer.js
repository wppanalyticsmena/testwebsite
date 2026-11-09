// Loaded in <head> before the GTM snippet: Consent Mode defaults, then page and user data, before any tag runs.
window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}
(function () {
  function read(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (e) {
      return null;
    }
  }

  gtag("consent", "default", {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });
  var consent = read("demo_consent");
  if (consent && typeof consent === "object") {
    var ads = consent.ads ? "granted" : "denied";
    gtag("consent", "update", {
      analytics_storage: consent.analytics ? "granted" : "denied",
      ad_storage: ads,
      ad_user_data: ads,
      ad_personalization: ads,
    });
  }

  var html = document.documentElement;
  var lang = read("demo_lang") === "ar" ? "ar" : "en";
  html.lang = lang;
  html.dir = lang === "ar" ? "rtl" : "ltr";

  var user = read("demo_user");
  var pageData = {
    page_type: html.getAttribute("data-page") || "other",
    page_language: lang,
    site_environment: "test",
    user_status: user ? "logged_in" : "guest",
  };
  if (user && user.id) pageData.user_id = user.id;
  window.dataLayer.push(pageData);
})();
