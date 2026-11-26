(function () {
  var MAGIC_STEGO = [0x5A, 0x53, 0x54, 0x31];
  var PREFIX_PLAIN = 'ZOROIMG1:';
  var PREFIX_ENC = 'ZOROIMG1E:';

  function u8ToB64(bytes) {
    var bin = '';
    var chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }

  function b64ToU8(b64) {
    var bin = atob(b64.replace(/\s+/g, ''));
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function deriveAesKey(password, salt) {
    var enc = new TextEncoder();
    var baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: 120000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encryptBytes(plainBytes, password) {
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var key = await deriveAesKey(password, salt);
    var ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, plainBytes));
    var out = new Uint8Array(16 + 12 + ct.length);
    out.set(salt, 0);
    out.set(iv, 16);
    out.set(ct, 28);
    return out;
  }

  async function decryptBytes(packed, password) {
    if (packed.length < 30) throw new Error('البيانات غير صالحة أو تالفة');
    var salt = packed.slice(0, 16);
    var iv = packed.slice(16, 28);
    var ct = packed.slice(28);
    var key = await deriveAesKey(password, salt);
    var pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ct);
    return new Uint8Array(pt);
  }

  function loadImageFromFile(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('تعذر قراءة الصورة المحددة'));
      };
      img.src = url;
    });
  }

  function embedLsb(imageData, payloadBytes) {
    var header = new Uint8Array(8);
    header.set(MAGIC_STEGO, 0);
    var len = payloadBytes.length;
    header[4] = (len >>> 24) & 255;
    header[5] = (len >>> 16) & 255;
    header[6] = (len >>> 8) & 255;
    header[7] = len & 255;

    var full = new Uint8Array(8 + len);
    full.set(header, 0);
    full.set(payloadBytes, 8);

    var d = imageData.data;
    var capacityBits = Math.floor(d.length / 4) * 3;
    var neededBits = full.length * 8;
    if (neededBits > capacityBits) {
      throw new Error('الصورة صغيرة جداً على هذا النص، اختر صورة أكبر أو نصاً أقصر');
    }

    var bitIdx = 0;
    for (var i = 0; i < d.length && bitIdx < neededBits; i += 4) {
      for (var c = 0; c < 3 && bitIdx < neededBits; c++) {
        var byteVal = full[bitIdx >> 3];
        var bit = (byteVal >> (7 - (bitIdx & 7))) & 1;
        d[i + c] = (d[i + c] & 0xFE) | bit;
        bitIdx++;
      }
      d[i + 3] = 255;
    }
    return imageData;
  }

  function extractLsb(imageData) {
    var d = imageData.data;
    function readBytes(count, startBit) {
      var out = new Uint8Array(count);
      var bIdx = startBit;
      var totalPixels = Math.floor(d.length / 4);
      for (var n = 0; n < count; n++) {
        var val = 0;
        for (var k = 0; k < 8; k++) {
          var pIdx = Math.floor(bIdx / 3);
          if (pIdx >= totalPixels) throw new Error('لم يتم العثور على نص مخفي داخل هذه الصورة');
          var ch = bIdx % 3;
          var bit = d[pIdx * 4 + ch] & 1;
          val = (val << 1) | bit;
          bIdx++;
        }
        out[n] = val;
      }
      return out;
    }

    var hdr = readBytes(8, 0);
    for (var m = 0; m < 4; m++) {
      if (hdr[m] !== MAGIC_STEGO[m]) {
        throw new Error('لا يوجد نص مخفي بصيغة ZORO داخل هذه الصورة (تأكد من إرسالها كملف بدون ضغط)');
      }
    }
    var len = ((hdr[4] << 24) >>> 0) + (hdr[5] << 16) + (hdr[6] << 8) + hdr[7];
    if (!len || len > 5 * 1024 * 1024) throw new Error('حجم البيانات المخفية غير صالح');
    return readBytes(len, 64);
  }

  async function compressImageToTargetChars(file, maxChars) {
    var img = await loadImageFromFile(file);
    var maxBytes = Math.floor((maxChars - 120) * 0.74);
    var mime = 'image/webp';
    var testCanvas = document.createElement('canvas');
    testCanvas.width = 4;
    testCanvas.height = 4;
    if (testCanvas.toDataURL('image/webp').indexOf('data:image/webp') !== 0) {
      mime = 'image/jpeg';
    }

    var maxDim = maxChars >= 60000 ? 1280 : (maxChars >= 30000 ? 920 : 480);
    var qualities = [0.88, 0.78, 0.68, 0.58, 0.48, 0.38, 0.28, 0.20, 0.14];
    var scales = [1, 0.82, 0.66, 0.52, 0.4, 0.3];

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var bestBlob = null;

    for (var s = 0; s < scales.length; s++) {
      var ratio = Math.min(1, maxDim / Math.max(img.width, img.height)) * scales[s];
      var w = Math.max(64, Math.round(img.width * ratio));
      var h = Math.max(64, Math.round(img.height * ratio));
      canvas.width = w;
      canvas.height = h;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      for (var q = 0; q < qualities.length; q++) {
        var blob = await new Promise(function (res) {
          canvas.toBlob(res, mime, qualities[q]);
        });
        if (!blob) continue;
        bestBlob = blob;
        if (blob.size <= maxBytes) {
          var buf = new Uint8Array(await blob.arrayBuffer());
          return { bytes: buf, mime: mime, width: w, height: h };
        }
      }
    }

    if (!bestBlob) throw new Error('تعذر ضغط الصورة');
    return {
      bytes: new Uint8Array(await bestBlob.arrayBuffer()),
      mime: mime,
      width: canvas.width,
      height: canvas.height
    };
  }

  function showToastMsg(msg) {
    var t = document.getElementById('toast');
    if (t) {
      t.textContent = msg;
      t.classList.remove('hidden');
      clearTimeout(window._zd7ToastT);
      window._zd7ToastT = setTimeout(function () { t.classList.add('hidden'); }, 2600);
    }
  }

  function mountFilesProTabs() {
    var mount = document.getElementById('filesModuleMount');
    if (!mount || mount.dataset.zoroFilesPro === '1') return;

    var bar = mount.querySelector('.mode-switch-bar');
    var splitGrid = mount.querySelector('.split-grid');
    if (!bar || !splitGrid) return;

    mount.dataset.zoroFilesPro = '1';
    bar.classList.add('four-cols');

    var btnStego = document.createElement('button');
    btnStego.type = 'button';
    btnStego.id = 'fModeStego';
    btnStego.className = 'mode-pill';
    btnStego.textContent = 'إخفاء النصوص';

    var btnImgTxt = document.createElement('button');
    btnImgTxt.type = 'button';
    btnImgTxt.id = 'fModeImgTxt';
    btnImgTxt.className = 'mode-pill';
    btnImgTxt.textContent = 'تحويل الصور';

    bar.appendChild(btnStego);
    bar.appendChild(btnImgTxt);

    var stegoPane = document.createElement('div');
    stegoPane.id = 'zoroStegoPane';
    stegoPane.className = 'hidden';
    stegoPane.innerHTML =
      '<div class="panel max-narrow">' +
        '<h3>إخفاء واستخراج النصوص داخل الصور</h3>' +
        '<p class="field-hint">يعمل محلياً داخل جهازك بسرعة فائقة مع تشفير AES-256-GCM بدون رفع الصورة لأي خادم.</p>' +
        '<div class="two-choice" style="margin-bottom:14px;">' +
          '<button type="button" id="zStModeHide" class="choice-pill active">إخفاء نص في صورة</button>' +
          '<button type="button" id="zStModeExtract" class="choice-pill">استخراج نص من صورة</button>' +
        '</div>' +
        '<div class="field-group">' +
          '<label class="field-label" for="zStFile">اختر الصورة</label>' +
          '<input type="file" id="zStFile" accept="image/*" class="text-input">' +
        '</div>' +
        '<div id="zStPreviewWrap" class="hidden" style="text-align:center;margin:10px 0;">' +
          '<img id="zStPreview" alt="معاينة" style="max-height:190px;max-width:100%;border-radius:14px;border:1px solid rgba(56,189,248,0.3);">' +
        '</div>' +
        '<div id="zStMsgWrap" class="field-group">' +
          '<label class="field-label" for="zStMsg">النص السري المراد إخفاؤه</label>' +
          '<textarea id="zStMsg" class="text-input" rows="3" placeholder="اكتب رسالتك السرية هنا..."></textarea>' +
        '</div>' +
        '<div class="field-group">' +
          '<label class="field-label" for="zStPass">كلمة مرور الحماية (إلزامية)</label>' +
          '<input type="password" id="zStPass" class="text-input" placeholder="أدخل كلمة مرور قوية...">' +
        '</div>' +
        '<div id="zStErr" class="inline-alert danger hidden"></div>' +
        '<button type="button" id="zStRunBtn" class="primary-btn full-w">إخفاء النص وتجهيز الصورة</button>' +
        '<div id="zStOutWrap" class="hidden" style="margin-top:14px;">' +
          '<div class="row-between" style="margin-bottom:8px;">' +
            '<span id="zStOutBadge" class="badge safe">تم بنجاح</span>' +
            '<button type="button" id="zStCopyBtn" class="ghost-btn hidden">نسخ النص</button>' +
          '</div>' +
          '<div id="zStOutText" class="mono-box hidden" dir="auto"></div>' +
          '<a id="zStDownloadBtn" class="primary-btn full-w hidden" style="display:inline-flex;justify-content:center;text-decoration:none;margin-top:8px;" download="zoro_secret.png">تحميل الصورة المشفّرة (PNG)</a>' +
        '</div>' +
      '</div>';

    var imgTxtPane = document.createElement('div');
    imgTxtPane.id = 'zoroImgTxtPane';
    imgTxtPane.className = 'hidden';
    imgTxtPane.innerHTML =
      '<div class="panel max-narrow">' +
        '<h3>تحويل الصورة إلى نص والعكس (لواتساب)</h3>' +
        '<p class="field-hint">حوّل أي صورة إلى نص قابل للنسخ والإرسال عبر واتساب، أو استرجع الصورة من النص محلياً خلال لحظات.</p>' +
        '<div class="two-choice" style="margin-bottom:14px;">' +
          '<button type="button" id="zItModeToText" class="choice-pill active">تحويل صورة إلى نص</button>' +
          '<button type="button" id="zItModeToImg" class="choice-pill">تحويل نص إلى صورة</button>' +
        '</div>' +
        '<div id="zItToTextBox">' +
          '<div class="field-group">' +
            '<label class="field-label" for="zItFile">اختر الصورة</label>' +
            '<input type="file" id="zItFile" accept="image/*" class="text-input">' +
          '</div>' +
          '<div class="field-group">' +
            '<label class="field-label" for="zItQuality">اختر الدقة (الحد الأقصى للحروف)</label>' +
            '<select id="zItQuality" class="select-input">' +
              '<option value="65000">دقة عالية (حتى 65,000 حرف)</option>' +
              '<option value="35000" selected>دقة متوسطة (حتى 35,000 حرف)</option>' +
              '<option value="8000">دقة ضعيفة / سريعة (حتى 8,000 حرف)</option>' +
            '</select>' +
          '</div>' +
          '<div class="field-group">' +
            '<label class="field-label" for="zItEncPass">كلمة مرور (اختيارية لتشفير النص)</label>' +
            '<input type="password" id="zItEncPass" class="text-input" placeholder="اتركها فارغة للتحويل المباشر بدون كلمة سر">' +
          '</div>' +
          '<button type="button" id="zItEncodeBtn" class="primary-btn full-w">تحويل الصورة إلى نص</button>' +
          '<div id="zItTextOutWrap" class="hidden" style="margin-top:14px;">' +
            '<div class="row-between" style="margin-bottom:8px;">' +
              '<span id="zItStatsBadge" class="badge safe">جاهز للنسخ</span>' +
              '<button type="button" id="zItCopyBtn" class="ghost-btn">نسخ النص</button>' +
            '</div>' +
            '<textarea id="zItTextOut" class="text-input mono-box" rows="5" readonly dir="ltr"></textarea>' +
          '</div>' +
        '</div>' +
        '<div id="zItToImgBox" class="hidden">' +
          '<div class="field-group">' +
            '<label class="field-label" for="zItTextIn">الصق النص المحوّل هنا</label>' +
            '<textarea id="zItTextIn" class="text-input" rows="5" dir="ltr" placeholder="ZOROIMG1:..."></textarea>' +
          '</div>' +
          '<div class="field-group">' +
            '<label class="field-label" for="zItDecPass">كلمة المرور (فقط إذا كان النص مشفّراً)</label>' +
            '<input type="password" id="zItDecPass" class="text-input" placeholder="اتركها فارغة إذا كان بدون كلمة مرور">' +
          '</div>' +
          '<button type="button" id="zItDecodeBtn" class="primary-btn full-w">استرجاع الصورة من النص</button>' +
          '<div id="zItImgOutWrap" class="hidden" style="margin-top:14px;text-align:center;">' +
            '<img id="zItImgOut" alt="الصورة المسترجعة" style="max-height:300px;max-width:100%;border-radius:16px;border:1px solid rgba(16,185,129,0.4);margin-bottom:10px;">' +
            '<a id="zItDownloadImg" class="primary-btn full-w" style="display:inline-flex;justify-content:center;text-decoration:none;" download="zoro_restored.webp">تحميل الصورة</a>' +
          '</div>' +
        '</div>' +
        '<div id="zItErr" class="inline-alert danger hidden" style="margin-top:10px;"></div>' +
      '</div>';

    mount.appendChild(stegoPane);
    mount.appendChild(imgTxtPane);

    var fEnc = document.getElementById('fModeEnc');
    var fDec = document.getElementById('fModeDec');

    function setActiveMode(which) {
      [fEnc, fDec, btnStego, btnImgTxt].forEach(function (b) {
        if (b) b.classList.remove('active');
      });
      splitGrid.classList.toggle('hidden', which !== 'enc' && which !== 'dec');
      stegoPane.classList.toggle('hidden', which !== 'stego');
      imgTxtPane.classList.toggle('hidden', which !== 'imgtxt');
      if (which === 'enc' && fEnc) fEnc.classList.add('active');
      if (which === 'dec' && fDec) fDec.classList.add('active');
      if (which === 'stego') btnStego.classList.add('active');
      if (which === 'imgtxt') btnImgTxt.classList.add('active');
    }

    if (fEnc) fEnc.addEventListener('click', function () { setActiveMode('enc'); });
    if (fDec) fDec.addEventListener('click', function () { setActiveMode('dec'); });
    btnStego.addEventListener('click', function () { setActiveMode('stego'); });
    btnImgTxt.addEventListener('click', function () { setActiveMode('imgtxt'); });

    var stMode = 'hide';
    var zStModeHide = document.getElementById('zStModeHide');
    var zStModeExtract = document.getElementById('zStModeExtract');
    var zStMsgWrap = document.getElementById('zStMsgWrap');
    var zStRunBtn = document.getElementById('zStRunBtn');
    var zStErr = document.getElementById('zStErr');
    var zStOutWrap = document.getElementById('zStOutWrap');
    var zStOutText = document.getElementById('zStOutText');
    var zStCopyBtn = document.getElementById('zStCopyBtn');
    var zStDownloadBtn = document.getElementById('zStDownloadBtn');
    var zStFile = document.getElementById('zStFile');
    var zStPreviewWrap = document.getElementById('zStPreviewWrap');
    var zStPreview = document.getElementById('zStPreview');

    function updateStMode(m) {
      stMode = m;
      zStModeHide.classList.toggle('active', m === 'hide');
      zStModeExtract.classList.toggle('active', m === 'extract');
      zStMsgWrap.classList.toggle('hidden', m !== 'hide');
      zStRunBtn.textContent = m === 'hide' ? 'إخفاء النص وتجهيز الصورة' : 'استخراج النص المخفي';
      zStErr.classList.add('hidden');
      zStOutWrap.classList.add('hidden');
    }
    zStModeHide.addEventListener('click', function () { updateStMode('hide'); });
    zStModeExtract.addEventListener('click', function () { updateStMode('extract'); });

    zStFile.addEventListener('change', function () {
      var f = zStFile.files && zStFile.files[0];
      if (!f) { zStPreviewWrap.classList.add('hidden'); return; }
      zStPreview.src = URL.createObjectURL(f);
      zStPreviewWrap.classList.remove('hidden');
    });

    zStCopyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(zStOutText.textContent || '').then(function () {
        showToastMsg('تم نسخ النص المستخرج ✓');
      });
    });

    zStRunBtn.addEventListener('click', async function () {
      zStErr.classList.add('hidden');
      zStOutWrap.classList.add('hidden');
      var file = zStFile.files && zStFile.files[0];
      var pass = (document.getElementById('zStPass').value || '').trim();
      if (!file) { zStErr.textContent = 'اختر صورة أولاً.'; zStErr.classList.remove('hidden'); return; }
      if (!pass) { zStErr.textContent = 'أدخل كلمة مرور الحماية أولاً.'; zStErr.classList.remove('hidden'); return; }

      zStRunBtn.disabled = true;
      try {
        var img = await loadImageFromFile(file);
        var canvas = document.createElement('canvas');
        var maxSide = stMode === 'hide' ? 1600 : 4096;
        var ratio = stMode === 'hide' ? Math.min(1, maxSide / Math.max(img.width, img.height)) : 1;
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (stMode === 'hide') {
          var msg = (document.getElementById('zStMsg').value || '').trim();
          if (!msg) throw new Error('اكتب النص السري المراد إخفاؤه أولاً.');
          var encPayload = await encryptBytes(new TextEncoder().encode(msg), pass);
          embedLsb(imgData, encPayload);
          ctx.putImageData(imgData, 0, 0);
          var blob = await new Promise(function (res) { canvas.toBlob(res, 'image/png'); });
          var url = URL.createObjectURL(blob);
          zStDownloadBtn.href = url;
          zStDownloadBtn.classList.remove('hidden');
          zStOutText.classList.add('hidden');
          zStCopyBtn.classList.add('hidden');
          document.getElementById('zStOutBadge').textContent = 'تم الإخفاء بالتشفير ✓ (أرسلها كملف)';
          zStOutWrap.classList.remove('hidden');
          showToastMsg('تم إخفاء النص داخل الصورة بنجاح ✓');
        } else {
          var rawPayload = extractLsb(imgData);
          var decBytes = await decryptBytes(rawPayload, pass);
          var text = new TextDecoder().decode(decBytes);
          zStOutText.textContent = text;
          zStOutText.classList.remove('hidden');
          zStCopyBtn.classList.remove('hidden');
          zStDownloadBtn.classList.add('hidden');
          document.getElementById('zStOutBadge').textContent = 'تم استخراج النص بنجاح ✓';
          zStOutWrap.classList.remove('hidden');
          showToastMsg('تم استخراج النص المخفي ✓');
        }
      } catch (e) {
        zStErr.textContent = (e && e.message) ? e.message : 'كلمة المرور غير صحيحة أو الصورة مضغوطة.';
        zStErr.classList.remove('hidden');
      } finally {
        zStRunBtn.disabled = false;
      }
    });

    var zItModeToText = document.getElementById('zItModeToText');
    var zItModeToImg = document.getElementById('zItModeToImg');
    var zItToTextBox = document.getElementById('zItToTextBox');
    var zItToImgBox = document.getElementById('zItToImgBox');
    var zItErr = document.getElementById('zItErr');

    zItModeToText.addEventListener('click', function () {
      zItModeToText.classList.add('active');
      zItModeToImg.classList.remove('active');
      zItToTextBox.classList.remove('hidden');
      zItToImgBox.classList.add('hidden');
      zItErr.classList.add('hidden');
    });

    zItModeToImg.addEventListener('click', function () {
      zItModeToImg.classList.add('active');
      zItModeToText.classList.remove('active');
      zItToImgBox.classList.remove('hidden');
      zItToTextBox.classList.add('hidden');
      zItErr.classList.add('hidden');
    });

    document.getElementById('zItEncodeBtn').addEventListener('click', async function () {
      zItErr.classList.add('hidden');
      var fileInput = document.getElementById('zItFile');
      var file = fileInput.files && fileInput.files[0];
      if (!file) { zItErr.textContent = 'اختر صورة أولاً.'; zItErr.classList.remove('hidden'); return; }

      var maxChars = parseInt(document.getElementById('zItQuality').value, 10) || 35000;
      var pass = (document.getElementById('zItEncPass').value || '').trim();
      var btn = document.getElementById('zItEncodeBtn');
      btn.disabled = true;
      btn.textContent = 'جاري التحويل...';
      try {
        var res = await compressImageToTargetChars(file, maxChars);
        var outStr = '';
        if (pass) {
          var enc = await encryptBytes(res.bytes, pass);
          outStr = PREFIX_ENC + u8ToB64(enc);
        } else {
          outStr = PREFIX_PLAIN + u8ToB64(res.bytes);
        }
        document.getElementById('zItTextOut').value = outStr;
        document.getElementById('zItStatsBadge').textContent = outStr.length.toLocaleString('en-US') + ' حرف • ' + res.width + '×' + res.height;
        document.getElementById('zItTextOutWrap').classList.remove('hidden');
        showToastMsg('تم تحويل الصورة إلى نص بنجاح ✓');
      } catch (e) {
        zItErr.textContent = (e && e.message) ? e.message : 'تعذر تحويل الصورة.';
        zItErr.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = 'تحويل الصورة إلى نص';
      }
    });

    document.getElementById('zItCopyBtn').addEventListener('click', function () {
      var val = document.getElementById('zItTextOut').value || '';
      navigator.clipboard.writeText(val).then(function () {
        showToastMsg('تم نسخ النص — جاهز للإرسال عبر واتساب ✓');
      });
    });

    document.getElementById('zItDecodeBtn').addEventListener('click', async function () {
      zItErr.classList.add('hidden');
      var raw = (document.getElementById('zItTextIn').value || '').trim();
      var pass = (document.getElementById('zItDecPass').value || '').trim();
      if (!raw) { zItErr.textContent = 'الصق النص المحوّل أولاً.'; zItErr.classList.remove('hidden'); return; }

      try {
        var bytes;
        if (raw.indexOf(PREFIX_ENC) === 0) {
          if (!pass) throw new Error('هذا النص محمي بكلمة مرور، أدخل كلمة المرور أولاً.');
          bytes = await decryptBytes(b64ToU8(raw.slice(PREFIX_ENC.length)), pass);
        } else if (raw.indexOf(PREFIX_PLAIN) === 0) {
          bytes = b64ToU8(raw.slice(PREFIX_PLAIN.length));
        } else {
          bytes = b64ToU8(raw);
        }
        var isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8;
        var isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
        var mime = isJpeg ? 'image/jpeg' : (isPng ? 'image/png' : 'image/webp');
        var ext = isJpeg ? 'jpg' : (isPng ? 'png' : 'webp');
        var blob = new Blob([bytes], { type: mime });
        var url = URL.createObjectURL(blob);
        document.getElementById('zItImgOut').src = url;
        var dl = document.getElementById('zItDownloadImg');
        dl.href = url;
        dl.setAttribute('download', 'zoro_image.' + ext);
        document.getElementById('zItImgOutWrap').classList.remove('hidden');
        showToastMsg('تم استرجاع الصورة بنجاح ✓');
      } catch (e) {
        zItErr.textContent = (e && e.message) ? e.message : 'النص غير صالح أو كلمة المرور خاطئة.';
        zItErr.classList.remove('hidden');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountFilesProTabs);
  } else {
    mountFilesProTabs();
  }
})();
