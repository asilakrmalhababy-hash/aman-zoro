import hashlib
import mimetypes
import os
import time
from urllib.parse import quote
from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    send_file,
    after_this_request,
)
from stats_store import (
    init_db,
    get_settings,
    update_settings,
    increment_stat,
    get_stats,
    reset_stats,
    add_activity_log,
    record_security_event,
    record_activity,
    is_ip_banned,
    ban_ip,
    unban_ip,
    is_user_banned,
    set_user_ban,
    authenticate_admin,
    list_admins,
    add_admin_account,
    update_admin_role,
    set_admin_ban,
    remove_admin_account,
    change_admin_pin,
    get_admin_overview,
    clear_admin_logs,
)
from security_scanner import scan_url_target, scan_uploaded_file
from crypto_engine import (
    caesar_process,
    vigenere_process,
    playfair_process,
    rail_fence_process,
    aes_encrypt,
    aes_decrypt,
    chacha20_encrypt,
    chacha20_decrypt,
    generate_rsa_keys,
    rsa_encrypt,
    rsa_decrypt,
    des_encrypt,
    des_decrypt,
)
import file_crypto as fc_mod
from stego_engine import hide_text_in_image, extract_text_from_image

app = Flask("zoro_security", template_folder="templates", static_folder="static")
app.config["MAX_CONTENT_LENGTH"] = fc_mod.MAX_FILE_BYTES + (2 * 1024 * 1024)

TRUST_PROXY = os.environ.get("TRUST_PROXY", "0") == "1"
MAX_TEXT_LENGTH = 100_000
MAX_TRACKER_ENTRIES = 2000

_failed_login_tracker = {}
_rate_buckets = {}

ALGO_NAMES = {
    "aes": "AES-256-GCM",
    "chacha20": "ChaCha20-Poly1305",
    "rsa": "RSA-2048",
    "caesar": "Caesar Cipher",
    "vigenere": "Vigenère Cipher",
    "playfair": "Playfair Cipher",
    "railfence": "Rail Fence Cipher",
    "des": "DES (تعليمي فقط - غير آمن)",
}

HASH_FUNCS = {
    "sha256": hashlib.sha256,
    "sha512": hashlib.sha512,
    "sha3-256": hashlib.sha3_256,
    "sha3-512": hashlib.sha3_512,
    "sha3": hashlib.sha3_256,
}


