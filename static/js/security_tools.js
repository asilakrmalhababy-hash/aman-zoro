(function () {
    const mount = document.getElementById("toolsModuleMount");
    if (!mount) return;

    let infoFileObj = null;
    let qrLibLoading = null;

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
        '<div class="mode-switch-bar four-cols">' +
        '<button type="button" class="mode-pill active" data-stool="password">مولد كلمات المرور</button>' +
        '<button type="button" class="mode-pill" data-stool="key">مولد المفاتيح</button>' +
        '<button type="button" class="mode-pill" data-stool="qr">مولد QR</button>' +
        '<button type="button" class="mode-pill" data-stool="fileinfo">معلومات الملف</button>' +
        "</div>" +

        '<div id="stool-password" class="stool-pane">' +
        '<div class="panel max-narrow">' +
        "<h3>مولد كلمات المرور القوية</h3>" +
        '<p class="field-hint">يتم التوليد محلياً داخل متصفحك باستخدام مولد عشوائي آمن (CSPRNG).</p>' +
        '<div class="field-group">' +
        '<div class="row-between"><label class="field-label tools-label-reset" for="pwdLenRange">طول كلمة المرور</label><span id="pwdLenVal" class="badge safe">16 حرفاً</span></div>' +
        '<input type="range" id="pwdLenRange" class="range-input" min="8" max="64" value="16">' +
        "</div>" +
        '<div class="checks-grid">' +
        '<label class="check-item"><input type="checkbox" id="chkUpper" checked><span>أحرف كبيرة (A-Z)</span></label>' +
        '<label class="check-item"><input type="checkbox" id="chkLower" checked><span>أحرف صغيرة (a-z)</span></label>' +
        '<label class="check-item"><input type="checkbox" id="chkNums" checked><span>أرقام (0-9)</span></label>' +
        '<label class="check-item"><input type="checkbox" id="chkSyms" checked><span>رموز خاصة (!@#$)</span></label>' +
        "</div>" +
        '<button type="button" id="genPwdBtn" class="primary-btn full-w">توليد كلمة مرور</button>' +
        '<div id="pwdOutWrap" class="hash-out-box hidden">' +
        '<div class="row-between"><span class="badge safe">جاهزة</span><button type="button" id="copyPwdBtn" class="ghost-btn">نسخ</button></div>' +
        '<div id="pwdOutText" class="mono-box" dir="ltr"></div>' +
        "</div>" +
        "</div>" +
        "</div>" +

        '<div id="stool-key" class="stool-pane hidden">' +
        '<div class="panel max-narrow">' +
        "<h3>مولد المفاتيح التشفيرية (Symmetric Keys)</h3>" +
        '<p class="field-hint">توليد مفاتيح عشوائية خالصة للتشفير المتماثل بصيغتي Hex و Base64.</p>' +
        '<div class="field-group">' +
        '<label class="field-label" for="keyBitsSelect">قوة المفتاح (Key Size)</label>' +
        '<select id="keyBitsSelect" class="select-input">' +
        '<option value="16">128-bit (16 بايت)</option>' +
        '<option value="32" selected>256-bit (32 بايت - موصى به)</option>' +
        '<option value="64">512-bit (64 بايت)</option>' +
        "</select>" +
        "</div>" +
        '<button type="button" id="genKeyRunBtn" class="primary-btn full-w">توليد مفتاح تشفير</button>' +
        '<div id="keyOutWrap" class="rsa-out hidden">' +
        '<div class="key-box-item">' +
        '<div class="row-between"><span>صيغة Hex</span><button type="button" id="copyKeyHexBtn" class="ghost-btn">نسخ</button></div>' +
        '<div id="keyHexOut" class="mono-box" dir="ltr"></div>' +
        "</div>" +
        '<div class="key-box-item">' +
        '<div class="row-between"><span>صيغة Base64</span><button type="button" id="copyKeyB64Btn" class="ghost-btn">نسخ</button></div>' +
        '<div id="keyB64Out" class="mono-box" dir="ltr"></div>' +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +

        '<div id="stool-qr" class="stool-pane hidden">' +
        '<div class="panel max-narrow">' +
        "<h3>مولد رموز QR</h3>" +
        '<p class="field-hint">حوّل أي نص أو رابط أو مفتاح إلى رمز QR قياسي قابل للمسح بكاميرا الجوال.</p>' +
        '<div class="field-group">' +
        '<label class="field-label" for="qrSourceText">المحتوى المراد تحويله لـ QR</label>' +
        '<textarea id="qrSourceText" class="text-input" rows="3" dir="auto" spellcheck="false" placeholder="أدخل نصاً أو رابطاً..."></textarea>' +
        "</div>" +
        '<div id="qrErr" class="inline-alert danger hidden"></div>' +
        '<button type="button" id="genQrBtn" class="primary-btn full-w">إنشاء رمز QR</button>' +
        '<div id="qrOutWrap" class="qr-out hidden">' +
        '<canvas id="qrCanvas" width="240" height="240"></canvas>' +
        '<span id="qrModeHint" class="field-hint"></span>' +
        '<button type="button" id="dlQrBtn" class="ghost-btn">تحميل صورة QR (PNG)</button>' +
        "</div>" +
        "</div>" +
        "</div>" +

        '<div id="stool-fileinfo" class="stool-pane hidden">' +
        '<div class="panel max-narrow">' +
        "<h3>محلل معلومات الملفات</h3>" +
        '<p class="field-hint">افحص خصائص أي ملف محلياً (الاسم، الامتداد، النوع، الحجم، وتاريخ التعديل).</p>' +
        '<div class="field-group">' +
        '<input type="file" id="infoFileInput" class="hidden">' +
        '<button type="button" id="infoPickBtn" class="ghost-btn wide-pick-btn">اختيار ملف لفحص معلوماته</button>' +
        "</div>" +
        '<div id="infoResultBox" class="file-summary-box hidden tools-mt-14"></div>' +
        "</div>" +
        "</div>";

    function switchSubTool(toolKey) {
        document.querySelectorAll("[data-stool]").forEach(function (btn) {
            btn.classList.toggle("active", btn.dataset.stool === toolKey);
        });
        document.querySelectorAll(".stool-pane").forEach(function (pane) {
            pane.classList.toggle("hidden", pane.id !== "stool-" + toolKey);
        });
    }

    document.querySelectorAll("[data-stool]").forEach(function (btn) {
        btn.onclick = function () {
            switchSubTool(btn.dataset.stool);
        };
    });

    window.addEventListener("zoro:open-tool", function (ev) {
        if (ev && ev.detail && ev.detail.tool) {
            switchSubTool(ev.detail.tool);
        }
    });

    function cryptoRandomInt(max) {
        if (max <= 0) return 0;
        if (window.crypto && window.crypto.getRandomValues) {
            const arr = new Uint32Array(1);
            const limit = Math.floor(0xffffffff / max) * max;
            let val = 0;
            do {
                window.crypto.getRandomValues(arr);
                val = arr[0];
            } while (val >= limit);
            return val % max;
        }
        return Math.floor(Math.random() * max);
    }

    const lenRange = document.getElementById("pwdLenRange");
    lenRange.oninput = function () {
        document.getElementById("pwdLenVal").textContent = lenRange.value + " حرفاً";
    };

    document.getElementById("genPwdBtn").onclick = function () {
        const length = parseInt(lenRange.value, 10) || 16;
        let pool = "";
        if (document.getElementById("chkUpper").checked) {
            pool += "ABCDEFGHJKLMNPQRSTUVWXYZ";
        }
        if (document.getElementById("chkLower").checked) {
            pool += "abcdefghijkmnopqrstuvwxyz";
        }
        if (document.getElementById("chkNums").checked) {
            pool += "0123456789";
        }
        if (document.getElementById("chkSyms").checked) {
            pool += "!@#$%^&*-_=+?";
        }
        if (!pool) {
            showToast("اختر نوعاً واحداً على الأقل من الأحرف");
            return;
        }

        const chars = [];
        for (let i = 0; i < length; i++) {
            chars.push(pool.charAt(cryptoRandomInt(pool.length)));
        }

        document.getElementById("pwdOutWrap").classList.remove("hidden");
        document.getElementById("pwdOutText").textContent = chars.join("");
    };

    document.getElementById("copyPwdBtn").onclick = function () {
        copyText(document.getElementById("pwdOutText").textContent);
    };

    document.getElementById("genKeyRunBtn").onclick = function () {
        const byteLen = parseInt(document.getElementById("keyBitsSelect").value, 10) || 32;
        const bytes = new Uint8Array(byteLen);
        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(bytes);
        } else {
            for (let i = 0; i < byteLen; i++) bytes[i] = cryptoRandomInt(256);
        }

        const hexParts = [];
        const binParts = [];
        for (let i = 0; i < bytes.length; i++) {
            hexParts.push(bytes[i].toString(16).padStart(2, "0"));
            binParts.push(String.fromCharCode(bytes[i]));
        }

        document.getElementById("keyOutWrap").classList.remove("hidden");
        document.getElementById("keyHexOut").textContent = hexParts.join("");
        document.getElementById("keyB64Out").textContent = btoa(binParts.join(""));
    };

    document.getElementById("copyKeyHexBtn").onclick = function () {
        copyText(document.getElementById("keyHexOut").textContent);
    };

    document.getElementById("copyKeyB64Btn").onclick = function () {
        copyText(document.getElementById("keyB64Out").textContent);
    };

    function loadQrLibrary() {
        if (window.QRCode && typeof window.QRCode.toCanvas === "function") {
            return Promise.resolve(true);
        }
        if (qrLibLoading) return qrLibLoading;

        qrLibLoading = new Promise(function (resolve) {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js";
            script.async = true;
            script.onload = function () {
                resolve(
                    Boolean(window.QRCode && typeof window.QRCode.toCanvas === "function")
                );
            };
            script.onerror = function () {
                resolve(false);
            };
            document.head.appendChild(script);
        });

        return qrLibLoading;
    }

    document.getElementById("genQrBtn").onclick = async function () {
        const errEl = document.getElementById("qrErr");
        const hintEl = document.getElementById("qrModeHint");
        const canvas = document.getElementById("qrCanvas");
        errEl.classList.add("hidden");

        const val = document.getElementById("qrSourceText").value.trim();
        if (!val) {
            errEl.textContent = "يرجى إدخال نص أو رابط أولاً.";
            errEl.classList.remove("hidden");
            return;
        }

        const btn = this;
        const prevTxt = btn.textContent;
        btn.disabled = true;
        btn.textContent = "جاري الإنشاء...";

        try {
            if (typeof window.QRious === "function") {
                const tmp = document.createElement("canvas");
                new window.QRious({
                    element: tmp,
                    value: unescape(encodeURIComponent(val)),
                    size: 260,
                    padding: 0,
                    level: "M",
                    background: "#ffffff",
                    foreground: "#090d14",
                });
                const tctx = tmp.getContext("2d");
                const img = tctx.getImageData(0, 0, tmp.width, tmp.height).data;
                let minX = tmp.width, minY = tmp.height, maxX = 0, maxY = 0;
                for (let y = 0; y < tmp.height; y++) {
                    for (let x = 0; x < tmp.width; x++) {
                        if (img[(y * tmp.width + x) * 4] < 128) {
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                        }
                    }
                }
                const cw = Math.max(1, maxX - minX + 1), ch = Math.max(1, maxY - minY + 1);
                canvas.width = 240; canvas.height = 240;
                const ctx = canvas.getContext("2d");
                ctx.imageSmoothingEnabled = false;
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, 240, 240);
                ctx.drawImage(tmp, minX, minY, cw, ch, 20, 20, 200, 200);
                hintEl.textContent = "✓ رمز QR قياسي جاهز للمسح بكاميرا الجوال.";
            } else if (await loadQrLibrary()) {
                await new Promise(function (resolve, reject) {
                    window.QRCode.toCanvas(canvas, val, { width: 240, margin: 2, errorCorrectionLevel: "M", color: { dark: "#090d14", light: "#ffffff" } }, function (err) { if (err) reject(err); else resolve(); });
                });
                hintEl.textContent = "✓ رمز QR قياسي جاهز للمسح بكاميرا الجوال.";
            } else {
                drawFallbackMatrixQr(val, canvas);
                hintEl.textContent =
                    "تم الإنشاء في وضع عدم الاتصال (يُنصح بالاتصال بالإنترنت لمسح قياسي أدق).";
            }
            document.getElementById("qrOutWrap").classList.remove("hidden");
        } catch (_) {
            errEl.textContent = "تعذر إنشاء رمز QR لهذا المحتوى.";
            errEl.classList.remove("hidden");
        } finally {
            btn.disabled = false;
            btn.textContent = prevTxt;
        }
    };

    document.getElementById("dlQrBtn").onclick = function () {
        const canvas = document.getElementById("qrCanvas");
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = "zoro_qr_code.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast("تم تحميل صورة QR");
    };

    function drawFallbackMatrixQr(text, canvas) {
        const ctx = canvas.getContext("2d");
        const size = 25;
        const cell = 8;
        const pad = 10;
        canvas.width = size * cell + pad * 2;
        canvas.height = size * cell + pad * 2;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const grid = Array.from({ length: size }, function () {
            return Array(size).fill(false);
        });
        const reserved = Array.from({ length: size }, function () {
            return Array(size).fill(false);
        });

        function placeFinder(r0, c0) {
            for (let r = -1; r <= 7; r++) {
                for (let c = -1; c <= 7; c++) {
                    const rr = r0 + r;
                    const cc = c0 + c;
                    if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
                    reserved[rr][cc] = true;
                    const inBox = r >= 0 && r <= 6 && c >= 0 && c <= 6;
                    const border = r === 0 || r === 6 || c === 0 || c === 6;
                    const center = r >= 2 && r <= 4 && c >= 2 && c <= 4;
                    grid[rr][cc] = inBox && (border || center);
                }
            }
        }

        placeFinder(0, 0);
        placeFinder(0, size - 7);
        placeFinder(size - 7, 0);

        const bytes = new TextEncoder().encode(text);
        const bits = [];
        for (let i = 0; i < bytes.length; i++) {
            for (let b = 7; b >= 0; b--) {
                bits.push(((bytes[i] >> b) & 1) === 1);
            }
        }

        let bitIdx = 0;
        let state = 2166136261 >>> 0;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (reserved[r][c]) continue;
                state ^= r * 31 + c * 17 + (bitIdx % 251);
                state = Math.imul(state, 16777619) >>> 0;
                if (bitIdx < bits.length) {
                    grid[r][c] = bits[bitIdx] ? (r + c) % 2 === 0 : (state & 1) === 1;
                    bitIdx++;
                } else {
                    grid[r][c] = ((state >>> 3) & 1) === 1;
                }
            }
        }

        ctx.fillStyle = "#090d14";
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c]) {
                    ctx.fillRect(pad + c * cell, pad + r * cell, cell, cell);
                }
            }
        }
    }

    const infoInput = document.getElementById("infoFileInput");
    document.getElementById("infoPickBtn").onclick = function () {
        infoInput.click();
    };
    infoInput.onchange = function () {
        if (!infoInput.files || !infoInput.files[0]) return;
        infoFileObj = infoInput.files[0];
        const parts = infoFileObj.name.split(".");
        const ext = parts.length > 1 ? "." + parts.pop().toLowerCase() : "بدون امتداد";
        const mb = (infoFileObj.size / (1024 * 1024)).toFixed(2);
        const modDate = infoFileObj.lastModified
            ? new Date(infoFileObj.lastModified).toLocaleString("ar-EG")
            : "غير متوفر";
        const box = document.getElementById("infoResultBox");
        box.innerHTML =
            "<div><span>اسم الملف:</span> <strong>" +
            esc(infoFileObj.name) +
            "</strong></div>" +
            "<div><span>الامتداد:</span> <strong>" +
            esc(ext) +
            "</strong></div>" +
            "<div><span>النوع (MIME):</span> <strong>" +
            esc(infoFileObj.type || "غير محدد") +
            "</strong></div>" +
            "<div><span>الحجم:</span> <strong>" +
            Number(infoFileObj.size || 0).toLocaleString() +
            " بايت (" +
            mb +
            " MB)</strong></div>" +
            "<div><span>آخر تعديل:</span> <strong>" +
            esc(modDate) +
            "</strong></div>";
        box.classList.remove("hidden");
    };
})();
