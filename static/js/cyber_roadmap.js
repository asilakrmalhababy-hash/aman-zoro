(function () {
    const mount = document.getElementById("roadmapModuleMount");
    if (!mount) return;

    const STAGES = Object.freeze([
        Object.freeze({
            num: "01",
            track: "foundations",
            trackLabel: "التأسيس",
            title: "أساسيات الحوسبة والشبكات والبروتوكولات",
            duration: "6 - 10 أسابيع",
            summary: "فهم كيف تنتقل البيانات عبر الشبكات والإنترنت، وكيف تعمل العناوين والمنافذ والبروتوكولات قبل تعلم الهجوم أو الدفاع.",
            skills: Object.freeze(["نموذج OSI و TCP/IP", "IPv4 / IPv6 و Subnetting", "DNS, HTTP/HTTPS, DHCP, ARP", "تحليل الحزم (Packet Capture)"]),
            project: "بناء وتصميم شبكة متعددة الموجهات مع توجيه و DHCP و DNS وتجربة تتبع الحزم.",
        }),
        Object.freeze({
            num: "02",
            track: "foundations",
            trackLabel: "التأسيس",
            title: "أنظمة التشغيل وإدارة الصلاحيات والسطر الطرفي",
            duration: "6 - 8 أسابيع",
            summary: "إتقان العمل على أنظمة Linux و Windows من سطر الأوامر، وإدارة المستخدمين، المجموعات، الصلاحيات، والخدمات.",
            skills: Object.freeze(["أوامر Linux / Bash و الصلاحيات", "إدارة المستخدمين والسياسات", "Windows Server و Active Directory", "مراقبة العمليات والسجلات (Logs)"]),
            project: "كتابة سكربتات أتمتة لإدارة الحسابات والصلاحيات وتهيئة بيئة مختبر افتراضية متعددة الأنظمة.",
        }),
        Object.freeze({
            num: "03",
            track: "crypto",
            trackLabel: "البرمجة والتشفير",
            title: "البرمجة وعلم التشفير (Cryptography)",
            duration: "6 - 10 أسابيع",
            summary: "فهم كيف تُحمى السرية والسلامة والمصادقة رياضياً، والفرق بين التشفير المتماثل، غير المتماثل، والتجزئة، والهندسة العكسية الأساسية.",
            skills: Object.freeze(["Python و C++ أو لغة برمجة قوية", "AES-GCM و ChaCha20 و RSA و Hashing", "إدارة المفاتيح و KDF و Nonce", "أساسيات البنى والمصفوفات والمنطق الرقمي"]),
            project: "تطوير أداة أو نظام يطبق تشفير النصوص والملفات وحساب البصمات الرقمية والتحقق من السلامة.",
        }),
        Object.freeze({
            num: "04",
            track: "defense",
            trackLabel: "الدفاع (Blue Team)",
            title: "العمليات الأمنية والرصد والاستجابة للحوادث (SOC)",
            duration: "8 - 12 أسبوعاً",
            summary: "اكتشاف الأنشطة المشبوهة، تحليل السجلات والتنبيهات، تقوية الأنظمة والشبكات، والاستجابة المنظمة للحوادث الأمنية.",
            skills: Object.freeze(["مراقبة السجلات و SIEM", "كشف التسلل والنشاط غير الطبيعي (IDS/EDR)", "تحليل مؤشرات الاختراق (IoCs)", "تقوية الأنظمة (Hardening) والنسخ الاحتياطي"]),
            project: "إعداد بيئة مراقبة أمنية تجمع سجلات الأنظمة وتولّد تنبيهات عند محاولات الدخول المشبوهة.",
        }),
        Object.freeze({
            num: "05",
            track: "offense",
            trackLabel: "الهجوم والاختبار",
            title: "تقييم الثغرات واختبار الويب والشبكات (Red Team)",
            duration: "8 - 12 أسبوعاً",
            summary: "فهم عقلية المهاجم وطرق استغلال الثغرات الشائعة في بيئات مختبرية مصرح بها لتحديد نقاط الضعف ومعالجتها بفاعلية.",
            skills: Object.freeze(["استطلاع الشبكات وتحديد الخدمات", "ثغرات الويب (SQLi, XSS, SSRF, Auth)", "فحص الصلاحيات وتصعيدها في المختبر", "كتابة تقارير ثغرات واضحة مع الحلول"]),
            project: "تنفيذ اختبار أمني شامل على تطبيق مختبري وتوثيق الثغرات وخطوات المعالجة.",
        }),
    ]);

    const STAGES_BY_TRACK = Object.freeze(
        STAGES.reduce(function (acc, st) {
            if (!acc[st.track]) acc[st.track] = [];
            acc[st.track].push(st);
            return acc;
        }, {})
    );

    let activeFilter = "all";

    function esc(s) {
        return String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    mount.className = "tool-workspace";
    mount.innerHTML =
        '<div class="panel roadmap-hero">' +
        '<div class="roadmap-hero-top">' +
        "<div>" +
        '<span class="hero-brand-title">CYBERSECURITY LEARNING ROADMAP</span>' +
        "<h3>خريطة ومسار تعلم الأمن السيبراني من الصفر حتى الاحتراف</h3>" +
        '<p class="field-hint">مسار عملي متدرج يبدأ بفهم الشبكات والأنظمة والتشفير، ثم يفتح أمامك مساري الدفاع (Blue Team) والاختبار (Red Team).</p>' +
        "</div>" +
        "</div>" +

        '<div class="roadmap-diagram-box" dir="ltr">' +
        '<svg class="roadmap-svg" viewBox="0 0 860 155" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<line x1="110" y1="45" x2="750" y2="45" stroke="rgba(16,185,129,0.35)" stroke-width="2.5" stroke-dasharray="6 5"/>' +
        '<path d="M560 45 L640 28 M560 45 L640 105" stroke="rgba(139,92,246,0.45)" stroke-width="2" stroke-dasharray="5 4"/>' +

        '<rect x="20" y="18" width="160" height="54" rx="12" fill="#0d151f" stroke="#10b981" stroke-width="1.6"/>' +
        '<text x="100" y="41" text-anchor="middle" fill="#6ee7b7" font-size="11" font-weight="700">01. NETWORKS</text>' +
        '<text x="100" y="58" text-anchor="middle" fill="#cbd5e1" font-size="10">TCP/IP • DNS • HTTP</text>' +

        '<rect x="210" y="18" width="160" height="54" rx="12" fill="#0d151f" stroke="#3b82f6" stroke-width="1.6"/>' +
        '<text x="290" y="41" text-anchor="middle" fill="#93c5fd" font-size="11" font-weight="700">02. OS &amp; ADMIN</text>' +
        '<text x="290" y="58" text-anchor="middle" fill="#cbd5e1" font-size="10">Linux • Windows • Logs</text>' +

        '<rect x="400" y="18" width="160" height="54" rx="12" fill="#0d151f" stroke="#06b6d4" stroke-width="1.6"/>' +
        '<text x="480" y="41" text-anchor="middle" fill="#67e8f9" font-size="11" font-weight="700">03. CODE &amp; CRYPTO</text>' +
        '<text x="480" y="58" text-anchor="middle" fill="#cbd5e1" font-size="10">AES • RSA • Hashing</text>' +

        '<rect x="640" y="6" width="200" height="46" rx="11" fill="#0e1a24" stroke="#10b981" stroke-width="1.6"/>' +
        '<text x="740" y="26" text-anchor="middle" fill="#a7f3d0" font-size="11" font-weight="700">04. BLUE TEAM (SOC)</text>' +
        '<text x="740" y="41" text-anchor="middle" fill="#94a3b8" font-size="9.5">SIEM • Threat Hunting • IR</text>' +

        '<rect x="640" y="84" width="200" height="46" rx="11" fill="#171226" stroke="#8b5cf6" stroke-width="1.6"/>' +
        '<text x="740" y="104" text-anchor="middle" fill="#ddd6fe" font-size="11" font-weight="700">05. RED TEAM &amp; WEB</text>' +
        '<text x="740" y="119" text-anchor="middle" fill="#94a3b8" font-size="9.5">Vulns • Web • Pentest</text>' +
        "</svg>" +
        "</div>" +

        '<div class="filter-pills-row">' +
        '<button type="button" class="chip-btn active" data-rfilter="all">جميع المراحل (5)</button>' +
        '<button type="button" class="chip-btn" data-rfilter="foundations">الشبكات والأنظمة</button>' +
        '<button type="button" class="chip-btn" data-rfilter="crypto">البرمجة والتشفير</button>' +
        '<button type="button" class="chip-btn" data-rfilter="defense">الدفاع (Blue Team)</button>' +
        '<button type="button" class="chip-btn" data-rfilter="offense">الاختبار (Red Team)</button>' +
        "</div>" +
        "</div>" +

        '<div id="roadmapStagesList" class="roadmap-list"></div>';

    function renderStages() {
        const listEl = document.getElementById("roadmapStagesList");
        if (!listEl) return;
        const filtered =
            activeFilter === "all"
                ? STAGES
                : STAGES_BY_TRACK[activeFilter] || STAGES;

        listEl.innerHTML = filtered
            .map(function (st) {
                const skillsHtml = st.skills
                    .map(function (sk) {
                        return "<li>" + esc(sk) + "</li>";
                    })
                    .join("");

                return (
                    '<article class="panel roadmap-stage-card">' +
                    '<div class="stage-top-bar">' +
                    '<div class="stage-title-group">' +
                    '<span class="stage-num-badge">' +
                    esc(st.num) +
                    "</span>" +
                    "<div>" +
                    "<h3>" +
                    esc(st.title) +
                    "</h3>" +
                    '<span class="stage-meta">' +
                    esc(st.trackLabel) +
                    " • المدة التقديرية: " +
                    esc(st.duration) +
                    "</span>" +
                    "</div>" +
                    "</div>" +
                    "</div>" +
                    '<p class="stage-desc">' +
                    esc(st.summary) +
                    "</p>" +
                    '<div class="stage-two-cols">' +
                    '<div class="stage-box">' +
                    "<h4>المهارات الأساسية</h4>" +
                    '<ul class="report-list">' +
                    skillsHtml +
                    "</ul>" +
                    "</div>" +
                    '<div class="stage-box">' +
                    "<h4>تطبيق عملي مقترح</h4>" +
                    "<p>" +
                    esc(st.project) +
                    "</p>" +
                    "</div>" +
                    "</div>" +
                    "</article>"
                );
            })
            .join("");
    }

    document.querySelectorAll("[data-rfilter]").forEach(function (btn) {
        btn.onclick = function () {
            activeFilter = btn.dataset.rfilter;
            document.querySelectorAll("[data-rfilter]").forEach(function (b) {
                b.classList.toggle("active", b.dataset.rfilter === activeFilter);
            });
            renderStages();
        };
    });

    renderStages();
})();
