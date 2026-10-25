// Face Couture API - one secure backend for the website, iPhone and Android apps.
// Secret keys never leave this server. Photos are sent to the AI provider only for the edit the user asked for,
// are never stored here, and are never used for training. No photos or face data are written to logs.
import { getConfig, saveConfig, rollbackConfig, listConfigVersions, publicConfig, paywallOn } from './config.js';
import { buildPrompt, simplePrompt, TRAVEL_KEYS } from './prompts.js';
import { ADMIN_HTML } from './admin-page.js';

const enc = new TextEncoder();
const json = (d, s = 200, h = {}) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...h } });
const err = (m, s = 400, extra = {}) => json({ error: m, ...extra }, s);
const month = (d = new Date()) => d.toISOString().slice(0, 7);
const day = (d = new Date()) => d.toISOString().slice(0, 10);
// week key: the Monday (UTC) that starts this week
const week = (d = new Date()) => { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return 'w' + x.toISOString().slice(0, 10); };
const isWeekly = (dev, cfg) => !!dev.plan && dev.plan === ((cfg.pro && cfg.pro.products) || {}).weekly;

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const cors = corsHeaders(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      const r = await route(req, env, ctx, url);
      for (const [k, v] of Object.entries(cors)) r.headers.set(k, v);
      return r;
    } catch (e) {
      // never echo request bodies (they may contain photos); message only
      return json({ error: 'Something went wrong on our side. Please try again.' }, 500, cors);
    }
  },
  // nightly: roll usage counters, send spend alert, prune
  async scheduled(ev, env, ctx) { ctx.waitUntil(spendAlert(env)); }
};

