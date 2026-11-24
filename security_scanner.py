import hashlib
import ipaddress
import os
import re
import socket
from urllib.parse import urljoin, urlparse
import requests

MAX_URL_LENGTH = 2048
MAX_SCAN_BYTES = 100 * 1024 * 1024
ALLOWED_SCHEMES = frozenset({"http", "https"})
ALLOWED_PORTS = frozenset({None, 80, 443, 8080, 8443})

PRIVATE_HOSTNAMES = frozenset(
    {
        "localhost",
        "localhost.localdomain",
        "ip6-localhost",
        "ip6-loopback",
    }
)

PRIVATE_SUFFIXES = (".local", ".internal", ".localhost", ".lan")

SUSPICIOUS_TLDS = frozenset(
    {".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".zip", ".mov"}
)

BRAND_KEYWORDS = frozenset(
    {
        "paypal",
        "apple",
        "google",
        "microsoft",
        "amazon",
        "netflix",
        "telegram",
        "instagram",
        "facebook",
    }
)

_SCHEME_RE = re.compile(r"^[a-zA-Z][a-zA-Z0-9+.-]*://")
_IPV4_RE = re.compile(r"^\d{1,3}(\.\d{1,3}){3}$")
_BRAND_RE = re.compile("|".join(sorted(BRAND_KEYWORDS)))

HIGH_RISK_EXTS = frozenset(
    {"exe", "bat", "cmd", "ps1", "vbs", "js", "scr", "msi", "apk", "dll", "sh"}
)

ALLOWED_EXT_MAP = {
    "png": frozenset({"png"}),
    "jpg": frozenset({"jpg", "jpeg"}),
    "gif": frozenset({"gif"}),
    "pdf": frozenset({"pdf"}),
    "zip": frozenset({"zip", "docx", "xlsx", "pptx", "apk", "jar", "odt"}),
    "exe": frozenset({"exe", "dll", "scr", "msi"}),
    "elf": frozenset({"elf", "bin", "so", "out"}),
}

_MAGIC_BY_FIRST_BYTE = {
    0x89: ((b"\x89PNG\r\n\x1a\n", "png", "PNG Image"),),
    0xFF: ((b"\xff\xd8\xff", "jpg", "JPEG Image"),),
    0x47: (
        (b"GIF87a", "gif", "GIF Image"),
        (b"GIF89a", "gif", "GIF Image"),
    ),
    0x25: ((b"%PDF-", "pdf", "PDF Document"),),
    0x50: ((b"PK\x03\x04", "zip", "ZIP / Office Archive"),),
    0x4D: ((b"MZ", "exe", "Windows Executable (PE)"),),
    0x7F: ((b"\x7fELF", "elf", "Linux Executable (ELF)"),),
}


def _is_blocked_ip(ip_str: str) -> bool:
    try:
        ip_obj = ipaddress.ip_address(ip_str)
        if getattr(ip_obj, "ipv4_mapped", None) is not None:
            ip_obj = ip_obj.ipv4_mapped
        return (
            not ip_obj.is_global
            or ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or ip_obj.is_reserved
            or ip_obj.is_unspecified
        )
    except ValueError:
        return True


def _validate_public_url(raw_url: str):
    cleaned = (raw_url or "").strip()
    if not cleaned:
        raise ValueError("يرجى إدخال رابط لفحصه.")
    if len(cleaned) > MAX_URL_LENGTH:
        raise ValueError("الرابط طويل جداً ويتجاوز الحد المسموح به.")

    if not _SCHEME_RE.match(cleaned):
        cleaned = "https://" + cleaned

    parsed = urlparse(cleaned)
    if parsed.scheme not in ALLOWED_SCHEMES:
        raise ValueError("يُسمح فقط بالروابط التي تبدأ بـ http:// أو https://.")

    try:
        port = parsed.port
    except ValueError:
        raise ValueError("رقم المنفذ في الرابط غير صالح.")
    if port not in ALLOWED_PORTS:
        raise ValueError(
            "تم حظر الفحص حمايةً من ثغرة SSRF: المنفذ المطلوب غير مسموح به."
        )

    host = (parsed.hostname or "").strip().lower().rstrip(".")
    if not host:
        raise ValueError("تعذر استخراج اسم النطاق أو العنوان من الرابط.")

    if host in PRIVATE_HOSTNAMES or host.endswith(PRIVATE_SUFFIXES):
        raise ValueError(
            "تم حظر الفحص حمايةً من ثغرة SSRF: لا يُسمح بفحص النطاقات الداخلية أو المحلية."
        )

    try:
        ipaddress.ip_address(host)
        if _is_blocked_ip(host):
            raise ValueError(
                "تم حظر الفحص حمايةً من ثغرة SSRF: العنوان يقع ضمن نطاق شبكي داخلي أو محجوز."
            )
    except ValueError as e:
        if "SSRF" in str(e):
            raise

    try:
        addr_info = socket.getaddrinfo(host, None)
        seen_ips = set()
        resolved_ips = []
        for item in addr_info:
            ip_val = item[4][0]
            if _is_blocked_ip(ip_val):
                raise ValueError(
                    "تم حظر الفحص حمايةً من ثغرة SSRF: النطاق يشير إلى عنوان شبكة داخلية أو محلي."
                )
            if ip_val not in seen_ips:
                seen_ips.add(ip_val)
                resolved_ips.append(ip_val)
    except ValueError as e:
        if "SSRF" in str(e):
            raise
        raise ValueError("تعذر تحليل عنوان النطاق (DNS) أو الوصول إليه.")
    except socket.gaierror:
        raise ValueError("تعذر العثور على النطاق (DNS lookup failed).")

    return cleaned, parsed, resolved_ips


def _detect_magic(head_bytes: bytes) -> tuple:
    if not head_bytes:
        return "غير معروف / بيانات خام", ""
    candidates = _MAGIC_BY_FIRST_BYTE.get(head_bytes[0])
    if not candidates:
        return "غير معروف / بيانات خام", ""
    for sig, ext, label in candidates:
        if head_bytes.startswith(sig):
            return label, ext
    return "غير معروف / بيانات خام", ""


def scan_url_target(raw_url: str) -> dict:
    normalized_url, parsed, resolved_ips = _validate_public_url(raw_url)
    host = (parsed.hostname or "").lower().rstrip(".")
    reasons = []
    risk_score = 0

    is_https = parsed.scheme == "https"
    if not is_https:
        risk_score += 25
        reasons.append("الرابط يستخدم HTTP غير المشفر ولا يعتمد HTTPS.")
    else:
        reasons.append("الرابط يستخدم بروتوكول HTTPS.")

    if _IPV4_RE.match(host):
        risk_score += 30
        reasons.append("الرابط يستخدم عنوان IP مباشراً بدلاً من اسم نطاق معروف.")

    if "xn--" in host:
        risk_score += 25
        reasons.append(
            "النطاق يستخدم ترميز Punycode (xn--) الذي يُستغل أحياناً في هجمات انتحال النطاقات."
        )

    if len(host) > 45 or host.count("-") >= 3:
        risk_score += 15
        reasons.append("اسم النطاق طويل أو يحتوي على عدد كبير من الشرطات.")

    if "." in host:
        tld = "." + host.rsplit(".", 1)[-1]
        if tld in SUSPICIOUS_TLDS:
            risk_score += 20
            reasons.append(
                f"النطاق ينتهي بامتداد ({tld}) الذي يُستخدم بكثرة في الروابط المشبوهة."
            )

    if "@" in normalized_url:
        risk_score += 35
        reasons.append(
            "الرابط يحتوي على الرمز (@) الذي يُستغل أحياناً لإخفاء الوجهة الحقيقية."
        )

    brand_match = _BRAND_RE.search(normalized_url.lower())
    if brand_match:
        brand = brand_match.group(0)
        parts = host.split(".")
        base_label = parts[-2] if len(parts) >= 2 else host
        if brand != base_label:
            risk_score += 25
            reasons.append(
                f"يظهر اسم علامة تجارية معروفة ({brand}) خارج نطاقها الأساسي (مؤشر تصيد محتمل)."
            )

    redirects = []
    final_url = normalized_url
    visited = {normalized_url}
    try:
        current_url = normalized_url
        for _ in range(4):
            with requests.get(
                current_url,
                timeout=(3, 5),
                allow_redirects=False,
                stream=True,
                headers={"User-Agent": "ZoroSecurityScanner/2.0"},
            ) as resp:
                status_code = resp.status_code
                location = resp.headers.get("Location")

            if 300 <= status_code < 400 and location:
                next_loc = urljoin(current_url, location)
                next_clean, _, _ = _validate_public_url(next_loc)
                redirects.append(
                    {"from": current_url, "to": next_clean, "status": status_code}
                )
                if next_clean in visited:
                    risk_score += 20
                    reasons.append("تم رصد حلقة إعادة توجيه متكررة (Redirect Loop).")
                    break
                visited.add(next_clean)
                current_url = next_clean
                final_url = next_clean
            else:
                break
        if redirects:
            reasons.append(
                f"رُصدت {len(redirects)} عملية إعادة توجيه بعد التحقق من أمان الوجهة."
            )
    except ValueError as e:
        risk_score += 40
        reasons.append(f"إعادة التوجيه وُجدت ولكنها رُفضت: {e}")
    except Exception:
        reasons.append(
            "تعذر إتمام طلب الشبكة المباشر للرابط (قد يكون محظوراً أو غير متاح حالياً)."
        )

    if risk_score >= 45:
        verdict = "malicious"
        verdict_ar = "خطير"
    elif risk_score >= 20:
        verdict = "suspicious"
        verdict_ar = "مشبوه"
    else:
        verdict = "safe"
        verdict_ar = "لم تُرصد تهديدات معروفة"

    return {
        "url": normalized_url,
        "final_url": final_url,
        "resolved_ips": resolved_ips,
        "https": is_https,
        "redirects": redirects,
        "verdict": verdict,
        "verdict_ar": verdict_ar,
        "reasons": reasons,
        "disclaimer": "ملاحظة: هذا الفحص يقلل المخاطر لكنه لا يضمن أمان الرابط بنسبة 100%؛ يُنصح دائماً بالحذر قبل فتح الروابط غير الموثوقة.",
    }


def scan_uploaded_file(
    file_stream, filename: str, allow_external: bool = False
) -> dict:
    clean_name = os.path.basename((filename or "unknown").strip()) or "unknown"
    parts = clean_name.rsplit(".", 2)
    ext = parts[-1].lower() if len(parts) >= 2 else ""

    if hasattr(file_stream, "seek"):
        try:
            file_stream.seek(0)
        except Exception:
            pass

    hasher = hashlib.sha256()
    total_size = 0
    head_bytes = b""

    while True:
        chunk = file_stream.read(1024 * 1024)
        if not chunk:
            break
        if isinstance(chunk, str):
            chunk = chunk.encode("utf-8")
        if len(head_bytes) < 32:
            head_bytes += chunk[: 32 - len(head_bytes)]
        total_size += len(chunk)
        if total_size > MAX_SCAN_BYTES:
            raise ValueError("حجم الملف يتجاوز الحد الأقصى المسموح به للفحص.")
        hasher.update(chunk)

    if total_size == 0:
        raise ValueError("الملف المختار فارغ.")

    sha256_hex = hasher.hexdigest()
    detected_type, detected_ext = _detect_magic(head_bytes)

    findings = []
    risk_level = "safe"
    risk_ar = "آمن ظاهرياً"

    if ext in HIGH_RISK_EXTS:
        risk_level = "suspicious"
        risk_ar = "مشبوه / ملف تنفيذي أو برمجي"
        findings.append(
            f"امتداد الملف (.{ext}) قابل للتنفيذ أو البرمجة؛ تأكد من مصدره قبل تشغيله."
        )
        if len(parts) == 3 and parts[1].lower() not in ("", ext):
            risk_level = "malicious"
            risk_ar = "خطير / امتداد مزدوج مخادع"
            findings.append(
                f"تم رصد امتداد مزدوج مخادع (.{parts[1]}.{ext}) يُستخدم غالباً في تمويه البرمجيات الخبيثة."
            )

    if ext and detected_ext:
        allowed_exts = ALLOWED_EXT_MAP.get(detected_ext)
        if allowed_exts is not None and ext not in allowed_exts:
            risk_level = "malicious"
            risk_ar = "خطير / عدم تطابق النوع والامتداد"
            findings.append(
                f"الامتداد المكتوب (.{ext}) لا يطابق البنية الفعلية للملف ({detected_type})."
            )
        else:
            findings.append("بنية الملف تتوافق مع امتداده الظاهري.")
    else:
        findings.append(f"النوع المكتشف من بداية الملف: {detected_type}.")

    if allow_external:
        external_note = "تم تسجيل موافقتك على المشاركة الخارجية (لم يتم ربط مفتاح API خارجي في هذا الفحص)."
    else:
        external_note = "تم الفحص محلياً فقط دون إرسال الملف إلى أي طرف ثالث."

    return {
        "filename": clean_name,
        "size_bytes": total_size,
        "sha256": sha256_hex,
        "detected_type": detected_type,
        "verdict": risk_level,
        "verdict_ar": risk_ar,
        "findings": findings,
        "external_note": external_note,
        "disclaimer": "تنبيه: الفحص لا يضمن خلو الملف من التهديدات بنسبة 100%.",
    }
