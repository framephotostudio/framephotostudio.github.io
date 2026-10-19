// Creates an Apple Distribution certificate through the App Store Connect API (no Mac or Xcode needed),
// and writes dist.p12 + dist.p12.b64 + password.txt for the GitHub secrets IOS_DIST_CERT_P12_BASE64 / IOS_DIST_CERT_PASSWORD.
// Usage: APPSTORE_ISSUER_ID=... APPSTORE_KEY_ID=... APPSTORE_PRIVATE_KEY="$(cat AuthKey.p8)" node scripts/asc-cert.mjs
import crypto from 'node:crypto'; import fs from 'node:fs'; import { execSync } from 'node:child_process';
const { APPSTORE_ISSUER_ID: iss, APPSTORE_KEY_ID: kid, APPSTORE_PRIVATE_KEY: pem } = process.env;
if (!iss || !kid || !pem) { console.error('Missing APPSTORE_ISSUER_ID / APPSTORE_KEY_ID / APPSTORE_PRIVATE_KEY'); process.exit(1); }
const b64u = b => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const now = Math.floor(Date.now() / 1000);
const header = b64u(JSON.stringify({ alg: 'ES256', kid, typ: 'JWT' })), payload = b64u(JSON.stringify({ iss, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' }));
const sig = crypto.sign('sha256', Buffer.from(header + '.' + payload), { key: pem, dsaEncoding: 'ieee-p1363' });
const jwt = header + '.' + payload + '.' + b64u(sig);
execSync('openssl req -new -newkey rsa:2048 -nodes -keyout dist.key -out dist.csr -subj "/CN=Face Couture/O=Always Luxe/C=US"', { stdio: 'inherit' });
const csr = fs.readFileSync('dist.csr', 'utf8').replace(/-----[A-Z ]+-----|\n/g, '');
const r = await fetch('https://api.appstoreconnect.apple.com/v1/certificates', { method: 'POST', headers: { authorization: 'Bearer ' + jwt, 'content-type': 'application/json' },
  body: JSON.stringify({ data: { type: 'certificates', attributes: { certificateType: 'DISTRIBUTION', csrContent: csr } } }) });
const j = await r.json();
if (!r.ok) { console.error('App Store Connect refused:', JSON.stringify(j.errors || j)); process.exit(1); }
fs.writeFileSync('dist.cer', Buffer.from(j.data.attributes.certificateContent, 'base64'));
const pass = crypto.randomBytes(12).toString('hex');
execSync('openssl x509 -inform der -in dist.cer -out dist.pem', { stdio: 'inherit' });
execSync(`openssl pkcs12 -export -inkey dist.key -in dist.pem -out dist.p12 -passout pass:${pass} -legacy 2>/dev/null || openssl pkcs12 -export -inkey dist.key -in dist.pem -out dist.p12 -passout pass:${pass}`, { stdio: 'inherit' });
fs.writeFileSync('dist.p12.b64', fs.readFileSync('dist.p12').toString('base64')); fs.writeFileSync('password.txt', pass);
console.log('Certificate created:', j.data.attributes.name, 'expires', j.data.attributes.expirationDate);
console.log('Save GitHub secrets: IOS_DIST_CERT_P12_BASE64 = contents of dist.p12.b64, IOS_DIST_CERT_PASSWORD = ' + pass);