async function route(req, env, ctx, url) {
  const p = url.pathname.replace(/\/+$/, '') || '/';
  if (p === '/api/status') return status(env);
  if (p === '/api/config') return json(publicConfig(await getConfig(env)));
  if (p === '/api/hello' && req.method === 'POST') return hello(req, env);
  if (p === '/api/refine' && req.method === 'POST') return generate(req, env, ctx, 'refine');
  if (p === '/api/ai' && req.method === 'POST') return generate(req, env, ctx, null);
  if (p === '/api/promo/redeem' && req.method === 'POST') return redeemPromo(req, env);
  if (p === '/api/me') return me(req, env);
  if (p === '/api/owner/claim' && req.method === 'POST') return ownerClaim(req, env);
  if (p === '/api/owner/view' && req.method === 'POST') return ownerView(req, env);
  if (p === '/api/sync' && req.method === 'POST') return syncPurchases(req, env);
  if (p === '/api/event' && req.method === 'POST') return event(req, env, ctx);
  if (p === '/api/report' && req.method === 'POST') return report(req, env);
  if (p === '/api/delete-my-data' && req.method === 'POST') return deleteMyData(req, env);
  if (p === '/api/webhooks/revenuecat' && req.method === 'POST') return revenuecat(req, env);
  if (p === '/admin' || p === '/admin/') return new Response(ADMIN_HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  if (p.startsWith('/api/admin/')) return admin(req, env, p.slice(11), url);
  if (p === '/' ) return json({ service: 'Face Couture API', ok: true });
  return err('Not found', 404);
}

// ---------- CORS: only the site and the apps ----------
function corsHeaders(req, env) {
  const o = req.headers.get('origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
  const ok = allowed.includes(o) || /^https:\/\/([a-z0-9-]+\.)?facecouture\.app$/.test(o) || /^https?:\/\/localhost(:\d+)?$/.test(o);
  return { 'access-control-allow-origin': ok ? o : allowed[0] || '*', 'access-control-allow-methods': 'GET,POST,OPTIONS',
           'access-control-allow-headers': 'content-type,authorization,x-fc-device', 'access-control-max-age': '86400', 'vary': 'origin' };
}

// ---------- device identity (no account needed) ----------
// The app calls /api/hello once per install and receives a signed token. Every AI call carries it, so allowances
// follow the device, abuse can be rate-limited, and nothing personal is collected.
async function sign(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}
async function hello(req, env) {
  const ip = req.headers.get('cf-connecting-ip') || '0';
  if (!(await rateLimit(env, 'hello:' + ip, 20, 3600))) return err('Too many requests', 429);
  const b = await req.json().catch(() => ({}));
  const id = crypto.randomUUID();
  const platform = ['ios', 'android', 'web'].includes(b.platform) ? b.platform : 'web';
  const payload = `${id}.${platform}.${Date.now()}`;
  const token = payload + '.' + await sign(env.APP_SIGNING_SECRET || 'dev', payload);
  await env.KV.put('dev:' + id, JSON.stringify({ platform, created: Date.now(), tier: 'free' }), { expirationTtl: 60 * 86400 * 6 });
  await bump(env, 'stat:installs:' + platform + ':' + month());
  return json({ device: id, token });
}
async function auth(req, env) {
  const t = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') || req.headers.get('x-fc-device') || '';
  const parts = t.split('.');
  if (parts.length !== 4) return null;
  const payload = parts.slice(0, 3).join('.');
  if ((await sign(env.APP_SIGNING_SECRET || 'dev', payload)) !== parts[3]) return null;
  const rec = (await env.KV.get('dev:' + parts[0], 'json')) || { platform: parts[1], tier: 'free' };
  // owner's own phones: always owner mode (unlimited, not counted), no passphrase needed
  if (!rec.owner && ownerDevices(env).includes(parts[0])) {
    rec.owner = true; rec.viewAs = 'owner'; rec.ownerSince = Date.now();
    await env.KV.put('dev:' + parts[0], JSON.stringify(rec)); await env.KV.put('owner:' + parts[0], JSON.stringify({ since: rec.ownerSince, platform: rec.platform || parts[1] || '' }));
  }
  return { id: parts[0], platform: parts[1], ...rec };
}
// Device IDs of the owner's phones (Settings -> Device ID). Also settable as the OWNER_DEVICES variable (comma separated).
const OWNER_DEVICE_IDS = [];
const ownerDevices = env => OWNER_DEVICE_IDS.concat(String(env.OWNER_DEVICES || '').split(',').map(x => x.trim()).filter(Boolean));

// ---------- counters ----------
async function bump(env, key, n = 1, ttl = 400 * 86400) {
  const v = (+(await env.KV.get(key)) || 0) + n;
  await env.KV.put(key, String(v), { expirationTtl: ttl });
  return v;
}
async function rateLimit(env, key, max, windowSec) {
  const k = 'rl:' + key + ':' + Math.floor(Date.now() / 1000 / windowSec);
  return (await bump(env, k, 1, windowSec + 60)) <= max;
}
async function spentThisMonth(env) { return +(await env.KV.get('spend:' + month())) || 0; }

// ---------- tier & allowances ----------
// Counted on this server only, so it can't be bypassed on the phone.
function tierOf(dev, cfg) {
  const now = Date.now();
  if (dev.trialUntil && dev.trialUntil > now && dev.proUntil && dev.proUntil <= dev.trialUntil) return 'trial';
  if (dev.proUntil && dev.proUntil > now) return 'paid';
  if (dev.trialUntil && dev.trialUntil > now) return 'trial';
  if (dev.promoUntil && dev.promoUntil > now) return 'promo';
  if (dev.platform === 'web') return 'anonymousWeb';
  if (!paywallOn(cfg)) return 'launch';          // free launch (2 weeks): everything unlocked
  return 'free';
}
async function allowanceCheck(env, dev, cfg) {
  const tier = tierOf(dev, cfg);
  const weekly = tier === 'paid' && isWeekly(dev, cfg) && cfg.allowances.weekly;
  const a = weekly ? cfg.allowances.weekly : (cfg.allowances[tier] || cfg.allowances.free);
  let planLeft, today, monthLeft;
  if (tier === 'trial') {
    const used = +(await env.KV.get(`use:${dev.id}:trial`)) || 0;
    planLeft = today = monthLeft = Math.max(0, (a.total || 0) - used);
  } else {
    const d = +(await env.KV.get(`use:${dev.id}:${day()}`)) || 0;
    const m = +(await env.KV.get(`use:${dev.id}:${month()}`)) || 0;
    today = Math.max(0, (a.perDay ?? 0) - d);
    if (weekly) { const w = +(await env.KV.get(`use:${dev.id}:${week()}`)) || 0; monthLeft = Math.max(0, (a.perWeek ?? 0) - w); }
    else monthLeft = Math.max(0, (a.perMonth ?? 0) - m);
    planLeft = Math.min(today, monthLeft);
  }
  const credits = Math.max(0, +(dev.credits || 0));
  return { tier, weekly: !!weekly, ok: planLeft > 0 || credits > 0, planLeft, credits,
           left: { today: planLeft + credits, month: monthLeft + credits, plan: planLeft, credits, total: planLeft + credits }, allowance: a };
}
// ---------- owner mode ----------
// The owner's own phone: unlimited AI looks, never paywalled, kept out of user statistics, and able to
// "view the app as" any kind of customer (launch, no plan, trial, member, out of looks, budget reached).
const OWNER_VIEWS = ['owner', 'launch', 'free', 'trial', 'trial_out', 'paid', 'paid_out', 'busy'];
function ownerMe(dev, cfg) {
  const v = OWNER_VIEWS.includes(dev.viewAs) ? dev.viewAs : 'owner', A = cfg.allowances;
  const base = { owner: true, viewAs: v, pro: publicConfig(cfg).pro, paywall: v !== 'owner' && v !== 'launch', credits: 0, proUntil: 0, trialUntil: 0, promoUntil: 0 };
  const L = (n) => ({ today: n, month: n, plan: n, credits: 0, total: n });
  const m = {
    owner: { tier: 'owner', left: L(999), allowance: {} },
    launch: { tier: 'launch', left: L(A.launch.perDay || 2), allowance: A.launch },
    free: { tier: 'free', left: L(0), allowance: A.free },
    trial: { tier: 'trial', left: L(A.trial.total || 2), allowance: A.trial },
    trial_out: { tier: 'trial', left: L(0), allowance: A.trial },
    paid: { tier: 'paid', left: L(A.paid.perMonth || 15), allowance: A.paid },
    paid_out: { tier: 'paid', left: L(0), allowance: A.paid },
    busy: { tier: 'paid', left: L(A.paid.perMonth || 15), allowance: A.paid }
  }[v];
  return Object.assign(base, m);
}
// what an AI look request does for the owner in each view (null = make it, unlimited and not counted)
function ownerGate(dev, cfg) {
  const v = dev.viewAs || 'owner';
  if (v === 'free') return err('AI looks are part of Face Couture Pro.', 402, { code: 'subscribe', tier: 'free', preview: true });
  if (v === 'trial_out') return err(`You've used the ${cfg.allowances.trial.total} AI looks in your free trial.`, 402, { code: 'allowance', tier: 'trial', preview: true });
  if (v === 'paid_out') return err(`You've used this month's ${cfg.allowances.paid.perMonth} AI looks.`, 402, { code: 'allowance', tier: 'paid', preview: true });
  if (v === 'busy') return err(cfg.spend.blockedMessage, 503, { code: 'ceiling', fallback: 'on_device', preview: true });
  return null;
}
async function ownerClaim(req, env) {
  const dev = await auth(req, env); if (!dev) return err('Please reopen the app and try again.', 401);
  if (!(await rateLimit(env, 'ownerclaim:' + dev.id, 5, 3600))) return err('Too many tries. Please wait an hour.', 429);
  const b = await req.json().catch(() => ({}));
  if (!env.ADMIN_PASSPHRASE || String(b.passphrase || '') !== env.ADMIN_PASSPHRASE) return err('That passphrase is not right.', 403);
  dev.owner = true; dev.viewAs = 'owner'; dev.ownerSince = Date.now(); await saveDev(env, dev);
  await env.KV.put('owner:' + dev.id, JSON.stringify({ since: dev.ownerSince, platform: dev.platform || '' }));
  return meFor(env, dev);
}
async function ownerView(req, env) {
  const dev = await auth(req, env); if (!dev || !dev.owner) return err('Owner mode is not on for this device.', 403);
  const b = await req.json().catch(() => ({}));
  if (b.leave) { dev.owner = false; delete dev.viewAs; await saveDev(env, dev); await env.KV.delete('owner:' + dev.id); return meFor(env, dev); }
  if (!OWNER_VIEWS.includes(b.as)) return err('Unknown view.');
  dev.viewAs = b.as; await saveDev(env, dev); return meFor(env, dev);
}
async function saveDev(env, dev) { const { id, ...rec } = dev; await env.KV.put('dev:' + id, JSON.stringify(rec), { expirationTtl: 60 * 86400 * 6 }); }
async function me(req, env) {
  const dev = await auth(req, env); if (!dev) return err('Sign in to the app again (device token missing).', 401);
  return meFor(env, dev);
}
async function meFor(env, dev) {
  const cfg = await getConfig(env);
  if (dev.owner) return json(ownerMe(dev, cfg));
  const a = await allowanceCheck(env, dev, cfg);
  return json({ tier: a.tier, left: a.left, credits: a.credits, allowance: a.allowance, pro: publicConfig(cfg).pro, paywall: paywallOn(cfg),
                proUntil: dev.proUntil || 0, trialUntil: dev.trialUntil || 0, promoUntil: dev.promoUntil || 0 });
}

// ---------- the AI call ----------
const TASKS = ['refine', 'glam', 'enhance', 'background', 'travel', 'headshot', 'tryon', 'vanish', 'blur'];
async function generate(req, env, ctx, forcedTask) {
  const cfg = await getConfig(env);
  if (!env.GEMINI_API_KEY && !env.OPENAI_API_KEY) return err('AI is not connected yet. Local looks and tools are available now.', 503, { code: 'not_configured' });
  const dev = await auth(req, env);
  if (!dev) return err('Please reopen the app so it can reconnect, then try again.', 401, { code: 'auth' });
  const ip = req.headers.get('cf-connecting-ip') || '0';
  // owner test runs (signed with the private engine key) are not limited by the per-device allowance or rate limits
  const ownerTest = !!(env.APP_SIGNING_SECRET && req.headers.get('x-fc-engine-key') === env.APP_SIGNING_SECRET) || !!dev.owner;
  if (dev.owner) { const g = ownerGate(dev, cfg); if (g) return g; }
  if (!ownerTest && !(await rateLimit(env, 'gen:' + dev.id, 6, 60)) || !(await rateLimit(env, 'genip:' + ip, 30, 60))) return err('Please wait a moment before the next generation.', 429, { code: 'rate' });

  let b; try { b = await req.json(); } catch { return err('Bad request'); }
  const task = forcedTask || (TASKS.includes(b.task) ? b.task : null);
  if (!task) return err('Unknown AI tool');
  const toolKey = task === 'refine' ? 'enhance' : task;
  if (cfg.tools[toolKey] === false) return err('This AI tool is switched off right now.', 503, { code: 'tool_off' });
  if (!b.consent) return err('Please confirm photo processing first.', 400, { code: 'consent' });
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(b.image || '')) return err('Send a JPEG or PNG photo.');
  if (b.image.length > 9_000_000) return err('Photo is too large. Try a smaller size.');
  if (task === 'tryon' && !/^data:image\/(jpeg|png|webp);base64,/.test(b.garment || '')) return err('Add a photo of the clothing or accessory.');
  if (task === 'vanish' && b.mask && !/^data:image\/png;base64,/.test(b.mask)) return err('Mask must be a PNG.');
  if (task === 'travel' && b.background && !TRAVEL_KEYS.includes(b.background)) return err('Unknown travel scene.');

  // spending ceiling (owner-controlled) and user allowance
  const costHigh = +(env.COST_PER_GEN_HIGH || 0.17), costMed = +(env.COST_PER_GEN_MEDIUM || 0.04);
  const quality = b.quality === 'high' || tierOf(dev, cfg) === 'paid' ? 'high' : 'medium';
  const cost = quality === 'high' ? costHigh : costMed;
  const spent = await spentThisMonth(env);
  const al = await allowanceCheck(env, dev, cfg);
  // paying customers (members, or anyone who bought a look pack) are never stopped by the monthly spending limit:
  // their looks are already paid for and still capped by their own allowance (20 a month + packs).
  // Free trials and free membership codes do not count as paying. Everyone else gets the on-device look instead.
  const payer = !!dev.owner || (al.tier === 'paid' && (dev.paidUntil || 0) > Date.now()) || (al.credits || 0) > 0;
  if (!payer && spent + cost > cfg.spend.monthlyCeilingUSD) { await bump(env, 'stat:blocked_ceiling:' + month()); return err(cfg.spend.blockedMessage, 503, { code: 'ceiling', fallback: 'on_device' }); }
  if (payer && spent + cost > cfg.spend.monthlyCeilingUSD) await bump(env, 'stat:over_ceiling_paid:' + month());
  const retryKey = 'retry:' + dev.id; let isRetry = false;
  if (b.retry === true) { const left = +(await env.KV.get(retryKey)) || 0; if (left > 0) { isRetry = true; await env.KV.put(retryKey, String(left - 1), { expirationTtl: 600 }); } }
  if (!ownerTest && !isRetry && !al.ok) {
    const msg = al.tier === 'free' ? 'AI looks are part of Face Couture Pro.'
      : al.tier === 'trial' ? `You've used the ${al.allowance.total} AI looks in your free trial.`
      : al.tier === 'paid' ? (al.weekly ? `You've used this week's ${al.allowance.perWeek} AI looks.` : `You've used this month's ${al.allowance.perMonth} AI looks.`)
      : al.left.month > 0 ? 'You\'ve used today\'s AI looks. More tomorrow.' : 'You\'ve used this month\'s AI looks.';
    return err(msg, 402, { code: al.tier === 'free' ? 'subscribe' : 'allowance', tier: al.tier, left: al.left });
  }

  // build the provider request (Google Gemini image model; OpenAI kept as a fallback provider)
  const prompt = buildPrompt(task, { ...b, intensity: b.intensity, lip: b.lip, eyes: b.eyes, category: b.category });
  const started = Date.now();
  const ac = new AbortController(); const timer = setTimeout(() => ac.abort(), 150_000);
  let out = null, usage = null, status = 0, msg = '', usedPro = false, engKey = 'std', engSize = null, engCost = 0.039, engModel = '', meta = null;
  try {
    if (env.GEMINI_API_KEY) {
      // engine: 'fast' (default) or 'pro' (sharper 2K output). Pro is used when the owner switches it on in the dashboard
      // config (ai.engine = 'pro'), or for owner test runs that carry the signing key.
      // engines: std = gemini-2.5-flash-image (~1.3K px), nb21 = Nano Banana 2.1 at 2K, pro = Nano Banana Pro at 2K.
      // Production uses cfg.ai.engine (owner's choice in the dashboard, default std); owner test runs may pick one with the signing key.
      const ENG = { std: { model: env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image', size: null, cost: +(env.COST_PER_GEN_GEMINI || 0.039) },
        nb21: { model: env.GEMINI_NB21_MODEL || 'gemini-nano-banana-2.1', size: '2K', cost: 0.0504 },
        flash31: { model: 'gemini-3.1-flash-image', size: '2K', cost: 0.101 },
        pro: { model: env.GEMINI_PRO_IMAGE_MODEL || 'gemini-3-pro-image-preview', size: '2K', cost: +(env.COST_PER_GEN_GEMINI_PRO || 0.134) } };
      const testKey = env.APP_SIGNING_SECRET && req.headers.get('x-fc-engine-key') === env.APP_SIGNING_SECRET;
      // users choose 'std' (AI) or 'nb21' (Extreme AI); owner test runs may pick any engine
      const userEng = (b.engine === 'std' || b.engine === 'nb21') ? b.engine : null;
      engKey = (testKey && ENG[b.engine]) ? b.engine : (userEng || (ENG[cfg.ai && cfg.ai.engine] ? cfg.ai.engine : 'std'));
      if (testKey && b.model) ENG[engKey] = Object.assign({}, ENG[engKey], { model: String(b.model).slice(0, 60) });
      const model = ENG[engKey].model; engSize = ENG[engKey].size; engCost = ENG[engKey].cost; engModel = model; usedPro = engKey !== 'std';
      const attempt = async (text) => {
        const parts = [{ text }, inlinePart(b.image)];
        if (task === 'tryon') parts.push(inlinePart(b.garment));
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST', signal: ac.signal, headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
          body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: Object.assign({ aspectRatio: pickAspect(b.width, b.height) }, engSize ? { imageSize: engSize } : {}) } }) });
        status = r.status; const j = await r.json().catch(() => ({})); meta = j.usageMetadata || meta;
        const img = (((j.candidates || [])[0] || {}).content || {}).parts?.find(x => x.inlineData || x.inline_data);
        if (r.ok && img) { const d = img.inlineData || img.inline_data; out = `data:${d.mimeType || d.mime_type || 'image/png'};base64,${d.data}`; msg = ''; }
        else { const c0 = (j.candidates || [])[0] || {}; const said = (c0.content && c0.content.parts || []).map(x => x.text || '').join(' ').slice(0, 200); msg = (j.error && j.error.message) || (j.promptFeedback && ('blocked ' + (j.promptFeedback.blockReason || ''))) || ((c0.finishReason || '') + ' ' + (c0.finishMessage || '') + ' ' + said).trim(); }
      };
      await attempt(prompt);
      // the image model sometimes declines a long instruction (IMAGE_OTHER / NO_IMAGE / STOP without an image): one retry with a plain one
      if (!out && status === 200 && !/SAFETY|PROHIBITED|blocked/i.test(msg)) { const sp = simplePrompt(task, b); if (sp) { await attempt(sp); if (out) await bump(env, 'stat:retry_ok:' + month()); } }
      if (!out && /SAFETY|PROHIBITED|blocked|IMAGE_SAFETY/i.test(msg)) msg = 'safety ' + msg;
    } else {
      const form = new FormData();
      form.append('model', env.IMAGE_MODEL || 'gpt-image-1'); form.append('prompt', prompt); form.append('size', pickSize(b.width, b.height));
      form.append('quality', quality); form.append('input_fidelity', 'high'); form.append('n', '1');
      form.append('image[]', dataUrlToBlob(b.image), 'photo.jpg');
      if (task === 'tryon') form.append('image[]', dataUrlToBlob(b.garment), 'garment.jpg');
      if (task === 'vanish' && b.mask) form.append('mask', dataUrlToBlob(b.mask), 'mask.png');
      const r = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { authorization: 'Bearer ' + env.OPENAI_API_KEY }, body: form, signal: ac.signal });
      status = r.status; const j = await r.json().catch(() => ({}));
      if (r.ok && j.data && j.data[0]) { out = 'data:image/png;base64,' + j.data[0].b64_json; usage = j.usage || null; } else msg = (j.error && j.error.message) || '';
    }
  } catch (e) {
    clearTimeout(timer);
    await bump(env, 'stat:fail_timeout:' + month());
    return err('The AI took too long. Your allowance was not used - please try again.', 504, { code: 'timeout' });
  }
  clearTimeout(timer);
  if (!out) {
    await bump(env, 'stat:fail_provider:' + month());
    await env.KV.put('alert:last_provider_error', (status + ' ' + msg).slice(0, 300) + ' @ ' + new Date().toISOString(), { expirationTtl: 30 * 86400 });
    const code = status === 401 || status === 403 ? 'provider_auth' : status === 429 && !/quota|billing|credit/i.test(msg) ? 'provider_busy' : /billing|quota|credit|prepay|exhausted/i.test(msg) ? 'provider_credits' : /safety|policy/i.test(msg) ? 'safety' : 'provider';
    const friendly = { provider_auth: 'AI is not connected correctly. The owner has been notified.', provider_busy: 'AI is busy right now. Please try again in a minute.', provider_credits: 'AI credits need topping up. Please try again later.', safety: 'That edit could not be made. Try a different photo or description.', provider: 'The AI could not finish this edit. Your allowance was not used.' }[code];
    if (code === 'provider_auth' || code === 'provider_credits') await env.KV.put('alert:provider', code + ' ' + new Date().toISOString());
    return err(friendly, 502, { code, detail: (status + ' ' + msg).slice(0, 160), model: engModel });
  }
  // success: only now count usage and spend
  const actualCost = env.GEMINI_API_KEY ? engCost : estimateCost(usage, cost);
  if (!isRetry) await env.KV.put(retryKey, '2', { expirationTtl: 600 });
  // count the look: the plan first, then top-up credits (owner test runs are never counted)
  let usedCredit = false;
  if (!isRetry && !ownerTest) {
    if (al.planLeft > 0) {
      if (al.tier === 'trial') await bump(env, `use:${dev.id}:trial`, 1, 60 * 86400);
      else { await bump(env, `use:${dev.id}:${day()}`, 1, 2 * 86400); await bump(env, `use:${dev.id}:${month()}`, 1, 40 * 86400); await bump(env, `use:${dev.id}:${week()}`, 1, 9 * 86400); }
    } else if (al.credits > 0) { const fresh = await auth(req, env); fresh.credits = Math.max(0, (+fresh.credits || 0) - 1); await saveDev(env, fresh); usedCredit = true; }
  }
  ctx.waitUntil(Promise.all([
    isRetry ? bump(env, 'stat:retry:' + month()) : Promise.resolve(), usedCredit ? bump(env, 'stat:credit_used:' + month()) : Promise.resolve(),
    // the owner's own looks still cost real money (spend), but are kept out of customer statistics
    bumpFloat(env, 'spend:' + month(), actualCost), dev.owner ? bump(env, 'stat:gen_owner:' + month()) : bump(env, 'stat:gen:' + task + ':' + month()), dev.owner ? Promise.resolve() : bump(env, 'stat:gen_total:' + month()),
    dev.owner ? Promise.resolve() : bump(env, 'stat:gen_tier:' + al.tier + ':' + month()), bump(env, 'stat:latency_ms:' + month(), Date.now() - started), spendAlert(env)
  ]));
  return json({ image: out, task, quality, engine: engKey, model: engModel, usage: meta, ms: Date.now() - started, left: (isRetry || ownerTest) ? al.left : { today: Math.max(0, al.left.today - 1), month: Math.max(0, al.left.month - 1), plan: Math.max(0, al.planLeft - (usedCredit ? 0 : 1)), credits: al.credits - (usedCredit ? 1 : 0), total: Math.max(0, al.left.total - 1) } });
}
function inlinePart(u) { const i = u.indexOf(','); return { inline_data: { mime_type: u.slice(5, u.indexOf(';')), data: u.slice(i + 1) } }; }
function pickAspect(w, h) { const r = (+w || 1) / (+h || 1); const opts = [['1:1', 1], ['4:5', .8], ['3:4', .75], ['2:3', 2 / 3], ['9:16', 9 / 16], ['5:4', 1.25], ['4:3', 4 / 3], ['3:2', 1.5], ['16:9', 16 / 9]]; return opts.reduce((a, o) => Math.abs(Math.log(o[1] / r)) < Math.abs(Math.log(a[1] / r)) ? o : a)[0]; }
function pickSize(w, h) { const r = (+w || 1) / (+h || 1); return r > 1.2 ? '1536x1024' : r < 0.83 ? '1024x1536' : '1024x1024'; }
function dataUrlToBlob(u) { const i = u.indexOf(','); const mime = u.slice(5, u.indexOf(';')); const bin = atob(u.slice(i + 1)); const a = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) a[k] = bin.charCodeAt(k); return new Blob([a], { type: mime }); }
function estimateCost(usage, fallback) {
  // gpt-image-1 token pricing (text in $5/M, image in $10/M, image out $40/M). Falls back to the per-quality estimate.
  if (!usage || !usage.output_tokens) return fallback;
  const d = usage.input_tokens_details || {};
  return (d.text_tokens || 0) * 5e-6 + (d.image_tokens || 0) * 10e-6 + usage.output_tokens * 40e-6;
}
async function bumpFloat(env, key, n) { const v = (+(await env.KV.get(key)) || 0) + n; await env.KV.put(key, v.toFixed(4), { expirationTtl: 400 * 86400 }); return v; }
async function spendAlert(env) {
  const cfg = await getConfig(env); const spent = await spentThisMonth(env);
  const pct = cfg.spend.monthlyCeilingUSD ? spent / cfg.spend.monthlyCeilingUSD * 100 : 0;
  const key = 'alert:sent:' + month();
  if (pct >= cfg.spend.alertAtPercent && !(await env.KV.get(key))) {
    await env.KV.put(key, '1', { expirationTtl: 40 * 86400 });
    if (env.RESEND_API_KEY && env.OWNER_EMAIL) await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ from: 'Face Couture <alerts@facecouture.app>', to: [env.OWNER_EMAIL], subject: `Face Couture AI spend at ${pct.toFixed(0)}% of your ceiling`, text: `AI spend this month: $${spent.toFixed(2)} of $${cfg.spend.monthlyCeilingUSD}. AI stops automatically at the ceiling. Change it in the admin dashboard.` }) }).catch(() => {});
  }
}

