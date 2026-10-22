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
html = html.replace("$('#generate').onclick=async()=>{openPro();return;", "$('#generate').onclick=async()=>{if(!window.FC_API){openPro();return}")
  .split('FRAME PRO').join('FACE COUTURE PRO').split('FRAME FREE').join('FACE COUTURE FREE');
// per-build settings (backend URL and store keys come from repository variables; empty = feature stays off)
fs.writeFileSync(path.join(OUT, 'app-config.js'), 'window.FC_CONFIG=' + JSON.stringify({
  apiUrl: process.env.FC_API_URL || 'https://face-couture-api.facecouture.workers.dev', revenueCatIOS: process.env.FC_RC_IOS || '', revenueCatAndroid: process.env.FC_RC_ANDROID || '',
  analytics: !!process.env.FC_API_URL, preview: process.env.FC_PREVIEW === '1', supportEmail: process.env.FC_SUPPORT_EMAIL || 'hello@facecouture.app', version: process.env.APP_VERSION || '1.0.0' }) + ';');
// Google Analytics stays on in the app: the studio reports app_platform = ios | android with an anonymous app-only id
// (no photos, no face data, no names; no ad signals, so no tracking prompt is needed).
// app mode hook (native look and feel is layered on in app.css / app.js)
{ const h = html.search(/<head(\s[^>]*)?>/i), hEnd = html.indexOf('>', h) + 1; html = html.slice(0, hEnd) + '<script>window.__FC_APP=true</script><script src="app-config.js"></script><script src="app-early.js"></script><script src="app-api.js"></script>' + html.slice(hEnd); }
{ const i = html.indexOf('</head>'); html = html.slice(0, i) + '<link rel="stylesheet" href="app.css">' + html.slice(i); }
{ const i = html.lastIndexOf('</body>'); html = html.slice(0, i) + '<script src="app.js"></script><script src="app-pro.js"></script><script src="app-plan.js"></script>' + html.slice(i); }
fs.writeFileSync(path.join(OUT, 'index.html'), html);
for (const f of ['app.css', 'app.js', 'app-early.js', 'app-api.js', 'app-pro.js', 'app-plan.js']) fs.copyFileSync(path.join('app', f), path.join(OUT, f));
const left = (html.match(/https:\/\/(cdn\.jsdelivr|storage\.googleapis)[^"'`\s)]*/g) || []); if (left.length) console.warn('Still online:', [...new Set(left)]);
console.log('web bundle ready');
