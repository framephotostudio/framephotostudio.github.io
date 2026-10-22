// TEST BUILDS ONLY (FC_PLAN_DEMO=1): walks through the subscription screens on a simulator/emulator
// with a simulated server and store, so nothing is charged and no real AI look is made.
(function () {
  'use strict';
  var CFG = { pro: { paywallFrom: '2026-11-21', enabled: true, trialDays: 7, priceMonth: '$8.99', priceYear: '$36.99', entitlement: 'pro',
    products: { yearly: 'fc_pro_yearly', monthly: 'fc_pro_monthly' },
    topups: { fc_ai_20: { looks: 20, price: '$4.99' }, fc_ai_50: { looks: 50, price: '$7.99', badge: 'Best value' } } },
    tools: { glam: true }, seasons: {}, looks: { hidden: [] }, flags: {},
    allowances: { launch: { perDay: 2, perMonth: 10 }, free: { perDay: 0, perMonth: 0 }, trial: { total: 2 }, paid: { perDay: 20, perMonth: 20 } } };
  function me(tier, total, credits) {
    credits = credits || 0;
    return { tier: tier, paywall: tier !== 'launch', credits: credits, allowance: tier === 'trial' ? { total: 2 } : tier === 'launch' ? { perDay: 2, perMonth: 10 } : { perMonth: 20 },
      left: { today: total, month: total, plan: total - credits, credits: credits, total: total }, pro: CFG.pro };
  }
  var state = { me: me('launch', 2), ai: { status: 503, body: { error: 'AI looks are busy right now, try the on-device version.', code: 'ceiling', fallback: 'on_device' } } };
  window.__planDemo = state;
  window.FCPlanTestStore = {
    offerings: function () { return Promise.resolve({ yearly: { identifier: '$rc_annual', product: { identifier: 'fc_pro_yearly', priceString: '$36.99', price: 36.99, currencyCode: 'USD' } },
      monthly: { identifier: '$rc_monthly', product: { identifier: 'fc_pro_monthly', priceString: '$8.99', price: 8.99, currencyCode: 'USD' } } }); },
    topups: function () { return Promise.resolve({ fc_ai_20: { identifier: 'fc_ai_20', priceString: '$4.99' }, fc_ai_50: { identifier: 'fc_ai_50', priceString: '$7.99' } }); },
    buy: function () { return new Promise(function (r) { setTimeout(r, 400); }); },
    buyProduct: function () { return new Promise(function (r) { setTimeout(r, 400); }); },
    restore: function () { return Promise.resolve(); }
  };
  var realFetch = window.fetch.bind(window);
  function json(status, body) { return Promise.resolve(new Response(JSON.stringify(body), { status: status, headers: { 'content-type': 'application/json' } })); }
  window.fetch = function (u, o) {
    var s = String(u && u.url || u), m = s.match(/\/api\/([a-z/]+)/);
    if (!m) return realFetch(u, o);
    var p = m[1];
    if (p === 'hello') return json(200, { token: 'demo.ios.1.s', device: 'demo-device' });
    if (p === 'config') return json(200, CFG);
    if (p === 'me' || p === 'sync') return json(200, state.me);
    if (p === 'ai') { if (!state.aiOk) return json(state.ai.status, state.ai.body); var im = (typeof originalPhoto !== 'undefined') && originalPhoto, c = document.createElement('canvas'); c.width = im.naturalWidth || im.width; c.height = im.naturalHeight || im.height; c.getContext('2d').drawImage(im, 0, 0); return json(200, { image: c.toDataURL('image/jpeg', .92) }); }
    return json(200, { ok: true });
  };
  function log(t) { console.log('[plandemo] ' + t); var d = document.getElementById('planDemoTag'); if (d) d.textContent = t; }
  function q(s) { return document.querySelector(s); }
  function photo() {
    // the site's own sample portrait (always available offline in the app)
    var b = q('#heroSample'); if (b) { b.click(); log('sample photo loaded'); } else log('no sample button');
  }
  function luxe() { var l = q('#luxe'); if (l) l.scrollIntoView({ block: 'center' }); }
  var steps = [
    [4, function () { window.scrollTo(0, 0); var w = q('.workspace.expanded .panel'); if (w) w.scrollTop = 0; log('0 studio with Rotate / Crop / Auto crop'); }],
    [16, function () { luxe(); window.FCPlan.refresh(); log('A launch counter'); }],
    [32, function () { state.me = me('free', 0); window.FCPlan.refresh().then(function () { window.FCPlan.openPaywall('demo'); }); log('B paywall yearly'); }],
    [46, function () { var b = q('[data-plan="monthly"]'); b && b.click(); log('C paywall monthly'); }],
    [60, function () { var x = q('.fcpX'); x && x.click(); state.me = me('paid', 0); window.FCPlan.refresh().then(function () { window.FCPlan.openTopups('demo'); }); log('D top-ups'); }],
    [74, function () { var x = q('.fcpX'); x && x.click(); state.me = me('paid', 12); luxe(); var c = q('#luxeConsent'); if (c && !c.checked) c.click();
      var b = q('[data-luxe="soft"]'); b && b.click(); log('E busy'); }],
    [94, function () { var b = q('#luxeDev'); b && b.click(); log('F on-device applied'); }],
    [106, function () { state.aiOk = true; luxe(); var b = q('[data-luxe="soft"]'); b && b.click(); log('G AI result with before & after buttons'); }],
    [140, function () { var b = q('#luxeBAPhoto'); b && b.click(); log('H before & after photo'); }]
  ];
  // slow simulators paint late: load the sample first, and start the clock only once the studio is on screen
  function waitFor(test, cb) { var t = setInterval(function () { try { if (test()) { clearInterval(t); cb(); } } catch (e) {} }, 500); }
  waitFor(function () { var h = q('#heroSample'); return h && h.offsetHeight > 0; }, function () {
    setTimeout(function () {
      photo();
      waitFor(function () { var r = q('#quickRotate'); return r && r.offsetHeight > 0 && typeof originalPhoto !== 'undefined' && originalPhoto; }, function () {
        log('studio ready');
        steps.forEach(function (s) { setTimeout(function () { try { s[1](); } catch (e) { log('step error ' + e.message); } }, s[0] * 1000); });
      });
    }, 1500);
  });
  window.addEventListener('error', function (e) { console.log('[plandemo] PAGE ERROR ' + e.message); });
})();
