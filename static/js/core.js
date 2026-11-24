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