// ---------- promo codes (AI allowance or Pro access for testers/influencers) ----------
async function redeemPromo(req, env) {
  const dev = await auth(req, env); if (!dev) return err('Reopen the app and try again.', 401);
  const ip = req.headers.get('cf-connecting-ip') || '0';
  if (!(await rateLimit(env, 'promo:' + ip, 10, 3600))) return err('Too many attempts. Try later.', 429);
  const { code } = await req.json().catch(() => ({}));
  const cfg = await getConfig(env); const c = (code || '').toString().trim().toUpperCase();
  const pr = cfg.promos[c];
  if (!pr) return err('That code is not valid.', 404);
  if (pr.expires && Date.parse(pr.expires) < Date.now()) return err('That code has expired.', 410);
  if (pr.maxUses && (pr.uses || 0) >= pr.maxUses) return err('That code has been fully used.', 410);
  if (await env.KV.get(`promo:${c}:${dev.id}`)) return err('You already used this code.', 409);
  const until = Date.now() + (pr.days || 14) * 86400e3;
  if (pr.kind === 'pro') dev.proUntil = Math.max(dev.proUntil || 0, until); else dev.promoUntil = Math.max(dev.promoUntil || 0, until);
  dev.promoCode = c;
  const { id, ...rec } = dev; await env.KV.put('dev:' + id, JSON.stringify(rec), { expirationTtl: 60 * 86400 * 6 });
  await env.KV.put(`promo:${c}:${dev.id}`, '1', { expirationTtl: 400 * 86400 });
  pr.uses = (pr.uses || 0) + 1; await saveConfig(env, { promos: { [c]: pr } }, 'promo');
  await bump(env, 'stat:promo:' + c + ':' + month());
  return json({ ok: true, kind: pr.kind || 'ai', until });
}