def _client_ip() -> str:
    if TRUST_PROXY:
        forwarded = request.headers.get("X-Forwarded-For", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return (request.remote_addr or "127.0.0.1").strip()


def _prune_trackers(now: float):
    if len(_rate_buckets) > MAX_TRACKER_ENTRIES:
        cutoff = now - 60.0
        stale = [k for k, v in _rate_buckets.items() if not v or v[-1] <= cutoff]
        for k in stale:
            _rate_buckets.pop(k, None)
    if len(_failed_login_tracker) > MAX_TRACKER_ENTRIES:
        stale_auth = [
            k
            for k, v in _failed_login_tracker.items()
            if v.get("lock_until", 0) <= now and v.get("last_fail", 0) <= now - 300
        ]
        for k in stale_auth:
            _failed_login_tracker.pop(k, None)


import re as _re
import requests as _requests

_geo_cache = {}

def _detect_device_name() -> str:
    ua = request.headers.get("User-Agent") or ""
    ch_model = (request.headers.get("Sec-CH-UA-Model") or "").strip().strip('"').strip("'")
    if ch_model and ch_model.lower() not in ("k", "unknown"):
        if ch_model.upper().startswith(("SM-", "GT-", "SC-")):
            return f"📱 Samsung {ch_model}"
        return f"📱 {ch_model}"
    if "iPhone" in ua:
        return "📱 iPhone"
    if "iPad" in ua:
        return "📱 iPad"
    if "Android" in ua:
        m = _re.search(r"Android\s+[^;)]+;\s*([^;)]+)", ua)
        if m:
            model = m.group(1).split("Build/")[0].strip()
            if model and model.lower() not in ("k", "wv", "mobile"):
                if model.upper().startswith(("SM-", "GT-", "SC-")):
                    return f"📱 Samsung {model}"
                return f"📱 {model}"
        return "📱 Android"
    if "Windows" in ua:
        return "💻 Windows PC"
    if "Macintosh" in ua or "Mac OS" in ua:
        return "💻 Mac"
    if "Linux" in ua:
        return "💻 Linux"
    return "🌐 متصفح ويب"

def _lookup_geo(ip: str) -> str:
    if not ip or ip.startswith(("127.", "10.", "192.168.", "::1", "localhost")):
        return "محلي"
    if ip in _geo_cache:
        return _geo_cache[ip]
    country_hdr = (request.headers.get("CF-IPCountry") or request.headers.get("X-Country-Code") or "").strip()
    label = ""
    try:
        r = _requests.get(
            f"http://ip-api.com/json/{ip}?fields=status,country,city&lang=ar",
            timeout=1.5,
        )
        if r.ok:
            d = r.json()
            if d.get("status") == "success":
                c = (d.get("country") or "").strip()
                city = (d.get("city") or "").strip()
                label = f"{c} ({city})" if (c and city and city != c) else (c or city)
    except Exception:
        pass
    if not label and country_hdr and country_hdr != "XX":
        label = country_hdr
    if len(_geo_cache) > 2000:
        _geo_cache.clear()
    if label:
        _geo_cache[ip] = label
    return label

def _extract_user_from_request() -> dict:
    ip = _client_ip()
    uid = (request.headers.get("X-Zoro-User-Id") or "").strip()
    fname = (request.headers.get("X-Zoro-Fullname") or "").strip()
    src = (request.headers.get("X-Zoro-Source") or "web").strip()

    if not uid:
        uid = f"web_{ip}"
    if not fname:
        device = _detect_device_name()
        geo = _lookup_geo(ip)
        fname = f"{device} — 🌍 {geo}" if geo else f"{device} ({ip})"
    return {
        "user_id": uid[:64],
        "full_name": fname[:100],
        "source": src[:20] or "web",
    }


def _verify_admin_request() -> tuple:
    username = (request.headers.get("X-Admin-User") or "").strip()
    pin = (request.headers.get("X-Admin-Pin") or "").strip()
    if not username or not pin:
        data = request.get_json(silent=True) or {}
        username = username or str(data.get("username") or "").strip()
        pin = pin or str(data.get("pin") or "").strip()

    ip = _client_ip()
    now = time.time()
    _prune_trackers(now)

    rec = _failed_login_tracker.get(ip)
    if rec and rec.get("lock_until", 0) > now:
        wait_s = int(rec["lock_until"] - now) + 1
        return (
            None,
            f"تم قفل محاولات الدخول مؤقتاً ({wait_s} ثانية) بسبب تكرار المحاولات الفاشلة.",
        )

    admin_obj, err = authenticate_admin(username, pin)
    if admin_obj:
        _failed_login_tracker.pop(ip, None)
        return admin_obj, ""

    fails = (rec.get("fails", 0) if rec else 0) + 1
    lock_until = now + 120 if fails >= 5 else 0
    _failed_login_tracker[ip] = {
        "fails": fails,
        "lock_until": lock_until,
        "last_fail": now,
    }
    record_security_event(
        "محاولة دخول أدمن فاشلة", username or "unknown", ip, f"المحاولة #{fails}"
    )
    return None, err


def _check_rate_limit(ip_key: str, limit_per_min: int) -> bool:
    if limit_per_min <= 0:
        return True
    now = time.time()
    _prune_trackers(now)
    window_start = now - 60.0
    arr = [t for t in _rate_buckets.get(ip_key, []) if t > window_start]
    if len(arr) >= limit_per_min:
        _rate_buckets[ip_key] = arr
        return False
    arr.append(now)
    _rate_buckets[ip_key] = arr
    return True


def _sync_max_file_limit(settings: dict):
    try:
        mb = max(1, min(500, int(settings.get("max_file_mb", "100"))))
    except ValueError:
        mb = 100
    fc_mod.MAX_FILE_BYTES = mb * 1024 * 1024
    app.config["MAX_CONTENT_LENGTH"] = fc_mod.MAX_FILE_BYTES + (2 * 1024 * 1024)
    return mb


@app.before_request
def security_gatekeeper():
    ip = _client_ip()
    ip_banned, ip_reason = is_ip_banned(ip)
    if ip_banned:
        if request.path.startswith("/api/"):
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"تم حظر عنوان IP الخاص بك: {ip_reason}",
                    }
                ),
                403,
            )
        return "<h3>تم حظر الوصول من هذا العنوان بواسطة إدارة ZORO SECURITY.</h3>", 403

    settings = get_settings()
    max_mb = _sync_max_file_limit(settings)

    if request.path.startswith("/api/") and not request.path.startswith("/api/admin/"):
        user_info = _extract_user_from_request()
        u_banned, u_reason = is_user_banned(user_info["user_id"])
        if u_banned:
            record_security_event(
                "محاولة وصول مستخدم محظور", user_info["user_id"], ip, request.path
            )
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"تم حظر وصولك: {u_reason}",
                        "banned": True,
                    }
                ),
                403,
            )

        try:
            rpm = int(settings.get("rate_limit_per_min", "45"))
        except ValueError:
            rpm = 45
        if not _check_rate_limit(ip, rpm):
            record_security_event(
                "تجاوز Rate Limit",
                user_info["user_id"],
                ip,
                f"{request.path} ({rpm}/min)",
            )
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "تم تجاوز الحد المسموح للطلبات في الدقيقة، يرجى الانتظار قليلاً.",
                    }
                ),
                429,
            )

        if settings.get("maintenance_mode") == "1" and request.path not in (
            "/api/health",
            "/api/session/ping",
        ):
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "المنصة في وضع الصيانة حالياً، يرجى المحاولة لاحقاً.",
                        "maintenance": True,
                    }
                ),
                503,
            )

        tool_map = {
            "/api/encrypt": ("tool_text_crypto", "تشفير النصوص"),
            "/api/decrypt": ("tool_text_crypto", "فك تشفير النصوص"),
            "/api/generate-rsa": ("tool_text_crypto", "توليد مفاتيح RSA"),
            "/api/file/encrypt": ("tool_file_crypto", "تشفير الملفات"),
            "/api/file/decrypt": ("tool_file_crypto", "فك تشفير الملفات"),
            "/api/stego/hide": ("tool_file_crypto", "إخفاء النصوص داخل الصور"),
            "/api/stego/extract": ("tool_file_crypto", "استخراج النصوص من الصور"),
            "/api/hash/text": ("tool_hashing", "البصمة الرقمية"),
            "/api/hash/file": ("tool_hashing", "البصمة الرقمية"),
            "/api/scan/url": ("tool_scanner", "الفاحص الأمني"),
            "/api/scan/file": ("tool_scanner", "الفاحص الأمني"),
        }
        if request.path in tool_map:
            s_key, t_label = tool_map[request.path]
            if settings.get(s_key, "1") != "1":
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": f"أداة ({t_label}) معطلة مؤقتاً من قبل الإدارة.",
                        }
                    ),
                    423,
                )

    request.zoro_max_mb = max_mb


