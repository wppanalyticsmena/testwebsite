// On-page dataLayer viewer for testing. It only reads window.dataLayer (polling); it never changes
// dataLayer.push, so it can't interfere with GTM. History is kept across pages in this tab (sessionStorage),
// so you can still see a purchase after the redirect to the thank-you page.
// Its elements carry data-dl-viewer: exclude them in GTM click triggers if they add noise.
(function () {
  "use strict";

  var KEY = "demo_dl_history";
  var MAX = 300;
  var history = Demo.load("sessionStorage", KEY, []);
  var page = location.pathname + location.search;
  var seen = 0;
  var prefs = Demo.load("sessionStorage", "demo_dl_prefs", { open: false, hideGtm: true, thisPage: false });

  function clean(v, depth, stack) {
    if (v === undefined) return undefined;
    if (typeof v === "function") return "[function]";
    if (v === null || typeof v !== "object") return v;
    if (typeof Element !== "undefined" && v instanceof Element) {
      var cls = typeof v.className === "string" && v.className.trim() ? "." + v.className.trim().split(/\s+/).join(".") : "";
      return "<" + v.tagName.toLowerCase() + (v.id ? "#" + v.id : "") + cls + ">";
    }
    if (v === window || v === document) return "[window]";
    if (stack.indexOf(v) !== -1 || depth > 6) return "[…]";
    stack.push(v);
    var out;
    if (Array.isArray(v) || Object.prototype.toString.call(v) === "[object Arguments]") {
      out = Array.prototype.map.call(v, function (x) { return clean(x, depth + 1, stack); });
    } else {
      out = {};
      Object.keys(v).forEach(function (k) {
        var c = clean(v[k], depth + 1, stack);
        if (c !== undefined) out[k] = c;
      });
    }
    stack.pop();
    return out;
  }

  function label(entry) {
    if (Object.prototype.toString.call(entry) === "[object Arguments]") {
      return "gtag('" + entry[0] + "'" + (typeof entry[1] === "string" ? ", '" + entry[1] + "'" : "") + ")";
    }
    return entry && entry.event ? entry.event : "data only (no event)";
  }

  function capture() {
    var dl = window.dataLayer || [];
    if (dl.length === seen) return false;
    for (; seen < dl.length; seen++) {
      var entry = dl[seen];
      var data;
      try {
        data = JSON.stringify(clean(entry, 0, []), null, 2);
      } catch (e) {
        data = "[could not display]";
      }
      history.push({ page: page, time: new Date().toLocaleTimeString(), label: label(entry), data: data });
    }
    if (history.length > MAX) history = history.slice(-MAX);
    Demo.save("sessionStorage", KEY, history);
    return true;
  }

  var root = document.createElement("div");
  root.setAttribute("data-dl-viewer", "");
  root.innerHTML =
    "<button class='dl-toggle' type='button' data-dl-viewer>dataLayer <span data-count>0</span></button>" +
    "<section class='dl-panel' data-dl-viewer hidden aria-label='dataLayer viewer'>" +
    "<div class='dl-head'><strong>dataLayer</strong>" +
    "<label><input type='checkbox' data-pref='hideGtm'> Hide gtm.* events</label>" +
    "<label><input type='checkbox' data-pref='thisPage'> This page only</label>" +
    "<button type='button' class='link' data-act='copy'>Copy</button>" +
    "<button type='button' class='link' data-act='clear'>Clear</button>" +
    "<button type='button' class='link' data-act='close' aria-label='Close'>✕</button></div>" +
    "<ol class='dl-list' reversed></ol></section>";
  document.body.appendChild(root);
  var panel = root.querySelector(".dl-panel");
  var list = root.querySelector(".dl-list");
  var count = root.querySelector("[data-count]");

  function visible() {
    return history.filter(function (h) {
      if (prefs.hideGtm && /^gtm\./.test(h.label)) return false;
      if (prefs.thisPage && h.page !== page) return false;
      return true;
    });
  }

  function render() {
    var rows = visible();
    count.textContent = rows.length;
    if (panel.hidden) return;
    list.textContent = "";
    rows.slice().reverse().forEach(function (h) {
      var li = document.createElement("li");
      var details = document.createElement("details");
      var summary = document.createElement("summary");
      var name = document.createElement("strong");
      name.textContent = h.label;
      var meta = document.createElement("span");
      meta.className = "dl-meta";
      meta.textContent = " " + h.time + (h.page !== page ? " · " + h.page : "");
      summary.appendChild(name);
      summary.appendChild(meta);
      var pre = document.createElement("pre");
      pre.textContent = h.data;
      details.appendChild(summary);
      details.appendChild(pre);
      li.appendChild(details);
      list.appendChild(li);
    });
  }

  function setOpen(open) {
    prefs.open = open;
    panel.hidden = !open;
    Demo.save("sessionStorage", "demo_dl_prefs", prefs);
    render();
  }

  root.querySelectorAll("[data-pref]").forEach(function (box) {
    var key = box.getAttribute("data-pref");
    box.checked = prefs[key];
    box.addEventListener("change", function () {
      prefs[key] = box.checked;
      Demo.save("sessionStorage", "demo_dl_prefs", prefs);
      render();
    });
  });
  root.querySelector(".dl-toggle").addEventListener("click", function () { setOpen(panel.hidden); });
  root.querySelector("[data-act=close]").addEventListener("click", function () { setOpen(false); });
  root.querySelector("[data-act=clear]").addEventListener("click", function () {
    history = [];
    Demo.save("sessionStorage", KEY, history);
    render();
  });
  root.querySelector("[data-act=copy]").addEventListener("click", function (e) {
    var text = visible().map(function (h) { return "// " + h.label + " · " + h.page + "\n" + h.data; }).join("\n\n");
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function () {});
    e.target.textContent = "Copied";
    setTimeout(function () { e.target.textContent = "Copy"; }, 1200);
  });

  capture();
  setOpen(prefs.open);
  setInterval(function () {
    if (capture()) render();
  }, 300);
})();
