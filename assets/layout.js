// Shared helpers, header and footer. Loaded first at the end of <body> on every page.
(function () {
  "use strict";

  var Demo = (window.Demo = {
    load: function (store, key, fallback) {
      try {
        var raw = window[store].getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    save: function (store, key, value) {
      try {
        if (value === null) window[store].removeItem(key);
        else window[store].setItem(key, JSON.stringify(value));
      } catch (e) {}
    },
    push: function (obj) {
      window.dataLayer.push(obj);
    },
    esc: function (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    },
    page: document.documentElement.getAttribute("data-page"),
  });

  var NAV = [
    ["/index.html", "Shop"],
    ["/forms.html", "Forms"],
    ["/interactions.html", "Clicks & components"],
    ["/spa.html", "Single-page app"],
    ["/contact.html", "Contact"],
    ["/account.html", "Account"],
    ["/tracking-map.html", "Tracking map"],
  ];
  var path = location.pathname === "/" ? "/index.html" : location.pathname;
  var lang = document.documentElement.lang;

  document.body.insertAdjacentHTML(
    "afterbegin",
    '<div class="testbar">Test site for tracking checks. Not a real shop: nothing is sold. ' +
      '<button id="lang-toggle" class="link light" type="button">' +
      (lang === "ar" ? "English" : "العربية") +
      "</button></div>" +
      '<header class="site-header"><div class="nav">' +
      '<a class="logo" href="/index.html">Demo Store</a>' +
      '<form class="search" id="site-search" action="/search.html" method="get" role="search">' +
      '<input name="q" type="search" placeholder="Search products" aria-label="Search products">' +
      '<button class="button small">Search</button></form>' +
      '<a class="cart-link" href="/cart.html">Cart (<span id="cart-count">0</span>)</a></div>' +
      '<nav class="subnav" aria-label="Sections">' +
      NAV.map(function (n) {
        return '<a href="' + n[0] + '"' + (n[0] === path ? ' aria-current="page"' : "") + ">" + n[1] + "</a>";
      }).join("") +
      "</nav></header>",
  );

  document.body.insertAdjacentHTML(
    "beforeend",
    '<footer class="site-footer"><div class="footer-grid">' +
      '<div><h3>Newsletter</h3><form id="newsletter-form" class="inline-form" data-form-name="newsletter" novalidate>' +
      '<input type="email" name="email" placeholder="you@example.com" aria-label="Email" autocomplete="off" required>' +
      '<button class="button small">Subscribe</button></form>' +
      '<p id="newsletter-done" class="small" hidden>Subscribed (not really).</p></div>' +
      '<div><h3>Contact</h3><ul class="plain">' +
      '<li><a href="tel:+971000000000">Call +971 00 000 0000</a></li>' +
      '<li><a href="mailto:hello@example.com">hello@example.com</a></li>' +
      '<li><a href="https://wa.me/?text=Hello%20Demo%20Store" target="_blank" rel="noopener">WhatsApp us</a></li>' +
      '<li><a href="/files/demo-brochure.pdf">Download brochure (PDF)</a></li></ul></div>' +
      '<div><h3>Follow</h3><ul class="plain">' +
      '<li><a href="https://www.instagram.com/" target="_blank" rel="noopener">Instagram</a></li>' +
      '<li><a href="https://www.linkedin.com/" target="_blank" rel="noopener">LinkedIn</a></li>' +
      '<li><a href="https://x.com/" target="_blank" rel="noopener">X</a></li></ul></div>' +
      '<div><h3>About</h3><p class="small">Demo Store is a test site used to check Google Tag Manager and GA4 ' +
      'tracking.</p><button id="cookie-settings" class="link" type="button">Cookie settings</button></div>' +
      "</div></footer>" +
      '<button id="chat-launcher" class="chat-launcher" type="button" aria-expanded="false">Chat</button>' +
      '<div id="chat-panel" class="chat-panel" hidden><p><strong>Demo chat</strong></p>' +
      '<p class="small">This is a fake chat widget for testing clicks.</p></div>',
  );

  document.getElementById("lang-toggle").addEventListener("click", function () {
    var next = lang === "ar" ? "en" : "ar";
    Demo.push({ event: "language_change", language_from: lang, language_to: next });
    Demo.save("localStorage", "demo_lang", next);
    setTimeout(function () {
      location.reload();
    }, 150);
  });
})();
