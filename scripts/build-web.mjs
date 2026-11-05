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
// only the files the studio actually loads (ort.webgpu.min.mjs imports the asyncify runtime); unused runtimes are left out
for (const f of ['ort.webgpu.min.mjs', 'ort-wasm-simd-threaded.asyncify.mjs', 'ort-wasm-simd-threaded.asyncify.wasm']) await get(ORT + f, V + '/ort/' + f);
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
// Google Analytics stays on the website only; the iPhone app sends no analytics
appOnly('try{if(OWNER){window.gtag=function(){};return}', 'try{if(true){window.gtag=function(){};return}', 'no analytics in the app');
appAll('Headshot Pro', 'Boardroom Portrait', 'look name (Headshot Studio is another app)');
appAll('"operatingSystem":"Web, iOS, Android"', '"operatingSystem":"iOS"', 'app platform');
appAll('Coming soon<b>Face Couture mobile app</b>', 'Face Couture<b>on iPhone</b>', 'store badge text');
appAll("matte:{n:'Matte Pro'", "matte:{n:'Velvet Matte'", 'look name without Pro');
appAll('<b>Face detected · AI mapped</b>', '<b>Face detected · mapped on your phone</b>', 'on-device wording');
appAll("faceLight:['Even lighting (AI fill light)'", "faceLight:['Even lighting (fill light)'", 'on-device wording');
// ---- Platform Pack (build 40, App Review): every set saves distinct sizes, each framed on the face, never two identical files ----
appOnly("const SETS={social:['ig-portrait','ig-story','tiktok'],pro:['linkedin','whatsapp-profile','x'],dating:['hinge','ig-portrait','whatsapp-profile']};",
  "const SETS={social:['ig-portrait','ig-square','ig-story','pinterest','youtube'],pro:['linkedin','headshot','linkedin-post','x','whatsapp-status'],dating:['hinge','tinder','league']};", 'pack sets');
{ const a = html.indexOf("const PACK=[['ig-portrait','Instagram post']"), b = html.indexOf('].map(([id,n])=>', a);
  if (a < 0 || b < 0 || b - a > 600) throw new Error('Platform Pack "chip list" not found. Update scripts/build-web.mjs.');
  html = html.slice(0, a) + "const PACK=[['ig-portrait','Instagram post'],['ig-square','Square post'],['ig-story','Story · Reels'],['tiktok','TikTok'],['pinterest','Pinterest pin'],['youtube','YouTube thumbnail'],['linkedin','LinkedIn profile'],['headshot','Headshot'],['linkedin-post','LinkedIn post'],['x','X post'],['whatsapp-status','WhatsApp status'],['whatsapp-profile','WhatsApp profile'],['facebook-portrait','Facebook post'],['hinge','Hinge · Bumble · Raya'],['tinder','Tinder'],['league','The League']" + html.slice(b); }
// face framing: if the head with hair doesn't fit a size, frame the face itself (hair at the sides may be trimmed);
// if even that doesn't fit (wide sizes), zoom out on a clean backdrop instead of keeping the whole photo small
{ const a = html.indexOf('function faceFrame(i,iw,ih,box){'), b = html.indexOf('\n', a);
  if (a < 0 || b < 0 || html.indexOf('function faceFrame(i,iw,ih,box){', a + 1) > -1) throw new Error('Platform Pack "face framing" not found. Update scripts/build-web.mjs.');
  html = html.slice(0, a) + "function faceFrame(i,iw,ih,box){const cw=presets[i][3],ch=presets[i][4],sc=Math.max(cw/iw,ch/ih),w=iw*sc,h=ih*sc,ty=ch>cw*1.05?.45:.5,o=beauty.faceOutline||[];let tight=box;if(o.length>2){const xs=o.map(p=>p.x),ys=o.map(p=>p.y),fx0=Math.min(...xs),fx1=Math.max(...xs),fy0=Math.min(...ys),fy1=Math.max(...ys),fw=fx1-fx0,fh=fy1-fy0;tight={x0:Math.max(0,fx0-.06*fw),x1:Math.min(1,fx1+.06*fw),y0:Math.max(0,fy0-.3*fh),y1:Math.min(1,fy1+.1*fh)}}const cl=v=>Math.max(0,Math.min(1,v));function at(b,z){const W=w*z,H=h*z,cx=(b.x0+b.x1)/2,cy=(b.y0+b.y1)/2,x=Math.abs(cw-W)>1?cl((.5*cw-cx*W)/(cw-W)):.5,y=Math.abs(ch-H)>1?cl((ty*ch-cy*H)/(ch-H)):.5,ox=(cw-W)*x,oy=(ch-H)*y;if(ox+b.x0*W<-1||ox+b.x1*W>cw+1||oy+b.y0*H<-1||oy+b.y1*H>ch+1)return null;return{x,y,z,mode:'fill'}}for(const b of [box,tight]){const r=at(b,1);if(r)return r}const zb=tight,z=Math.max(.3,Math.min(1,.96*cw/((zb.x1-zb.x0)*w),.96*ch/((zb.y1-zb.y0)*h)));return at(zb,z)||at(tight,z)||{x:.5,y:.5,z:1,mode:'fit'}}" + html.slice(b); }
