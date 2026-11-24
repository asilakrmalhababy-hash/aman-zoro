(function () {
    const mount = document.getElementById("filesModuleMount");
    if (!mount) return;

    const MAX_MB = 100;
    const MAX_BYTES = MAX_MB * 1024 * 1024;

    const ALGO_LABELS = Object.freeze({
        aes: "AES-256-GCM",
        chacha20: "ChaCha20-Poly1305",
    });

    let fileMode = "encrypt";
    let fileAlgo = "aes";
    let pickedFile = null;
    let lastBlob = null;
    let lastOutputName = "";
    let lastObjectUrl = null;
    let previewObjectUrl = null;

    function esc(s) {
        return String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function revokeUrl(url) {
        if (url) {
            try {
                URL.revokeObjectURL(url);
            } catch (_) { }
        }
    }

    mount.className = "tool-workspace";
    mount.innerHTML =
        '<div class="mode-switch-bar">' +
        '<button type="button" id="fModeEnc" class="mode-pill active">تشفير ملف أو صورة</button>' +
        '<button type="button" id="fModeDec" class="mode-pill">فك تشفير ملف (.zoro)</button>' +
        "</div>" +
        '<div class="split-grid">' +
        '<div class="split-col">' +
        '<div class="panel">' +
        '<input type="file" id="fPickerInput" class="hidden">' +
        '<div id="fDropZone" class="drop-box">' +
        '<svg class="drop-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
        '<strong id="fDropTitle">اسحب الصورة أو الملف وأفلته هنا، أو اضغط للاختيار</strong>' +
        '<span id="fDropSub">صور (PNG, JPG, WEBP)، مستندات (PDF, DOCX)، أرشيفات (ZIP)، صوت (MP3) • حتى 100 MB</span>' +
        "</div>" +

        '<div id="fSelectedCard" class="selected-card hidden">' +
        '<div class="row-between sel-head">' +
        '<span class="small-bold">الملف المحدد</span>' +
        '<div class="sel-actions">' +
        '<button type="button" id="fReplaceBtn" class="ghost-btn">استبدال</button>' +
        '<button type="button" id="fRemoveBtn" class="ghost-btn danger-txt">إزالة</button>' +
        "</div>" +
        "</div>" +
        '<div id="fImgPreviewWrap" class="preview-box hidden">' +
        '<img id="fImgPreview" alt="معاينة الصورة">' +
        "</div>" +
        '<div id="fGenericIconBox" class="generic-file-box hidden">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
        '<span id="fExtLabel">FILE</span>' +
        "</div>" +
        '<div class="sel-meta">' +
        '<strong id="fNameText">-</strong>' +
        '<span id="fSizeText">-</span>' +
        "</div>" +
        "</div>" +

        '<div id="fAlgoGroup" class="field-group">' +
        '<label class="field-label">خوارزمية التشفير</label>' +
        '<div class="two-choice">' +
        '<button type="button" class="choice-pill active" data-fa="aes">AES-256-GCM</button>' +
        '<button type="button" class="choice-pill" data-fa="chacha20">ChaCha20-Poly1305</button>' +
        "</div>" +
        "</div>" +

        '<div class="field-group">' +
        '<label id="fKeyLabel" class="field-label" for="fPasswordInput">كلمة مرور التشفير</label>' +
        '<input type="password" id="fPasswordInput" class="text-input" dir="auto" spellcheck="false" autocomplete="new-password" placeholder="أدخل كلمة مرور قوية...">' +
        '<p id="fKeyHint" class="field-hint">يُحفظ اسم الملف وامتداده الأصلي داخل ملف .zoro المشفر بشكل آمن.</p>' +
        "</div>" +

        '<div id="fError" class="inline-alert danger hidden"></div>' +

        '<button type="button" id="fSubmitBtn" class="primary-btn full-w">تشفير الملف</button>' +
        "</div>" +
        "</div>" +

        '<div class="split-col">' +
        '<div id="fEmptyOut" class="panel empty-panel">' +
        "<h3>حالة الملف والنتيجة</h3>" +
        "<p>بعد التشفير ستحصل على ملف محمي بامتداد <strong>.zoro</strong> مع إمكانية اختيار مكان الحفظ، وعند فك التشفير ستسترجع ملفك الأصلي بالكامل.</p>" +
        "</div>" +

        '<div id="fResultCard" class="panel result-card hidden">' +
        '<div class="row-between result-top">' +
        '<h3 id="fResTitle">تم التشفير بنجاح</h3>' +
        '<span id="fResBadge" class="badge safe">.ZORO</span>' +
        "</div>" +
        '<div class="file-summary-box" id="fResSummary"></div>' +
        '<div id="fOutImgWrap" class="preview-box hidden">' +
        '<img id="fOutImg" alt="الصورة المسترجعة">' +
        "</div>" +
        '<button type="button" id="fSaveBtn" class="primary-btn full-w">تحميل الملف</button>' +
        "</div>" +
        "</div>" +
        "</div>";

    const inputEl = document.getElementById("fPickerInput");
    const dropEl = document.getElementById("fDropZone");

    dropEl.onclick = function () {
        inputEl.click();
    };
    document.getElementById("fReplaceBtn").onclick = function () {
        inputEl.click();
    };
    document.getElementById("fRemoveBtn").onclick = function () {
        clearFile();
    };

    inputEl.onchange = function () {
        if (inputEl.files && inputEl.files[0]) {
            selectFile(inputEl.files[0]);
        }
        inputEl.value = "";
    };

    dropEl.ondragover = function (e) {
        e.preventDefault();
        dropEl.classList.add("drag-over");
    };
    dropEl.ondragleave = function () {
        dropEl.classList.remove("drag-over");
    };
    dropEl.ondrop = function (e) {
        e.preventDefault();
        dropEl.classList.remove("drag-over");
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
            selectFile(e.dataTransfer.files[0]);
        }
    };

    function formatBytes(b) {
        if (b < 1024) return b + " B";
        if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
        return (b / (1024 * 1024)).toFixed(2) + " MB";
    }

    function selectFile(file) {
        hideErr();
        if (file.size > MAX_BYTES) {
            showErr("حجم الملف يتجاوز الحد الأقصى المسموح به (" + MAX_MB + " ميجابايت).");
            return;
        }
        pickedFile = file;
        revokeUrl(previewObjectUrl);
        previewObjectUrl = null;

        dropEl.classList.add("hidden");
        document.getElementById("fSelectedCard").classList.remove("hidden");
        document.getElementById("fNameText").textContent = file.name;
        document.getElementById("fSizeText").textContent = formatBytes(file.size);

        const imgWrap = document.getElementById("fImgPreviewWrap");
        const imgEl = document.getElementById("fImgPreview");
        const genBox = document.getElementById("fGenericIconBox");

        if (file.type && file.type.indexOf("image/") === 0) {
            genBox.classList.add("hidden");
            previewObjectUrl = URL.createObjectURL(file);
            imgEl.src = previewObjectUrl;
            imgWrap.classList.remove("hidden");
        } else {
            imgWrap.classList.add("hidden");
            imgEl.removeAttribute("src");
            const parts = file.name.split(".");
            const ext = parts.length > 1 ? parts.pop().toUpperCase().slice(0, 6) : "FILE";
            document.getElementById("fExtLabel").textContent = ext;
            genBox.classList.remove("hidden");
        }
    }

    function clearFile() {
        pickedFile = null;
        revokeUrl(previewObjectUrl);
        previewObjectUrl = null;
        document.getElementById("fSelectedCard").classList.add("hidden");
        document.getElementById("fImgPreviewWrap").classList.add("hidden");
        document.getElementById("fGenericIconBox").classList.add("hidden");
        document.getElementById("fImgPreview").removeAttribute("src");
        dropEl.classList.remove("hidden");
        hideErr();
    }

    document.querySelectorAll("#fAlgoGroup .choice-pill").forEach(function (pill) {
        pill.onclick = function () {
            const nextAlgo = pill.dataset.fa;
            if (!Object.prototype.hasOwnProperty.call(ALGO_LABELS, nextAlgo)) return;
            fileAlgo = nextAlgo;
            document.querySelectorAll("#fAlgoGroup .choice-pill").forEach(function (p) {
                p.classList.toggle("active", p.dataset.fa === fileAlgo);
            });
        };
    });

    function switchFileMode(nextMode) {
        fileMode = nextMode === "decrypt" ? "decrypt" : "encrypt";
        const isEnc = fileMode === "encrypt";
        document.getElementById("fModeEnc").classList.toggle("active", isEnc);
        document.getElementById("fModeDec").classList.toggle("active", !isEnc);

        document.getElementById("fAlgoGroup").classList.toggle("hidden", !isEnc);
        document.getElementById("fKeyLabel").textContent = isEnc
            ? "كلمة مرور التشفير"
            : "كلمة مرور فك التشفير";
        document.getElementById("fKeyHint").textContent = isEnc
            ? "يُحفظ اسم الملف وامتداده الأصلي داخل ملف .zoro المشفر بشكل آمن."
            : "أدخل كلمة المرور الصحيحة لاسترجاع الملف الأصلي باسمه وامتداده.";
        document.getElementById("fDropTitle").textContent = isEnc
            ? "اسحب الصورة أو الملف وأفلته هنا، أو اضغط للاختيار"
            : "اسحب الملف المشفر (.zoro) وأفلته هنا، أو اضغط للاختيار";
        document.getElementById("fSubmitBtn").textContent = isEnc
            ? "تشفير الملف"
            : "فك تشفير الملف";
        hideErr();
    }

    document.getElementById("fModeEnc").onclick = function () {
        switchFileMode("encrypt");
    };
    document.getElementById("fModeDec").onclick = function () {
        switchFileMode("decrypt");
    };

    document.getElementById("fSubmitBtn").onclick = async function () {
        hideErr();
        if (!pickedFile) {
            showErr("يرجى اختيار ملف أو صورة أولاً.");
            return;
        }
        const pwd = document.getElementById("fPasswordInput").value;
        if (!pwd.trim()) {
            showErr("يرجى إدخال كلمة المرور.");
            return;
        }

        const btn = this;
        const origLabel = btn.textContent;
        btn.disabled = true;
        btn.textContent = "جاري المعالجة...";

        const fd = new FormData();
        fd.append("file", pickedFile);
        fd.append("key", pwd);
        if (fileMode === "encrypt") {
            fd.append("algorithm", fileAlgo);
        }

        try {
            const endpoint =
                fileMode === "encrypt" ? "/api/file/encrypt" : "/api/file/decrypt";
            const res = await fetch(endpoint, { method: "POST", body: fd });

            if (!res.ok) {
                let errText = "فشلت العملية، تأكد من الملف وكلمة المرور.";
                try {
                    const errData = await res.json();
                    if (errData && errData.error) errText = String(errData.error);
                } catch (_) { }
                showErr(errText);
                return;
            }

            const blob = await res.blob();
            const rawHeaderName = res.headers.get("X-Output-Filename");
            let outName =
                fileMode === "encrypt"
                    ? pickedFile.name + ".zoro"
                    : "restored_file";
            if (rawHeaderName) {
                try {
                    outName = decodeURIComponent(rawHeaderName);
                } catch (_) {
                    outName = rawHeaderName;
                }
            }
            const outMime = res.headers.get("X-Output-Mime") || blob.type || "";

            lastBlob = blob;
            lastOutputName = outName;
            revokeUrl(lastObjectUrl);
            lastObjectUrl = URL.createObjectURL(blob);

            document.getElementById("fEmptyOut").classList.add("hidden");
            document.getElementById("fResultCard").classList.remove("hidden");

            const isEnc = fileMode === "encrypt";
            const algoLabel = ALGO_LABELS[fileAlgo] || "AES-256-GCM";

            document.getElementById("fResTitle").textContent = isEnc
                ? "تم تشفير الملف بنجاح"
                : "تم فك تشفير الملف بنجاح";
            document.getElementById("fResBadge").textContent = isEnc
                ? algoLabel
                : "مسترجع";

            document.getElementById("fResSummary").innerHTML =
                "<div><span>اسم الملف:</span> <strong>" +
                esc(outName) +
                "</strong></div>" +
                (isEnc
                    ? "<div><span>الخوارزمية:</span> <strong>" +
                    esc(algoLabel) +
                    "</strong></div>"
                    : "") +
                "<div><span>الحجم:</span> <strong>" +
                esc(formatBytes(blob.size)) +
                "</strong></div>";

            const outImgWrap = document.getElementById("fOutImgWrap");
            const outImg = document.getElementById("fOutImg");
            if (!isEnc && outMime.indexOf("image/") === 0) {
                outImg.src = lastObjectUrl;
                outImgWrap.classList.remove("hidden");
            } else {
                outImgWrap.classList.add("hidden");
                outImg.removeAttribute("src");
            }

            document.getElementById("fSaveBtn").textContent =
                "تحميل الملف (" + outName + ")";
            showToast(isEnc ? "تم تشفير الملف بنجاح" : "تم فك تشفير الملف بنجاح");
        } catch (_) {
            showErr("تعذر الاتصال بالخادم.");
        } finally {
            btn.disabled = false;
            btn.textContent = origLabel;
        }
    };

    document.getElementById("fSaveBtn").onclick = async function () {
        if (!lastBlob || !lastOutputName) return;

        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: lastOutputName,
                });
                const writable = await handle.createWritable();
                await writable.write(lastBlob);
                await writable.close();
                showToast("تم حفظ الملف في المكان المحدد");
                return;
            } catch (err) {
                if (err && err.name === "AbortError") return;
            }
        }

        const dlUrl = lastObjectUrl || URL.createObjectURL(lastBlob);
        const a = document.createElement("a");
        a.href = dlUrl;
        a.download = lastOutputName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (!lastObjectUrl) {
            setTimeout(function () {
                revokeUrl(dlUrl);
            }, 1500);
        }
        showToast("بدأ تحميل الملف");
    };

    function showErr(msg) {
        const el = document.getElementById("fError");
        el.textContent = String(msg ?? "");
        el.classList.remove("hidden");
    }

    function hideErr() {
        document.getElementById("fError").classList.add("hidden");
    }
})();
