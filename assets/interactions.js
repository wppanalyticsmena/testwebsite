// Forms, components and other interactions found on client sites. Each push is listed on /tracking-map.html.
// Plain links (outbound, tel:, mailto:, downloads) push nothing on purpose: GTM's click triggers see them itself.
(function () {
  "use strict";

  var push = Demo.push;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function formName(form) {
    return form.getAttribute("data-form-name") || form.id || "unnamed";
  }
  function done(form, messageId) {
    form.hidden = true;
    if (messageId) $("#" + messageId).hidden = false;
  }

  // ---- everywhere ----------------------------------------------------------------------------------

  // form_start: the first time a visitor touches a field in a form (like GA4's own form interaction event).
  var started = {};
  document.addEventListener("focusin", function (e) {
    var form = e.target.closest && e.target.closest("form[data-form-name]");
    if (!form || form.id === "site-search") return;
    var name = formName(form);
    if (started[name]) return;
    started[name] = true;
    push({ event: "form_start", form_name: name, form_id: form.id || undefined });
  });

  $("#newsletter-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var email = e.target.elements.email;
    if (!email.checkValidity()) {
      push({ event: "form_error", form_name: "newsletter", error_fields: ["email"] });
      email.reportValidity();
      return;
    }
    push({ event: "newsletter_signup", form_name: "newsletter", form_location: "footer" });
    done(e.target, "newsletter-done");
  });

  var launcher = $("#chat-launcher");
  launcher.addEventListener("click", function () {
    var panel = $("#chat-panel");
    panel.hidden = !panel.hidden;
    launcher.setAttribute("aria-expanded", String(!panel.hidden));
    push({ event: panel.hidden ? "chat_close" : "chat_open", chat_provider: "demo" });
  });

  document.addEventListener("click", function (e) {
    var share = e.target.closest && e.target.closest("[data-share]");
    if (share) {
      var method = share.getAttribute("data-share");
      push({ event: "share", method: method, content_type: Demo.page, item_id: location.pathname + location.search });
      if (method === "copy_link" && navigator.clipboard) navigator.clipboard.writeText(location.href).catch(function () {});
    }
  });

  // <details> toggle events don't bubble, so listen in the capture phase.
  document.addEventListener(
    "toggle",
    function (e) {
      var d = e.target;
      if (d.tagName === "DETAILS" && d.open && d.hasAttribute("data-accordion")) {
        push({ event: "accordion_open", accordion_name: d.getAttribute("data-accordion"),
          accordion_title: $("summary", d).textContent.trim() });
      }
    },
    true,
  );

  // A third-party form inside an iframe can't be seen by this page's GTM. The iframe tells us by postMessage.
  window.addEventListener("message", function (e) {
    if (e.origin !== location.origin || !e.data || e.data.type !== "demo_iframe_form") return;
    push({ event: "iframe_form_submit", form_name: e.data.form_name, form_location: "iframe" });
    var note = $("#iframe-done");
    if (note) note.hidden = false;
  });

  // ---- page-specific -------------------------------------------------------------------------------

  var pages = {
    contact: function () {
      $("#contact-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var f = e.target.elements;
        // DELIBERATE BAD PRACTICE for the audit to catch: the email address goes into the dataLayer, where any
        // tag can read it. Real sites should not do this (or should hash it for Google's user-provided data).
        push({ event: "generate_lead", form_name: "contact", enquiry_type: f.enquiry.value, lead_email: f.email.value });
        done(e.target, "contact-done");
      });
    },

    forms: function () {
      // Appointment: multi-step form, one event per step.
      var form = $("#appointment-form");
      var steps = $$("[data-step]", form);
      var current = 0;
      function show(i) {
        steps.forEach(function (s, j) { s.hidden = j !== i; });
        current = i;
        $("[data-current]", form).textContent = i + 1;
      }
      function stepValid() {
        var fields = $$("input, select", steps[current]);
        var invalid = fields.filter(function (f) { return !f.checkValidity(); });
        if (invalid.length) {
          push({ event: "form_error", form_name: "appointment", form_step: current + 1,
            error_fields: invalid.map(function (f) { return f.name; }) });
          invalid[0].reportValidity();
        }
        return !invalid.length;
      }
      form.addEventListener("click", function (e) {
        if (e.target.hasAttribute("data-next") && stepValid()) {
          push({ event: "form_step", form_name: "appointment", form_step: current + 2,
            step_name: ["", "branch", "date_time", "contact_details"][current + 2] });
          show(current + 1);
        } else if (e.target.hasAttribute("data-back")) {
          show(current - 1);
        }
      });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!stepValid()) return;
        push({ event: "generate_lead", form_name: "appointment", lead_type: "appointment",
          branch: form.elements.branch.value, service: form.elements.service.value });
        done(form, "appointment-done");
      });

      // Callback: custom validation with visible errors.
      $("#callback-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var f = e.target;
        var errors = [];
        var phone = f.elements.phone.value.replace(/[\s-]/g, "");
        if (!/^\+?\d{9,15}$/.test(phone)) errors.push("phone");
        if (!f.elements.slot.value) errors.push("slot");
        if (!f.elements.agree.checked) errors.push("agree");
        $$(".error", f).forEach(function (el) { el.hidden = errors.indexOf(el.getAttribute("data-for")) === -1; });
        if (errors.length) {
          push({ event: "form_error", form_name: "callback", error_fields: errors });
          return;
        }
        push({ event: "generate_lead", form_name: "callback", lead_type: "callback", time_slot: f.elements.slot.value });
        done(f, "callback-done");
      });

      // Careers: file upload. Nothing is uploaded; only the file type is recorded.
      $("#cv-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var file = e.target.elements.cv.files[0];
        var type = file ? file.name.split(".").pop().toLowerCase() : "none";
        push({ event: "cv_upload", form_name: "careers", position: e.target.elements.position.value, file_type: type });
        done(e.target, "cv-done");
      });
    },

    "form-thanks": function () {
      var form = new URLSearchParams(location.search).get("form") || "a form";
      $("#thanks-detail").textContent = "We received your " + form + " request (not really: this is a test site).";
    },

    interactions: function () {
      $("#cta-main").addEventListener("click", function (e) {
        push({ event: "cta_click", cta_text: e.currentTarget.textContent.trim(), cta_location: "interactions_buttons" });
      });

      $$("[role=tab]").forEach(function (tab) {
        tab.addEventListener("click", function () {
          $$("[role=tab]").forEach(function (t) {
            t.setAttribute("aria-selected", String(t === tab));
            $("#" + t.getAttribute("aria-controls")).hidden = t !== tab;
          });
          push({ event: "tab_view", tab_name: tab.textContent.trim() });
        });
      });

      var slides = $$(".slide");
      var slide = 0;
      $$("[data-slide]").forEach(function (b) {
        b.addEventListener("click", function () {
          slides[slide].hidden = true;
          slide = (slide + +b.getAttribute("data-slide") + slides.length) % slides.length;
          slides[slide].hidden = false;
          push({ event: "carousel_navigate", carousel_name: "offers", slide_number: slide + 1,
            direction: +b.getAttribute("data-slide") > 0 ? "next" : "previous" });
        });
      });

      var dialog = $("#offer-dialog");
      $("#open-modal").addEventListener("click", function () {
        if (dialog.showModal) dialog.showModal();
        else dialog.setAttribute("open", "");
        push({ event: "modal_open", modal_name: "special_offer" });
      });
      dialog.addEventListener("close", function () {
        push({ event: "modal_close", modal_name: "special_offer", modal_action: dialog.returnValue || "dismiss" });
      });

      $("#copy-code").addEventListener("click", function () {
        if (navigator.clipboard) navigator.clipboard.writeText("TEST10").catch(function () {});
        push({ event: "promo_code_copy", coupon: "TEST10" });
        $("#copy-code").textContent = "Copied!";
      });

      $$("[data-rating]").forEach(function (star) {
        star.addEventListener("click", function () {
          var rating = +star.getAttribute("data-rating");
          $$("[data-rating]").forEach(function (s) { s.setAttribute("aria-pressed", String(+s.getAttribute("data-rating") <= rating)); });
          push({ event: "rating_submit", rating: rating, rating_subject: "interactions_page" });
        });
      });

      $("#throw-error").addEventListener("click", function () {
        setTimeout(function () {
          throw new Error("Demo error: this tests GTM's JavaScript Error trigger");
        });
      });

      // Content that appears after load, to test Element Visibility with "observe DOM changes".
      setTimeout(function () {
        $("#lazy-slot").innerHTML =
          "<div id='lazy-offer' class='note'>Late-loading offer: this box appeared 3 seconds after the page loaded.</div>";
      }, 3000);
    },

    spa: function () {
      var VIEWS = {
        overview: ["Overview", "This page changes content without reloading, like a React or Angular site. " +
          "GTM won't see a normal page view; use the History Change trigger or the virtual_page_view event."],
        pricing: ["Pricing", "Starter AED 99 / month. Pro AED 299 / month. (Not real.)"],
        faq: ["FAQ", "Q: Does GTM see this view change? A: Only through History Change or a dataLayer event."],
        "get-started": ["Get started", "Click “Start trial” to send a sign-up style event from inside the app."],
      };
      function render(view, isNav) {
        if (!VIEWS[view]) view = "overview";
        $$("[data-view]").forEach(function (a) {
          a.setAttribute("aria-current", a.getAttribute("data-view") === view ? "page" : "false");
        });
        $("#spa-view").innerHTML = "<h2>" + VIEWS[view][0] + "</h2><p>" + VIEWS[view][1] + "</p>" +
          (view === "get-started" ? "<button class='button' id='start-trial'>Start trial</button>" : "");
        document.title = VIEWS[view][0] + " · Single-page app · Demo Store (test site)";
        if (isNav) {
          push({ event: "virtual_page_view", page_path: location.pathname + location.search,
            page_title: document.title, spa_view: view });
        }
        var trial = $("#start-trial");
        if (trial) trial.addEventListener("click", function () { push({ event: "trial_start", plan: "starter" }); });
      }
      $("#spa-nav").addEventListener("click", function (e) {
        var a = e.target.closest("[data-view]");
        if (!a) return;
        e.preventDefault();
        history.pushState({}, "", "?view=" + a.getAttribute("data-view"));
        render(a.getAttribute("data-view"), true);
      });
      window.addEventListener("popstate", function () {
        render(new URLSearchParams(location.search).get("view"), true);
      });
      render(new URLSearchParams(location.search).get("view"), false);
    },
  };

  if (pages[Demo.page]) pages[Demo.page]();
})();
