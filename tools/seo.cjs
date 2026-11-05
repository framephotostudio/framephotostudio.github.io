// Builds Face Couture's Google pages: feature guides, photo-size guides, sitemap.xml, robots.txt and 404.html.
// Run from the repo root: node tools/seo.cjs
const fs = require('fs'), path = require('path');
const SITE = 'https://facecouture.app', YEAR = 2026, TODAY = new Date().toISOString().slice(0, 10), GA = 'G-JNY27DLF0Z';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// The same sizes the editor exports (index.html `presets`)
const src = fs.readFileSync('studio/index.html', 'utf8');
const m = src.match(/const presets=(\[[\s\S]*?\]\]);/);
if (!m) throw new Error('presets not found in index.html');
const PRESETS = eval(m[1]).map(([id, platform, label, w, h, group]) => ({ id, platform, label, w, h, group }));
const MERGE = { 'YouTube Shorts': 'YouTube', 'Online shop': null, Universal: null, Headshot: null };
const platforms = {};
for (const p of PRESETS) { const k = p.platform in MERGE ? MERGE[p.platform] : p.platform; if (!k) continue; (platforms[k] = platforms[k] || []).push(p); }

const gcd = (a, b) => b ? gcd(b, a % b) : a;
const ratio = (w, h) => { const g = gcd(w, h); const r = (w / g) + ':' + (h / g); return ({ '40:21': '1.91:1', '205:78': '2.63:1', '4:1': '4:1' })[r] || r; };
const clean = l => l.replace(/ preset$/i, '');

const CSS = `:root{--plum:#2b1636;--lav:#6d3fd0;--gold:#c9a14a;--ink:#2a1f33;--muted:#6b5c79;--line:#eadff0}
*{box-sizing:border-box}body{margin:0;font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;color:var(--ink);background:#fffafd}
header{background:linear-gradient(135deg,var(--plum),#5a2a6a);color:#fff;padding:18px 20px}header a{color:#fff;text-decoration:none;font-weight:700;letter-spacing:.5px}header small{display:block;opacity:.85;font-size:13px}
nav.crumb{font-size:13px;color:var(--muted);margin-bottom:10px}nav.crumb a{color:var(--muted)}
main{max-width:780px;margin:0 auto;padding:22px 20px 56px}h1{font-size:30px;line-height:1.2;color:var(--plum);margin:0 0 10px}h2{font-size:20px;color:var(--plum);margin:30px 0 8px}h3{font-size:17px;margin:18px 0 4px;color:var(--plum)}
.lead{font-size:18px;color:#3d3047}.card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px 18px;margin:14px 0}
table{border-collapse:collapse;width:100%;font-size:15px;background:#fff;border-radius:12px;overflow:hidden}td,th{border-bottom:1px solid var(--line);padding:9px 10px;text-align:left;vertical-align:top}th{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.6px;background:#faf4fc}
.num{font-variant-numeric:tabular-nums;white-space:nowrap}a{color:var(--lav)}ul{padding-left:20px}li{margin:4px 0}
.btn{display:inline-block;background:linear-gradient(135deg,var(--lav),#c25aa8);color:#fff;padding:13px 22px;border-radius:999px;text-decoration:none;font-weight:700;margin:6px 0}
.cta{text-align:center;background:linear-gradient(135deg,#f6eefb,#fdf3f8);border:1px solid var(--line);border-radius:18px;padding:20px;margin:26px 0}.cta p{margin:0 0 8px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;padding:0;list-style:none}.grid li{margin:0}.grid a{display:block;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px;text-decoration:none;color:var(--ink)}.grid a b{display:block;color:var(--plum)}.grid a span{font-size:13px;color:var(--muted)}
details{background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin:8px 0}summary{font-weight:600;cursor:pointer}
footer{color:var(--muted);font-size:13px;text-align:center;padding:22px 16px;border-top:1px solid var(--line)}footer a{color:var(--muted)}
@media(max-width:520px){h1{font-size:25px}.lead{font-size:17px}td,th{padding:8px 7px}}`;

