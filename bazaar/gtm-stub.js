(function () {
  var m = document.currentScript && document.currentScript.src.match(/id=([A-Z0-9-]+)/);
  var id = m ? m[1] : 'GTM-UNKNOWN';
  window.google_tag_manager = window.google_tag_manager || {};
  window.google_tag_manager[id] = { dataLayer: { name: 'dataLayer' } };
  var dl = (window.dataLayer = window.dataLayer || []);
  var push = function (e) { dl.push({ event: e }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { push('gtm.dom'); });
  else push('gtm.dom');
  if (document.readyState !== 'complete') window.addEventListener('load', function () { push('gtm.load'); });
  else push('gtm.load');
})();