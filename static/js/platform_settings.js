(function () {
    const mount = document.getElementById("settingsModuleMount");
    if (!mount) return;

    const STORAGE_KEY = "zoro_security_prefs_v1";

    const ACCENTS = Object.freeze({
        emerald: Object.freeze({
            main: "#10b981",
            light: "#6ee7b7",
            dark: "#059669",
            soft: "rgba(16, 185, 129, 0.13)",
            glow: "rgba(16, 185, 129, 0.25)",
            border: "rgba(16, 185, 129, 0.48)",
        }),
        blue: Object.freeze({
            main: "#3b82f6",
            light: "#93c5fd",
            dark: "#2563eb",
            soft: "rgba(59, 130, 246, 0.14)",
            glow: "rgba(59, 130, 246, 0.25)",
            border: "rgba(59, 130, 246, 0.48)",
        }),
        cyan: Object.freeze({
            main: "#06b6d4",
            light: "#67e8f9",
            dark: "#0891b2",
            soft: "rgba(6, 182, 212, 0.14)",
            glow: "rgba(6, 182, 212, 0.25)",
            border: "rgba(6, 182, 212, 0.48)",
        }),
        purple: Object.freeze({
            main: "#8b5cf6",
            light: "#c4b5fd",
            dark: "#7c3aed",
            soft: "rgba(139, 92, 246, 0.14)",
            glow: "rgba(139, 92, 246, 0.25)",
            border: "rgba(139, 92, 246, 0.48)",
        }),
    });

    const defaults = Object.freeze({
        lang: "ar",
        theme: "dark",
        fontSize: 15,
        accent: "emerald",
        notifications: true,
        autoDownload: true,
    });

    function normalizePrefs(rawObj) {
        const src = rawObj && typeof rawObj === "object" ? rawObj : {};
        const lang = src.lang === "en" ? "en" : "ar";
        const theme = src.theme === "light" ? "light" : "dark";
        const rawFont = parseInt(src.fontSize, 10);
        const fontSize = Number.isFinite(rawFont) ? Math.max(13, Math.min(18, rawFont)) : 15;
        const accent = Object.prototype.hasOwnProperty.call(ACCENTS, src.accent) ? src.accent : "emerald";
        return {
            lang: lang,
            theme: theme,
            fontSize: fontSize,
            accent: accent,
            notifications: src.notifications !== false,
            autoDownload: src.autoDownload !== false,
        };
    }

    function loadPrefs() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return normalizePrefs(raw ? JSON.parse(raw) : null);
        } catch (_) {
            return normalizePrefs(null);
        }
    }

    let prefs = loadPrefs();

    function applyPrefs() {
        document.documentElement.lang = prefs.lang === "en" ? "en" : "ar";
        document.documentElement.dir = prefs.lang === "en" ? "ltr" : "rtl";
        document.body.classList.toggle("light-theme", prefs.theme === "light");
        document.documentElement.style.setProperty("--base-font", prefs.fontSize + "px");

        const acc = ACCENTS[prefs.accent] || ACCENTS.emerald;
        const root = document.documentElement;
        root.style.setProperty("--primary", acc.main);
        root.style.setProperty("--primary-light", acc.light);
        root.style.setProperty("--primary-dark", acc.dark);
        root.style.setProperty("--primary-soft", acc.soft);
        root.style.setProperty("--primary-glow", acc.glow);
        root.style.setProperty("--border-bright", acc.border);

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
        } catch (_) { }
    }

    mount.className = "tool-workspace";
    mount.innerHTML =
        '<div class="settings-grid">' +
        '<div class="panel">' +
        "<h3>المظهر واللغة</h3>" +
        '<div class="field-group">' +
        '<label class="field-label">اللغة والاتجاه</label>' +
        '<div class="two-choice">' +
        '<button type="button" class="choice-pill" data-plang="ar">العربية (RTL)</button>' +
        '<button type="button" class="choice-pill" data-plang="en">English (LTR)</button>' +
        "</div>" +
        "</div>" +
        '<div class="field-group">' +
        '<label class="field-label">الوضع اللوني</label>' +
        '<div class="two-choice">' +
        '<button type="button" class="choice-pill" data-ptheme="dark">داكن (Dark)</button>' +
        '<button type="button" class="choice-pill" data-ptheme="light">فاتح (Light)</button>' +
        "</div>" +
        "</div>" +
        '<div class="field-group">' +
        '<div class="row-between"><label class="field-label pref-label-reset" for="prefFontRange">حجم الخط</label><span id="prefFontLabel" class="badge info">15px</span></div>' +
        '<input type="range" id="prefFontRange" class="range-input" min="13" max="18" value="15">' +
        "</div>" +
        '<div class="field-group">' +
        '<label class="field-label">اللون الأساسي</label>' +
        '<div class="accent-row">' +
        '<button type="button" class="accent-chip" data-paccent="emerald"><span class="swatch pref-sw-emerald"></span>زمردي</button>' +
        '<button type="button" class="accent-chip" data-paccent="blue"><span class="swatch pref-sw-blue"></span>أزرق</button>' +
        '<button type="button" class="accent-chip" data-paccent="cyan"><span class="swatch pref-sw-cyan"></span>سماوي</button>' +
        '<button type="button" class="accent-chip" data-paccent="purple"><span class="swatch pref-sw-purple"></span>بنفسجي</button>' +
        "</div>" +
        "</div>" +
        "</div>" +

        '<div class="panel">' +
        "<h3>التفضيلات والبيانات المحلية</h3>" +
        '<div class="field-group">' +
        '<label class="check-item"><input type="checkbox" id="prefNotifChk"><span>تفعيل الإشعارات التنبيهية للمنصة</span></label>' +
        "</div>" +
        '<div class="field-group">' +
        '<label class="check-item"><input type="checkbox" id="prefDlChk"><span>تفضيل التحميل المباشر للملفات والنتائج</span></label>' +
        "</div>" +
        '<div class="settings-actions-box">' +
        '<button type="button" id="prefClearLocalBtn" class="ghost-btn wide-pick-btn">إعادة ضبط إعدادات الواجهة للافتراضي</button>' +
        "</div>" +
        '<div id="prefConfirmBar" class="inline-alert danger hidden">' +
        '<p id="prefConfirmText" class="pref-confirm-msg"></p>' +
        '<div class="two-choice">' +
        '<button type="button" id="prefConfirmYes" class="ghost-btn danger-txt">تأكيد التنفيذ</button>' +
        '<button type="button" id="prefConfirmNo" class="ghost-btn">إلغاء</button>' +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>";

    let pendingAction = null;

    function syncControls() {
        document.querySelectorAll("[data-plang]").forEach(function (b) {
            b.classList.toggle("active", b.dataset.plang === prefs.lang);
        });
        document.querySelectorAll("[data-ptheme]").forEach(function (b) {
            b.classList.toggle("active", b.dataset.ptheme === prefs.theme);
        });
        document.querySelectorAll("[data-paccent]").forEach(function (b) {
            b.classList.toggle("active", b.dataset.paccent === prefs.accent);
        });
        const fr = document.getElementById("prefFontRange");
        if (fr) fr.value = prefs.fontSize;
        const fl = document.getElementById("prefFontLabel");
        if (fl) fl.textContent = prefs.fontSize + "px";
        const nc = document.getElementById("prefNotifChk");
        if (nc) nc.checked = Boolean(prefs.notifications);
        const dc = document.getElementById("prefDlChk");
        if (dc) dc.checked = Boolean(prefs.autoDownload);
    }

    document.querySelectorAll("[data-plang]").forEach(function (b) {
        b.onclick = function () {
            prefs.lang = b.dataset.plang;
            applyPrefs();
            syncControls();
            showToast(
                prefs.lang === "en"
                    ? "Direction switched to LTR"
                    : "تم التبديل إلى العربية (RTL)"
            );
        };
    });

    document.querySelectorAll("[data-ptheme]").forEach(function (b) {
        b.onclick = function () {
            prefs.theme = b.dataset.ptheme;
            applyPrefs();
            syncControls();
            showToast("تم تحديث الوضع اللوني");
        };
    });

    document.getElementById("prefFontRange").oninput = function () {
        const val = parseInt(this.value, 10);
        prefs.fontSize = Number.isFinite(val) ? Math.max(13, Math.min(18, val)) : 15;
        applyPrefs();
        syncControls();
    };

    document.querySelectorAll("[data-paccent]").forEach(function (b) {
        b.onclick = function () {
            prefs.accent = Object.prototype.hasOwnProperty.call(ACCENTS, b.dataset.paccent)
                ? b.dataset.paccent
                : "emerald";
            applyPrefs();
            syncControls();
            showToast("تم تغيير اللون الأساسي");
        };
    });

    document.getElementById("prefNotifChk").onchange = function () {
        prefs.notifications = this.checked;
        applyPrefs();
    };

    document.getElementById("prefDlChk").onchange = function () {
        prefs.autoDownload = this.checked;
        applyPrefs();
    };

    function askConfirm(msg, fn) {
        pendingAction = fn;
        document.getElementById("prefConfirmText").textContent = msg;
        document.getElementById("prefConfirmBar").classList.remove("hidden");
    }

    document.getElementById("prefConfirmNo").onclick = function () {
        pendingAction = null;
        document.getElementById("prefConfirmBar").classList.add("hidden");
    };

    document.getElementById("prefConfirmYes").onclick = async function () {
        const fn = pendingAction;
        pendingAction = null;
        document.getElementById("prefConfirmBar").classList.add("hidden");
        if (fn) await fn();
    };

    document.getElementById("prefClearLocalBtn").onclick = function () {
        askConfirm(
            "هل تريد إعادة جميع إعدادات المظهر واللغة إلى القيم الافتراضية؟",
            function () {
                prefs = normalizePrefs(defaults);
                applyPrefs();
                syncControls();
                showToast("تمت إعادة الضبط الافتراضي");
            }
        );
    };

    applyPrefs();
    syncControls();
})();