@app.after_request
def apply_security_headers(response):
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Accept-CH"] = "Sec-CH-UA-Model, Sec-CH-UA-Platform"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: blob:; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; "
        "base-uri 'self';"
    )
    if request.path.startswith("/api/admin/"):
        response.headers["Cache-Control"] = (
            "no-store, no-cache, must-revalidate, max-age=0"
        )
        response.headers["Pragma"] = "no-cache"
    return response


@app.errorhandler(413)
def file_too_large(e):
    max_mb = getattr(request, "zoro_max_mb", 100)
    return (
        jsonify(
            {
                "success": False,
                "error": f"حجم الملف أكبر من الحد المسموح به ({max_mb} ميجابايت).",
            }
        ),
        413,
    )


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/session/ping", methods=["POST"])
def api_session_ping():
    user_info = _extract_user_from_request()
    record_activity(user_info, "زيارة المنصة", "دخول عبر المتصفح")
    settings = get_settings()
    return jsonify(
        {
            "success": True,
            "maintenance": settings.get("maintenance_mode") == "1",
            "max_file_mb": int(settings.get("max_file_mb", "100")),
        }
    )


@app.route("/api/health")
def api_health():
    settings = get_settings()
    maint = settings.get("maintenance_mode") == "1"
    return jsonify(
        {
            "status": "maintenance" if maint else "operational",
            "maintenance": maint,
            "platform": "ZORO SECURITY",
            "version": "5.0",
            "services": [
                {
                    "id": "text_crypto",
                    "name": "محرك تشفير النصوص",
                    "status": (
                        "online"
                        if settings.get("tool_text_crypto") == "1"
                        else "disabled"
                    ),
                    "detail": "AES-256-GCM / ChaCha20 / RSA-2048",
                },
                {
                    "id": "file_crypto",
                    "name": "حماية الصور والملفات",
                    "status": (
                        "online"
                        if settings.get("tool_file_crypto") == "1"
                        else "disabled"
                    ),
                    "detail": f"حتى {settings.get('max_file_mb', '100')}MB (.zoro)",
                },
                {
                    "id": "hashing",
                    "name": "محرك البصمة الرقمية",
                    "status": (
                        "online" if settings.get("tool_hashing") == "1" else "disabled"
                    ),
                    "detail": "SHA-256 / SHA-512 / SHA-3",
                },
                {
                    "id": "scanner",
                    "name": "الفاحص الأمني",
                    "status": (
                        "online" if settings.get("tool_scanner") == "1" else "disabled"
                    ),
                    "detail": "SSRF Guard • ملفات • كلمات مرور",
                },
                {
                    "id": "admin",
                    "name": "مركز الإدارة والأمان",
                    "status": "online",
                    "detail": "RBAC • حظر مؤقت/دائم • Rate Limit",
                },
            ],
        }
    )


