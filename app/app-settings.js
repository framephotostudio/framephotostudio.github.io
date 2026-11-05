// Face Couture app: settings screen, look/season settings from the Face Couture server, and privacy-safe counts.
// Version 1.0 is completely free: there are no purchases, no promo codes and no hidden modes in the app.
(function () {
  'use strict';
  var CFG = window.FC_CONFIG || {}, API = window.FCApi;
  var $ = function (s) { return document.querySelector(s); };
  function toast(t) { try { window.toast(t); } catch (e) {} }
  function tap(s) { try { window.FCNative && window.FCNative.tap(s); } catch (e) {} }

  // ---------- settings from the server: hidden looks, season dates, tools switched off ----------
  function applyConfig(c) {
    if (!c) return;
    try { FRAME_PRO.enabled = false; } catch (e) {} // every studio feature is free in the app
    try { (c.looks.hidden || []).forEach(function (k) { document.querySelectorAll('[data-vibe="' + k + '"],[data-look="' + k + '"],[data-key="' + k + '"]').forEach(function (el) { el.hidden = true; el.style.display = 'none'; }); }); } catch (e) {}
    try {
      var S = window.__seasonal && window.__seasonal.SEASONS;
      if (S) S.forEach(function (s) { var o = c.seasons[s.id]; if (!o) return; s.from = o.from.split('-').map(Number); s.to = o.to.split('-').map(Number); if (o.enabled === false) { s.from = [2, 30]; s.to = [2, 30]; } });
    } catch (e) {}
    if (c.flags && c.flags.showQuiz === false) document.querySelectorAll('.quizLink').forEach(function (q) { q.hidden = true; });
  }
  function refresh() {
    if (!API || !API.url) return Promise.resolve();
    return API.api('/api/config').then(applyConfig).catch(function () {});
  }

  // ---------- settings screen ----------
  function row(id, label, sub) {
    return '<button type="button" class="fcRow" id="' + id + '"><span><b>' + label + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span><i aria-hidden="true">›</i></button>';
  }
  function openSettings() {
    tap('LIGHT');
    var s = $('#fcSettings');
    if (!s) { s = document.createElement('div'); s.id = 'fcSettings'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-labelledby', 'fcSetTitle'); document.body.appendChild(s); }
    s.innerHTML = '<div class="fcSetTop"><button type="button" class="fcSetDone" id="fcSetClose">Done</button><h2 id="fcSetTitle">Settings</h2></div>' +
      '<div class="fcSetBody">' +
      '<div class="fcSetGroup"><div class="fcSetHead">Privacy</div>' +
      '<p class="fcSetText">Beauty tools, Looks and saving work on your iPhone, even offline. A photo is sent only when you choose an AI feature and agree, just for that one edit. We do not keep it, and it is never used for training.</p></div>' +
      '<div class="fcSetGroup">' + row('fcSetPrivacy', 'Privacy policy') + row('fcSetTerms', 'Terms of use') + row('fcSetDelete', 'Delete my data', 'Removes your AI history from our server') + '</div>' +
      '<div class="fcSetGroup">' + row('fcSetSupport', 'Contact support', CFG.supportEmail || 'hello@facecouture.app') + '</div>' +
      '<p class="fcSetVer">Face Couture by Always Luxe · Version ' + (CFG.version || '1.0.0') + '</p>' +
      ((API && API.device && API.device()) ? '<p class="fcSetVer fcSetId">Device ID (for support): ' + String(API.device()).replace(/[<>&"]/g, '') + '</p>' : '') + '</div>';
    s.hidden = false; document.documentElement.classList.add('fcSetOpen');
    $('#fcSetClose').onclick = closeSettings;
    $('#fcSetPrivacy').onclick = function () { closeSettings(); window.__fcLegalFromSettings = true; openLegal('privacy'); };
    $('#fcSetTerms').onclick = function () { closeSettings(); window.__fcLegalFromSettings = true; openLegal('terms'); };
    $('#fcSetSupport').onclick = function () { location.href = 'mailto:' + (CFG.supportEmail || 'hello@facecouture.app') + '?subject=Face%20Couture%20app'; };
    $('#fcSetDelete').onclick = function () {
      if (!confirm('Delete the AI history linked to this iPhone from our server? Your photos are never stored by us, so there are none to delete.')) return;
      if (!API || !API.url) { toast('Nothing is stored for this iPhone.'); return; }
      API.api('/api/delete-my-data', {}).then(function (r) { toast(r.message || 'Deleted.'); try { localStorage.removeItem('fc-token'); localStorage.removeItem('fc-device'); localStorage.removeItem('fc-ga-cid'); } catch (e) {} closeSettings(); })
        .catch(function (e) { var m = (e && e.message) || ''; toast(/fetch|network|load failed/i.test(m) || !navigator.onLine ? 'You\'re offline. Connect to the internet and try again.' : (m || 'Could not delete right now. Please try again.')); });
    };
  }
  function closeSettings() { var s = $('#fcSettings'); if (s) s.hidden = true; document.documentElement.classList.remove('fcSetOpen'); }
  // Privacy policy and Terms: the app's own pages, bundled inside the app (work offline), shown full screen
  function openLegal(kind) {
    tap('LIGHT');
    var v = $('#fcLegal');
    if (!v) { v = document.createElement('div'); v.id = 'fcLegal'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); document.body.appendChild(v); }
    var title = { privacy: 'Privacy Policy', terms: 'Terms of Use', 'delete-my-data': 'Delete my data', support: 'Support' }[kind] || '';
    v.innerHTML = '<div class="fcSetTop"><button type="button" class="fcSetDone" id="fcLegalDone">Done</button><h2>' + title + '</h2></div><iframe title="' + title + '" src="' + kind + '.html"></iframe>';
    v.hidden = false; document.documentElement.classList.add('fcSetOpen');
    var fromSettings = !!(window.__fcLegalFromSettings); window.__fcLegalFromSettings = false;
    $('#fcLegalDone').textContent = fromSettings ? 'Back' : 'Done';
    $('#fcLegalDone').onclick = function () { v.hidden = true; document.documentElement.classList.remove('fcSetOpen'); if (fromSettings) openSettings(); };
    var fr = v.querySelector('iframe');
    fr.onload = function () {
      try {
        var d = fr.contentDocument; d.documentElement.classList.add('in-app');
        d.addEventListener('click', function (ev) {
          var a = ev.target && ev.target.closest && ev.target.closest('a[href]'); if (!a) return;
          var h = a.getAttribute('href') || '';
          if (/^https?:/.test(h)) { ev.preventDefault(); var P = window.Capacitor && Capacitor.Plugins; if (P && P.Browser) P.Browser.open({ url: a.href }); else window.open(a.href, '_blank'); }
          else if (/^mailto:/.test(h)) { ev.preventDefault(); location.href = h; }
        }, true);
      } catch (e) {}
    };
  }
  // the studio's own Privacy and Terms links (and plain links to these pages) open the same in-app pages
  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target : null; if (!t) return;
    var l = t.closest('.legalLink[data-legal]');
    if (l) { ev.preventDefault(); ev.stopPropagation(); openLegal(l.getAttribute('data-legal')); return; }
    var a = t.closest('a[href]'); if (!a) return;
    var m = /^(?:\.\/|\/|https:\/\/facecouture\.app\/)?(privacy|terms|support|delete-my-data)\.html(?:[?#].*)?$/.exec(a.getAttribute('href') || '');
    if (m) { ev.preventDefault(); ev.stopPropagation(); openLegal(m[1]); }
  }, true);
  window.FCSettings = { open: openSettings, close: closeSettings };

  function addSettingsButtons() {
    var mk = function () { var b = document.createElement('button'); b.type = 'button'; b.className = 'fcGear'; b.setAttribute('aria-label', 'Settings'); b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'; b.onclick = openSettings; return b; };
    var h = document.querySelector('header'); if (h && !h.querySelector('.fcGear')) h.appendChild(mk());
    var obs = new MutationObserver(function () { var sb = $('#fcStudioBar'); if (sb && !sb.querySelector('.fcGear')) sb.insertBefore(mk(), sb.children[1] || null); });
    obs.observe(document.body, { childList: true, subtree: false }); var st = document.querySelector('.stage'); if (st) obs.observe(st, { childList: true });
  }

  // ---------- events worth counting (no photos, no faces, no names) ----------
  function trackStudio() {
    if (!API) return;
    API.track('open');
    new MutationObserver(function () { if (document.body.classList.contains('ownPhoto') && !window.__fcPhotoTracked) { window.__fcPhotoTracked = true; API.track('photo_chosen'); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    try { var _av = applyVibe; applyVibe = function (k) { API.track('look_applied', { look: k }); return _av.apply(this, arguments); }; } catch (e) {}
    window.addEventListener('fc:saved', function () { API.track('save'); });
  }

  function init() {
    addSettingsButtons();
    // AI Glow, AI Looks, outfits, backgrounds and accessories live in the studio's AI Studio; the old AI tab is not used
    document.documentElement.classList.add('fc-noaitab');
    try { proUnlocked = true; } catch (e) {}
    refresh().then(trackStudio);
    setInterval(refresh, 10 * 60 * 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
