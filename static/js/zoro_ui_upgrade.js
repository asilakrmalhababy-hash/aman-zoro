(function () {
    "use strict";

    let lastCryptoOrigin = null;
    let langHiddenApplied = false;
    let cachedHeader = null;
    let headerScrolled = false;
    let syncTimer = null;

    const ORIGIN_META = Object.freeze({
        file: Object.freeze({ label: "← العودة إلى تشفير الملفات", page: "files" }),
        text: Object.freeze({ label: "← العودة إلى تشفير النصوص", page: "text" })
    });

    function hideLanguageSwitcher() {
        document.documentElement.lang = "ar";
        document.documentElement.dir = "rtl";
        try {
            localStorage.removeItem("zoro_lang");
        } catch (_) {}

        if (langHiddenApplied) return;

        const headings = document.querySelectorAll("h2, h3, h4, .card-title");
        for (let i = 0; i < headings.length; i++) {
            if ((headings[i].textContent || "").trim() === "المظهر واللغة") {
                headings[i].textContent = "المظهر";
            }
        }

        const labels = document.querySelectorAll("label, h4, h5, p, span, div");
        let hidCount = 0;
        for (let i = 0; i < labels.length; i++) {
            const el = labels[i];
            if (el.children.length === 0 && (el.textContent || "").trim() === "اللغة والاتجاه") {
                const group = el.closest(".setting-group, .form-group, .pref-group") || el.parentElement;
                if (group) {
                    group.style.display = "none";
                    hidCount++;
                }
            }
        }
        if (hidCount > 0) langHiddenApplied = true;
    }

    function enhanceHeaderAndLogos() {
        cachedHeader = document.querySelector("header, .topbar, .top-bar, .navbar, .site-header, .app-header");
        if (cachedHeader) {
            window.addEventListener("scroll", function () {
                const shouldScroll = window.scrollY > 12;
                if (shouldScroll !== headerScrolled) {
                    headerScrolled = shouldScroll;
                    cachedHeader.classList.toggle("zoro-scrolled", shouldScroll);
                }
            }, { passive: true });

            const headerLogo = cachedHeader.querySelector(".brand-logo, .logo-icon, .logo-badge, .brand-mark, svg");
            if (headerLogo) {
                const logoWrap = headerLogo.tagName.toLowerCase() === "svg" ? headerLogo.parentElement : headerLogo;
                if (logoWrap && !logoWrap.classList.contains("zoro-logo-header-prestige")) {
                    logoWrap.classList.add("zoro-logo-header-prestige");
                }
            }
        }

        const hero = document.querySelector(".hero, .hero-section, #homeSection, #sec-home, [data-section='home']");
        if (hero) {
            const heroHeading = hero.querySelector("h1");
            if (heroHeading) heroHeading.classList.add("zoro-hero-title-enhanced");

            const heroSvg = hero.querySelector("svg");
            if (heroSvg && heroSvg.parentElement && heroSvg.parentElement !== hero) {
                heroSvg.parentElement.classList.add("zoro-logo-hero-prestige");
            }
        }
    }

    function detectActiveCryptoOrigin() {
        const sections = document.querySelectorAll("section, .view, .page-view, .tool-section, .workspace-section, [data-section]");
        for (let i = 0; i < sections.length; i++) {
            const sec = sections[i];
            if (sec.classList.contains("hidden") || sec.offsetHeight <= 40) continue;
            const st = window.getComputedStyle(sec);
            if (st.display === "none" || st.visibility === "hidden") continue;

            const idHint = ((sec.id || "") + " " + (sec.dataset.section || "")).toLowerCase();
            const heading = sec.querySelector("h1, h2, h3");
            const hText = heading ? heading.textContent.toLowerCase() : "";

            if (idHint.indexOf("file") !== -1 || hText.indexOf("تشفير الملفات") !== -1 || hText.indexOf("الصور والملفات") !== -1) {
                return { type: "file", sectionEl: sec, sectionId: sec.id || sec.dataset.section || "" };
            }
            if (idHint.indexOf("text") !== -1 || idHint.indexOf("crypto") !== -1 || hText.indexOf("تشفير النصوص") !== -1) {
                if (idHint.indexOf("helper") === -1 && idHint.indexOf("tool") === -1 && hText.indexOf("المساعدة") === -1) {
                    return { type: "text", sectionEl: sec, sectionId: sec.id || sec.dataset.section || "" };
                }
            }
        }
        return null;
    }

    function ensureBackButtonInHelpers() {
        let backBtn = document.getElementById("zoroBackToCryptoBtn");
        if (backBtn) return backBtn;

        const headings = document.querySelectorAll("h1, h2, h3, .section-title, .view-title");
        let helperHeading = null;
        for (let i = 0; i < headings.length; i++) {
            if ((headings[i].textContent || "").indexOf("الأدوات الأمنية المساعدة") !== -1) {
                helperHeading = headings[i];
                break;
            }
        }

        if (!helperHeading || !helperHeading.parentElement) return null;

        backBtn = document.createElement("button");
        backBtn.type = "button";
        backBtn.id = "zoroBackToCryptoBtn";
        backBtn.className = "zoro-back-crypto-btn hidden";
        backBtn.textContent = "← العودة إلى التشفير";
        helperHeading.parentElement.appendChild(backBtn);

        backBtn.addEventListener("click", function () {
            if (!lastCryptoOrigin) return;
            const meta = ORIGIN_META[lastCryptoOrigin.type];
            if (typeof navigateTo === "function" && meta) {
                navigateTo(meta.page);
                backBtn.classList.add("hidden");
                window.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }

            const triggers = document.querySelectorAll("[data-section], [data-target], [data-view], [data-nav], button, a");
            const targetId = (lastCryptoOrigin.sectionId || "").toLowerCase();
            let matchedNav = null;

            if (targetId) {
                for (let i = 0; i < triggers.length; i++) {
                    const el = triggers[i];
                    const ref = (el.dataset.section || el.dataset.target || el.dataset.view || el.dataset.nav || "").toLowerCase();
                    if (ref && ref === targetId) {
                        matchedNav = el;
                        break;
                    }
                }
            }

            if (!matchedNav) {
                for (let i = 0; i < triggers.length; i++) {
                    const el = triggers[i];
                    if (el.id === "zoroBackToCryptoBtn") continue;
                    const txt = (el.textContent || "").trim();
                    const ok = lastCryptoOrigin.type === "file"
                        ? (txt.indexOf("تشفير الملفات") !== -1 || txt.indexOf("الصور والملفات") !== -1)
                        : txt.indexOf("تشفير النصوص") !== -1;
                    if (ok) {
                        matchedNav = el;
                        break;
                    }
                }
            }

            if (matchedNav) {
                matchedNav.click();
            } else if (lastCryptoOrigin.sectionEl) {
                const allSecs = document.querySelectorAll("section, .view, .page-view, .tool-section");
                for (let i = 0; i < allSecs.length; i++) {
                    allSecs[i].classList.add("hidden");
                }
                lastCryptoOrigin.sectionEl.classList.remove("hidden");
            }
            backBtn.classList.add("hidden");
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

        return backBtn;
    }

    function syncBackButton() {
        const backBtn = ensureBackButtonInHelpers();
        if (!backBtn) return;
        const meta = lastCryptoOrigin ? ORIGIN_META[lastCryptoOrigin.type] : null;
        if (meta) {
            backBtn.textContent = meta.label;
            backBtn.classList.remove("hidden");
        } else {
            backBtn.classList.add("hidden");
        }
    }

    document.addEventListener("click", function (e) {
        const btn = e.target.closest("button, a, [data-section], [data-target], [data-view], [data-nav]");
        if (!btn || btn.id === "zoroBackToCryptoBtn") return;

        const hint = ((btn.textContent || "") + " " + (btn.dataset.section || "") + " " + (btn.dataset.target || "")).toLowerCase();
        const isHelperNav = hint.indexOf("مولد كلمات المرور") !== -1 || hint.indexOf("الأدوات الأمنية المساعدة") !== -1 || hint.indexOf("helper") !== -1;
        const isHomeNav = hint.indexOf("الرئيسية") !== -1 || hint.indexOf("home") !== -1;

        if (isHelperNav) {
            const origin = detectActiveCryptoOrigin();
            if (origin) lastCryptoOrigin = origin;
        } else if (isHomeNav) {
            lastCryptoOrigin = null;
        }

        if (isHelperNav || isHomeNav || !langHiddenApplied) {
            if (syncTimer) clearTimeout(syncTimer);
            syncTimer = setTimeout(function () {
                if (isHelperNav || isHomeNav) syncBackButton();
                if (!langHiddenApplied) hideLanguageSwitcher();
            }, 50);
        }
    }, true);

    function init() {
        enhanceHeaderAndLogos();
        ensureBackButtonInHelpers();
        hideLanguageSwitcher();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
