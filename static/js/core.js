const tg = window.Telegram ? window.Telegram.WebApp : null;
let _toastTimer = null;
let _rafPending = false;

const PAGE_LABELS = Object.freeze({
    dashboard: "الرئيسية",
    "crypto-hub": "خدمات التشفير",
    text: "تشفير النصوص",
    files: "تشفير الصور والملفات",
    scanner: "الفحص الأمني",
    hashing: "البصمة الرقمية",
    roadmap: "مسار تعلم الأمن السيبراني",
    guide: "دليل المنصة والموسوعة",
    tools: "الأدوات الأمنية المساعدة",
    status: "حالة النظام والخدمات",
    settings: "الإعدادات",
    admin: "لوحة تحكم الأدمن",
    about: "عن ZORO SECURITY",
});

function _escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

if (tg) {
    tg.ready();
    tg.expand();
    try {
        tg.setHeaderColor("#080b10");
        tg.setBackgroundColor("#080b10");
    } catch (_) { }

    const tgUser = tg.initDataUnsafe && tg.initDataUnsafe.user;
    if (tgUser && tgUser.first_name) {
        const sub = document.getElementById("drawerUserSub");
        if (sub) sub.textContent = "أهلاً، " + String(tgUser.first_name).slice(0, 60);
    }
}

function openSidebar() {
    const drawer = document.getElementById("sidebarDrawer");
    const overlay = document.getElementById("sidebarOverlay");
    if (drawer) {
        drawer.classList.add("open");
        drawer.setAttribute("aria-hidden", "false");
    }
    if (overlay) overlay.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeSidebar() {
    const drawer = document.getElementById("sidebarDrawer");
    const overlay = document.getElementById("sidebarOverlay");
    if (drawer) {
        drawer.classList.remove("open");
        drawer.setAttribute("aria-hidden", "true");
    }
    if (overlay) overlay.classList.remove("open");
    document.body.style.overflow = "";
}

function toggleSidebar() {
    const drawer = document.getElementById("sidebarDrawer");
    if (drawer && drawer.classList.contains("open")) {
        try {
        sessionStorage.setItem("zoro_active_page", key);
        if (location.hash !== "#" + key) history.replaceState(null, "", "#" + key);
    } catch (_) {}
    closeSidebar();
    } else {
        openSidebar();
    }
}

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeSidebar();
});

function navigateTo(pageId) {
    const key = String(pageId || "");
    const target = document.getElementById("page-" + key);
    if (!target) return;

    document.querySelectorAll(".page-view").forEach(function (view) {
        view.classList.toggle("active", view === target);
    });

    document.querySelectorAll(".drawer-item").forEach(function (item) {
        item.classList.toggle("active", item.dataset.page === key);
    });

    const labelEl = document.getElementById("currentPageLabel");
    if (labelEl) {
        labelEl.textContent = PAGE_LABELS[key] || "ZORO SECURITY";
    }

    closeSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (key === "status") {
        loadSystemHealth();
    }
}

function openSecurityTool(toolKey) {
    navigateTo("tools");
    window.dispatchEvent(new CustomEvent("zoro:open-tool", { detail: { tool: toolKey } }));
}

document.querySelectorAll(".portal-card").forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
        if (_rafPending) return;
        _rafPending = true;
        const clientX = e.clientX;
        const clientY = e.clientY;
        window.requestAnimationFrame(function () {
            const rect = card.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                const x = ((clientX - rect.left) / rect.width) * 100;
                const y = ((clientY - rect.top) / rect.height) * 100;
                card.style.setProperty("--mx", x.toFixed(1) + "%");
                card.style.setProperty("--my", y.toFixed(1) + "%");
            }
            _rafPending = false;
        });
    });
});

function _renderServiceRow(srv) {
    const isOnline = srv && srv.status === "online";
    const isDisabled = srv && srv.status === "disabled";
    const badgeClass = isOnline ? "safe" : isDisabled ? "danger" : "info";
    const badgeLabel = isOnline ? "يعمل" : isDisabled ? "معطّل" : "جاهز للتركيب";
    return (
        '<div class="status-row">' +
        '<div class="status-row-info">' +
        "<strong>" + _escapeHtml(srv && srv.name) + "</strong>" +
        "<span>" + _escapeHtml(srv && srv.detail) + "</span>" +
        "</div>" +
        '<span class="badge ' + badgeClass + '">' + badgeLabel + "</span>" +
        "</div>"
    );
}

async function loadSystemHealth() {
    const statusText = document.getElementById("topStatusText");
    const listEl = document.getElementById("systemStatusList");

    try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const data = await res.json();
        const isMaint = Boolean(data && data.maintenance);

        if (statusText) {
            if (!res.ok) {
                statusText.textContent = "توجد مشكلة";
            } else if (isMaint) {
                statusText.textContent = "وضع الصيانة";
            } else {
                statusText.textContent = "النظام يعمل";
            }
        }

        if (listEl && Array.isArray(data && data.services)) {
            listEl.innerHTML = data.services.map(_renderServiceRow).join("");
        }
    } catch (_) {
        if (statusText) statusText.textContent = "غير متصل";
        if (listEl) {
            listEl.innerHTML =
                '<div class="status-row"><span>تعذر الاتصال بالخادم</span><span class="badge danger">غير متصل</span></div>';
        }
    }
}

function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = String(msg ?? "");
    toast.classList.remove("hidden");
    if (_toastTimer) {
        clearTimeout(_toastTimer);
    }
    _toastTimer = setTimeout(function () {
        toast.classList.add("hidden");
        _toastTimer = null;
    }, 2200);
}

