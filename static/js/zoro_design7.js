(function () {
  var SVG = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 20v-9.5z" stroke="#10B981" fill="rgba(16,185,129,0.14)"/><path d="M9 21.5v-6h6v6" stroke="#38BDF8"/></svg>',
    catCrypto: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="3" stroke="#A78BFA" fill="rgba(124,58,237,0.16)"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11" stroke="#38BDF8"/><circle cx="12" cy="16" r="1.4" fill="#10B981" stroke="none"/></svg>',
    catScan: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" stroke="#38BDF8"/><circle cx="12" cy="12" r="5" stroke="#A78BFA" stroke-dasharray="3 2"/><path d="M12 12l5.5-5.5" stroke="#10B981" stroke-width="2.2"/><circle cx="12" cy="12" r="1.6" fill="#10B981" stroke="none"/></svg>',
    catTools: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4.5 4.5 0 0 0 5.6 5.6l-7.8 7.8a2.1 2.1 0 0 1-3-3l7.8-7.8" stroke="#10B981" fill="rgba(16,185,129,0.12)"/><circle cx="7" cy="7" r="3" stroke="#A78BFA"/><path d="M17 17l3 3" stroke="#38BDF8"/></svg>',
    catLearn: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 3 22 8.5 12 14 2 8.5 12 3" stroke="#A78BFA" fill="rgba(124,58,237,0.16)"/><path d="M6 11v5.5c0 1.8 2.7 3.5 6 3.5s6-1.7 6-3.5V11" stroke="#38BDF8"/></svg>',
    catSystem: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="6" rx="2" stroke="#38BDF8" fill="rgba(56,189,248,0.12)"/><rect x="3" y="14" width="18" height="6" rx="2" stroke="#A78BFA"/><circle cx="7" cy="7" r="1" fill="#10B981" stroke="none"/><circle cx="7" cy="17" r="1" fill="#10B981" stroke="none"/></svg>',

    textCrypto: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V4.5A1.5 1.5 0 0 1 6.5 3z" stroke="#A78BFA"/><rect x="8.5" y="12.5" width="7" height="5" rx="1.2" stroke="#10B981"/><path d="M10 12.5V11a2 2 0 0 1 4 0v1.5" stroke="#38BDF8"/></svg>',
    fileCrypto: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4.5l2 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="#38BDF8"/><path d="M15 11l3 1.2v2.4c0 2-1.2 3.4-3 4.2-1.8-.8-3-2.2-3-4.2v-2.4L15 11z" stroke="#10B981" fill="rgba(16,185,129,0.2)"/></svg>',
    hashing: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4L7 20M17 4l-2 16M4 9h16M3 15h16" stroke="#A78BFA"/><circle cx="17" cy="17" r="3" fill="#070B14" stroke="#38BDF8"/></svg>',
    scanUrl: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.1 0l2.1-2.1a5 5 0 0 0-7.1-7.1L10.8 5" stroke="#38BDF8"/><path d="M14 11a5 5 0 0 0-7.1 0l-2.1 2.1a5 5 0 0 0 7.1 7.1l1.3-1.2" stroke="#10B981"/></svg>',
    scanFile: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l5 5v12a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V4.5A1.5 1.5 0 0 1 6.5 3z" stroke="#A78BFA"/><circle cx="12" cy="13.5" r="3" stroke="#38BDF8"/><path d="M14.3 15.8L16.5 18" stroke="#10B981" stroke-width="2.2"/></svg>',
    scam: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 3.2v5.4c0 4.8-3.2 8.2-7.5 9.6-4.3-1.4-7.5-4.8-7.5-9.6V6.2L12 3z" stroke="#10B981" fill="rgba(16,185,129,0.14)"/><path d="M12 8.5v4.5" stroke="#38BDF8" stroke-width="2.2"/><circle cx="12" cy="16" r="1.1" fill="#38BDF8" stroke="none"/></svg>',
    pwdStrength: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2.5" stroke="#10B981"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#38BDF8"/><path d="M9.5 15l1.7 1.7 3.3-3.4" stroke="#A78BFA"/></svg>',
    exif: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5" stroke="#10B981"/><circle cx="8.5" cy="10" r="1.5" stroke="#38BDF8"/><path d="M4 17l5-5 3.5 3.5 2.5-2.5 5 5" stroke="#A78BFA"/></svg>',
    pwdGen: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.5" cy="12" r="4" stroke="#38BDF8"/><path d="M12.5 12H21M17.5 12v3M20.5 12v2.5" stroke="#10B981" stroke-width="2.2"/></svg>',
    qr: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.2" stroke="#38BDF8"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.2" stroke="#A78BFA"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.2" stroke="#10B981"/><path d="M14 14h2.5v2.5H14zm4 0h2.5v2.5H18zm-4 4h2.5v2.5H14zm4 0h2.5v2.5H18z" fill="#38BDF8" stroke="none"/></svg>',
    keyFile: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h16M4 12h11M4 16h8" stroke="#38BDF8"/><circle cx="17" cy="16" r="3.5" stroke="#A78BFA"/><path d="M15.8 16l.9.9 1.8-1.9" stroke="#10B981"/></svg>',
    roadmap: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="18" r="2.2" stroke="#10B981"/><circle cx="12" cy="12" r="2.2" stroke="#38BDF8"/><circle cx="19" cy="6" r="2.2" stroke="#A78BFA"/><path d="M6.8 16.5l3.4-3M13.8 10.5l3.4-3" stroke="#94A3B8"/></svg>',
    guide: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5h5.5a2.5 2.5 0 0 1 2.5 2.5v11a2 2 0 0 0-2-2H4V5.5z" stroke="#38BDF8"/><path d="M20 5.5h-5.5A2.5 2.5 0 0 0 12 8v11a2 2 0 0 1 2-2h6V5.5z" stroke="#A78BFA"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2.5 13 7 13 9.5 6.5 14 17.5 16.8 11.5 21.5 11.5" stroke="#10B981"/></svg>',
    history: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5" stroke="#38BDF8"/><polyline points="12 7.5 12 12 15.5 13.8" stroke="#10B981"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" stroke="#10B981"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="#A78BFA"/></svg>',
    about: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 3.2v5.4c0 4.8-3.2 8.2-7.5 9.6-4.3-1.4-7.5-4.8-7.5-9.6V6.2L12 3z" stroke="#38BDF8" fill="rgba(56,189,248,0.12)"/><path d="M9 9h6l-6 6h6" stroke="#10B981" stroke-width="2.1"/></svg>',
    admin: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l2-9 4.5 4L12 6l2.5 6L19 8l2 9H3z" stroke="#A78BFA" fill="rgba(124,58,237,0.18)"/><path d="M5 20h14" stroke="#10B981" stroke-width="2.2"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8.5-3 8.5h18s-3-1.5-3-8.5" stroke="#38BDF8" fill="rgba(56,189,248,0.16)"/><path d="M13.7 20a2 2 0 0 1-3.4 0" stroke="#10B981"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'
  };

  function hasPage(id) {
    return !!document.getElementById('page-' + id);
  }

  function openScanTab(tabKey) {
    if (typeof navigateTo === 'function') navigateTo('scanner');
    setTimeout(function () {
      var btn = document.querySelector('#scannerModuleMount [data-scantab="' + tabKey + '"]');
      if (btn) btn.click();
    }, 30);
  }

  function openToolTab(toolKey) {
    if (typeof openSecurityTool === 'function') {
      openSecurityTool(toolKey);
    } else if (typeof navigateTo === 'function') {
      navigateTo('tools');
      setTimeout(function () {
        var btn = document.querySelector('#toolsModuleMount [data-stool="' + toolKey + '"]');
        if (btn) btn.click();
      }, 30);
    }
  }

  function enforceFontAndTheme() {
    document.documentElement.style.setProperty('--base-font', '14px', 'important');
    document.documentElement.style.fontSize = '14px';
    try {
      var raw = localStorage.getItem('zoro_security_prefs_v1');
      var prefs = raw ? JSON.parse(raw) : {};
      prefs.fontSize = 14;
      if (prefs.theme !== 'light') prefs.theme = 'dark';
      document.body.classList.toggle('light-theme', prefs.theme === 'light');
      localStorage.setItem('zoro_security_prefs_v1', JSON.stringify(prefs));
    } catch (_) {}
  }

  function toggleThemeNow() {
    var isLight = !document.body.classList.contains('light-theme');
    document.body.classList.toggle('light-theme', isLight);
    try {
      var raw = localStorage.getItem('zoro_security_prefs_v1');
      var prefs = raw ? JSON.parse(raw) : {};
      prefs.theme = isLight ? 'light' : 'dark';
      prefs.fontSize = 14;
      localStorage.setItem('zoro_security_prefs_v1', JSON.stringify(prefs));
    } catch (_) {}
    if (typeof closeSidebar === 'function') closeSidebar();
  }

  function runAction(item) {
    if (item.action === 'openNotif') {
      if (typeof closeSidebar === 'function') closeSidebar();
      if (typeof window.zoroOpenNotifModal === 'function') window.zoroOpenNotifModal();
      return;
    }
    if (item.scanTab) {
      openScanTab(item.scanTab);
    } else if (item.toolTab) {
      openToolTab(item.toolTab);
    } else if (item.page && typeof navigateTo === 'function') {
      navigateTo(item.page);
    }
  }

  function buildTabs() {
    var scanCards = [
      {
        scanTab: 'url',
        title: 'فحص الروابط والتصيد',
        desc: 'فحص HTTPS وكشف الروابط الخبيثة وإعادة التوجيه وحماية SSRF',
        badge: 'روابط',
        tone: 'cy',
        icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="15" stroke="#38BDF8"/><circle cx="24" cy="24" r="9" stroke="#A78BFA" stroke-dasharray="4 3"/><path d="M24 24l9-9" stroke="#10B981" stroke-width="2.6"/><circle cx="24" cy="24" r="2.5" fill="#10B981"/></svg>'
      },
      {
        scanTab: 'file',
        title: 'فحص الملفات وكشف التلاعب',
        desc: 'فحص البصمة SHA-256 والتحقق من تطابق الامتداد مع بنية الملف الحقيقية',
        badge: 'ملفات',
        tone: 'pu',
        icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8h15l9 9v21a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" stroke="#A78BFA"/><circle cx="25" cy="26" r="6" stroke="#38BDF8"/><path d="M29.5 30.5L34 35" stroke="#10B981" stroke-width="2.6"/></svg>'
      }
    ];

    if (hasPage('scam-zoro')) {
      scanCards.push({
        page: 'scam-zoro',
        title: 'كاشف رسائل النصب',
        desc: 'تحليل رسائل واتساب و SMS المشبوهة وكشف الروابط المموّهة محلياً',
        badge: 'ذكي',
        tone: 'em',
        icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 8l14 6v10c0 9-6 15.5-14 18-8-2.5-14-9-14-18V14l14-6z" stroke="#10B981" fill="rgba(16,185,129,0.12)"/><path d="M24 18v8" stroke="#38BDF8" stroke-width="2.8"/><circle cx="24" cy="31" r="1.8" fill="#38BDF8"/></svg>'
      });
    }

    scanCards.push({
      scanTab: 'password',
      title: 'محلل قوة كلمة المرور',
      desc: 'قياس فوري ومحلي لمدى صمود كلمة مرورك ضد التخمين والاختراق',
      badge: 'محلي',
      tone: 'em',
      icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="11" y="21" width="26" height="17" rx="4" stroke="#10B981"/><path d="M17 21v-5a7 7 0 0 1 14 0v5" stroke="#38BDF8"/><circle cx="24" cy="29" r="2.2" fill="#A78BFA"/></svg>'
    });

    var toolCards = [];
    if (hasPage('exif-zoro')) {
      toolCards.push({
        page: 'exif-zoro',
        title: 'منظّف خصوصية الصور',
        desc: 'مسح نوع الجوال ووقت التصوير وإحداثيات GPS من الصور قبل مشاركتها',
        badge: 'خصوصية',
        tone: 'em',
        icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="12" width="32" height="24" rx="4" stroke="#10B981"/><circle cx="18" cy="21" r="2.5" stroke="#38BDF8"/><path d="M10 34l9-9 6 6 5-5 8 8" stroke="#A78BFA"/></svg>'
      });
    }

    toolCards.push(
      {
        toolTab: 'password',
        title: 'مولد كلمات المرور القوية',
        desc: 'إنشاء كلمات مرور عشوائية آمنة محلياً داخل متصفحك (CSPRNG)',
        badge: 'فوري',
        tone: 'cy',
        icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="24" r="7" stroke="#38BDF8"/><path d="M25 24h14M34 24v5M39 24v4" stroke="#10B981" stroke-width="2.4"/></svg>'
      },
      {
        toolTab: 'qr',
        title: 'مولد رموز QR القياسي',
        desc: 'تحويل أي نص أو رابط أو مفتاح إلى رمز QR قابل للمسح مع تحميل PNG',
        badge: 'QR',
        tone: 'pu',
        icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" stroke="#38BDF8"/><rect x="28" y="9" width="11" height="11" rx="2" stroke="#A78BFA"/><rect x="9" y="28" width="11" height="11" rx="2" stroke="#10B981"/><path d="M28 28h4v4h-4zm7 0h4v4h-4zm-7 7h4v4h-4zm7 0h4v4h-4z" stroke="#38BDF8"/></svg>'
      },
      {
        toolTab: 'key',
        title: 'مولد المفاتيح ومحلل الملفات',
        desc: 'توليد مفاتيح تشفير 256-bit و 512-bit وفحص خصائص أي ملف محلياً',
        badge: 'متقدم',
        tone: 'cy',
        icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h28M10 24h20M10 31h14" stroke="#38BDF8" stroke-width="2.4"/><circle cx="34" cy="31" r="6" stroke="#A78BFA"/><path d="M32 31l1.5 1.5L36.5 29" stroke="#10B981"/></svg>'
      }
    );

    return [
      {
        id: 'crypto',
        label: 'التشفير',
        hint: 'تأمين النصوص والملفات والصور والبصمات الرقمية',
        cards: [
          {
            page: 'text',
            title: 'تشفير النصوص والرسائل',
            desc: 'تأمين الرسائل بخوارزميات AES-256-GCM و ChaCha20 و RSA-2048',
            badge: 'تشفير',
            tone: 'em',
            icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8h18l8 8v22a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" stroke="#A78BFA"/><rect x="17" y="22" width="14" height="10" rx="2" stroke="#38BDF8"/><path d="M20 22v-3a4 4 0 0 1 8 0v3" stroke="#38BDF8"/></svg>'
          },
          {
            page: 'files',
            title: 'الملفات والصور وإخفاء النص',
            desc: 'تشفير الملفات بامتداد .zoro وإخفاء الرسائل السرية داخل الصور',
            badge: 'حماية',
            tone: 'cy',
            icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 14a3 3 0 0 1 3-3h9l4 4h13a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3V14z" stroke="#38BDF8"/><path d="M31 24l6 2.5v5c0 4-2.5 7-6 8.5-3.5-1.5-6-4.5-6-8.5v-5L31 24z" fill="rgba(16,185,129,0.18)" stroke="#10B981"/><path d="M28.5 31.5l1.8 1.8 3.5-3.8" stroke="#10B981"/></svg>'
          },
          {
            page: 'hashing',
            title: 'البصمة الرقمية (Hashing)',
            desc: 'توليد بصمات SHA-256 و SHA-512 و SHA-3 للتحقق من سلامة البيانات',
            badge: 'تحقق',
            tone: 'pu',
            icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 29l10-10" stroke="#A78BFA"/><path d="M16 21l-4 4a6 6 0 0 0 8.5 8.5l4-4" stroke="#A78BFA"/><path d="M32 27l4-4a6 6 0 0 0-8.5-8.5l-4 4" stroke="#38BDF8"/><text x="9" y="16" fill="#A78BFA" font-size="11" font-weight="800" stroke="none">#</text><text x="33" y="40" fill="#A78BFA" font-size="11" font-weight="800" stroke="none">#</text></svg>'
          }
        ]
      },
      {
        id: 'scan',
        label: 'الفحص',
        hint: 'كشف الروابط المشبوهة والملفات ورسائل النصب وكلمات المرور',
        cards: scanCards
      },
      {
        id: 'tools',
        label: 'الأدوات',
        hint: 'خصوصية الصور وتوليد كلمات المرور والمفاتيح ورموز QR',
        cards: toolCards
      },
      {
        id: 'learn',
        label: 'المعرفة',
        hint: 'مسار التعلم والموسوعة الأمنية وحالة خدمات المنصة',
        cards: [
          {
            page: 'roadmap',
            title: 'مسار تعلم الأمن السيبراني',
            desc: 'خطة عملية متدرجة لتعلم الأمن السيبراني والتشفير خطوة بخطوة',
            badge: 'مسار',
            tone: 'pu',
            icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="24 9 42 18 24 27 6 18 24 9" stroke="#A78BFA" fill="rgba(124,58,237,0.14)"/><path d="M13 22v10c0 3 5 6 11 6s11-3 11-6V22" stroke="#38BDF8"/></svg>'
          },
          {
            page: 'guide',
            title: 'الموسوعة ودليل المنصة',
            desc: 'شرح مبسط للخوارزميات والمفاهيم الأمنية وكيفية استخدام كل أداة',
            badge: 'مرجع',
            tone: 'cy',
            icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 12h11a4 4 0 0 1 4 4v22a3 3 0 0 0-3-3H10V12z" stroke="#38BDF8"/><path d="M38 12H27a4 4 0 0 0-4 4v22a3 3 0 0 1 3-3h12V12z" stroke="#A78BFA"/></svg>'
          },
          {
            page: 'status',
            title: 'حالة النظام والخدمات',
            desc: 'مراقبة جاهزية الخادم وقاعدة البيانات السحابية والخدمات النشطة',
            badge: 'مباشر',
            tone: 'em',
            icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 26 14 26 19 14 27 34 32 24 42 24" stroke="#10B981"/></svg>'
          }
        ]
      }
    ];
  }

  function rebuildSidebar() {
    var nav = document.querySelector('#sidebarDrawer .drawer-nav');
    if (!nav || nav.dataset.d7Organized === '4') return;
    nav.dataset.d7Organized = '4';

    var groups = [
      {
        id: 'g-crypto',
        title: 'التشفير والحماية',
        tone: 'pu',
        ico: SVG.catCrypto,
        items: [
          { page: 'text', label: 'تشفير النصوص', ico: SVG.textCrypto },
          { page: 'files', label: 'الملفات والصور والإخفاء', ico: SVG.fileCrypto },
          { page: 'hashing', label: 'البصمة الرقمية (Hashing)', ico: SVG.hashing }
        ]
      },
      {
        id: 'g-scan',
        title: 'الفحص الأمني',
        tone: 'cy',
        ico: SVG.catScan,
        items: [
          { scanTab: 'url', page: 'scanner', label: 'فحص الروابط والتصيد', ico: SVG.scanUrl },
          { scanTab: 'file', page: 'scanner', label: 'فحص الملفات', ico: SVG.scanFile },
          hasPage('scam-zoro') ? { page: 'scam-zoro', label: 'كاشف رسائل النصب', ico: SVG.scam } : null,
          { scanTab: 'password', page: 'scanner', label: 'قوة كلمة المرور', ico: SVG.pwdStrength }
        ].filter(Boolean)
      },
      {
        id: 'g-tools',
        title: 'الأدوات والخصوصية',
        tone: 'em',
        ico: SVG.catTools,
        items: [
          hasPage('exif-zoro') ? { page: 'exif-zoro', label: 'منظّف خصوصية الصور', ico: SVG.exif } : null,
          { toolTab: 'password', page: 'tools', label: 'مولد كلمات المرور', ico: SVG.pwdGen },
          { toolTab: 'qr', page: 'tools', label: 'مولد رموز QR', ico: SVG.qr },
          { toolTab: 'key', page: 'tools', label: 'مولد المفاتيح والملفات', ico: SVG.keyFile }
        ].filter(Boolean)
      },
      {
        id: 'g-learn',
        title: 'المعرفة والتعلّم',
        tone: 'pu',
        ico: SVG.catLearn,
        items: [
          { page: 'roadmap', label: 'مسار تعلم الأمن السيبراني', ico: SVG.roadmap },
          { page: 'guide', label: 'الموسوعة ودليل المنصة', ico: SVG.guide }
        ]
      },
      {
        id: 'g-system',
        title: 'النظام والحساب',
        tone: 'cy',
        ico: SVG.catSystem,
        items: [
          { page: 'status', label: 'حالة النظام والخدمات', ico: SVG.status },
          hasPage('my-history') ? { page: 'my-history', label: 'سجلي الخاص', ico: SVG.history } : null,
          { action: 'openNotif', label: 'الإشعارات والتنبيهات', ico: SVG.bell },
          { page: 'about', label: 'عن ZORO SECURITY', ico: SVG.about },
          { page: 'admin', label: 'لوحة تحكم الأدمن', ico: SVG.admin }
        ].filter(Boolean)
      }
    ];

    nav.innerHTML = '';

    var homeBtn = document.createElement('button');
    homeBtn.type = 'button';
    homeBtn.className = 'drawer-item zd7-home-bar active';
    homeBtn.dataset.page = 'dashboard';
    homeBtn.innerHTML =
      '<span class="zd7-svg-ico tone-em">' + SVG.home + '</span>' +
      '<span class="zd7-acc-label">الرئيسية</span>';
    homeBtn.addEventListener('click', function () {
      if (typeof navigateTo === 'function') navigateTo('dashboard');
    });
    nav.appendChild(homeBtn);

    groups.forEach(function (g) {
      var box = document.createElement('div');
      box.className = 'zd7-acc-group';

      var head = document.createElement('button');
      head.type = 'button';
      head.className = 'zd7-acc-head tone-' + g.tone;
      head.setAttribute('aria-expanded', 'false');
      head.innerHTML =
        '<span class="zd7-svg-ico tone-' + g.tone + '">' + g.ico + '</span>' +
        '<span class="zd7-acc-title">' + g.title + '</span>' +
        '<span class="zd7-acc-count">' + g.items.length + '</span>' +
        '<span class="zd7-acc-chev">' + SVG.chev + '</span>';

      var body = document.createElement('div');
      body.className = 'zd7-acc-body';

      g.items.forEach(function (it) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'drawer-item zd7-sub-item';
        if (it.page) btn.dataset.page = it.page;
        btn.innerHTML =
          '<span class="zd7-sub-ico">' + it.ico + '</span>' +
          '<span>' + it.label + '</span>';
        btn.addEventListener('click', function () {
          runAction(it);
        });
        body.appendChild(btn);
      });

      head.addEventListener('click', function () {
        var isOpen = box.classList.contains('open');
        nav.querySelectorAll('.zd7-acc-group.open').forEach(function (other) {
          if (other !== box) {
            other.classList.remove('open');
            var h = other.querySelector('.zd7-acc-head');
            if (h) h.setAttribute('aria-expanded', 'false');
          }
        });
        box.classList.toggle('open', !isOpen);
        head.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
      });

      box.appendChild(head);
      box.appendChild(body);
      nav.appendChild(box);
    });
  }

  function fixInnerBackButtons() {
    ['page-text', 'page-files'].forEach(function (pid) {
      var sec = document.getElementById(pid);
      if (!sec) return;
      var back = sec.querySelector('.back-btn, button[onclick*="crypto-hub"]');
      if (back) {
        back.setAttribute('onclick', "navigateTo('dashboard')");
        back.textContent = '→ الرئيسية';
      }
    });
  }

  enforceFontAndTheme();

  function mountDesign7() {
    var dash = document.getElementById('page-dashboard');
    if (!dash || dash.dataset.design7Mounted === '4') return;
    dash.dataset.design7Mounted = '4';

    var TABS = buildTabs();
    var savedTab = '';
    try { savedTab = sessionStorage.getItem('zoro_d7_tab') || ''; } catch (_) {}
    var activeTab = TABS.some(function (t) { return t.id === savedTab; }) ? savedTab : 'crypto';

    dash.innerHTML =
      '<div class="zd7-wrap">' +
        '<div class="zd7-hero">' +
          '<div class="zd7-hero-txt">' +
            '<h1 class="zd7-title">زورو للأمان</h1>' +
            '<div class="zd7-sub">حماية متكاملة</div>' +
          '</div>' +
          '<div class="zd7-shield" aria-hidden="true">' +
            '<svg viewBox="0 0 64 64" fill="none">' +
              '<path d="M32 5L9 14.5V30.5C9 45.2 18.8 57.6 32 61C45.2 57.6 55 45.2 55 30.5V14.5L32 5Z" fill="rgba(16,185,129,0.14)" stroke="url(#zd7g)" stroke-width="3"/>' +
              '<path d="M22 22.5H42L22.5 41.5H42" stroke="#34D399" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>' +
              '<defs><linearGradient id="zd7g" x1="9" y1="5" x2="55" y2="61" gradientUnits="userSpaceOnUse"><stop stop-color="#34D399"/><stop offset="1" stop-color="#38BDF8"/></linearGradient></defs>' +
            '</svg>' +
          '</div>' +
        '</div>' +
        '<div class="zd7-tabs" id="zd7Tabs"></div>' +
        '<div class="zd7-tab-hint" id="zd7TabHint"></div>' +
        '<div class="zd7-cards" id="zd7Cards"></div>' +
      '</div>';

    var tabsEl = document.getElementById('zd7Tabs');
    var hintEl = document.getElementById('zd7TabHint');
    var cardsEl = document.getElementById('zd7Cards');

    function render() {
      tabsEl.innerHTML = TABS.map(function (t) {
        return '<button type="button" class="zd7-tab ' + (t.id === activeTab ? 'active' : '') + '" data-d7="' + t.id + '">' + t.label + '</button>';
      }).join('');

      var cur = TABS.find(function (t) { return t.id === activeTab; }) || TABS[0];
      if (hintEl) hintEl.textContent = cur.hint || '';

      cardsEl.innerHTML = cur.cards.map(function (c, idx) {
        return '<button type="button" class="zd7-card tone-' + c.tone + '" data-idx="' + idx + '">' +
          '<span class="zd7-bar zd7-bar-r"></span>' +
          '<span class="zd7-bar zd7-bar-l"></span>' +
          '<div class="zd7-card-content">' +
            '<h3>' + c.title + '</h3>' +
            '<p>' + c.desc + '</p>' +
            '<span class="zd7-pill pill-' + c.tone + '">' + c.badge + '</span>' +
          '</div>' +
          '<div class="zd7-card-ico">' + c.icon + '</div>' +
        '</button>';
      }).join('');

      tabsEl.querySelectorAll('[data-d7]').forEach(function (b) {
        b.onclick = function () {
          activeTab = b.getAttribute('data-d7');
          try { sessionStorage.setItem('zoro_d7_tab', activeTab); } catch (_) {}
          render();
        };
      });

      cardsEl.querySelectorAll('[data-idx]').forEach(function (card) {
        card.onclick = function () {
          var item = cur.cards[Number(card.getAttribute('data-idx'))];
          if (item) runAction(item);
        };
      });
    }

    enforceFontAndTheme();
    render();
    rebuildSidebar();
    fixInnerBackButtons();
  }

  if (document.readyState === 'complete') {
    setTimeout(mountDesign7, 120);
  } else {
    window.addEventListener('load', function () {
      setTimeout(mountDesign7, 160);
    });
  }
})();
