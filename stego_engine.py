import io
import struct
from PIL import Image
from crypto_engine import aes_encrypt, aes_decrypt

Image.MAX_IMAGE_PIXELS = 25_000_000

MAGIC_HEADER = b"ZSTG"
FLAG_AES = 1
HEADER_SIZE = 9
MAX_SECRET_TEXT_LEN = 50_000
MAX_PAYLOAD_BYTES = 200_000


def _bytes_to_bits(data: bytes):
    for byte in data:
        for shift in range(7, -1, -1):
            yield (byte >> shift) & 1


def _bits_to_bytes(raw_slice: bytes) -> bytes:
    out = bytearray()
    limit = len(raw_slice) - (len(raw_slice) % 8)
    for i in range(0, limit, 8):
        val = 0
        for b in raw_slice[i : i + 8]:
            val = (val << 1) | (b & 1)
        out.append(val)
    return bytes(out)


def hide_text_in_image(image_stream, secret_text: str, password: str) -> io.BytesIO:
    if not secret_text or not secret_text.strip():
        raise ValueError("يرجى إدخال النص السري المراد إخفاؤه.")
    if len(secret_text) > MAX_SECRET_TEXT_LEN:
        raise ValueError(
            f"النص طويل جداً. الحد الأقصى المسموح به هو {MAX_SECRET_TEXT_LEN:,} حرف."
        )

    pwd = (password or "").strip()
    if len(pwd) < 4:
        raise ValueError(
            "كلمة المرور إجبارية (4 خانات على الأقل) لتشفير النص قبل إخفائه داخل الصورة."
        )

    encrypted_str = aes_encrypt(secret_text, pwd)
    payload = encrypted_str.encode("utf-8")
    if len(payload) > MAX_PAYLOAD_BYTES:
        raise ValueError("حجم البيانات المشفرة يتجاوز الحد المسموح به.")

    header = MAGIC_HEADER + struct.pack(">BI", FLAG_AES, len(payload))
    full_data = header + payload
    total_bits = len(full_data) * 8

    try:
        with Image.open(image_stream) as img:
            img.load()
            rgb_img = img.convert("RGB")
            if max(rgb_img.size) > 1400:
                rgb_img.thumbnail((1400, 1400))
            width, height = rgb_img.size
            raw_bytes = bytearray(rgb_img.tobytes())
    except Image.DecompressionBombError:
        raise ValueError("أبعاد الصورة ضخمة جداً وتتجاوز الحد الأمني المسموح به.")
    except Exception:
        raise ValueError("الملف المرفوع ليس صورة صالحة.")

    capacity_bits = len(raw_bytes)
    if total_bits > capacity_bits:
        max_chars = max(0, (capacity_bits // 8) - HEADER_SIZE)
        raise ValueError(
            f"حجم النص المشفر أكبر من سعة الصورة المختارة. السعة التقريبية لهذه الصورة: {max_chars} بايت."
        )

    for idx, bit in enumerate(_bytes_to_bits(full_data)):
        raw_bytes[idx] = (raw_bytes[idx] & 0xFE) | bit

    out_img = Image.frombytes("RGB", (width, height), bytes(raw_bytes))
    output_buffer = io.BytesIO()
    out_img.save(output_buffer, format="PNG", optimize=False)
    output_buffer.seek(0)
    return output_buffer


def extract_text_from_image(image_stream, password: str) -> dict:
    pwd = (password or "").strip()
    if not pwd:
        raise ValueError("يرجى إدخال كلمة المرور لاستخراج وفك تشفير النص المخفي.")

    try:
        with Image.open(image_stream) as img:
            img.load()
            rgb_img = img.convert("RGB")
            raw_bytes = rgb_img.tobytes()
    except Image.DecompressionBombError:
        raise ValueError("أبعاد الصورة ضخمة جداً وتتجاوز الحد الأمني المسموح به.")
    except Exception:
        raise ValueError("الملف المرفوع ليس صورة صالحة.")

    header_bits_needed = HEADER_SIZE * 8
    if len(raw_bytes) < header_bits_needed:
        raise ValueError("الصورة صغيرة جداً ولا تحتوي على بيانات مخفية.")

    header_bytes = _bits_to_bytes(raw_bytes[:header_bits_needed])
    if header_bytes[:4] != MAGIC_HEADER:
        raise ValueError(
            "لم يتم العثور على أي نص مخفي بواسطة ZORO SECURITY داخل هذه الصورة."
        )

    flags, payload_len = struct.unpack(">BI", header_bytes[4:9])
    total_bits_needed = (HEADER_SIZE + payload_len) * 8

    if (
        payload_len <= 0
        or payload_len > MAX_PAYLOAD_BYTES
        or total_bits_needed > len(raw_bytes)
    ):
        raise ValueError(
            "البيانات المخفية داخل الصورة تالفة أو تم ضغط الصورة بعد الإخفاء."
        )

    if flags != FLAG_AES:
        raise ValueError("تنسيق البيانات المخفية غير مدعوم في هذا الإصدار المحصّن.")

    payload_bytes = _bits_to_bytes(raw_bytes[header_bits_needed:total_bits_needed])
    try:
        raw_text = payload_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise ValueError("تعذر قراءة النص المخفي؛ قد تكون الصورة تعرضت لتعديل أو ضغط.")

    decrypted = aes_decrypt(raw_text, pwd)
    return {"text": decrypted, "encrypted": True}
