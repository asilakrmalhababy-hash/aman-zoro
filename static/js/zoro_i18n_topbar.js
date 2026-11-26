(function () {
  var STORAGE_KEY = 'zoro_security_prefs_v1';

  var SUN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5" stroke="#FBBF24" fill="rgba(251,191,36,0.2)"/><path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" stroke="#FBBF24"/></svg>';
  var MOON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.8 6.8 0 0 0 9.7 9.7z" stroke="#38BDF8" fill="rgba(56,189,248,0.18)"/></svg>';
  var BELL_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8.5-3 8.5h18s-3-1.5-3-8.5" stroke="#38BDF8" fill="rgba(56,189,248,0.14)"/><path d="M13.7 20a2 2 0 0 1-3.4 0" stroke="#10B981"/></svg>';
  var BELL_ON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8.5-3 8.5h18s-3-1.5-3-8.5" stroke="#10B981" fill="rgba(16,185,129,0.22)"/><path d="M13.7 20a2 2 0 0 1-3.4 0" stroke="#38BDF8"/><circle cx="18.5" cy="5.5" r="3" fill="#10B981" stroke="#070B14" stroke-width="1.5"/></svg>';

  var DICT = {
    'الرئيسية': 'Home',
    '→ الرئيسية': '← Home',
    '→ العودة للرئيسية': '← Back to Home',
    '→ خدمات التشفير': '← Encryption',
    'زورو للأمان': 'ZORO SECURITY',
    'حماية متكاملة': 'Complete Protection',
    'منصة ويب مستقلة': 'Independent Web Platform',
    'تصميم وفكرة': 'Designed by',
    'ZORO SECURITY • سهل الاستخدام. قوي في الحماية.': 'ZORO SECURITY • Easy to use. Strong protection.',
    'سهل الاستخدام. قوي في الحماية.': 'Easy to use. Strong protection.',
    'التشفير': 'Encrypt',
    'الفحص': 'Scan',
    'الأدوات': 'Tools',
    'المعرفة': 'Learn',
    'تأمين النصوص والملفات والصور والبصمات الرقمية': 'Secure messages, files, images & digital hashes',
    'كشف الروابط المشبوهة والملفات ورسائل النصب وكلمات المرور': 'Detect phishing links, malicious files, scams & weak passwords',
    'خصوصية الصور وتوليد كلمات المرور والمفاتيح ورموز QR': 'Image privacy cleaner, password/key generators & QR codes',
    'مسار التعلم والموسوعة الأمنية وحالة خدمات المنصة': 'Cybersecurity roadmap, encyclopedia & live system status',
    'تشفير النصوص والرسائل': 'Text & Message Encryption',
    'تأمين الرسائل بخوارزميات AES-256-GCM و ChaCha20 و RSA-2048': 'Encrypt messages with AES-256-GCM, ChaCha20 & RSA-2048',
    'تشفير': 'Encrypt',
    'الملفات والصور وإخفاء النص': 'Files, Images & Steganography',
    'تشفير الملفات بامتداد .zoro وإخفاء الرسائل السرية داخل الصور': 'Encrypt files (.zoro) and hide secret text inside images',
    'حماية': 'Protect',
    'البصمة الرقمية (Hashing)': 'Digital Hash (Hashing)',
    'البصمة الرقمية': 'Digital Hash',
    'توليد بصمات SHA-256 و SHA-512 و SHA-3 للتحقق من سلامة البيانات': 'Generate SHA-256, SHA-512 & SHA-3 hashes to verify integrity',
    'تحقق': 'Verify',
    'فحص الروابط والتصيد': 'URL & Phishing Scanner',
    'فحص HTTPS وكشف الروابط الخبيثة وإعادة التوجيه وحماية SSRF': 'Check HTTPS, phishing indicators, redirects & SSRF protection',
    'روابط': 'URLs',
    'فحص الملفات وكشف التلاعب': 'File Integrity Scanner',
    'فحص البصمة SHA-256 والتحقق من تطابق الامتداد مع بنية الملف الحقيقية': 'Verify SHA-256 hash and detect spoofed file extensions',
    'ملفات': 'Files',
    'كاشف رسائل النصب': 'Scam Message Detector',
    'تحليل رسائل واتساب و SMS المشبوهة وكشف الروابط المموّهة محلياً': 'Analyze suspicious WhatsApp & SMS messages locally',
    'ذكي': 'Smart',
    'محلل قوة كلمة المرور': 'Password Strength Analyzer',
    'قياس فوري ومحلي لمدى صمود كلمة مرورك ضد التخمين والاختراق': 'Instant local analysis of password strength against attacks',
    'محلي': 'Local',
    'منظّف خصوصية الصور': 'Image Privacy Cleaner (EXIF)',
    'مسح نوع الجوال ووقت التصوير وإحداثيات GPS من الصور قبل مشاركتها': 'Strip device model, timestamp & GPS coordinates before sharing',
    'خصوصية': 'Privacy',
    'مولد كلمات المرور القوية': 'Strong Password Generator',
    'إنشاء كلمات مرور عشوائية آمنة محلياً داخل متصفحك (CSPRNG)': 'Generate secure random passwords locally via CSPRNG',
    'فوري': 'Instant',
    'مولد رموز QR القياسي': 'Standard QR Code Generator',
    'تحويل أي نص أو رابط أو مفتاح إلى رمز QR قابل للمسح مع تحميل PNG': 'Convert any text, URL or key into a scannable PNG QR code',
    'مولد المفاتيح ومحلل الملفات': 'Key Generator & File Info',
    'توليد مفاتيح تشفير 256-bit و 512-bit وفحص خصائص أي ملف محلياً': 'Generate 256/512-bit keys and inspect file metadata locally',
    'متقدم': 'Pro',
    'مسار تعلم الأمن السيبراني': 'Cybersecurity Roadmap',
    'خطة ومسار تعلم الأمن السيبراني': 'Cybersecurity Learning Roadmap',
    'خطة عملية متدرجة لتعلم الأمن السيبراني والتشفير خطوة بخطوة': 'Step-by-step practical roadmap for cybersecurity & cryptography',
    'مسار': 'Path',
    'الموسوعة ودليل المنصة': 'Encyclopedia & Platform Guide',
    'دليل المنصة والموسوعة': 'Platform Guide & Encyclopedia',
    'دليل خدمات المنصة والموسوعة': 'Platform Services Guide & Encyclopedia',
    'شرح مبسط للخوارزميات والمفاهيم الأمنية وكيفية استخدام كل أداة': 'Clear guide to encryption algorithms, security concepts & tools',
    'مرجع': 'Guide',
    'حالة النظام والخدمات': 'System & Services Status',
    'مراقبة جاهزية الخادم وقاعدة البيانات السحابية والخدمات النشطة': 'Monitor server uptime, TiDB Cloud database & active services',
    'مباشر': 'Live',
    'التشفير والحماية': 'Encryption & Protection',
    'تشفير النصوص': 'Text Encryption',
    'تشفير وفك تشفير النصوص': 'Text Encryption & Decryption',
    'تشفير الصور والملفات': 'File & Image Encryption',
    'الفحص الأمني': 'Security Scanner',
    'فحص الروابط': 'URL Scanner',
    'فحص الملفات': 'File Scanner',
    'قوة كلمة المرور': 'Password Strength',
    'الأدوات والخصوصية': 'Tools & Privacy',
    'الأدوات الأمنية المساعدة': 'Security Utility Tools',
    'مولد كلمات المرور': 'Password Generator',
    'مولد المفاتيح': 'Key Generator',
    'مولد رموز QR': 'QR Generator',
    'مولد QR': 'QR Generator',
    'معلومات الملف': 'File Info',
    'مولد المفاتيح والملفات': 'Keys & File Info',
    'المعرفة والتعلّم': 'Knowledge & Learning',
    'النظام والحساب': 'System & Account',
    'سجلي الخاص': 'My Activity History',
    'الإشعارات والتنبيهات': 'Notifications & Alerts',
    'عن ZORO SECURITY': 'About ZORO SECURITY',
    'لوحة تحكم الأدمن': 'Admin Dashboard',
    'خدمات التشفير': 'Encryption Services',
    'تشفير ملف أو صورة': 'Encrypt File / Image',
    'فك تشفير ملف (.zoro)': 'Decrypt (.zoro) File',
    'إخفاء النصوص': 'Hide Text',
    'تحويل الصور': 'Image Converter',
    'اسحب الصورة أو الملف وأفلته هنا، أو اضغط للاختيار': 'Drag & drop image or file here, or tap to choose',
    'صور (PNG, JPG, WEBP)، مستندات (PDF, DOCX)، أرشيفات (ZIP)، صوت (MP3) • حتى 100 MB': 'Images (PNG, JPG, WEBP), Docs (PDF, DOCX), Archives (ZIP), Audio (MP3) • up to 100 MB',
    'الملف المحدد': 'Selected File',
    'استبدال': 'Replace',
    'إزالة': 'Remove',
    'خوارزمية التشفير': 'Encryption Algorithm',
    'كلمة مرور التشفير': 'Encryption Password',
    'تشفير الملف': 'Encrypt File',
    'فك تشفير الملف': 'Decrypt File',
    'حالة الملف والنتيجة': 'File Status & Result',
    'تم التشفير بنجاح': 'Encrypted Successfully',
    'تحميل الملف': 'Download File',
    'اسم الملف:': 'File Name:',
    'الحجم:': 'Size:',
    'الخوارزمية:': 'Algorithm:',
    'بعد التشفير ستحصل على ملف محمي بامتداد': 'After encryption you will get a protected file ending in',
    'مع إمكانية اختيار مكان الحفظ، وعند فك التشفير ستسترجع ملفك الأصلي بالكامل.': 'and upon decryption you will restore your original file completely.',
    'يُحفظ اسم الملف وامتداده الأصلي داخل ملف .zoro المشفر بشكل آمن.': 'Original filename & extension are securely stored inside the .zoro file.',
    'إخفاء واستخراج النصوص داخل الصور': 'Hide & Extract Text Inside Images',
    'يعمل محلياً داخل جهازك بسرعة فائقة مع تشفير AES-256-GCM بدون رفع الصورة لأي خادم.': 'Runs 100% locally on your device with AES-256-GCM encryption—zero server uploads.',
    'إخفاء نص في صورة': 'Hide Text in Image',
    'استخراج نص من صورة': 'Extract Text from Image',
    'اختر الصورة': 'Choose Image',
    'النص السري المراد إخفاؤه': 'Secret Message to Hide',
    'كلمة مرور الحماية (إلزامية)': 'Protection Password (Required)',
    'إخفاء النص وتجهيز الصورة': 'Hide Text & Generate Image',
    'استخراج النص المخفي': 'Extract Hidden Text',
    'نسخ النص': 'Copy Text',
    'تحميل الصورة المشفّرة (PNG)': 'Download Encrypted Image (PNG)',
    'تم بنجاح': 'Success',
    'تحويل الصورة إلى نص والعكس (لواتساب)': 'Image ↔ Text Converter (WhatsApp)',
    'حوّل أي صورة إلى نص قابل للنسخ والإرسال عبر واتساب، أو استرجع الصورة من النص محلياً خلال لحظات.': 'Convert any image to copyable text for WhatsApp, or restore an image from text locally in seconds.',
    'تحويل صورة إلى نص': 'Image to Text',
    'تحويل نص إلى صورة': 'Text to Image',
    'اختر الدقة (الحد الأقصى للحروف)': 'Select Quality (Max Characters)',
    'دقة عالية (حتى 65,000 حرف)': 'High Quality (up to 65,000 chars)',
    'دقة متوسطة (حتى 35,000 حرف)': 'Medium Quality (up to 35,000 chars)',
    'دقة ضعيفة / سريعة (حتى 8,000 حرف)': 'Fast / Low Quality (up to 8,000 chars)',
    'كلمة مرور (اختيارية لتشفير النص)': 'Password (Optional Encryption)',
    'تحويل الصورة إلى نص': 'Convert Image to Text',
    'جاهز للنسخ': 'Ready to Copy',
    'الصق النص المحوّل هنا': 'Paste Converted Text Here',
    'كلمة المرور (فقط إذا كان النص مشفّراً)': 'Password (Only if Encrypted)',
    'استرجاع الصورة من النص': 'Restore Image from Text',
    'تحميل الصورة': 'Download Image',
    '⚡ توليد كلمة سر قوية ونسخها': '⚡ Generate & Copy Strong Password',
    'توليد كلمة سر قوية ونسخها': 'Generate & Copy Strong Password',
    'تشفير (Encrypt)': 'Encrypt',
    'فك التشفير (Decrypt)': 'Decrypt',
    'تشفير النص': 'Encrypt Text',
    'فك تشفير النص': 'Decrypt Text',
    'النص المراد تشفيره': 'Text to Encrypt',
    'النص المشفر': 'Encrypted Text',
    'مفتاح التشفير': 'Encryption Key',
    'توليد كلمة مرور ←': 'Generate Password →',
    'مفاتيح RSA-2048': 'RSA-2048 Keys',
    'توليد زوج مفاتيح': 'Generate Key Pair',
    'المفتاح العام (Public Key)': 'Public Key',
    'المفتاح الخاص (Private Key)': 'Private Key',
    'تنفيذ التشفير': 'Run Encryption',
    'منطقة النتيجة': 'Result Area',
    'نسخ النتيجة': 'Copy Result',
    'تحميل النتيجة': 'Download Result',
    'تبديل الوضع': 'Swap Mode',
    'مسح المحتوى': 'Clear',
    'حديث وآمن جداً': 'Modern & Highly Secure',
    'ستظهر النتيجة هنا فور تنفيذ العملية مع أزرار النسخ والتحميل والمسح والتبديل السريع.': 'Results will appear here immediately with Copy, Download, Clear & Swap actions.',
    'بصمة نص': 'Text Hash',
    'بصمة ملف': 'File Hash',
    'مقارنة بصمتين': 'Compare Hashes',
    'التحقق من ملف': 'Verify File',
    'خوارزمية التجزئة': 'Hash Algorithm',
    'النص': 'Text',
    'توليد البصمة الرقمية': 'Generate Hash',
    'البصمة الناتجة': 'Generated Hash',
    'لم يتم توليد بصمة بعد.': 'No hash generated yet.',
    'اختيار ملف (حتى 100 MB)': 'Select File (up to 100 MB)',
    'حساب بصمة الملف': 'Calculate File Hash',
    'بصمة الملف': 'File Hash',
    'لم يتم اختيار ملف بعد.': 'No file selected yet.',
    'مقارنة بصمتين رقميتين': 'Compare Two Hashes',
    'البصمة الأولى': 'First Hash',
    'البصمة الثانية': 'Second Hash',
    'مقارنة البصمتين': 'Compare Hashes',
    'التحقق من سلامة ملف (File Integrity)': 'File Integrity Verification',
    'اختيار الملف للتحقق': 'Select File to Verify',
    'البصمة المتوقعة': 'Expected Hash',
    'التحقق من الملف': 'Verify File',
    'تنبيه تعليمي: التجزئة (Hashing) عملية': 'Note: Hashing is a',
    'باتجاه واحد (One-Way)': 'One-Way process',
    'وليست تشفيراً؛ لا يمكن فك البصمة أو عكسها لاسترجاع النص أو الملف الأصلي.': 'and cannot be reversed to recover the original text or file.',
    'فحص الروابط (URL Security Scanner)': 'URL Security Scanner',
    'فحص الملفات (File Security Scanner)': 'File Security Scanner',
    'محلل قوة كلمات المرور (تحليل محلي فقط)': 'Password Strength Analyzer (Local Only)',
    'يفحص HTTPS، مؤشرات التصيد، إعادة التوجيه، ويطبّق حماية SSRF ضد العناوين الداخلية.': 'Checks HTTPS, phishing signals, redirects & SSRF protection.',
    'يفحص البصمة SHA-256، الحجم، وتطابق الامتداد مع البنية الحقيقية للملف.': 'Checks SHA-256 hash, size & file header signature match.',
    'يتم التحليل بالكامل داخل متصفحك ولا يتم إرسال كلمة المرور إلى أي خادم أو جهة خارجية.': 'Analyzed 100% locally in your browser—your password is never sent anywhere.',
    'الرابط المراد فحصه': 'URL to Scan',
    'فحص الرابط الآن': 'Scan URL Now',
    'اختيار ملف للفحص': 'Select File to Scan',
    'فحص الملف الآن': 'Scan File Now',
    'أدخل كلمة المرور لتحليلها': 'Enter Password to Analyze',
    'بانتظار الإدخال': 'Waiting for input',
    'أدخل كلمة مرور لعرض الطول، التنوع، والأنماط.': 'Enter a password to analyze length, diversity & patterns.',
    'الطول:': 'Length:',
    'التقييم:': 'Rating:',
    'الحالة:': 'Status:',
    'النتيجة:': 'Result:',
    'تقدير صعوبة التخمين:': 'Crack Resistance:',
    'يتم التوليد محلياً داخل متصفحك باستخدام مولد عشوائي آمن (CSPRNG).': 'Generated locally in your browser using a cryptographically secure CSPRNG.',
    'طول كلمة المرور': 'Password Length',
    'أحرف كبيرة (A-Z)': 'Uppercase (A-Z)',
    'أحرف صغيرة (a-z)': 'Lowercase (a-z)',
    'أرقام (0-9)': 'Numbers (0-9)',
    'رموز خاصة (!@#$)': 'Symbols (!@#$)',
    'توليد كلمة مرور': 'Generate Password',
    'جاهزة': 'Ready',
    'نسخ': 'Copy',
    'مولد المفاتيح التشفيرية (Symmetric Keys)': 'Symmetric Key Generator',
    'توليد مفاتيح عشوائية خالصة للتشفير المتماثل بصيغتي Hex و Base64.': 'Generate pure random symmetric keys in Hex and Base64 formats.',
    'قوة المفتاح (Key Size)': 'Key Size',
    '128-bit (16 بايت)': '128-bit (16 bytes)',
    '256-bit (32 بايت - موصى به)': '256-bit (32 bytes - Recommended)',
    '512-bit (64 بايت)': '512-bit (64 bytes)',
    'توليد مفتاح تشفير': 'Generate Key',
    'صيغة Hex': 'Hex Format',
    'صيغة Base64': 'Base64 Format',
    'حوّل أي نص أو رابط أو مفتاح إلى رمز QR قياسي قابل للمسح بكاميرا الجوال.': 'Convert any text, link or key into a scannable mobile QR code.',
    'المحتوى المراد تحويله لـ QR': 'Content for QR Code',
    'إنشاء رمز QR': 'Generate QR Code',
    'تحميل صورة QR (PNG)': 'Download QR (PNG)',
    'محلل معلومات الملفات': 'File Metadata Analyzer',
    'افحص خصائص أي ملف محلياً (الاسم، الامتداد، النوع، الحجم، وتاريخ التعديل).': 'Inspect any file locally (name, extension, MIME type, size & modified date).',
    'اختيار ملف لفحص معلوماته': 'Select File to Inspect',
    'الامتداد:': 'Extension:',
    'النوع (MIME):': 'Type (MIME):',
    'آخر تعديل:': 'Last Modified:',
    'تحديث الفحص ↻': 'Refresh Status ↻',
    'الخدمات النشطة حالياً': 'Currently Active Services',
    'جاري فحص حالة الخدمات...': 'Checking services status...',
    'تحديث ↻': 'Refresh ↻',
    'تسجيل الخروج': 'Sign Out',
    'تسجيل الدخول': 'Sign In',
    'إدارة شاملة للمستخدمين، الصلاحيات، والأمان': 'Complete management of users, roles & security',
    '1. الرئيسية (Dashboard)': '1. Dashboard',
    '2. المستخدمون': '2. Users',
    '3. المسؤولون': '3. Admins',
    '4. مركز الأمان': '4. Security Center',
    '5. سجل النشاط': '5. Activity Log',
    '6. إعدادات المنصة': '6. Platform Settings',
    'نظرة عامة وحالة الموقع': 'Overview & Site Status',
    'Online • يعمل بشكل طبيعي': 'Online • Running Normally',
    'إجمالي المستخدمين': 'Total Users',
    'المستخدمون النشطون (24س)': 'Active Users (24h)',
    'إجمالي العمليات': 'Total Operations',
    'المحظورون': 'Banned',
    'النشاط خلال آخر 7 أيام': 'Activity (Last 7 Days)',
    'مستخدمون': 'Users',
    'عمليات': 'Operations',
    'تفصيل العمليات': 'Operations Breakdown',
    'قائمة المستخدمين': 'Users List',
    'قائمة المسؤولين والصلاحيات': 'Admins & Permissions',
    'إضافة مسؤول جديد': 'Add New Admin',
    'إضافة المسؤول': 'Add Admin',
    'الاسم الكامل': 'Full Name',
    'الصلاحية': 'Role',
    'إدارة حظر عناوين IP': 'IP Ban Management',
    'حظر عنوان IP': 'Ban IP Address',
    'حظر مستخدم (مؤقت أو دائم)': 'Ban User (Temp or Permanent)',
    'تنفيذ الحظر': 'Apply Ban',
    'فك الحظر': 'Unban',
    'إلغاء الحظر': 'Unban',
    'حظر': 'Ban',
    'محظور': 'Banned',
    'نشط': 'Active',
    'محمي': 'Protected',
    'حذف': 'Delete',
    'محاولات الدخول الفاشلة والأحداث الأمنية': 'Failed Logins & Security Events',
    'سجل الأنشطة': 'Activity Log',
    'مسح السجل': 'Clear Log',
    'إعدادات المنصة والتحكم': 'Platform Settings & Controls',
    'حفظ الإعدادات': 'Save Settings',
    'تفعيل وضع الصيانة (Maintenance Mode)': 'Enable Maintenance Mode',
    'تفعيل أداة تشفير النصوص': 'Enable Text Encryption',
    'تفعيل أداة تشفير الملفات': 'Enable File Encryption',
    'تفعيل البصمة الرقمية': 'Enable Hashing Tool',
    'تفعيل الفاحص الأمني': 'Enable Security Scanner',
    'الحد الأقصى لحجم الملفات (MB)': 'Max File Size (MB)',
    'الحد الأقصى للطلبات في الدقيقة (Rate Limit)': 'Max Requests / Min (Rate Limit)',
    'لا توجد أحداث أمنية مسجلة.': 'No security events logged.',
    'لا توجد أنشطة مسجلة.': 'No activities logged.',
    'لا توجد عناوين IP محظورة حالياً.': 'No banned IP addresses.',
    'لا يوجد مستخدمون مسجلون.': 'No registered users yet.',
    'تمت العملية بنجاح': 'Operation completed successfully'
  };

  var PARTIAL_RULES = [
    [/مرحباً،\s*/g, 'Welcome, '],
    [/\(الأساسي\)/g, '(Primary)'],
    [/(\d+)\s*حرفاً/g, '$1 chars'],
    [/(\d[\d,]*)\s*حرف/g, '$1 chars'],
    [/بايت/g, 'bytes']
  ];

  var PLACEHOLDERS = {
    'أدخل نصاً أو رابطاً...': 'Enter text or URL...',
    'أدخل النص هنا...': 'Enter text here...',
    'اكتب النص هنا بالعربية أو الإنجليزية...': 'Type text in Arabic or English...',
    'أدخل كلمة المرور...': 'Enter password...',
    'أدخل كلمة مرور قوية...': 'Enter a strong password...',
    'اكتب كلمة المرور هنا...': 'Type password here...',
    'أدخل مفتاح التشفير...': 'Enter encryption key...',
    'اكتب رسالتك السرية هنا...': 'Write your secret message here...',
    'اتركها فارغة للتحويل المباشر بدون كلمة سر': 'Leave empty for direct conversion without password',
    'اتركها فارغة إذا كان بدون كلمة مرور': 'Leave empty if not password-protected',
    'أدخل النص لحساب بصمته الرقمية...': 'Enter text to calculate hash...',
    'ألصق البصمة الأولى هنا...': 'Paste first hash here...',
    'ألصق البصمة الثانية هنا...': 'Paste second hash here...',
    'أدخل البصمة الصحيحة المتوقعة...': 'Enter expected hash...',
    'بحث بالاسم أو ID...': 'Search by name or ID...',
    'سبب الحظر': 'Ban reason',
    'عنوان IP (مثال: 192.168.1.50)': 'IP address (e.g. 192.168.1.50)',
    'معرّف المستخدم (User ID)': 'User ID'
  };

  var origText = new WeakMap();
  var origPlaceholder = new WeakMap();
  var currentLang = 'ar';
  var observer = null;
  var mutTimer = null;

  function loadPrefs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var p = raw ? JSON.parse(raw) : {};
      return {
        theme: p.theme === 'light' ? 'light' : 'dark',
        lang: p.lang === 'en' ? 'en' : 'ar',
        notifEnabled: !!p.notifEnabled,
        fontSize: 14
      };
    } catch (_) {
      return { theme: 'dark', lang: 'ar', notifEnabled: false, fontSize: 14 };
    }
  }

  function savePrefs(patch) {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var p = raw ? JSON.parse(raw) : {};
      Object.assign(p, patch, { fontSize: 14 });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch (_) {}
  }

  function showMiniToast(msg) {
    var t = document.getElementById('toast');
    if (t) {
      t.textContent = msg;
      t.classList.remove('hidden');
      clearTimeout(window._zd7ToastT);
      window._zd7ToastT = setTimeout(function () { t.classList.add('hidden'); }, 2600);
    }
  }

  function translateString(arVal) {
    var key = arVal.replace(/\s+/g, ' ').trim();
    if (DICT[key]) {
      var lead = arVal.match(/^\s*/)[0];
      var trail = arVal.match(/\s*$/)[0];
      return lead + DICT[key] + trail;
    }
    var out = arVal;
    var changed = false;
    for (var i = 0; i < PARTIAL_RULES.length; i++) {
      var next = out.replace(PARTIAL_RULES[i][0], PARTIAL_RULES[i][1]);
      if (next !== out) { out = next; changed = true; }
    }
    return changed ? out : null;
  }

  function translateTree(root, lang) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var parent = node.parentElement;
      if (!parent) continue;
      var tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'CODE') continue;
      var raw = node.nodeValue;
      if (!raw || !raw.trim()) continue;

      if (!origText.has(node)) origText.set(node, raw);
      var arVal = origText.get(node);

      if (lang === 'en') {
        var tr = translateString(arVal);
        if (tr !== null && node.nodeValue !== tr) node.nodeValue = tr;
      } else if (node.nodeValue !== arVal) {
        node.nodeValue = arVal;
      }
    }

    root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(function (el) {
      if (!origPlaceholder.has(el)) origPlaceholder.set(el, el.getAttribute('placeholder') || '');
      var arPh = origPlaceholder.get(el);
      if (lang === 'en' && PLACEHOLDERS[arPh]) {
        el.setAttribute('placeholder', PLACEHOLDERS[arPh]);
      } else if (lang === 'ar') {
        el.setAttribute('placeholder', arPh);
      }
    });
  }

  function updateButtons() {
    var themeBtn = document.getElementById('zd7ThemeBtn');
    var langBtn = document.getElementById('zd7LangBtn');
    var isLight = document.body.classList.contains('light-theme');
    if (themeBtn) {
      themeBtn.innerHTML = isLight ? MOON_SVG : SUN_SVG;
      themeBtn.setAttribute('title', isLight ? (currentLang === 'en' ? 'Dark Mode' : 'الوضع الليلي') : (currentLang === 'en' ? 'Light Mode' : 'الوضع النهاري'));
    }
    if (langBtn) {
      langBtn.textContent = currentLang === 'en' ? 'ع' : 'E';
      langBtn.setAttribute('title', currentLang === 'en' ? 'التبديل للعربية' : 'Switch to English');
    }
  }

  function toggleTheme() {
    var isLight = !document.body.classList.contains('light-theme');
    document.body.classList.toggle('light-theme', isLight);
    savePrefs({ theme: isLight ? 'light' : 'dark' });
    updateButtons();
  }

  function openNotifModal() {
    var existing = document.getElementById('zd7NotifOverlay');
    if (existing) existing.remove();

    var prefs = loadPrefs();
    var isEn = currentLang === 'en';
    var enabled = prefs.notifEnabled;

    var title = enabled
      ? (isEn ? 'Notifications Enabled' : 'الإشعارات مفعّلة بنجاح')
      : (isEn ? 'Enable ZORO SECURITY Alerts' : 'تفعيل إشعارات ZORO SECURITY');
    var desc = enabled
      ? (isEn
          ? 'You are receiving instant security alerts and scan updates from ZORO SECURITY. You can pause them anytime.'
          : 'أنت تستقبل حالياً التنبيهات الأمنية الفورية وتحديثات الفحص من ZORO SECURITY. يمكنك إيقافها في أي وقت.')
      : (isEn
          ? 'Allow ZORO SECURITY to send you instant security alerts, scan results, and important updates?'
          : 'هل تسمح لمنصة ZORO SECURITY بإرسال تنبيهات أمنية فورية ونتائج الفحص والتحديثات المهمة؟');
    var primaryTxt = enabled
      ? (isEn ? 'Disable Notifications' : 'إيقاف الإشعارات')
      : (isEn ? 'Allow Notifications' : 'السماح بالإشعارات');
    var cancelTxt = isEn ? 'Close' : 'لاحقاً';

    var overlay = document.createElement('div');
    overlay.id = 'zd7NotifOverlay';
    overlay.className = 'zd7-modal-overlay';
    overlay.innerHTML =
      '<div class="zd7-modal-card" role="dialog" aria-modal="true">' +
        '<div class="zd7-modal-ico">' + (enabled ? BELL_ON_SVG : BELL_SVG) + '</div>' +
        '<h3 class="zd7-modal-title">' + title + '</h3>' +
        '<p class="zd7-modal-desc">' + desc + '</p>' +
        '<div class="zd7-modal-actions">' +
          '<button type="button" id="zd7NotifConfirm" class="zd7-modal-primary ' + (enabled ? 'is-off' : '') + '">' + primaryTxt + '</button>' +
          '<button type="button" id="zd7NotifCancel" class="zd7-modal-cancel">' + cancelTxt + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    function close() { overlay.remove(); }
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.getElementById('zd7NotifCancel').addEventListener('click', close);
    document.getElementById('zd7NotifConfirm').addEventListener('click', function () {
      var nextState = !enabled;
      savePrefs({ notifEnabled: nextState });
      updateButtons();
      close();
      showMiniToast(nextState
        ? (isEn ? 'ZORO SECURITY notifications enabled ✓' : 'تم تفعيل إشعارات ZORO SECURITY بنجاح ✓')
        : (isEn ? 'Notifications paused' : 'تم إيقاف الإشعارات'));
    });
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function startObserver() {
    stopObserver();
    if (currentLang !== 'en') return;
    observer = new MutationObserver(function () {
      if (mutTimer) clearTimeout(mutTimer);
      mutTimer = setTimeout(function () {
        if (currentLang === 'en') translateTree(document.body, 'en');
      }, 70);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function applyLang(lang) {
    currentLang = lang === 'en' ? 'en' : 'ar';
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'en' ? 'ltr' : 'rtl';
    savePrefs({ lang: currentLang });
    stopObserver();
    translateTree(document.body, currentLang);
    updateButtons();
    if (currentLang === 'en') startObserver();
  }

  function mountTopbarControls() {
    var left = document.querySelector('.topbar-left');
    if (!left || left.dataset.zd7ControlsMounted === '5') return;
    left.dataset.zd7ControlsMounted = '5';

    left.innerHTML =
      '<div class="zd7-top-actions">' +
        '<button type="button" id="zd7ThemeBtn" class="zd7-top-btn" aria-label="تبديل الوضع"></button>' +
        '<button type="button" id="zd7LangBtn" class="zd7-top-btn zd7-lang-btn" aria-label="تبديل اللغة">E</button>' +
      '</div>';

    document.getElementById('zd7ThemeBtn').addEventListener('click', toggleTheme);
    document.getElementById('zd7LangBtn').addEventListener('click', function () {
      applyLang(currentLang === 'en' ? 'ar' : 'en');
    });

    window.zoroOpenNotifModal = openNotifModal;

    var drawer = document.getElementById('sidebarDrawer');
    var menuBtn = document.getElementById('menuToggleBtn');
    if (drawer && menuBtn && !menuBtn.dataset.zd7Morph) {
      menuBtn.dataset.zd7Morph = '1';
      var syncMenuIcon = function () {
        menuBtn.classList.toggle('is-open', drawer.classList.contains('open'));
      };
      new MutationObserver(syncMenuIcon).observe(drawer, { attributes: true, attributeFilter: ['class'] });
      syncMenuIcon();
    }

    var prefs = loadPrefs();
    document.body.classList.toggle('light-theme', prefs.theme === 'light');
    applyLang(prefs.lang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountTopbarControls);
  } else {
    mountTopbarControls();
  }
})();
