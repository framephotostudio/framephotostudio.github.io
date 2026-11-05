// Builds the app's web bundle from the live site's code (checked out into ./site from the main branch).
// Everything the site loads from the internet (face detection engine, AI models) is downloaded and bundled,
// so the app works fully offline and never loads the website itself.
import fs from 'node:fs'; import path from 'node:path';
const SITE = process.env.SITE_DIR || 'site', OUT = 'www', V = path.join(OUT, 'vendor');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(V, { recursive: true });
for (const f of fs.readdirSync(SITE)) if (/\.(png|jpg|onnx|webp|svg|ico)$/i.test(f)) fs.copyFileSync(path.join(SITE, f), path.join(OUT, f));
async function get(url, dest) { const r = await fetch(url); if (!r.ok) throw new Error(url + ' ' + r.status); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); console.log('bundled', url); }
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21', ORT = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/';
await get(MP + '/vision_bundle.mjs', V + '/mediapipe/vision_bundle.mjs');
for (const f of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm', 'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm']) await get(MP + '/wasm/' + f, V + '/mediapipe/wasm/' + f);
for (const f of ['ort.webgpu.min.mjs', 'ort.min.mjs', 'ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.jsep.wasm', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm', 'ort-wasm-simd-threaded.asyncify.mjs', 'ort-wasm-simd-threaded.asyncify.wasm', 'ort-wasm-simd-threaded.jspi.mjs', 'ort-wasm-simd-threaded.jspi.wasm']) { try { await get(ORT + f, V + '/ort/' + f) } catch (e) { console.warn('optional', e.message) } }
await get('https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', V + '/models/face_landmarker.task');
await get('https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite', V + '/models/selfie_segmenter.tflite');
let html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
html = html.split(MP + '/wasm').join('./vendor/mediapipe/wasm').split(MP + '/vision_bundle.mjs').join('./vendor/mediapipe/vision_bundle.mjs').split(ORT).join('./vendor/ort/')
  .split('https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task').join('./vendor/models/face_landmarker.task')
  .split('https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite').join('./vendor/models/selfie_segmenter.tflite');
// the lip/face parser: ONNX Runtime resolves a relative wasm folder against its own location (vendor/ort/vendor/ort/...),
// so give it an absolute address inside the app; without this the precise lip map never loads in the app
{ const before = html; html = html.split('ort.env.wasm.wasmPaths=ORT').join('ort.env.wasm.wasmPaths=new URL(ORT,location.href).href'); if (html === before) throw new Error('ORT wasmPaths hook not found'); }
// app-only adjustments to the studio code: the AI button talks to the Face Couture API when one is configured;
// store-facing names use the current brand
html = html.replace("$('#generate').onclick=async()=>{openPro();return;", "$('#generate').onclick=async()=>{return;");
// App Store build: no hidden or unfinished features (Apple guideline 2.3.1). The website keeps all of these.
// Each change must match exactly once, so a website update can never silently bring one back.
function appOnly(find, repl, why) {
  const n = html.split(find).length - 1;
  if (n !== 1) throw new Error('App Store clean-up "' + why + '" expected 1 match, found ' + n + '. Update scripts/build-web.mjs.');
  html = html.replace(find, () => repl);
}
// 1) the old website Pro/plans sheet can never open in the app, and its plan table is removed
appOnly('function openPro(){', 'function openPro(){return;', 'plans sheet');
{ const a = html.indexOf('<div class="prolabel">✦ FRAME FREE &amp; PRO</div>'), b = html.indexOf('</tbody></table>', a);
  if (a < 0 || b < 0) throw new Error('App Store clean-up "plans table" not found. Update scripts/build-web.mjs.');
  html = html.slice(0, a) + '<h2 id="proTitle"></h2><p class="proReason" id="proReason" hidden></p>' + html.slice(b + '</tbody></table>'.length); }
appOnly('<button class="toolbtn" id="openPro">✦ Pro</button>', '<button class="toolbtn" id="openPro" hidden></button>', 'Pro button');
// 2) no owner switches: the website's #owner-on analytics switch and the ?admin= season preview are left out
{ const a = html.indexOf("/* owner's own devices are never counted"), b = html.indexOf('var OWNER=false;', a);
  if (a < 0 || b < 0) throw new Error('App Store clean-up "owner switch" not found. Update scripts/build-web.mjs.');
  html = html.slice(0, a) + html.slice(b); }
appOnly("var OWNER=false;try{OWNER=localStorage.getItem('fc-owner')==='1'}catch(e){}window.__fcOwnerNoStats=OWNER;", 'var OWNER=false;', 'owner flag');
appOnly('render();checkAdminParam();', 'render();', 'admin preview');
appOnly("try{isAdmin=localStorage.getItem('fcAdmin')===ADMIN_HASH}catch(e){}", '', 'admin flag');
{ const a = html.indexOf('function setAdmin(on){'), b = html.indexOf('window.__seasonal=', a);
  if (a < 0 || b < 0 || b - a > 3000) throw new Error('App Store clean-up "admin switch" not found. Update scripts/build-web.mjs.');
  html = html.slice(0, a) + 'function setAdmin(){}\n' + html.slice(b); }
appOnly("t==='owner'?'Owner mode: unlimited AI looks':", "t==='owner'?'Unlimited AI looks':", 'owner label');
// 3) no payment screens: the AI counter and AI errors never offer a purchase in this version
{ const a = html.indexOf("if(isApp&&window.FCPlan&&m.paywall"), b = html.indexOf('el.appendChild(b)}', a);
  if (a < 0 || b < 0 || b - a > 600) throw new Error('App Store clean-up "counter purchase button" not found. Update scripts/build-web.mjs.');
  html = html.slice(0, a) + html.slice(b + 'el.appendChild(b)}'.length); }
for (let k = 0; k < 2; k++) { const a = html.indexOf('if(isApp&&window.FCPlan){'), end = "openTopups('ai_'+L.k);return}}", b = html.indexOf(end, a);
  if (a < 0 || b < 0 || b - a > 600) throw new Error('App Store clean-up "AI limit purchase screens" not found. Update scripts/build-web.mjs.');
  html = html.slice(0, a) + html.slice(b + end.length); }
if (html.indexOf('FCPlan') > -1) throw new Error('App Store clean-up: a purchase screen link (FCPlan) is still in the studio code. Update scripts/build-web.mjs.');
// 4) app wording: nothing that reads like a website ("browser", "download", "not connected", "coming soon", "Premium")
function appAll(find, repl, why) {
  const n = html.split(find).length - 1;
  if (n < 1) throw new Error('App wording "' + why + '" not found. Update scripts/build-web.mjs.');
  html = html.split(find).join(repl);
}
appAll(' MP4 export is offered only where this browser supports it.', '', 'video browser note');
appAll('Photo clips with optional user-supplied audio, created locally. Export availability depends on your browser.', 'Photo clips with optional audio, made on your iPhone.', 'video status');
{ const a = html.indexOf('<p class="note">Creates photo-based clips with optional audio files. Video trimming'), b = html.indexOf('</p>', a);
  if (a < 0 || b < 0 || b - a > 600) throw new Error('App wording "video limits note" not found. Update scripts/build-web.mjs.');
  html = html.slice(0, a) + html.slice(b + 4); }
appAll('>Download custom size<', '>Save custom size<', 'custom size button');
appAll(' Direct publishing is not connected.', '', 'share note');
appAll('It needs an internet connection once. If you are viewing this inside a preview or an app, open the live website link in your phone browser instead. ', 'Please close and reopen Face Couture. ', 'face detector fallback');
appAll("message('Solo photos for now','AI Luxe Looks work on photos of one person for now. Group photos are coming soon. The Looks below work on group photos.')", "message('One person at a time','AI Looks work on photos of one person. The Looks below work on group photos.')", 'group photo message');
appAll('Premium AI version · uses 1 AI look', 'AI version · uses 1 AI look', 'AI Glow label');
appAll('<span>Premium AI &middot; each uses 1 AI look</span>', '<span>Each uses 1 of today&rsquo;s AI looks</span>', 'AI Studio label');
appAll('<p class="prolabel">✦ FRAME PRO · PREMIUM AI</p><button class="btn full" id="aiUpgrade">See Pro plans</button>', '<p class="prolabel"></p><button class="btn full" id="aiUpgrade" hidden></button>', 'old AI tab label');
appAll('Tap AI Glow for your premium AI makeover.', 'Tap AI Glow for your AI makeover.', 'AI Glow tip');
appAll('Your photos are edited on your device and are not uploaded to Face Couture.', 'Your photos are edited on your iPhone. A photo is sent only when you choose an AI feature and agree.', 'privacy note');
appAll("st.textContent=files.length+' photos styled'", "st.textContent=files.length+(files.length===1?' photo':' photos')+' styled'", 'carousel count');
// saved files carry the Face Couture name
for (const [a, b] of [["'frame-custom-'", "'face-couture-custom-'"], ["'frame-photo-set.zip'", "'face-couture-photo-set.zip'"], ["'frame-clip.'", "'face-couture-clip.'"], ["'frame-before-after.", "'face-couture-before-after."], ["'frame-set-'", "'face-couture-set-'"], ["'frame-my-look-'", "'face-couture-my-look-'"]]) appAll(a, b, 'file name ' + a);
// per-build settings (backend URL comes from a repository variable). Version 1.0 has no purchases, so no store keys.
fs.writeFileSync(path.join(OUT, 'app-config.js'), 'window.FC_CONFIG=' + JSON.stringify({
  apiUrl: process.env.FC_API_URL || 'https://face-couture-api.facecouture.workers.dev',
  analytics: !!process.env.FC_API_URL, supportEmail: process.env.FC_SUPPORT_EMAIL || 'hello@facecouture.app', version: process.env.APP_VERSION || '1.0.0' }) + ';');
// Google Analytics stays on in the app: the studio reports app_platform = ios | android with an anonymous app-only id
// (no photos, no face data, no names; no ad signals, so no tracking prompt is needed).
// app mode hook (native look and feel is layered on in app.css / app.js)
{ const h = html.search(/<head(\s[^>]*)?>/i), hEnd = html.indexOf('>', h) + 1; html = html.slice(0, hEnd) + '<script>window.__FC_APP=true</script><script src="app-config.js"></script><script src="app-early.js"></script><script src="app-api.js"></script>' + html.slice(hEnd); }
{ const i = html.indexOf('</head>'); html = html.slice(0, i) + '<link rel="stylesheet" href="app.css">' + html.slice(i); }
{ const i = html.lastIndexOf('</body>'); html = html.slice(0, i) + '<script src="app.js"></script><script src="app-settings.js"></script>' + html.slice(i); }
fs.writeFileSync(path.join(OUT, 'index.html'), html);
for (const f of ['app.css', 'app.js', 'app-early.js', 'app-api.js', 'app-settings.js']) fs.copyFileSync(path.join('app', f), path.join(OUT, f));
// the app's own Privacy policy, Terms, Support and Delete-my-data pages are bundled so they open offline inside the app
// Inside the iPhone app these pages describe version 1.0 exactly: no purchases, promo codes or other platforms.
const LEGAL_APP = {
  'support.html': [
    ['Tap Save, then "Save Image" on the sheet: the photo lands in your Photos app (Camera Roll on Android). Videos save the same way.', 'Tap Save and the photo goes straight into your Photos app. Videos save the same way. To send a photo to another app, use a Share button.'],
    [' Pro raises the allowance when available.', ''],
    ['<div class="card"><b>Subscription or refund</b> — manage it in your <a href="https://apps.apple.com/account/subscriptions">App Store</a> or <a href="https://play.google.com/store/account/subscriptions">Google Play</a> account. Refunds are issued by Apple or Google.</div>', ''],
    ['<div class="card"><b>Promo code</b> — Settings (gear icon) → Enter a promo code.</div>', ''],
    ['on the AI screen tap "Report this AI result"', 'tap "Report this result" under any AI result']],
  'delete-my-data.html': [
    ['or delete the app (iPhone/Android) or clear site data (browser).', 'or delete the app.'],
    [" On the website, clear this site's data in your browser settings.", ''],
    ['A random install ID with AI-allowance counts and promo-code use.', 'A random install ID with AI-allowance counts.'],
    ['<h2>Subscriptions</h2><p>Subscriptions are held by Apple or Google. Cancel in your <a href="https://apps.apple.com/account/subscriptions">App Store</a> or <a href="https://play.google.com/store/account/subscriptions">Google Play</a> account; deleting the app does not cancel a subscription.</p>', '']],
  'privacy.html': [
    ['website and iPhone/Android apps', 'website and apps'],
    ['Used to count AI allowances, prevent abuse and honour promo codes.', 'Used to count AI allowances and prevent abuse.'],
    ['<tr><td>Purchase status (Pro trial/subscription)</td><td>Apple / Google and RevenueCat (our subscription processor)</td><td>For the life of the subscription plus legal retention. We never see card details.</td></tr>', ''],
    ["kept in the app's or browser's local storage. Delete them under My looks &amp; drafts, by deleting the app, or by clearing site data.", "kept in the app's storage on your device. Delete them under My looks &amp; drafts or by deleting the app."],
    ['<h2>7. Subscriptions and promo codes</h2><p>Face Couture Pro, when available, is sold through the App Store or Google Play and managed in your store account. Free trials convert to a paid subscription unless cancelled at least 24 hours before the trial ends. Promo codes redeemed in the app are tied to your install ID.</p>', '<h2>7. Purchases</h2><p>Face Couture has no purchases. If we ever add any, we will update this policy first.</p>']],
  'terms.html': [['the website and the iPhone and Android apps, by Always Luxe', 'the website and apps by Always Luxe'],
    ['<h2>Free launch, trials and subscriptions</h2><p>Face Couture is free to use at launch. If we introduce Face Couture Pro, prices, the free-trial length and what is included are shown before you subscribe. Subscriptions are billed by Apple or Google to your store account and renew automatically until cancelled in your store settings; cancel at least 24 hours before the current period ends to avoid renewal. Refunds are handled by Apple or Google under their policies. Promo codes are personal, non-transferable and may expire.</p>', '<h2>Free to use</h2><p>Face Couture is free to use, with a daily limit on AI features. If we ever add paid features, their price and terms will be shown clearly before you choose them.</p>']]
};
for (const f of ['privacy.html', 'terms.html', 'support.html', 'delete-my-data.html']) {
  const src = fs.existsSync(path.join(SITE, f)) ? path.join(SITE, f) : path.join('site-pages', f);
  let t = fs.readFileSync(src, 'utf8');
  // lines the website has already updated are skipped; the check below makes sure nothing about purchases or other platforms is left
  for (const [a, b] of LEGAL_APP[f] || []) t = t.split(a).join(b);
  // the logo opens nothing inside the app (the pages are shown in the app's own viewer)
  t = t.replace('</head>', '<style>html.in-app header a,html.in-app .brand a{pointer-events:none}</style></head>');
  fs.writeFileSync(path.join(OUT, f), t);
}
{ const legal = ['privacy.html', 'support.html', 'delete-my-data.html', 'terms.html'].map(f => fs.readFileSync(path.join(OUT, f), 'utf8')).join(' ');
  if (/Google Play|Android|RevenueCat|promo code|Enter a promo/i.test(legal)) throw new Error('App legal pages still mention purchases or other platforms. Update scripts/build-web.mjs.'); }
// final check: nothing hidden, no payment code and nothing loaded from the internet ships in the App Store build
{ const bad = [];
  for (const f of fs.readdirSync(OUT)) if (/\.(html|js|css)$/.test(f) && !/^(privacy|terms|support|delete-my-data)\.html$/.test(f)) { // the legal pages are documents, not app code
    const t = fs.readFileSync(path.join(OUT, f), 'utf8');
    for (const w of [/RevenueCat|Purchases\.|purchasePackage|restorePurchases/, /ownerClaim|owner passphrase|Owner mode|fc-owner|checkAdminParam/, /openPaywall|openTopups|paywall\.jpg|plan-demo/, /stripe|checkout\.stripe/i, /this browser supports|depends on your browser|open the live website|Group photos are coming soon|Premium AI|See Pro plans|FRAME PRO/i]) if (w.test(t)) bad.push(f + ': ' + w);
  }
  const left = (html.match(/https:\/\/(cdn\.jsdelivr|storage\.googleapis)[^"'`\s)]*/g) || []);
  if (left.length) bad.push('index.html still loads from the internet: ' + [...new Set(left)].join(', '));
  if (bad.length) throw new Error('App Store build check failed:\n' + bad.join('\n'));
}
console.log('web bundle ready (App Store checks passed)');
