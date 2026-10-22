// Owner-editable settings. Stored in KV as versioned snapshots so every change can be previewed and rolled back.
export const DEFAULT_CONFIG = {
  version: 1,
  updatedAt: 0,
  // Pro switch: while false everyone has the free-launch experience (no paywall). Turning it on never charges anyone;
  // it only makes the already-reviewed purchase flow visible.
  // ONE SWITCH: paywallFrom = the date the paywall turns on (YYYY-MM-DD, e.g. 30 days after launch).
  // Before that date (or while it is empty) the app is completely free: no paywall, everything unlocked.
  pro: { paywallFrom: '', trialDays: 7, priceMonth: '$8.99', priceYear: '$34.99', entitlement: 'pro',
         products: { yearly: 'fc_pro_yearly', monthly: 'fc_pro_monthly' },
         topups: { fc_ai_20: { looks: 20, price: '$4.99' }, fc_ai_50: { looks: 50, price: '$7.99', badge: 'Best value' } } },
  // AI allowances per user, counted only on SUCCESSFUL generations.
  // launch = free launch period, 2 weeks (everyone), trial = 7-day trial (total), paid = subscribers (per calendar month),
  // free = app users without a plan after the free launch (on-device looks stay unlimited), web = the website.
  // Top-up packs add AI looks on top of any plan and never expire.
  allowances: {
    launch: { perDay: 2, perMonth: 10 },
    trial: { total: 2 },
    paid:  { perDay: 20, perMonth: 20 },
    free:  { perDay: 0, perMonth: 0 },
    promo: { perDay: 10, perMonth: 60 },
    anonymousWeb: { perDay: 1, perMonth: 3 }
  },
  // Owner spending ceiling for the whole service. AI stops automatically at the limit.
  spend: { monthlyCeilingUSD: 20, alertAtPercent: 80, blockedMessage: 'AI looks are busy right now, try the on-device version.' },
  // AI engine: 'fast' (about 4 cents, ~1.3K pixels) or 'pro' (about 13 cents, sharp 2K output)
  ai: { engine: 'nb21' },
  // Which AI tools are switched on.
  tools: { glam: true, enhance: true, background: true, headshot: true, tryon: true, vanish: true, blur: true, travel: true },
  // Seasonal looks: dates are inclusive, repeat every year, evaluated in the viewer's local date (the site does this already);
  // overrides here win when present so the owner can extend or pause a season without a store update.
  seasons: { halloween: { from: '10-01', to: '11-07', enabled: true }, thanksgiving: { from: '11-01', to: '11-30', enabled: true },
             christmas: { from: '12-01', to: '12-31', enabled: true }, newyear: { from: '12-20', to: '01-03', enabled: true } },
  // Looks hidden from everyone (by look key) and looks only visible to the owner's preview devices.
  looks: { hidden: [], preview: [] },
  // Promo codes: { CODE: { kind:'ai'|'pro', days, maxUses, uses, expires } }
  promos: {},
  // Store review prompt, feature flags
  flags: { reviewPromptAfterSaves: 3, showQuiz: true, showMenFirst: false }
};

export async function getConfig(env) {
  const raw = await env.KV.get('config:current', 'json');
  return raw ? deepMerge(structuredClone(DEFAULT_CONFIG), raw) : structuredClone(DEFAULT_CONFIG);
}

export async function saveConfig(env, next, who) {
  const cur = await getConfig(env);
  if (!(await env.KV.get('config:v' + (cur.version || 1)))) await env.KV.put('config:v' + (cur.version || 1), JSON.stringify(cur)); // keep the starting point restorable
  const version = (cur.version || 0) + 1;
  const snap = { ...deepMerge(structuredClone(cur), next), version, updatedAt: Date.now(), updatedBy: who || 'owner' };
  await env.KV.put('config:v' + version, JSON.stringify(snap));
  await env.KV.put('config:current', JSON.stringify(snap));
  return snap;
}

export async function rollbackConfig(env, version) {
  const snap = await env.KV.get('config:v' + version, 'json');
  if (!snap) throw new Error('No saved version ' + version);
  const cur = await getConfig(env);
  const v = (cur.version || 0) + 1;
  const restored = { ...snap, version: v, updatedAt: Date.now(), restoredFrom: version };
  await env.KV.put('config:v' + v, JSON.stringify(restored));
  await env.KV.put('config:current', JSON.stringify(restored));
  return restored;
}

export async function listConfigVersions(env) {
  const l = await env.KV.list({ prefix: 'config:v' });
  return l.keys.map(k => +k.name.slice(8)).filter(Boolean).sort((a, b) => b - a).slice(0, 30);
}

// What the apps may see (no secrets, no admin-only notes)
export function publicConfig(c) {
  return { pro: Object.assign({}, c.pro, { enabled: paywallOn(c) }), tools: c.tools, seasons: c.seasons, looks: { hidden: c.looks.hidden }, flags: c.flags,
           allowances: { launch: c.allowances.launch, free: c.allowances.free, trial: c.allowances.trial, paid: c.allowances.paid } };
}

export function deepMerge(a, b) {
  if (Array.isArray(b)) return b.slice();
  if (b && typeof b === 'object') {
    const out = (a && typeof a === 'object' && !Array.isArray(a)) ? a : {};
    for (const k of Object.keys(b)) out[k] = deepMerge(out[k], b[k]);
    return out;
  }
  return b === undefined ? a : b;
}

// paywall is on from pro.paywallFrom (YYYY-MM-DD, inclusive). Empty = free launch (no paywall).
export function paywallOn(c, now = new Date()) {
  const f = (c.pro && c.pro.paywallFrom || '').trim();
  return !!f && /^\d{4}-\d{2}-\d{2}$/.test(f) && now.toISOString().slice(0, 10) >= f;
}