@app.route("/api/admin/overview", methods=["POST"])
def api_admin_overview():
    adm, err = _verify_admin_request()
    if not adm:
        return jsonify({"success": False, "error": err}), 401
    return jsonify({"success": True, "admin": adm, "data": get_admin_overview()})


@app.route("/api/admin/user-ban", methods=["POST"])
def api_admin_user_ban():
    adm, err = _verify_admin_request()
    if not adm:
        return jsonify({"success": False, "error": err}), 401
    data = request.get_json(silent=True) or {}
    uid = str(data.get("user_id") or "").strip()
    banned = bool(data.get("banned", True))
    reason = str(data.get("reason") or "").strip()
    try:
        duration_hours = max(0, int(data.get("duration_hours") or 0))
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "مدة الحظر غير صالحة."}), 400
    if not uid:
        return jsonify({"success": False, "error": "يرجى تحديد معرّف المستخدم."}), 400
    set_user_ban(
        uid,
        banned=banned,
        reason=reason,
        duration_hours=duration_hours,
        actor_name=adm["full_name"],
    )
    return jsonify({"success": True, "data": get_admin_overview()})


@app.route("/api/admin/ip-ban", methods=["POST"])
def api_admin_ip_ban():
    adm, err = _verify_admin_request()
    if not adm:
        return jsonify({"success": False, "error": err}), 401
    data = request.get_json(silent=True) or {}
    action = data.get("action", "ban")
    ip_val = str(data.get("ip") or "").strip()
    reason = str(data.get("reason") or "نشاط مخالف").strip()
    try:
        if action == "unban":
            unban_ip(ip_val)
            add_activity_log("admin", adm["full_name"], "فك حظر IP", ip_val)
        else:
            ban_ip(ip_val, reason=reason)
            add_activity_log(
                "admin", adm["full_name"], "حظر عنوان IP", f"{ip_val} ({reason})"
            )
        return jsonify({"success": True, "data": get_admin_overview()})
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/api/admin/admins", methods=["POST"])
def api_admin_manage():
    adm, err = _verify_admin_request()
    if not adm:
        return jsonify({"success": False, "error": err}), 401
    if adm["role"] != "super_admin":
        record_security_event(
            "محاولة صلاحية Super Admin",
            adm["username"],
            _client_ip(),
            "إدارة المسؤولين",
        )
        return (
            jsonify(
                {"success": False, "error": "هذا الإجراء متاح لحساب Super Admin فقط."}
            ),
            403,
        )

    data = request.get_json(silent=True) or {}
    op = data.get("op")
    try:
        if op == "add":
            new_uname = str(
                data.get("new_username") or data.get("username") or ""
            ).strip()
            new_fname = str(data.get("full_name") or "").strip()
            new_role = str(data.get("role") or "admin").strip()
            new_pin = str(data.get("new_pin") or data.get("pin") or "").strip()

            add_admin_account(
                username=new_uname,
                full_name=new_fname,
                role=new_role,
                pin=new_pin,
                actor_name=adm["full_name"],
            )
        elif op == "role":
            update_admin_role(
                data.get("admin_id", ""),
                data.get("role", "admin"),
                actor_name=adm["full_name"],
            )
        elif op == "ban":
            set_admin_ban(
                data.get("admin_id", ""),
                bool(data.get("banned", True)),
                actor_name=adm["full_name"],
            )
        elif op == "delete":
            remove_admin_account(data.get("admin_id", ""), actor_name=adm["full_name"])
        else:
            return jsonify({"success": False, "error": "عملية غير معروفة."}), 400
        return jsonify(
            {"success": True, "data": get_admin_overview(), "admins": list_admins()}
        )
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/api/admin/settings", methods=["POST"])
def api_admin_settings():
    adm, err = _verify_admin_request()
    if not adm:
        return jsonify({"success": False, "error": err}), 401
    data = request.get_json(silent=True) or {}
    try:
        if data.get("new_pin"):
            change_admin_pin(
                adm["admin_id"],
                str(data.get("new_pin")).strip(),
                actor_name=adm["full_name"],
            )

        updates = data.get("settings") or {}
        wants_platform_change = (
            bool(updates)
            or bool(data.get("reset_stats"))
            or bool(data.get("clear_logs"))
        )

        if wants_platform_change and adm["role"] != "super_admin":
            record_security_event(
                "محاولة تعديل إعدادات حساسة",
                adm["username"],
                _client_ip(),
                "مرفوضة (Admin عادي)",
            )
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "تعديل إعدادات المنصة ومسح السجلات متاح لحساب Super Admin فقط.",
                    }
                ),
                403,
            )

        if updates:
            update_settings(updates)
            add_activity_log(
                "admin",
                adm["full_name"],
                "تحديث إعدادات المنصة",
                str(list(updates.keys())),
            )

        if data.get("reset_stats"):
            reset_stats()
            add_activity_log(
                "admin", adm["full_name"], "تصفير الإحصائيات", "تم تصفير عدادات المنصة"
            )

        if data.get("clear_logs"):
            clear_admin_logs(actor_name=adm["full_name"])

        return jsonify({"success": True, "data": get_admin_overview()})
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/api/stats", methods=["GET"])
def api_stats():
    return jsonify({"success": True, "stats": get_stats()})


