(function () {
    "use strict";

    const tg = window.Telegram ? window.Telegram.WebApp : null;
    if (tg) {
        tg.ready();
        tg.expand();
        try {
            tg.setHeaderColor("#070a0f");
            tg.setBackgroundColor("#070a0f");
        } catch (_) { }

        const user = tg.initDataUnsafe && tg.initDataUnsafe.user;
        if (user && user.first_name) {
            const greet = "أهلاً، " + String(user.first_name);
            const mobEl = document.getElementById("mobileGreeting");
            const deskEl = document.getElementById("desktopGreeting");
            if (mobEl) mobEl.textContent = greet;
            if (deskEl) deskEl.textContent = greet;
        }
    }

    const ESC_MAP = Object.freeze({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" });
    const ESC_RE = /[&<>"']/g;
    function esc(s) {
        return String(s == null ? "" : s).replace(ESC_RE, function (ch) { return ESC_MAP[ch]; });
    }

    let currentTextMode = "encrypt";
    let currentAlgo = "aes";
    let lastResultText = "";
    let lastUsedKey = "";
    let generatedPublicKey = "";
    let generatedPrivateKey = "";

    let currentFileMode = "encrypt";
    let currentFileAlgo = "aes";
    let selectedFileObj = null;
    let currentDownloadUrl = null;
    let currentPreviewUrl = null;
    let currentGuideAlgo = "aes";
    let toastTimer = null;

    const ALGO_CONFIG = Object.freeze({
        aes: Object.freeze({
            needsKey: true,
            useTextarea: false,
            showStrength: true,
            placeholderEncrypt: "مثال: Zoro@StrongPass2026",
            placeholderDecrypt: "أدخل نفس كلمة المرور المستخدمة في التشفير",
            keyHint: "أدخل أي كلمة مرور قوية؛ يتم تحويلها تلقائياً لمفتاح 256-bit آمن عبر PBKDF2.",
            warning: "",
            danger: false
        }),
        chacha20: Object.freeze({
            needsKey: true,
            useTextarea: false,
            showStrength: true,
            placeholderEncrypt: "مثال: FastKey#2026",
            placeholderDecrypt: "أدخل نفس كلمة المرور",
            keyHint: "تشفير ChaCha20-Poly1305 الحديث يدعم العربية والإنجليزية ويتحقق من سلامة النص.",
            warning: "",
            danger: false
        }),
        rsa: Object.freeze({
            needsKey: true,
            useTextarea: true,
            showStrength: false,
            placeholderEncrypt: "-----BEGIN PUBLIC KEY-----",
            placeholderDecrypt: "-----BEGIN RSA PRIVATE KEY-----",
            keyHintEncrypt: "ألصق المفتاح العام (Public Key) هنا أو اضغط (توليد مفاتيح) بالأعلى.",
            keyHintDecrypt: "ألصق المفتاح الخاص (Private Key) المقابل للمفتاح العام.",
            warning: "",
            danger: false
        }),
        caesar: Object.freeze({
            needsKey: true,
            useTextarea: false,
            showStrength: false,
            placeholderEncrypt: "رقم الإزاحة مثل: 3",
            placeholderDecrypt: "نفس رقم الإزاحة مثل: 3",
            keyHint: "أدخل رقماً صحيحاً (مثال: 3 أو 7). يدعم الحروف العربية والإنجليزية.",
            warning: "تنبيه: Caesar خوارزمية كلاسيكية قديمة تُستخدم للتعلم فقط ولا تصلح لحماية البيانات.",
            danger: false
        }),
        vigenere: Object.freeze({
            needsKey: true,
            useTextarea: false,
            showStrength: false,
            placeholderEncrypt: "كلمة مفتاحية مثل: ZORO أو زورو",
            placeholderDecrypt: "نفس الكلمة المفتاحية",
            keyHint: "أدخل كلمة من حروف عربية أو إنجليزية ليتم إزاحة النص بناءً على حروفها.",
            warning: "تنبيه: Vigenère خوارزمية كلاسيكية تعليمية ولا توفر حماية حديثة.",
            danger: false
        }),
        playfair: Object.freeze({
            needsKey: true,
            useTextarea: false,
            showStrength: false,
            placeholderEncrypt: "كلمة إنجليزية مثل: MONARCHY",
            placeholderDecrypt: "نفس الكلمة الإنجليزية",
            keyHint: "تشفير Playfair يعتمد على مصفوفة 5×5 ويدعم الحروف الإنجليزية فقط (A-Z).",
            warning: "ملاحظة: Playfair خوارزمية كلاسيكية تعليمية وتعمل على الحروف الإنجليزية فقط (تُدمج J مع I).",
            danger: false
        }),
        railfence: Object.freeze({
            needsKey: true,
            useTextarea: false,
            showStrength: false,
            placeholderEncrypt: "عدد الصفوف مثل: 3",
            placeholderDecrypt: "نفس عدد الصفوف مثل: 3",
            keyHint: "أدخل رقماً بين 2 و 50 يمثل عدد المسارات المتعرجة. يدعم العربية والإنجليزية.",
            warning: "تنبيه: Rail Fence خوارزمية تبديل كلاسيكية قديمة للأغراض التعليمية فقط.",
            danger: false
        }),
        des: Object.freeze({
            needsKey: true,
            useTextarea: false,
            showStrength: false,
            placeholderEncrypt: "8 أحرف بالضبط مثل: 12345678",
            placeholderDecrypt: "نفس الـ 8 أحرف بالضبط",
            keyHint: "مفتاح DES يجب أن يتكون من 8 أحرف إنجليزية أو أرقام بالضبط.",
            warning: "تحذير أمني: خوارزمية DES قديمة ومكسورة أمنياً، وهي موجودة هنا لأغراض تعليمية فقط.",
            danger: true
        }),
        sha256: Object.freeze({
            needsKey: false,
            useTextarea: false,
            showStrength: false,
            warning: "ملاحظة: SHA-256 دالة تجزئة (Hash) باتجاه واحد لتوليد بصمة فريدة للنص ولا يمكن فكها.",
            danger: false
        }),
        sha512: Object.freeze({
            needsKey: false,
            useTextarea: false,
            showStrength: false,
            warning: "ملاحظة: SHA-512 دالة تجزئة (Hash) باتجاه واحد بطول 512 بت ولا يمكن عكسها.",
            danger: false
        }),
        base64: Object.freeze({
            needsKey: false,
            useTextarea: false,
            showStrength: false,
            warning: "تنبيه: Base64 ليس تشفيراً ولا يحتاج مفتاحاً؛ إنه مجرد ترميز لنقل النصوص ويمكن لأي شخص عكسه.",
            danger: false
        })
    });

    const ALGO_DOCS = Object.freeze({
        aes: Object.freeze({
            name: "AES-256-GCM",
            category: "تشفير متماثل حديث (Symmetric AEAD)",
            badgeText: "آمن جداً ومعتمد عالمياً",
            badgeClass: "safe",
            score: 100,
            scoreColor: "#10b981",
            summary: "معيار التشفير المتقدم (Advanced Encryption Standard) بنمط GCM هو الأقوى والأكثر استخداماً عالمياً لحماية البيانات والملفات والمواقع.",
            steps: ["كلمة المرور + Salt", "اشتقاق مفتاح 256-bit", "14 جولة خلط واستبدال", "إنتاج النص المشفر + ختم تحقق Tag"],
            howItWorks: "تقسّم AES البيانات إلى كتل بحجم 128 بت، ثم تمرر كل كتلة عبر 14 جولة متتالية من أربع عمليات رياضية دقيقة (استبدال البايتات، إزاحة الصفوف، خلط الأعمدة، ودمج المفتاح). وبفضل نمط GCM تضيف ختماً رقمياً يكشف فوراً أي محاولة لتعديل النص المشفر.",
            keySpec: "أي كلمة مرور يكتبها المستخدم (نحولها داخلياً عبر خوارزمية PBKDF2 بـ 210,000 دورة إلى مفتاح عشوائي بطول 256 بت).",
            example: "النص 'مرحباً' مع مفتاحك ينتج نصاً مختلفاً تماماً في كل مرة تشفّره بسبب استخدام Salt و Nonce عشوائيين في كل عملية.",
            realWorld: "يُستخدم في تشفير البنوك، اتصالات HTTPS، تشفير الأقراص الصلبة، وتطبيقات المحادثات الآمنة."
        }),
        chacha20: Object.freeze({
            name: "ChaCha20-Poly1305",
            category: "تشفير تدفقي حديث (Stream Cipher AEAD)",
            badgeText: "حديث وفائق السرعة",
            badgeClass: "safe",
            score: 98,
            scoreColor: "#10b981",
            summary: "خوارزمية تشفير حديثة صممها دانيال برنشتاين كبديل سريع وآمن لـ AES، خصوصاً على الهواتف الذكية والأجهزة التي لا تحتوي على تسريع عتادي لـ AES.",
            steps: ["المفتاح + Nonce عشوائي", "توليد سيل مفاتيح بـ 20 جولة", "عملية XOR مع النص الأصلي", "إضافة توقيع Poly1305 للتحقق"],
            howItWorks: "بدلاً من تشفير كتل ثابتة مثل AES، تقوم ChaCha20 بتوليد سلسلة بايتات عشوائية طويلة ومستحيلة التوقع عبر 20 جولة من عمليات الجمع والدوران وXOR، ثم تدمجها مباشرة مع بيانات النص أو الملف، ويؤمّن Poly1305 سلامة الرسالة ضد التلاعب.",
            keySpec: "مفتاح بطول 256 بت مشتق من كلمة مرورك + رقم Nonce عشوائي بطول 96 بت.",
            example: "تشفّر ملفات الصور الكبيرة بسرعة فائقة مع الحفاظ على مستوى أمان يضاهي AES-256.",
            realWorld: "تعتمدها Google في متصفح Chrome، وتُستخدم في بروتوكول TLS 1.3 وتطبيق WireGuard VPN."
        }),
        rsa: Object.freeze({
            name: "RSA-2048",
            category: "تشفير غير متماثل (Asymmetric Cryptography)",
            badgeText: "مفتاح عام وخاص",
            badgeClass: "safe",
            score: 92,
            scoreColor: "#10b981",
            summary: "أشهر خوارزمية تشفير غير متماثل في التاريخ؛ تحل مشكلة مشاركة المفتاح باستخدام مفتاحين مرتبطين رياضياً: عام للتشفير وخاص لفك التشفير.",
            steps: ["اختيار عددين أوليين ضخمين", "توليد مفتاح عام + مفتاح خاص", "تشفير النص بالمفتاح العام", "فك التشفير بالمفتاح الخاص فقط"],
            howItWorks: "تعتمد قوتها على صعوبة تحليل الأعداد الصحيحة الضخمة (بطول 2048 بت) إلى عواملها الأولية. يمكن لأي شخص امتلاك مفتاحك العام ليرسل لك رسالة مشفرة، لكن لا أحد في العالم يستطيع قراءتها سوى من يملك المفتاح الخاص، مع استخدام حشو OAEP لحماية إضافية.",
            keySpec: "زوج مفاتيح بطول 2048 بت (Public Key و Private Key) يمكنك توليدهما بضغطة زر داخل التطبيق.",
            example: "تُستخدم للنصوص القصيرة (حتى ~190 بايت)؛ أما الملفات الكبيرة فيُشفر ملفها بـ AES ثم يُشفر مفتاح AES بـ RSA.",
            realWorld: "أساس شهادات الأمان SSL/TLS، التوقيعات الرقمية، وتبادل المفاتيح الآمن عبر الإنترنت."
        }),
        caesar: Object.freeze({
            name: "Caesar Cipher (تشفير قيصر)",
            category: "تشفير كلاسيكي بالاستبدال",
            badgeText: "تعليمي فقط",
            badgeClass: "classic",
            score: 15,
            scoreColor: "#f59e0b",
            summary: "أقدم وأبسط خوارزمية تشفير معروفة، استخدمها يوليوس قيصر لإرسال رسائله العسكرية السرية قبل أكثر من 2000 عام.",
            steps: ["قراءة كل حرف من النص", "تحديد ترتيبه في الأبجدية", "إزاحته بمقدار المفتاح الرقمي", "إخراج الحرف الجديد"],
            howItWorks: "تعتمد على إزاحة كل حرف في النص الأصلي عدداً ثابتاً من الخطوات للأمام في الأبجدية (مثل إزاحة 3 خطوات)، وعند فك التشفير نزيح نفس العدد للخلف. في تطبيقنا دعمنا الأبجدية الإنجليزية والعربية معاً.",
            keySpec: "رقم صحيح يمثل مقدار الإزاحة (مثل: 3 أو 5).",
            example: "عند استخدام المفتاح 3: كلمة HELLO تصبح KHOOR (لأن H ➔ K و E ➔ H).",
            realWorld: "لا تُستخدم للحماية إطلاقاً لأنه يمكن كسرها في ثانية واحدة بتجربة كل الإزاحات الممكنة (Brute Force)."
        }),
        vigenere: Object.freeze({
            name: "Vigenère Cipher (فيجينير)",
            category: "تشفير كلاسيكي متعدد الاستبدال",
            badgeText: "تعليمي فقط",
            badgeClass: "classic",
            score: 30,
            scoreColor: "#f59e0b",
            summary: "تطوير ذكي لتشفير قيصر يستخدم كلمة مفتاحية بدلاً من رقم واحد، مما يجعل نفس الحرف يُشفّر بطرق مختلفة حسب موقعه.",
            steps: ["تكرار الكلمة المفتاحية بطول النص", "تحويل كل حرف مفتاح لرقم إزاحة", "جمع إزاحة النص والمفتاح", "إخراج النص المشفر"],
            howItWorks: "بدلاً من إزاحة جميع الحروف بنفس الرقم، يتحكم كل حرف في الكلمة المفتاحية بمقدار إزاحة الحرف المقابل له في النص، مما يخفي تكرار الحروف البسيط الذي كان يفضح تشفير قيصر.",
            keySpec: "كلمة مفتاحية من حروف عربية أو إنجليزية (مثل: ZORO أو زورو).",
            example: "النص ATTACK مع المفتاح KEY: حرف A يزاح بمقدار K، وحرف T يزاح بمقدار E، وهكذا.",
            realWorld: "ظلت صامدة لقرون قبل كسرها بالتحليل الإحصائي (اختبار كاسيسكي)، وتُدرس اليوم لفهم التشفير متعدد الأبجديات."
        }),
        playfair: Object.freeze({
            name: "Playfair Cipher (بلاي فير)",
            category: "تشفير كلاسيكي للأزواج",
            badgeText: "تعليمي فقط",
            badgeClass: "classic",
            score: 35,
            scoreColor: "#f59e0b",
            summary: "أول خوارزمية كلاسيكية تشفّر الحروف على شكل أزواج (حرفين معاً) بدلاً من حرف واحد، مما يصعّب تحليل تكرار الحروف الفردية.",
            steps: ["بناء مصفوفة 5×5 من المفتاح", "تقسيم النص لأزواج حروف", "تطبيق قواعد الصف/العمود/المستطيل", "إخراج الأزواج المشفرة"],
            howItWorks: "تُبنى مصفوفة 5×5 بحروف المفتاح ثم بقية الحروف الإنجليزية (بدمج I و J). يُقسم النص لأزواج: إذا كان الحرفان في نفس الصف نأخذ الذي يليهما، وفي نفس العمود نأخذ الذي تحتهما، وإلا نأخذ الزاويتين المقابلتين في المستطيل.",
            keySpec: "كلمة إنجليزية (مثل: ZORO أو MONARCHY) وتدعم النصوص الإنجليزية فقط.",
            example: "الكلمة BALLOON تُقسم إلى BA - LX - LO - ON (بإضافة X للفصل بين حرفين متشابهين).",
            realWorld: "استُخدمت تاريخياً في الحروب البريطانية والأمريكية، واليوم تُستخدم لأغراض أكاديمية وتعليمية."
        }),
        railfence: Object.freeze({
            name: "Rail Fence Cipher (السياج الحديدي)",
            category: "تشفير كلاسيكي بالتبديل (Transposition)",
            badgeText: "تعليمي فقط",
            badgeClass: "classic",
            score: 20,
            scoreColor: "#f59e0b",
            summary: "تختلف عن قيصر وفيجينير لأنها لا تغيّر الحروف نفسها أبداً، بل تعيد ترتيب أماكنها بكتابتها في مسار متعرج (زجزاج).",
            steps: ["تحديد عدد الصفوف (المفتاح)", "كتابة النص بشكل متعرج نازل وصاعد", "قراءة النص صفاً تلو الآخر", "إنتاج النص المبعثر"],
            howItWorks: "تُكتب حروف النص قطرياً من الصف الأول إلى الأخير ثم ترتد للأعلى مثل السياج المتعرج، وبعد انتهاء النص نقرأ حروف الصف الأول كاملة ثم الثاني ثم الثالث للحصول على النص المشفر.",
            keySpec: "رقم صحيح بين 2 و 50 يمثل عدد الصفوف (مثل: 3).",
            example: "جملة ZORO CRYPTO على 3 صفوف تتوزع بشكل متعرج فتتبعثر أماكن الحروف دون تغيير أي حرف.",
            realWorld: "تُستخدم تعليمياً لتوضيح الفرق بين التشفير بالاستبدال (Substitution) والتشفير بالتبديل (Transposition)."
        }),
        des: Object.freeze({
            name: "DES (Data Encryption Standard)",
            category: "تشفير متماثل قديم (شبكة فايستل)",
            badgeText: "قديم وغير آمن - تعليمي فقط",
            badgeClass: "danger",
            score: 20,
            scoreColor: "#ef4444",
            summary: "معيار التشفير الرسمي في السبعينيات والثمانينيات، لكنه أصبح اليوم غير آمن نهائياً بسبب قصر طول مفتاحه.",
            steps: ["مفتاح 8 أحرف (56 بت فعلي)", "تقسيم النص لكتل 64 بت", "16 جولة في شبكة Feistel", "استبدال عبر صناديق S-Boxes"],
            howItWorks: "تعمل DES على كتل بطول 64 بت وتقسم كل كتلة إلى نصفين يمران بـ 16 جولة من التوسيع والخلط مع مفتاح الجولة وصناديق S-Boxes. مشكلتها القاتلة أن المفتاح الفعلي طوله 56 بت فقط، مما يجعل الحواسيب الحديثة قادرة على كسره بالبحث الشامل في ساعات.",
            keySpec: "8 أحرف إنجليزية أو أرقام بالضبط (64 بت، منها 8 بتات للتدقيق و56 بت فعلياً للتشفير).",
            example: "مفتاح مثل 12345678 يشفر النص عبر 16 جولة، لكن لا يُعتمد عليه مطلقاً لحماية أي بيانات حقيقية.",
            realWorld: "تم إيقاف استخدامها رسمياً واستبدالها بـ AES؛ وتُدرس الآن في الجامعات لفهم بنية شبكة فايستل."
        }),
        sha256: Object.freeze({
            name: "SHA-256 & SHA-512",
            category: "دوال التجزئة التشفيرية (Cryptographic Hash)",
            badgeText: "باتجاه واحد (لا يُفك)",
            badgeClass: "info",
            score: 96,
            scoreColor: "#3b82f6",
            summary: "ليست تشفيراً يُفك، بل هي آلة توليد 'بصمة رقمية' فريدة وثابتة الطول لأي نص أو ملف مهما كان حجمه.",
            steps: ["إدخال أي نص أو ملف", "حشو وتقسيم لكتل ثابتة", "64 جولة ضغط وخلط رياضي", "بصمة ثابتة (64 حرفاً لـ SHA-256)"],
            howItWorks: "تحول أي مدخل إلى سلسلة سداسية عشرية ثابتة الطول. إذا غيّرت حرفاً واحداً أو نقطة في ملف بحجم 10 ميجابايت، تتغير البصمة الناتجة بالكامل (تأثير الانهيار الجليدي Avalanche Effect)، ويستحيل رياضياً استرجاع النص الأصلي من البصمة.",
            keySpec: "لا تحتاج إلى مفتاح.",
            example: "تُستخدم لمقارنة بصمة ملف قبل التحميل وبعده للتأكد أنه لم يتعرض للتعديل أو الفيروسات.",
            realWorld: "أساس حفظ كلمات المرور في قواعد البيانات، تقنية البلوكشين، والتحقق من سلامة الملفات."
        }),
        base64: Object.freeze({
            name: "Base64 Encoding",
            category: "نظام ترميز للبيانات (Encoding)",
            badgeText: "ترميز فقط - ليس تشفيراً",
            badgeClass: "info",
            score: 5,
            scoreColor: "#64748b",
            summary: "طريقة لتحويل أي نص أو بيانات ثنائية إلى 64 حرفاً آمناً فقط (حروف إنجليزية وأرقام و + و /) لتسهيل نقلها عبر الإنترنت.",
            steps: ["تحويل النص لبايتات (بتات)", "تقسيم كل 6 بتات في مجموعة", "استبدال كل رقم بحرف من جدول 64", "إضافة = عند الحاجة"],
            howItWorks: "لا تخفي البيانات بأي سرية؛ هي فقط تعيد تمثيل البيانات النصية أو الثنائية بحروف ASCII قياسية حتى لا تتلف عند إرسالها في البريد الإلكتروني أو طلبات الويب (مثلما نستخدمها لعرض نتائج AES و RSA).",
            keySpec: "لا تحتاج إلى مفتاح أبداً.",
            example: "كلمة ZORO تتحول في Base64 إلى Wk9STw== ويمكن لأي شخص إرجاعها فوراً.",
            realWorld: "تُستخدم في البريد الإلكتروني، تضمين الصور في الويب، وتمثيل النصوص المشفرة للنسخ بسهولة."
        })
    });

    const PAGE_TITLES = Object.freeze({
        home: ["لوحة التحكم الرئيسية", "اختر الخدمة المطلوبة لتشفير نصوصك أو صورك وملفاتك بأمان"],
        textEncrypt: ["تشفير النصوص (Encryption)", "اختر الخوارزمية المناسبة وأدخل مفتاحك ونصك"],
        textDecrypt: ["فك تشفير النصوص (Decryption)", "أدخل نفس الخوارزمية والمفتاح لاسترجاع النص الأصلي"],
        files: ["تشفير الصور والملفات (.zoro)", "حماية الصور والمستندات بـ AES-256-GCM أو ChaCha20 مع المعاينة"],
        guide: ["موسوعة الخوارزميات التفاعلية", "تعرّف على آلية عمل كل خوارزمية وخطواتها ومستوى أمانها"]
    });

    const TEXT_ENCODER = new TextEncoder();

    function vibrate() {
        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred("light");
        }
    }

    function setActiveNav(navKey) {
        const navBtns = document.querySelectorAll(".nav-btn");
        for (let i = 0; i < navBtns.length; i++) {
            navBtns[i].classList.toggle("active", navBtns[i].dataset.nav === navKey);
        }
    }

    function updateDesktopHeader(key) {
        const info = PAGE_TITLES[key] || PAGE_TITLES.home;
        const titleEl = document.getElementById("desktopPageTitle");
        const subEl = document.getElementById("desktopPageSub");
        if (titleEl) titleEl.textContent = info[0];
        if (subEl) subEl.textContent = info[1];
    }

    function showView(viewName) {
        vibrate();
        const views = document.querySelectorAll(".view");
        for (let i = 0; i < views.length; i++) {
            views[i].classList.remove("active");
        }
        const targetView = document.getElementById("view-" + viewName);
        if (targetView) targetView.classList.add("active");

        if (viewName === "home") {
            setActiveNav("home");
            updateDesktopHeader("home");
        } else if (viewName === "files") {
            setActiveNav("files");
            updateDesktopHeader("files");
        } else if (viewName === "guide") {
            setActiveNav("guide");
            updateDesktopHeader("guide");
            renderGuideDetail(currentGuideAlgo);
        } else if (viewName === "text") {
            setActiveNav(currentTextMode);
            updateDesktopHeader(currentTextMode === "encrypt" ? "textEncrypt" : "textDecrypt");
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function openTextWorkspace(mode) {
        currentTextMode = mode;
        const isEncrypt = mode === "encrypt";

        const btnEnc = document.getElementById("modeBtnEncrypt");
        const btnDec = document.getElementById("modeBtnDecrypt");
        if (btnEnc) btnEnc.classList.toggle("active", isEncrypt);
        if (btnDec) btnDec.classList.toggle("active", !isEncrypt);

        const hashOnly = document.querySelectorAll(".hash-only");
        for (let i = 0; i < hashOnly.length; i++) {
            hashOnly[i].classList.toggle("hidden", !isEncrypt);
        }
        if (!isEncrypt && (currentAlgo === "sha256" || currentAlgo === "sha512")) {
            currentAlgo = "aes";
        }

        const keyLbl = document.getElementById("keyLabel");
        const textLbl = document.getElementById("textLabel");
        const textInp = document.getElementById("textInput");
        if (keyLbl) keyLbl.textContent = isEncrypt ? "2. أدخل مفتاح التشفير" : "2. أدخل مفتاح فك التشفير";
        if (textLbl) textLbl.textContent = isEncrypt ? "3. أدخل النص الأصلي" : "3. أدخل النص المشفر";
        if (textInp) {
            textInp.placeholder = isEncrypt ? "اكتب النص هنا بالعربية أو الإنجليزية..." : "ألصق النص المشفر هنا...";
        }

        hideBox("textErrorBox");
        selectAlgo(currentAlgo);
        showView("text");
    }

    function selectAlgo(algo) {
        vibrate();
        currentAlgo = ALGO_CONFIG[algo] ? algo : "aes";
        hideBox("textErrorBox");

        const algoBtns = document.querySelectorAll(".algo-btn");
        for (let i = 0; i < algoBtns.length; i++) {
            algoBtns[i].classList.toggle("active", algoBtns[i].dataset.algo === currentAlgo);
        }

        const cfg = ALGO_CONFIG[currentAlgo];
        const isEncrypt = currentTextMode === "encrypt";

        const execBtn = document.getElementById("executeTextBtn");
        if (execBtn) {
            if (currentAlgo === "sha256" || currentAlgo === "sha512") {
                execBtn.textContent = "توليد البصمة الرقمية #️⃣";
            } else if (currentAlgo === "base64") {
                execBtn.textContent = isEncrypt ? "تحويل إلى Base64 ⚡" : "فك ترميز Base64 ⚡";
            } else {
                execBtn.textContent = isEncrypt ? "تنفيذ التشفير 🔒" : "تنفيذ فك التشفير 🔓";
            }
        }

        const warningEl = document.getElementById("algoWarning");
        if (warningEl) {
            if (cfg.warning) {
                warningEl.textContent = cfg.warning;
                warningEl.classList.remove("hidden");
                warningEl.classList.toggle("danger-alert", cfg.danger);
            } else {
                warningEl.classList.add("hidden");
            }
        }

        const rsaHelper = document.getElementById("rsaHelper");
        const keyPanel = document.getElementById("keyPanel");
        if (rsaHelper) rsaHelper.classList.toggle("hidden", currentAlgo !== "rsa");
        if (keyPanel) keyPanel.classList.toggle("hidden", !cfg.needsKey);

        if (cfg.needsKey) {
            const keyInput = document.getElementById("keyInput");
            const keyTextarea = document.getElementById("keyTextarea");
            const genKeyBtn = document.getElementById("genKeyBtn");
            const strengthWrap = document.getElementById("keyStrengthWrap");
            const keyHintEl = document.getElementById("keyHint");

            if (genKeyBtn) genKeyBtn.classList.toggle("hidden", currentAlgo === "rsa");
            if (strengthWrap) strengthWrap.classList.toggle("hidden", !cfg.showStrength);

            if (cfg.useTextarea) {
                if (keyInput) keyInput.classList.add("hidden");
                if (keyTextarea) {
                    keyTextarea.classList.remove("hidden");
                    keyTextarea.placeholder = isEncrypt ? cfg.placeholderEncrypt : cfg.placeholderDecrypt;
                }
                if (keyHintEl) keyHintEl.textContent = isEncrypt ? cfg.keyHintEncrypt : cfg.keyHintDecrypt;
            } else {
                if (keyTextarea) keyTextarea.classList.add("hidden");
                if (keyInput) {
                    keyInput.classList.remove("hidden");
                    keyInput.placeholder = isEncrypt ? cfg.placeholderEncrypt : cfg.placeholderDecrypt;
                }
                if (keyHintEl) keyHintEl.textContent = cfg.keyHint;
                updateKeyStrength("text");
            }
        }
    }

    function openCurrentAlgoInGuide() {
        currentGuideAlgo = currentAlgo === "sha512" ? "sha256" : currentAlgo;
        showView("guide");
    }

    function updateTextCounter() {
        const textEl = document.getElementById("textInput");
        const statsEl = document.getElementById("textStats");
        if (!textEl || !statsEl) return;
        const val = textEl.value;
        const bytes = TEXT_ENCODER.encode(val).length;
        statsEl.textContent = val.length + " حرف • " + bytes + " بايت";
    }

    function clearTextWorkspace() {
        const textEl = document.getElementById("textInput");
        if (textEl) textEl.value = "";
        updateTextCounter();
        hideBox("textErrorBox");
    }

    function randomChars(len, charset) {
        const out = new Array(len);
        if (window.crypto && window.crypto.getRandomValues) {
            const buf = new Uint32Array(len);
            window.crypto.getRandomValues(buf);
            for (let i = 0; i < len; i++) {
                out[i] = charset.charAt(buf[i] % charset.length);
            }
        } else {
            for (let i = 0; i < len; i++) {
                out[i] = charset.charAt(Math.floor(Math.random() * charset.length));
            }
        }
        return out.join("");
    }

    function randomInt(min, max) {
        const span = max - min + 1;
        if (window.crypto && window.crypto.getRandomValues) {
            const buf = new Uint32Array(1);
            window.crypto.getRandomValues(buf);
            return min + (buf[0] % span);
        }
        return min + Math.floor(Math.random() * span);
    }

    function generateSmartKey() {
        let key = "";
        if (currentAlgo === "caesar") {
            key = String(randomInt(2, 21));
        } else if (currentAlgo === "railfence") {
            key = String(randomInt(3, 8));
        } else if (currentAlgo === "vigenere" || currentAlgo === "playfair") {
            const words = ["ZOROCRYPTO", "CYBERGUARD", "PHANTOMKEY", "SENTINEL", "SHADOWLOCK"];
            key = words[randomInt(0, words.length - 1)];
        } else if (currentAlgo === "des") {
            key = randomChars(8, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789");
        } else {
            key = randomChars(16, "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%&*");
        }
        const keyInp = document.getElementById("keyInput");
        if (keyInp) keyInp.value = key;
        updateKeyStrength("text");
        showToast("تم توليد مفتاح مناسب تلقائياً!");
    }

    function updateKeyStrength(target) {
        const inputId = target === "file" ? "fileKeyInput" : "keyInput";
        const fillId = target === "file" ? "fileStrengthFill" : "keyStrengthFill";
        const textId = target === "file" ? "fileStrengthText" : "keyStrengthText";

        const inp = document.getElementById(inputId);
        const fill = document.getElementById(fillId);
        const label = document.getElementById(textId);
        if (!inp || !fill || !label) return;

        const val = inp.value || "";
        if (!val) {
            fill.style.width = "0%";
            label.textContent = "قوة كلمة المرور: لم يتم الإدخال بعد";
            return;
        }

        let score = 0;
        if (val.length >= 6) score += 25;
        if (val.length >= 10) score += 25;
        if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score += 20;
        if (/[0-9]/.test(val)) score += 15;
        if (/[^A-Za-z0-9]/.test(val)) score += 15;

        let color = "#ef4444";
        let status = "ضعيفة";
        if (score >= 80) {
            color = "#10b981";
            status = "قوية جداً";
        } else if (score >= 50) {
            color = "#f59e0b";
            status = "متوسطة";
        }

        fill.style.width = Math.min(score, 100) + "%";
        fill.style.backgroundColor = color;
        label.textContent = "قوة كلمة المرور: " + status;
    }

    async function generateRsaKeys() {
        const btn = document.getElementById("genRsaBtn");
        if (!btn) return;
        btn.disabled = true;
        btn.textContent = "جاري التوليد...";

        try {
            const res = await fetch("/api/generate-rsa", { method: "POST" });
            const data = await res.json();
            if (!data.success) {
                showBox("textErrorBox", data.error || "فشل توليد المفاتيح.");
                return;
            }
            generatedPublicKey = data.public_key;
            generatedPrivateKey = data.private_key;

            const pubEl = document.getElementById("genPubDisplay");
            const privEl = document.getElementById("genPrivDisplay");
            const genBox = document.getElementById("rsaGeneratedBox");
            const keyTa = document.getElementById("keyTextarea");

            if (pubEl) pubEl.value = generatedPublicKey;
            if (privEl) privEl.value = generatedPrivateKey;
            if (genBox) genBox.classList.remove("hidden");
            if (keyTa) {
                keyTa.value = currentTextMode === "encrypt" ? generatedPublicKey : generatedPrivateKey;
            }

            showToast("تم توليد مفاتيح RSA-2048 بنجاح!");
        } catch (_) {
            showBox("textErrorBox", "تعذر الاتصال بالخادم لتوليد المفاتيح.");
        } finally {
            btn.disabled = false;
            btn.textContent = "⚡ توليد مفاتيح";
        }
    }

    async function executeTextOperation() {
        hideBox("textErrorBox");
        const cfg = ALGO_CONFIG[currentAlgo];
        const isEncrypt = currentTextMode === "encrypt";
        const key = cfg.needsKey
            ? (cfg.useTextarea ? document.getElementById("keyTextarea").value : document.getElementById("keyInput").value)
            : "";
        const text = document.getElementById("textInput").value;

        if (cfg.needsKey && !key.trim()) {
            showBox("textErrorBox", "يرجى إدخال المفتاح المطلوب أو الضغط على (مفتاح عشوائي).");
            return;
        }
        if (!text.trim()) {
            showBox("textErrorBox", isEncrypt ? "يرجى إدخال النص الأصلي." : "يرجى إدخال النص المشفر.");
            return;
        }

        const btn = document.getElementById("executeTextBtn");
        const oldLabel = btn.textContent;
        btn.disabled = true;
        btn.textContent = "جاري المعالجة...";

        try {
            const endpoint = isEncrypt ? "/api/encrypt" : "/api/decrypt";
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ algorithm: currentAlgo, key: key, text: text })
            });
            const data = await res.json();

            if (!data.success) {
                showBox("textErrorBox", data.error || "حدث خطأ أثناء التنفيذ.");
                return;
            }

            lastResultText = data.result;
            lastUsedKey = key;

            const emptyEl = document.getElementById("textResultEmpty");
            const card = document.getElementById("textResultCard");
            if (emptyEl) emptyEl.classList.add("hidden");
            if (card) card.classList.remove("hidden");

            const isHash = currentAlgo === "sha256" || currentAlgo === "sha512";
            document.getElementById("resTitle").textContent = isHash
                ? "البصمة الرقمية الناتجة"
                : (isEncrypt ? "نتيجة التشفير" : "النص الأصلي المسترجع");
            document.getElementById("resAlgoBadge").textContent = data.algorithm;
            document.getElementById("resOutputLabel").textContent = isHash
                ? "قيمة البصمة (Hex):"
                : (isEncrypt ? "النص المشفر:" : "النص بعد فك التشفير:");
            document.getElementById("resOutputText").textContent = data.result;
            document.getElementById("resMetaStats").textContent =
                "الإدخال: " + data.bytes_in + " بايت  •  المخرج: " + data.bytes_out + " بايت";

            const origBlock = document.getElementById("resOriginalBlock");
            if (isEncrypt) {
                origBlock.classList.remove("hidden");
                document.getElementById("resOriginalText").textContent = data.original_text;
            } else {
                origBlock.classList.add("hidden");
            }

            const resWarn = document.getElementById("resWarningBox");
            if (data.warning) {
                resWarn.textContent = data.warning;
                resWarn.classList.remove("hidden");
                resWarn.classList.toggle("danger-alert", currentAlgo === "des");
            } else {
                resWarn.classList.add("hidden");
            }

            const swapBtn = document.getElementById("swapToDecryptBtn");
            if (swapBtn) swapBtn.classList.toggle("hidden", !isEncrypt || isHash);

            if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
            vibrate();
        } catch (_) {
            showBox("textErrorBox", "تعذر الاتصال بالخادم، تأكد أن الخادم يعمل حالياً.");
        } finally {
            btn.disabled = false;
            btn.textContent = oldLabel;
        }
    }

    function swapResultToDecrypt() {
        if (!lastResultText) return;
        openTextWorkspace("decrypt");
        document.getElementById("textInput").value = lastResultText;
        updateTextCounter();

        if (currentAlgo === "rsa") {
            if (generatedPrivateKey) {
                document.getElementById("keyTextarea").value = generatedPrivateKey;
            }
        } else if (ALGO_CONFIG[currentAlgo].needsKey) {
            document.getElementById("keyInput").value = lastUsedKey;
            updateKeyStrength("text");
        }
        showToast("تم نقل النص المشفر والمفتاح لوضع فك التشفير!");
    }

    function setFileMode(mode) {
        vibrate();
        currentFileMode = mode;
        hideBox("fileErrorBox");

        const tabEnc = document.getElementById("fileTabEncrypt");
        const tabDec = document.getElementById("fileTabDecrypt");
        const tabHash = document.getElementById("fileTabHash");
        if (tabEnc) tabEnc.classList.toggle("active", mode === "encrypt");
        if (tabDec) tabDec.classList.toggle("active", mode === "decrypt");
        if (tabHash) tabHash.classList.toggle("active", mode === "hash");

        const optionsBox = document.getElementById("fileCryptoOptions");
        const algoWrap = document.getElementById("fileAlgoWrap");
        const genBtn = document.getElementById("fileGenKeyBtn");
        const strengthWrap = document.getElementById("fileStrengthWrap");
        const btn = document.getElementById("executeFileBtn");
        if (!optionsBox || !btn) return;

        if (mode === "encrypt") {
            document.getElementById("fileStep1Label").textContent = "1. اختر صورة أو ملفاً لتشفيره (حتى 100 ميجابايت)";
            document.getElementById("dropMainText").textContent = "اضغط لاختيار صورة أو ملف، أو اسحبه وأفلته هنا";
            document.getElementById("fileKeyLabel").textContent = "3. كلمة مرور حماية الملف";
            document.getElementById("fileKeyHint").textContent = "يُحفظ اسم الملف الأصلي وامتداده داخل ملف .zoro المشفر بشكل آمن.";
            optionsBox.classList.remove("hidden");
            algoWrap.classList.remove("hidden");
            genBtn.classList.remove("hidden");
            strengthWrap.classList.remove("hidden");
            btn.textContent = "تشفير الملف وتجهيز التحميل 🔒";
        } else if (mode === "decrypt") {
            document.getElementById("fileStep1Label").textContent = "1. اختر الملف المشفر بامتداد (.zoro)";
            document.getElementById("dropMainText").textContent = "اضغط لاختيار ملف .zoro أو اسحبه هنا";
            document.getElementById("fileKeyLabel").textContent = "2. أدخل كلمة مرور فك التشفير";
            document.getElementById("fileKeyHint").textContent = "سيتعرف التطبيق تلقائياً على الخوارزمية ويسترجع الملف باسمه الأصلي.";
            optionsBox.classList.remove("hidden");
            algoWrap.classList.add("hidden");
            genBtn.classList.add("hidden");
            strengthWrap.classList.add("hidden");
            btn.textContent = "فك تشفير الملف واسترجاعه 🔓";
        } else {
            document.getElementById("fileStep1Label").textContent = "1. اختر أي ملف لحساب بصمته الرقمية";
            document.getElementById("dropMainText").textContent = "اضغط لاختيار أي صورة أو ملف للفحص";
            optionsBox.classList.add("hidden");
            btn.textContent = "حساب البصمة الرقمية للملف #️⃣";
        }
    }

    function selectFileAlgo(algo) {
        vibrate();
        currentFileAlgo = algo;
        const btns = document.querySelectorAll(".file-algo-btn");
        for (let i = 0; i < btns.length; i++) {
            btns[i].classList.toggle("active", btns[i].dataset.falgo === algo);
        }
    }

    function generateFilePassword() {
        const inp = document.getElementById("fileKeyInput");
        if (inp) {
            inp.value = randomChars(18, "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%&*");
        }
        updateKeyStrength("file");
        showToast("تم توليد كلمة مرور قوية! احتفظ بها لفك التشفير.");
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    }

    function revokePreviewUrl() {
        if (currentPreviewUrl) {
            URL.revokeObjectURL(currentPreviewUrl);
            currentPreviewUrl = null;
        }
    }

    function handleFilePicked(file) {
        if (!file) return;
        selectedFileObj = file;
        hideBox("fileErrorBox");

        document.getElementById("fileSelectedName").textContent = file.name;
        document.getElementById("fileSelectedSize").textContent = formatFileSize(file.size);
        document.getElementById("fileSelectedBox").classList.remove("hidden");

        const previewWrap = document.getElementById("fileInputPreviewWrap");
        const previewImg = document.getElementById("fileInputPreviewImg");
        revokePreviewUrl();

        if (file.type && file.type.indexOf("image/") === 0) {
            currentPreviewUrl = URL.createObjectURL(file);
            previewImg.src = currentPreviewUrl;
            previewWrap.classList.remove("hidden");
        } else {
            previewWrap.classList.add("hidden");
            previewImg.removeAttribute("src");
        }
    }

    function clearSelectedFile() {
        selectedFileObj = null;
        revokePreviewUrl();
        const fileInp = document.getElementById("fileInput");
        if (fileInp) fileInp.value = "";
        const selBox = document.getElementById("fileSelectedBox");
        if (selBox) selBox.classList.add("hidden");
        const prevWrap = document.getElementById("fileInputPreviewWrap");
        if (prevWrap) prevWrap.classList.add("hidden");
        const prevImg = document.getElementById("fileInputPreviewImg");
        if (prevImg) prevImg.removeAttribute("src");
    }

    const dropZone = document.getElementById("fileDropZone");
    if (dropZone) {
        dropZone.addEventListener("dragover", function (e) {
            e.preventDefault();
            dropZone.classList.add("drag-over");
        });
        dropZone.addEventListener("dragleave", function () {
            dropZone.classList.remove("drag-over");
        });
        dropZone.addEventListener("drop", function (e) {
            e.preventDefault();
            dropZone.classList.remove("drag-over");
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFilePicked(e.dataTransfer.files[0]);
            }
        });
    }

    async function executeFileOperation() {
        hideBox("fileErrorBox");
        if (!selectedFileObj) {
            showBox("fileErrorBox", "يرجى اختيار صورة أو ملف أولاً.");
            return;
        }

        const password = document.getElementById("fileKeyInput").value;
        if (currentFileMode !== "hash" && !password.trim()) {
            showBox("fileErrorBox", "يرجى إدخال كلمة مرور للملف.");
            return;
        }

        const btn = document.getElementById("executeFileBtn");
        const oldText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "جاري المعالجة...";

        const formData = new FormData();
        formData.append("file", selectedFileObj);

        try {
            if (currentFileMode === "hash") {
                const res = await fetch("/api/file/hash", { method: "POST", body: formData });
                const data = await res.json();
                if (!data.success) {
                    showBox("fileErrorBox", data.error || "فشل فحص الملف.");
                    return;
                }
                document.getElementById("fileResultEmpty").classList.add("hidden");
                document.getElementById("fileResultCard").classList.remove("hidden");
                document.getElementById("fileDownloadSection").classList.add("hidden");
                document.getElementById("fileHashSection").classList.remove("hidden");

                document.getElementById("fileResultTitle").textContent = "البصمة الرقمية للملف";
                document.getElementById("fileResultBadge").textContent = formatFileSize(data.size);
                document.getElementById("hashSha256").textContent = data.sha256;
                document.getElementById("hashSha512").textContent = data.sha512;
                document.getElementById("hashMd5").textContent = data.md5;
                showToast("تم حساب البصمة الرقمية بنجاح!");
                return;
            }

            formData.append("key", password);
            if (currentFileMode === "encrypt") {
                formData.append("algorithm", currentFileAlgo);
            }

            const endpoint = currentFileMode === "encrypt" ? "/api/file/encrypt" : "/api/file/decrypt";
            const res = await fetch(endpoint, { method: "POST", body: formData });

            if (!res.ok) {
                let errMsg = "فشلت العملية، تأكد من الملف وكلمة المرور.";
                try {
                    const errJson = await res.json();
                    if (errJson.error) errMsg = errJson.error;
                } catch (_) { }
                showBox("fileErrorBox", errMsg);
                return;
            }

            const blob = await res.blob();
            const encodedName = res.headers.get("X-Output-Filename") || (currentFileMode === "encrypt" ? "protected.zoro" : "restored_file");
            let outputName = "restored_file";
            try {
                outputName = decodeURIComponent(encodedName);
            } catch (_) {
                outputName = encodedName;
            }
            const outputMime = res.headers.get("X-Output-Mime") || blob.type || "";

            if (currentDownloadUrl) {
                URL.revokeObjectURL(currentDownloadUrl);
            }
            currentDownloadUrl = URL.createObjectURL(blob);

            document.getElementById("fileResultEmpty").classList.add("hidden");
            const card = document.getElementById("fileResultCard");
            card.classList.remove("hidden");
            document.getElementById("fileHashSection").classList.add("hidden");
            document.getElementById("fileDownloadSection").classList.remove("hidden");

            const dlBtn = document.getElementById("fileDownloadBtn");
            dlBtn.href = currentDownloadUrl;
            dlBtn.download = outputName;

            const outPrevWrap = document.getElementById("fileOutputPreviewWrap");
            const outPrevImg = document.getElementById("fileOutputPreviewImg");

            if (currentFileMode === "encrypt") {
                document.getElementById("fileResultTitle").textContent = "تم تشفير الملف بنجاح";
                document.getElementById("fileResultBadge").textContent = currentFileAlgo === "chacha20" ? "ChaCha20" : "AES-GCM";
                document.getElementById("fileResultMeta").textContent =
                    "اسم الملف الناتج: " + outputName + "الحجم بعد التشفير: " + formatFileSize(blob.size);

                dlBtn.textContent = "⬇️ تحميل الملف المشفر (" + outputName + ")";
                outPrevWrap.classList.add("hidden");
                outPrevImg.removeAttribute("src");
            } else {
                document.getElementById("fileResultTitle").textContent = "تم استرجاع الملف الأصلي بنجاح";
                document.getElementById("fileResultBadge").textContent = "مسترجع";
                document.getElementById("fileResultMeta").textContent =
                    "الملف المسترجع: " + outputName + " الحجم: " + formatFileSize(blob.size);
                dlBtn.textContent = "⬇️ تحميل الملف المسترجع (" + outputName + ")";

                if (outputMime.indexOf("image/") === 0) {
                    outPrevImg.src = currentDownloadUrl;
                    outPrevWrap.classList.remove("hidden");
                } else {
                    outPrevWrap.classList.add("hidden");
                    outPrevImg.removeAttribute("src");
                }
            }

            card.scrollIntoView({ behavior: "smooth", block: "nearest" });
            showToast(currentFileMode === "encrypt" ? "تم تشفير الملف بنجاح!" : "تم فك تشفير الملف بنجاح!");
            vibrate();
        } catch (_) {
            showBox("fileErrorBox", "تعذر الاتصال بالخادم، تأكد أن الخادم يعمل.");
        } finally {
            btn.disabled = false;
            btn.textContent = oldText;
        }
    }

    function initGuideList() {
        const listEl = document.getElementById("guideList");
        if (!listEl) return;
        const keys = Object.keys(ALGO_DOCS);
        const parts = new Array(keys.length);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const doc = ALGO_DOCS[key];
            parts[i] =
                '<button type="button" class="guide-item-btn' + (key === currentGuideAlgo ? " active" : "") + '" data-gkey="' + esc(key) + '">' +
                '<span>' + esc(doc.name) + '</span>' +
                '<span class="badge ' + esc(doc.badgeClass) + '">' + esc(doc.score) + '%</span>' +
                '</button>';
        }
        listEl.innerHTML = parts.join("");
        listEl.addEventListener("click", function (e) {
            const btn = e.target.closest("[data-gkey]");
            if (btn) renderGuideDetail(btn.dataset.gkey);
        });
    }

    function renderGuideDetail(key) {
        currentGuideAlgo = ALGO_DOCS[key] ? key : "aes";
        const doc = ALGO_DOCS[currentGuideAlgo];

        const itemBtns = document.querySelectorAll(".guide-item-btn");
        for (let i = 0; i < itemBtns.length; i++) {
            itemBtns[i].classList.toggle("active", itemBtns[i].dataset.gkey === currentGuideAlgo);
        }

        const stepsParts = [];
        for (let i = 0; i < doc.steps.length; i++) {
            stepsParts.push('<div class="wf-step">' + (i + 1) + ". " + esc(doc.steps[i]) + '</div>');
            if (i < doc.steps.length - 1) {
                stepsParts.push('<span class="wf-arrow">←</span>');
            }
        }

        const panel = document.getElementById("guideDetailPanel");
        if (!panel) return;
        panel.innerHTML =
            '<div class="doc-header">' +
            '<div><h2>' + esc(doc.name) + '</h2><div class="doc-cat">' + esc(doc.category) + '</div></div>' +
            '<span class="badge ' + esc(doc.badgeClass) + '">' + esc(doc.badgeText) + '</span>' +
            '</div>' +
            '<div class="sec-meter-box">' +
            '<div class="sec-meter-top"><span>تقييم مستوى الأمان</span><span style="color:' + esc(doc.scoreColor) + '">' + esc(doc.score) + ' / 100</span></div>' +
            '<div class="strength-bar"><div class="strength-fill" style="width:' + esc(doc.score) + '%; background:' + esc(doc.scoreColor) + ';"></div></div>' +
            '</div>' +
            '<div class="doc-section"><h4>نظرة سريعة</h4><p>' + esc(doc.summary) + '</p></div>' +
            '<div class="doc-section"><h4>مخطط آلية العمل</h4><div class="workflow-box">' + stepsParts.join("") + '</div></div>' +
            '<div class="doc-section"><h4>كيف تعمل الخوارزمية بالتفصيل؟</h4><p>' + esc(doc.howItWorks) + '</p></div>' +
            '<div class="doc-section"><h4>متطلبات المفتاح</h4><p>' + esc(doc.keySpec) + '</p></div>' +
            '<div class="doc-section"><h4>مثال توضيحي</h4><div class="doc-example">' + esc(doc.example) + '</div></div>' +
            '<div class="doc-section"><h4>الاستخدام في الواقع</h4><p>' + esc(doc.realWorld) + '</p></div>' +
            '<button type="button" class="primary-btn" data-try-algo="' + esc(currentGuideAlgo) + '">🚀 جرّب خوارزمية ' + esc(doc.name) + ' الآن</button>';

        const tryBtn = panel.querySelector("[data-try-algo]");
        if (tryBtn) {
            tryBtn.addEventListener("click", function () {
                tryAlgoFromGuide(tryBtn.dataset.tryAlgo);
            });
        }
    }

    function tryAlgoFromGuide(algoKey) {
        currentAlgo = ALGO_CONFIG[algoKey] ? algoKey : "aes";
        openTextWorkspace("encrypt");
    }

    function showBox(id, msg) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = msg;
        el.classList.remove("hidden");
    }

    function hideBox(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    }

    function copyText(text) {
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(function () { showToast("تم النسخ بنجاح!"); })
                .catch(function () { fallbackCopy(text); });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const temp = document.createElement("textarea");
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        temp.remove();
        showToast("تم النسخ بنجاح!");
    }

    function showToast(msg) {
        const toast = document.getElementById("toast");
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.remove("hidden");
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.add("hidden");
        }, 2200);
    }

    window.addEventListener("pagehide", function () {
        revokePreviewUrl();
        if (currentDownloadUrl) {
            URL.revokeObjectURL(currentDownloadUrl);
            currentDownloadUrl = null;
        }
    });

    window.showView = showView;
    window.openTextWorkspace = openTextWorkspace;
    window.selectAlgo = selectAlgo;
    window.openCurrentAlgoInGuide = openCurrentAlgoInGuide;
    window.updateTextCounter = updateTextCounter;
    window.clearTextWorkspace = clearTextWorkspace;
    window.generateSmartKey = generateSmartKey;
    window.updateKeyStrength = updateKeyStrength;
    window.generateRsaKeys = generateRsaKeys;
    window.executeTextOperation = executeTextOperation;
    window.swapResultToDecrypt = swapResultToDecrypt;
    window.setFileMode = setFileMode;
    window.selectFileAlgo = selectFileAlgo;
    window.generateFilePassword = generateFilePassword;
    window.handleFilePicked = handleFilePicked;
    window.clearSelectedFile = clearSelectedFile;
    window.executeFileOperation = executeFileOperation;
    window.renderGuideDetail = renderGuideDetail;
    window.tryAlgoFromGuide = tryAlgoFromGuide;
    window.copyText = copyText;
    window.showToast = showToast;

    initGuideList();
    renderGuideDetail("aes");
    selectAlgo("aes");
    setFileMode("encrypt");
})();
