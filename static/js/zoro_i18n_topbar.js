(function () {
  var STORAGE_KEY = 'zoro_security_prefs_v1';

  var SUN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5" stroke="#FBBF24" fill="rgba(251,191,36,0.2)"/><path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" stroke="#FBBF24"/></svg>';
  var MOON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.8 6.8 0 0 0 9.7 9.7z" stroke="#38BDF8" fill="rgba(56,189,248,0.18)"/></svg>';

  var DICT = {
    'الرئيسية': 'Home',
    '→ الرئيسية': '← Home',
    '→ العودة للرئيسية': '← Back to Home',
    '→ خدمات التشفير': '← Encryption',
    'زورو للأمان': 'ZORO SECURITY',
    'حماية متكاملة': 'Complete Protection',
    'منصة ويب مستقلة': 'Independent Web Platform',
    'التشفير': 'Encrypt',
    'الفحص': 'Scan',
    'الأدوات': 'Tools',
    'المعرفة': 'Learn',
    'تأمين النصوص والملفات والصور والبصمات الرقمية': 'Secure messages, files, images & digital hashes',
    'كشف الروابط المشبوهة والملفات ورسائل النصب وكلمات المرور': 'Detect phishing links, malicious files, scams & weak passwords',
    'خصوصية الصور وتوليد كلمات المرور والمفاتيح ورموز QR': 'Image privacy cleaner, password/key generators & QR codes',
    'مسار التعلم والموسوعة الأمنية وحالة خدمات المنصة': 'Cybersecurity roadmap, encyclopedia & live system status',
    'تشفير النصوص والرسائل': 'Text & Message Encryption',
    'تأمين الرسائل بخوارزميات AES-256-GCM و ChaCha20 و RSA-2048': 'Encrypt messages with AES-256-GCM, ChaCha20 & RSA-2048',
    'تشفير': 'Encrypt',
    'الملفات والصور وإخفاء النص': 'Files, Images & Steganography',
    'تشفير الملفات بامتداد .zoro وإخفاء الرسائل السرية داخل الصور': 'Encrypt files (.zoro) and hide secret text inside images',
    'حماية': 'Protect',
    'البصمة الرقمية (Hashing)': 'Digital Hash (Hashing)',
    'البصمة الرقمية': 'Digital Hash',
    'توليد بصمات SHA-256 و SHA-512 و SHA-3 للتحقق من سلامة البيانات': 'Generate SHA-256, SHA-512 & SHA-3 hashes to verify integrity',
    'تحقق': 'Verify',
    'فحص الروابط والتصيد': 'URL & Phishing Scanner',
    'فحص HTTPS وكشف الروابط الخبيثة وإعادة التوجيه وحماية SSRF': 'Check HTTPS, phishing indicators, redirects & SSRF protection',
    'روابط': 'URLs',
    'فحص الملفات وكشف التلاعب': 'File Integrity Scanner',
    'فحص البصمة SHA-256 والتحقق من تطابق الامتداد مع بنية الملف الحقيقية': 'Verify SHA-256 hash and detect spoofed file extensions',
    'ملفات': 'Files',
    'كاشف رسائل النصب': 'Scam Message Detector',
    'تحليل رسائل واتساب و SMS المشبوهة وكشف الروابط المموّهة محلياً': 'Analyze suspicious WhatsApp & SMS messages locally',
    'ذكي': 'Smart',
    'محلل قوة كلمة المرور': 'Password Strength Analyzer',
    'قياس فوري ومحلي لمدى صمود كلمة مرورك ضد التخمين والاختراق': 'Instant local analysis of password strength against attacks',
    'محلي': 'Local',
    'منظّف خصوصية الصور': 'Image Privacy Cleaner (EXIF)',
    'مسح نوع الجوال ووقت التصوير وإحداثيات GPS من الصور قبل مشاركتها': 'Strip device model, timestamp & GPS coordinates before sharing',
    'خصوصية': 'Privacy',
    'مولد كلمات المرور القوية': 'Strong Password Generator',
    'إنشاء كلمات مرور عشوائية آمنة محلياً داخل متصفحك (CSPRNG)': 'Generate secure random passwords locally via CSPRNG',
    'فوري': 'Instant',
    'مولد رموز QR القياسي': 'Standard QR Code Generator',
    'تحويل أي نص أو رابط أو مفتاح إلى رمز QR قابل للمسح مع تحميل PNG': 'Convert any text, URL or key into a scannable PNG QR code',
    'مولد المفاتيح ومحلل الملفات': 'Key Generator & File Info',
    'توليد مفاتيح تشفير 256-bit و 512-bit وفحص خصائص أي ملف محلياً': 'Generate 256/512-bit keys and inspect file metadata locally',
    'متقدم': 'Pro',
    'مسار تعلم الأمن السيبراني': 'Cybersecurity Roadmap',
    'خطة ومسار تعلم الأمن السيبراني': 'Cybersecurity Learning Roadmap',
    'خطة عملية متدرجة لتعلم الأمن السيبراني والتشفير خطوة بخطوة': 'Step-by-step practical roadmap for cybersecurity & cryptography',
    'مسار': 'Path',
    'الموسوعة ودليل المنصة': 'Encyclopedia & Platform Guide',
    'دليل المنصة والموسوعة': 'Platform Guide & Encyclopedia',
    'دليل خدمات المنصة والموسوعة': 'Platform Services Guide & Encyclopedia',
    'شرح مبسط للخوارزميات والمفاهيم الأمنية وكيفية استخدام كل أداة': 'Clear guide to encryption algorithms, security concepts & tools',
    'مرجع': 'Guide',
    'حالة النظام والخدمات': 'System & Services Status',
    'مراقبة جاهزية الخادم وقاعدة البيانات السحابية والخدمات النشطة': 'Monitor server uptime, TiDB Cloud database & active services',
    'مباشر': 'Live',
    'التشفير والحماية': 'Encryption & Protection',
    'تشفير النصوص': 'Text Encryption',
    'تشفير وفك تشفير النصوص': 'Text Encryption & Decryption',
    'تشفير الصور والملفات': 'File & Image Encryption',
    'الفحص الأمني': 'Security Scanner',
    'فحص الروابط': 'URL Scanner',
    'فحص الملفات': 'File Scanner',
    'قوة كلمة المرور': 'Password Strength',
    'الأدوات والخصوصية': 'Tools & Privacy',
    'الأدوات الأمنية المساعدة': 'Security Utility Tools',
    'مولد كلمات المرور': 'Password Generator',
    'مولد المفاتيح': 'Key Generator',
    'مولد رموز QR': 'QR Generator',
    'مولد QR': 'QR Generator',
    'معلومات الملف': 'File Info',
    'مولد المفاتيح والملفات': 'Keys & File Info',
    'المعرفة والتعلّم': 'Knowledge & Learning',
    'النظام والحساب': 'System & Account',
    'سجلي الخاص': 'My Activity History',
    'تبديل الوضع (ليلي / نهاري)': 'Switch Theme (Dark / Light)',
    'عن ZORO SECURITY': 'About ZORO SECURITY',
    'لوحة تحكم الأدمن': 'Admin Dashboard',
    'خدمات التشفير': 'Encryption Services',
    'تحديث الفحص ↻': 'Refresh Status ↻',
    'الخدمات النشطة حالياً': 'Currently Active Services',
    'فحص الرابط الآن': 'Scan URL Now',
    'فحص الملف الآن': 'Scan File Now',
    'توليد كلمة مرور': 'Generate Password',
    'توليد مفتاح تشفير': 'Generate Key',
    'إنشاء رمز QR': 'Generate QR Code',
    'تحميل صورة QR (PNG)': 'Download QR (PNG)',
    'نسخ': 'Copy',
    'جاهزة': 'Ready',
    'طول كلمة المرور': 'Password Length',
    'أحرف كبيرة (A-Z)': 'Uppercase (A-Z)',
    'أحرف صغيرة (a-z)': 'Lowercase (a-z)',
    'أرقام (0-9)': 'Numbers (0-9)',
    'رموز خاصة (!@#$)': 'Symbols (!@#$)',
    'الرابط المراد فحصه': 'URL to Scan',
    'المحتوى المراد تحويله لـ QR': 'Text or URL for QR',
    'قوة المفتاح (Key Size)': 'Key Size',
    'صيغة Hex': 'Hex Format',
    'صيغة Base64': 'Base64 Format',
    'فحص الروابط (URL Security Scanner)': 'URL Security Scanner',
    'فحص الملفات (File Security Scanner)': 'File Security Scanner',
    'محلل قوة كلمات المرور (تحليل محلي فقط)': 'Password Strength Analyzer (Local Only)',
    'مولد المفاتيح التشفيرية (Symmetric Keys)': 'Symmetric Key Generator',
    'محلل معلومات الملفات': 'File Metadata Analyzer',
    'تشفير النص': 'Encrypt Text',
    'فك تشفير النص': 'Decrypt Text',
    'تشفير الملف': 'Encrypt File',
    'فك تشفير الملف': 'Decrypt File',
    'إخفاء نص في صورة': 'Hide Text in Image',
    'استخراج نص من صورة': 'Extract Text from Image',
    'تمت العملية بنجاح': 'Operation completed successfully',
    'ZORO SECURITY • سهل الاستخدام. قوي في الحماية.': 'ZORO SECURITY • Easy to use. Strong protection.'
  };

  var PLACEHOLDERS = {
    'أدخل نصاً أو رابطاً...': 'Enter text or URL...',
    'أدخل النص هنا...': 'Enter text here...',
    'أدخل كلمة المرور...': 'Enter password...',
    'أدخل مفتاح التشفير...': 'Enter encryption key...'
  };

  var origText = new WeakMap();
  var origPlaceholder = new WeakMap();
  var currentLang = 'ar';
  var observer = null;
  var mutTimer = null;

  function loadPrefs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var p = raw ? JSON.parse(raw) : {};
      return {
        theme: p.theme === 'light' ? 'light' : 'dark',
        lang: p.lang === 'en' ? 'en' : 'ar',
        fontSize: 14
      };
    } catch (_) {
      return { theme: 'dark', lang: 'ar', fontSize: 14 };
    }
  }

  function savePrefs(patch) {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var p = raw ? JSON.parse(raw) : {};
      Object.assign(p, patch, { fontSize: 14 });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch (_) {}
  }

  function translateTree(root, lang) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var parent = node.parentElement;
      if (!parent) continue;
      var tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'CODE') continue;
      var raw = node.nodeValue;
      if (!raw || !raw.trim()) continue;

      if (!origText.has(node)) {
        origText.set(node, raw);
      }
      var arVal = origText.get(node);
      var key = arVal.trim();

      if (lang === 'en') {
        if (DICT[key]) {
          var lead = arVal.match(/^\s*/)[0];
          var trail = arVal.match(/\s*$/)[0];
          var target = lead + DICT[key] + trail;
          if (node.nodeValue !== target) node.nodeValue = target;
        }
      } else {
        if (node.nodeValue !== arVal) node.nodeValue = arVal;
      }
    }

    root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(function (el) {
      if (!origPlaceholder.has(el)) origPlaceholder.set(el, el.getAttribute('placeholder') || '');
      var arPh = origPlaceholder.get(el);
      if (lang === 'en' && PLACEHOLDERS[arPh]) {
        el.setAttribute('placeholder', PLACEHOLDERS[arPh]);
      } else if (lang === 'ar') {
        el.setAttribute('placeholder', arPh);
      }
    });
  }

  function updateButtons() {
    var themeBtn = document.getElementById('zd7ThemeBtn');
    var langBtn = document.getElementById('zd7LangBtn');
    var isLight = document.body.classList.contains('light-theme');
    if (themeBtn) {
      themeBtn.innerHTML = isLight ? MOON_SVG : SUN_SVG;
      themeBtn.setAttribute('title', isLight ? (currentLang === 'en' ? 'Dark Mode' : 'الوضع الليلي') : (currentLang === 'en' ? 'Light Mode' : 'الوضع النهاري'));
    }
    if (langBtn) {
      langBtn.textContent = currentLang === 'en' ? 'ع' : 'E';
      langBtn.setAttribute('title', currentLang === 'en' ? 'التبديل للعربية' : 'Switch to English');
    }
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function startObserver() {
    stopObserver();
    if (currentLang !== 'en') return;
    observer = new MutationObserver(function () {
      if (mutTimer) clearTimeout(mutTimer);
      mutTimer = setTimeout(function () {
        if (currentLang === 'en') translateTree(document.body, 'en');
      }, 60);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function applyLang(lang) {
    currentLang = lang === 'en' ? 'en' : 'ar';
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'en' ? 'ltr' : 'rtl';
    savePrefs({ lang: currentLang });
    stopObserver();
    translateTree(document.body, currentLang);
    updateButtons();
    if (currentLang === 'en') startObserver();
  }

  function toggleTheme() {
    var isLight = !document.body.classList.contains('light-theme');
    document.body.classList.toggle('light-theme', isLight);
    savePrefs({ theme: isLight ? 'light' : 'dark' });
    updateButtons();
  }

  function mountTopbarControls() {
    var left = document.querySelector('.topbar-left');
    if (!left || left.dataset.zd7ControlsMounted) return;
    left.dataset.zd7ControlsMounted = '1';

    left.innerHTML =
      '<div class="zd7-top-actions">' +
        '<button type="button" id="zd7ThemeBtn" class="zd7-top-btn" aria-label="تبديل الوضع"></button>' +
        '<button type="button" id="zd7LangBtn" class="zd7-top-btn zd7-lang-btn" aria-label="تبديل اللغة">E</button>' +
      '</div>';

    document.getElementById('zd7ThemeBtn').addEventListener('click', toggleTheme);
    document.getElementById('zd7LangBtn').addEventListener('click', function () {
      applyLang(currentLang === 'en' ? 'ar' : 'en');
    });

    var prefs = loadPrefs();
    document.body.classList.toggle('light-theme', prefs.theme === 'light');
    applyLang(prefs.lang);
  }

  if (document.readyState === 'complete') {
    setTimeout(mountTopbarControls, 220);
  } else {
    window.addEventListener('load', function () {
      setTimeout(mountTopbarControls, 260);
    });
  }
})();
