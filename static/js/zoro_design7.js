(function () {
  const TABS = [
    {
      id: 'crypto',
      label: 'التشفير',
      cards: [
        {
          page: 'text',
          title: 'تشفير النصوص',
          desc: 'تأمين الرسائل والنصوص بخوارزميات متقدمة (AES-256 و ChaCha20 و RSA)',
          badge: 'آمن',
          tone: 'em',
          icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8h18l8 8v22a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" stroke="#A78BFA"/><rect x="17" y="22" width="14" height="10" rx="2" stroke="#38BDF8"/><path d="M20 22v-3a4 4 0 0 1 8 0v3" stroke="#38BDF8"/></svg>'
        },
        {
          page: 'files',
          title: 'تشفير الملفات والصور',
          desc: 'حماية الصور والوثائق الحساسة وإخفاء النصوص داخل الصور بلمسة واحدة',
          badge: 'تشفير',
          tone: 'cy',
          icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 14a3 3 0 0 1 3-3h9l4 4h13a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3V14z" stroke="#38BDF8"/><path d="M31 24l6 2.5v5c0 4-2.5 7-6 8.5-3.5-1.5-6-4.5-6-8.5v-5L31 24z" fill="rgba(16,185,129,0.18)" stroke="#10B981"/><path d="M28.5 31.5l1.8 1.8 3.5-3.8" stroke="#10B981"/></svg>'
        },
        {
          page: 'hashing',
          title: 'التجزئة الرقمية',
          desc: 'توليد بصمات فريدة للبيانات (SHA-256 / SHA-3) والتحقق من صحتها',
          badge: 'نشط',
          tone: 'pu',
          icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 29l10-10" stroke="#A78BFA"/><path d="M16 21l-4 4a6 6 0 0 0 8.5 8.5l4-4" stroke="#A78BFA"/><path d="M32 27l4-4a6 6 0 0 0-8.5-8.5l-4 4" stroke="#38BDF8"/><text x="9" y="16" fill="#A78BFA" font-size="11" font-weight="800" stroke="none">#</text><text x="33" y="40" fill="#A78BFA" font-size="11" font-weight="800" stroke="none">#</text></svg>'
        }
      ]
    },
    {
      id: 'scan',
      label: 'الفحص',
      cards: [
        {
          page: 'scanner',
          title: 'الفحص الأمني الشامل',
          desc: 'فحص الروابط والملفات وكشف التصيّد والـ SSRF بدقة عالية',
          badge: 'فحص',
          tone: 'cy',
          icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="15" stroke="#38BDF8"/><circle cx="24" cy="24" r="9" stroke="#A78BFA" stroke-dasharray="4 3"/><path d="M24 24l9-9" stroke="#10B981" stroke-width="2.6"/><circle cx="24" cy="24" r="2.5" fill="#10B981"/></svg>'
        },
        {
          page: 'scam-zoro',
          title: 'كاشف رسائل النصب',
          desc: 'تحليل رسائل واتساب و SMS المشبوهة وكشف الروابط المموّهة محلياً',
          badge: 'ذكي',
          tone: 'em',
          icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 8l14 6v10c0 9-6 15.5-14 18-8-2.5-14-9-14-18V14l14-6z" stroke="#10B981" fill="rgba(16,185,129,0.12)"/><path d="M24 18v8" stroke="#38BDF8" stroke-width="2.8"/><circle cx="24" cy="31" r="1.8" fill="#38BDF8"/></svg>'
        },
        {
          page: 'status',
          title: 'حالة النظام والخدمات',
          desc: 'مراقبة جاهزية الخادم وقاعدة البيانات السحابية TiDB Cloud',
          badge: 'مباشر',
          tone: 'pu',
          icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 26 14 26 19 14 27 34 32 24 42 24" stroke="#A78BFA"/></svg>'
        }
      ]
    },
    {
      id: 'privacy',
      label: 'الخصوصية',
      cards: [
        {
          page: 'exif-zoro',
          title: 'منظّف خصوصية الصور',
          desc: 'مسح نوع الجوال ووقت التصوير وإحداثيات GPS من الصور قبل مشاركتها',
          badge: 'نظيف',
          tone: 'em',
          icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="12" width="32" height="24" rx="4" stroke="#10B981"/><circle cx="18" cy="21" r="2.5" stroke="#38BDF8"/><path d="M10 34l9-9 6 6 5-5 8 8" stroke="#A78BFA"/></svg>'
        },
        {
          page: 'tools',
          title: 'الباركود وكلمات المرور',
          desc: 'مولد رموز QR قياسية + مولد كلمات مرور ومفاتيح تشفير آمنة',
          badge: 'فوري',
          tone: 'cy',
          icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" stroke="#38BDF8"/><rect x="28" y="9" width="11" height="11" rx="2" stroke="#A78BFA"/><rect x="9" y="28" width="11" height="11" rx="2" stroke="#10B981"/><path d="M28 28h4v4h-4zm7 0h4v4h-4zm-7 7h4v4h-4zm7 0h4v4h-4z" stroke="#38BDF8"/></svg>'
        },
        {
          page: 'roadmap',
          title: 'الموسوعة ومسار التعلم',
          desc: 'مسار عملي متكامل لتعلّم الأمن السيبراني والتشفير خطوة بخطوة',
          badge: 'تعلّم',
          tone: 'pu',
          icon: '<svg viewBox="0 0 48 48" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="24 9 42 18 24 27 6 18 24 9" stroke="#A78BFA" fill="rgba(124,58,237,0.14)"/><path d="M13 22v10c0 3 5 6 11 6s11-3 11-6V22" stroke="#38BDF8"/></svg>'
        }
      ]
    }
  ];

  function mountDesign7() {
    const dash = document.getElementById('page-dashboard');
    if (!dash || dash.dataset.design7Mounted) return;
    dash.dataset.design7Mounted = '1';

    let activeTab = sessionStorage.getItem('zoro_d7_tab') || 'crypto';

    dash.innerHTML = `
      <div class="zd7-wrap">
        <div class="zd7-hero">
          <div class="zd7-hero-txt">
            <h1 class="zd7-title">زورو للأمان</h1>
            <div class="zd7-sub">حماية متكاملة</div>
          </div>
          <div class="zd7-shield" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
              <path d="M32 5L9 14.5V30.5C9 45.2 18.8 57.6 32 61C45.2 57.6 55 45.2 55 30.5V14.5L32 5Z" fill="rgba(16,185,129,0.14)" stroke="url(#zd7g)" stroke-width="3"/>
              <path d="M22 22.5H42L22.5 41.5H42" stroke="#34D399" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
              <defs><linearGradient id="zd7g" x1="9" y1="5" x2="55" y2="61" gradientUnits="userSpaceOnUse"><stop stop-color="#34D399"/><stop offset="1" stop-color="#38BDF8"/></linearGradient></defs>
            </svg>
          </div>
        </div>
        <div class="zd7-tabs" id="zd7Tabs"></div>
        <div class="zd7-cards" id="zd7Cards"></div>
      </div>`;

    const tabsEl = document.getElementById('zd7Tabs');
    const cardsEl = document.getElementById('zd7Cards');

    function render() {
      tabsEl.innerHTML = TABS.map(t =>
        `<button type="button" class="zd7-tab ${t.id === activeTab ? 'active' : ''}" data-d7="${t.id}">${t.label}</button>`
      ).join('');

      const cur = TABS.find(t => t.id === activeTab) || TABS[0];
      cardsEl.innerHTML = cur.cards.map(c => `
        <button type="button" class="zd7-card tone-${c.tone}" data-go="${c.page}">
          <span class="zd7-bar zd7-bar-r"></span>
          <span class="zd7-bar zd7-bar-l"></span>
          <div class="zd7-card-content">
            <h3>${c.title}</h3>
            <p>${c.desc}</p>
            <span class="zd7-pill pill-${c.tone}">${c.badge}</span>
          </div>
          <div class="zd7-card-ico">${c.icon}</div>
        </button>`).join('');

      tabsEl.querySelectorAll('[data-d7]').forEach(b => {
        b.onclick = () => {
          activeTab = b.getAttribute('data-d7');
          try { sessionStorage.setItem('zoro_d7_tab', activeTab); } catch (_) {}
          render();
        };
      });

      cardsEl.querySelectorAll('[data-go]').forEach(card => {
        card.onclick = () => {
          const target = card.getAttribute('data-go');
          if (typeof navigateTo === 'function') navigateTo(target);
        };
      });
    }

    render();
  }

  window.addEventListener('load', () => setTimeout(mountDesign7, 80));
})();
