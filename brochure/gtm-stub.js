(function () {
  var src = (document.currentScript && document.currentScript.src) || '';
  var q = function (k) { var m = src.match(new RegExp('[?&]' + k + '=([^&]+)')); return m ? decodeURIComponent(m[1]) : ''; };
  var id = q('id') || 'GTM-UNKNOWN', ga = q('ga'), px = q('px') ? q('px').split(',') : [];
  var respect = q('consent') !== 'ignore', gaBroken = q('broken') === 'ga';
  window.google_tag_manager = window.google_tag_manager || {};
  window.google_tag_manager[id] = { dataLayer: { name: 'dataLayer' } };
  if (ga) window.google_tag_manager[ga] = {};
  var dl = (window.dataLayer = window.dataLayer || []);
  var mode = false, analytics = !respect, ads = !respect;
  var applyConsent = function (e) {
    if (e && typeof e === 'object' && e[0] === 'consent' && e[2]) {
      mode = true;
      if (e[2].analytics_storage) analytics = respect ? e[2].analytics_storage === 'granted' : true;
      if (e[2].ad_storage) ads = respect ? e[2].ad_storage === 'granted' : true;
      return e[1];
    }
    return '';
  };
  // Every hit carries a sequence number, like GA4's _s, so two identical events are two requests.
  var send = function (url) { window.__hits = (window.__hits || 0) + 1; var i = new Image(); i.src = location.origin + url + '&_s=' + window.__hits; };
  var ga4 = function (en) {
    if (!ga || gaBroken) return;
    if (respect && !analytics && !mode) return;
    var gcs = mode ? 'G1' + (ads ? 1 : 0) + (analytics ? 1 : 0) : '';
    send('/g/collect?v=2&tid=' + ga + '&en=' + encodeURIComponent(en) + (gcs ? '&gcs=' + gcs : '') +
      '&dl=' + encodeURIComponent(location.href));
  };
  var PIXELS = { meta: '/px/facebook.com/tr?id=000000000&ev=', tiktok: '/px/analytics.tiktok.com/api/v2/pixel?event=' };
  var pixels = function (ev) {
    if (respect && !ads) return;
    px.forEach(function (p) { if (PIXELS[p]) send(PIXELS[p] + encodeURIComponent(ev)); });
  };
  var isEvent = function (e) { return e && typeof e === 'object' && typeof e.event === 'string' && e.event.indexOf('gtm.') !== 0; };
  for (var i = 0; i < dl.length; i++) applyConsent(dl[i]);
  ga4('page_view');
  pixels('PageView');
  for (var j = 0; j < dl.length; j++) if (isEvent(dl[j])) { ga4(dl[j].event); pixels(dl[j].event); }
  var before = dl.push;
  dl.push = function () {
    for (var k = 0; k < arguments.length; k++) {
      var e = arguments[k];
      var hadAds = ads;
      if (applyConsent(e) === 'update' && ads && !hadAds) pixels('PageView');  // consent given: ad tags start
      if (isEvent(e)) { ga4(e.event); pixels(e.event); }
    }
    return before.apply(dl, arguments);
  };
  var push = function (e) { dl.push({ event: e }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { push('gtm.dom'); });
  else push('gtm.dom');
  if (document.readyState !== 'complete') window.addEventListener('load', function () { push('gtm.load'); });
  else push('gtm.load');
})();