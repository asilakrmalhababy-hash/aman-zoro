(function () {
    const mount = document.getElementById("textModuleMount");
    if (!mount) return;

    const ALGOS = Object.freeze([
        { id: "aes", name: "AES-256-GCM", tag: "حديث وآمن جداً", badge: "safe", note: "" },
        { id: "chacha20", name: "ChaCha20-Poly1305", tag: "حديث وسريع", badge: "safe", note: "" },
        { id: "rsa", name: "RSA-2048", tag: "مفتاح عام / خاص", badge: "safe", note: "" },
        { id: "caesar", name: "Caesar Cipher", tag: "تعليمي فقط", badge: "warn", note: "خوارزمية كلاسيكية قديمة للتعلم فقط ولا توفر حماية أمنية حقيقية." },
        { id: "vigenere", name: "Vigenère Cipher", tag: "تعليمي فقط", badge: "warn", note: "خوارزمية كلاسيكية تعليمية ولا تناسب حماية البيانات الحساسة." },
        { id: "playfair", name: "Playfair Cipher", tag: "تعليمي • إنجليزي", badge: "warn", note: "خوارزمية كلاسيكية تعتمد مصفوفة 5×5 وتدعم الحروف الإنجليزية فقط." },
        { id: "railfence", name: "Rail Fence Cipher", tag: "تعليمي • تبديل", badge: "warn", note: "خوارزمية تبديل كلاسيكية قديمة للأغراض التعليمية فقط." },
        { id: "des", name: "DES", tag: "قديم وغير آمن", badge: "danger", note: "تحذير: DES خوارزمية قديمة ومكسورة أمنياً، وهي للتوضيح التعليمي فقط." },
    ]);

    const ALGO_BY_ID = Object.freeze(
        ALGOS.reduce(function (acc, item) {
            acc[item.id] = item;
            return acc;
        }, {})
    );

    const KEY_HINTS = Object.freeze({
        caesar: {
            ph: "رقم الإزاحة مثل: 3",
            hint: "أدخل رقماً صحيحاً يمثل مقدار الإزاحة (يدعم العربية والإنجليزية).",
        },
        railfence: {
            ph: "عدد الصفوف مثل: 3",
            hint: "أدخل رقماً صحيحاً بين 2 و 50 يمثل عدد صفوف المسار المتعرج.",
        },
        playfair: {
            ph: "كلمة إنجليزية مثل: MONARCHY",
            hint: "مفتاح إنجليزي لتكوين مصفوفة 5×5 (يدعم النصوص الإنجليزية فقط).",
        },
        vigenere: {
            ph: "كلمة مفتاحية مثل: ZORO أو زورو",
            hint: "أدخل كلمة من حروف عربية أو إنجليزية.",
        },
        des: {
            ph: "8 أحرف بالضبط مثل: 12345678",
            hint: "يتطلب مفتاحاً من 8 أحرف أو أرقام بالضبط.",
        },
    });

    let mode = "encrypt";
    let selectedAlgo = "aes";
    let dropdownOpen = false;
    let lastOutput = "";
    let lastKey = "";
    let pubKey = "";
    let privKey = "";

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
        '<div class="mode-switch-bar">' +
        '<button type="button" id="txtModeEnc" class="mode-pill active">تشفير (Encrypt)</button>' +
        '<button type="button" id="txtModeDec" class="mode-pill">فك التشفير (Decrypt)</button>' +
        "</div>" +
        '<div class="split-grid">' +
        '<div class="split-col">' +
        '<div class="panel">' +
        '<label class="field-label">خوارزمية التشفير</label>' +
        '<div class="dd-wrap" id="algoDdWrap">' +
        '<button type="button" id="algoDdTrigger" class="dd-trigger">' +
        '<span id="algoDdSelected">AES-256-GCM</span>' +
        '<span class="dd-right"><span id="algoDdBadge" class="badge safe">حديث وآمن جداً</span><span class="dd-caret">▾</span></span>' +
        "</button>" +
        '<div id="algoDdMenu" class="dd-menu hidden"></div>' +
        "</div>" +
        '<div id="txtAlgoNote" class="inline-alert hidden"></div>' +

        '<div id="txtRsaBox" class="rsa-panel hidden">' +
        '<div class="row-between">' +
        '<span class="small-bold">مفاتيح RSA-2048</span>' +
        '<button type="button" id="txtGenRsaBtn" class="ghost-btn">توليد زوج مفاتيح</button>' +
        "</div>" +
        '<div id="txtRsaKeysOut" class="rsa-out hidden">' +
        '<div class="key-box-item">' +
        '<div class="row-between"><span>المفتاح العام (Public Key)</span><button type="button" id="copyPubBtn" class="ghost-btn">نسخ</button></div>' +
        '<textarea id="txtPubArea" class="code-area" rows="2" readonly spellcheck="false"></textarea>' +
        "</div>" +
        '<div class="key-box-item">' +
        '<div class="row-between"><span>المفتاح الخاص (Private Key)</span><button type="button" id="copyPrivBtn" class="ghost-btn">نسخ</button></div>' +
        '<textarea id="txtPrivArea" class="code-area" rows="2" readonly spellcheck="false"></textarea>' +
        "</div>" +
        "</div>" +
        "</div>" +

        '<div id="txtKeyGroup" class="field-group">' +
        '<div class="row-between">' +
        '<label id="txtKeyLabel" class="field-label txt-label-reset" for="txtKeyInput">مفتاح التشفير</label>' +
        '<button type="button" id="txtGoPwdGenBtn" class="inline-link-btn">توليد كلمة مرور ←</button>' +
        "</div>" +
        '<input type="password" id="txtKeyInput" class="text-input" dir="auto" spellcheck="false" autocomplete="new-password" placeholder="أدخل كلمة المرور...">' +
        '<textarea id="txtKeyArea" class="text-input code-area hidden" rows="4" dir="ltr" spellcheck="false" placeholder="-----BEGIN PUBLIC KEY-----"></textarea>' +
        '<p id="txtKeyHint" class="field-hint"></p>' +
        "</div>" +

        '<div class="field-group">' +
        '<label id="txtInputLabel" class="field-label" for="txtSourceInput">النص المراد تشفيره</label>' +
        '<textarea id="txtSourceInput" class="text-input editor-area" rows="6" dir="auto" spellcheck="false" placeholder="اكتب النص هنا بالعربية أو الإنجليزية..."></textarea>' +
        "</div>" +

        '<div id="txtError" class="inline-alert danger hidden"></div>' +

        '<button type="button" id="txtRunBtn" class="primary-btn full-w">تنفيذ التشفير</button>' +
        "</div>" +
        "</div>" +

        '<div class="split-col">' +
        '<div id="txtEmptyResult" class="panel empty-panel">' +
        "<h3>منطقة النتيجة</h3>" +
        "<p>ستظهر النتيجة هنا فور تنفيذ العملية مع أزرار النسخ والتحميل والمسح والتبديل السريع.</p>" +
        "</div>" +

        '<div id="txtResultBox" class="panel result-card hidden">' +
        '<div class="row-between result-top">' +
        '<h3 id="txtResHeading">النص المشفر</h3>' +
        '<span id="txtResAlgoPill" class="badge safe">AES-256-GCM</span>' +
        "</div>" +
        '<textarea id="txtResOutput" class="text-input editor-area result-out" rows="6" dir="auto" readonly spellcheck="false"></textarea>' +
        '<div id="txtResNote" class="inline-alert hidden"></div>' +
        '<div class="result-btn-grid">' +
        '<button type="button" id="txtCopyResBtn" class="ghost-btn action-sm">نسخ النتيجة</button>' +
        '<button type="button" id="txtDownloadResBtn" class="ghost-btn action-sm">تحميل النتيجة</button>' +
        '<button type="button" id="txtSwapModeBtn" class="ghost-btn action-sm">تبديل الوضع</button>' +
        '<button type="button" id="txtClearAllBtn" class="ghost-btn action-sm danger-txt">مسح المحتوى</button>' +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>";

    const menuEl = document.getElementById("algoDdMenu");
    ALGOS.forEach(function (a) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "dd-option" + (a.id === selectedAlgo ? " active" : "");
        item.dataset.id = a.id;
        item.innerHTML =
            "<span>" +
            esc(a.name) +
            '</span><span class="badge ' +
            esc(a.badge) +
            '">' +
            esc(a.tag) +
            "</span>";
        item.onclick = function () {
            chooseAlgorithm(a.id);
        };
        menuEl.appendChild(item);
    });

    function setDropdown(open) {
        dropdownOpen = Boolean(open);
        menuEl.classList.toggle("hidden", !dropdownOpen);
        document.getElementById("algoDdTrigger").classList.toggle("open", dropdownOpen);
    }

    document.getElementById("algoDdTrigger").onclick = function (e) {
        e.stopPropagation();
        setDropdown(!dropdownOpen);
    };

    document.addEventListener("click", function (e) {
        const wrap = document.getElementById("algoDdWrap");
        if (wrap && !wrap.contains(e.target)) {
            setDropdown(false);
        }
    });

    function chooseAlgorithm(algoId) {
        const obj = ALGO_BY_ID[algoId] || ALGOS[0];
        selectedAlgo = obj.id;
        setDropdown(false);
        hideError();

        document.getElementById("algoDdSelected").textContent = obj.name;
        const badgeEl = document.getElementById("algoDdBadge");
        badgeEl.textContent = obj.tag;
        badgeEl.className = "badge " + obj.badge;

        menuEl.querySelectorAll(".dd-option").forEach(function (opt) {
            opt.classList.toggle("active", opt.dataset.id === selectedAlgo);
        });

        const noteEl = document.getElementById("txtAlgoNote");
        if (obj.note) {
            noteEl.textContent = obj.note;
            noteEl.classList.remove("hidden");
            noteEl.classList.toggle("danger", obj.badge === "danger");
        } else {
            noteEl.classList.add("hidden");
        }

        const isRsa = selectedAlgo === "rsa";
        const isEnc = mode === "encrypt";
        document.getElementById("txtRsaBox").classList.toggle("hidden", !isRsa);
        document.getElementById("txtGoPwdGenBtn").classList.toggle("hidden", isRsa);

        const keyInp = document.getElementById("txtKeyInput");
        const keyArea = document.getElementById("txtKeyArea");
        const hintEl = document.getElementById("txtKeyHint");

        if (isRsa) {
            keyInp.classList.add("hidden");
            keyArea.classList.remove("hidden");
            keyArea.placeholder = isEnc
                ? "-----BEGIN PUBLIC KEY-----"
                : "-----BEGIN RSA PRIVATE KEY-----";
            hintEl.textContent = isEnc
                ? "أدخل المفتاح العام (Public Key) للتشفير أو ولّده من الأعلى."
                : "أدخل المفتاح الخاص (Private Key) لفك التشفير.";
        } else {
            keyArea.classList.add("hidden");
            keyInp.classList.remove("hidden");
            const customCfg = KEY_HINTS[selectedAlgo];
            if (customCfg) {
                keyInp.placeholder = customCfg.ph;
                hintEl.textContent = customCfg.hint;
            } else {
                keyInp.placeholder = isEnc
                    ? "أدخل كلمة مرور قوية..."
                    : "أدخل نفس كلمة المرور...";
                hintEl.textContent =
                    "أدخل مفتاحاً سرياً قوياً؛ يُشتق داخلياً بمعيار أمان عالٍ.";
            }
        }
    }

    function setMode(newMode) {
        mode = newMode === "decrypt" ? "decrypt" : "encrypt";
        const isEnc = mode === "encrypt";
        document.getElementById("txtModeEnc").classList.toggle("active", isEnc);
        document.getElementById("txtModeDec").classList.toggle("active", !isEnc);

        document.getElementById("txtKeyLabel").textContent = isEnc
            ? "مفتاح التشفير"
            : "مفتاح فك التشفير";
        document.getElementById("txtInputLabel").textContent = isEnc
            ? "النص المراد تشفيره"
            : "النص المشفر";
        document.getElementById("txtSourceInput").placeholder = isEnc
            ? "اكتب النص هنا بالعربية أو الإنجليزية..."
            : "ألصق النص المشفر هنا...";
        document.getElementById("txtRunBtn").textContent = isEnc
            ? "تنفيذ التشفير"
            : "تنفيذ فك التشفير";
        chooseAlgorithm(selectedAlgo);
    }

    document.getElementById("txtModeEnc").onclick = function () {
        setMode("encrypt");
    };
    document.getElementById("txtModeDec").onclick = function () {
        setMode("decrypt");
    };

    document.getElementById("txtGoPwdGenBtn").onclick = function () {
        if (typeof openSecurityTool === "function") {
            openSecurityTool("password");
        } else {
            navigateTo("tools");
        }
    };

    document.getElementById("txtGenRsaBtn").onclick = async function () {
        const btn = this;
        btn.disabled = true;
        btn.textContent = "جاري التوليد...";
        try {
            const res = await fetch("/api/generate-rsa", { method: "POST" });
            const payload = await res.json();
            if (!res.ok || !payload.success) {
                showError(payload.error || "تعذر توليد المفاتيح.");
                return;
            }
            pubKey = String(payload.public_key || "");
            privKey = String(payload.private_key || "");
            document.getElementById("txtPubArea").value = pubKey;
            document.getElementById("txtPrivArea").value = privKey;
            document.getElementById("txtRsaKeysOut").classList.remove("hidden");
            document.getElementById("txtKeyArea").value =
                mode === "encrypt" ? pubKey : privKey;
            showToast("تم توليد مفاتيح RSA-2048");
        } catch (_) {
            showError("تعذر الاتصال بالخادم.");
        } finally {
            btn.disabled = false;
            btn.textContent = "توليد زوج مفاتيح";
        }
    };

    document.getElementById("copyPubBtn").onclick = function () {
        copyText(pubKey);
    };
    document.getElementById("copyPrivBtn").onclick = function () {
        copyText(privKey);
    };

    document.getElementById("txtRunBtn").onclick = async function () {
        hideError();
        const isEnc = mode === "encrypt";
        const keyVal =
            selectedAlgo === "rsa"
                ? document.getElementById("txtKeyArea").value
                : document.getElementById("txtKeyInput").value;
        const textVal = document.getElementById("txtSourceInput").value;

        if (!keyVal.trim()) {
            showError("يرجى إدخال المفتاح المطلوب.");
            return;
        }
        if (!textVal.trim()) {
            showError(isEnc ? "يرجى إدخال النص الأصلي." : "يرجى إدخال النص المشفر.");
            return;
        }

        const btn = this;
        const prevTxt = btn.textContent;
        btn.disabled = true;
        btn.textContent = "جاري التنفيذ...";

        try {
            const url = isEnc ? "/api/encrypt" : "/api/decrypt";
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    algorithm: selectedAlgo,
                    key: keyVal,
                    text: textVal,
                }),
            });
            const payload = await res.json();
            if (!res.ok || !payload.success) {
                showError(payload.error || "فشلت العملية.");
                return;
            }

            lastOutput = String(payload.result || "");
            lastKey = keyVal;

            document.getElementById("txtEmptyResult").classList.add("hidden");
            document.getElementById("txtResultBox").classList.remove("hidden");

            document.getElementById("txtResHeading").textContent = isEnc
                ? "النص المشفر"
                : "النص بعد فك التشفير";
            document.getElementById("txtResAlgoPill").textContent =
                payload.algorithm || ALGO_BY_ID[selectedAlgo].name;
            document.getElementById("txtResOutput").value = lastOutput;

            const rNote = document.getElementById("txtResNote");
            if (payload.warning) {
                rNote.textContent = String(payload.warning);
                rNote.classList.remove("hidden");
                rNote.classList.toggle("danger", selectedAlgo === "des");
            } else {
                rNote.classList.add("hidden");
            }

            showToast(isEnc ? "تم التشفير بنجاح" : "تم فك التشفير بنجاح");
        } catch (_) {
            showError("تعذر الاتصال بالخادم.");
        } finally {
            btn.disabled = false;
            btn.textContent = prevTxt;
        }
    };

    document.getElementById("txtCopyResBtn").onclick = function () {
        copyText(lastOutput);
    };

    document.getElementById("txtDownloadResBtn").onclick = function () {
        if (!lastOutput) return;
        const blob = new Blob([lastOutput], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
            (mode === "encrypt" ? "zoro_encrypted_" : "zoro_decrypted_") +
            selectedAlgo +
            ".txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () {
            try {
                URL.revokeObjectURL(url);
            } catch (_) { }
        }, 1500);
        showToast("تم تحميل الملف النصي");
    };

    document.getElementById("txtSwapModeBtn").onclick = function () {
        const nextMode = mode === "encrypt" ? "decrypt" : "encrypt";
        setMode(nextMode);
        if (lastOutput) {
            document.getElementById("txtSourceInput").value = lastOutput;
            if (selectedAlgo === "rsa" && privKey && nextMode === "decrypt") {
                document.getElementById("txtKeyArea").value = privKey;
            } else if (selectedAlgo !== "rsa" && lastKey) {
                document.getElementById("txtKeyInput").value = lastKey;
            }
        }
    };

    document.getElementById("txtClearAllBtn").onclick = function () {
        document.getElementById("txtSourceInput").value = "";
        document.getElementById("txtResOutput").value = "";
        lastOutput = "";
        document.getElementById("txtResultBox").classList.add("hidden");
        document.getElementById("txtEmptyResult").classList.remove("hidden");
        hideError();
    };

    function showError(msg) {
        const el = document.getElementById("txtError");
        el.textContent = String(msg ?? "");
        el.classList.remove("hidden");
    }

    function hideError() {
        document.getElementById("txtError").classList.add("hidden");
    }

    chooseAlgorithm("aes");
})();
