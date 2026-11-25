// Weergave (licht, donker of automatisch). Staat in de <head>, zodat er bij het openen geen licht scherm flitst.
(function () {
  var K = 'pz-thema';
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function lees() { try { var v = localStorage.getItem(K); return v === 'donker' || v === 'auto' ? v : 'licht'; } catch (e) { return 'licht'; } }
  function pas(v) { var donker = v === 'donker' || (v === 'auto' && mq && mq.matches); document.documentElement.setAttribute('data-thema', donker ? 'donker' : 'licht'); }
  window.THEMA = {
    get: lees,
    zet: function (v) { try { localStorage.setItem(K, v); } catch (e) {} pas(v); }
  };
  pas(lees());
  if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (lees() === 'auto') { pas('auto'); if (window.__herteken) window.__herteken(); } });
})();
