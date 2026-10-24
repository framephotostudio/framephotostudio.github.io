// Face Couture app mode: native tab bar, native save/share, haptics.
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('fc-app');
  var Cap = window.Capacitor || null;
  var P = (Cap && Cap.Plugins) || {};
  var isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());

  function tap(style) { if (window.FCNative) window.FCNative.tap(style); }

  // ---------- bottom tab bar (drives the studio's existing tabs) ----------
  var ICONS = {
    ai: '<path d="M12 4l1.5 3.8L17.3 9.3l-3.8 1.5L12 14.6l-1.5-3.8L6.7 9.3l3.8-1.5z"/><path d="M5 16l.7 1.8 1.8.7-1.8.7L5 21l-.7-1.8-1.8-.7 1.8-.7z"/><path d="M19 15l.6 1.4 1.4.6-1.4.6L19 19l-.6-1.4-1.4-.6 1.4-.6z"/>',
    edit: '<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/><path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    beauty: '<path d="M9 21h6"/><path d="M10 21V11h4v10"/><path d="M10 11l1-6.5c.2-1 1.8-1 2 0l1 6.5"/>',
    frames: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><rect x="7.5" y="7.5" width="9" height="9" rx="1.5"/>',
    formats: '<rect x="3" y="6" width="8" height="12" rx="1.6"/><rect x="13" y="9" width="8" height="6" rx="1.4"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="M16 10.5l5-3v9l-5-3z"/>',
    share: '<path d="M12 15V3.5"/><path d="M7.5 8L12 3.5 16.5 8"/><path d="M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5"/>'
  };
  var LABELS = { edit: 'Studio', beauty: 'Beauty', ai: 'AI', frames: 'Frames', formats: 'Formats', video: 'Video', share: 'Save' };

  function buildTabBar() {
    if (document.getElementById('fcTabBar')) return;
    var src = document.querySelectorAll('nav.tabs button[data-tab]');
    if (!src.length) return;
    var bar = document.createElement('nav');
    bar.id = 'fcTabBar';
    bar.setAttribute('aria-label', 'Studio sections');
    Array.prototype.forEach.call(src, function (b) {
      var t = b.dataset.tab;
      if (!ICONS[t]) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.tab = t;
      btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[t] + '</svg><span>' + LABELS[t] + '</span>';
      btn.addEventListener('click', function () {
        tap('LIGHT');
        b.click();
        if (!inStudio()) { sync(); return; }
        var ws = document.querySelector('.workspace');
        if (ws && !ws.classList.contains('expanded')) { var ex = document.getElementById('expandPhoto'); if (ex) ex.click(); }
        var pnl = document.querySelector('.workspace.expanded .panel');
        if (pnl) { pnl.scrollTo({ top: 0, behavior: 'smooth' }); sync(); return; }
        var panel = document.querySelector('.panel');
        var stage = document.querySelector('.stage');
        var target = (t === 'edit' || !panel) ? (stage || panel) : panel;
        if (target) {
          var head = document.querySelector('header');
          var y = target.getBoundingClientRect().top + window.scrollY - (head ? head.offsetHeight : 0) - 4;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
        sync();
      });
      btn.hidden = b.hidden; if (b.hidden) new MutationObserver(function () { btn.hidden = b.hidden; }).observe(b, { attributes: true, attributeFilter: ['hidden'] });
      bar.appendChild(btn);
    });
    document.body.appendChild(bar);
    sync();
  }
  function sync() {
    var active = document.querySelector('nav.tabs button.active');
    var t = active ? active.dataset.tab : 'edit';
    Array.prototype.forEach.call(document.querySelectorAll('#fcTabBar button'), function (x) {
      x.classList.toggle('on', x.dataset.tab === t);
    });
  }

  // ---------- welcome screen vs. full-screen studio ----------
  function inStudio() { return root.classList.contains('fc-studio'); }
  function enterStudio() {
    if (!inStudio()) root.classList.add('fc-studio');
    var ws = document.querySelector('.workspace');
    var ex = document.getElementById('expandPhoto');
    if (ws && ex && !ws.classList.contains('expanded')) ex.click();
    addNewPhotoButton();
    addToolStrip();
    sync();
  }
  function addNewPhotoButton() {
    if (document.getElementById('fcStudioBar')) return;
    var stage = document.querySelector('.stage');
    if (!stage) return;
    var bar = document.createElement('div');
    bar.id = 'fcStudioBar';
    var logo = document.querySelector('header .logoSvg');
    bar.innerHTML = '<button type="button" class="fcNew">＋ Photo</button>' + (logo ? '<img alt="" src="' + logo.getAttribute('src') + '">' : '') + '<button type="button" class="fcSave">Save</button>';
    bar.querySelector('.fcNew').addEventListener('click', function () { tap('LIGHT'); var f = document.getElementById('file'); if (f) f.click(); });
    bar.querySelector('.fcSave').addEventListener('click', function () {
      tap('MEDIUM');
      var s = document.getElementById('saveBarBtn');
      if (s && document.body.classList.contains('ownPhoto')) s.click();
      else { var q = document.getElementById('quickSave'); if (q) q.click(); }
    });
    stage.insertBefore(bar, stage.firstChild);
  }
  // ---------- quick tools strip: every tool one tap away ----------
  var TOOLS = [
    ['Looks', { tab: 'edit', find: 'Finishes' }], ['Blemish', { tab: 'beauty', group: 'Skin', ctl: 'beauty-blemish' }], ['Smooth skin', { tab: 'beauty', group: 'Skin', ctl: 'beauty-smooth' }],
    ['Lipstick', { tab: 'beauty', group: 'Makeup', ctl: 'beauty-tint' }], ['Gloss', { tab: 'beauty', group: 'Makeup', ctl: 'beauty-gloss' }], ['Lashes', { tab: 'beauty', group: 'Makeup', ctl: 'beauty-lashes' }], ['Liner', { tab: 'beauty', group: 'Makeup', ctl: 'beauty-eyeLiner' }],
    ['Eyeshadow', { tab: 'beauty', group: 'Makeup', ctl: 'beauty-eyeShadow' }], ['Blush', { tab: 'beauty', group: 'Makeup', ctl: 'beauty-blush' }], ['Contour', { tab: 'beauty', group: 'Makeup', ctl: 'beauty-contour' }],
    ['Brows', { tab: 'beauty', group: 'Makeup', ctl: 'beauty-browMakeup' }], ['Eye lift', { tab: 'beauty', group: 'Facial features', ctl: 'beauty-eyeLift' }],
    ['Nose', { tab: 'beauty', group: 'Facial features', ctl: 'beauty-nose' }], ['Hair', { tab: 'beauty', group: 'Hair', ctl: 'beauty-hairShine' }],
    ['Crop', { click: '#quickCrop' }], ['Rotate', { click: '#quickRotate' }], ['Caption', { tab: 'edit', find: 'Add a caption' }]
  ];
  function goTool(t) {
    tap('LIGHT');
    if (t.click) { var c = document.querySelector(t.click); if (c) c.click(); return; }
    var tb = document.querySelector('nav.tabs button[data-tab="' + t.tab + '"]'); if (tb) tb.click();
    if (t.group) { var gb = Array.prototype.find.call(document.querySelectorAll('.beautyGroups button'), function (b) { return b.textContent.trim() === t.group; }); if (gb && !gb.classList.contains('active') && gb.getAttribute('aria-pressed') !== 'true') gb.click(); }
    setTimeout(function () {
      var target = null;
      if (t.ctl) { var inp = document.getElementById(t.ctl); target = inp && (inp.closest('.range') || inp); }
      if (t.find) target = Array.prototype.find.call(document.querySelectorAll('#edit h2,#edit h3,#edit summary'), function (h) { return h.textContent.indexOf(t.find) > -1; });
      if (!target) return;
      if (target.tagName === 'SUMMARY' && target.parentNode && !target.parentNode.open) target.parentNode.open = true;
      var panel = document.querySelector('.workspace.expanded .panel');
      var head = (document.getElementById('fcTools') ? document.getElementById('fcTools').offsetHeight : 0) + (document.querySelector('.editorActions') ? document.querySelector('.editorActions').offsetHeight : 0) + 12;
      if (panel) { var y = target.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop - head; panel.scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); }
      else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.classList.add('fcFlash'); setTimeout(function () { target.classList.remove('fcFlash'); }, 1600);
      sync();
    }, 350);
  }
  function addToolStrip() {
    if (document.getElementById('fcTools')) return;
    var panel = document.querySelector('.panel'); if (!panel) return;
    var strip = document.createElement('div'); strip.id = 'fcTools'; strip.setAttribute('aria-label', 'Quick tools');
    TOOLS.forEach(function (x) { var b = document.createElement('button'); b.type = 'button'; b.textContent = x[0]; if (/^(Lipstick|Gloss|Lashes|Liner|Eyeshadow|Blush|Contour|Brows)$/.test(x[0])) b.dataset.wo = '1'; b.onclick = function () { goTool(x[1]); }; strip.appendChild(b); });
    panel.insertBefore(strip, panel.firstChild);
  }

  function watchStudio() {
    var sample = document.getElementById('heroSample');
    if (sample) sample.addEventListener('click', function () { setTimeout(enterStudio, 50); });
    var check = function () { if (document.body.classList.contains('ownPhoto')) enterStudio(); };
    if (window.MutationObserver) new MutationObserver(check).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    check();
  }


  // ---------- native behaviour: back button, offline notice, outside links, review prompt ----------
  function toastMsg(t) { try { if (typeof window.toast === 'function') window.toast(t); } catch (e) {} }
  function setupNative() {
    if (!isNative) return;
    // Android back button: close an open sheet first, never drop the user out mid-edit
    if (P.App && P.App.addListener) P.App.addListener('backButton', function () {
      var open = document.querySelector('.proSheet.show,.proSheet.open,#photoSheet.show,#cropSheet.show,#cropSheet.open');
      if (open) { var c = open.querySelector('[data-close],.close,button[aria-label*="lose"],#photoSheetDone'); if (c) c.click(); else open.classList.remove('show', 'open'); return; }
      if (inStudio()) { toastMsg('Tap Save to keep your photo. Press back again to leave.'); if (window.__fcBackArm) { P.App.exitApp(); } window.__fcBackArm = true; setTimeout(function () { window.__fcBackArm = false; }, 2500); return; }
      P.App.exitApp();
    });
    // connection notice (beauty tools work offline; AI tools need a connection)
    if (P.Network && P.Network.addListener) P.Network.addListener('networkStatusChange', function (s) {
      root.classList.toggle('fc-offline', !s.connected);
      toastMsg(s.connected ? 'Back online.' : 'You are offline. Looks, beauty tools and saving still work.');
    });
    // links to other sites open in the in-app browser sheet
    document.addEventListener('click', function (ev) {
      var a = ev.target && ev.target.closest && ev.target.closest('a[href^="http"]');
      if (!a || a.hasAttribute('download')) return;
      ev.preventDefault();
      if (P.Browser) P.Browser.open({ url: a.href, presentationStyle: 'popover' }); else window.open(a.href, '_blank');
    }, true);
    // ask for a store rating only after a few successful saves (never gated or rewarded)
    window.addEventListener('fc:saved', function () {
      try {
        var n = +(localStorage.getItem('fc-saves') || 0) + 1; localStorage.setItem('fc-saves', n);
        var asked = localStorage.getItem('fc-review-asked');
        if (n >= 3 && !asked && P.InAppReview && P.InAppReview.requestReview) { localStorage.setItem('fc-review-asked', '1'); setTimeout(function () { P.InAppReview.requestReview(); }, 1500); }
      } catch (e) {}
    });
  }

  function init() {
    setupNative();
    buildTabBar();
    watchStudio();
    var nav = document.querySelector('nav.tabs');
    if (nav && window.MutationObserver) new MutationObserver(sync).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
