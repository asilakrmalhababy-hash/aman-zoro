(function () {
  var deferredPrompt = null;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function showToast(msg) {
    var t = document.getElementById('toast');
    if (t) {
      t.textContent = msg;
      t.classList.remove('hidden');
      clearTimeout(window._zd7ToastT);
      window._zd7ToastT = setTimeout(function () { t.classList.add('hidden'); }, 3000);
    }
  }

  function ensureInstallBar() {
    if (isStandalone()) return;
    var hero = document.querySelector('.zd7-hero');
    if (!hero || document.getElementById('zd7InstallBtn')) return;

    var bar = document.createElement('div');
    bar.id = 'zd7PwaWrap';
    bar.className = 'zd7-pwa-wrap';
    bar.innerHTML =
      '<button type="button" id="zd7InstallBtn" class="zd7-pwa-btn">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>' +
        '<span>تثبيت التطبيق على جهازك (يعمل بدون إنترنت)</span>' +
      '</button>';

    hero.insertAdjacentElement('afterend', bar);

    document.getElementById('zd7InstallBtn').addEventListener('click', async function () {
      var isEn = document.documentElement.lang === 'en';
      if (deferredPrompt) {
        deferredPrompt.prompt();
        var choice = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (choice && choice.outcome === 'accepted') {
          bar.remove();
          showToast(isEn ? 'Installing ZORO SECURITY app ✓' : 'جاري تثبيت تطبيق ZORO SECURITY ✓');
        }
      } else {
        var isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
        showToast(isIos
          ? (isEn ? 'Tap Share ⬆️ then "Add to Home Screen"' : 'اضغط زر المشاركة ⬆️ ثم اختر "إضافة إلى الشاشة الرئيسية"')
          : (isEn ? 'Open browser menu (⋮) → "Install App"' : 'افتح قائمة المتصفح (⋮) ثم اضغط "تثبيت التطبيق"'));
      }
    });
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    ensureInstallBar();
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    var w = document.getElementById('zd7PwaWrap');
    if (w) w.remove();
    showToast('تم تثبيت تطبيق ZORO SECURITY بنجاح ✓');
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {});
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(ensureInstallBar, 120); });
  } else {
    setTimeout(ensureInstallBar, 120);
  }
})();