@app.route("/api/scan/url", methods=["POST"])
def api_scan_url():
    data = request.get_json(silent=True) or {}
    target_url = data.get("url") or ""
    user_info = _extract_user_from_request()
    try:
        report = scan_url_target(target_url)
        increment_stat("security_scans")
        record_activity(
            user_info,
            "فحص رابط",
            f"النتيجة: {report['verdict_ar']} | {report['url'][:70]}",
        )
        return jsonify({"success": True, "report": report})
    except ValueError as e:
        record_activity(user_info, "محاولة فحص رابط مرفوضة", str(e)[:100])
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception:
        return jsonify({"success": False, "error": "حدث خطأ أثناء فحص الرابط."}), 500


@app.route("/api/scan/file", methods=["POST"])
def api_scan_file():
    file = request.files.get("file")
    allow_external = (request.form.get("allow_external") or "").lower() in (
        "1",
        "true",
        "yes",
    )
    user_info = _extract_user_from_request()

    if not file or not file.filename:
        return jsonify({"success": False, "error": "يرجى اختيار ملف لفحصه."}), 400

    try:
        report = scan_uploaded_file(
            file.stream, file.filename, allow_external=allow_external
        )
        increment_stat("security_scans")
        record_activity(
            user_info, "فحص ملف", f"{report['filename']} ({report['verdict_ar']})"
        )
        return jsonify({"success": True, "report": report})
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception:
        return jsonify({"success": False, "error": "حدث خطأ أثناء فحص الملف."}), 500


