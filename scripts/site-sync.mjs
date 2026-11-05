// One-time: bring the website's index.html in line with the iPhone app (shared changes + website helpers).
// Usage: node scripts/site-sync.mjs path/to/website/index.html
import fs from 'node:fs'; import { shared, SITE_BLOCK, SITE_HEAD } from './shared.mjs';
const f = process.argv[2]; let html = fs.readFileSync(f, 'utf8');
html = shared(html);
if (html.indexOf('/* v109 (Nov 5, 2026)') < 0) { const i = html.lastIndexOf('</body>'); html = html.slice(0, i) + SITE_BLOCK + '\n' + html.slice(i); }
if (html.indexOf('/* v109: smooth Platform Pack backdrop') < 0) { const i = html.indexOf('</head>'); html = html.slice(0, i) + SITE_HEAD + html.slice(i); }
fs.writeFileSync(f, html); console.log('website synced:', f);
