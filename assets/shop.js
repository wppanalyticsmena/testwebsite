// Demo Store shop: standard GA4 ecommerce events in the dataLayer. Nothing is sold.
(function () {
  "use strict";

  var CURRENCY = "AED";
  var VAT = 0.05;
  var SHIPPING = { Standard: 15, Express: 35 };
  var COUPONS = { TEST10: 0.1, WELCOME20: 0.2 };
  var PRODUCTS = [
    { id: "SKU-001", name: "Demo Mug", category: "Kitchen", price: 45 },
    { id: "SKU-002", name: "Demo T-Shirt", category: "Clothing", price: 89, variants: ["S", "M", "L", "XL"] },
    { id: "SKU-003", name: "Demo Notebook", category: "Stationery", price: 25 },
    { id: "SKU-004", name: "Demo Headphones", category: "Electronics", price: 349, variants: ["Black", "White"] },
    { id: "SKU-005", name: "Demo Water Bottle", category: "Kitchen", price: 65 },
    { id: "SKU-006", name: "Demo Hoodie", category: "Clothing", price: 179, variants: ["S", "M", "L"] },
    { id: "SKU-007", name: "Demo Backpack", category: "Accessories", price: 229 },
    { id: "SKU-008", name: "Demo Smart Watch", category: "Electronics", price: 899, variants: ["Silver", "Black"] },
  ];
  var PROMOS = [
    { promotion_id: "PROMO-WINTER", promotion_name: "Winter sale", creative_name: "hero_banner",
      creative_slot: "hero_1", product: "SKU-006", headline: "Winter sale: hoodies from AED 179" },
    { promotion_id: "PROMO-AUDIO", promotion_name: "Audio week", creative_name: "hero_banner",
      creative_slot: "hero_2", product: "SKU-004", headline: "Audio week: new headphones" },
  ];

  var esc = Demo.esc;
  var main = document.getElementById("app");

  // ---- helpers -------------------------------------------------------------------------------------

  function ecommerce(event, data) {
    Demo.push({ ecommerce: null }); // clear the previous ecommerce object, as Google recommends
    Demo.push({ event: event, ecommerce: data });
  }
  function product(id) {
    return PRODUCTS.filter(function (p) { return p.id === id; })[0];
  }
  function item(p, quantity, extra) {
    var it = { item_id: p.id, item_name: p.name, item_brand: "Demo", item_category: p.category, price: p.price,
      quantity: quantity };
    for (var k in extra || {}) if (extra[k] !== undefined && extra[k] !== null) it[k] = extra[k];
    return it;
  }
  function money(n) {
    return CURRENCY + " " + n.toFixed(2);
  }
  function round(n) {
    return Math.round(n * 100) / 100;
  }
  function initial(p) {
    return p.name.split(" ").slice(-1)[0][0];
  }
  function card(p, list, index) {
    return (
      "<li class='card' data-category='" + esc(p.category) + "'><div class='thumb'>" + initial(p) + "</div>" +
      "<h2>" + esc(p.name) + "</h2><p class='muted'>" + esc(p.category) + "</p><p>" + money(p.price) + "</p>" +
      "<a class='button' data-select='" + index + "' href='/product.html?id=" + p.id + "&list=" + list + "'>View</a></li>"
    );
  }
  function trackList(listId, listName, products) {
    var items = products.map(function (p, i) {
      return item(p, 1, { index: i, item_list_id: listId, item_list_name: listName });
    });
    ecommerce("view_item_list", { item_list_id: listId, item_list_name: listName, items: items });
    main.querySelectorAll("a[data-select]").forEach(function (a) {
      a.addEventListener("click", function () {
        var it = items[+a.getAttribute("data-select")];
        ecommerce("select_item", { item_list_id: listId, item_list_name: listName, items: [it] });
      });
    });
  }

  // ---- cart ----------------------------------------------------------------------------------------

  function cart() {
    return Demo.load("localStorage", "demo_cart", []);
  }
  function setCart(lines) {
    Demo.save("localStorage", "demo_cart", lines);
    updateCartCount();
  }
  function cartItems() {
    return cart()
      .map(function (l) {
        var p = product(l.id);
        return p ? item(p, l.qty, { item_variant: l.variant }) : null;
      })
      .filter(Boolean);
  }
  function coupon() {
    return Demo.load("localStorage", "demo_coupon", null);
  }
  function totals(items) {
    var subtotal = items.reduce(function (s, it) { return s + it.price * it.quantity; }, 0);
    var code = coupon();
    var discount = code && COUPONS[code] ? round(subtotal * COUPONS[code]) : 0;
    var value = round(subtotal - discount);
    return { subtotal: subtotal, discount: discount, value: value, tax: round(value * VAT), coupon: code };
  }
  function updateCartCount() {
    document.getElementById("cart-count").textContent = cart().reduce(function (n, l) { return n + l.qty; }, 0);
  }
  function changeQty(id, variant, delta) {
    var lines = cart();
    var line = lines.filter(function (l) { return l.id === id && l.variant === variant; })[0];
    if (line) line.qty += delta;
    else if (delta > 0) lines.push({ id: id, variant: variant, qty: delta });
    setCart(lines.filter(function (l) { return l.qty > 0; }));
    var p = product(id);
    var it = item(p, Math.abs(delta), { item_variant: variant });
    ecommerce(delta > 0 ? "add_to_cart" : "remove_from_cart", {
      currency: CURRENCY, value: round(p.price * Math.abs(delta)), items: [it],
    });
  }

  // ---- pages ---------------------------------------------------------------------------------------

  var pages = {
    home: function () {
      var categories = PRODUCTS.map(function (p) { return p.category; })
        .filter(function (c, i, all) { return all.indexOf(c) === i; });
      main.innerHTML =
        "<section class='promos'>" +
        PROMOS.map(function (pr, i) {
          return "<a class='promo promo-" + i + "' data-promo='" + i + "' href='/product.html?id=" + pr.product +
            "&promo=" + pr.promotion_id + "'><span>" + esc(pr.headline) + "</span><span class='button small'>Shop now</span></a>";
        }).join("") +
        "</section><h1>All products</h1><div class='chips' role='group' aria-label='Filter by category'>" +
        "<button class='chip' aria-pressed='true' data-filter='All'>All</button>" +
        categories.map(function (c) {
          return "<button class='chip' aria-pressed='false' data-filter='" + esc(c) + "'>" + esc(c) + "</button>";
        }).join("") +
        "</div><ul class='grid'>" + PRODUCTS.map(function (p, i) { return card(p, "home", i); }).join("") + "</ul>";

      PROMOS.forEach(function (pr) {
        ecommerce("view_promotion", promoData(pr));
      });
      main.querySelectorAll("[data-promo]").forEach(function (a) {
        a.addEventListener("click", function () {
          ecommerce("select_promotion", promoData(PROMOS[+a.getAttribute("data-promo")]));
        });
      });
      trackList("home", "Home", PRODUCTS);
      main.querySelectorAll("[data-filter]").forEach(function (b) {
        b.addEventListener("click", function () {
          var value = b.getAttribute("data-filter");
          main.querySelectorAll("[data-filter]").forEach(function (o) { o.setAttribute("aria-pressed", o === b); });
          main.querySelectorAll(".card").forEach(function (c) {
            c.hidden = value !== "All" && c.getAttribute("data-category") !== value;
          });
          Demo.push({ event: "filter_apply", filter_type: "category", filter_value: value });
        });
      });

      function promoData(pr) {
        var p = product(pr.product);
        return {
          promotion_id: pr.promotion_id, promotion_name: pr.promotion_name, creative_name: pr.creative_name,
          creative_slot: pr.creative_slot, items: [item(p, 1)],
        };
      }
    },

    search: function () {
      var q = (new URLSearchParams(location.search).get("q") || "").trim();
      var results = PRODUCTS.filter(function (p) {
        return q && (p.name + " " + p.category).toLowerCase().indexOf(q.toLowerCase()) !== -1;
      });
      document.querySelector("#site-search input").value = q;
      main.innerHTML =
        "<h1>Search results</h1><p class='muted'>" + results.length + " results for “" + esc(q) + "”." +
        (results.length ? "" : " Try “demo”, “clothing” or “watch”.") + "</p>" +
        "<ul class='grid'>" + results.map(function (p, i) { return card(p, "search", i); }).join("") + "</ul>";
      Demo.push({ event: "search", search_term: q, search_results: results.length });
      if (results.length) trackList("search_results", "Search results", results);
    },

    product: function () {
      var params = new URLSearchParams(location.search);
      var p = product(params.get("id")) || PRODUCTS[0];
      var listId = params.get("list");
      main.innerHTML =
        "<a href='/index.html' class='muted'>&larr; All products</a><div class='product'><div class='thumb big'>" +
        initial(p) + "</div><div><h1>" + esc(p.name) + "</h1><p class='muted'>" + esc(p.category) + "</p>" +
        "<p class='price'>" + money(p.price) + "</p>" +
        (p.variants
          ? "<label>Option <select id='variant'>" + p.variants.map(function (v) {
              return "<option>" + esc(v) + "</option>";
            }).join("") + "</select></label>"
          : "") +
        "<label>Quantity <input id='qty' type='number' min='1' max='9' value='1'></label>" +
        "<button id='add' class='button'>Add to cart</button> " +
        "<button id='wishlist' class='button secondary'>Add to wishlist</button>" +
        "<p id='added' class='note' hidden>Added. <a href='/cart.html'>View cart</a></p>" +
        "<div class='share'>Share: <button class='link' data-share='whatsapp'>WhatsApp</button> " +
        "<button class='link' data-share='x'>X</button> <button class='link' data-share='copy_link'>Copy link</button></div>" +
        "<details data-accordion='product_details'><summary>Product details</summary><p>Made for testing. " +
        "Ships in 1–3 days.</p></details>" +
        "<details data-accordion='reviews'><summary>Reviews (2)</summary><p>★★★★☆ “Tracks well.”</p>" +
        "<p>★★★★★ “Fires exactly once.”</p></details></div></div>";
      var variantEl = document.getElementById("variant");
      var variant = function () { return variantEl ? variantEl.value : undefined; };
      ecommerce("view_item", {
        currency: CURRENCY, value: p.price,
        items: [item(p, 1, { item_variant: variant(), item_list_id: listId || undefined })],
      });
      if (variantEl) {
        variantEl.addEventListener("change", function () {
          Demo.push({ event: "select_variant", item_id: p.id, item_variant: variant() });
        });
      }
      document.getElementById("add").addEventListener("click", function () {
        var qty = Math.max(1, Math.min(9, parseInt(document.getElementById("qty").value, 10) || 1));
        changeQty(p.id, variant(), qty);
        document.getElementById("added").hidden = false;
      });
      document.getElementById("wishlist").addEventListener("click", function (e) {
        ecommerce("add_to_wishlist", { currency: CURRENCY, value: p.price, items: [item(p, 1, { item_variant: variant() })] });
        e.target.textContent = "In your wishlist";
        e.target.disabled = true;
      });
    },

    cart: function () {
      var items = cartItems();
      if (!items.length) {
        main.innerHTML = "<h1>Your cart</h1><p>Your cart is empty. <a href='/index.html'>Browse products</a></p>";
        return;
      }
      var t = totals(items);
      main.innerHTML =
        "<h1>Your cart</h1><table><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th></th></tr></thead><tbody>" +
        items.map(function (it, i) {
          return "<tr><td>" + esc(it.item_name) + (it.item_variant ? " <span class='muted'>(" + esc(it.item_variant) +
            ")</span>" : "") + "</td><td><button class='qty' data-i='" + i + "' data-d='-1' aria-label='One less'>−</button> " +
            it.quantity + " <button class='qty' data-i='" + i + "' data-d='1' aria-label='One more'>+</button></td><td>" +
            money(it.price * it.quantity) + "</td><td><button class='link' data-remove='" + i + "'>Remove</button></td></tr>";
        }).join("") +
        "</tbody></table><form id='coupon-form' class='inline-form' data-form-name='coupon'>" +
        "<input name='code' placeholder='Coupon code (try TEST10)' aria-label='Coupon code' value='" + esc(t.coupon || "") +
        "'><button class='button small secondary'>Apply</button></form><p id='coupon-msg' class='small'></p>" +
        "<p>Subtotal: " + money(t.subtotal) + (t.discount ? "<br>Discount (" + esc(t.coupon) + "): −" + money(t.discount) : "") +
        "</p><p class='price'>Total: " + money(t.value) + " <span class='small muted'>+ VAT and shipping</span></p>" +
        "<a class='button' href='/checkout.html'>Checkout</a>";
      ecommerce("view_cart", { currency: CURRENCY, value: t.value, coupon: t.coupon || undefined, items: items });
      main.querySelectorAll("[data-d]").forEach(function (b) {
        b.addEventListener("click", function () {
          var it = items[+b.getAttribute("data-i")];
          changeQty(it.item_id, it.item_variant, +b.getAttribute("data-d"));
          pages.cart();
        });
      });
      main.querySelectorAll("[data-remove]").forEach(function (b) {
        b.addEventListener("click", function () {
          var it = items[+b.getAttribute("data-remove")];
          changeQty(it.item_id, it.item_variant, -it.quantity);
          pages.cart();
        });
      });
      document.getElementById("coupon-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var code = e.target.elements.code.value.trim().toUpperCase();
        var valid = Boolean(COUPONS[code]);
        Demo.push({ event: "coupon_apply", coupon: code, coupon_status: valid ? "valid" : "invalid" });
        if (valid) {
          Demo.save("localStorage", "demo_coupon", code);
          pages.cart();
        } else {
          document.getElementById("coupon-msg").textContent = "That code isn't valid. Try TEST10 or WELCOME20.";
        }
      });
    },

    checkout: function () {
      var items = cartItems();
      if (!items.length) {
        location.href = "/cart.html";
        return;
      }
      var t = totals(items);
      main.innerHTML =
        "<h1>Checkout</h1><p class='note'>Test site: use made-up details. No payment is taken.</p>" +
        "<p class='steps'>1. Shipping → 2. Payment</p>" +
        "<form id='shipping-form' class='form' data-form-name='checkout_shipping'>" +
        "<label>Full name <input required name='name' autocomplete='off'></label>" +
        "<label>Email <input required type='email' name='email' autocomplete='off'></label>" +
        "<label>Mobile <input required type='tel' name='mobile' autocomplete='off'></label>" +
        "<label>City <select required name='city'><option value=''>Choose…</option><option>Dubai</option>" +
        "<option>Abu Dhabi</option><option>Riyadh</option><option>Doha</option></select></label>" +
        "<fieldset><legend>Delivery</legend>" +
        Object.keys(SHIPPING).map(function (k, i) {
          return "<label class='inline'><input type='radio' name='tier' value='" + k + "'" + (i ? "" : " checked") +
            "> " + k + " (" + money(SHIPPING[k]) + ")</label>";
        }).join("") +
        "</fieldset><button class='button'>Continue to payment</button></form>" +
        "<form id='payment-form' class='form' data-form-name='checkout_payment' hidden>" +
        "<fieldset><legend>Payment</legend>" +
        ["Credit card", "Apple Pay", "Cash on delivery"].map(function (m, i) {
          return "<label class='inline'><input type='radio' name='payment' value='" + m + "'" + (i ? "" : " checked") +
            "> " + m + "</label>";
        }).join("") +
        "</fieldset><p id='order-summary'></p><button class='button'>Place order</button></form>";
      ecommerce("begin_checkout", { currency: CURRENCY, value: t.value, coupon: t.coupon || undefined, items: items });

      var tier;
      document.getElementById("shipping-form").addEventListener("submit", function (e) {
        e.preventDefault();
        tier = e.target.elements.tier.value;
        ecommerce("add_shipping_info", {
          currency: CURRENCY, value: t.value, coupon: t.coupon || undefined, shipping_tier: tier, items: items,
        });
        e.target.hidden = true;
        document.getElementById("payment-form").hidden = false;
        document.getElementById("order-summary").innerHTML =
          "Items: " + money(t.value) + "<br>VAT (5%): " + money(t.tax) + "<br>Delivery: " + money(SHIPPING[tier]) +
          "<br><strong>Total: " + money(t.value + t.tax + SHIPPING[tier]) + "</strong>";
      });
      document.getElementById("payment-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var payment = e.target.elements.payment.value;
        ecommerce("add_payment_info", {
          currency: CURRENCY, value: t.value, coupon: t.coupon || undefined, payment_type: payment, items: items,
        });
        Demo.save("sessionStorage", "demo_last_order", {
          transaction_id: "T-" + Date.now().toString(36).toUpperCase(),
          value: t.value, tax: t.tax, shipping: SHIPPING[tier], currency: CURRENCY, coupon: t.coupon,
          shipping_tier: tier, payment_type: payment, items: items, tracked: false,
        });
        setCart([]);
        Demo.save("localStorage", "demo_coupon", null);
        location.href = "/thank-you.html";
      });
    },

    "thank-you": function () {
      var order = Demo.load("sessionStorage", "demo_last_order", null);
      if (!order) {
        main.innerHTML = "<h1>Thank you</h1><p>No recent order. <a href='/index.html'>Back to the shop</a></p>";
        return;
      }
      main.innerHTML =
        "<h1>Thank you!</h1><p>Order <strong>" + esc(order.transaction_id) + "</strong> for " +
        money(order.value + order.tax + order.shipping) + " was placed. (Not really: this is a test site.)</p>" +
        "<p class='small muted'>Reload this page: the purchase is not sent twice.</p>" +
        "<a class='button' href='/index.html'>Back to the shop</a>";
      if (!order.tracked) {
        ecommerce("purchase", {
          transaction_id: order.transaction_id, value: order.value, tax: order.tax, shipping: order.shipping,
          currency: order.currency, coupon: order.coupon || undefined, items: order.items,
        });
        order.tracked = true;
        Demo.save("sessionStorage", "demo_last_order", order);
        var orders = Demo.load("localStorage", "demo_orders", []);
        orders.unshift({ transaction_id: order.transaction_id, value: order.value, tax: order.tax,
          shipping: order.shipping, currency: order.currency, items: order.items, refunded: false });
        Demo.save("localStorage", "demo_orders", orders.slice(0, 10));
      }
    },

    account: function () {
      var user = Demo.load("localStorage", "demo_user", null);
      if (!user) {
        main.innerHTML =
          "<h1>Account</h1><p class='note'>Test site: use made-up details. Nothing is stored on a server.</p>" +
          "<div class='two-col'><form id='login-form' class='form' data-form-name='login'><h2>Sign in</h2>" +
          "<label>Email <input required type='email' name='email' autocomplete='off'></label>" +
          "<label>Password <input required type='password' name='password' autocomplete='off'></label>" +
          "<button class='button'>Sign in</button> " +
          "<button type='button' class='button secondary' id='google-login'>Continue with Google (fake)</button></form>" +
          "<form id='signup-form' class='form' data-form-name='sign_up'><h2>Create account</h2>" +
          "<label>Name <input required name='name' autocomplete='off'></label>" +
          "<label>Email <input required type='email' name='email' autocomplete='off'></label>" +
          "<label>Password <input required type='password' name='password' minlength='6' autocomplete='off'></label>" +
          "<label class='inline'><input type='checkbox' name='marketing'> Send me offers</label>" +
          "<label class='inline'><input type='checkbox' name='terms' required> I accept the terms</label>" +
          "<button class='button'>Create account</button></form></div>";
        var signIn = function (method, event) {
          var newUser = { id: "U-" + Math.random().toString(36).slice(2, 10).toUpperCase() };
          Demo.save("localStorage", "demo_user", newUser);
          Demo.push({ event: event, method: method });
          Demo.push({ event: "user_data_ready", user_id: newUser.id, user_status: "logged_in" });
          pages.account();
        };
        document.getElementById("login-form").addEventListener("submit", function (e) {
          e.preventDefault();
          signIn("email", "login");
        });
        document.getElementById("google-login").addEventListener("click", function () {
          signIn("google", "login");
        });
        document.getElementById("signup-form").addEventListener("submit", function (e) {
          e.preventDefault();
          signIn("email", "sign_up");
        });
        return;
      }
      var orders = Demo.load("localStorage", "demo_orders", []);
      main.innerHTML =
        "<h1>Account</h1><p>Signed in as test user <strong>" + esc(user.id) + "</strong>. " +
        "<button id='logout' class='link'>Sign out</button></p><h2>Your orders</h2>" +
        (orders.length
          ? "<table><thead><tr><th>Order</th><th>Value</th><th></th></tr></thead><tbody>" +
            orders.map(function (o, i) {
              return "<tr><td>" + esc(o.transaction_id) + "</td><td>" + money(o.value) + "</td><td>" +
                (o.refunded ? "Refunded" : "<button class='link' data-refund='" + i + "'>Request refund</button>") +
                "</td></tr>";
            }).join("") + "</tbody></table>"
          : "<p class='muted'>No orders yet. Place one in the shop and it will appear here.</p>");
      document.getElementById("logout").addEventListener("click", function () {
        Demo.save("localStorage", "demo_user", null);
        Demo.push({ event: "logout" });
        pages.account();
      });
      main.querySelectorAll("[data-refund]").forEach(function (b) {
        b.addEventListener("click", function () {
          var o = orders[+b.getAttribute("data-refund")];
          ecommerce("refund", { transaction_id: o.transaction_id, value: o.value, tax: o.tax, shipping: o.shipping,
            currency: o.currency, items: o.items });
          o.refunded = true;
          Demo.save("localStorage", "demo_orders", orders);
          pages.account();
        });
      });
    },
  };

  updateCartCount();
  if (main && pages[Demo.page]) pages[Demo.page]();
})();