@app.route("/api/encrypt", methods=["POST"])
def api_encrypt():
    data = request.get_json(silent=True) or {}
    algorithm = (data.get("algorithm") or "").lower().strip()
    text = data.get("text") or ""
    key = data.get("key") or ""
    user_info = _extract_user_from_request()

    if not text:
        return (
            jsonify({"success": False, "error": "يرجى إدخال النص المراد تشفيره."}),
            400,
        )
    if len(text) > MAX_TEXT_LENGTH:
        return (
            jsonify(
                {
                    "success": False,
                    "error": f"النص طويل جداً. الحد الأقصى المسموح به هو {MAX_TEXT_LENGTH:,} حرف.",
                }
            ),
            413,
        )

    try:
        warning = None
        if algorithm == "aes":
            result = aes_encrypt(text, key)
        elif algorithm == "chacha20":
            result = chacha20_encrypt(text, key)
        elif algorithm == "rsa":
            result = rsa_encrypt(text, key)
        elif algorithm == "caesar":
            result = caesar_process(text, key, mode="encrypt")
            warning = "خوارزمية كلاسيكية قديمة تُستخدم للتعلم فقط ولا تصلح لحماية البيانات الحقيقية."
        elif algorithm == "vigenere":
            result = vigenere_process(text, key, mode="encrypt")
            warning = "خوارزمية كلاسيكية قديمة تُستخدم للأغراض التعليمية فقط."
        elif algorithm == "playfair":
            result = playfair_process(text, key, mode="encrypt")
            warning = "خوارزمية Playfair كلاسيكية تدعم الإنجليزية فقط وتُستخدم للأغراض التعليمية."
        elif algorithm == "railfence":
            result = rail_fence_process(text, key, mode="encrypt")
            warning = "خوارزمية تبديل كلاسيكية قديمة تُستخدم للتعلم فقط."
        elif algorithm == "des":
            result = des_encrypt(text, key)
            warning = "تحذير أمني: خوارزمية DES قديمة وغير آمنة، وتُستخدم هنا لأغراض تعليمية فقط."
        else:
            return (
                jsonify({"success": False, "error": "يرجى اختيار خوارزمية صحيحة."}),
                400,
            )

        increment_stat("encryptions")
        record_activity(
            user_info,
            "تشفير نص",
            f"الخوارزمية: {ALGO_NAMES[algorithm]} ({len(text)} حرف)",
        )
        return jsonify(
            {
                "success": True,
                "algorithm": ALGO_NAMES[algorithm],
                "original_text": text,
                "result": result,
                "warning": warning,
                "bytes_in": len(text.encode("utf-8")),
                "bytes_out": len(result.encode("utf-8")),
            }
        )

    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception:
        return (
            jsonify({"success": False, "error": "حدث خطأ غير متوقع أثناء التشفير."}),
            500,
        )


@app.route("/api/decrypt", methods=["POST"])
def api_decrypt():
    data = request.get_json(silent=True) or {}
    algorithm = (data.get("algorithm") or "").lower().strip()
    text = data.get("text") or ""
    key = data.get("key") or ""
    user_info = _extract_user_from_request()

    if not text:
        return jsonify({"success": False, "error": "يرجى إدخال النص المشفر."}), 400
    if len(text) > MAX_TEXT_LENGTH * 2:
        return (
            jsonify({"success": False, "error": "النص المشفر يتجاوز الحد المسموح به."}),
            413,
        )

    try:
        if algorithm == "aes":
            result = aes_decrypt(text, key)
        elif algorithm == "chacha20":
            result = chacha20_decrypt(text, key)
        elif algorithm == "rsa":
            result = rsa_decrypt(text, key)
        elif algorithm == "caesar":
            result = caesar_process(text, key, mode="decrypt")
        elif algorithm == "vigenere":
            result = vigenere_process(text, key, mode="decrypt")
        elif algorithm == "playfair":
            result = playfair_process(text, key, mode="decrypt")
        elif algorithm == "railfence":
            result = rail_fence_process(text, key, mode="decrypt")
        elif algorithm == "des":
            result = des_decrypt(text, key)
        else:
            return (
                jsonify({"success": False, "error": "يرجى اختيار خوارزمية صحيحة."}),
                400,
            )

        increment_stat("decryptions")
        record_activity(
            user_info, "فك تشفير نص", f"الخوارزمية: {ALGO_NAMES[algorithm]}"
        )
        return jsonify(
            {
                "success": True,
                "algorithm": ALGO_NAMES[algorithm],
                "result": result,
                "bytes_in": len(text.encode("utf-8")),
                "bytes_out": len(result.encode("utf-8")),
            }
        )

    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception:
        return (
            jsonify({"success": False, "error": "حدث خطأ غير متوقع أثناء فك التشفير."}),
            500,
        )


