(function () {
    const mount = document.getElementById("scannerModuleMount");
    if (!mount) return;

    let scanFileObj = null;

    const COMMON_PASSWORDS = Object.freeze(
        new Set([
            "123456",
            "12345678",
            "123456789",
            "password",
            "qwerty",
            "admin",
            "letmein",
            "abc123",
            "111111",
        ])
    );

    const VERDICT_BADGE = Object.freeze({
        safe: "safe",
        suspicious: "warn",
    });

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
        '<div class="mode-switch-bar three-cols">' +
        '<button type="button" class="mode-pill active" data-scantab="url">فحص الروابط</button>' +
        '<button type="button" class="mode-pill" data-scantab="file">فحص الملفات</button>' +
        '<button type="button" class="mode-pill" data-scantab="password">قوة كلمة المرور</button>' +
        "</div>" +

        '<div id="scantab-url" class="scantab-pane">' +
        '<div class="panel max-narrow">' +
        "<h3>فحص الروابط (URL Security Scanner)</h3>" +
        '<p class="field-hint">يفحص HTTPS، مؤشرات التصيد، إعادة التوجيه، ويطبّق حماية SSRF ضد العناوين الداخلية.</p>' +
        '<div class="field-group">' +
        '<label class="field-label" for="scanUrlInput">الرابط المراد فحصه</label>' +
        '<input type="text" id="scanUrlInput" class="text-input" dir="ltr" spellcheck="false" placeholder="https://example.com">' +
        "</div>" +
        '<div id="scanUrlErr" class="inline-alert danger hidden"></div>' +
        '<button type="button" id="scanUrlBtn" class="primary-btn full-w">فحص الرابط الآن</button>' +
        '<div id="scanUrlOut" class="scan-report-box hidden"></div>' +
        "</div>" +
        "</div>" +

        '<div id="scantab-file" class="scantab-pane hidden">' +
        '<div class="panel max-narrow">' +
        "<h3>فحص الملفات (File Security Scanner)</h3>" +
        '<p class="field-hint">يفحص البصمة SHA-256، الحجم، وتطابق الامتداد مع البنية الحقيقية للملف.</p>' +
        '<div class="field-group">' +
        '<input type="file" id="scanFileInput" class="hidden">' +
        '<button type="button" id="scanFilePickBtn" class="ghost-btn wide-pick-btn">اختيار ملف للفحص</button>' +
        '<div id="scanFileName" class="field-hint">لم يتم اختيار ملف بعد.</div>' +
        "</div>" +
        '<div class="field-group">' +
        '<label class="check-item">' +
        '<input type="checkbox" id="scanAllowExt">' +
        "<span>أوافق على إمكانية مشاركة الملف مع خدمات فحص خارجية إذا تم تفعيلها مستقبلاً</span>" +
        "</label>" +
        "</div>" +
        '<div id="scanFileErr" class="inline-alert danger hidden"></div>' +
        '<button type="button" id="scanFileBtn" class="primary-btn full-w">فحص الملف الآن</button>' +
        '<div id="scanFileOut" class="scan-report-box hidden"></div>' +
        "</div>" +
        "</div>" +

        '<div id="scantab-password" class="scantab-pane hidden">' +
        '<div class="panel max-narrow">' +
        "<h3>محلل قوة كلمات المرور (تحليل محلي فقط)</h3>" +
        '<p class="field-hint">يتم التحليل بالكامل داخل متصفحك ولا يتم إرسال كلمة المرور إلى أي خادم أو جهة خارجية.</p>' +
        '<div class="field-group">' +
        '<label class="field-label" for="pwAnalyzeInput">أدخل كلمة المرور لتحليلها</label>' +
        '<input type="text" id="pwAnalyzeInput" class="text-input" dir="auto" spellcheck="false" autocomplete="new-password" placeholder="اكتب كلمة المرور هنا...">' +
        "</div>" +
        '<div id="pwAnalyzeBox" class="scan-report-box">' +
        '<div class="row-between"><span>التقييم:</span><strong id="pwVerdictText" class="badge warn">بانتظار الإدخال</strong></div>' +
        '<ul id="pwDetailsList" class="report-list"><li>أدخل كلمة مرور لعرض الطول، التنوع، والأنماط.</li></ul>' +
        "</div>" +
        "</div>" +
        "</div>";

    document.querySelectorAll("[data-scantab]").forEach(function (btn) {
        btn.onclick = function () {
            const tab = btn.dataset.scantab;
            document.querySelectorAll("[data-scantab]").forEach(function (b) {
                b.classList.toggle("active", b.dataset.scantab === tab);
            });
            document.querySelectorAll(".scantab-pane").forEach(function (pane) {
                pane.classList.toggle("hidden", pane.id !== "scantab-" + tab);
            });
        };
    });

    document.getElementById("scanUrlBtn").onclick = async function () {
        const errEl = document.getElementById("scanUrlErr");
        const outEl = document.getElementById("scanUrlOut");
        errEl.classList.add("hidden");
        outEl.classList.add("hidden");

        const urlVal = document.getElementById("scanUrlInput").value.trim();
        if (!urlVal) {
            errEl.textContent = "يرجى إدخال رابط أولاً.";
            errEl.classList.remove("hidden");
            return;
        }

        const btn = this;
        const prev = btn.textContent;
        btn.disabled = true;
        btn.textContent = "جاري الفحص...";

        try {
            const res = await fetch("/api/scan/url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: urlVal }),
            });
            const payload = await res.json();
            if (!res.ok || !payload.success) {
                errEl.textContent = payload.error || "تعذر فحص الرابط.";
                errEl.classList.remove("hidden");
                return;
            }

            const r = payload.report || {};
            const badgeCls = VERDICT_BADGE[r.verdict] || "danger";
            const reasonsHtml = (r.reasons || [])
                .map(function (item) {
                    return "<li>" + esc(item) + "</li>";
                })
                .join("");

            outEl.innerHTML =
                '<div class="row-between"><span>النتيجة:</span><span class="badge ' +
                badgeCls +
                '">' +
                esc(r.verdict_ar) +
                "</span></div>" +
                '<div class="kv-line"><span>النطاق / الوجهة النهائية:</span> <strong dir="ltr">' +
                esc(r.final_url) +
                "</strong></div>" +
                '<div class="kv-line"><span>العناوين المكتشفة:</span> <strong dir="ltr">' +
                esc((r.resolved_ips || []).join(", ") || "-") +
                "</strong></div>" +
                '<ul class="report-list">' +
                reasonsHtml +
                "</ul>" +
                '<p class="field-hint">' +
                esc(r.disclaimer) +
                "</p>";
            outEl.classList.remove("hidden");
        } catch (_) {
            errEl.textContent = "تعذر الاتصال بالخادم.";
            errEl.classList.remove("hidden");
        } finally {
            btn.disabled = false;
            btn.textContent = prev;
        }
    };

    const scanFileInput = document.getElementById("scanFileInput");
    document.getElementById("scanFilePickBtn").onclick = function () {
        scanFileInput.click();
    };
    scanFileInput.onchange = function () {
        if (scanFileInput.files && scanFileInput.files[0]) {
            scanFileObj = scanFileInput.files[0];
            document.getElementById("scanFileName").textContent =
                "الملف: " + scanFileObj.name;
        }
    };

    document.getElementById("scanFileBtn").onclick = async function () {
        const errEl = document.getElementById("scanFileErr");
        const outEl = document.getElementById("scanFileOut");
        errEl.classList.add("hidden");
        outEl.classList.add("hidden");

        if (!scanFileObj) {
            errEl.textContent = "يرجى اختيار ملف أولاً.";
            errEl.classList.remove("hidden");
            return;
        }

        const btn = this;
        const prev = btn.textContent;
        btn.disabled = true;
        btn.textContent = "جاري التحليل...";

        const fd = new FormData();
        fd.append("file", scanFileObj);
        fd.append(
            "allow_external",
            document.getElementById("scanAllowExt").checked ? "1" : "0"
        );

        try {
            const res = await fetch("/api/scan/file", { method: "POST", body: fd });
            const payload = await res.json();
            if (!res.ok || !payload.success) {
                errEl.textContent = payload.error || "تعذر فحص الملف.";
                errEl.classList.remove("hidden");
                return;
            }

            const r = payload.report || {};
            const badgeCls = VERDICT_BADGE[r.verdict] || "danger";
            const findingsHtml = (r.findings || [])
                .map(function (item) {
                    return "<li>" + esc(item) + "</li>";
                })
                .join("");

            outEl.innerHTML =
                '<div class="row-between"><span>الحالة:</span><span class="badge ' +
                badgeCls +
                '">' +
                esc(r.verdict_ar) +
                "</span></div>" +
                '<div class="kv-line"><span>الحجم:</span> <strong>' +
                Number(r.size_bytes || 0).toLocaleString() +
                " بايت</strong></div>" +
                '<div class="kv-line"><span>SHA-256:</span></div>' +
                '<div class="mono-box" dir="ltr">' +
                esc(r.sha256) +
                "</div>" +
                '<ul class="report-list">' +
                findingsHtml +
                "</ul>" +
                '<p class="field-hint">' +
                esc(r.external_note) +
                " • " +
                esc(r.disclaimer) +
                "</p>";
            outEl.classList.remove("hidden");
        } catch (_) {
            errEl.textContent = "تعذر الاتصال بالخادم.";
            errEl.classList.remove("hidden");
        } finally {
            btn.disabled = false;
            btn.textContent = prev;
        }
    };

    document.getElementById("pwAnalyzeInput").addEventListener("input", function () {
        const pw = this.value;
        const badgeEl = document.getElementById("pwVerdictText");
        const listEl = document.getElementById("pwDetailsList");

        if (!pw) {
            badgeEl.textContent = "بانتظار الإدخال";
            badgeEl.className = "badge warn";
            listEl.innerHTML =
                "<li>أدخل كلمة مرور لعرض الطول، التنوع، والأنماط.</li>";
            return;
        }

        const hasUpper = /[A-Z]/.test(pw);
        const hasLower = /[a-z]/.test(pw);
        const hasDigit = /\d/.test(pw);
        const hasSymbol = /[^A-Za-z0-9]/.test(pw);
        const hasRepeat = /(.)\1{2,}/.test(pw);
        const isCommon = COMMON_PASSWORDS.has(pw.toLowerCase());

        let score = 0;
        if (pw.length >= 8) score += 20;
        if (pw.length >= 12) score += 20;
        if (pw.length >= 16) score += 15;
        if (hasUpper) score += 10;
        if (hasLower) score += 10;
        if (hasDigit) score += 10;
        if (hasSymbol) score += 15;
        if (hasRepeat) score -= 20;
        if (isCommon) score = 5;
        score = Math.max(0, Math.min(100, score));

        let label = "ضعيفة جداً";
        let cls = "danger";
        let crackEst = "فوري إلى ثوانٍ قليلة";
        if (score >= 80) {
            label = "قوية جداً";
            cls = "safe";
            crackEst = "صعبة جداً (تقدير طويل نظرياً بافتراض عدم تسربها)";
        } else if (score >= 55) {
            label = "متوسطة / جيدة";
            cls = "warn";
            crackEst = "من ساعات إلى أيام حسب سرعة المحاولة";
        } else if (score >= 30) {
            label = "ضعيفة";
            cls = "danger";
            crackEst = "دقائق إلى ساعات";
        }

        badgeEl.textContent = label + " (" + score + "/100)";
        badgeEl.className = "badge " + cls;

        const tips = [];
        if (pw.length < 12) tips.push("ارفع الطول إلى 12 حرفاً أو أكثر.");
        if (!hasUpper || !hasLower) tips.push("اجمع بين الأحرف الكبيرة والصغيرة.");
        if (!hasDigit || !hasSymbol) tips.push("أضف أرقاماً ورموزاً خاصة.");
        if (hasRepeat) tips.push("تجنب تكرار نفس الحرف عدة مرات متتالية.");
        if (isCommon) tips.push("تجنب كلمات المرور الشائعة والمعروفة.");
        if (!tips.length) {
            tips.push("التركيبة متوازنة؛ احرص على عدم تكرارها في أكثر من حساب.");
        }

        listEl.innerHTML =
            "<li>الطول: <strong>" +
            pw.length +
            "</strong> حرفاً</li>" +
            "<li>التنوع: حروف كبيرة (" +
            (hasUpper ? "نعم" : "لا") +
            ")، صغيرة (" +
            (hasLower ? "نعم" : "لا") +
            ")، أرقام (" +
            (hasDigit ? "نعم" : "لا") +
            ")، رموز (" +
            (hasSymbol ? "نعم" : "لا") +
            ")</li>" +
            "<li>تقدير صعوبة التخمين: <strong>" +
            esc(crackEst) +
            "</strong></li>" +
            "<li>توصية التحسين: " +
            esc(tips.join(" ")) +
            "</li>";
    });
})();
