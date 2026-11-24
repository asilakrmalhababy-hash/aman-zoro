(function () {
    const mount = document.getElementById("guideModuleMount");
    if (!mount) return;

    const ESC_MAP = Object.freeze({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" });
    const ESC_RE = /[&<>"']/g;
    function esc(s) {
        return String(s == null ? "" : s).replace(ESC_RE, function (ch) { return ESC_MAP[ch]; });
    }

    const SERVICES_GUIDE = Object.freeze([
        Object.freeze({
            title: "تشفير وفك تشفير النصوص",
            badge: "سرية الرسائل والبيانات",
            cls: "safe",
            desc: "تحويل النصوص العربية والإنجليزية إلى صيغة مشفرة لا يمكن قراءتها بدون المفتاح أو كلمة المرور الصحيحة، مع دعم خوارزميات حديثة (AES-256-GCM و ChaCha20-Poly1305 و RSA-2048) وخوارزميات تعليمية.",
            benefit: "حماية الرسائل الحساسة والملاحظات والأكواد عند الحفظ أو المشاركة عبر قنوات غير موثوقة.",
            actionLabel: "افتح تشفير النصوص",
            actionPage: "text"
        }),
        Object.freeze({
            title: "إخفاء النصوص داخل الصور (Steganography)",
            badge: "دمج وتشفير بصري",
            cls: "safe",
            desc: "تشفير الرسائل النصية عبر AES-256-GCM ثم دمجها داخل وحدات البكسل في الصور بصيغة PNG دون تغيير مظهر الصورة المرئي، واستخراجها وفك تشفيرها بكلمة المرور.",
            benefit: "نقل الملاحظات والبيانات السرية داخل صور عادية مع طبقة تشفير مزدوجة تمنع الاكتشاف أو القراءة.",
            actionLabel: "افتح إخفاء النصوص",
            actionPage: "text"
        }),
        Object.freeze({
            title: "تشفير الصور والملفات (حتى 100 MB)",
            badge: "حماية الملفات والوسائط",
            cls: "safe",
            desc: "تشفير الصور والمستندات والأرشيفات والملفات الصوتية إلى ملف محمي بامتداد .zoro مع الحفاظ على اسم الملف الأصلي وامتداده واسترجاعه دون تلف أو فقدان.",
            benefit: "تأمين الصور الشخصية والملفات المهمة على الجهاز أو الفلاشة أو السحابة بكلمة مرور قوية.",
            actionLabel: "افتح تشفير الملفات",
            actionPage: "files"
        }),
        Object.freeze({
            title: "الفاحص الأمني (URL • File • Password)",
            badge: "كشف المخاطر والتحليل",
            cls: "info",
            desc: "فحص الروابط مع حماية SSRF لمنع الوصول للعناوين الداخلية، وفحص بنية الملفات وبصمتها، وتحليل قوة كلمات المرور محلياً دون إرسالها خارج جهازك.",
            benefit: "تقليل مخاطر الروابط المشبوهة والتصيد والملفات المتنكرة واختيار كلمات مرور أقوى.",
            actionLabel: "افتح الفاحص الأمني",
            actionPage: "scanner"
        }),
        Object.freeze({
            title: "البصمة الرقمية (Hashing)",
            badge: "سلامة البيانات والتحقق",
            cls: "safe",
            desc: "توليد بصمات رياضية ثابتة الطول باستخدام SHA-256 و SHA-512 و SHA-3 للنصوص والملفات، مع مقارنة بصمتين والتحقق من سلامة ملف.",
            benefit: "التأكد من أن الملف أو النص لم يتغير أو يتعرض للتعديل أو التلف أثناء النقل أو التخزين.",
            actionLabel: "افتح البصمة الرقمية",
            actionPage: "hashing"
        }),
        Object.freeze({
            title: "مسار تعلم الأمن السيبراني والأدوات",
            badge: "تعليم وأدوات يومية",
            cls: "info",
            desc: "خريطة طريق متدرجة لتعلم الأمن السيبراني بالإضافة إلى أدوات مساعدة سريعة لتوليد كلمات المرور والمفاتيح ورموز QR وفحص معلومات الملفات.",
            benefit: "توفير بيئة عملية واحدة تجمع بين التطبيق الأمني الفعلي وبناء الأساس المعرفي.",
            actionLabel: "استعرض مسار التعلم",
            actionPage: "roadmap"
        })
    ]);

    const ALGOS_ENCYCLOPEDIA = [
        {
            name: "AES (AES-256-GCM)",
            category: "symmetric",
            catLabel: "تشفير متماثل حديث",
            secLevel: "آمن جداً (معيار عالمي)",
            secCls: "safe",
            what: "معيار التشفير المتقدم (Advanced Encryption Standard) بمفتاح 256 بت ووضع GCM الذي يجمع بين التشفير والتحقق من سلامة البيانات.",
            how: "يعالج البيانات في كتل عبر جولات رياضية من الإبدال والخلط والجمع مع مفتاح سري و Nonce، ويولّد وسم مصادقة (Tag) يكشف أي تلاعب.",
            where: "تشفير الملفات، قواعد البيانات، الاتصالات الآمنة، وحماية البيانات الحساسة.",
            prosCons: "مزاياه: أمان عالٍ جداً وسرعة ممتازة مع دعم عتادي واسع. عيوبه: يتطلب إدارة آمنة للمفتاح وعدم تكرار Nonce بنفس المفتاح.",
            example: "تشفير ملف أو رسالة بكلمة مرور قوية عبر AES-256-GCM؛ أي تعديل في النص المشفر أو خطأ في المفتاح يرفض فك التشفير فوراً."
        },
        {
            name: "ChaCha20-Poly1305",
            category: "symmetric",
            catLabel: "تشفير متماثل حديث",
            secLevel: "آمن جداً وسريع",
            secCls: "safe",
            what: "خوارزمية تشفير تدفقي حديثة (ChaCha20) مدمجة مع مصادقة Poly1305 لضمان السرية وسلامة الرسالة.",
            how: "تولّد سلسلة مفاتيح شبه عشوائية انطلاقاً من المفتاح و Nonce والعداد، وتدمجها مع البيانات ثم تحسب وسم Poly1305.",
            where: "الأجهزة المحمولة، المتصفحات، بروتوكولات الشبكة الحديثة، وتشفير البيانات سريع الأداء.",
            prosCons: "مزاياه: أداء سريع جداً حتى بدون تسريع عتادي خاص لـ AES ومقاومة جيدة لهجمات التوقيت. عيوبه: نفس متطلبات أمان المفاتيح و Nonce.",
            example: "تشفير نص أو ملف بسرعة عالية مع تحقق مدمج من عدم التعديل."
        },
        {
            name: "RSA (RSA-2048)",
            category: "asymmetric",
            catLabel: "تشفير غير متماثل",
            secLevel: "آمن للرسائل القصيرة والمفاتيح",
            secCls: "safe",
            what: "نظام تشفير يعتمد زوجاً من المفاتيح مرتبطين رياضياً: مفتاح عام (Public Key) للتشفير، ومفتاح خاص (Private Key) لفك التشفير.",
            how: "يعتمد على صعوبة تحليل الأعداد الأولية الكبيرة؛ ما يُشفر بالمفتاح العام لا يُفك إلا بالمفتاح الخاص المقابل له.",
            where: "التوقيع الرقمي، تبادل المفاتيح، وتشفير الرسائل القصيرة.",
            prosCons: "مزاياه: لا حاجة لمشاركة مفتاح سري مشترك مسبقاً للتشفير. عيوبه: أبطأ من التشفير المتماثل ولا يُستخدم مباشرة لتشفير الملفات الكبيرة.",
            example: "توليد زوج مفاتيح RSA-2048، تشفير رسالة قصيرة بالمفتاح العام، وفكها بالمفتاح الخاص."
        },
        {
            name: "Caesar Cipher",
            category: "classical",
            catLabel: "تشفير كلاسيكي (تعليمي)",
            secLevel: "غير آمن — تعليمي فقط",
            secCls: "danger",
            what: "أقدم وأبسط شفرات الإزاحة الكلاسيكية التي تحرك كل حرف بعدد ثابت من المواضع في الأبجدية.",
            how: "يُستبدل كل حرف بحرف يسبقه أو يليه بمقدار رقم الإزاحة (Key).",
            where: "شرح مبادئ التشفير للمبتدئين فقط.",
            prosCons: "مزاياه: سهل الفهم والتطبيق. عيوبه: ضعيف جداً ويمكن كسره بتجربة الاحتمالات القليلة أو تحليل التكرار.",
            example: "إزاحة بمقدار 3 تحوّل الحرف A إلى D وهكذا."
        },
        {
            name: "Vigenère Cipher",
            category: "classical",
            catLabel: "تشفير كلاسيكي (تعليمي)",
            secLevel: "غير آمن — تعليمي فقط",
            secCls: "danger",
            what: "شفرة إبدال متعددة الأبجديات تستخدم كلمة مفتاحية تتكرر على طول النص.",
            how: "تُزاح أحرف النص بمقادير متغيرة حسب حروف الكلمة المفتاحية المتكررة.",
            where: "الأغراض التعليمية وفهم تطور التشفير الكلاسيكي.",
            prosCons: "مزاياه: أقوى من قيصر الكلاسيكية في الظاهر. عيوبه: لا توفر أماناً حديثاً وتُكسر بالتحليل الإحصائي عند تكرار المفتاح.",
            example: "استخدام كلمة مفتاحية مثل KEY لإزاحة أحرف الرسالة بشكل متناوب."
        },
        {
            name: "Playfair Cipher",
            category: "classical",
            catLabel: "تشفير كلاسيكي (تعليمي)",
            secLevel: "غير آمن — تعليمي فقط",
            secCls: "danger",
            what: "شفرة كلاسيكية تعتمد مصفوفة 5×5 من الحروف وتشفّر النص على شكل أزواج من الحروف (Digraphs).",
            how: "تُقسّم الرسالة إلى أزواج أحرف وتُطبّق قواعد الصف أو العمود أو المستطيل داخل المصفوفة.",
            where: "التدريب الأكاديمي وفهم التشفير الثنائي الكلاسيكي (للإنجليزية).",
            prosCons: "مزاياه: تشفير زوجي أكثر تعقيداً من الإزاحة الفردية. عيوبه: غير آمنة للبيانات الحقيقية ومحدودة بالأحرف.",
            example: "تشفير أزواج الحروف الإنجليزية باستخدام كلمة مفتاحية مثل MONARCHY."
        },
        {
            name: "Rail Fence Cipher",
            category: "transposition",
            catLabel: "تشفير تبديل (تعليمي)",
            secLevel: "غير آمن — تعليمي فقط",
            secCls: "danger",
            what: "خوارزمية تبديل (Transposition) تعيد ترتيب مواقع الأحرف دون تغيير الحروف نفسها.",
            how: "تُكتب الأحرف نزولاً وصعوداً على شكل مسار متعرج (Zig-Zag) عبر عدد محدد من الصفوف ثم تُقرأ صفاً تلو الآخر.",
            where: "توضيح مفهوم التبديل (Permutation) في دروس التشفير.",
            prosCons: "مزاياه: بسيطة وتوضح فكرة إعادة الترتيب. عيوبه: سهلة الكسر ولا تصلح للحماية الفعلية.",
            example: "توزيع النص على 3 صفوف متعرجة ثم قراءته سطراً بسطر."
        },
        {
            name: "DES",
            category: "legacy",
            catLabel: "خوارزمية قديمة (Legacy)",
            secLevel: "غير آمن — قديم ومكسور",
            secCls: "danger",
            what: "معيار تشفير متماثل قديم (Data Encryption Standard) يعتمد مفتاحاً فعالاً قصيراً (56 بت).",
            how: "يقسّم البيانات إلى كتل 64 بت ويمررها عبر 16 جولة من التبديل والخلط (Feistel Network).",
            where: "الأغراض التعليمية والتاريخية فقط.",
            prosCons: "مزاياه: مرجع تاريخي مهم لفهم تصميم كتل التشفير الحديثة. عيوبه: طول المفتاح أصبح غير كافٍ أمام قدرات الحوسبة الحديثة.",
            example: "تشفير نص تجريبي بمفتاح من 8 أحرف لفهم آلية التشفير الكتلي القديم."
        },
        {
            name: "SHA-256 / SHA-512 / SHA-3",
            category: "hashing",
            catLabel: "دوال تجزئة (Hashing)",
            secLevel: "معايير تجزئة حديثة للسلامة",
            secCls: "safe",
            what: "خوارزميات تجزئة تشفيرية (Cryptographic Hash Functions) تنتج بصمة ذات طول ثابت من أي حجم بيانات؛ تنتمي SHA-256 و SHA-512 لعائلة SHA-2 بينما تعتمد SHA-3 بنية Keccak مختلفة.",
            how: "تحوّل البيانات المدخلة عبر عمليات منطقية وجولات تكرارية إلى قيمة رقمية فريدة المظهر، بحيث يغيّر أي تعديل طفيف الناتج كلياً.",
            where: "التحقق من سلامة الملفات والبرمجيات، البصمات الرقمية، وبناء الأنظمة الأمنية.",
            prosCons: "مزاياه: سرعة وتفرد عالٍ ومقاومة قوية للتصادم عند استخدام معايير حديثة. عيوبه: عملية باتجاه واحد وليست تشفيراً ولا تحمي كلمة المرور وحدها دون Salt و KDF مناسب.",
            example: "حساب بصمة SHA-256 أو SHA-3 لملف قبل إرساله ثم مقارنتها بعد الاستلام للتأكد من سلامته."
        }
    ];

    const PREPARED_ALGOS = Object.freeze(ALGOS_ENCYCLOPEDIA.map(function (a) {
        return Object.freeze({
            category: a.category,
            searchBlob: (a.name + " " + a.catLabel + " " + a.what).toLowerCase(),
            html:
                '<article class="panel guide-card">' +
                '<div class="row-between" style="margin-bottom:8px;">' +
                '<h3>' + esc(a.name) + '</h3>' +
                '<span class="badge ' + esc(a.secCls) + '">' + esc(a.secLevel) + '</span>' +
                '</div>' +
                '<div class="enc-cat-sub">' + esc(a.catLabel) + '</div>' +
                '<div class="enc-points">' +
                '<p><strong>ما هي؟</strong> ' + esc(a.what) + '</p>' +
                '<p><strong>كيف تعمل؟</strong> ' + esc(a.how) + '</p>' +
                '<p><strong>أين تُستخدم؟</strong> ' + esc(a.where) + '</p>' +
                '<p><strong>المزايا والعيوب:</strong> ' + esc(a.prosCons) + '</p>' +
                '<div class="enc-example"><strong>مثال عملي:</strong> ' + esc(a.example) + '</div>' +
                '</div>' +
                '</article>'
        });
    }));

    let activeCat = "all";
    let searchQuery = "";

    mount.className = "tool-workspace";
    mount.innerHTML =
        '<div class="mode-switch-bar">' +
        '<button type="button" id="gTabServices" class="mode-pill active">شرح خدمات المنصة وفوائدها</button>' +
        '<button type="button" id="gTabEncyclopedia" class="mode-pill">موسوعة الخوارزميات</button>' +
        '</div>' +
        '<div id="guideServicesPane">' +
        '<div class="panel info-banner">' +
        '<h3>لماذا ZORO SECURITY؟</h3>' +
        '<p class="field-hint">صُممت المنصة لتجعل الأدوات الأمنية الأساسية واضحة وسهلة الاستخدام دون تعقيد، مع إبراز الفائدة العملية لكل أداة متى تحتاجها.</p>' +
        '</div>' +
        '<div id="servicesGuideGrid" class="guide-grid"></div>' +
        '</div>' +
        '<div id="guideEncPane" class="hidden">' +
        '<div class="panel enc-toolbar">' +
        '<div class="enc-search-row">' +
        '<input type="text" id="encSearchInput" class="text-input" placeholder="ابحث عن خوارزمية (مثل: AES، ChaCha20، RSA، SHA-3، Caesar)...">' +
        '</div>' +
        '<div id="encFilterRow" class="filter-pills-row" style="margin-top:12px;margin-bottom:0;">' +
        '<button type="button" class="chip-btn active" data-acat="all">الكل</button>' +
        '<button type="button" class="chip-btn" data-acat="symmetric">متماثل حديث</button>' +
        '<button type="button" class="chip-btn" data-acat="asymmetric">غير متماثل</button>' +
        '<button type="button" class="chip-btn" data-acat="classical">كلاسيكي</button>' +
        '<button type="button" class="chip-btn" data-acat="transposition">تبديل</button>' +
        '<button type="button" class="chip-btn" data-acat="legacy">قديم (Legacy)</button>' +
        '<button type="button" class="chip-btn" data-acat="hashing">تجزئة (Hashing)</button>' +
        '</div>' +
        '</div>' +
        '<div id="encyclopediaGrid" class="guide-grid" style="margin-top:16px;"></div>' +
        '</div>';

    const servicesGrid = document.getElementById("servicesGuideGrid");
    const encGrid = document.getElementById("encyclopediaGrid");
    const tabSrvBtn = document.getElementById("gTabServices");
    const tabEncBtn = document.getElementById("gTabEncyclopedia");
    const srvPane = document.getElementById("guideServicesPane");
    const encPane = document.getElementById("guideEncPane");
    const filterRow = document.getElementById("encFilterRow");
    const searchInput = document.getElementById("encSearchInput");

    servicesGrid.innerHTML = SERVICES_GUIDE.map(function (srv) {
        return (
            '<article class="panel guide-card">' +
            '<div class="row-between" style="margin-bottom:10px;">' +
            '<h3>' + esc(srv.title) + '</h3>' +
            '<span class="badge ' + esc(srv.cls) + '">' + esc(srv.badge) + '</span>' +
            '</div>' +
            '<p class="guide-desc">' + esc(srv.desc) + '</p>' +
            '<div class="guide-benefit"><strong>فائدتها العملية:</strong> ' + esc(srv.benefit) + '</div>' +
            '<button type="button" class="ghost-btn guide-open-btn" data-jump="' + esc(srv.actionPage) + '">' + esc(srv.actionLabel) + ' ←</button>' +
            '</article>'
        );
    }).join("");

    servicesGrid.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-jump]");
        if (btn && typeof navigateTo === "function") {
            navigateTo(btn.dataset.jump);
        }
    });

    function setGuideTab(tab) {
        const isSrv = tab === "services";
        tabSrvBtn.classList.toggle("active", isSrv);
        tabEncBtn.classList.toggle("active", !isSrv);
        srvPane.classList.toggle("hidden", !isSrv);
        encPane.classList.toggle("hidden", isSrv);
    }

    tabSrvBtn.addEventListener("click", function () { setGuideTab("services"); });
    tabEncBtn.addEventListener("click", function () { setGuideTab("encyclopedia"); });

    function renderEncyclopedia() {
        const q = searchQuery.trim().toLowerCase();
        const out = [];

        for (let i = 0; i < PREPARED_ALGOS.length; i++) {
            const item = PREPARED_ALGOS[i];
            if (activeCat !== "all" && item.category !== activeCat) continue;
            if (q && item.searchBlob.indexOf(q) === -1) continue;
            out.push(item.html);
        }

        encGrid.innerHTML = out.length
            ? out.join("")
            : '<div class="panel empty-inline">لا توجد خوارزميات مطابقة للبحث أو التصنيف المحدد.</div>';
    }

    let activeChipBtn = filterRow.querySelector(".chip-btn.active");
    filterRow.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-acat]");
        if (!btn) return;
        const nextCat = btn.dataset.acat;
        if (nextCat === activeCat) return;
        activeCat = nextCat;
        if (activeChipBtn) activeChipBtn.classList.remove("active");
        btn.classList.add("active");
        activeChipBtn = btn;
        renderEncyclopedia();
    });

    searchInput.addEventListener("input", function () {
        searchQuery = this.value;
        renderEncyclopedia();
    });

    renderEncyclopedia();
})();