// ---------- subscriptions & top-ups (RevenueCat keeps iPhone, Android and this server in sync) ----------
// The app logs in to RevenueCat with its device id, so app_user_id = our device id.
async function addCredits(env, dev, productId, txId, cfg) {
  const pack = (cfg.pro.topups || {})[productId]; if (!pack || !txId) return false;
  if (await env.KV.get('tx:' + txId)) return false;               // each purchase is counted once
  await env.KV.put('tx:' + txId, dev.id, { expirationTtl: 3 * 365 * 86400 });
  dev.credits = (+dev.credits || 0) + pack.looks; await saveDev(env, dev);
  await bump(env, 'stat:topups:' + month()); return true;
}
async function revenuecat(req, env) {
  // the webhook must always be locked: without the shared secret anyone could grant themselves looks
  const auth = (req.headers.get('authorization') || '').trim(), sec = env.REVENUECAT_WEBHOOK_SECRET || '';
  if (!sec || (auth !== sec && auth !== 'Bearer ' + sec)) return err('Unauthorized', 401);
  const { event: e } = await req.json().catch(() => ({}));
  if (!e) return err('Bad webhook');
  const cfg = await getConfig(env);
  const ids = [e.app_user_id, ...(e.aliases || []), ...(e.transferred_to || [])].filter(Boolean);
  const devId = ids.find(i => /^[0-9a-f-]{36}$/i.test(i)) || e.app_user_id;
  const rec = await env.KV.get('dev:' + devId, 'json');
  const isTopup = !!(cfg.pro.topups || {})[e.product_id];
  if (rec) {
    const dev = { id: devId, ...rec };
    if (isTopup && (e.type === 'NON_RENEWING_PURCHASE' || e.type === 'INITIAL_PURCHASE')) await addCredits(env, dev, e.product_id, e.transaction_id || e.id, cfg);
    else if (!isTopup) {
      const active = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE', 'SUBSCRIPTION_EXTENDED', 'TRANSFER'].includes(e.type);
      const gone = ['EXPIRATION', 'REFUND'].includes(e.type);
      if (active && e.product_id) dev.plan = e.new_product_id || e.product_id;
      if (active && e.expiration_at_ms) { dev.proUntil = e.expiration_at_ms; dev.trialUntil = e.period_type === 'TRIAL' ? e.expiration_at_ms : Math.min(dev.trialUntil || 0, Date.now());
        const paidPeriod = e.period_type === 'NORMAL' && !(e.price_in_purchased_currency === 0 || e.price === 0); dev.paidUntil = paidPeriod ? e.expiration_at_ms : Math.min(dev.paidUntil || 0, Date.now()); }
      if (gone) { dev.proUntil = Math.min(dev.proUntil || 0, e.expiration_at_ms || Date.now()); dev.trialUntil = Math.min(dev.trialUntil || 0, Date.now()); dev.paidUntil = Math.min(dev.paidUntil || 0, Date.now()); }
      dev.store = e.store; await saveDev(env, dev);
    }
  }
  const m = month();
  if (e.type === 'INITIAL_PURCHASE' && e.period_type === 'TRIAL') await bump(env, 'stat:trials:' + m);
  if (e.type === 'INITIAL_PURCHASE' && e.period_type !== 'TRIAL' && !isTopup) await bump(env, 'stat:purchases:' + m);
  if (e.type === 'RENEWAL') await bump(env, 'stat:renewals:' + m);
  if (e.type === 'CANCELLATION') await bump(env, 'stat:cancellations:' + m);
  if (e.type === 'REFUND') await bump(env, 'stat:refunds:' + m);
  if (e.price_in_purchased_currency) await bumpFloat(env, 'rev:gross:' + m, +e.price_in_purchased_currency * (e.type === 'REFUND' ? -1 : 1));
  return json({ ok: true });
}
// The app calls this right after a purchase or restore, so the plan and top-ups show up at once (no waiting for the webhook).
async function syncPurchases(req, env) {
  const dev = await auth(req, env); if (!dev) return err('Reopen the app and try again.', 401);
  if (!(await rateLimit(env, 'sync:' + dev.id, 20, 3600))) return meFor(env, dev);
  const cfg = await getConfig(env);
  if (env.REVENUECAT_API_KEY) {
    const r = await fetch('https://api.revenuecat.com/v1/subscribers/' + encodeURIComponent(dev.id), { headers: { authorization: 'Bearer ' + env.REVENUECAT_API_KEY } });
    if (r.ok) {
      const sub = (await r.json()).subscriber || {};
      const ent = (sub.entitlements || {})[cfg.pro.entitlement || 'pro'];
      const exp = ent && ent.expires_date ? Date.parse(ent.expires_date) : 0;
      if (exp) {
        dev.proUntil = exp; if (ent.product_identifier) dev.plan = ent.product_identifier;
        const s = (sub.subscriptions || {})[ent.product_identifier] || {};
        dev.trialUntil = s.period_type === 'trial' ? exp : Math.min(dev.trialUntil || 0, Date.now());
        dev.paidUntil = s.period_type === 'normal' ? exp : Math.min(dev.paidUntil || 0, Date.now());
      }
      await saveDev(env, dev);
      for (const [pid, list] of Object.entries(sub.non_subscriptions || {})) for (const t of list || []) await addCredits(env, dev, pid, t.store_transaction_id || t.id, cfg);
    }
  }
  return meFor(env, dev);
}

