// Face Couture app bridge, loaded in <head> before the studio code so saving and sharing
// go through the native iOS/Android share sheet (Save Image / Save Video -> Photos).
(function () {
  'use strict';
  document.documentElement.classList.add('fc-app');
  var Cap = window.Capacitor || null;
  var P = (Cap && Cap.Plugins) || {};
  var isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  function tap(style) {
    try { if (isNative && P.Haptics) P.Haptics.impact({ style: style || 'LIGHT' }); } catch (e) {}
  }
  // ---------- native save / share ----------
  function blobToBase64(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(',')[1]); };
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }
  function hrefToBlob(href) { return fetch(href).then(function (r) { return r.blob(); }); }
  function safeName(n, blob) {
    n = (n || 'FaceCouture').replace(/[^\w.\- ]+/g, '').trim() || 'FaceCouture';
    if (!/\.\w{2,4}$/.test(n)) {
      var ty = (blob && blob.type) || '';
      n += ty.indexOf('video') === 0 ? (ty.indexOf('mp4') > -1 ? '.mp4' : '.webm') : (ty.indexOf('png') > -1 ? '.png' : '.jpg');
    }
    return n;
  }
  // Writes the file to the app cache, then opens the iOS/Android share sheet
  // ("Save Image" / "Save Video" puts it straight into Photos).
  function nativeSaveBlobs(items, title) {
    if (!(P.Filesystem && P.Share)) return Promise.reject(new Error('no native'));
    return Promise.all(items.map(function (it, i) {
      return blobToBase64(it.blob).then(function (data) {
        return P.Filesystem.writeFile({ path: Date.now() + '_' + i + '_' + safeName(it.name, it.blob), data: data, directory: 'CACHE' });
      }).then(function (w) { return w.uri; });
    })).then(function (uris) {
      tap('MEDIUM');
      try { window.dispatchEvent(new Event('fc:saved')); } catch (e) {}
      return P.Share.share({ title: title || 'Face Couture', files: uris, dialogTitle: 'Save or share your photo' });
    }).catch(function (e) {
      if (e && /cancel/i.test(String(e.message || e))) return;
      throw e;
    });
  }
  window.FCNative = { isNative: isNative, saveBlobs: nativeSaveBlobs, tap: tap };

  if (isNative) {
    // downloads made with <a download> become native save/share
    var origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      var href = this.href || '';
      if (this.hasAttribute('download') && /^(blob:|data:)/.test(href)) {
        var name = this.getAttribute('download');
        hrefToBlob(href).then(function (b) { return nativeSaveBlobs([{ blob: b, name: name }]); })
          .catch(function () { try { window.alert('Could not save. Please try again.'); } catch (e) {} });
        return;
      }
      return origClick.apply(this, arguments);
    };
    document.addEventListener('click', function (ev) {
      var a = ev.target && ev.target.closest && ev.target.closest('a[download]');
      if (a && /^(blob:|data:)/.test(a.href || '')) { ev.preventDefault(); a.click(); }
    }, true);

    // Web Share with files uses the native share sheet
    var webShare = navigator.share ? navigator.share.bind(navigator) : null;
    var nativeShare = function (data) {
      data = data || {};
      if (data.files && data.files.length) {
        return nativeSaveBlobs(Array.prototype.map.call(data.files, function (f) { return { blob: f, name: f.name }; }), data.title);
      }
      if (P.Share) return P.Share.share({ title: data.title, text: data.text, url: data.url });
      return webShare ? webShare(data) : Promise.reject(new Error('share unavailable'));
    };
    // locked so nothing later in the page can switch native sharing off
    try { Object.defineProperty(navigator, 'canShare', { value: function () { return true; }, writable: false, configurable: false }); } catch (e) {}
    try { Object.defineProperty(navigator, 'share', { value: nativeShare, writable: false, configurable: false }); } catch (e) {}

    // light haptic on look / chip choices
    document.addEventListener('click', function (ev) {
      var el = ev.target && ev.target.closest && ev.target.closest('.chip,.vibe,.look,[data-vibe],[data-look],.seg button,.strengthRow button');
      if (el) tap('LIGHT');
    }, true);

    // status bar + splash
    try { if (P.StatusBar) { P.StatusBar.setStyle({ style: 'LIGHT' }); if (P.StatusBar.setOverlaysWebView) P.StatusBar.setOverlaysWebView({ overlay: true }); } } catch (e) {}
    try { if (P.SplashScreen) setTimeout(function () { P.SplashScreen.hide(); }, 300); } catch (e) {}
  }

})();
