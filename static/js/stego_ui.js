/**
 * ZORO SECURITY - Steganography UI Module (stego_ui.js)
 * -----------------------------------------------------
 * يضع بطاقة/شريط "🔐 إخفاء نص في صورة مع تشفير" بشكل مستقل ومعزول
 * مباشرة تحت عبارة "اختر نوع البيانات التي ترغب في تشفيرها أو فك تشفيرها"
 * وفوق مربع "تشفير وفك تشفير النصوص"، مع معاينة فورية للصورة
 * وإلزامية كلمة المرور (AES-256-GCM).
 */
(function () {
    "use strict";

    function normalizeAr(str) {
        return String(str || "")
            .replace(/[أإآ]/g, "ا")
            .replace(/ة/g, "ه")
            .replace(/\s+/g, " ")
            .trim();
    }

    function injectStegoStyles() {
        if (document.getElementById("zoroStegoStyles")) return;
        const style = document.createElement("style");
        style.id = "zoroStegoStyles";
        style.textContent = `
            .zoro-stego-top-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 12px;
                margin: 14px 0 18px 0;
                padding: 14px 18px;
                border-radius: 16px;
                border: 1px solid rgba(56, 189, 248, 0.38);
                background: linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 27, 75, 0.78));
                box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
            }
            .zoro-stego-top-info {
                font-family: 'Cairo', sans-serif;
                font-size: 0.9rem;
                color: #e2e8f0;
                font-weight: 700;
            }
            .zoro-stego-section-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 7px;
                padding: 9px 18px;
                border-radius: 10px;
                border: 1px solid rgba(56, 189, 248, 0.55);
                background: linear-gradient(135deg, #7c3aed, #0284c7);
                color: #ffffff;
                font-family: 'Cairo', sans-serif;
                font-size: 0.88rem;
                font-weight: 800;
                cursor: pointer;
                box-shadow: 0 6px 18px rgba(124, 58, 237, 0.32);
                transition: transform 0.18s ease, box-shadow 0.2s ease;
            }
            .zoro-stego-section-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 8px 24px rgba(56, 189, 248, 0.42);
            }
            .zoro-stego-modal {
                position: fixed;
                inset: 0;
                z-index: 2000;
                display: none;
                place-items: center;
                padding: 16px;
                background: rgba(5, 9, 20, 0.84);
                backdrop-filter: blur(10px);
            }
            .zoro-stego-modal.open {
                display: grid;
            }
            .zoro-stego-card {
                width: 100%;
                max-width: 560px;
                max-height: 90vh;
                overflow-y: auto;
                background: #0f172a;
                border: 1px solid rgba(139, 92, 246, 0.45);
                border-radius: 18px;
                padding: 20px;
                color: #f8fafc;
                font-family: 'Cairo', sans-serif;
                box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
            }
            .zoro-stego-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 14px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(148, 163, 184, 0.18);
            }
            .zoro-stego-head h3 {
                margin: 0;
                font-size: 1.06rem;
                font-weight: 800;
                color: #e0f2fe;
            }
            .zoro-stego-close {
                background: rgba(255, 255, 255, 0.08);
                border: none;
                color: #cbd5e1;
                width: 32px;
                height: 32px;
                border-radius: 9px;
                cursor: pointer;
                font-size: 1.1rem;
            }
            .zoro-stego-tabs {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 14px;
            }
            .zoro-stego-tab {
                padding: 9px;
                border-radius: 10px;
                border: 1px solid rgba(148, 163, 184, 0.22);
                background: rgba(30, 41, 59, 0.7);
                color: #cbd5e1;
                font-family: 'Cairo', sans-serif;
                font-weight: 700;
                cursor: pointer;
            }
            .zoro-stego-tab.active {
                background: linear-gradient(135deg, #7c3aed, #0284c7);
                border-color: transparent;
                color: #ffffff;
            }
            .zoro-stego-field {
                margin-bottom: 12px;
            }
            .zoro-stego-field label {
                display: block;
                margin-bottom: 6px;
                font-size: 0.85rem;
                font-weight: 700;
                color: #cbd5e1;
            }
            .zoro-stego-field input,
            .zoro-stego-field textarea {
                width: 100%;
                box-sizing: border-box;
                padding: 10px 12px;
                border-radius: 10px;
                border: 1px solid rgba(148, 163, 184, 0.25);
                background: #020617;
                color: #f8fafc;
                font-family: 'Cairo', sans-serif;
                font-size: 0.9rem;
            }
            .zoro-stego-preview {
                display: none;
                margin-top: 10px;
                padding: 10px;
                border-radius: 12px;
                border: 1px solid rgba(56, 189, 248, 0.30);
                background: rgba(2, 6, 23, 0.78);
                text-align: center;
            }
            .zoro-stego-preview.show {
                display: block;
            }
            .zoro-stego-preview img {
                max-width: 100%;
                max-height: 210px;
                border-radius: 9px;
                object-fit: contain;
                border: 1px solid rgba(148, 163, 184, 0.22);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
            }
            .zoro-stego-preview-meta {
                margin-top: 6px;
                font-size: 0.78rem;
                color: #94a3b8;
                direction: ltr;
            }
            .zoro-stego-btn {
                width: 100%;
                padding: 11px;
                border-radius: 11px;
                border: none;
                background: linear-gradient(135deg, #7c3aed, #0ea5e9);
                color: #ffffff;
                font-family: 'Cairo', sans-serif;
                font-size: 0.94rem;
                font-weight: 800;
                cursor: pointer;
            }
            .zoro-stego-btn:disabled {
                opacity: 0.6;
                cursor: wait;
            }
            .zoro-stego-status {
                margin-top: 12px;
                padding: 10px 12px;
                border-radius: 10px;
                font-size: 0.86rem;
                display: none;
                white-space: pre-wrap;
                word-break: break-word;
            }
            .zoro-stego-status.ok {
                display: block;
                background: rgba(16, 185, 129, 0.14);
                border: 1px solid rgba(16, 185, 129, 0.45);
                color: #a7f3d0;
            }
            .zoro-stego-status.err {
                display: block;
                background: rgba(239, 68, 68, 0.14);
                border: 1px solid rgba(239, 68, 68, 0.45);
                color: #fecaca;
            }
        `;
        document.head.appendChild(style);
    }

    function openStegoModal() {
        const modal = document.getElementById("zoroStegoModal");
        const statusBox = document.getElementById("stegoStatusBox");
        if (modal) modal.classList.add("open");
        if (statusBox) statusBox.className = "zoro-stego-status";
    }

    function createStegoTopBar() {
        const bar = document.createElement("div");
        bar.id = "zoroStegoTopBar";
        bar.className = "zoro-stego-top-bar";
        bar.innerHTML = `
            <span class="zoro-stego-top-info">🖼️ إخفاء الرسائل المشفرة داخل الصور (Steganography + AES-256-GCM)</span>
            <button type="button" id="zoroStegoInsideCryptoBtn" class="zoro-stego-section-btn">
                🔐 إخفاء نص في صورة مع تشفير
            </button>
        `;
        bar.querySelector("#zoroStegoInsideCryptoBtn").addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            openStegoModal();
        });
        return bar;
    }

    /**
     * وضع الشريط معزولاً تحت "اختر نوع البيانات التي ترغب في تشفيرها أو فك تشفيرها"
     * وخارج/فوق مربع "تشفير وفك تشفير النصوص"
     */
    function mountStandaloneAboveCryptoBox() {
        if (document.getElementById("zoroStegoTopBar")) return;

        // 1. البحث المباشر عن عبارة "اختر نوع البيانات التي ترغب في تشفيرها..."
        const allTextEls = Array.from(document.querySelectorAll("p, div, span, h2, h3, h4"));
        const promptEl = allTextEls.find(function (el) {
            if (el.children.length > 0) return false;
            const norm = normalizeAr(el.textContent);
            return norm.includes("اختر نوع البيانات") && norm.includes("تشفيرها");
        });

        if (promptEl && promptEl.parentElement) {
            // إذا كانت العبارة داخل حاوية رأس (مثل section-header أو view-head)، نضعه بعدها مباشرة
            const headerWrap = promptEl.closest(".section-header, .view-header, .page-header, .hub-header");
            const anchor = headerWrap || promptEl;
            if (anchor.parentElement) {
                anchor.insertAdjacentElement("afterend", createStegoTopBar());
                return;
            }
        }

        // 2. بديل احتياطي: البحث عن مربع "تشفير وفك تشفير النصوص" ووضع الشريط قبله (خارج المربع)
        const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, .card-title, .section-title"));
        const textCryptoHeading = headings.find(function (el) {
            const norm = normalizeAr(el.textContent);
            const inNavOrHome = el.closest("nav, header, .sidebar, .drawer, .home-grid");
            return !inNavOrHome && norm.includes("تشفير وفك تشفير النصوص");
        });

        if (textCryptoHeading) {
            const outerBox =
                textCryptoHeading.closest(".card, .panel, .crypto-card, .tool-card, .box, .service-card, article") ||
                textCryptoHeading.parentElement;
            if (outerBox && outerBox.parentElement) {
                outerBox.parentElement.insertBefore(createStegoTopBar(), outerBox);
            }
        }
    }

    function bindImagePreview(inputId, boxId, imgId, metaId) {
        const input = document.getElementById(inputId);
        const box = document.getElementById(boxId);
        const img = document.getElementById(imgId);
        const meta = document.getElementById(metaId);
        let currentObjectUrl = null;

        if (!input || !box || !img || !meta) return;

        input.addEventListener("change", function () {
            if (currentObjectUrl) {
                URL.revokeObjectURL(currentObjectUrl);
                currentObjectUrl = null;
            }

            const file = input.files && input.files[0];
            if (!file) {
                box.classList.remove("show");
                img.removeAttribute("src");
                meta.textContent = "";
                return;
            }

            currentObjectUrl = URL.createObjectURL(file);
            img.src = currentObjectUrl;
            const sizeKB = (file.size / 1024).toFixed(1);
            img.onload = function () {
                meta.textContent = `${file.name} • ${img.naturalWidth}×${img.naturalHeight} px • ${sizeKB} KB`;
            };
            box.classList.add("show");
        });
    }

    function buildStegoModal() {
        if (document.getElementById("zoroStegoModal")) return;

        const modal = document.createElement("div");
        modal.id = "zoroStegoModal";
        modal.className = "zoro-stego-modal";
        modal.innerHTML = `
            <div class="zoro-stego-card" dir="rtl">
                <div class="zoro-stego-head">
                    <h3>🔐 إخفاء نص في صورة مع تشفير (AES-256-GCM)</h3>
                    <button type="button" class="zoro-stego-close" id="zoroStegoClose">✕</button>
                </div>

                <div class="zoro-stego-tabs">
                    <button type="button" class="zoro-stego-tab active" data-stego-tab="hide">إخفاء نص مشفر</button>
                    <button type="button" class="zoro-stego-tab" data-stego-tab="extract">استخراج وفك تشفير</button>
                </div>

                <!-- تبويب الإخفاء -->
                <div id="stegoPaneHide">
                    <div class="zoro-stego-field">
                        <label>1. اختر الصورة (PNG أو JPG - سيتم حفظ الناتج بصيغة PNG)</label>
                        <input type="file" id="stegoHideImage" accept="image/png,image/jpeg,image/webp">
                        <div id="stegoHidePreviewBox" class="zoro-stego-preview">
                            <img id="stegoHidePreviewImg" alt="معاينة الصورة المختارة">
                            <div id="stegoHidePreviewMeta" class="zoro-stego-preview-meta"></div>
                        </div>
                    </div>
                    <div class="zoro-stego-field">
                        <label>2. النص السري المراد إخفاؤه</label>
                        <textarea id="stegoHideText" rows="3" placeholder="اكتب رسالتك السرية هنا..."></textarea>
                    </div>
                    <div class="zoro-stego-field">
                        <label>3. كلمة المرور للتشفير بـ AES-256-GCM (إجبارية *)</label>
                        <input type="password" id="stegoHideKey" placeholder="أدخل كلمة مرور قوية (4 خانات على الأقل)" required>
                    </div>
                    <button type="button" class="zoro-stego-btn" id="stegoHideSubmit">تشفير وإخفاء وتحميل الصورة (PNG)</button>
                </div>

                <!-- تبويب الاستخراج -->
                <div id="stegoPaneExtract" style="display:none;">
                    <div class="zoro-stego-field">
                        <label>1. اختر الصورة الحاملة للنص (.png)</label>
                        <input type="file" id="stegoExtractImage" accept="image/png">
                        <div id="stegoExtractPreviewBox" class="zoro-stego-preview">
                            <img id="stegoExtractPreviewImg" alt="معاينة الصورة الحاملة">
                            <div id="stegoExtractPreviewMeta" class="zoro-stego-preview-meta"></div>
                        </div>
                    </div>
                    <div class="zoro-stego-field">
                        <label>2. كلمة المرور لفك التشفير (إجبارية *)</label>
                        <input type="password" id="stegoExtractKey" placeholder="أدخل كلمة المرور المستخدمة عند الإخفاء" required>
                    </div>
                    <button type="button" class="zoro-stego-btn" id="stegoExtractSubmit">استخراج وفك تشفير النص</button>
                </div>

                <div id="stegoStatusBox" class="zoro-stego-status"></div>
            </div>
        `;
        document.body.appendChild(modal);

        bindImagePreview("stegoHideImage", "stegoHidePreviewBox", "stegoHidePreviewImg", "stegoHidePreviewMeta");
        bindImagePreview("stegoExtractImage", "stegoExtractPreviewBox", "stegoExtractPreviewImg", "stegoExtractPreviewMeta");

        const statusBox = document.getElementById("stegoStatusBox");
        function showStatus(msg, isError) {
            statusBox.textContent = msg;
            statusBox.className = "zoro-stego-status " + (isError ? "err" : "ok");
        }

        document.getElementById("zoroStegoClose").addEventListener("click", function () {
            modal.classList.remove("open");
        });

        modal.addEventListener("click", function (e) {
            if (e.target === modal) modal.classList.remove("open");
        });

        modal.querySelectorAll(".zoro-stego-tab").forEach(function (tab) {
            tab.addEventListener("click", function () {
                modal.querySelectorAll(".zoro-stego-tab").forEach(function (t) { t.classList.remove("active"); });
                tab.classList.add("active");
                const mode = tab.dataset.stegoTab;
                document.getElementById("stegoPaneHide").style.display = mode === "hide" ? "block" : "none";
                document.getElementById("stegoPaneExtract").style.display = mode === "extract" ? "block" : "none";
                statusBox.className = "zoro-stego-status";
            });
        });

        document.getElementById("stegoHideSubmit").addEventListener("click", async function () {
            const btn = this;
            const fileInput = document.getElementById("stegoHideImage");
            const text = document.getElementById("stegoHideText").value;
            const key = document.getElementById("stegoHideKey").value.trim();

            if (!fileInput.files.length) return showStatus("يرجى اختيار صورة أولاً.", true);
            if (!text.trim()) return showStatus("يرجى كتابة النص السري المراد إخفاؤه.", true);
            if (key.length < 4) return showStatus("كلمة المرور إجبارية (4 خانات على الأقل) لحماية النص.", true);

            const fd = new FormData();
            fd.append("image", fileInput.files[0]);
            fd.append("text", text);
            fd.append("key", key);

            btn.disabled = true;
            try {
                const res = await fetch("/api/stego/hide", { method: "POST", body: fd });
                if (!res.ok) {
                    const errData = await res.json().catch(function () { return {}; });
                    return showStatus(errData.error || "تعذر إخفاء النص داخل الصورة.", true);
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "zoro_stego_encrypted.png";
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                showStatus("تم تشفير النص بـ AES-256-GCM وإخفاؤه داخل الصورة بنجاح. تنبيه: أرسلها كـ «ملف/مستند» حتى لا يضغطها واتساب أو تيليجرام.", false);
            } catch (e) {
                showStatus("حدث خطأ في الاتصال بالخادم.", true);
            } finally {
                btn.disabled = false;
            }
        });

        document.getElementById("stegoExtractSubmit").addEventListener("click", async function () {
            const btn = this;
            const fileInput = document.getElementById("stegoExtractImage");
            const key = document.getElementById("stegoExtractKey").value.trim();

            if (!fileInput.files.length) return showStatus("يرجى اختيار صورة PNG أولاً.", true);
            if (!key) return showStatus("يرجى إدخال كلمة المرور لفك تشفير النص المخفي.", true);

            const fd = new FormData();
            fd.append("image", fileInput.files[0]);
            fd.append("key", key);

            btn.disabled = true;
            try {
                const res = await fetch("/api/stego/extract", { method: "POST", body: fd });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    return showStatus(data.error || "تعذر استخراج النص أو كلمة المرور غير صحيحة.", true);
                }
                showStatus("🔐 النص المستخرج (AES-256-GCM):\n" + data.text, false);
            } catch (e) {
                showStatus("حدث خطأ في الاتصال بالخادم.", true);
            } finally {
                btn.disabled = false;
            }
        });
    }

    function init() {
        injectStegoStyles();
        buildStegoModal();
        mountStandaloneAboveCryptoBox();

        const observer = new MutationObserver(function () {
            mountStandaloneAboveCryptoBox();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
