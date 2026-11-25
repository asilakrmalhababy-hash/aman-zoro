(function () {
  function genStrongPass(len) {
    const u = 'ABCDEFGHJKLMNPQRSTUVWXYZ', l = 'abcdefghijkmnopqrstuvwxyz', n = '23456789', s = '!@#$%^&*_-+=';
    const all = u + l + n + s, arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    const out = [u[arr[0] % u.length], l[arr[1] % l.length], n[arr[2] % n.length], s[arr[3] % s.length]];
    for (let i = 4; i < len; i++) out.push(all[arr[i] % all.length]);
    for (let i = out.length - 1; i > 0; i--) {
      const r = new Uint32Array(1); crypto.getRandomValues(r);
      const j = r[0] % (i + 1); [out[i], out[j]] = [out[j], out[i]];
    }
    return out.join('');
  }

  function enhanceInputs() {
    document.querySelectorAll('#page-text input[type="password"], #page-files input[type="password"]').forEach(inp => {
      if (inp.dataset.zoroQuick) return;
      inp.dataset.zoroQuick = '1';
      const bar = document.createElement('div');
      bar.style.cssText = 'display:flex;justify-content:flex-end;gap:6px;margin-top:6px;';
      const bGen = document.createElement('button');
      bGen.type = 'button';
      bGen.className = 'ghost-btn';
      bGen.style.cssText = 'font-size:11px;padding:4px 10px;white-space:nowrap;';
      bGen.textContent = '⚡ توليد كلمة سر قوية ونسخها';
      bGen.onclick = async () => {
        const pw = genStrongPass(16);
        inp.value = pw;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        try { await navigator.clipboard.writeText(pw); } catch (_) {}
        if (typeof showToast === 'function') showToast('✓ تم توليد كلمة سر قوية ونسخها!');
      };
      bar.appendChild(bGen);
      inp.parentNode.insertBefore(bar, inp.nextSibling);
    });
  }

  function addExtraSidebarAndViews() {
    const nav = document.querySelector('.drawer-nav');
    const main = document.querySelector('main') || document.querySelector('.main-content');
    if (!nav || !main || document.getElementById('page-exif-zoro')) return;

    const firstDivider = nav.querySelector('.drawer-divider');
    const quickLinks = [
      { page: 'crypto-hub', label: 'خدمات التشفير', icon: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' },
      { page: 'scanner', label: 'الفحص الأمني الشامل', icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' },
      { page: 'hashing', label: 'البصمة الرقمية (Hash)', icon: '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>' },
      { page: 'exif-zoro', label: 'منظّف خصوصية الصور', icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>' },
      { page: 'scam-zoro', label: 'كاشف رسائل النصب', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
      { page: 'roadmap', label: 'مسار تعلم الأمن السيبراني', icon: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/>' }
    ];

    quickLinks.forEach(item => {
      if (nav.querySelector(`[data-page="${item.page}"]`)) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'drawer-item';
      b.dataset.page = item.page;
      b.innerHTML = `<svg class="d-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${item.icon}</svg><span>${item.label}</span>`;
      b.onclick = () => { if (typeof navigateTo === 'function') navigateTo(item.page); };
      if (firstDivider) nav.insertBefore(b, firstDivider);
      else nav.appendChild(b);
    });

    const exifSec = document.createElement('section');
    exifSec.id = 'page-exif-zoro';
    exifSec.className = 'page-view';
    exifSec.innerHTML = `
      <div class="page-head"><h2>منظّف خصوصية الصور (EXIF & GPS)</h2><button type="button" class="ghost-btn" onclick="navigateTo('dashboard')">← الرئيسية</button></div>
      <div class="panel max-narrow" style="margin:0 auto;">
        <h3>مسح بيانات الكاميرا والموقع من الصور</h3>
        <p class="field-hint">يعيد رسم الصورة محلياً داخل متصفحك لإزالة نوع الجوال ووقت التصوير وإحداثيات GPS بالكامل.</p>
        <div class="field-group">
          <input type="file" id="zExifInp" accept="image/*" class="hidden" />
          <button type="button" id="zExifPick" class="ghost-btn wide-pick-btn">اختيار صورة لتنظيف بياناتها</button>
        </div>
        <img id="zExifPrev" class="hidden" style="max-height:180px;margin:12px auto;border-radius:14px;display:block;" alt="Preview" />
        <div id="zExifInfo" class="file-summary-box hidden"></div>
        <button type="button" id="zExifClean" class="primary-btn full-w hidden" style="margin-top:12px;">تنظيف وتحميل الصورة الآمنة</button>
        <canvas id="zExifCan" class="hidden"></canvas>
      </div>`;
    main.appendChild(exifSec);

    const scamSec = document.createElement('section');
    scamSec.id = 'page-scam-zoro';
    scamSec.className = 'page-view';
    scamSec.innerHTML = `
      <div class="page-head"><h2>كاشف رسائل النصب والاحتيال</h2><button type="button" class="ghost-btn" onclick="navigateTo('dashboard')">← الرئيسية</button></div>
      <div class="panel max-narrow" style="margin:0 auto;">
        <h3>تحليل رسائل واتساب و SMS المشبوهة</h3>
        <p class="field-hint">يكشف الاستعجال، طلب أكواد OTP، الروابط المموّهة، وانتحال البنوك محلياً 100%.</p>
        <div class="field-group">
          <textarea id="zScamTxt" class="text-input" rows="4" placeholder="الصق الرسالة المشبوهة هنا..."></textarea>
        </div>
        <button type="button" id="zScamBtn" class="primary-btn full-w">تحليل الرسالة الآن</button>
        <div id="zScamOut" class="file-summary-box hidden" style="margin-top:14px;"></div>
      </div>`;
    main.appendChild(scamSec);

    let loadedExImg = null, exName = 'zoro-clean.jpg';
    const exInp = document.getElementById('zExifInp');
    document.getElementById('zExifPick').onclick = () => exInp.click();
    exInp.onchange = () => {
      const f = exInp.files && exInp.files[0]; if (!f) return;
      exName = 'clean-' + f.name.replace(/\.[^.]+$/, '') + '.jpg';
      const url = URL.createObjectURL(f), img = new Image();
      img.onload = () => {
        loadedExImg = img;
        const pv = document.getElementById('zExifPrev'); pv.src = url; pv.classList.remove('hidden');
        const info = document.getElementById('zExifInfo');
        info.classList.remove('hidden');
        info.innerHTML = `<strong>${f.name.slice(0, 30)}</strong><div class="field-hint">الأبعاد: ${img.width}×${img.height} • الحجم: ${(f.size / 1024).toFixed(1)} KB</div>`;
        document.getElementById('zExifClean').classList.remove('hidden');
      };
      img.src = url;
    };
    document.getElementById('zExifClean').onclick = () => {
      if (!loadedExImg) return;
      const c = document.getElementById('zExifCan'); c.width = loadedExImg.width; c.height = loadedExImg.height;
      c.getContext('2d').drawImage(loadedExImg, 0, 0);
      const a = document.createElement('a'); a.href = c.toDataURL('image/jpeg', 0.94); a.download = exName;
      a.click();
      if (typeof showToast === 'function') showToast('✓ تم مسح كل بيانات EXIF و GPS وتحميل الصورة!');
    };

    document.getElementById('zScamBtn').onclick = () => {
      const raw = (document.getElementById('zScamTxt').value || '').trim();
      const out = document.getElementById('zScamOut');
      if (!raw) return;
      const norm = raw.replace(/[\u064B-\u065F\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').toLowerCase();
      let score = 0; const reasons = [];
      if (/https?:\/\/|\[dot\]|bit\.ly|tinyurl/i.test(raw)) { score += 30; reasons.push('رابط خارجي أو مموّه'); }
      if (/(otp|رمز التحقق|كود|كلمه المرور|تحديث بيانات|cvv|بطاقه)/i.test(norm)) { score += 35; reasons.push('طلب بيانات حساسة أو كود تحقق'); }
      if (/(عاجل|فورا|24 ساعه|ايقاف|تجميد|حظر)/i.test(norm)) { score += 25; reasons.push('أسلوب استعجال وتهديد'); }
      if (/(مبروك|ربحت|جائزه|منحه|حواله|رسوم)/i.test(norm)) { score += 25; reasons.push('إغراء مالي أو طلب رسوم'); }
      score = Math.min(100, score);
      const badge = score >= 60 ? 'danger' : (score >= 30 ? 'warn' : 'safe');
      const txt = score >= 60 ? 'خطر عالٍ — رسالة نصب محتملة جداً!' : (score >= 30 ? 'مشبوهة — احذر قبل الضغط!' : 'تبدو آمنة — لم تُرصد مؤشرات احتيال');
      out.classList.remove('hidden');
      out.innerHTML = `<div class="row-between"><strong>${txt}</strong><span class="badge ${badge}">${score}%</span></div>` +
        (reasons.length ? `<div class="field-hint" style="margin-top:8px;">المؤشرات: ${reasons.join(' • ')}</div>` : '');
    };
  }

  window.addEventListener('load', () => setTimeout(() => { enhanceInputs(); addExtraSidebarAndViews(); }, 180));
})();
