(function () {
    const mount = document.getElementById("hashingModuleMount");
    if (!mount) return;

    let hashFileObj = null;
    let verifyFileObj = null;

    function constantTimeEqual(a, b) {
        if (typeof a !== "string" || typeof b !== "string") return false;
        if (a.length !== b.length) return false;
        let diff = 0;
        for (let i = 0; i < a.length; i++) {
            diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return diff === 0;
    }

    mount.className = "tool-workspace";
    mount.innerHTML =
        '<div class="panel info-banner">' +
        '<p class="banner-lead">البصمة الرقمية هي قيمة رياضية فريدة المظهر تُولَّد من البيانات باستخدام خوارزمية تجزئة، وتساعد في التحقق مما إذا كان الملف أو الرسالة قد تعرّض للتعديل.</p>' +
        '<p class="banner-note">تنبيه تعليمي: التجزئة (Hashing) عملية <strong>باتجاه واحد (One-Way)</strong> وليست تشفيراً؛ لا يمكن فك البصمة أو عكسها لاسترجاع النص أو الملف الأصلي.</p>' +
        "</div>" +

        '<div class="mode-switch-bar four-cols">' +
        '<button type="button" class="mode-pill active" data-htab="text">بصمة نص</button>' +
        '<button type="button" class="mode-pill" data-htab="file">بصمة ملف</button>' +
        '<button type="button" class="mode-pill" data-htab="compare">مقارنة بصمتين</button>' +
        '<button type="button" class="mode-pill" data-htab="verify">التحقق من ملف</button>' +
        "</div>" +

        '<div id="htab-text" class="htab-pane">' +
        '<div class="split-grid">' +
        '<div class="panel">' +
        '<label class="field-label" for="hTextAlgo">خوارزمية التجزئة</label>' +
        '<select id="hTextAlgo" class="select-input">' +
        '<option value="sha256">SHA-256</option>' +
        '<option value="sha512">SHA-512</option>' +
        '<option value="sha3-256">SHA-3 (SHA3-256)</option>' +
        '<option value="sha3-512">SHA-3 (SHA3-512)</option>' +
        "</select>" +
        '<div class="field-group">' +
        '<label class="field-label" for="hTextInput">النص</label>' +
        '<textarea id="hTextInput" class="text-input editor-area" rows="5" dir="auto" spellcheck="false" placeholder="أدخل النص لحساب بصمته الرقمية..."></textarea>' +
        "</div>" +
        '<div id="hTextErr" class="inline-alert danger hidden"></div>' +
        '<button type="button" id="hTextRunBtn" class="primary-btn full-w">توليد البصمة الرقمية</button>' +
        "</div>" +
        '<div class="panel">' +
        "<h3>البصمة الناتجة</h3>" +
        '<p class="field-hint">تتغير البصمة بالكامل إذا تغيّر حرف واحد فقط في النص.</p>' +
        '<div id="hTextOutBox" class="hash-out-box hidden">' +
        '<div class="row-between"><span id="hTextAlgoBadge" class="badge info">SHA-256</span><button type="button" id="hTextCopyBtn" class="ghost-btn">نسخ</button></div>' +
        '<div id="hTextDigest" class="mono-box" dir="ltr"></div>' +
        "</div>" +
        '<div id="hTextEmpty" class="empty-inline">لم يتم توليد بصمة بعد.</div>' +
        "</div>" +
        "</div>" +
        "</div>" +

        '<div id="htab-file" class="htab-pane hidden">' +
        '<div class="split-grid">' +
        '<div class="panel">' +
        '<label class="field-label" for="hFileAlgo">خوارزمية التجزئة</label>' +
        '<select id="hFileAlgo" class="select-input">' +
        '<option value="sha256">SHA-256</option>' +
        '<option value="sha512">SHA-512</option>' +
        '<option value="sha3-256">SHA-3 (SHA3-256)</option>' +
        '<option value="sha3-512">SHA-3 (SHA3-512)</option>' +
        "</select>" +
        '<div class="field-group">' +
        '<input type="file" id="hFileInput" class="hidden">' +
        '<button type="button" id="hFilePickBtn" class="ghost-btn wide-pick-btn">اختيار ملف (حتى 100 MB)</button>' +
        '<div id="hFilePickedName" class="field-hint">لم يتم اختيار ملف بعد.</div>' +
        "</div>" +
        '<div id="hFileErr" class="inline-alert danger hidden"></div>' +
        '<button type="button" id="hFileRunBtn" class="primary-btn full-w">حساب بصمة الملف</button>' +
        "</div>" +
        '<div class="panel">' +
        "<h3>بصمة الملف</h3>" +
        '<p class="field-hint">يمكنك استخدام هذه البصمة لاحقاً للتأكد من أن الملف لم يتغير أو يتلف.</p>' +
        '<div id="hFileOutBox" class="hash-out-box hidden">' +
        '<div class="row-between"><span id="hFileMetaBadge" class="badge safe">-</span><button type="button" id="hFileCopyBtn" class="ghost-btn">نسخ</button></div>' +
        '<div id="hFileDigest" class="mono-box" dir="ltr"></div>' +
        "</div>" +
        '<div id="hFileEmpty" class="empty-inline">اختر ملفاً واضغط حساب بصمة الملف.</div>' +
        "</div>" +
        "</div>" +
        "</div>" +

        '<div id="htab-compare" class="htab-pane hidden">' +
        '<div class="panel max-narrow">' +
        "<h3>مقارنة بصمتين رقميتين</h3>" +
        '<p class="field-hint">قارن بين بصمتين للتحقق من تطابقهما (تتم المقارنة بحساسية كاملة للأحرف).</p>' +
        '<div class="field-group">' +
        '<label class="field-label" for="hCmpA">البصمة الأولى</label>' +
        '<input type="text" id="hCmpA" class="text-input code-area" dir="ltr" spellcheck="false" placeholder="ألصق البصمة الأولى هنا...">' +
        "</div>" +
        '<div class="field-group">' +
        '<label class="field-label" for="hCmpB">البصمة الثانية</label>' +
        '<input type="text" id="hCmpB" class="text-input code-area" dir="ltr" spellcheck="false" placeholder="ألصق البصمة الثانية هنا...">' +
        "</div>" +
        '<button type="button" id="hCmpBtn" class="primary-btn full-w">مقارنة البصمتين</button>' +
        '<div id="hCmpResult" class="inline-alert hidden"></div>' +
        "</div>" +
        "</div>" +

        '<div id="htab-verify" class="htab-pane hidden">' +
        '<div class="panel max-narrow">' +
        "<h3>التحقق من سلامة ملف (File Integrity)</h3>" +
        '<p class="field-hint">ارفع الملف وأدخل البصمة المتوقعة للتحقق مما إذا كان الملف سليماً أم معدّلاً.</p>' +
        '<div class="field-group">' +
        '<label class="field-label" for="hVerAlgo">خوارزمية التجزئة</label>' +
        '<select id="hVerAlgo" class="select-input">' +
        '<option value="sha256">SHA-256</option>' +
        '<option value="sha512">SHA-512</option>' +
        '<option value="sha3-256">SHA-3 (SHA3-256)</option>' +
        '<option value="sha3-512">SHA-3 (SHA3-512)</option>' +
        "</select>" +
        "</div>" +
        '<div class="field-group">' +
        '<input type="file" id="hVerFileInput" class="hidden">' +
        '<button type="button" id="hVerPickBtn" class="ghost-btn wide-pick-btn">اختيار الملف للتحقق</button>' +
        '<div id="hVerFileName" class="field-hint">لم يتم اختيار ملف بعد.</div>' +
        "</div>" +
        '<div class="field-group">' +
        '<label class="field-label" for="hVerExpected">البصمة المتوقعة</label>' +
        '<input type="text" id="hVerExpected" class="text-input code-area" dir="ltr" spellcheck="false" placeholder="أدخل البصمة الصحيحة المتوقعة...">' +
        "</div>" +
        '<div id="hVerErr" class="inline-alert danger hidden"></div>' +
        '<button type="button" id="hVerBtn" class="primary-btn full-w">التحقق من الملف</button>' +
        '<div id="hVerResult" class="inline-alert hidden"></div>' +
        "</div>" +
        "</div>";

    document.querySelectorAll("[data-htab]").forEach(function (btn) {
        btn.onclick = function () {
            const tab = btn.dataset.htab;
            document.querySelectorAll("[data-htab]").forEach(function (b) {
                b.classList.toggle("active", b.dataset.htab === tab);
            });
            document.querySelectorAll(".htab-pane").forEach(function (pane) {
                pane.classList.toggle("hidden", pane.id !== "htab-" + tab);
            });
        };
    });

    document.getElementById("hTextRunBtn").onclick = async function () {
        const errEl = document.getElementById("hTextErr");
        errEl.classList.add("hidden");
        const text = document.getElementById("hTextInput").value;
        const algo = document.getElementById("hTextAlgo").value;
        if (!text.trim()) {
            errEl.textContent = "يرجى إدخال نص أولاً.";
            errEl.classList.remove("hidden");
            return;
        }

        const btn = this;
        const prev = btn.textContent;
        btn.disabled = true;
        btn.textContent = "جاري التوليد...";

        try {
            const res = await fetch("/api/hash/text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text, algorithm: algo }),
            });
            const payload = await res.json();
            if (!res.ok || !payload.success) {
                errEl.textContent = payload.error || "تعذر توليد البصمة.";
                errEl.classList.remove("hidden");
                return;
            }
            document.getElementById("hTextEmpty").classList.add("hidden");
            document.getElementById("hTextOutBox").classList.remove("hidden");
            document.getElementById("hTextAlgoBadge").textContent = String(
                payload.algorithm || algo.toUpperCase()
            );
            document.getElementById("hTextDigest").textContent = String(
                payload.digest || ""
            );
            showToast("تم توليد البصمة الرقمية");
        } catch (_) {
            errEl.textContent = "تعذر الاتصال بالخادم.";
            errEl.classList.remove("hidden");
        } finally {
            btn.disabled = false;
            btn.textContent = prev;
        }
    };

    document.getElementById("hTextCopyBtn").onclick = function () {
        copyText(document.getElementById("hTextDigest").textContent);
    };

    const hFileInput = document.getElementById("hFileInput");
    document.getElementById("hFilePickBtn").onclick = function () {
        hFileInput.click();
    };
    hFileInput.onchange = function () {
        if (hFileInput.files && hFileInput.files[0]) {
            hashFileObj = hFileInput.files[0];
            document.getElementById("hFilePickedName").textContent =
                "الملف: " + hashFileObj.name;
        }
    };

    document.getElementById("hFileRunBtn").onclick = async function () {
        const errEl = document.getElementById("hFileErr");
        errEl.classList.add("hidden");
        if (!hashFileObj) {
            errEl.textContent = "يرجى اختيار ملف أولاً.";
            errEl.classList.remove("hidden");
            return;
        }

        const btn = this;
        const prev = btn.textContent;
        btn.disabled = true;
        btn.textContent = "جاري الحساب...";

        const fd = new FormData();
        fd.append("file", hashFileObj);
        fd.append("algorithm", document.getElementById("hFileAlgo").value);

        try {
            const res = await fetch("/api/hash/file", { method: "POST", body: fd });
            const payload = await res.json();
            if (!res.ok || !payload.success) {
                errEl.textContent = payload.error || "تعذر حساب بصمة الملف.";
                errEl.classList.remove("hidden");
                return;
            }
            document.getElementById("hFileEmpty").classList.add("hidden");
            document.getElementById("hFileOutBox").classList.remove("hidden");
            document.getElementById("hFileMetaBadge").textContent =
                String(payload.algorithm || "") +
                " • " +
                String(payload.filename || hashFileObj.name);
            document.getElementById("hFileDigest").textContent = String(
                payload.digest || ""
            );
            showToast("تم حساب بصمة الملف");
        } catch (_) {
            errEl.textContent = "تعذر الاتصال بالخادم.";
            errEl.classList.remove("hidden");
        } finally {
            btn.disabled = false;
            btn.textContent = prev;
        }
    };

    document.getElementById("hFileCopyBtn").onclick = function () {
        copyText(document.getElementById("hFileDigest").textContent);
    };

    document.getElementById("hCmpBtn").onclick = function () {
        const a = document.getElementById("hCmpA").value.trim().toLowerCase();
        const b = document.getElementById("hCmpB").value.trim().toLowerCase();
        const out = document.getElementById("hCmpResult");
        out.classList.remove("hidden", "danger", "ok-alert");

        if (!a || !b) {
            out.textContent = "يرجى إدخال البصمتين معاً للمقارنة.";
            out.classList.add("danger");
            return;
        }
        if (constantTimeEqual(a, b)) {
            out.textContent =
                "متطابقتان تماماً: البصمتان متماثلتان ولم يطرأ أي تغيير.";
            out.classList.add("ok-alert");
        } else {
            out.textContent = "غير متطابقتين: يوجد اختلاف بين البصمتين.";
            out.classList.add("danger");
        }
    };

    const hVerFileInput = document.getElementById("hVerFileInput");
    document.getElementById("hVerPickBtn").onclick = function () {
        hVerFileInput.click();
    };
    hVerFileInput.onchange = function () {
        if (hVerFileInput.files && hVerFileInput.files[0]) {
            verifyFileObj = hVerFileInput.files[0];
            document.getElementById("hVerFileName").textContent =
                "الملف: " + verifyFileObj.name;
        }
    };

    document.getElementById("hVerBtn").onclick = async function () {
        const errEl = document.getElementById("hVerErr");
        const resEl = document.getElementById("hVerResult");
        errEl.classList.add("hidden");
        resEl.classList.add("hidden", "danger", "ok-alert");

        const expected = document
            .getElementById("hVerExpected")
            .value.trim()
            .toLowerCase();
        if (!verifyFileObj) {
            errEl.textContent = "يرجى اختيار الملف أولاً.";
            errEl.classList.remove("hidden");
            return;
        }
        if (!expected) {
            errEl.textContent = "يرجى إدخال البصمة المتوقعة.";
            errEl.classList.remove("hidden");
            return;
        }

        const btn = this;
        const prev = btn.textContent;
        btn.disabled = true;
        btn.textContent = "جاري التحقق...";

        const fd = new FormData();
        fd.append("file", verifyFileObj);
        fd.append("algorithm", document.getElementById("hVerAlgo").value);

        try {
            const res = await fetch("/api/hash/file", { method: "POST", body: fd });
            const payload = await res.json();
            if (!res.ok || !payload.success) {
                errEl.textContent = payload.error || "تعذر فحص الملف.";
                errEl.classList.remove("hidden");
                return;
            }
            const actual = String(payload.digest || "").toLowerCase();
            if (constantTimeEqual(actual, expected)) {
                resEl.textContent =
                    "الملف سليم ومتطابق مع البصمة المتوقعة (" +
                    String(payload.algorithm || "") +
                    ").";
                resEl.classList.add("ok-alert");
            } else {
                resEl.textContent =
                    "تحذير: بصمة الملف لا تطابق البصمة المتوقعة؛ قد يكون الملف معدّلاً أو مختلفاً.";
                resEl.classList.add("danger");
            }
            resEl.classList.remove("hidden");
        } catch (_) {
            errEl.textContent = "تعذر الاتصال بالخادم.";
            errEl.classList.remove("hidden");
        } finally {
            btn.disabled = false;
            btn.textContent = prev;
        }
    };
})();
