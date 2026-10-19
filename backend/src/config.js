// Owner-editable settings. Stored in KV as versioned snapshots so every change can be previewed and rolled back.
export const DEFAULT_CONFIG = {
  version: 1,
  updatedAt: 0,
  // Pro switch: while false everyone has the free-launch experience (no paywall). Turning it on never charges anyone;
  // it only makes the already-reviewed purchase flow visible.
  pro: { enabled: false, freeLaunchUntil: '', trialDays: 14, priceMonth: '$7.99', priceYear: '$49.99', entitlement: 'pro' },
  // AI allowances per user, counted only on SUCCESSFUL generations.
  allowances: {
    free:  { perDay: 2,  perMonth: 10 },
    trial: { perDay: 5,  perMonth: 40 },
    paid:  { perDay: 20, perMonth: 200 },
    promo: { perDay: 10, perMonth: 60 },
    anonymousWeb: { perDay: 1, perMonth: 3 }
  },
  // Owner spending ceiling for the whole service. AI stops automatically at the limit.
  spend: { monthlyCeilingUSD: 50, alertAtPercent: 80, blockedMessage: 'AI looks are resting for the moment. Everything else works - try again later.' },
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
  return { pro: c.pro, tools: c.tools, seasons: c.seasons, looks: { hidden: c.looks.hidden }, flags: c.flags,
           allowances: { free: c.allowances.free, trial: c.allowances.trial, paid: c.allowances.paid } };
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
