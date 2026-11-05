// One-time: bring the website's index.html in line with the iPhone app (shared changes + website helpers).
// Usage: node scripts/site-sync.mjs path/to/website/studio/index.html
import fs from 'node:fs'; import { shared, SITE_BLOCK, SITE_HEAD } from './shared.mjs';
const f = process.argv[2]; let html = fs.readFileSync(f, 'utf8');
html = shared(html);
{ // replace an older copy of the website helpers with the current one
  const a = html.indexOf('<style id="fcPackDoneCss">'), m = html.indexOf('/* v109 (Nov 5, 2026)'), b = m > -1 ? html.indexOf('</script>', m) + '</script>'.length : -1;
  if (a > -1 && b > a) html = html.slice(0, a) + SITE_BLOCK + html.slice(b);
  else { const i = html.lastIndexOf('</body>'); html = html.slice(0, i) + SITE_BLOCK + '\n' + html.slice(i); } }
{ const m = html.indexOf('/* v109: smooth Platform Pack backdrop'), a = m > -1 ? html.lastIndexOf('<script>', m) : -1, b = m > -1 ? html.indexOf('</script>', m) + 9 : -1;
  if (a > -1 && b > a) html = html.slice(0, a) + SITE_HEAD + html.slice(b);
  else { const i = html.indexOf('</head>'); html = html.slice(0, i) + SITE_HEAD + html.slice(i); } }
fs.writeFileSync(f, html); console.log('website synced:', f);
