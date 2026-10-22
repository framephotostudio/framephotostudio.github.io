// Prompt lab (owner tests only): runs the CURRENT prompts.js from this branch straight against Gemini,
// without touching the live server. Usage: node lab/lab.mjs <inputs dir> <jobs.json> <out dir>
import fs from 'node:fs'; import path from 'node:path';
import { buildPrompt, simplePrompt } from '../backend/src/prompts.js';
const [IN, JOBS, OUT] = process.argv.slice(2); fs.mkdirSync(OUT, { recursive: true });
const MODEL = process.env.LAB_MODEL || 'gemini-nano-banana-2.1', KEY = process.env.GEMINI_API_KEY;
function pickAspect(w, h) { const r = (+w || 1) / (+h || 1); const o = [['1:1', 1], ['4:5', .8], ['3:4', .75], ['2:3', 2 / 3], ['9:16', 9 / 16], ['5:4', 1.25], ['4:3', 4 / 3], ['3:2', 1.5], ['16:9', 16 / 9]]; return o.reduce((a, x) => Math.abs(Math.log(x[1] / r)) < Math.abs(Math.log(a[1] / r)) ? x : a)[0]; }
async function call(text, b64, mime, w, h) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text }, { inline_data: { mime_type: mime, data: b64 } }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: pickAspect(w, h), imageSize: '2K' } } }) });
  const j = await r.json().catch(() => ({})); const img = (((j.candidates || [])[0] || {}).content || {}).parts?.find(x => x.inlineData || x.inline_data);
  return { status: r.status, img: img && (img.inlineData || img.inline_data).data, usage: j.usageMetadata, err: j.error && j.error.message, finish: ((j.candidates || [])[0] || {}).finishReason };
}
for (const J of JSON.parse(fs.readFileSync(JOBS, 'utf8'))) {
  const file = path.join(IN, J.image), b64 = fs.readFileSync(file).toString('base64'), mime = /png$/i.test(file) ? 'image/png' : 'image/jpeg';
  const prompt = buildPrompt('glam', J.req); const t0 = Date.now();
  let r = await call(prompt, b64, mime, J.req.width, J.req.height), used = 'full';
  if (!r.img && r.status === 200) { r = await call(simplePrompt('glam', J.req), b64, mime, J.req.width, J.req.height); used = 'simple'; }
  if (!r.img) { r = await call(prompt, b64, mime, J.req.width, J.req.height); used = 'full-retry'; }
  if (r.img) fs.writeFileSync(path.join(OUT, J.name + '.png'), Buffer.from(r.img, 'base64'));
  fs.writeFileSync(path.join(OUT, J.name + '.json'), JSON.stringify({ model: MODEL, used, ms: Date.now() - t0, status: r.status, error: r.err, finish: r.finish, usage: r.usage }));
  console.log(J.name, r.img ? 'ok' : 'FAILED ' + r.status + ' ' + (r.err || r.finish || ''), used);
}