function fallbackCopy(text) {
    const temp = document.createElement("textarea");
    temp.value = text;
    temp.setAttribute("readonly", "");
    temp.style.position = "fixed";
    temp.style.opacity = "0";
    document.body.appendChild(temp);
    temp.select();
    try {
        document.execCommand("copy");
        showToast("تم النسخ بنجاح!");
    } catch (_) {
        showToast("تعذر النسخ تلقائياً.");
    } finally {
        document.body.removeChild(temp);
    }
}

function copyText(text) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
            .writeText(String(text))
            .then(function () {
                showToast("تم النسخ بنجاح!");
            })
            .catch(function () {
                fallbackCopy(String(text));
            });
    } else {
        fallbackCopy(String(text));
    }
}

loadSystemHealth();

(function () {
    try {
        const saved = (location.hash || "").replace(/^#/, "") || sessionStorage.getItem("zoro_active_page") || "";
        if (saved && saved !== "dashboard" && document.getElementById("page-" + saved)) {
            navigateTo(saved);
        }
    } catch (_) {}
})();

(function initPersistentUserAndHistory() {
    try {
        let uid = localStorage.getItem("zoro_uid") || "";
        if (!uid) {
            const m = document.cookie.match(/(?:^|;\s*)zoro_uid=([^;]+)/);
            uid = m ? decodeURIComponent(m[1]) : ("usr_" + Math.random().toString(16).slice(2, 12));
            localStorage.setItem("zoro_uid", uid);
        }
        document.cookie = "zoro_uid=" + encodeURIComponent(uid) + "; path=/; max-age=31536000; SameSite=Lax";

        const _origFetch = window.fetch;
        window.fetch = function (input, init) {
            const url = typeof input === "string" ? input : (input && input.url) || "";
            if (url.startsWith("/api/") || url.includes("/api/")) {
                init = Object.assign({}, init || {});
                const hdrs = new Headers(init.headers || {});
                if (!hdrs.has("X-Zoro-User-Id")) hdrs.set("X-Zoro-User-Id", uid);
                init.headers = hdrs;
            }
            return _origFetch.call(this, input, init);
        };

        const nav = document.querySelector(".drawer-nav");
        if (nav && !document.getElementById("zoroMyHistoryBtn")) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.id = "zoroMyHistoryBtn";
            btn.className = "drawer-item";
            btn.innerHTML =
                '<svg class="d-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
                "<span>سجل عملياتي السابقة</span>";
            btn.onclick = function () {
                if (typeof closeSidebar === "function") closeSidebar();
                openMyHistoryModal();
            };
            const firstDivider = nav.querySelector(".drawer-divider");
            if (firstDivider) nav.insertBefore(btn, firstDivider);
            else nav.appendChild(btn);
        }

        function openMyHistoryModal() {
            let modal = document.getElementById("zoroMyHistoryModal");
            if (!modal) {
                modal = document.createElement("div");
                modal.id = "zoroMyHistoryModal";
                modal.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(5,10,20,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;";
                modal.innerHTML =
                    '<div style="width:100%;max-width:500px;max-height:80vh;display:flex;flex-direction:column;background:var(--bg-card,#0f172a);border:1px solid rgba(148,163,184,0.2);border-radius:18px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.5);">' +
                    '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(148,163,184,0.15);">' +
                    '<strong style="font-size:15px;">سجل عملياتي السابقة</strong>' +
                    '<div style="display:flex;gap:8px;">' +
                    '<button type="button" id="zoroHistRefresh" class="ghost-btn" style="padding:5px 10px;font-size:12px;">تحديث ↻</button>' +
                    '<button type="button" id="zoroHistClose" class="ghost-btn" style="padding:5px 10px;font-size:12px;">إغلاق ✕</button>' +
                    "</div></div>" +
                    '<div id="zoroHistBody" style="padding:14px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;font-size:13px;">جاري تحميل السجل...</div>' +
                    "</div>";
                document.body.appendChild(modal);
                modal.onclick = function (e) { if (e.target === modal) modal.style.display = "none"; };
                document.getElementById("zoroHistClose").onclick = function () { modal.style.display = "none"; };
                document.getElementById("zoroHistRefresh").onclick = loadMyHistory;
            }
            modal.style.display = "flex";
            loadMyHistory();
        }

        async function loadMyHistory() {
            const body = document.getElementById("zoroHistBody");
            if (!body) return;
            body.innerHTML = '<div style="text-align:center;opacity:.7;padding:18px;">جاري تحميل السجل...</div>';
            try {
                const res = await fetch("/api/my-history", { cache: "no-store" });
                const j = await res.json();
                const list = (j && j.logs) || [];
                if (!list.length) {
                    body.innerHTML = '<div style="text-align:center;opacity:.7;padding:22px;">لا توجد عمليات مسجلة لك حتى الآن.</div>';
                    return;
                }
                body.innerHTML = list.map(function (it) {
                    return (
                        '<div style="padding:10px 12px;border-radius:12px;background:rgba(148,163,184,0.08);border:1px solid rgba(148,163,184,0.12);text-align:right;">' +
                        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">' +
                        "<strong>" + _escapeHtml(it.action || "عملية") + "</strong>" +
                        '<span dir="ltr" style="font-size:11px;opacity:.65;">' + _escapeHtml(it.created_at || "") + "</span>" +
                        "</div>" +
                        (it.details ? '<div style="font-size:12px;opacity:.8;margin-top:4px;">' + _escapeHtml(it.details) + "</div>" : "") +
                        "</div>"
                    );
                }).join("");
            } catch (_) {
                body.innerHTML = '<div style="text-align:center;color:#f87171;padding:18px;">تعذر تحميل السجل الآن.</div>';
            }
        }
    } catch (_) {}
})();
