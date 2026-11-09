# Demo Store (test website)

A fake shop we own, built to test Google Tag Manager and GA4 tracking end to end. It has the elements tracking
usually has to cover on client sites: ecommerce, many kinds of forms, links, components, video, a single-page
app section, consent and a 404 page. Nothing is sold; forms take made-up details only.

It loads the internal sandbox container **GTM-NXT4LB98**. Plain HTML, CSS and JavaScript, with no build step.
Search engines are told not to index it (`robots.txt` and a `noindex` tag on every page).

## See the dataLayer

Every page has a **dataLayer** button (bottom left). It lists every push as it happens, keeps history across
pages in the same tab (so you still see the purchase after the redirect to the thank-you page), and can hide GTM's
own `gtm.*` events. It only reads the dataLayer and never changes it, so it doesn't affect GTM.

The **Tracking map** page (`/tracking-map.html`) lists every element, the event it sends and the GTM trigger to use.

## Pages

| Page | What's on it |
|---|---|
| `/index.html` | Promotion banners, category filter, product grid |
| `/search.html?q=` | Search results (header search box submits here) |
| `/product.html?id=` | Variants, quantity, add to cart, wishlist, share, accordions |
| `/cart.html` | Quantity +/−, remove, coupon codes `TEST10` / `WELCOME20` |
| `/checkout.html` | Two steps: shipping (delivery tier) then payment |
| `/thank-you.html` | Purchase (sent once per order, not on reload) |
| `/account.html` | Sign in, create account, sign out, order history, refunds |
| `/forms.html` | Normal-submit form, multi-step form, validation errors, file upload, iframe form |
| `/form-thanks.html` | Thank-you page for the normal-submit form |
| `/interactions.html` | Buttons, every link type, FAQ, tabs, carousel, pop-up, copy code, rating, YouTube, JS error, late-loading content, long scroll |
| `/spa.html` | Content that changes without a reload (history API) |
| `/contact.html` | Contact form, phone, email, WhatsApp, map links |
| `/tracking-map.html` | The full list of events and triggers |
| any other URL | `404.html` (page_type `error_404`) |

On every page: header search, newsletter form, footer links (phone, email, WhatsApp, PDF, social), a fake chat
widget, an English/Arabic switch (sets `page_language` and right-to-left layout), and the cookie banner.

## Consent

Consent Mode v2 defaults are set to denied before GTM loads. The banner offers Accept all, Reject all and
Preferences (Analytics and Advertising separately). To see data in GA4 Realtime or DebugView, accept Analytics
first: with consent denied, Google tags only send cookieless pings.

## Deliberate mistakes

These exist so we know exactly what an audit should find:

- **Site:** the contact form puts the visitor's email address in the dataLayer (`lead_email`).
- **GTM:** added in the container itself while setting it up.

## Hosting

Vercel: import this repository as a new project, framework preset **Other**, no build command, output directory
the repository root. Vercel serves `404.html` for unknown URLs automatically. Then add your domain under
**Settings → Domains**.

Local: run `python -m http.server 8100` in this folder and open http://127.0.0.1:8100. Pages use absolute paths
(`/assets/...`), so open them through a server, not as files.

## Files

- `assets/datalayer.js`: runs before GTM (consent defaults, page and user data)
- `assets/layout.js`: header, footer, shared helpers
- `assets/consent.js`: cookie banner
- `assets/shop.js`: ecommerce pages and account
- `assets/interactions.js`: forms, components, single-page app, contact
- `assets/dlviewer.js`: the on-page dataLayer viewer
- `embed/iframe-form.html`: stand-in third-party form, loaded in an iframe
