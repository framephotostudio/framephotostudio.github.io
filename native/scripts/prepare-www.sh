#!/usr/bin/env bash
# Builds native/www from the live studio (app-preview), so the store app opens instantly from files inside the app.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf www && mkdir -p www
cp ../app-preview/*.js ../app-preview/app.css www/
cp ../face-parser.onnx www/
python3 - <<'PY'
import re
s = open('../app-preview/index.html', encoding='utf-8').read()
n = s.count('<base href="/app-preview/">'); assert n == 1, 'base tag not found'
s = s.replace('<base href="/app-preview/">', '<base href="/">', 1)
s = s.replace("MODEL='../face-parser.onnx'", "MODEL='face-parser.onnx'")
assert "'../face-parser.onnx'" not in s
s = s.replace('<meta name="robots" content="noindex">', '', 1)
open('www/index.html', 'w', encoding='utf-8').write(s)
# store build: no preview banner, no web analytics
cfg = open('../app-preview/app-config.js', encoding='utf-8').read()
cfg = re.sub(r'"preview":\s*true', '"preview":false', cfg)
cfg = re.sub(r'"analytics":\s*true', '"analytics":false', cfg)
assert '"preview":false' in cfg
open('www/app-config.js', 'w', encoding='utf-8').write(cfg)
PY
echo "www ready: $(du -sh www | cut -f1)"