@app.route("/api/generate-rsa", methods=["POST"])
def api_generate_rsa():
    user_info = _extract_user_from_request()
    try:
        keys = generate_rsa_keys()
        record_activity(user_info, "توليد مفاتيح RSA-2048", "زوج مفاتيح عام/خاص")
        return jsonify(
            {
                "success": True,
                "public_key": keys["public_key"],
                "private_key": keys["private_key"],
            }
        )
    except Exception:
        return jsonify({"success": False, "error": "فشل توليد مفاتيح RSA."}), 500


@app.route("/api/hash/text", methods=["POST"])
def api_hash_text():
    data = request.get_json(silent=True) or {}
    text = data.get("text") or ""
    algo = (data.get("algorithm") or "sha256").lower().strip()
    user_info = _extract_user_from_request()

    if not text:
        return (
            jsonify({"success": False, "error": "يرجى إدخال نص لتوليد بصمته الرقمية."}),
            400,
        )
    if len(text) > MAX_TEXT_LENGTH:
        return (
            jsonify(
                {
                    "success": False,
                    "error": f"النص طويل جداً. الحد الأقصى المسموح به هو {MAX_TEXT_LENGTH:,} حرف.",
                }
            ),
            413,
        )

    hash_ctor = HASH_FUNCS.get(algo)
    if not hash_ctor:
        return jsonify({"success": False, "error": "خوارزمية التجزئة غير مدعومة."}), 400

    digest = hash_ctor(text.encode("utf-8")).hexdigest()
    increment_stat("encryptions")
    record_activity(user_info, "بصمة نص", f"الخوارزمية: {algo.upper()}")
    return jsonify(
        {
            "success": True,
            "algorithm": algo.upper(),
            "digest": digest,
            "length": len(digest),
        }
    )


@app.route("/api/hash/file", methods=["POST"])
def api_hash_file():
    file = request.files.get("file")
    algo = (request.form.get("algorithm") or "sha256").lower().strip()
    user_info = _extract_user_from_request()

    if not file or not file.filename:
        return jsonify({"success": False, "error": "يرجى اختيار ملف أولاً."}), 400

    hash_ctor = HASH_FUNCS.get(algo)
    if not hash_ctor:
        return jsonify({"success": False, "error": "خوارزمية التجزئة غير مدعومة."}), 400

    try:
        hasher = hash_ctor()
        total_size = 0
        while True:
            chunk = file.stream.read(1024 * 1024)
            if not chunk:
                break
            total_size += len(chunk)
            if total_size > fc_mod.MAX_FILE_BYTES:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": f"حجم الملف يتجاوز {request.zoro_max_mb} ميجابايت.",
                        }
                    ),
                    413,
                )
            hasher.update(chunk)

        if total_size == 0:
            return jsonify({"success": False, "error": "الملف المختار فارغ."}), 400

        increment_stat("files_processed")
        safe_name = os.path.basename(file.filename)
        record_activity(user_info, "بصمة ملف", f"{safe_name} ({algo.upper()})")
        digest = hasher.hexdigest()
        return jsonify(
            {
                "success": True,
                "filename": safe_name,
                "size": total_size,
                "algorithm": algo.upper(),
                "digest": digest,
            }
        )
    except Exception:
        return (
            jsonify({"success": False, "error": "تعذر حساب البصمة الرقمية للملف."}),
            500,
        )


