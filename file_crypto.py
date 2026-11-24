import os
import struct
import tempfile
from Crypto.Cipher import AES, ChaCha20_Poly1305
from Crypto.Hash import SHA256
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Random import get_random_bytes

MAX_FILE_BYTES = 100 * 1024 * 1024
CHUNK_SIZE = 1024 * 1024
ZORO_MAGIC_V3 = b"ZORO3"
ZORO_MAGIC_V4 = b"ZORO4"
HEADER_SIZE = 34
TAG_SIZE = 16
MAX_FILENAME_BYTES = 255

_VERSION_CONFIG = {
    ZORO_MAGIC_V3: (100_000, False),
    ZORO_MAGIC_V4: (210_000, True),
}


def _make_aes(key: bytes, nonce: bytes):
    return AES.new(key, AES.MODE_GCM, nonce=nonce)


def _make_chacha(key: bytes, nonce: bytes):
    return ChaCha20_Poly1305.new(key=key, nonce=nonce)


_ENCRYPT_ALGOS = {
    "aes": (b"\x01", _make_aes),
    "chacha20": (b"\x02", _make_chacha),
}

_DECRYPT_ALGOS = {
    b"\x01": _make_aes,
    b"\x02": _make_chacha,
}


def _derive_key(password: str, salt: bytes, iterations: int = 210_000) -> bytes:
    return PBKDF2(
        password.encode("utf-8"),
        salt,
        dkLen=32,
        count=iterations,
        hmac_hash_module=SHA256,
    )


def _sanitize_filename(filename: str) -> bytes:
    base = os.path.basename(filename or "file.bin")
    cleaned = "".join(ch for ch in base if ord(ch) >= 32 and ch not in "\x00/\\")
    cleaned = cleaned.strip() or "file.bin"
    raw = cleaned.encode("utf-8")
    if len(raw) <= MAX_FILENAME_BYTES:
        return raw
    return (
        raw[:MAX_FILENAME_BYTES].decode("utf-8", errors="ignore").encode("utf-8")
        or b"file.bin"
    )


def encrypt_stream_to_temp(
    src_stream, original_filename: str, password: str, algorithm: str = "aes"
) -> str:
    if not password or not password.strip():
        raise ValueError("يرجى إدخال كلمة مرور قوية لتشفير الملف.")

    algo_key = (algorithm or "aes").lower().strip()
    algo_entry = _ENCRYPT_ALGOS.get(algo_key)
    if not algo_entry:
        raise ValueError("خوارزمية التشفير غير مدعومة. اختر AES أو ChaCha20.")

    fname_bytes = _sanitize_filename(original_filename)
    iterations, use_aad = _VERSION_CONFIG[ZORO_MAGIC_V4]
    salt = get_random_bytes(16)
    nonce = get_random_bytes(12)
    key = _derive_key(password, salt, iterations)
    algo_id, cipher_factory = algo_entry
    cipher = cipher_factory(key, nonce)

    header = ZORO_MAGIC_V4 + algo_id + salt + nonce
    if use_aad:
        cipher.update(header)

    fd, temp_path = tempfile.mkstemp(prefix="zoro_enc_", suffix=".zoro")
    total_read = 0
    max_mb = max(1, MAX_FILE_BYTES // (1024 * 1024))

    try:
        with os.fdopen(fd, "wb") as out_f:
            out_f.write(header)
            header_part = struct.pack(">H", len(fname_bytes)) + fname_bytes
            out_f.write(cipher.encrypt(header_part))

            while True:
                chunk = src_stream.read(CHUNK_SIZE)
                if not chunk:
                    break
                total_read += len(chunk)
                if total_read > MAX_FILE_BYTES:
                    raise ValueError(
                        f"حجم الملف يتجاوز الحد الأقصى المسموح به ({max_mb} ميجابايت)."
                    )
                out_f.write(cipher.encrypt(chunk))

            if total_read == 0:
                raise ValueError("الملف المختار فارغ.")

            out_f.write(cipher.digest())

        return temp_path
    except Exception:
        cleanup_temp_file(temp_path)
        raise


def decrypt_stream_to_temp(enc_stream, password: str) -> tuple:
    if not password or not password.strip():
        raise ValueError("يرجى إدخال كلمة المرور لفك تشفير الملف.")

    header = enc_stream.read(HEADER_SIZE)
    if len(header) != HEADER_SIZE:
        raise ValueError("ترويسة الملف المشفر غير مكتملة أو تالفة.")

    magic = header[:5]
    version_cfg = _VERSION_CONFIG.get(magic)
    if not version_cfg:
        raise ValueError("الملف غير صالح أو ليس ملف ZORO مشفراً (.zoro).")

    algo_byte = header[5:6]
    cipher_factory = _DECRYPT_ALGOS.get(algo_byte)
    if not cipher_factory:
        raise ValueError("نوع خوارزمية التشفير داخل الملف غير مدعوم.")

    salt = header[6:22]
    nonce = header[22:34]
    iterations, use_aad = version_cfg
    key = _derive_key(password, salt, iterations)
    cipher = cipher_factory(key, nonce)
    if use_aad:
        cipher.update(header)

    enc_stream.seek(0, os.SEEK_END)
    total_size = enc_stream.tell()

    if total_size < HEADER_SIZE + 2 + TAG_SIZE:
        raise ValueError("الملف المشفر تالف أو ناقص.")
    if total_size > MAX_FILE_BYTES + 65536:
        max_mb = max(1, MAX_FILE_BYTES // (1024 * 1024))
        raise ValueError(
            f"حجم الملف المشفر يتجاوز الحد الأقصى المسموح به ({max_mb} ميجابايت)."
        )

    payload_end = total_size - TAG_SIZE
    enc_stream.seek(HEADER_SIZE)

    len_bytes = cipher.decrypt(enc_stream.read(2))
    fname_len = struct.unpack(">H", len_bytes)[0]
    if (
        fname_len == 0
        or fname_len > 1024
        or (HEADER_SIZE + 2 + fname_len) > payload_end
    ):
        raise ValueError("كلمة المرور غير صحيحة أو بيانات الملف تالفة.")

    try:
        raw_name = cipher.decrypt(enc_stream.read(fname_len)).decode("utf-8")
    except Exception:
        raise ValueError("كلمة المرور غير صحيحة! تعذر التحقق من بيانات الملف.")

    clean_out_name = _sanitize_filename(raw_name).decode("utf-8")
    fd, temp_out_path = tempfile.mkstemp(prefix="zoro_dec_")

    try:
        with os.fdopen(fd, "wb") as out_f:
            remaining = payload_end - enc_stream.tell()
            while remaining > 0:
                chunk = enc_stream.read(min(CHUNK_SIZE, remaining))
                if not chunk:
                    raise ValueError("انتهى الملف المشفر بشكل غير متوقع.")
                remaining -= len(chunk)
                out_f.write(cipher.decrypt(chunk))

        tag = enc_stream.read(TAG_SIZE)
        if len(tag) != TAG_SIZE:
            raise ValueError("ختم التحقق غير مكتمل.")
        cipher.verify(tag)
        return clean_out_name, temp_out_path
    except Exception:
        cleanup_temp_file(temp_out_path)
        raise ValueError(
            "فشل فك التشفير! تأكد من صحة كلمة المرور وأن الملف لم يتعرض للتعديل."
        )


def cleanup_temp_file(path: str):
    if path and os.path.exists(path):
        try:
            os.remove(path)
        except OSError:
            pass
