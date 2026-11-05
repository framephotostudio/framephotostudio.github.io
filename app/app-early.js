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
  function say(t) { try { if (typeof window.toast === 'function') window.toast(t); } catch (e) {} }
  // Writes each file to the app's private cache (needed by the native save and share sheets)
  function toCache(items) {
    return Promise.all(items.map(function (it, i) {
      return blobToBase64(it.blob).then(function (data) {
        return P.Filesystem.writeFile({ path: Date.now() + '_' + i + '_' + safeName(it.name, it.blob), data: data, directory: 'CACHE' });
      }).then(function (w) { return { uri: w.uri, video: /^video/.test((it.blob && it.blob.type) || '') }; });
    }));
  }
  // Share sheet (Messages, Instagram, AirDrop, Save Image ...)
  function nativeShareBlobs(items, title) {
    if (!(P.Filesystem && P.Share)) return Promise.reject(new Error('no native'));
    return toCache(items).then(function (files) {
      tap('MEDIUM');
      return P.Share.share({ title: title || 'Face Couture', files: files.map(function (f) { return f.uri; }), dialogTitle: 'Share your photo' });
    }).catch(function (e) { if (e && /cancel/i.test(String(e.message || e))) return; throw e; });
  }
  // Save: one tap straight into the Photos app. If Photos access is refused, the share sheet opens instead.
  function nativeSaveBlobs(items, title) {
    if (!P.Filesystem) return Promise.reject(new Error('no native'));
    var media = items.every(function (it) { return /^(image|video)\//.test((it.blob && it.blob.type) || ''); });
    if (!media || !(P.Media && P.Media.savePhoto)) return nativeShareBlobs(items, title).then(function () { try { window.dispatchEvent(new Event('fc:saved')); } catch (e) {} });
    return toCache(items).then(function (files) {
      return files.reduce(function (p, f) { return p.then(function () { return f.video ? P.Media.saveVideo({ path: f.uri }) : P.Media.savePhoto({ path: f.uri }); }); }, Promise.resolve());
    }).then(function () {
      tap('MEDIUM');
      say(items.length > 1 ? items.length + ' photos saved to Photos.' : (/^video/.test((items[0].blob && items[0].blob.type) || '') ? 'Video saved to Photos.' : 'Saved to Photos.'));
      try { window.dispatchEvent(new Event('fc:saved')); } catch (e) {}
    }).catch(function (e) {
      if (/denied|permission|not authorized|access/i.test(String((e && e.message) || e))) { say('To save straight to Photos, allow Face Couture in Settings › Privacy › Photos. Opening the share sheet instead.'); }
      return nativeShareBlobs(items, title).then(function () { try { window.dispatchEvent(new Event('fc:saved')); } catch (e2) {} });
    });
  }
  window.FCNative = { isNative: isNative, saveBlobs: nativeSaveBlobs, shareBlobs: nativeShareBlobs, tap: tap };

  // ---------- native photo picker (iPhone Photos picker and camera instead of the web file chooser) ----------
  function wantsImage(input) { var a = (input.getAttribute('accept') || '').toLowerCase(); return !a || a.indexOf('image') > -1; }
  function pickNative(input) {
    var cam = input.hasAttribute('capture'), multiple = input.multiple;
    var base = { quality: 92, resultType: 'uri', correctOrientation: true, saveToGallery: false };
    var pick = multiple && P.Camera.pickImages
      ? P.Camera.pickImages({ quality: 92, limit: 7, correctOrientation: true }).then(function (r) { return (r.photos || []).map(function (x) { return x.webPath; }); })
      : P.Camera.getPhoto(Object.assign(base, cam
          ? { source: 'CAMERA', direction: 'FRONT' }
          : { source: 'PROMPT', promptLabelHeader: 'Add a photo', promptLabelPhoto: 'Choose from Photos', promptLabelPicture: 'Take a selfie', promptLabelCancel: 'Cancel' }))
        .then(function (x) { return [x.webPath || x.dataUrl]; });
    pick.then(function (paths) {
      return Promise.all(paths.filter(Boolean).map(function (u, i) {
        return fetch(u).then(function (r) { return r.blob(); }).then(function (b) {
          var t = b.type || 'image/jpeg';
          return new File([b], 'photo-' + Date.now() + '-' + i + (t.indexOf('png') > -1 ? '.png' : '.jpg'), { type: t });
        });
      }));
    }).then(function (files) {
      if (!files.length) return;
      var dt = new DataTransfer(); files.forEach(function (f) { dt.items.add(f); });
      input.files = dt.files;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }).catch(function (e) {
      var m = String((e && e.message) || e || '');
      if (/cancel/i.test(m)) return;
      if (/denied|permission|access/i.test(m)) { say(cam ? 'To take a selfie, allow the camera for Face Couture in Settings › Privacy › Camera.' : 'To choose a photo, allow Photos for Face Couture in Settings › Privacy › Photos.'); return; }
      say('Could not open your photos. Please try again.');
    });
  }

  if (isNative) {
    // every "choose a photo" button, label or file field opens the iPhone's own picker
    if (P.Camera && P.Camera.getPhoto) {
      var origInputClick = HTMLInputElement.prototype.click;
      HTMLInputElement.prototype.click = function () {
        if (this.type === 'file' && wantsImage(this)) { pickNative(this); return; }
        return origInputClick.apply(this, arguments);
      };
      document.addEventListener('click', function (ev) {
        var t = ev.target; if (!t || !t.closest) return;
        var input = null;
        if (t.tagName === 'INPUT' && t.type === 'file') input = t;
        else { var lab = t.closest('label'); if (lab) input = lab.control || lab.querySelector('input[type=file]'); }
        if (input && input.type === 'file' && wantsImage(input)) { ev.preventDefault(); ev.stopPropagation(); pickNative(input); }
      }, true);
    }
    // downloads made with <a download> become native save/share
    var origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      var href = this.href || '';
      if (this.hasAttribute('download') && /^(blob:|data:)/.test(href)) {
        var name = this.getAttribute('download');
        hrefToBlob(href).then(function (b) { return nativeSaveBlobs([{ blob: b, name: name }]); })
          .catch(function () { say('Could not save. Please try again.'); });
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
    // the studio hands finished photos to navigator.share; a "Share" button opens the share sheet,
    // every Save button saves straight to Photos
    var lastTap = null;
    document.addEventListener('click', function (ev) { lastTap = { el: ev.target, t: Date.now() }; }, true);
    function shareSheetWanted() {
      if (!lastTap || Date.now() - lastTap.t > 20000 || !lastTap.el || !lastTap.el.closest) return false;
      var el = lastTap.el.closest('button,a,[role=button]'); if (!el) return false;
      var label = (el.textContent || '').trim().toLowerCase();
      return /share/.test(label + ' ' + (el.id || '').toLowerCase()) && !/^save\b/.test(label);
    }
    var nativeShare = function (data) {
      data = data || {};
      if (data.files && data.files.length) {
        var items = Array.prototype.map.call(data.files, function (f) { return { blob: f, name: f.name }; });
        return shareSheetWanted() ? nativeShareBlobs(items, data.title) : nativeSaveBlobs(items, data.title);
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
    // the launch screen stays up until the welcome screen is fully built, so nothing flickers while the app opens
    if (P.SplashScreen) {
      var splashDone = false, hideSplash = function () { if (splashDone) return; splashDone = true; try { P.SplashScreen.hide({ fadeOutDuration: 250 }); } catch (e) {} };
      var waitIv = setInterval(function () {
        // the studio's one-time welcome layout pass hides the banner last
        if (document.readyState === 'complete' && (document.querySelector('.fcBanner.fcHidden') || !document.querySelector('.fcBanner') || (document.body && document.body.classList.contains('ownPhoto')))) { clearInterval(waitIv); setTimeout(hideSplash, 150); }
      }, 100);
      setTimeout(function () { clearInterval(waitIv); hideSplash(); }, 6000); // never longer than this
    }
  }

})();