@app.route("/api/file/encrypt", methods=["POST"])
def api_file_encrypt():
    file = request.files.get("file")
    password = request.form.get("key") or ""
    algorithm = (request.form.get("algorithm") or "aes").lower().strip()
    user_info = _extract_user_from_request()

    if not file or not file.filename:
        return (
            jsonify({"success": False, "error": "يرجى اختيار صورة أو ملف أولاً."}),
            400,
        )

    safe_name = os.path.basename(file.filename) or "file"
    temp_path = None
    try:
        temp_path = fc_mod.encrypt_stream_to_temp(
            file.stream, safe_name, password, algorithm=algorithm
        )
        increment_stat("files_processed")
        record_activity(user_info, "تشفير ملف", f"{safe_name} ({algorithm.upper()})")
        out_name = safe_name + ".zoro"

        @after_this_request
        def remove_file(response):
            fc_mod.cleanup_temp_file(temp_path)
            return response

        response = send_file(
            temp_path,
            mimetype="application/octet-stream",
            as_attachment=True,
            download_name="encrypted.zoro",
        )
        response.headers["X-Output-Filename"] = quote(out_name)
        return response

    except ValueError as e:
        fc_mod.cleanup_temp_file(temp_path)
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception:
        fc_mod.cleanup_temp_file(temp_path)
        return jsonify({"success": False, "error": "حدث خطأ أثناء تشفير الملف."}), 500


@app.route("/api/file/decrypt", methods=["POST"])
def api_file_decrypt():
    file = request.files.get("file")
    password = request.form.get("key") or ""
    user_info = _extract_user_from_request()

    if not file or not file.filename:
        return (
            jsonify(
                {"success": False, "error": "يرجى اختيار الملف المشفر (.zoro) أولاً."}
            ),
            400,
        )

    temp_path = None
    try:
        original_name, temp_path = fc_mod.decrypt_stream_to_temp(file.stream, password)
        safe_orig = os.path.basename(original_name) or "decrypted_file"
        increment_stat("files_processed")
        record_activity(user_info, "فك تشفير ملف", f"{safe_orig}")
        guessed_mime = mimetypes.guess_type(safe_orig)[0] or "application/octet-stream"

        @after_this_request
        def remove_file(response):
            fc_mod.cleanup_temp_file(temp_path)
            return response

        response = send_file(
            temp_path,
            mimetype=guessed_mime,
            as_attachment=True,
            download_name="decrypted_file",
        )
        response.headers["X-Output-Filename"] = quote(safe_orig)
        response.headers["X-Output-Mime"] = guessed_mime
        return response

    except ValueError as e:
        fc_mod.cleanup_temp_file(temp_path)
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception:
        fc_mod.cleanup_temp_file(temp_path)
        return (
            jsonify({"success": False, "error": "حدث خطأ أثناء فك تشفير الملف."}),
            500,
        )


@app.route("/api/stego/hide", methods=["POST"])
def api_stego_hide():
    image_file = request.files.get("image")
    secret_text = request.form.get("text") or ""
    password = request.form.get("key") or ""
    user_info = _extract_user_from_request()

    if not image_file or not image_file.filename:
        return jsonify({"success": False, "error": "يرجى اختيار صورة أولاً."}), 400

    safe_name = os.path.basename(image_file.filename)
    try:
        out_buffer = hide_text_in_image(
            image_file.stream, secret_text, password=password
        )
        increment_stat("files_processed")
        record_activity(
            user_info, "إخفاء نص داخل صورة", f"{safe_name} (AES-256-GCM + LSB)"
        )
        return send_file(
            out_buffer,
            mimetype="image/png",
            as_attachment=True,
            download_name="zoro_stego_encrypted.png",
        )
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception:
        return (
            jsonify(
                {"success": False, "error": "حدث خطأ أثناء إخفاء النص داخل الصورة."}
            ),
            500,
        )


@app.route("/api/stego/extract", methods=["POST"])
def api_stego_extract():
    image_file = request.files.get("image")
    password = request.form.get("key") or ""
    user_info = _extract_user_from_request()

    if not image_file or not image_file.filename:
        return jsonify({"success": False, "error": "يرجى اختيار صورة PNG أولاً."}), 400

    safe_name = os.path.basename(image_file.filename)
    try:
        res = extract_text_from_image(image_file.stream, password=password)
        increment_stat("decryptions")
        record_activity(user_info, "استخراج نص من صورة", safe_name)
        return jsonify(
            {"success": True, "text": res["text"], "encrypted": res["encrypted"]}
        )
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception:
        return (
            jsonify(
                {"success": False, "error": "حدث خطأ أثناء استخراج النص من الصورة."}
            ),
            500,
        )


init_db()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
