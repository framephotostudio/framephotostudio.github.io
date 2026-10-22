// Face Couture app: Face Couture Pro subscription + AI look top-up packs (App Store / Google Play through RevenueCat).
// - The paywall only exists in the app (never on the website) and only after the owner's paywall date (pro.paywallFrom).
// - On-device looks are unlimited for everyone; Pro is about AI Luxe Looks (3 in the 7-day trial, 20 a month after).
// - AI looks are counted on the server; after any purchase or restore the server is synced at once.
(function () {
  'use strict';
  var CFG = window.FC_CONFIG || {}, API = window.FCApi, Cap = window.Capacitor, P = (Cap && Cap.Plugins) || {};
  var isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  var RC = P.Purchases, platform = (API && API.platform) || 'web';
  var rcKey = isNative ? (platform === 'ios' ? CFG.revenueCatIOS : CFG.revenueCatAndroid) : '';
  var DEF = { priceYear: '$36.99', priceMonth: '$8.99', trialDays: 7, products: { yearly: 'fc_pro_yearly', monthly: 'fc_pro_monthly' },
              topups: { fc_ai_20: { looks: 20, price: '$4.99' }, fc_ai_40: { looks: 40, price: '$8.99', badge: 'Best value' } }, entitlement: 'pro' };
  var st = { cfg: null, me: null, ready: false, pkgs: null, tops: null, sel: 'yearly', busy: false };
  var store = window.FCPlanTestStore || null; // test hook (local tests only)
  function T(n, p) { try { window.fcTrack && window.fcTrack(n, p); } catch (e) {} try { API && API.track && API.track(n === 'paywall_seen' || n === 'trial_started' ? n : 'paywall_seen'); } catch (e) {} }
  function toast(t) { try { window.toast(t); } catch (e) {} }
  function tap(s) { try { window.FCNative && window.FCNative.tap(s); } catch (e) {} }
  function pro() { return Object.assign({}, DEF, (st.cfg && st.cfg.pro) || {}); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(price) { var m = String(price || '').replace(/[^0-9.,]/g, '').replace(',', '.'); return parseFloat(m) || 0; }
  function perMonth(yearPkg, fallback) {
    var p = yearPkg && yearPkg.product, v = p && p.price ? p.price / 12 : num(fallback) / 12;
    if (!v) return '';
    try { if (p && p.currencyCode) return new Intl.NumberFormat(undefined, { style: 'currency', currency: p.currencyCode }).format(Math.round(v * 100) / 100); } catch (e) {}
    return '$' + (Math.round(v * 100) / 100).toFixed(2);
  }

  // ---------- server state ----------
  function publish(me) { st.me = me; try { window.dispatchEvent(new CustomEvent('fc:plan', { detail: me })); } catch (e) {} }
  function refresh() {
    if (!API || !API.url) return Promise.resolve(null);
    return API.api('/api/config').then(function (c) { st.cfg = c; return API.api('/api/me'); }).then(function (m) { publish(m); return m; }).catch(function () { return null; });
  }
  function sync() { return API.api('/api/sync', {}).then(function (m) { publish(m); return m; }).catch(function () { return refresh(); }); }

  // ---------- store ----------
  function storeReady() { return !!(store || (RC && rcKey)); }
  function initStore() {
    if (store || !RC || !rcKey) return Promise.resolve();
    return RC.configure({ apiKey: rcKey, appUserID: API.device() || undefined }).then(function () {
      RC.addCustomerInfoUpdateListener && RC.addCustomerInfoUpdateListener(function () { sync(); });
      st.ready = true;
    }).catch(function () {});
  }
  function loadPackages() {
    if (st.pkgs) return Promise.resolve(st.pkgs);
    if (store) return store.offerings().then(function (o) { st.pkgs = o; return o; });
    if (!RC || !rcKey) return Promise.resolve(null);
    return RC.getOfferings().then(function (o) {
      var cur = o.current || {}, all = cur.availablePackages || [];
      var by = function (re) { return all.filter(function (p) { return re.test(p.identifier) || re.test((p.product || {}).identifier || ''); })[0]; };
      st.pkgs = { yearly: cur.annual || by(/annual|year/i), monthly: cur.monthly || by(/month/i) }; return st.pkgs;
    }).catch(function () { return null; });
  }
  function loadTopups() {
    if (st.tops) return Promise.resolve(st.tops);
    var ids = Object.keys(pro().topups);
    if (store) return store.topups(ids).then(function (t) { st.tops = t; return t; });
    if (!RC || !rcKey) return Promise.resolve(null);
    return RC.getProducts({ productIdentifiers: ids, type: 'NON_SUBSCRIPTION' }).then(function (r) {
      var m = {}; (r.products || []).forEach(function (p) { m[p.identifier] = p; }); st.tops = m; return m;
    }).catch(function () { return null; });
  }
  function cancelled(e) { return e && (e.userCancelled || /cancel/i.test(e.message || e.code || '')); }
  function buyPlan(which) {
    if (st.busy) return; tap('MEDIUM');
    if (!storeReady()) { toast('Subscriptions open soon.'); return; }
    st.busy = true; setBusy(true);
    loadPackages().then(function (p) {
      var pkg = p && p[which]; if (!pkg) throw new Error('unavailable');
      return store ? store.buy(pkg) : RC.purchasePackage({ aPackage: pkg });
    }).then(function () { return sync(); }).then(function (m) {
      T(which === 'yearly' ? 'trial_started' : 'subscribe_monthly', { plan: which });
      close(); toast(m && m.tier === 'trial' ? 'Welcome to Face Couture Pro. Your 7 days free have started.' : 'Welcome to Face Couture Pro.');
    }).catch(function (e) { if (!cancelled(e)) toast(e && e.message === 'unavailable' ? 'This plan is not available right now. Please try again later.' : 'The purchase did not go through. You were not charged.'); })
      .then(function () { st.busy = false; setBusy(false); });
  }
  function buyTopup(id) {
    if (st.busy) return; tap('MEDIUM');
    if (!storeReady()) { toast('Extra AI looks open soon.'); return; }
    st.busy = true; setBusy(true);
    loadTopups().then(function (t) {
      var prod = t && t[id]; if (!prod) throw new Error('unavailable');
      return store ? store.buyProduct(prod) : RC.purchaseStoreProduct({ product: prod });
    }).then(function () { return sync(); }).then(function () {
      T('topup_bought', { pack: id }); close(); toast(pro().topups[id].looks + ' AI looks added. Enjoy!');
    }).catch(function (e) { if (!cancelled(e)) toast(e && e.message === 'unavailable' ? 'This pack is not available right now. Please try again later.' : 'The purchase did not go through. You were not charged.'); })
      .then(function () { st.busy = false; setBusy(false); });
  }
  function restore() {
    if (!storeReady()) { toast('Restore works once subscriptions are open.'); return; }
    (store ? store.restore() : RC.restorePurchases()).then(function () { return sync(); }).then(function (m) {
      toast(m && (m.tier === 'paid' || m.tier === 'trial') ? 'Face Couture Pro restored.' : (m && m.credits ? 'Your extra AI looks are restored.' : 'No previous purchase was found for this account.'));
    }).catch(function () { toast('Could not reach the store. Please try again.'); });
  }
  function manage() {
    var url = platform === 'ios' ? 'https://apps.apple.com/account/subscriptions' : 'https://play.google.com/store/account/subscriptions';
    if (P.Browser) P.Browser.open({ url: url }); else window.open(url, '_blank');
  }
  function legal(kind) { close(); var l = document.querySelector('.legalLink[data-legal="' + kind + '"]'); if (l) l.click(); else window.open('https://facecouture.app/' + kind + '.html', '_blank'); }

  // ---------- sheets ----------
  var sheet = null;
  function mount(html, cls) {
    if (!sheet) { sheet = document.createElement('div'); sheet.id = 'fcPlan'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); document.body.appendChild(sheet); }
    sheet.className = 'fcPlan ' + (cls || ''); sheet.innerHTML = html; sheet.hidden = false; document.documentElement.classList.add('fcPlanOpen');
    var x = sheet.querySelector('.fcpX'); if (x) x.onclick = close;
    sheet.onclick = function (e) { if (e.target === sheet) close(); };
  }
  function close() { if (sheet) { sheet.hidden = true; sheet.innerHTML = ''; } document.documentElement.classList.remove('fcPlanOpen'); }
  function setBusy(on) { if (!sheet) return; sheet.classList.toggle('busy', !!on); sheet.querySelectorAll('button.fcpCta,button.fcpPack').forEach(function (b) { b.disabled = !!on; }); }
  // fixed paywall showcase (the site's sample portrait, before and after), bundled with the app
  function heroImgs() { return ['paywall-before.jpg', 'paywall-after.jpg']; }
  var ICON = {
    ai: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l1.9 5.1 5.1 1.9-5.1 1.9L12 16.5l-1.9-5.1-5.1-1.9 5.1-1.9z" fill="currentColor"/><path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" fill="currentColor"/></svg>',
    looks: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>',
    reel: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor"/></svg>',
    you: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5.5c0 4.3-3 7.9-7 9.5-4-1.6-7-5.2-7-9.5V6z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.8 12.2l2.2 2.2 4.4-4.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  function paywallHTML(p, pk) {
    var y = pk && pk.yearly && pk.yearly.product, m = pk && pk.monthly && pk.monthly.product;
    var yPrice = (y && y.priceString) || p.priceYear, mPrice = (m && m.priceString) || p.priceMonth, pm = perMonth(pk && pk.yearly, p.priceYear);
    var trial = !(y && y.introPrice === null && y.introPrice !== undefined);
    var yn = (y && y.price) || num(p.priceYear), mn = (m && m.price) || num(p.priceMonth), save = yn && mn ? Math.floor((1 - yn / (mn * 12)) * 100) : 0;
    var ai = (st.cfg && st.cfg.allowances) || {}, aiPaid = (ai.paid && ai.paid.perMonth) || 15, aiTrial = (ai.trial && ai.trial.total) || 2;
    var store_ = platform === 'ios' ? 'Apple ID' : 'Google Play account', where = platform === 'ios' ? 'App Store' : 'Google Play';
    var yr = st.sel === 'yearly', hi = heroImgs();
    return '<div class="fcpCard pw">' +
      '<div class="fcpTopBar"><button class="fcpX" aria-label="Close">×</button><button type="button" class="fcpRestoreTop" id="fcpRestoreTop">Restore</button></div>' +
      (hi ? '<div class="fcpShow" aria-hidden="true"><img src="' + hi[0] + '" alt=""><img class="aft" src="' + hi[1] + '" alt=""><span class="fcpTag l">BEFORE</span><span class="fcpTag r">AFTER</span><i class="fcpLine"></i></div>' : '<div class="fcpShow empty"></div>') +
      '<div class="fcpBody">' +
      '<div class="fcpLogo">✦ FACE COUTURE PRO</div><h2>Unlock your luxury glam</h2>' +
      '<ul class="fcpFeat">' +
        '<li><span class="ic">' + ICON.ai + '</span><span><b>' + aiPaid + ' AI Luxe Looks</b> every month</span></li>' +
        '<li><span class="ic">' + ICON.looks + '</span><span>Every on-device look, <b>unlimited</b></span></li>' +
        '<li><span class="ic">' + ICON.reel + '</span><span>Before &amp; after photos and reels</span></li>' +
        '<li><span class="ic">' + ICON.you + '</span><span>Full-resolution saves, made on your own photo</span></li>' +
      '</ul>' +
      '<div class="fcpPlans" role="radiogroup" aria-label="Choose your plan">' +
        '<button type="button" class="fcpPlan year' + (yr ? ' on' : '') + '" data-plan="yearly" role="radio" aria-checked="' + yr + '">' +
          (save >= 10 ? '<span class="fcpBadge">SAVE ' + save + '%</span>' : '') +
          '<span class="rd"></span><span class="nm"><span class="fcpName">Yearly</span><span class="fcpSub">' + (trial ? '7-day free trial' : 'Best value') + '</span></span>' +
          '<span class="pr"><span class="fcpPrice">' + esc(yPrice) + '<small>/year</small></span>' + (pm ? '<span class="fcpPer">' + esc(pm) + '/month</span>' : '') + '</span></button>' +
        '<button type="button" class="fcpPlan month' + (!yr ? ' on' : '') + '" data-plan="monthly" role="radio" aria-checked="' + !yr + '">' +
          '<span class="rd"></span><span class="nm"><span class="fcpName">Monthly</span><span class="fcpSub">Cancel anytime</span></span>' +
          '<span class="pr"><span class="fcpPrice">' + esc(mPrice) + '<small>/month</small></span></span></button>' +
      '</div>' +
      '<button type="button" class="fcpCta" id="fcpGo">' + (yr ? (trial ? 'Start 7-Day Free Trial' : 'Continue') : 'Continue') + '</button>' +
      '<p class="fcpSure">' + (yr && trial ? '<span>✓ No payment due today</span><span>✓ Cancel anytime</span>' : '<span>✓ Cancel anytime</span>') + '</p>' +
      '<p class="fcpFine">' + (yr ? (trial ? '' + aiTrial + ' AI looks included in your 7 days free, then ' + esc(yPrice) + ' a year. ' : esc(yPrice) + ' a year. ') : esc(mPrice) + ' a month. ') +
      'Payment is charged to your ' + store_ + (yr && trial ? ' when the free trial ends' : ' when you confirm') + '. Your subscription renews automatically unless you cancel at least 24 hours before the end of the ' + (yr && trial ? 'trial or ' : '') + 'current period. Manage or cancel anytime in your ' + where + ' settings.</p>' +
      '<div class="fcpLinks"><button type="button" id="fcpTerms">Terms of Use</button><span>·</span><button type="button" id="fcpPrivacy">Privacy Policy</button><span>·</span><button type="button" id="fcpRestore">Restore Purchases</button><span>·</span><button type="button" id="fcpCode">Have a code?</button></div>' +
      '</div></div>';
  }
  function openPaywall(source) {
    var p = pro();
    if (st.me && !st.me.paywall) { toast('Everything is free during our launch. Enjoy!'); return; }
    if (st.me && (st.me.tier === 'paid' || st.me.tier === 'trial')) { openTopups(source); return; }
    var render = function (pk) {
      mount(paywallHTML(p, pk), 'pay');
      sheet.querySelectorAll('[data-plan]').forEach(function (b) { b.onclick = function () { st.sel = b.dataset.plan; tap('LIGHT'); render(pk); }; });
      sheet.querySelector('#fcpGo').onclick = function () { buyPlan(st.sel); };
      sheet.querySelector('#fcpRestore').onclick = restore;
      var rt = sheet.querySelector('#fcpRestoreTop'); if (rt) rt.onclick = restore;
      sheet.querySelector('#fcpCode').onclick = codePrompt;
      sheet.querySelector('#fcpPrivacy').onclick = function () { legal('privacy'); };
      sheet.querySelector('#fcpTerms').onclick = function () { legal('terms'); };
    };
    render(st.pkgs); loadPackages().then(function (pk) { if (sheet && !sheet.hidden && sheet.classList.contains('pay')) render(pk); });
    T('paywall_seen', { source: source || '' });
  }
  function openTopups(source) {
    var p = pro(), me = st.me || {};
    if (me && me.paywall === false) { toast('Everything is free during our launch. More AI looks tomorrow.'); return; }
    // look packs are an extra for members (free trial or paid); everyone else sees the membership first
    if (me.tier !== 'paid' && me.tier !== 'trial' && me.tier !== 'promo') { openPaywall(source || 'packs'); return; }
    var render = function (t) {
      var ids = Object.keys(p.topups);
      mount('<div class="fcpCard"><button class="fcpX" aria-label="Close">×</button><div class="fcpHero small"><div class="fcpLogo">✦ AI LUXE LOOKS</div><h2>More AI looks</h2>' +
        '<p>' + (me.tier === 'trial' ? 'You\'ve used your ' + (((st.cfg && st.cfg.allowances && st.cfg.allowances.trial) || {}).total || 2) + ' free AI looks. Want more? Add a pack and keep going. ' : me.tier === 'paid' ? 'You\'ve used this month\'s AI looks. Add a pack. ' : 'Add a pack. ') + 'Extra looks never expire.</p></div><div class="fcpPacks">' +
        ids.map(function (id) { var d = p.topups[id], prod = t && t[id]; return '<button type="button" class="fcpPack' + (d.badge ? ' best' : '') + '" data-pack="' + id + '">' + (d.badge ? '<span class="fcpBadge">' + esc(d.badge.toUpperCase()) + '</span>' : '') +
          '<span class="fcpNum">' + d.looks + '</span><span class="fcpName">AI looks</span><span class="fcpPrice">' + esc((prod && prod.priceString) || d.price) + '</span></button>'; }).join('') +
        '</div><p class="fcpFine">One-time purchase, charged to your ' + (platform === 'ios' ? 'Apple ID' : 'Google Play account') + '. Not a subscription.</p>' +
        '<div class="fcpLinks"><button type="button" id="fcpRestore">Restore Purchases</button><span>·</span><button type="button" id="fcpPrivacy">Privacy Policy</button><span>·</span><button type="button" id="fcpTerms">Terms</button></div></div>', 'tops');
      sheet.querySelectorAll('[data-pack]').forEach(function (b) { b.onclick = function () { buyTopup(b.dataset.pack); }; });
      sheet.querySelector('#fcpRestore').onclick = restore;
      sheet.querySelector('#fcpPrivacy').onclick = function () { legal('privacy'); };
      sheet.querySelector('#fcpTerms').onclick = function () { legal('terms'); };
    };
    render(st.tops); loadTopups().then(function (t) { if (sheet && !sheet.hidden && sheet.classList.contains('tops')) render(t); });
    T('topups_seen', { source: source || '' });
  }
  function codePrompt() {
    if (platform === 'ios' && RC && rcKey && RC.presentCodeRedemptionSheet && confirm('Is this an App Store offer code?\n\nOK = App Store code\nCancel = Face Couture code')) { RC.presentCodeRedemptionSheet(); return; }
    var code = prompt('Enter your code'); if (!code) return;
    API.api('/api/promo/redeem', { code: code.trim() }).then(function (r) {
      toast(r.kind === 'pro' ? 'Face Couture Pro unlocked. Enjoy!' : 'Extra AI looks added. Enjoy!'); close(); return refresh();
    }).catch(function (e) { toast(e.message || 'That code did not work.'); });
  }

  window.FCPlan = { openPaywall: openPaywall, openTopups: openTopups, restore: restore, manage: manage, refresh: refresh, sync: sync, code: codePrompt, state: st };
  function init() {
    if (!API || !API.url) return;
    // on-device looks are unlimited for everyone: the studio's own Pro gate stays open, Pro is about AI looks
    try { FRAME_PRO.enabled = false; proUnlocked = true; } catch (e) {}
    try { window.openPro = function () { openPaywall('studio'); }; } catch (e) {}
    refresh().then(initStore).then(function () { if (storeReady()) { sync(); loadPackages(); } });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
