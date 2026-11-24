(function () {
    const mount = document.getElementById("adminModuleMount");
    if (!mount) return;

    let auth = { username: "", pin: "", role: "admin", fullName: "" };
    let activeSec = "dashboard";
    let data = null;

    const ICONS = Object.freeze({
        shield: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 3L6 10.5V22.5C6 33.8 13.7 43.4 24 46C34.3 43.4 42 33.8 42 22.5V10.5L24 3Z" stroke="currentColor" stroke-width="2.5" fill="rgba(124, 58, 237, 0.18)"/><path d="M16 16.5H32L16.5 32H32" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        active: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
        ops: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
        ban: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
        lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
        unlock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>',
        file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
        scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
    });

    const MINI_TONES = Object.freeze({
        encryptions: "tone-purple",
        decryptions: "tone-blue",
        files_processed: "tone-emerald",
        security_scans: "tone-amber",
    });

    function esc(s) {
        return String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function fmtNum(v) {
        return Number(v || 0).toLocaleString();
    }

    mount.className = "tool-workspace";
    mount.innerHTML =
        '<div id="admLoginBox" class="adm-auth-card">' +
        '<div class="adm-auth-brand">' +
        '<div class="adm-auth-logo">' + ICONS.shield + "</div>" +
        '<div class="adm-auth-title-wrap">' +
        '<span class="adm-auth-kicker">ZORO SECURITY • ADMIN CONSOLE</span>' +
        "<h3>تسجيل الدخول</h3>" +
        "</div>" +
        "</div>" +
        '<div class="field-group">' +
        '<label class="field-label" for="admUserInp">Admin Name</label>' +
        '<input type="text" id="admUserInp" class="text-input" dir="ltr" autocomplete="username" placeholder="Admin Name">' +
        "</div>" +
        '<div class="field-group">' +
        '<label class="field-label" for="admPinInp">Password</label>' +
        '<input type="password" id="admPinInp" class="text-input" dir="ltr" autocomplete="current-password" placeholder="Password">' +
        "</div>" +
        '<div id="admLoginErr" class="inline-alert danger hidden"></div>' +
        '<div class="adm-auth-actions">' +
        '<button type="button" id="admLoginBtn" class="primary-btn adm-compact-btn">تسجيل الدخول</button>' +
        "</div>" +
        "</div>" +

        '<div id="admShell" class="hidden">' +
        '<div class="panel adm-header-panel">' +
        '<div class="row-between adm-flex-wrap">' +
        '<div class="adm-identity">' +
        '<span class="adm-role-pill" id="admRoleBadgeText">Super Admin</span>' +
        "<div>" +
        '<h3 id="admWelcomeTitle">لوحة تحكم الأدمن</h3>' +
        '<span class="field-hint">إدارة شاملة للمستخدمين، الصلاحيات، والأمان</span>' +
        "</div>" +
        "</div>" +
        '<div class="adm-actions-row">' +
        '<button type="button" id="admRefreshBtn" class="ghost-btn">تحديث ↻</button>' +
        '<button type="button" id="admLogoutBtn" class="ghost-btn danger-txt">تسجيل الخروج</button>' +
        "</div>" +
        "</div>" +
        '<div class="adm-nav-tabs">' +
        '<button type="button" class="adm-tab-btn active" data-asec="dashboard">1. الرئيسية (Dashboard)</button>' +
        '<button type="button" class="adm-tab-btn" data-asec="users">2. المستخدمون</button>' +
        '<button type="button" class="adm-tab-btn" data-asec="admins">3. المسؤولون</button>' +
        '<button type="button" class="adm-tab-btn" data-asec="security">4. مركز الأمان</button>' +
        '<button type="button" class="adm-tab-btn" data-asec="logs">5. سجل النشاط</button>' +
        '<button type="button" class="adm-tab-btn" data-asec="settings">6. إعدادات المنصة</button>' +
        "</div>" +
        "</div>" +

        '<div id="asec-dashboard" class="asec-pane">' +
        '<div class="panel adm-mb-16">' +
        '<div class="row-between adm-mb-14">' +
        "<h3>نظرة عامة وحالة الموقع</h3>" +
        '<span id="admSiteStatusBadge" class="badge safe">Online • يعمل بشكل طبيعي</span>' +
        "</div>" +
        '<div id="admKpiGrid" class="adm-kpi-grid"></div>' +
        "</div>" +

        '<div class="adm-dash-split">' +
        '<div class="panel">' +
        '<div class="row-between adm-flex-wrap-sm">' +
        "<h3>النشاط خلال آخر 7 أيام</h3>" +
        '<div class="adm-legend">' +
        '<span><i class="lg-dot u"></i> مستخدمون</span>' +
        '<span><i class="lg-dot a"></i> عمليات</span>' +
        "</div>" +
        "</div>" +
        '<div id="admChartBox" class="adm-chart-bars"></div>' +
        "</div>" +

        '<div class="panel">' +
        '<h3 class="adm-mb-12">تفصيل العمليات</h3>' +
        '<div id="admOpsBreakdown" class="adm-mini-stats"></div>' +
        "</div>" +
        "</div>" +
        "</div>" +

        '<div id="asec-users" class="asec-pane hidden">' +
        '<div class="panel adm-mb-16">' +
        "<h3>حظر مستخدم (مؤقت أو دائم)</h3>" +
        '<div class="stage-two-cols">' +
        '<input type="text" id="uBanId" class="text-input" dir="ltr" placeholder="معرّف المستخدم (User ID)">' +
        '<input type="text" id="uBanReason" class="text-input" placeholder="سبب الحظر">' +
        "</div>" +
        '<div class="stage-two-cols adm-mt-10">' +
        '<select id="uBanDur" class="text-input">' +
        '<option value="0">حظر دائم</option>' +
        '<option value="1">حظر مؤقت — ساعة واحدة</option>' +
        '<option value="24">حظر مؤقت — 24 ساعة</option>' +
        '<option value="168">حظر مؤقت — 7 أيام</option>' +
        "</select>" +
        '<button type="button" id="uBanSubmit" class="primary-btn">تنفيذ الحظر</button>' +
        "</div>" +
        "</div>" +
        '<div class="panel">' +
        '<div class="row-between adm-mb-12 adm-flex-wrap-md">' +
        "<h3>قائمة المستخدمين</h3>" +
        '<input type="text" id="uSearchInp" class="text-input adm-search-inp" placeholder="بحث بالاسم أو ID...">' +
        "</div>" +
        '<div id="admUsersList" class="status-list"></div>' +
        "</div>" +
        "</div>" +

        '<div id="asec-admins" class="asec-pane hidden">' +
        '<div class="panel adm-mb-16">' +
        "<h3>إضافة مسؤول جديد</h3>" +
        '<p class="field-hint">حساب Super Admin الأساسي محمي تلقائياً من الحذف أو الحظر أو سحب الصلاحية.</p>' +
        '<div class="stage-two-cols">' +
        '<div class="field-group">' +
        '<label class="field-label" for="newAdmUser">Admin Name (اسم الدخول بالإنجليزية)</label>' +
        '<input type="text" id="newAdmUser" class="text-input" dir="ltr" placeholder="مثال: ayman_admin">' +
        "</div>" +
        '<div class="field-group">' +
        '<label class="field-label" for="newAdmName">الاسم الكامل</label>' +
        '<input type="text" id="newAdmName" class="text-input" placeholder="مثال: Ayman Al-Hababi">' +
        "</div>" +
        "</div>" +
        '<div class="stage-two-cols adm-mt-10">' +
        '<div class="field-group">' +
        '<label class="field-label" for="newAdmRole">الصلاحية</label>' +
        '<select id="newAdmRole" class="text-input">' +
        '<option value="admin">Admin</option>' +
        '<option value="super_admin">Super Admin</option>' +
        "</select>" +
        "</div>" +
        '<div class="field-group">' +
        '<label class="field-label" for="newAdmPin">Password</label>' +
        '<input type="password" id="newAdmPin" class="text-input" dir="ltr" placeholder="4 أحرف أو أرقام فأكثر">' +
        "</div>" +
        "</div>" +
        '<button type="button" id="newAdmSubmit" class="primary-btn full-w adm-mt-10">إضافة المسؤول</button>' +
        "</div>" +
        '<div class="panel">' +
        "<h3>قائمة المسؤولين والصلاحيات</h3>" +
        '<div id="admAdminsList" class="status-list"></div>' +
        "</div>" +
        "</div>" +

        '<div id="asec-security" class="asec-pane hidden">' +
        '<div class="panel adm-mb-16">' +
        "<h3>إدارة حظر عناوين IP</h3>" +
        '<div class="stage-two-cols">' +
        '<input type="text" id="ipBanAddr" class="text-input" dir="ltr" placeholder="عنوان IP (مثال: 192.168.1.50)">' +
        '<input type="text" id="ipBanReason" class="text-input" placeholder="سبب الحظر">' +
        "</div>" +
        '<button type="button" id="ipBanBtn" class="primary-btn full-w adm-mt-10">حظر عنوان IP</button>' +
        '<div id="admBannedIpsList" class="status-list adm-mt-12"></div>' +
        "</div>" +
        '<div class="panel">' +
        "<h3>محاولات الدخول الفاشلة والأحداث الأمنية</h3>" +
        '<div id="admSecEventsList" class="status-list"></div>' +
        "</div>" +
        "</div>" +

        '<div id="asec-logs" class="asec-pane hidden">' +
        '<div class="panel">' +
        '<div class="row-between adm-mb-12 adm-flex-wrap-md">' +
        '<div><h3>سجل الأنشطة</h3><span class="field-hint">يُحتفظ بآخر 200 سجل فقط تلقائياً</span></div>' +
        '<button type="button" id="admClearLogsBtn" class="ghost-btn danger-txt">مسح السجل</button>' +
        "</div>" +
        '<div id="admLogsList" class="status-list"></div>' +
        "</div>" +
        "</div>" +

        '<div id="asec-settings" class="asec-pane hidden">' +
        '<div class="panel max-narrow">' +
        "<h3>إعدادات المنصة والتحكم</h3>" +
        '<div class="field-group">' +
        '<label class="field-label" for="setMaxMb">الحد الأقصى لحجم الملفات (MB)</label>' +
        '<input type="number" id="setMaxMb" class="text-input" min="1" max="500" value="100">' +
        "</div>" +
        '<div class="field-group">' +
        '<label class="field-label" for="setRpm">الحد الأقصى للطلبات في الدقيقة (Rate Limit)</label>' +
        '<input type="number" id="setRpm" class="text-input" min="5" max="500" value="45">' +
        "</div>" +
        '<div class="field-group">' +
        '<label class="check-item"><input type="checkbox" id="setMaint"><span>تفعيل وضع الصيانة (Maintenance Mode)</span></label>' +
        '<label class="check-item"><input type="checkbox" id="setToolText"><span>تفعيل أداة تشفير النصوص</span></label>' +
        '<label class="check-item"><input type="checkbox" id="setToolFile"><span>تفعيل أداة تشفير الملفات</span></label>' +
        '<label class="check-item"><input type="checkbox" id="setToolHash"><span>تفعيل البصمة الرقمية</span></label>' +
        '<label class="check-item"><input type="checkbox" id="setToolScan"><span>تفعيل الفاحص الأمني</span></label>' +
        "</div>" +
        '<div class="field-group">' +
        '<label class="field-label" for="setNewPin">تغيير Password الحساب الإداري (اختياري)</label>' +
        '<input type="password" id="setNewPin" class="text-input" dir="ltr" placeholder="اتركه فارغاً لعدم التغيير">' +
        "</div>" +
        '<button type="button" id="setSaveBtn" class="primary-btn full-w">حفظ الإعدادات</button>' +
        "</div>" +
        "</div>" +
        "</div>";

    function clearSession() {
        auth = { username: "", pin: "", role: "admin", fullName: "" };
        data = null;
        document.getElementById("admPinInp").value = "";
        document.getElementById("admShell").classList.add("hidden");
        document.getElementById("admLoginBox").classList.remove("hidden");
    }

    async function admPost(url, payload) {
        const res = await fetch(url, {
            method: "POST",
            cache: "no-store",
            headers: {
                "Content-Type": "application/json",
                "X-Admin-User": auth.username,
                "X-Admin-Pin": auth.pin,
            },
            body: JSON.stringify(
                Object.assign({}, payload || {}, { username: auth.username, pin: auth.pin })
            ),
        });
        const j = await res.json();
        if (!res.ok || !j.success) {
            if (res.status === 401 && data) {
                clearSession();
            }
            throw new Error(j.error || "حدث خطأ في الطلب.");
        }
        if (j.data) data = j.data;
        if (j.admin) {
            auth.role = j.admin.role;
            auth.fullName = j.admin.full_name;
        }
        return j;
    }

    async function submitLogin() {
        const errEl = document.getElementById("admLoginErr");
        const loginBtn = document.getElementById("admLoginBtn");
        errEl.classList.add("hidden");
        const u = document.getElementById("admUserInp").value.trim();
        const p = document.getElementById("admPinInp").value.trim();
        if (!u || !p) {
            errEl.textContent = "يرجى إدخال Admin Name و Password.";
            errEl.classList.remove("hidden");
            return;
        }
        auth = { username: u, pin: p, role: "admin", fullName: u };
        loginBtn.disabled = true;
        try {
            await admPost("/api/admin/overview", {});
            document.getElementById("admLoginBox").classList.add("hidden");
            document.getElementById("admShell").classList.remove("hidden");
            renderAll();
            showToast("تم تسجيل الدخول بنجاح");
        } catch (e) {
            auth = { username: "", pin: "", role: "admin", fullName: "" };
            errEl.textContent = e.message;
            errEl.classList.remove("hidden");
        } finally {
            loginBtn.disabled = false;
        }
    }

    document.getElementById("admLoginBtn").onclick = submitLogin;
    document.getElementById("admPinInp").addEventListener("keydown", function (e) {
        if (e.key === "Enter") submitLogin();
    });

    document.getElementById("admLogoutBtn").onclick = clearSession;

    document.getElementById("admRefreshBtn").onclick = async function () {
        try {
            await admPost("/api/admin/overview", {});
            renderAll();
            showToast("تم التحديث");
        } catch (e) {
            showToast(e.message);
        }
    };

    document.querySelectorAll("[data-asec]").forEach(function (btn) {
        btn.onclick = function () {
            activeSec = btn.dataset.asec;
            document.querySelectorAll("[data-asec]").forEach(function (b) {
                b.classList.toggle("active", b.dataset.asec === activeSec);
            });
            document.querySelectorAll(".asec-pane").forEach(function (p) {
                p.classList.toggle("hidden", p.id !== "asec-" + activeSec);
            });
        };
    });

    function kpiCard(label, val, tone, iconSvg) {
        return (
            '<div class="adm-stat-card tone-' +
            esc(tone) +
            '">' +
            '<div class="adm-stat-meta">' +
            "<span>" +
            esc(label) +
            "</span>" +
            "<strong>" +
            fmtNum(val) +
            "</strong>" +
            "</div>" +
            '<div class="adm-stat-ico">' +
            iconSvg +
            "</div>" +
            "</div>"
        );
    }

    function miniStatRow(label, val, iconSvg, toneKey) {
        return (
            '<div class="adm-mini-row">' +
            '<div class="adm-mini-left">' +
            '<span class="adm-mini-ico ' +
            esc(MINI_TONES[toneKey] || "tone-purple") +
            '">' +
            iconSvg +
            "</span>" +
            "<span>" +
            esc(label) +
            "</span>" +
            "</div>" +
            "<strong>" +
            fmtNum(val) +
            "</strong>" +
            "</div>"
        );
    }

    function renderAll() {
        if (!data) return;
        const st = data.stats || {};
        const s = data.settings || {};

        document.getElementById("admWelcomeTitle").textContent =
            "مرحباً، " + (auth.fullName || auth.username);
        document.getElementById("admRoleBadgeText").textContent =
            auth.role === "super_admin" ? "Super Admin" : "Admin";

        const maintOn = s.maintenance_mode === "1";
        const stBadge = document.getElementById("admSiteStatusBadge");
        stBadge.textContent = maintOn
            ? "Maintenance • وضع الصيانة"
            : "Online • يعمل بشكل طبيعي";
        stBadge.className = "badge " + (maintOn ? "warn" : "safe");

        document.getElementById("admKpiGrid").innerHTML =
            kpiCard("إجمالي المستخدمين", data.total_users, "purple", ICONS.users) +
            kpiCard(
                "المستخدمون النشطون (24س)",
                data.active_users,
                "emerald",
                ICONS.active
            ) +
            kpiCard("إجمالي العمليات", data.total_operations, "blue", ICONS.ops) +
            kpiCard("المحظورون", data.banned_users, "red", ICONS.ban);

        document.getElementById("admOpsBreakdown").innerHTML =
            miniStatRow("عمليات التشفير", st.encryptions, ICONS.lock, "encryptions") +
            miniStatRow(
                "عمليات فك التشفير",
                st.decryptions,
                ICONS.unlock,
                "decryptions"
            ) +
            miniStatRow(
                "معالجة الملفات",
                st.files_processed,
                ICONS.file,
                "files_processed"
            ) +
            miniStatRow(
                "فحص الروابط والملفات",
                st.security_scans,
                ICONS.scan,
                "security_scans"
            );

        const chart = data.chart_7d || [];
        const maxVal = Math.max(
            1,
            ...chart.map(function (c) {
                return Math.max(Number(c.users || 0), Number(c.actions || 0));
            })
        );
        document.getElementById("admChartBox").innerHTML = chart
            .map(function (c) {
                const uNum = Number(c.users || 0);
                const aNum = Number(c.actions || 0);
                const uPct = Math.round((uNum / maxVal) * 100);
                const aPct = Math.round((aNum / maxVal) * 100);
                return (
                    '<div class="adm-bar-col">' +
                    '<div class="adm-bar-pair">' +
                    '<div class="adm-bar u" style="height:' +
                    Math.max(8, uPct) +
                    '%" title="مستخدمون: ' +
                    uNum +
                    '"></div>' +
                    '<div class="adm-bar a" style="height:' +
                    Math.max(8, aPct) +
                    '%" title="عمليات: ' +
                    aNum +
                    '"></div>' +
                    "</div>" +
                    '<span class="adm-bar-lbl">' +
                    esc(c.label) +
                    "</span>" +
                    '<span class="adm-bar-sub">' +
                    uNum +
                    " / " +
                    aNum +
                    "</span>" +
                    "</div>"
                );
            })
            .join("");

        renderUsers();
        renderAdmins();
        renderSecurity();
        renderLogs();
        syncSettingsForm(s);
    }

    function renderUsers() {
        const q = (document.getElementById("uSearchInp").value || "")
            .trim()
            .toLowerCase();
        const list = (data.users || []).filter(function (u) {
            if (!q) return true;
            return (
                String(u.user_id || "")
                    .toLowerCase()
                    .includes(q) ||
                String(u.full_name || "")
                    .toLowerCase()
                    .includes(q)
            );
        });
        const box = document.getElementById("admUsersList");
        if (!list.length) {
            box.innerHTML = '<div class="empty-inline">لا يوجد مستخدمون مسجلون.</div>';
            return;
        }
        box.innerHTML = list
            .map(function (u) {
                const banned = u.is_banned === 1;
                return (
                    '<div class="status-row adm-row-wrap">' +
                    '<div class="status-row-info">' +
                    "<strong>" +
                    esc(u.full_name || "زائر") +
                    ' <span class="badge ' +
                    (banned ? "danger" : "safe") +
                    '">' +
                    (banned ? "محظور" : "نشط") +
                    "</span></strong>" +
                    '<span dir="ltr">ID: ' +
                    esc(u.user_id) +
                    " • العمليات: " +
                    fmtNum(u.actions_count) +
                    " • آخر ظهور: " +
                    esc(u.last_seen) +
                    "</span>" +
                    (banned && u.ban_reason
                        ? '<div class="adm-ban-reason">السبب: ' +
                        esc(u.ban_reason) +
                        "</div>"
                        : "") +
                    "</div>" +
                    '<button type="button" class="ghost-btn ' +
                    (banned ? "" : "danger-txt") +
                    '" data-ubtn="' +
                    esc(u.user_id) +
                    '" data-ubanned="' +
                    (banned ? "1" : "0") +
                    '">' +
                    (banned ? "إلغاء الحظر" : "حظر") +
                    "</button>" +
                    "</div>"
                );
            })
            .join("");

        box.querySelectorAll("[data-ubtn]").forEach(function (btn) {
            btn.onclick = async function () {
                const uid = btn.dataset.ubtn;
                const isB = btn.dataset.ubanned === "1";
                const reason = isB
                    ? "تم رفع الحظر بواسطة الإدارة"
                    : "مخالفة سياسة الاستخدام";
                try {
                    await admPost("/api/admin/user-ban", {
                        user_id: uid,
                        banned: !isB,
                        reason: reason,
                        duration_hours: 0,
                    });
                    renderAll();
                    showToast(isB ? "تم إلغاء الحظر" : "تم حظر المستخدم");
                } catch (e) {
                    showToast(e.message);
                }
            };
        });
    }

    document.getElementById("uSearchInp").addEventListener("input", renderUsers);

    document.getElementById("uBanSubmit").onclick = async function () {
        const uid = document.getElementById("uBanId").value.trim();
        const reason =
            document.getElementById("uBanReason").value.trim() ||
            "مخالفة سياسة الاستخدام";
        const dur = parseInt(document.getElementById("uBanDur").value, 10) || 0;
        if (!uid) return showToast("أدخل معرّف المستخدم");
        try {
            await admPost("/api/admin/user-ban", {
                user_id: uid,
                banned: true,
                reason: reason,
                duration_hours: dur,
            });
            document.getElementById("uBanId").value = "";
            renderAll();
            showToast("تم تطبيق الحظر");
        } catch (e) {
            showToast(e.message);
        }
    };

    function renderAdmins() {
        const list = data.admins || [];
        const box = document.getElementById("admAdminsList");
        box.innerHTML = list
            .map(function (a) {
                const isPrim = a.is_primary === 1;
                const isB = a.is_banned === 1;
                return (
                    '<div class="status-row adm-row-wrap">' +
                    '<div class="status-row-info">' +
                    "<strong>" +
                    esc(a.full_name) +
                    " (@" +
                    esc(a.username) +
                    ') <span class="badge info">' +
                    esc(a.role) +
                    "</span>" +
                    (isPrim ? ' <span class="badge safe">محمي</span>' : "") +
                    (isB ? ' <span class="badge danger">محظور</span>' : "") +
                    "</strong>" +
                    "<span>أُضيف في: " +
                    esc(a.created_at) +
                    "</span>" +
                    "</div>" +
                    (isPrim
                        ? ""
                        : '<div class="adm-actions-row">' +
                        '<button type="button" class="ghost-btn" data-arole="' +
                        esc(a.admin_id) +
                        '" data-nextrole="' +
                        (a.role === "super_admin" ? "admin" : "super_admin") +
                        '">' +
                        (a.role === "super_admin"
                            ? "خفض لـ Admin"
                            : "ترقية لـ Super") +
                        "</button>" +
                        '<button type="button" class="ghost-btn ' +
                        (isB ? "" : "danger-txt") +
                        '" data-aban="' +
                        esc(a.admin_id) +
                        '" data-nextb="' +
                        (isB ? "0" : "1") +
                        '">' +
                        (isB ? "فك الحظر" : "حظر") +
                        "</button>" +
                        '<button type="button" class="ghost-btn danger-txt" data-adel="' +
                        esc(a.admin_id) +
                        '">حذف</button>' +
                        "</div>") +
                    "</div>"
                );
            })
            .join("");

        box.querySelectorAll("[data-arole]").forEach(function (b) {
            b.onclick = async function () {
                try {
                    await admPost("/api/admin/admins", {
                        op: "role",
                        admin_id: b.dataset.arole,
                        role: b.dataset.nextrole,
                    });
                    renderAll();
                    showToast("تم تحديث الصلاحية");
                } catch (e) {
                    showToast(e.message);
                }
            };
        });
        box.querySelectorAll("[data-aban]").forEach(function (b) {
            b.onclick = async function () {
                try {
                    await admPost("/api/admin/admins", {
                        op: "ban",
                        admin_id: b.dataset.aban,
                        banned: b.dataset.nextb === "1",
                    });
                    renderAll();
                    showToast("تم تحديث حالة المسؤول");
                } catch (e) {
                    showToast(e.message);
                }
            };
        });
        box.querySelectorAll("[data-adel]").forEach(function (b) {
            b.onclick = async function () {
                try {
                    await admPost("/api/admin/admins", {
                        op: "delete",
                        admin_id: b.dataset.adel,
                    });
                    renderAll();
                    showToast("تم حذف الحساب الإداري");
                } catch (e) {
                    showToast(e.message);
                }
            };
        });
    }

    document.getElementById("newAdmSubmit").onclick = async function () {
        const u = document.getElementById("newAdmUser").value.trim();
        const fn = document.getElementById("newAdmName").value.trim();
        const rl = document.getElementById("newAdmRole").value;
        const pn = document.getElementById("newAdmPin").value.trim();

        if (!u || !fn || !pn) {
            showToast("يرجى تعبئة Admin Name والاسم الكامل و Password");
            return;
        }
        try {
            await admPost("/api/admin/admins", {
                op: "add",
                new_username: u,
                full_name: fn,
                role: rl,
                new_pin: pn,
            });
            document.getElementById("newAdmUser").value = "";
            document.getElementById("newAdmName").value = "";
            document.getElementById("newAdmPin").value = "";
            renderAll();
            showToast("تمت إضافة المسؤول بنجاح");
        } catch (e) {
            showToast(e.message);
        }
    };

    function renderSecurity() {
        const ips = data.banned_ips || [];
        const ipBox = document.getElementById("admBannedIpsList");
        ipBox.innerHTML = ips.length
            ? ips
                .map(function (item) {
                    return (
                        '<div class="status-row">' +
                        '<div class="status-row-info"><strong dir="ltr">' +
                        esc(item.ip_address) +
                        "</strong><span>" +
                        esc(item.reason || "-") +
                        " • " +
                        esc(item.created_at) +
                        "</span></div>" +
                        '<button type="button" class="ghost-btn" data-unip="' +
                        esc(item.ip_address) +
                        '">فك الحظر</button>' +
                        "</div>"
                    );
                })
                .join("")
            : '<div class="empty-inline">لا توجد عناوين IP محظورة حالياً.</div>';

        ipBox.querySelectorAll("[data-unip]").forEach(function (b) {
            b.onclick = async function () {
                try {
                    await admPost("/api/admin/ip-ban", {
                        action: "unban",
                        ip: b.dataset.unip,
                    });
                    renderAll();
                    showToast("تم فك حظر IP");
                } catch (e) {
                    showToast(e.message);
                }
            };
        });

        const evs = data.security_events || [];
        document.getElementById("admSecEventsList").innerHTML = evs.length
            ? evs
                .map(function (ev) {
                    return (
                        '<div class="status-row">' +
                        '<div class="status-row-info"><strong>' +
                        esc(ev.event_type) +
                        ' <span class="badge warn" dir="ltr">' +
                        esc(ev.ip_address || "-") +
                        "</span></strong>" +
                        "<span>" +
                        esc(ev.actor_id || "-") +
                        " • " +
                        esc(ev.details || "-") +
                        "</span></div>" +
                        '<span class="badge info" dir="ltr">' +
                        esc(ev.created_at) +
                        "</span>" +
                        "</div>"
                    );
                })
                .join("")
            : '<div class="empty-inline">لا توجد أحداث أمنية مسجلة.</div>';
    }

    document.getElementById("ipBanBtn").onclick = async function () {
        const ipVal = document.getElementById("ipBanAddr").value.trim();
        const reason =
            document.getElementById("ipBanReason").value.trim() || "نشاط مخالف";
        try {
            await admPost("/api/admin/ip-ban", {
                action: "ban",
                ip: ipVal,
                reason: reason,
            });
            document.getElementById("ipBanAddr").value = "";
            renderAll();
            showToast("تم حظر عنوان IP");
        } catch (e) {
            showToast(e.message);
        }
    };

    function renderLogs() {
        const logs = data.logs || [];
        document.getElementById("admLogsList").innerHTML = logs.length
            ? logs
                .map(function (lg) {
                    return (
                        '<div class="status-row">' +
                        '<div class="status-row-info"><strong>' +
                        esc(lg.action) +
                        " — " +
                        esc(lg.full_name || lg.user_id) +
                        "</strong>" +
                        "<span>" +
                        esc(lg.details || "-") +
                        "</span></div>" +
                        '<span class="badge info" dir="ltr">' +
                        esc(lg.created_at) +
                        "</span>" +
                        "</div>"
                    );
                })
                .join("")
            : '<div class="empty-inline">لا توجد أنشطة مسجلة.</div>';
    }

    document.getElementById("admClearLogsBtn").onclick = async function () {
        try {
            await admPost("/api/admin/settings", { clear_logs: true });
            renderAll();
            showToast("تم مسح السجل");
        } catch (e) {
            showToast(e.message);
        }
    };

    function syncSettingsForm(s) {
        document.getElementById("setMaxMb").value = s.max_file_mb || "100";
        document.getElementById("setRpm").value = s.rate_limit_per_min || "45";
        document.getElementById("setMaint").checked = s.maintenance_mode === "1";
        document.getElementById("setToolText").checked = s.tool_text_crypto === "1";
        document.getElementById("setToolFile").checked = s.tool_file_crypto === "1";
        document.getElementById("setToolHash").checked = s.tool_hashing === "1";
        document.getElementById("setToolScan").checked = s.tool_scanner === "1";
        document.getElementById("setNewPin").value = "";
    }

    document.getElementById("setSaveBtn").onclick = async function () {
        const newPin = document.getElementById("setNewPin").value.trim();
        const updates = {
            max_file_mb: document.getElementById("setMaxMb").value.trim() || "100",
            rate_limit_per_min: document.getElementById("setRpm").value.trim() || "45",
            maintenance_mode: document.getElementById("setMaint").checked ? "1" : "0",
            tool_text_crypto: document.getElementById("setToolText").checked ? "1" : "0",
            tool_file_crypto: document.getElementById("setToolFile").checked ? "1" : "0",
            tool_hashing: document.getElementById("setToolHash").checked ? "1" : "0",
            tool_scanner: document.getElementById("setToolScan").checked ? "1" : "0",
        };
        try {
            await admPost("/api/admin/settings", { settings: updates, new_pin: newPin });
            if (newPin) auth.pin = newPin;
            renderAll();
            showToast("تم حفظ الإعدادات");
        } catch (e) {
            showToast(e.message);
        }
    };
})();
