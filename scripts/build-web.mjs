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
for (const f of ['ort.webgpu.min.mjs', 'ort.min.mjs', 'ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.jsep.wasm', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']) { try { await get(ORT + f, V + '/ort/' + f) } catch (e) { console.warn('optional', e.message) } }
await get('https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', V + '/models/face_landmarker.task');
await get('https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite', V + '/models/selfie_segmenter.tflite');
let html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
html = html.split(MP + '/wasm').join('./vendor/mediapipe/wasm').split(MP + '/vision_bundle.mjs').join('./vendor/mediapipe/vision_bundle.mjs').split(ORT).join('./vendor/ort/')
  .split('https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task').join('./vendor/models/face_landmarker.task')
  .split('https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite').join('./vendor/models/selfie_segmenter.tflite');
// no website analytics inside the app
html = html.replace(/<script[^>]*googletagmanager[^>]*><\/script>/g, '').replace(/<script>[^<]*gtag\([^<]*<\/script>/g, '');
// app mode hook (native look and feel is layered on in app.css / app.js)
html = html.replace('</head>', '<link rel="stylesheet" href="app.css"><script>window.__FC_APP=true</script></head>').replace('</body>', '<script src="app.js"></script></body>');
fs.writeFileSync(path.join(OUT, 'index.html'), html);
for (const f of ['app.css', 'app.js']) fs.copyFileSync(path.join('app', f), path.join(OUT, f));
const left = (html.match(/https:\/\/(cdn\.jsdelivr|storage\.googleapis)[^"'`\s)]*/g) || []); if (left.length) console.warn('Still online:', [...new Set(left)]);
console.log('web bundle ready');
