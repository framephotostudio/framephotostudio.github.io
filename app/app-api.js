// Face Couture app: backend connection (AI looks, allowances, Pro, promo codes, privacy-safe events).
// Runs in <head> so the studio's own /api/* calls are routed to the Face Couture API with the device token.
// Nothing here runs against the AI until window.FC_API points at a deployed backend.
(function () {
  'use strict';
  var CFG = window.FC_CONFIG || {};
  var API = (CFG.apiUrl || '').replace(/\/+$/, '');
  window.FC_API = API;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var token = store.get('fc-token'), device = store.get('fc-device');
  var platform = (window.Capacitor && window.Capacitor.getPlatform) ? window.Capacitor.getPlatform() : 'web';
  var ready = null;
  function hello() {
    if (!API) return Promise.resolve(null);
    if (token) return Promise.resolve(token);
    if (ready) return ready;
    ready = fetch(API + '/api/hello', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ platform: platform }) })
      .then(function (r) { return r.json(); }).then(function (j) { token = j.token; device = j.device; store.set('fc-token', token); store.set('fc-device', device); return token; })
      .catch(function () { ready = null; return null; });
    return ready;
  }
  // map the studio's AI form onto the API's tools
  var TASK_MAP = { refine: 'refine', enhance: 'enhance', background: 'background', remove: 'vanish', film: 'refine', glam: 'glam', headshot: 'headshot', travel: 'travel', tryon: 'tryon', blur: 'blur' };
  var origFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (!/^\/api\//.test(url)) return origFetch(input, init);
    if (!API) return Promise.resolve(new Response(JSON.stringify({ ai_ready: false, error: 'AI is not connected yet.' }), { status: url === '/api/status' ? 200 : 503, headers: { 'content-type': 'application/json' } }));
    init = init || {};
    return hello().then(function (t) {
      var headers = Object.assign({}, init.headers || {}); if (t) headers.authorization = 'Bearer ' + t;
      var path = url;
      if (url === '/api/refine' && init.body) {
        try {
          var b = JSON.parse(init.body); var task = TASK_MAP[b.task] || 'refine';
          if (b.task === 'film') b.detail = ('cinematic film look, ' + (b.detail || '')).trim();
          b.task = task; path = '/api/ai';
          if (window.__fcGarment && task === 'tryon') { b.garment = window.__fcGarment.data; b.category = window.__fcGarment.category; }
          if (window.__fcAIOptions) Object.assign(b, window.__fcAIOptions);
          init = Object.assign({}, init, { body: JSON.stringify(b) });
        } catch (e) {}
      }
      var dims = Promise.resolve();
      if (path === '/api/ai') dims = new Promise(function (res) { try { var b2 = JSON.parse(init.body); var im = new Image(); im.onload = function () { b2.width = im.naturalWidth; b2.height = im.naturalHeight; init = Object.assign({}, init, { body: JSON.stringify(b2) }); res(); }; im.onerror = function () { res(); }; im.src = b2.image; } catch (e) { res(); } });
      return dims.then(function () { return origFetch(API + path, Object.assign({}, init, { headers: headers })); }).then(function (r) {
        if (r.status === 401 && t) { token = null; store.set('fc-token', ''); }
        if (path === '/api/ai') try { window.dispatchEvent(new CustomEvent('fc:ai', { detail: { ok: r.ok } })); } catch (e) {}
        return r;
      });
    });
  };
  function api(path, body) {
    return hello().then(function (t) {
      return origFetch(API + path, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (t || '') }, body: body ? JSON.stringify(body) : undefined });
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw Object.assign(new Error(j.error || 'Failed'), j); return j; }); });
  }
  function track(name, extra) {
    if (!API || !CFG.analytics) return;
    try { api('/api/event', Object.assign({ name: name }, extra || {})).catch(function () {}); } catch (e) {}
  }
  window.FCApi = { api: api, hello: hello, track: track, device: function () { return device; }, url: API, platform: platform, config: CFG };
})();