// the space around a zoomed-out or whole photo is a smooth backdrop made from the photo's own edge colours (no blown-up blur)
appOnly("if(f.mode==='fit'&&$('#frameBackdrop').value==='soft'){const bg=document.createElement('canvas');bg.width=32;bg.height=Math.max(1,Math.round(32*input.height/input.width));bg.getContext('2d').drawImage(baseCanvas(160),0,0,bg.width,bg.height);const cover=Math.max(c.width/bg.width,c.height/bg.height);const bw=bg.width*cover,bh=bg.height*cover;ctx.imageSmoothingEnabled=true;ctx.drawImage(bg,(c.width-bw)/2,(c.height-bh)/2,bw,bh);ctx.fillStyle='#ffffff66';ctx.fillRect(0,0,c.width,c.height);bg.width=bg.height=1}",
  "if((f.mode==='fit'||f.z<.999)&&$('#frameBackdrop').value==='soft'){window.fcSoftBackdrop(ctx,c.width,c.height,baseCanvas(160))}", 'pack backdrop');
// one file per size: platforms that share a size are saved once, named for all of them; the saved sizes are shown on screen
appOnly("const files=[];for(const i of selected){const blob=await exportBlob(i);files.push(new File([blob],filename(i),{type:blob.type}))}",
  "const groups=new Map();for(const i of selected){const k=presets[i][3]+'x'+presets[i][4];if(!groups.has(k))groups.set(k,[]);groups.get(k).push(i)}const files=[],made=[];framed=0;for(const g of groups.values()){const i=g[0];if(frameState[i].mode==='fill')framed++;const blob=await exportBlob(i);const names=[...new Set(g.map(j=>{const q=PACK.find(x=>x[0]===j);return q?q[1]:presets[j][1]+' '+presets[j][2]}))];const slug=names.join(' ').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const f=new File([blob],'face-couture-'+slug+'-'+presets[i][3]+'x'+presets[i][4]+'.'+($('#quality').value==='image/png'?'png':'jpg'),{type:blob.type});files.push(f);made.push({file:f,names,w:presets[i][3],h:presets[i][4]})}", 'pack one file per size');
