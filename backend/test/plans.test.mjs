// Local test of plans, limits, top-ups and the budget limit. Fake storage, fake AI and fake RevenueCat: nothing real is called.
import worker from '../src/index.js';
const kv = new Map();
const KV = { get: async (k, t) => { const v = kv.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; }, put: async (k, v) => { kv.set(k, String(v)); },
  delete: async k => { kv.delete(k); }, list: async ({ prefix }) => ({ keys: [...kv.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })) }) };
const env = { KV, GEMINI_API_KEY: 'x', APP_SIGNING_SECRET: 'sec', ADMIN_PASSPHRASE: 'pw', REVENUECAT_WEBHOOK_SECRET: 'wh', REVENUECAT_API_KEY: 'rc', ALLOWED_ORIGINS: 'https://facecouture.app' };
const ctx = { waitUntil: p => p };
let rcSub = {};
globalThis.fetch = async (url, init) => {
  if (String(url).includes('generativelanguage')) return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'AAAA' } }] } }] }), { status: 200 });
  if (String(url).includes('api.revenuecat.com')) return new Response(JSON.stringify({ subscriber: rcSub }), { status: 200 });
  throw new Error('unexpected fetch ' + url);
};
const call = async (path, body, token, method = 'POST', headers = {}) => {
  const r = await worker.fetch(new Request('https://api.test' + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}), ...headers }, body: method === 'GET' ? undefined : JSON.stringify(body || {}) }), env, ctx);
  return { status: r.status, j: await r.json() };
};
const IMG = 'data:image/jpeg;base64,AAAA';
const ai = (t, extra = {}) => call('/api/ai', { task: 'glam', intensity: 'soft', image: IMG, consent: true, width: 800, height: 1000, ...extra }, t);
const setCfg = async patch => { const cur = JSON.parse(kv.get('config:current') || '{}'); kv.set('config:current', JSON.stringify({ ...cur, ...patch, pro: { ...(cur.pro || {}), ...(patch.pro || {}) } })); };
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const newDevice = async (platform = 'ios') => (await call('/api/hello', { platform })).j;
const clearRL = () => { for (const k of [...kv.keys()]) if (k.startsWith('rl:')) kv.delete(k); };