// ---------- privacy-safe analytics events (counts only; no photos, no face data, no names) ----------
const EVENTS = new Set(['open', 'photo_chosen', 'look_applied', 'save', 'share', 'reel', 'quiz_done', 'ai_used', 'paywall_seen', 'trial_started', 'promo_redeemed']);
async function event(req, env, ctx) {
  const b = await req.json().catch(() => ({}));
  if (!EVENTS.has(b.name)) return json({ ok: true });
  const dev = await auth(req, env); const plat = dev ? dev.platform : 'web';
  if (dev && dev.owner) return json({ ok: true, owner: true }); // the owner's own use is not counted as a user
  const m = month(), d = day();
  const jobs = [bump(env, `ev:${b.name}:${m}`), bump(env, `ev:${b.name}:${plat}:${m}`)];
  if (b.name === 'look_applied' && /^[a-z0-9_]{1,40}$/i.test(b.look || '')) jobs.push(bump(env, `look:${b.look}:${m}`));
  if (b.name === 'open' && dev) { jobs.push(env.KV.put(`dau:${d}:${dev.id}`, '1', { expirationTtl: 3 * 86400 }), env.KV.put(`mau:${m}:${dev.id}`, '1', { expirationTtl: 40 * 86400 })); }
  if (b.name === 'open' && /^[a-z0-9_-]{1,32}$/i.test(b.campaign || '')) jobs.push(bump(env, `camp:${b.campaign}:${m}`));
  if (b.country && /^[A-Z]{2}$/.test(b.country)) jobs.push(bump(env, `geo:${b.country}:${m}`));
  ctx.waitUntil(Promise.all(jobs));
  return json({ ok: true });
}
async function report(req, env) {
  const b = await req.json().catch(() => ({}));
  const dev = await auth(req, env);
  const id = crypto.randomUUID();
  await env.KV.put('report:' + id, JSON.stringify({ at: Date.now(), task: (b.task || '').slice(0, 30), reason: (b.reason || '').slice(0, 500), device: dev ? dev.id : 'anon' }), { expirationTtl: 180 * 86400 });
  return json({ ok: true, id });
}
async function deleteMyData(req, env) {
  const dev = await auth(req, env); if (!dev) return err('Reopen the app and try again.', 401);
  const l = await env.KV.list({ prefix: 'use:' + dev.id }); for (const k of l.keys) await env.KV.delete(k.name);
  await env.KV.delete('dev:' + dev.id);
  return json({ ok: true, message: 'Everything linked to this device was deleted. Subscriptions are managed in your App Store or Google Play account.' });
}