appOnly("const r=await deliverFiles(files,'Face Couture Platform Pack');", "const r=await deliverFiles(files,'Face Couture Platform Pack');try{if(r!=='cancelled'&&window.fcPackResult)window.fcPackResult(made,r)}catch(e){}", 'pack result');
appOnly("(framed?', '+framed+' framed on your face':'')", "(framed&&framed===files.length?', each framed on your face':framed?', '+framed+' framed on your face':'')", 'pack toast');
appOnly('Center on my face (keeps the whole photo if a size would cut it off)', 'Frame every size on my face', 'pack option');
// the AI Studio sits at the end of the Studio tab (not pinned above the tools)
appOnly('if(w.parentNode!==box){box.appendChild(w);moved=1}', "{var ed=D.getElementById('edit');if(ed&&w.parentNode!==ed){ed.appendChild(w);moved=1}}", 'AI Studio at the end');
// Full Glam (Grand Soirée) lipstick: velvet rose, fuller colour and a pearl gloss (Demah's pick B, Nov 5, 2026; was a bright pink that went flat and bubblegum on light lips)
appOnly("b.tint=S.beauty.tint;b.gloss=60;", "b.tint=85;b.gloss=40;", 'Full Glam lipstick strength');
appOnly("Object.assign(sh,{color:'glamRosePink',lipFinish:'cream',glossShade:'gRose',opaqueLip:1});", "Object.assign(sh,{color:'velvetRose',lipFinish:'cream',glossShade:'gPearl',opaqueLip:1});", 'Full Glam lipstick shade');
// app-zone guide text sits in the top red band, not across the face
appOnly("ctx.fillText('Keep faces and text out of the red areas',w/2,h*.5)", "ctx.fillText('Keep faces and text out of the red areas',w/2,h*.06)", 'zone text position');
// ---- Try it on, Change the scene, Accessories and Shoes are not in version 1.0 (Demah, Nov 5, 2026). ----
// ONE SWITCH brings all four back for version 1.1: build with FC_TRYON=1 (see RESTORE-AI-TOOLS.md). Nothing is deleted from the website or the server.
const TRYON = process.env.FC_TRYON === '1';
if (!TRYON) {
  appAll("'Travel, Vanish & try-on'", "'Vanish'", 'AI panel title without try-on');
  // the travel and try-on controls are cut out of the 1.0 build itself (not hidden), so nothing can reach them
  appOnly('<h4>Travel backgrounds <small style="font-weight:600;color:#b8913a">AI</small></h4><div id="fcTravel" role="group" aria-label="Travel backgrounds"></div>', '', '1.0: no travel backgrounds');
  { const a = html.indexOf('<h4>Outfit, accessories &amp; shoes try-on'), b = html.indexOf('<p class="aiNote">Each uses 1 AI look.', a);
    if (a < 0 || b < 0 || b - a > 2000) throw new Error('1.0 clean-up "try-on controls" not found. Update scripts/build-web.mjs.');
    html = html.slice(0, a) + html.slice(b); }
  appOnly("var row=card.querySelector('#fcTravel');", "var row=card.querySelector('#fcTravel')||D.createElement('div');", '1.0: travel row not in the page');
  appOnly("var tf=card.querySelector('#fcTryFile');card.querySelector('#fcTryBtn').onclick=function(){if(!needs())return;tf.value='';tf.click()};tf.onchange=function(){if(tf.files&&tf.files[0])tryOn(tf.files[0])};", '', '1.0: no try-on button');
  appOnly("'Blur is free and made on your phone. Travel, Vanish and Outfit try-on use AI. Your face always stays exactly yours.'", "'Blur is free and made on your phone. Vanish uses AI. Your face always stays exactly yours.'", '1.0: panel intro');
  appOnly("hh.textContent='Background & outfit'", "hh.textContent='Vanish'", '1.0: panel title');
  appOnly("if(!box||!D.getElementById('aiGlowBtn')||!D.getElementById('fcTryBtn'))return false;", "if(!box||!D.getElementById('aiGlowBtn'))return false;", '1.0: AI Studio row without try-on');
  for (const bad of ['id="fcTryBtn"', 'Choose outfit photo', 'id="fcTravel"', 'Travel backgrounds <small', 'shoes try-on <small'])
    if (html.indexOf(bad) > -1) throw new Error('1.0 clean-up: "' + bad + '" is still in the app. Update scripts/build-web.mjs.');
}
appOnly('content="width=device-width,initial-scale=1,viewport-fit=cover"', 'content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"', 'no page zoom');
appAll('only to create this look, and it is not stored.', 'only to create this look. We do not store it.', 'consent wording 2');
appAll('<button type="button" data-set="pro">Professional</button>', '<button type="button" data-set="pro">Work</button>', 'same set name as the welcome card');
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
appAll('>Add your music or recorded voiceover<', '>Add your music or a voiceover file<', 'video audio label');
appAll("to create the look. It isn't stored. <a", "to create the look. We don't store it. <a", 'consent wording');
html = html.replace(/<link rel="manifest"[^>]*>/, ''); // website install manifest (not used in the app)
// 5) App Store names for the AI Studio buttons (approved by Demah, Nov 4, 2026); the section is still called "AI Studio"
for (const [a, b] of [['AI Outfit Change', 'Try it on'], ['AI Background Change', 'Change the scene'], ['AI Accessories', 'Accessories'], ['AI Shoes', 'Shoes'], ['AI Looks', 'Couture Looks'], ['AI Glow', 'Couture Glow']]) appAll(a, b, 'button name ' + a);
// original look names (Demah, Nov 5, 2026): common beauty terms read like a template app, so each look has its own Face Couture name
for (const [a, b] of [['Full Glam', 'Grand Soirée'], ['Red Carpet', 'Première'], ['Clean Girl', 'Bare Luxe'], ['Bridal Glow', 'Ivory Vow'], ['Glass Skin', 'Porcelain Dew'], ['Hollywood Glam', 'Silver Screen'], ['Golden Hour', 'Gilded Hour'], ['Magazine Cover', 'Cover Edit'], ['Ice Queen', 'Frost Couture'], ['Pumpkin Spice', 'Spiced Amber']]) appAll(a, b, 'look name ' + a);
appAll('Pro grooming, no makeup', 'Expert grooming, no makeup', 'men glow subtitle');
appAll('Pro grooming on your own photo.', 'Expert grooming on your own photo.', 'men AI subtitle');
appAll('Tap Women above the Finishes to switch.', 'Tap Women above the Looks to switch.', 'men toast');
// saved files carry the Face Couture name
for (const [a, b] of [["'frame-custom-'", "'face-couture-custom-'"], ["'frame-photo-set.zip'", "'face-couture-photo-set.zip'"], ["'frame-clip.'", "'face-couture-clip.'"], ["'frame-before-after.", "'face-couture-before-after."], ["'frame-set-'", "'face-couture-set-'"], ["'frame-my-look-'", "'face-couture-my-look-'"]]) appAll(a, b, 'file name ' + a);
// per-build settings (backend URL comes from a repository variable). Version 1.0 has no purchases, so no store keys.
fs.writeFileSync(path.join(OUT, 'app-config.js'), 'window.FC_CONFIG=' + JSON.stringify({
  apiUrl: process.env.FC_API_URL || 'https://face-couture-api.facecouture.workers.dev',
  analytics: !!process.env.FC_API_URL, supportEmail: process.env.FC_SUPPORT_EMAIL || 'hello@facecouture.app', version: process.env.APP_VERSION || '1.0.0' }) + ';');