// 1. launch month: paywall off, 2 a day
let d = await newDevice(); let me = (await call('/api/me', null, d.token, 'GET')).j;
ok(me.tier === 'launch' && me.paywall === false && me.left.total === 2, 'launch month: no paywall, 2 AI looks today (' + me.tier + ', ' + me.left.total + ')');
let r1 = await ai(d.token); clearRL(); let r2 = await ai(d.token); clearRL(); let r3 = await ai(d.token);
ok(r1.status === 200 && r2.status === 200 && r3.status === 402, 'launch: third look today is refused (' + [r1.status, r2.status, r3.status] + ')');
// 2. a quality re-make is free
clearRL(); let d2 = await newDevice(); await ai(d2.token); clearRL(); let rr = await ai(d2.token, { retry: true });
me = (await call('/api/me', null, d2.token, 'GET')).j; ok(rr.status === 200 && me.left.total === 1, 'quality re-make does not use an AI look (' + me.left.total + ' left)');
// 3. paywall date passed: app users without a plan get 0 AI looks, website keeps its small allowance
await setCfg({ pro: { paywallFrom: '2020-01-01' } }); clearRL();
let d3 = await newDevice(); me = (await call('/api/me', null, d3.token, 'GET')).j; let r = await ai(d3.token);
ok(me.paywall === true && me.tier === 'free' && r.status === 402 && r.j.code === 'subscribe', 'after launch: no plan = paywall for AI (' + r.j.code + ': ' + r.j.error + ')');
let w = await newDevice('web'); me = (await call('/api/me', null, w.token, 'GET')).j; ok(me.tier === 'anonymousWeb' && me.left.total === 1, 'website visitors keep 1 free AI look a day, no paywall');
// 4. trial: 2 total
const hook = (ev) => call('/api/webhooks/revenuecat', { event: ev }, null, 'POST', { authorization: 'Bearer wh' });
let t = await newDevice(); const in7 = Date.now() + 7 * 86400e3;
await hook({ type: 'INITIAL_PURCHASE', period_type: 'TRIAL', app_user_id: t.device, product_id: 'fc_pro_yearly', expiration_at_ms: in7, store: 'APP_STORE' });
let codes = []; for (let i = 0; i < 3; i++) { clearRL(); codes.push((await ai(t.token)).status); }
me = (await call('/api/me', null, t.token, 'GET')).j;
ok(me.tier === 'trial' && codes.join() === '200,200,402', 'trial: exactly 2 AI looks in total (' + codes + ')');
// 5. trial converts to paid: 15 a month
await hook({ type: 'RENEWAL', period_type: 'NORMAL', app_user_id: t.device, product_id: 'fc_pro_yearly', expiration_at_ms: Date.now() + 365 * 86400e3 });
me = (await call('/api/me', null, t.token, 'GET')).j; ok(me.tier === 'paid' && me.left.total === 15, 'paid subscriber: 15 AI looks this month (' + me.tier + ', ' + me.left.total + ')');
// 6. top-up 40 adds on top, counted once even if reported twice, used after the plan runs out
await hook({ type: 'NON_RENEWING_PURCHASE', app_user_id: t.device, product_id: 'fc_ai_40', transaction_id: 'tx1' });
await hook({ type: 'NON_RENEWING_PURCHASE', app_user_id: t.device, product_id: 'fc_ai_40', transaction_id: 'tx1' });
me = (await call('/api/me', null, t.token, 'GET')).j; ok(me.credits === 40 && me.left.total === 55 && me.tier === 'paid', 'top-up 40 added once, plan unchanged (' + me.credits + ' extra, ' + me.left.total + ' total)');
for (let i = 0; i < 15; i++) { clearRL(); await ai(t.token); } clearRL(); r = await ai(t.token);
me = (await call('/api/me', null, t.token, 'GET')).j; ok(r.status === 200 && me.credits === 39 && me.left.plan === 0, 'after 15 plan looks, the 16th uses a top-up (' + me.credits + ' extra left)');
// 7. top-ups for a non-subscriber after launch also work
let n = await newDevice(); await hook({ type: 'NON_RENEWING_PURCHASE', app_user_id: n.device, product_id: 'fc_ai_20', transaction_id: 'tx2' }); clearRL(); r = await ai(n.token);
me = (await call('/api/me', null, n.token, 'GET')).j; ok(r.status === 200 && me.credits === 19, 'top-up pack works without a subscription (' + me.credits + ' left)');
// 8. instant sync after purchase (no waiting for the webhook)
let s = await newDevice(); clearRL(); rcSub = { entitlements: { pro: { expires_date: new Date(in7).toISOString(), product_identifier: 'fc_pro_yearly' } }, subscriptions: { fc_pro_yearly: { period_type: 'trial' } }, non_subscriptions: { fc_ai_20: [{ id: 'tx3', store_transaction_id: 'st3' }] } };
me = (await call('/api/sync', {}, s.token)).j; if(!me.left) console.log('sync said', JSON.stringify(me)); ok(me.tier === 'trial' && me.credits === 20 && me.left.total === 22, 'sync after purchase: trial + 20 extra right away (' + me.tier + ', ' + me.left.total + ')');
me = (await call('/api/sync', {}, s.token)).j; ok(me.credits === 20, 'syncing again does not add the pack twice');
// 9. cancellation keeps access until the end, expiration removes it
await hook({ type: 'CANCELLATION', app_user_id: s.device, product_id: 'fc_pro_yearly', expiration_at_ms: in7 }); me = (await call('/api/me', null, s.token, 'GET')).j; ok(me.tier === 'trial', 'cancelling keeps access until the trial ends');
await hook({ type: 'EXPIRATION', app_user_id: s.device, product_id: 'fc_pro_yearly', expiration_at_ms: Date.now() - 1000 }); me = (await call('/api/me', null, s.token, 'GET')).j; ok(me.tier === 'free' && me.credits === 20, 'after it ends: no plan, but top-ups are kept (' + me.tier + ', ' + me.credits + ')');
// 10. promo code 30 days = membership
await setCfg({ promos: { TESTPRO30: { kind: 'pro', days: 30, maxUses: 5, uses: 0 } } }); let p = await newDevice();
let pr = await call('/api/promo/redeem', { code: 'testpro30' }, p.token); me = (await call('/api/me', null, p.token, 'GET')).j;
ok(pr.status === 200 && me.tier === 'paid' && Math.round((me.proUntil - Date.now()) / 86400e3) === 30, '30-day membership code gives Pro for 30 days');
// 11. budget limit: friendly message and on-device fallback
kv.set('spend:' + new Date().toISOString().slice(0, 7), '19.99'); { const tr = await newDevice(); await hook({ type: 'INITIAL_PURCHASE', period_type: 'TRIAL', app_user_id: tr.device, product_id: 'fc_pro_yearly', expiration_at_ms: in7 }); clearRL(); r = await ai(tr.token); }
ok(r.status === 503 && r.j.code === 'ceiling' && r.j.fallback === 'on_device' && /busy right now, try the on-device version/.test(r.j.error), 'budget reached: "' + r.j.error + '"');
// 11b. paying member past the budget still gets the look (up to their own allowance); free code member does not
{ const pm = await newDevice(); const exp = Date.now() + 30 * 86400e3;
  await hook({ type: 'INITIAL_PURCHASE', app_user_id: pm.device, product_id: 'fc_pro_monthly', period_type: 'NORMAL', price: 6.99, expiration_at_ms: exp });
  clearRL(); let rp = await ai(pm.token); ok(rp.status === 200, 'paying member goes past the budget (' + rp.status + ')');
  clearRL(); let rc = await ai(p.token); ok(rc.status === 503 && rc.j.code === 'ceiling', 'free 30-day code member still sees "busy" at the budget (' + rc.status + ')');
  const pk = await newDevice(); await hook({ type: 'NON_RENEWING_PURCHASE', app_user_id: pk.device, product_id: 'fc_ai_20', transaction_id: 'pk1' });
  clearRL(); let rk = await ai(pk.token); ok(rk.status === 200, 'look pack buyer goes past the budget (' + rk.status + ')'); }