async function status(env) {
  const cfg = await getConfig(env); const spent = await spentThisMonth(env);
  const ai_ready = !!(env.GEMINI_API_KEY || env.OPENAI_API_KEY) && spent < cfg.spend.monthlyCeilingUSD;
  return json({ ai_ready, ok: true, pro: paywallOn(cfg), tools: cfg.tools });
}

// ---------- owner admin ----------
async function adminAuth(req, env) {
  const t = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!t) return false;
  const [exp, sig] = t.split('.');
  if (!exp || +exp < Date.now()) return false;
  return (await sign((env.ADMIN_PASSPHRASE || '') + '|admin', exp)) === sig;
}
async function admin(req, env, action, url) {
  if (action === 'login' && req.method === 'POST') {
    const ip = req.headers.get('cf-connecting-ip') || '0';
    if (!(await rateLimit(env, 'adminlogin:' + ip, 8, 900))) return err('Too many attempts. Wait 15 minutes.', 429);
    const { passphrase } = await req.json().catch(() => ({}));
    if (!env.ADMIN_PASSPHRASE || passphrase !== env.ADMIN_PASSPHRASE) return err('Wrong passphrase', 401);
    const exp = String(Date.now() + 12 * 3600e3);
    return json({ token: exp + '.' + await sign(env.ADMIN_PASSPHRASE + '|admin', exp) });
  }
  if (!(await adminAuth(req, env))) return err('Unauthorized', 401);
  const cfg = await getConfig(env);
  if (action === 'overview') return json(await overview(env, cfg, url.searchParams.get('month') || month()));
  if (action === 'config' && req.method === 'GET') return json({ config: cfg, versions: await listConfigVersions(env) });
  if (action === 'config' && req.method === 'POST') { const patch = await req.json(); return json({ config: await saveConfig(env, patch, 'owner') }); }
  if (action === 'config/preview' && req.method === 'POST') { const patch = await req.json(); const { deepMerge } = await import('./config.js'); return json({ preview: deepMerge(structuredClone(cfg), patch), note: 'Not saved. Post to /api/admin/config to apply.' }); }
  if (action === 'config/rollback' && req.method === 'POST') { const { version } = await req.json(); return json({ config: await rollbackConfig(env, +version) }); }
  if (action === 'promo' && req.method === 'POST') {
    const { code, kind = 'ai', days = 14, maxUses = 50, expires = '' } = await req.json();
    const c = (code || '').toString().trim().toUpperCase(); if (!/^[A-Z0-9-]{4,24}$/.test(c)) return err('Code: 4-24 letters/numbers');
    return json({ config: await saveConfig(env, { promos: { [c]: { kind, days: +days, maxUses: +maxUses, uses: 0, expires } } }, 'owner') });
  }
  if (action === 'promo/delete' && req.method === 'POST') { const { code } = await req.json(); const promos = { ...cfg.promos }; delete promos[(code || '').toUpperCase()]; const next = await getConfig(env); next.promos = promos; await env.KV.put('config:current', JSON.stringify(next)); return json({ ok: true }); }
  if (action === 'reports') { const l = await env.KV.list({ prefix: 'report:' }); const out = []; for (const k of l.keys.slice(0, 50)) out.push(await env.KV.get(k.name, 'json')); return json({ reports: out }); }
  if (action === 'grant' && req.method === 'POST') { // manual override: give a device Pro/AI days
    const { device, days = 30, kind = 'pro' } = await req.json(); const rec = await env.KV.get('dev:' + device, 'json'); if (!rec) return err('Unknown device', 404);
    const until = Date.now() + days * 86400e3; if (kind === 'pro') rec.proUntil = until; else rec.promoUntil = until; await env.KV.put('dev:' + device, JSON.stringify(rec), { expirationTtl: 60 * 86400 * 6 }); return json({ ok: true, until });
  }
  return err('Unknown admin action', 404);
}
async function overview(env, cfg, m) {
  const g = async k => +(await env.KV.get(k)) || 0;
  const countPrefix = async p => (await env.KV.list({ prefix: p, limit: 1000 })).keys.length;
  const stats = {};
  for (const k of ['gen_total', 'gen_owner', 'fail_provider', 'fail_timeout', 'blocked_ceiling', 'over_ceiling_paid', 'trials', 'purchases', 'renewals', 'cancellations', 'refunds', 'latency_ms']) stats[k] = await g(`stat:${k}:${m}`);
  const gens = {}; for (const t of TASKS) gens[t] = await g(`stat:gen:${t}:${m}`);
  const tiers = {}; for (const t of ['launch', 'free', 'trial', 'paid', 'promo', 'anonymousWeb']) tiers[t] = await g(`stat:gen_tier:${t}:${m}`);
  const events = {}; for (const e of EVENTS) events[e] = await g(`ev:${e}:${m}`);
  const installs = {}; for (const p of ['ios', 'android', 'web']) installs[p] = await g(`stat:installs:${p}:${m}`);
  const looks = (await env.KV.list({ prefix: 'look:', limit: 1000 })).keys.filter(k => k.name.endsWith(':' + m)).map(k => k.name.split(':')[1]);
  const topLooks = []; for (const l of looks) topLooks.push([l, await g(`look:${l}:${m}`)]); topLooks.sort((a, b) => b[1] - a[1]);
  const camps = (await env.KV.list({ prefix: 'camp:', limit: 500 })).keys.filter(k => k.name.endsWith(':' + m)); const campaigns = {}; for (const k of camps) campaigns[k.name.split(':')[1]] = await g(k.name);
  const geos = (await env.KV.list({ prefix: 'geo:', limit: 500 })).keys.filter(k => k.name.endsWith(':' + m)); const countries = {}; for (const k of geos) countries[k.name.split(':')[1]] = await g(k.name);
  const gross = +(await env.KV.get('rev:gross:' + m)) || 0;
  const spend = +(await env.KV.get('spend:' + m)) || 0;
  return {
    month: m, spend: { usd: +spend.toFixed(2), ceiling: cfg.spend.monthlyCeilingUSD, percent: cfg.spend.monthlyCeilingUSD ? +(spend / cfg.spend.monthlyCeilingUSD * 100).toFixed(1) : 0, perGenAvg: stats.gen_total ? +(spend / stats.gen_total).toFixed(3) : 0 },
    owners: await countPrefix('owner:'),
    users: { registeredDevices: await countPrefix('dev:'), dau: await countPrefix('dau:' + day()), mau: await countPrefix('mau:' + m), installs },
    ai: { generations: stats.gen_total, byTool: gens, byTier: tiers, failures: { provider: stats.fail_provider, timeout: stats.fail_timeout }, blockedByCeiling: stats.blocked_ceiling, avgSeconds: stats.gen_total ? +(stats.latency_ms / stats.gen_total / 1000).toFixed(1) : 0 },
    subscriptions: { topups: await g('stat:topups:' + m), creditsUsed: await g('stat:credit_used:' + m), trials: stats.trials, purchases: stats.purchases, renewals: stats.renewals, cancellations: stats.cancellations, refunds: stats.refunds },
    revenue: { gross: +gross.toFixed(2), storeFeeEstimate: +(gross * 0.15).toFixed(2), netEstimate: +(gross * 0.85 - spend).toFixed(2), note: 'Store fee estimated at 15% (Small Business Program). Exact figures are in App Store Connect and Play Console.' },
    events, topLooks: topLooks.slice(0, 25), campaigns, countries, alerts: { provider: await env.KV.get('alert:provider') },
    costProjection: projection(cfg, spend, stats.gen_total)
  };
}
function projection(cfg, spend, gens) {
  const per = gens ? spend / gens : 0.05; const freeGens = Math.min(cfg.allowances.free.perMonth, 6), paidGens = Math.min(cfg.allowances.paid.perMonth, 40);
  const row = n => ({ activeUsers: n, ifAllFree: +(n * freeGens * per).toFixed(0), if10pctPaid: +((n * 0.9 * freeGens + n * 0.1 * paidGens) * per).toFixed(0) });
  return { assumptions: `avg $${per.toFixed(3)} per generation, free users ~${freeGens} gens/month, paid ~${paidGens}`, rows: [row(100), row(1000), row(10000)] };
}
