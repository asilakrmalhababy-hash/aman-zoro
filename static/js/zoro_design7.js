(function () {
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

  function runAction(item) {
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
    if (!nav || nav.dataset.d7Organized) return;
    nav.dataset.d7Organized = '1';

    var groups = [
      {
        title: 'الرئيسية',
        items: [
          { page: 'dashboard', label: 'الرئيسية', ico: '🏠' }
        ]
      },
      {
        title: 'التشفير والحماية',
        items: [
          { page: 'text', label: 'تشفير النصوص', ico: '🔐' },
          { page: 'files', label: 'الملفات والصور والإخفاء', ico: '🗂️' },
          { page: 'hashing', label: 'البصمة الرقمية (Hashing)', ico: '#️⃣' }
        ]
      },
      {
        title: 'الفحص الأمني',
        items: [
          { scanTab: 'url', page: 'scanner', label: 'فحص الروابط والتصيد', ico: '🔎' },
          { scanTab: 'file', page: 'scanner', label: 'فحص الملفات', ico: '🧪' },
          hasPage('scam-zoro') ? { page: 'scam-zoro', label: 'كاشف رسائل النصب', ico: '🛡️' } : null,
          { scanTab: 'password', page: 'scanner', label: 'قوة كلمة المرور', ico: '🔑' }
        ].filter(Boolean)
      },
      {
        title: 'الأدوات والخصوصية',
        items: [
          hasPage('exif-zoro') ? { page: 'exif-zoro', label: 'منظّف خصوصية الصور', ico: '🖼️' } : null,
          { toolTab: 'password', page: 'tools', label: 'مولد كلمات المرور', ico: '⚡' },
          { toolTab: 'qr', page: 'tools', label: 'مولد رموز QR', ico: '📱' },
          { toolTab: 'key', page: 'tools', label: 'مولد المفاتيح والملفات', ico: '🗝️' }
        ].filter(Boolean)
      },
      {
        title: 'المعرفة والنظام',
        items: [
          { page: 'roadmap', label: 'مسار تعلم الأمن السيبراني', ico: '🎓' },
          { page: 'guide', label: 'الموسوعة ودليل المنصة', ico: '📘' },
          { page: 'status', label: 'حالة النظام والخدمات', ico: '📡' },
          hasPage('my-history') ? { page: 'my-history', label: 'سجلي الخاص', ico: '🕘' } : null,
          { page: 'settings', label: 'الإعدادات', ico: '⚙️' },
          { page: 'about', label: 'عن ZORO SECURITY', ico: 'ℹ️' },
          { page: 'admin', label: 'لوحة تحكم الأدمن', ico: '👑' }
        ].filter(Boolean)
      }
    ];

    nav.innerHTML = '';
    groups.forEach(function (g) {
      var lbl = document.createElement('span');
      lbl.className = 'drawer-section-label zd7-drawer-sec';
      lbl.textContent = g.title;
      nav.appendChild(lbl);

      g.items.forEach(function (it) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'drawer-item' + (it.page === 'dashboard' ? ' active' : '');
        if (it.page) btn.dataset.page = it.page;
        btn.innerHTML = '<span class="zd7-d-ico">' + it.ico + '</span><span>' + it.label + '</span>';
        btn.addEventListener('click', function () {
          runAction(it);
        });
        nav.appendChild(btn);
      });
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

  function mountDesign7() {
    var dash = document.getElementById('page-dashboard');
    if (!dash || dash.dataset.design7Mounted === '2') return;
    dash.dataset.design7Mounted = '2';

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

    render();
    rebuildSidebar();
    fixInnerBackButtons();
  }

  window.addEventListener('load', function () {
    setTimeout(mountDesign7, 160);
  });
})();
