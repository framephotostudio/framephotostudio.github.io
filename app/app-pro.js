// Face Couture app: Pro subscription (App Store / Google Play through RevenueCat), promo codes, AI tools, settings.
// The paywall stays hidden until the owner turns "Pro" on in the admin dashboard. Turning it on never charges anyone:
// it only shows the store's own purchase sheet with the 14-day free trial, prices and auto-renewal terms.
(function () {
  'use strict';
  var CFG = window.FC_CONFIG || {}, API = window.FCApi, Cap = window.Capacitor, P = (Cap && Cap.Plugins) || {};
  var isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  var $ = function (s) { return document.querySelector(s); };
  var state = { config: null, me: null, offerings: null, pro: false };
  function toast(t) { try { window.toast(t); } catch (e) { alert(t); } }
  function haptic(s) { try { window.FCNative && window.FCNative.tap(s); } catch (e) {} }

  // ---------- Pro state wiring into the studio ----------
  function setPro(on) {
    state.pro = !!on;
    try { proUnlocked = state.pro; } catch (e) {}
    document.documentElement.classList.toggle('fc-pro', state.pro);
  }
  function applyConfig(c) {
    state.config = c;
    try {
      FRAME_PRO.enabled = false; // the studio's own gate stays open: on-device looks are unlimited, Pro is handled by app-plan.js
      FRAME_PRO.priceMonth = c.pro.priceMonth; FRAME_PRO.priceYear = c.pro.priceYear; FRAME_PRO.trialText = c.pro.trialDays + '-day free trial';
      FRAME_PRO.verify = function () { return Promise.resolve(state.pro); };
    } catch (e) {}
    // hidden looks disappear everywhere
    try { (c.looks.hidden || []).forEach(function (k) { document.querySelectorAll('[data-vibe="' + k + '"],[data-look="' + k + '"],[data-key="' + k + '"]').forEach(function (el) { el.hidden = true; el.style.display = 'none'; }); }); } catch (e) {}
    // season overrides (dates MM-DD, repeat yearly)
    try {
      var S = window.__seasonal && window.__seasonal.SEASONS;
      if (S) S.forEach(function (s) { var o = c.seasons[s.id]; if (!o) return; var f = o.from.split('-').map(Number), t = o.to.split('-').map(Number); s.from = f; s.to = t; if (o.enabled === false) { s.from = [2, 30]; s.to = [2, 30]; } });
    } catch (e) {}
    // AI tools on/off
    document.querySelectorAll('#aiTask option').forEach(function (o) { var k = { remove: 'vanish', film: 'enhance', refine: 'enhance' }[o.value] || o.value; if (c.tools[k] === false) o.disabled = true; });
    if (c.flags && c.flags.showQuiz === false) document.querySelectorAll('.quizLink').forEach(function (q) { q.hidden = true; });
  }
  function refresh() {
    if (!API || !API.url) return Promise.resolve();
    return API.api('/api/config').then(applyConfig).then(function () { return API.api('/api/me'); }).then(function (m) {
      state.me = m; setPro(true);
      updateMeter();
    }).catch(function () {});
  }
  function updateMeter() {
    var el = $('#fcAiLeft'); if (!el || !state.me) return;
    el.textContent = 'AI looks left today: ' + state.me.left.today + ' · this month: ' + state.me.left.month + (state.pro ? ' · Pro' : '');
  }

  // ---------- purchases (RevenueCat) ----------
  var RC = P.Purchases;
  var rcKey = isNative ? (API.platform === 'ios' ? CFG.revenueCatIOS : CFG.revenueCatAndroid) : '';
  function purchasesReady() { return !!(RC && rcKey); }
  function initPurchases() {
    if (!purchasesReady()) return Promise.resolve();
    return RC.configure({ apiKey: rcKey, appUserID: API.device() || undefined }).then(function () {
      RC.addCustomerInfoUpdateListener && RC.addCustomerInfoUpdateListener(function (info) { onCustomer(info.customerInfo || info); });
      return RC.getCustomerInfo();
    }).then(function (r) { onCustomer(r.customerInfo || r); }).catch(function () {});
  }
  function onCustomer(info) {
    var ent = (state.config && state.config.pro.entitlement) || 'pro';
    var active = info && info.entitlements && info.entitlements.active && info.entitlements.active[ent];
    setPro(!!active || (state.me && (state.me.tier === 'paid' || state.me.tier === 'trial')));
  }
  function offerings() {
    if (state.offerings) return Promise.resolve(state.offerings);
    return RC.getOfferings().then(function (o) { state.offerings = o.current; return o.current; });
  }
  function buy(pkg) {
    haptic('MEDIUM');
    return RC.purchasePackage({ aPackage: pkg }).then(function (r) { onCustomer(r.customerInfo); if (state.pro) { toast('Welcome to Face Couture Pro.'); closeSheet(); API.track('trial_started'); } })
      .catch(function (e) { if (!(e && (e.userCancelled || /cancel/i.test(e.message || '')))) toast('The purchase did not go through. You were not charged.'); });
  }
  function restore() {
    if (!purchasesReady()) { toast('Restore is available in the app from the App Store or Google Play.'); return; }
    RC.restorePurchases().then(function (r) { onCustomer(r.customerInfo); toast(state.pro ? 'Pro restored.' : 'No previous purchase found for this account.'); }).catch(function () { toast('Could not reach the store. Try again later.'); });
  }
  function manage() {
    var url = API.platform === 'ios' ? 'https://apps.apple.com/account/subscriptions' : 'https://play.google.com/store/account/subscriptions';
    if (P.Browser) P.Browser.open({ url: url }); else window.open(url, '_blank');
  }

  // native paywall buttons inside the site's Pro sheet
  function decorateProSheet() {
    var act = $('#proActions'); if (!act) return;
    var o = new MutationObserver(function () { inject(); }); o.observe(act, { childList: true });
    function inject() {
      if (!state.config || !(state.config.pro.enabled || CFG.preview) || act.querySelector('.fcBuy')) return;
      var note = $('#proNote'); if (note) note.textContent = 'Start with a ' + state.config.pro.trialDays + '-day free trial. Cancel any time in your ' + (API.platform === 'ios' ? 'App Store' : 'Google Play') + ' settings. After the trial the subscription renews automatically at the price shown until cancelled.';
      var wrap = document.createElement('div'); wrap.className = 'fcBuy';
      wrap.innerHTML = '<button class="btn full fcBuyM">Start free trial · then ' + state.config.pro.priceMonth + '/month</button><button class="toolbtn full fcBuyY">Yearly · ' + state.config.pro.priceYear + '/year</button>' +
        '<div class="fcLegal"><button type="button" class="linklike fcRestore">Restore purchases</button> · <button type="button" class="linklike fcPromo">Promo code</button> · <a href="https://facecouture.app/#privacy">Privacy</a> · <a href="https://facecouture.app/#terms">Terms</a></div>';
      act.innerHTML = ''; act.appendChild(wrap);
      wrap.querySelector('.fcRestore').onclick = restore; wrap.querySelector('.fcPromo').onclick = promoPrompt;
      var m = wrap.querySelector('.fcBuyM'), y = wrap.querySelector('.fcBuyY');
      if (CFG.preview) { // walkthrough mode: nothing is charged, nothing is real
        m.textContent = 'Start free trial · then ' + state.config.pro.priceMonth + '/month'; y.textContent = 'Yearly · ' + state.config.pro.priceYear + '/year';
        var pv = document.createElement('p'); pv.className = 'note'; pv.style.cssText = 'text-align:center;margin:8px 0 0;color:#9b3f79;font-weight:600'; pv.textContent = 'PREVIEW · tapping a plan only simulates a purchase. No store, no charge.'; wrap.appendChild(pv);
        m.onclick = y.onclick = function () { haptic('MEDIUM'); setPro(true); toast('Preview: Pro unlocked on this device (nothing was charged).'); closeSheet(); try { closePro(); } catch (e) {} };
        return;
      }
      if (!purchasesReady()) { m.disabled = y.disabled = true; m.textContent = 'Subscriptions open soon'; return; }
      offerings().then(function (cur) {
        var mp = cur && (cur.monthly || (cur.availablePackages || []).filter(function (p) { return /month/i.test(p.identifier); })[0]);
        var yp = cur && (cur.annual || (cur.availablePackages || []).filter(function (p) { return /annual|year/i.test(p.identifier); })[0]);
        if (mp) { m.textContent = 'Start free trial · then ' + mp.product.priceString + '/month'; m.onclick = function () { buy(mp); }; } else m.disabled = true;
        if (yp) { y.textContent = 'Yearly · ' + yp.product.priceString + '/year'; y.onclick = function () { buy(yp); }; } else y.hidden = true;
      }).catch(function () { m.disabled = true; });
      API.track('paywall_seen');
    }
    inject();
  }

  // ---------- promo codes ----------
  function promoPrompt() {
    var code = prompt('Enter your promo code'); if (!code) return;
    API.api('/api/promo/redeem', { code: code.trim() }).then(function (r) {
      toast(r.kind === 'pro' ? 'Pro unlocked. Enjoy!' : 'Extra AI looks added. Enjoy!'); API.track('promo_redeemed'); return refresh();
    }).catch(function (e) { toast(e.message || 'That code did not work.'); });
  }

  // ---------- AI tools: extend the studio's AI panel ----------
  function extendAI() {
    var task = $('#aiTask'), bd = $('#backdrop'); if (!task) return;
    [['glam', 'AI Glam · pro makeup artist'], ['headshot', 'Studio headshot (LinkedIn)'], ['travel', 'Travel background'], ['tryon', 'Try on an outfit or accessory'], ['blur', 'Instant background blur']].forEach(function (o) {
      var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; task.appendChild(op);
    });
    var trav = [['greece', 'Santorini, Greece'], ['paris', 'Paris'], ['newyork', 'New York'], ['london', 'London'], ['dubai', 'Dubai'], ['rome', 'Rome'], ['bali', 'Bali'], ['maldives', 'Maldives'], ['tokyo', 'Tokyo'], ['alps', 'Swiss Alps']];
    var og = document.createElement('optgroup'); og.label = 'Travel'; trav.forEach(function (t) { var op = document.createElement('option'); op.value = t[0]; op.textContent = t[1]; og.appendChild(op); }); bd.appendChild(og);
    // outfit try-on controls
    var box = document.createElement('div'); box.id = 'fcTryon'; box.hidden = true;
    box.innerHTML = '<label>What is it?</label><select id="fcCat"><option value="garment">Clothing</option><option value="shoes">Shoes</option><option value="bag">Bag</option><option value="jewelry">Jewelry</option><option value="sunglasses">Sunglasses</option><option value="hat">Hat</option></select>' +
      '<label class="toolbtn full" style="margin-top:8px">Add a photo of the item <input type="file" id="fcGarment" accept="image/*" hidden></label><img id="fcGarmentPrev" alt="" hidden style="max-height:90px;border-radius:10px;margin-top:6px">' +
      '<p class="note">A visual preview, not a guaranteed fit. Uploading a brand\'s product photo does not mean a partnership. Only upload items you have permission to use.</p>';
    task.parentNode.insertBefore(box, task.nextSibling);
    var glam = document.createElement('div'); glam.id = 'fcGlamOpts'; glam.hidden = true;
    glam.innerHTML = '<label>Intensity</label><select id="fcGlamInt"><option value="soft">Soft & natural</option><option value="glam" selected>Polished glam</option><option value="max">Red carpet</option></select>' +
      '<label>Lip</label><select id="fcGlamLip"><option value="a rosy nude creamy lip">Rosy nude</option><option value="a soft mauve creamy lip">Mauve</option><option value="a classic Hollywood red lip">Hollywood red</option><option value="a glossy wine lip">Glossy wine</option><option value="a clear gloss over the natural lip">Clear gloss</option></select>' +
      '<label>Eyes</label><select id="fcGlamEyes"><option value="blended shimmer eyeshadow, liner along the real lash line and luxury-extension-style lashes">Shimmer & lashes</option><option value="a soft smoky eye with fluffy lashes">Smoky</option><option value="a sharp winged liner with natural lashes">Winged liner</option><option value="clean natural eyes with groomed lashes">Clean & natural</option></select>';
    box.parentNode.insertBefore(glam, box.nextSibling);
    var meter = document.createElement('p'); meter.id = 'fcAiLeft'; meter.className = 'note'; task.parentNode.insertBefore(meter, $('#generate'));
    var rep = document.createElement('button'); rep.className = 'toolbtn full'; rep.textContent = 'Report this AI result'; rep.onclick = function () { var why = prompt('What was wrong with the result?'); if (why) API.api('/api/report', { task: task.value, reason: why }).then(function () { toast('Thank you. We review every report.'); }).catch(function () {}); };
    var actions = $('.ai-actions'); if (actions) actions.appendChild(rep);
    function sync() {
      var v = task.value; box.hidden = v !== 'tryon'; glam.hidden = v !== 'glam';
      var outfitWrap = $('#outfit') && $('#outfit').parentNode, bdWrap = bd.parentNode;
      if (outfitWrap) outfitWrap.style.display = (v === 'glam' || v === 'tryon' || v === 'blur' || v === 'travel' || v === 'enhance' || v === 'remove') ? 'none' : '';
      if (bdWrap) bdWrap.style.display = (v === 'glam' || v === 'tryon' || v === 'blur' || v === 'enhance' || v === 'remove') ? 'none' : '';
      if (v === 'travel' && !/greece|paris|newyork|london|dubai|rome|bali|maldives|tokyo|alps|beach|sunset/.test(bd.value)) bd.value = 'greece';
      var g = $('#generate'); if (g) g.textContent = { glam: '✧ Apply AI Glam', headshot: '✧ Create my headshot', travel: '✧ Take me there', tryon: '✧ Try it on', blur: '✧ Blur background', remove: '✧ Vanish it', enhance: '✧ Enhance naturally', background: '✧ Change background' }[v] || g.textContent;
      window.__fcAIOptions = v === 'glam' ? { intensity: $('#fcGlamInt').value, lip: $('#fcGlamLip').value, eyes: $('#fcGlamEyes').value } : {};
      updateMeter();
    }
    task.addEventListener('change', sync); glam.addEventListener('change', sync); setTimeout(sync, 50);
    $('#fcGarment').addEventListener('change', function (ev) {
      var f = ev.target.files[0]; if (!f) return; var r = new FileReader();
      r.onload = function () { var im = new Image(); im.onload = function () { var c = document.createElement('canvas'); var s = Math.min(1, 1024 / Math.max(im.width, im.height)); c.width = im.width * s; c.height = im.height * s; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); window.__fcGarment = { data: c.toDataURL('image/jpeg', .9), category: $('#fcCat').value }; var pv = $('#fcGarmentPrev'); pv.src = window.__fcGarment.data; pv.hidden = false; }; im.src = r.result; };
      r.readAsDataURL(f);
    });
    $('#fcCat').addEventListener('change', function () { if (window.__fcGarment) window.__fcGarment.category = $('#fcCat').value; });
    // after a generation finishes, refresh the meter and count the event
    window.addEventListener('fc:ai', function (ev) { if (ev.detail && ev.detail.ok) API.track('ai_used', { task: task.value }); refresh(); setTimeout(sync, 400); });
    var origStatus = $('#aiStatus');
    if (origStatus) new MutationObserver(function () { setTimeout(sync, 50); }).observe(origStatus, { childList: true, characterData: true, subtree: true });
  }

  // ---------- settings sheet ----------
  function openSettings() {
    var s = $('#fcSettings'); if (!s) { s = document.createElement('div'); s.id = 'fcSettings'; s.className = 'proSheet'; s.setAttribute('role', 'dialog'); document.body.appendChild(s); }
    var dev = API.device() || '—';
    s.innerHTML = '<section class="proCard"><button class="toolbtn proClose" id="fcSetClose" aria-label="Close">✕</button><div class="prolabel">✦ FACE COUTURE</div><h2>Settings</h2>' +
      '<p class="note" id="fcSetTier">' + ((window.FCPlan && window.FCPlan.state.me && (state.me = window.FCPlan.state.me)) || state.me ? ('Plan: ' + ({ paid: 'Face Couture Pro', trial: 'Pro · free trial', promo: 'Promo', free: 'Free', launch: 'Free launch', owner: 'Owner' }[state.me.tier] || state.me.tier) + (state.me.owner ? (state.me.viewAs && state.me.viewAs !== 'owner' ? ' · previewing a customer view' : ' · unlimited AI looks') : ' · AI looks left: ' + state.me.left.total)) : 'Beauty tools work offline. AI looks need a connection.') + '</p>' +
      ownerPanel() +
      '<div class="fcSetList">' +
      (window.FCPlan && window.FCPlan.state.me && window.FCPlan.state.me.paywall ? '<button class="btn full" id="fcSetPro">' + (/paid|trial/.test(window.FCPlan.state.me.tier) ? 'Manage subscription' : 'Face Couture Pro') + '</button>' : '') +
      '<button class="toolbtn full" id="fcSetPromo">Enter a promo code</button><button class="toolbtn full" id="fcSetRestore">Restore purchases</button>' +
      '<button class="toolbtn full" id="fcSetPrivacy">Privacy policy</button><button class="toolbtn full" id="fcSetTerms">Terms of use</button>' +
      '<button class="toolbtn full" id="fcSetSupport">Contact support</button><button class="toolbtn full" id="fcSetDelete">Delete my data</button></div>' +
      '<p class="note">Your photos never leave your phone unless you choose an AI look, and then they are sent only for that edit and never stored or used for training. Device ID: <code>' + dev + '</code></p>' +
      '<p class="note" id="fcSetVersion">Face Couture by Always Luxe · version ' + (CFG.version || '1.0.0') + '</p></section>';
    s.hidden = false;
    $('#fcSetClose').onclick = closeSheet;
    var pro = $('#fcSetPro'), plan = window.FCPlan, pm = plan && plan.state.me;
    wireOwner(plan);
    if (pro) pro.onclick = function () { closeSheet(); if (pm && (pm.tier === 'paid' || pm.tier === 'trial')) plan.manage(); else if (plan) plan.openPaywall('settings'); };
    $('#fcSetPromo').onclick = function () { closeSheet(); plan ? plan.code() : promoPrompt(); }; $('#fcSetRestore').onclick = function () { plan ? plan.restore() : restore(); };
    $('#fcSetPrivacy').onclick = function () { closeSheet(); openLegal('privacy'); }; $('#fcSetTerms').onclick = function () { closeSheet(); openLegal('terms'); };
    $('#fcSetSupport').onclick = function () { location.href = 'mailto:' + (CFG.supportEmail || 'hello@facecouture.app') + '?subject=Face%20Couture%20app'; };
    $('#fcSetDelete').onclick = function () {
      if (!confirm('Delete everything linked to this device on our servers (AI allowance history and promo use)? Photos are never stored by us. Subscriptions are managed in your store account.')) return;
      API.api('/api/delete-my-data', {}).then(function (r) { toast(r.message || 'Deleted.'); try { localStorage.removeItem('fc-token'); localStorage.removeItem('fc-device'); } catch (e) {} closeSheet(); }).catch(function (e) { toast(e.message || 'Could not delete right now.'); });
    };
  }
  // ---------- owner mode: tap the version line 5 times, enter the owner passphrase ----------
  var OWNER_VIEWS = [['owner', 'Owner (unlimited)'], ['launch', 'Free launch'], ['free', 'No plan'], ['trial', 'Free trial'], ['trial_out', 'Trial used up'], ['paid', 'Member'], ['paid_out', 'Member, out of looks'], ['busy', 'AI budget reached']];
  function ownerPanel() {
    var pm = window.FCPlan && window.FCPlan.state.me; if (!pm || !pm.owner) return '';
    var v = pm.viewAs || 'owner';
    return '<div class="fcOwner"><div class="fcOwnerHead"><b>Owner mode</b><span>Only on this device. Your own use is not counted as a customer.</span></div>' +
      '<div class="fcOwnerLabel">See the app as</div><div class="fcOwnerViews">' +
      OWNER_VIEWS.map(function (o) { return '<button type="button" data-view="' + o[0] + '" class="' + (o[0] === v ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div>' +
      '<div class="fcOwnerBtns"><button type="button" class="toolbtn full" id="fcOwnPay">Preview membership screen</button><button type="button" class="toolbtn full" id="fcOwnPacks">Preview look packs</button>' +
      '<button type="button" class="btn full" id="fcOwnDash">Open owner dashboard</button><button type="button" class="linklike" id="fcOwnLeave">Leave owner mode</button></div></div>';
  }
  function wireOwner(plan) {
    var ver = $('#fcSetVersion'), taps = 0, tm = 0;
    if (ver) ver.onclick = function () {
      taps++; clearTimeout(tm); tm = setTimeout(function () { taps = 0; }, 1500);
      if (taps < 5 || !plan) return; taps = 0;
      if (plan.state.me && plan.state.me.owner) { toast('Owner mode is already on.'); return; }
      var pass = prompt('Owner passphrase'); if (!pass) return;
      plan.ownerClaim(pass).then(function () { toast('Owner mode is on for this device.'); openSettings(); }).catch(function (e) { toast(e.message || 'That did not work.'); });
    };
    var box = document.querySelector('#fcSettings .fcOwner'); if (!box || !plan) return;
    box.querySelectorAll('[data-view]').forEach(function (b) { b.onclick = function () {
      plan.ownerView(b.dataset.view).then(function () { toast('Now seeing the app as: ' + b.textContent); openSettings(); }).catch(function (e) { toast(e.message || 'Could not switch.'); }); }; });
    $('#fcOwnPay').onclick = function () { closeSheet(); plan.preview('paywall'); };
    $('#fcOwnPacks').onclick = function () { closeSheet(); plan.preview('packs'); };
    $('#fcOwnDash').onclick = function () { var u = (API.url || 'https://face-couture-api.facecouture.workers.dev') + '/admin';
      try { if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Browser) { Capacitor.Plugins.Browser.open({ url: u }); return; } } catch (e) {} window.open(u, '_blank'); };
    $('#fcOwnLeave').onclick = function () { if (!confirm('Leave owner mode on this device?')) return;
      plan.ownerView('leave').then(function () { toast('Owner mode is off.'); openSettings(); }).catch(function (e) { toast(e.message || 'Could not leave.'); }); };
  }
  function openLegal(kind) { var l = document.querySelector('.legalLink[data-legal="' + kind + '"]'); if (l) l.click(); }
  function closeSheet() { var s = $('#fcSettings'); if (s) s.hidden = true; }
  function addSettingsButtons() {
    var mk = function () { var b = document.createElement('button'); b.type = 'button'; b.className = 'fcGear'; b.setAttribute('aria-label', 'Settings'); b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'; b.onclick = function () { haptic('LIGHT'); openSettings(); }; return b; };
    var h = document.querySelector('header'); if (h && !h.querySelector('.fcGear')) h.appendChild(mk());
    var obs = new MutationObserver(function () { var sb = $('#fcStudioBar'); if (sb && !sb.querySelector('.fcGear')) sb.insertBefore(mk(), sb.children[1] || null); });
    obs.observe(document.body, { childList: true, subtree: false }); var st = document.querySelector('.stage'); if (st) obs.observe(st, { childList: true });
  }

  // ---------- events worth counting (no photos, no faces, no names) ----------
  function trackStudio() {
    API.track('open', { campaign: (new URLSearchParams(location.search).get('c') || '') });
    new MutationObserver(function () { if (document.body.classList.contains('ownPhoto') && !window.__fcPhotoTracked) { window.__fcPhotoTracked = true; API.track('photo_chosen'); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    try { var _av = applyVibe; applyVibe = function (k) { API.track('look_applied', { look: k }); return _av.apply(this, arguments); }; } catch (e) {}
    window.addEventListener('fc:saved', function () { API.track('save'); });
  }

  // ---------- walkthrough preview (facecouture.app/app-preview): shows every screen without any backend or store ----------
  function previewMode() {
    applyConfig({ pro: { enabled: false, trialDays: 7, priceMonth: '$8.99', priceYear: '$36.99', entitlement: 'pro' }, looks: { hidden: [] }, seasons: {}, tools: { glam: true, enhance: true, background: true, headshot: true, tryon: true, vanish: true, blur: true, travel: true }, flags: { showQuiz: true } });
    state.me = { tier: 'free', left: { today: 2, month: 10 }, allowance: { perDay: 2, perMonth: 10 } };
    extendAI(); decorateProSheet();
    document.querySelectorAll('[data-tab="ai"]').forEach(function (b) { b.hidden = false; });
    try { aiReady = true; } catch (e) {}
    var g = $('#generate');
    if (g) g.addEventListener('click', function (ev) { ev.stopImmediatePropagation(); ev.preventDefault(); toast('Preview: AI looks run once the AI backend is connected. Everything else here is real.'); }, true);
    var st = $('#aiStatus'); if (st) st.textContent = 'Preview mode: this screen shows the AI tools. Generation switches on with the backend.';
    document.addEventListener('click', function (ev) { if (ev.target && ev.target.closest && ev.target.closest('#fcSetPro')) { /* handled by settings */ } }, true);
    var badge = document.createElement('div'); badge.id = 'fcPreviewBadge'; badge.textContent = 'PREVIEW · nothing is charged'; document.body.appendChild(badge);
  }

  function init() {
    if (!API) return;
    addSettingsButtons();
    if (!API.url && CFG.preview) { previewMode(); return; }
    if (!API.url) return; // backend not configured yet: beauty studio only
    // AI Luxe Looks (in the studio) replace the older AI tab; purchases and the paywall live in app-plan.js
    document.documentElement.classList.add('fc-noaitab'); setPro(true);
    refresh().then(trackStudio);
    setInterval(refresh, 10 * 60 * 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