const ga = `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA}"></script><script>if(location.protocol==='http:'&&location.hostname!=='localhost')location.replace('https:'+location.href.slice(5));window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}if(navigator.doNotTrack!=='1'){gtag('js',new Date());gtag('config','${GA}',{allow_google_signals:false,allow_ad_personalization_signals:false,page_type:'guide'})}document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a.btn');if(a)gtag('event','guide_open_app',{page_path:location.pathname})});</script>`;

function page({ url, title, desc, h1, body, crumb, ld = [] }) {
  const crumbs = [{ name: 'Face Couture', url: SITE + '/' }].concat(crumb || []);
  ld = ld.concat({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })) });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#2b1636">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${SITE + url}"><link rel="icon" href="/icon-192.png"><link rel="apple-touch-icon" href="/brand/FaceCouture_Icon_180.png">
<meta property="og:type" content="article"><meta property="og:site_name" content="Face Couture by Always Luxe"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${SITE + url}"><meta property="og:image" content="${SITE}/share-card.jpg?v=37"><meta name="twitter:card" content="summary_large_image">
${ld.map(o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>').join('')}
${ga}<style>${CSS}</style></head><body><header><a href="/">FACE COUTURE</a><small>by Always Luxe</small></header><main>
<nav class="crumb">${crumbs.map((c, i) => i < crumbs.length - 1 ? `<a href="${c.url.replace(SITE, '')}">${esc(c.name)}</a> › ` : esc(c.name)).join('')}</nav>
<h1>${esc(h1)}</h1>${body}</main>
<footer><p><a href="/">Face Couture</a> · <a href="/photo-sizes/">Photo sizes</a> · <a href="/dating-profile-photos/">Dating profile photos</a> · <a href="/looks/">Looks</a> · <a href="/makeup-ideas/">Makeup ideas</a> · <a href="/free-selfie-editor/">Selfie editor</a></p>
<p>Planning an event? <a href="https://eventcouture.app/">Event Couture</a> plans it from one photo.</p><p>© ${YEAR} Always Luxe · <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a> · <a href="/support.html">Support</a></p></footer></body></html>`;
}
const faqLd = faqs => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const faqHtml = faqs => '<h2>Questions</h2>' + faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
const cta = (line, btn = 'Open Face Couture, free') => `<div class="cta"><p><b>${esc(line)}</b></p><a class="btn" href="/">${esc(btn)}</a><p class="small" style="font-size:13px;color:var(--muted);margin-top:6px">No account needed. Free tools run on your phone.</p></div>`;
const out = [];
const write = (url, html, pri) => { const f = path.join('.', url, 'index.html'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); out.push([url, pri]); };

// ---------- Feature guides ----------
const FEATURES = [
  { s: 'ai-makeup-app', t: 'AI Makeup App: Try Makeup Looks on Your Photo | Face Couture', h: 'AI makeup app: see any makeup look on your own photo',
    d: 'Try full glam, satin glam, bridal and natural makeup on your selfie with AI. Your eyes, lips and face shape stay yours. Free tools, no account.',
    lead: 'Upload one selfie and see yourself in a finished makeup look in seconds. Face Couture keeps your real features and only adds the makeup.',
    sec: [['What you can do', '<ul><li><b>Auto Glow (free):</b> smooth skin, soft sculpting, blush, highlighter, fuller lashes and a glossy lip in one tap, on your phone.</li><li><b>Couture Glow:</b> a premium AI makeover placed onto your real, unchanged face at full photo quality.</li><li><b>Couture Looks:</b> finished looks such as Grand Soirée (full glam), Satin Glam and Ivory Vow (bridal).</li><li><b>Beauty Lab:</b> do it yourself with foundation, concealer, contour, blush, lashes, eyeliner, eye shadow, lip color and gloss, each with a strength slider.</li></ul>'],
      ['Your face stays yours', '<p>Face Couture is built to keep the shape and size of your eyes and lips, your eye color and your pose. Only the makeup changes.</p>'],
      ['Private by design', '<p>Free tools run on your device, so your photo never leaves your phone. AI looks are optional and ask for your consent first. Saved photos have location data removed.</p>']],
    faq: [['Is there a free AI makeup app?', 'Yes. Face Couture is free to use: Auto Glow, the Beauty Lab makeup tools, filters and 40+ photo sizes run on your phone at no cost. Premium AI looks come with a small allowance.'], ['Will the AI change my face?', 'No. Face Couture keeps your eyes, lips, face shape and pose and only adds makeup.'], ['Does it work for men?', 'Yes. Men’s mode uses no makeup at all, only subtle skin smoothing, lighting and grooming touches.']] },
  { s: 'virtual-makeup-try-on', t: 'Virtual Makeup Try-On Online, Free: Lipstick, Lashes & Looks | Face Couture', h: 'Virtual makeup try-on, free in your browser',
    d: 'Try on lipstick shades, lashes, eyeliner, eye shadow, blush and full looks on your own photo. Works on phone and desktop, no download needed.',
    lead: 'See a lipstick shade, lash style or full look on your own face before you buy it or book an artist.',
    sec: [['Try on any product type', '<ul><li><b>Lips:</b> dozens of lipstick shades in cream, matte, shimmer or glitter finishes, plus gloss, from nudes to reds and berries.</li><li><b>Eyes:</b> eyeliner styles, lashes, mascara and a wide eye shadow palette.</li><li><b>Face:</b> foundation and concealer shades from porcelain to rich espresso, bronzer, contour, highlight and blush.</li><li><b>Full looks:</b> swipe through ready-made looks and set the strength from subtle to glam.</li></ul>'],
      ['How it works', '<ol><li>Upload a clear, front-facing selfie (or try the sample).</li><li>Face Couture finds your eyes, brows and lips automatically.</li><li>Pick a shade or a look and compare before and after.</li><li>Save the photo or share it with your makeup artist.</li></ol>']],
    faq: [['Can I try on makeup without downloading an app?', 'Yes. Face Couture works in your phone or computer browser at facecouture.app, and there is also an app.'], ['Is my photo uploaded?', 'Not for try-on. Face detection and makeup run on your device. Only optional AI looks send a photo, after you agree.'], ['Can I show the result to my makeup artist?', 'Yes. Save the before and after and send it, so your artist sees exactly the look you want.']] },
  { s: 'ai-glow-up', t: 'AI Glow Up Photo Editor: Natural Glow in One Tap | Face Couture', h: 'AI glow up: a natural, polished glow in one tap',
    d: 'Give your selfie a luxe glow: smooth skin, soft sculpting, blush, highlighter and glossy lips, without looking filtered. Free Auto Glow plus Couture Glow (AI).',
    lead: 'A glow that looks like great lighting and good skin, not a filter.',
    sec: [['Two ways to glow', '<ul><li><b>Auto Glow (free, on your phone):</b> smooths skin, adds rosy-bronze sculpting, blush, highlighter, fuller lashes and a glossy lip, and keeps the lipstick you already wear, just richer.</li><li><b>Couture Glow:</b> an AI makeover with full makeup detail, placed onto your real face at full quality.</li></ul>'],
      ['Looks natural', '<p>Set the strength from Subtle to Max, drag the slider to compare, and undo anytime. Men get grooming only, with no makeup.</p>']],
    faq: [['What is a glow up photo editor?', 'An editor that makes a photo look polished: even skin, flattering light and soft makeup, while keeping you recognizable.'], ['Is Auto Glow free?', 'Yes. Auto Glow runs on your device and is free.']] },
  { s: 'ai-outfit-change', t: 'AI Outfit Changer: Try On Clothes From a Photo | Face Couture', h: 'AI outfit change: try on an outfit from a photo',
    d: 'Upload your photo and a photo of the outfit to see yourself wearing it. Your face stays exactly yours. Try dresses, suits and event looks.',
    lead: 'Wondering how that dress would look on you? Add your photo and a photo of the outfit, and AI shows you wearing it.',
    sec: [['How it works', '<ol><li>Open AI Studio and choose <b>Outfit Change</b>.</li><li>Add your photo, then a photo of the outfit.</li><li>AI dresses you in it while your real face is kept exactly as it is.</li></ol>'],
      ['Great for', '<ul><li>Choosing a wedding guest, gala or party outfit.</li><li>Checking a color before you buy.</li><li>Planning a look for photos or an event.</li></ul><p>Upload only items you have the right to use. A try-on does not mean any brand partnership.</p>']],
    faq: [['Can AI change my outfit in a photo?', 'Yes. Face Couture’s Outfit Change puts the outfit from a second photo onto you and keeps your face unchanged.'], ['Do I need an account?', 'No. AI features ask for your consent before a photo is sent and come with a small free allowance.']] },
  { s: 'ai-background-change', t: 'AI Background Changer: Put Yourself Anywhere in the World | Face Couture', h: 'AI background change: put yourself anywhere',
    d: 'Swap your photo’s background for world cities, landmarks, beaches, rooftops or fine dining. Plus a free on-phone background remover.',
    lead: 'Turn an ordinary photo into a destination shot: a city skyline, a beach at sunset, a rooftop or a glam restaurant.',
    sec: [['Two background tools', '<ul><li><b>Background swap (free):</b> finds you in the photo on your phone and puts a clean color, blur or your own image behind you. Nothing is uploaded.</li><li><b>Change the scene (AI background change):</b> places you in world cities, landmarks, beaches and glam venues with matching light.</li></ul>'],
      ['Tips for the best result', '<ul><li>Use a photo where your outline is clear.</li><li>Pick a destination with light similar to your photo.</li><li>Save at full size for posts and profile pictures.</li></ul>']],
    faq: [['How do I change the background of a photo for free?', 'Open Face Couture, add your photo and use Background swap. It runs on your phone and is free.'], ['Can I put myself in a famous city?', 'Yes. Change the scene includes world cities, landmarks, beaches and venues.']] },
  { s: 'remove-object-from-photo', t: 'Remove People or Objects From a Photo, Free | Face Couture', h: 'Remove a person, object or blemish from a photo',
    d: 'Paint over what you want gone and tap Make it vanish. Remove photobombers, clutter and blemishes on your phone, free.',
    lead: 'A stranger in your shot or a stray object on the table? Paint over it and make it vanish.',
    sec: [['How to remove something', '<ol><li>Open the editor and choose <b>Vanish</b>.</li><li>Turn on the brush and paint over what you want removed.</li><li>Tap <b>Make it vanish</b>. Undo or reset anytime.</li></ol>'],
      ['Best results', '<p>Works best on small things, or on people against a plain or blurry background. Raise the brush size to cover a whole person.</p>']],
    faq: [['Can I remove a person from a photo for free?', 'Yes. Face Couture’s Vanish tool removes people, objects and blemishes. Paint over it and tap Make it vanish.']] },
  { s: 'photo-retouch-for-men', t: 'Photo Retouch for Men: Natural, No Makeup | Face Couture', h: 'Photo retouch for men, with no makeup',
    d: 'Subtle skin smoothing, better light and grooming touches for men’s profile pictures, LinkedIn headshots and dating photos. No makeup, ever.',
    lead: 'Look like yourself on a good day: even skin, better light, sharp details. Men’s mode never adds makeup.',
    sec: [['What men’s mode does', '<ul><li>Very subtle smoothing of wrinkles and blemishes.</li><li>Lighting and color finishes that flatter, not filter.</li><li>Sizes for LinkedIn, dating apps and social profiles.</li></ul>']],
    faq: [['Is there a photo editor for men that doesn’t add makeup?', 'Yes. Face Couture’s men’s mode uses no makeup, only subtle retouching and light.']] },
  { s: 'bridal-makeup-try-on', t: 'Bridal Makeup Try-On: See Your Wedding Look First | Face Couture', h: 'Bridal makeup try-on: see your wedding look first',
    d: 'Preview soft bridal, glam and natural wedding makeup on your own photo before your trial. Save it and share it with your makeup artist.',
    lead: 'Walk into your makeup trial knowing exactly what you want.',
    sec: [['Find your bridal look', '<ul><li>Try Ivory Vow (bridal glow), Satin Glam, Grand Soirée (full glam) and natural looks.</li><li>Test lip colors from nude to rose to red, and lash styles from natural to full.</li><li>Compare side by side and save your favorites.</li></ul>'],
      ['Planning the wedding too?', '<p><a href="https://eventcouture.app/wedding-planner/">Event Couture</a> plans the whole wedding, from budget to vendors, from one inspiration photo.</p>']],
    faq: [['Can I try bridal makeup on my photo?', 'Yes. Upload a selfie to Face Couture and choose a bridal look, then adjust lips, lashes and strength.']] },
  { s: 'dating-profile-photos', t: 'Best Dating Profile Photo Sizes & Tips: Hinge, Bumble, Tinder | Face Couture', h: 'Dating profile photos that look like you, at your best',
    d: 'The right photo sizes for Hinge, Bumble, Tinder, Raya and The League, plus a natural glow that still looks like you.',
    lead: 'Natural, flattering and the right shape for each app, so nothing important gets cropped.',
    sec: [['Sizes by app', () => table(['Hinge', 'Bumble', 'Tinder', 'Raya', 'The League', 'Facebook Dating'].flatMap(p => platforms[p] || []))],
      ['Tips', '<ul><li>Use natural light and a clear, front-facing photo first.</li><li>Keep retouching subtle: a glow, not a new face.</li><li>Check the crop in the profile preview before you upload.</li></ul>']],
    faq: [['What size should a Hinge photo be?', 'Face Couture exports Hinge photos at 1080 × 1350 (4:5 portrait), which fills the profile card.'], ['What size are Tinder photos?', 'Face Couture exports Tinder photos as a tall 1080 × 1920 portrait (9:16).']] }
];

function table(list) {
  return `<table><thead><tr><th>Format</th><th>Size (pixels)</th><th>Shape</th></tr></thead><tbody>${list.map(p => `<tr><td>${esc(p.platform)} ${esc(clean(p.label).toLowerCase())}</td><td class="num">${p.w} × ${p.h}</td><td class="num">${ratio(p.w, p.h)}</td></tr>`).join('')}</tbody></table>`;
}

for (const f of FEATURES) {
  const body = `<p class="lead">${f.lead}</p>` + f.sec.map(([h, c]) => `<h2>${esc(h)}</h2>${typeof c === 'function' ? c() : c}`).join('') + cta('Try it on your own photo') + faqHtml(f.faq);
  write('/' + f.s + '/', page({ url: '/' + f.s + '/', title: f.t, desc: f.d, h1: f.h, body, crumb: [{ name: f.h.split(':')[0], url: SITE + '/' + f.s + '/' }], ld: [faqLd(f.faq)] }), '0.8');
}

// ---------- Photo size guides ----------
const sizeUrl = p => '/photo-sizes/' + slug(p) + '/';
const KIND = { Social: 'social media', Dating: 'dating app', Work: 'professional', Products: 'product photo', Messaging: 'messaging app' };
for (const [p, list] of Object.entries(platforms)) {
  const main = list[0], group = KIND[main.group] || 'photo';
  const title = `${p} Photo Size (${YEAR}): ${list.map(x => clean(x.label)).slice(0, 3).join(', ')} | Face Couture`;
  const desc = `${p} image sizes in pixels: ${list.map(x => clean(x.label).toLowerCase() + ' ' + x.w + '×' + x.h).join(', ')}. Resize and retouch your photo for ${p} free.`;
  const an = /^[AEIOU]/.test(p) ? 'an' : 'a';
  const faqs = list.map(x => [`What size is ${an} ${p} ${clean(x.label).toLowerCase()}?`, `Face Couture exports ${an} ${p} ${clean(x.label).toLowerCase()} at ${x.w} × ${x.h} pixels, a ${ratio(x.w, x.h)} shape.`]);
  faqs.push([`How do I resize a photo for ${p}?`, `Open Face Couture, upload your photo, choose ${p} and the format, then save. It fits your photo automatically and keeps full quality.`]);
  const others = Object.keys(platforms).filter(k => k !== p && (platforms[k][0].group === main.group)).slice(0, 8);
  const body = `<p class="lead">The ${p} ${group} sizes Face Couture uses, so your photo fills the frame and nothing important gets cropped.</p>${table(list)}
<h2>Get it right the first time</h2><ul><li>Keep your face and any text away from the edges, where apps crop or cover with buttons.</li><li>Upload at the full size above; smaller photos look soft.</li><li>${main.h > main.w ? 'Tall formats show the most on phones.' : main.h === main.w ? 'Square photos are often shown as a circle for profiles, so center your face.' : 'Wide formats suit covers, banners and link previews.'}</li></ul>
${cta(`Resize your photo for ${p} in one tap`, `Resize for ${p}, free`)}${faqHtml(faqs)}
${others.length ? `<h2>More ${group} sizes</h2><ul class="grid">${others.map(o => `<li><a href="${sizeUrl(o)}"><b>${esc(o)}</b><span>${platforms[o].length} format${platforms[o].length > 1 ? 's' : ''}</span></a></li>`).join('')}</ul>` : ''}`;
  write(sizeUrl(p), page({ url: sizeUrl(p), title, desc, h1: `${p} photo sizes (${YEAR})`, body, crumb: [{ name: 'Photo sizes', url: SITE + '/photo-sizes/' }, { name: p, url: SITE + sizeUrl(p) }], ld: [faqLd(faqs)] }), '0.7');
}
// hub
{
  const groups = {};
  for (const [p, list] of Object.entries(platforms)) (groups[list[0].group] = groups[list[0].group] || []).push(p);
  const NAMES = { Social: 'Social media', Dating: 'Dating apps', Work: 'Work and professional', Messaging: 'Messaging apps', Products: 'Online shops' };
  const body = `<p class="lead">Every size Face Couture exports, in pixels, for ${Object.keys(platforms).length} apps and sites. Pick one to see each format and tips.</p>` +
    Object.entries(groups).map(([g, ps]) => `<h2>${esc(NAMES[g] || g)}</h2><ul class="grid">${ps.map(p => `<li><a href="${sizeUrl(p)}"><b>${esc(p)}</b><span>${platforms[p].map(x => x.w + '×' + x.h).filter((v, i, a) => a.indexOf(v) === i).join(' · ')}</span></a></li>`).join('')}</ul>`).join('') +
    `<h2>All sizes at a glance</h2>${table(PRESETS)}` + cta('Upload once, get every size');
  const faqs = [['What is the best photo size for social media?', 'For most feeds a 1080 × 1350 portrait (4:5) shows the largest on phones. Stories, Reels and TikTok use 1080 × 1920 (9:16).'], ['Can I make one photo fit every platform?', 'Yes. Upload once to Face Couture and save it in any of 40+ sizes, fitted automatically.']];
  write('/photo-sizes/', page({ url: '/photo-sizes/', title: `Social Media Image Sizes (${YEAR}): Every Photo Size in Pixels | Face Couture`, desc: `Photo and image sizes in pixels for Instagram, TikTok, Facebook, LinkedIn, YouTube, Pinterest, dating apps and online shops. Resize free with Face Couture.`, h1: `Photo sizes for every platform (${YEAR})`, body: body + faqHtml(faqs), crumb: [{ name: 'Photo sizes', url: SITE + '/photo-sizes/' }], ld: [faqLd(faqs)] }), '0.9');
}

const KW = require('./seo-more.cjs')({ SITE, YEAR, src, esc, slug, page, faqLd, faqHtml, cta, write, platforms });
fs.writeFileSync(process.env.KW_OUT || require('os').tmpdir() + '/fc-keywords.json', JSON.stringify(KW));

// ---------- Home page: the iPhone app (the web studio is at /studio/) ----------
{
  const sec = (h, p) => `<h2>${h}</h2><p>${p}</p>`;
  const body = `<p class="lead">Face Couture turns one portrait into a ready-to-post set for every app: each size framed on your face and checked against that app’s own layout. Polish it first with Makeup Artist Mode and beauty tools that run right on your phone.</p>
<p><span class="btn" style="cursor:default;opacity:.95">Coming soon on iPhone</span></p>
<p><img src="/brand/landing-pack.jpg" alt="One portrait saved as a story, post, square, pin and thumbnail, each framed on the face" width="1600" height="378" style="width:100%;height:auto;border-radius:16px;margin:10px 0"></p>
${sec('Platform Pack', 'Pick Social, Work or Dating and save every size at once, straight to Photos: post, square, story, pin and thumbnail, or profile, headshot and banner sizes. Each one is framed on your face, never just cropped, and platforms that share a size are saved once.')}
${sec('See each app’s layout before you post', 'Preview your photo inside a profile circle, a story safe area, or the TikTok and Reels app zones, so captions and buttons never cover your face.')}
${sec('Makeup Artist Mode', 'Already wearing professional makeup? Face Couture keeps the artist’s work and only makes it photo-ready: sharper eyes and brows, richer lips and smooth skin that keeps its texture.')}
${sec('Beauty tools on your phone', 'Skin smoothing that keeps real texture, blemish fix, lipstick and gloss, lashes, liner, brows, blush and contour, plus looks like Satin Glam, Grand Soirée and Ivory Vow. Face mapping runs on your iPhone, even in Airplane Mode.')}
${sec('For men too', 'A dedicated men’s mode with no makeup at all: subtle skin smoothing, grooming and flattering light.')}
${sec('Private by design', 'No account. Your photos stay on your iPhone.')}
<p style="margin-top:28px;font-size:15px">On a computer? <a href="/studio/">Try the web version</a>.</p>`;
  write('/', page({ url: '/', title: 'Face Couture: Platform Pack & Makeup Artist Mode | Always Luxe', desc: 'One photo, every platform: Face Couture sizes and frames your portrait on your face for every app, with Makeup Artist Mode and beauty tools that run on your iPhone.', h1: 'One photo. Every platform, framed on you.', body }), '1.0');
}

// ---------- 404, robots, sitemap ----------
fs.writeFileSync('404.html', page({ url: '/404.html', title: 'Page not found | Face Couture', desc: 'This page could not be found.', h1: 'This page has moved', body: '<p class="lead">The page you were looking for isn’t here.</p>' + cta('Start with your photo') + '<p><a href="/photo-sizes/">Photo sizes</a> · <a href="/ai-makeup-app/">AI makeup</a> · <a href="/virtual-makeup-try-on/">Makeup try-on</a></p>' }).replace('<link rel="canonical"', '<meta name="robots" content="noindex"><link rel="x-canonical"'));
fs.writeFileSync('robots.txt', `User-agent: *\nAllow: /\nDisallow: /app-preview/\nDisallow: /tools/\n\nSitemap: ${SITE}/sitemap.xml\n`);
const urls = [...out, ['/studio/', '0.6'], ['/privacy.html', '0.3'], ['/terms.html', '0.3'], ['/support.html', '0.4']];
fs.writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, p]) => `  <url><loc>${SITE + u}</loc><lastmod>${TODAY}</lastmod><priority>${p}</priority></url>`).join('\n')}\n</urlset>\n`);
console.log('pages', out.length, 'platforms', Object.keys(platforms).length);