kv.set('spend:' + new Date().toISOString().slice(0, 7), '0');
// 12. webhook needs the secret
r = await call('/api/webhooks/revenuecat', { event: { type: 'NON_RENEWING_PURCHASE', app_user_id: n.device, product_id: 'fc_ai_40', transaction_id: 'evil' } }, null, 'POST', { authorization: 'Bearer wrong' });
ok(r.status === 401, 'fake purchase messages without the secret are rejected');
// 13. paywall date in the future = still free launch
await setCfg({ pro: { paywallFrom: '2099-01-01' } }); let f = await newDevice(); me = (await call('/api/me', null, f.token, 'GET')).j; ok(me.tier === 'launch' && me.paywall === false, 'paywall date in the future: still the free launch');
// 14. owner mode: passphrase, unlimited, view-as previews, not counted as a user
await setCfg({ pro: { paywallFrom: '2020-01-01' } });
{ const o = await newDevice();
  let bad = await call('/api/owner/claim', { passphrase: 'nope' }, o.token); ok(bad.status === 403, 'owner: wrong passphrase refused');
  let good = await call('/api/owner/claim', { passphrase: 'pw' }, o.token); ok(good.status === 200 && good.j.owner && good.j.tier === 'owner' && good.j.paywall === false, 'owner: passphrase turns on owner mode (' + good.j.tier + ')');
  let codes = []; for (let i = 0; i < 25; i++) { clearRL(); codes.push((await ai(o.token)).status); }
  ok(codes.every(c => c === 200), 'owner: unlimited AI looks (25 in a row)');
  const views = { free: [402, 'subscribe'], trial_out: [402, 'allowance'], paid_out: [402, 'allowance'], busy: [503, 'ceiling'] };
  for (const [v, [st, code]] of Object.entries(views)) {
    const mv = await call('/api/owner/view', { as: v }, o.token); clearRL(); const rr = await ai(o.token);
    ok(mv.status === 200 && mv.j.viewAs === v && rr.status === st && rr.j.code === code, 'owner: view as ' + v + ' shows what customers see (' + rr.status + ' ' + rr.j.code + ')');
  }
  let tv = await call('/api/owner/view', { as: 'trial' }, o.token); clearRL(); let tr = await ai(o.token);
  ok(tv.j.tier === 'trial' && tv.j.left.total === 2 && tr.status === 200, 'owner: view as trial member works');
  const before = kv.get('dau:' + new Date().toISOString().slice(0, 10) + ':' + o.device);
  await call('/api/event', { name: 'open' }, o.token);
  ok(!kv.get('dau:' + new Date().toISOString().slice(0, 10) + ':' + o.device), 'owner: not counted as a daily user');
  let lv = await call('/api/owner/view', { leave: true }, o.token); ok(lv.j.tier === 'free' && !lv.j.owner, 'owner: leaving owner mode makes it a normal device again');
  let other = await newDevice(); let nv = await call('/api/owner/view', { as: 'paid' }, other.token); ok(nv.status === 403, 'owner: other devices cannot use owner controls'); }