// Google Analytics stays on in the app: the studio reports app_platform = ios | android with an anonymous app-only id
// (no photos, no face data, no names; no ad signals, so no tracking prompt is needed).
// app mode hook (native look and feel is layered on in app.css / app.js)
{ const h = html.search(/<head(\s[^>]*)?>/i), hEnd = html.indexOf('>', h) + 1; html = html.slice(0, hEnd) + '<script>window.__FC_APP=true' + (TRYON ? '' : ';window.__FC_NO_TRYON=true') + '</script><script src="app-config.js"></script><script src="app-early.js"></script><script src="app-api.js"></script>' + html.slice(hEnd); }
{ const i = html.indexOf('</head>'); html = html.slice(0, i) + '<link rel="stylesheet" href="app.css">' + html.slice(i); }
{ const i = html.lastIndexOf('</body>'); html = html.slice(0, i) + '<script src="app.js"></script><script src="app-settings.js"></script>' + html.slice(i); }
fs.writeFileSync(path.join(OUT, 'index.html'), html);
for (const f of ['app.css', 'app.js', 'app-early.js', 'app-api.js', 'app-settings.js']) fs.copyFileSync(path.join('app', f), path.join(OUT, f));
// the app's own Privacy policy, Terms, Support and Delete-my-data pages are bundled so they open offline inside the app
// Inside the iPhone app these pages describe version 1.0 exactly: no purchases, promo codes or other platforms.
const LEGAL_APP = {
  'support.html': [
    ['Tap Save, then "Save Image" on the sheet: the photo lands in your Photos app. Videos save the same way.', 'Tap Save and the photo goes straight into your Photos app. Videos save the same way. To send a photo to another app, use a Share button.'],
    ['Tap Save, then "Save Image" on the sheet: the photo lands in your Photos app (Camera Roll on Android). Videos save the same way.', 'Tap Save and the photo goes straight into your Photos app. Videos save the same way. To send a photo to another app, use a Share button.'],
    [' Pro raises the allowance when available.', ''],
    ['<div class="card"><b>Subscription or refund</b> — manage it in your <a href="https://apps.apple.com/account/subscriptions">App Store</a> or <a href="https://play.google.com/store/account/subscriptions">Google Play</a> account. Refunds are issued by Apple or Google.</div>', ''],
    ['<div class="card"><b>Promo code</b> — Settings (gear icon) → Enter a promo code.</div>', ''],
    ['on the AI screen tap "Report this AI result"', 'tap "Report this result" under any AI result'],
    ['<p>Instagram and TikTok: <a href="https://www.instagram.com/always_luxe/">@always_luxe</a></p>', '<p>Instagram and TikTok: @always_luxe</p>']],
  'delete-my-data.html': [
    ['or delete the app (iPhone/Android) or clear site data (browser).', 'or delete the app.'],
    [" On the website, clear this site's data in your browser settings.", ''],
    ['A random install ID with AI-allowance counts and promo-code use.', 'A random install ID with AI-allowance counts.'],
    ['<h2>Subscriptions</h2><p>Subscriptions are held by Apple or Google. Cancel in your <a href="https://apps.apple.com/account/subscriptions">App Store</a> or <a href="https://play.google.com/store/account/subscriptions">Google Play</a> account; deleting the app does not cancel a subscription.</p>', '']],
  'privacy.html': [
    ['<td>Google Analytics on the website and in the apps (the apps use a random app-only ID, not your advertising ID); our server once enabled</td>', '<td>Google Analytics on the website only. The iPhone app sends no analytics; our server counts AI use per random install ID to apply the daily limit</td>'],
    ['We count basic actions to understand which looks people love. Analytics never receive photos or face data.', 'The iPhone app sends no analytics. On the website we count basic actions to understand which looks people love; analytics never receive photos or face data.'],
    ['Face Couture is not directed to children under 13 and we do not knowingly collect their data.', 'The Face Couture app is rated 18+ and is not directed to anyone under 18. We do not knowingly collect data from children.'],
    ['website and iPhone/Android apps', 'website and apps'],
    ['Used to count AI allowances, prevent abuse and honour promo codes.', 'Used to count AI allowances and prevent abuse.'],
    ['<tr><td>Purchase status (Pro trial/subscription)</td><td>Apple / Google and RevenueCat (our subscription processor)</td><td>For the life of the subscription plus legal retention. We never see card details.</td></tr>', ''],
    ["kept in the app's or browser's local storage. Delete them under My looks &amp; drafts, by deleting the app, or by clearing site data.", "kept in the app's storage on your device. Delete them under My looks &amp; drafts or by deleting the app."],
    ['<h2>7. Subscriptions and promo codes</h2><p>Face Couture Pro, when available, is sold through the App Store or Google Play and managed in your store account. Free trials convert to a paid subscription unless cancelled at least 24 hours before the trial ends. Promo codes redeemed in the app are tied to your install ID.</p>', '<h2>7. Purchases</h2><p>Face Couture has no purchases. If we ever add any, we will update this policy first.</p>']],
  'terms.html': [['the website and the iPhone and Android apps, by Always Luxe', 'the website and apps by Always Luxe'],
    ['<h2>Free launch, trials and subscriptions</h2><p>Face Couture is free to use at launch. If we introduce Face Couture Pro, prices, the free-trial length and what is included are shown before you subscribe. Subscriptions are billed by Apple or Google to your store account and renew automatically until cancelled in your store settings; cancel at least 24 hours before the current period ends to avoid renewal. Refunds are handled by Apple or Google under their policies. Promo codes are personal, non-transferable and may expire.</p>', '<h2>Free to use</h2><p>Face Couture is free to use, with a daily limit on AI features. If we ever add paid features, their price and terms will be shown clearly before you choose them.</p>']]
};
// the in-app pages describe the iPhone app (the website wording stays on the website)
LEGAL_APP['privacy.html'].push([' · website and apps · ', ' · iPhone app · '], [' (website visitors download them from Google Cloud Storage and jsDelivr the first time)', '']);
// version 1.0 legal pages describe only the AI tools in this build (the FC_TRYON=1 switch restores the full wording)
if (!TRYON) {
  LEGAL_APP['privacy.html'].push(['AI Luxe Looks, headshot, backgrounds, outfit try-on, Vanish, blur', 'Couture Glow, Couture Looks, Vanish']);
  LEGAL_APP['privacy.html'].push(['<tr><td>Outfit or accessory photos you upload for try-on</td><td>Same as above</td><td>Same as above. Upload only items you have the right to use; try-on implies no brand partnership.</td></tr>\n', '']);
  LEGAL_APP['terms.html'].push([' Outfit try-on is a visual preview, not a guarantee of fit or availability, and does not imply any partnership with a brand whose product you upload.', '']);
}
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
