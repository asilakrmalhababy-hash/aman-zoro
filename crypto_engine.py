import base64
import hashlib
import struct
from Crypto.Cipher import AES, DES, PKCS1_OAEP, ChaCha20_Poly1305
from Crypto.PublicKey import RSA
from Crypto.Hash import SHA256
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad

ENG_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
ENG_LOWER = "abcdefghijklmnopqrstuvwxyz"
ARABIC_CHARS = "ابتثجحخدذرزسشصضطظعغفقكلمنهويأإآةىؤئ"

_ENG_UPPER_LEN = len(ENG_UPPER)
_ENG_LOWER_LEN = len(ENG_LOWER)
_ARABIC_LEN = len(ARABIC_CHARS)

_ENG_UPPER_MAP = {ch: i for i, ch in enumerate(ENG_UPPER)}
_ENG_LOWER_MAP = {ch: i for i, ch in enumerate(ENG_LOWER)}
_ARABIC_MAP = {ch: i for i, ch in enumerate(ARABIC_CHARS)}
_PLAYFAIR_ALPHA = ENG_UPPER.replace("J", "")

PBKDF2_ITERATIONS = 210_000
LEGACY_PBKDF2_ITERATIONS = 100_000
TEXT_MAGIC_V2 = b"Z2"
ZORO_FILE_MAGIC = b"ZORO2"

_HASH_ALGOS = {
    "sha256": hashlib.sha256,
    "sha512": hashlib.sha512,
    "sha3-256": hashlib.sha3_256,
    "sha3-512": hashlib.sha3_512,
}


def _derive_key(
    password: str, salt: bytes, iterations: int = PBKDF2_ITERATIONS
) -> bytes:
    return PBKDF2(
        password.encode("utf-8"),
        salt,
        dkLen=32,
        count=iterations,
        hmac_hash_module=SHA256,
    )


def caesar_process(text: str, key: str, mode: str = "encrypt") -> str:
    try:
        shift = int((key or "").strip())
    except ValueError:
        raise ValueError("مفتاح Caesar يجب أن يكون رقماً صحيحاً (مثل: 3 أو 7).")

    if mode == "decrypt":
        shift = -shift

    s_up = shift % _ENG_UPPER_LEN
    s_lo = shift % _ENG_LOWER_LEN
    s_ar = shift % _ARABIC_LEN

    table = str.maketrans(
        ENG_UPPER + ENG_LOWER + ARABIC_CHARS,
        (ENG_UPPER[s_up:] + ENG_UPPER[:s_up])
        + (ENG_LOWER[s_lo:] + ENG_LOWER[:s_lo])
        + (ARABIC_CHARS[s_ar:] + ARABIC_CHARS[:s_ar]),
    )
    return text.translate(table)


def vigenere_process(text: str, key: str, mode: str = "encrypt") -> str:
    shifts = []
    for ch in key or "":
        up_idx = _ENG_UPPER_MAP.get(ch.upper())
        if up_idx is not None:
            shifts.append(up_idx)
        else:
            ar_idx = _ARABIC_MAP.get(ch)
            if ar_idx is not None:
                shifts.append(ar_idx)

    if not shifts:
        raise ValueError(
            "مفتاح Vigenère يجب أن يحتوي على حروف عربية أو إنجليزية (مثل: ZORO أو زورو)."
        )

    direction = 1 if mode == "encrypt" else -1
    shifts_len = len(shifts)
    result = []
    key_index = 0

    for ch in text:
        idx = _ENG_UPPER_MAP.get(ch)
        if idx is not None:
            cur = shifts[key_index % shifts_len] * direction
            result.append(ENG_UPPER[(idx + cur) % _ENG_UPPER_LEN])
            key_index += 1
            continue

        idx = _ENG_LOWER_MAP.get(ch)
        if idx is not None:
            cur = shifts[key_index % shifts_len] * direction
            result.append(ENG_LOWER[(idx + cur) % _ENG_LOWER_LEN])
            key_index += 1
            continue

        idx = _ARABIC_MAP.get(ch)
        if idx is not None:
            cur = shifts[key_index % shifts_len] * direction
            result.append(ARABIC_CHARS[(idx + cur) % _ARABIC_LEN])
            key_index += 1
            continue

        result.append(ch)
    return "".join(result)


def _build_playfair_matrix(key: str):
    clean_key = "".join(
        "I" if ch == "J" else ch for ch in (key or "").upper() if ch in _ENG_UPPER_MAP
    )
    if not clean_key:
        raise ValueError("مفتاح Playfair يجب أن يحتوي على حروف إنجليزية (مثل: ZORO).")

    seen = list(dict.fromkeys(clean_key + _PLAYFAIR_ALPHA))
    matrix = [seen[i : i + 5] for i in range(0, 25, 5)]
    pos = {matrix[r][c]: (r, c) for r in range(5) for c in range(5)}
    return matrix, pos


def playfair_process(text: str, key: str, mode: str = "encrypt") -> str:
    matrix, pos = _build_playfair_matrix(key)
    clean = "".join(
        "I" if ch == "J" else ch for ch in (text or "").upper() if ch in _ENG_UPPER_MAP
    )
    if not clean:
        raise ValueError(
            "خوارزمية Playfair الكلاسيكية تدعم الحروف الإنجليزية فقط (A-Z)."
        )

    if mode == "encrypt":
        pairs = []
        i = 0
        n = len(clean)
        while i < n:
            a = clean[i]
            if i + 1 < n:
                b = clean[i + 1]
                if a == b:
                    pairs.append((a, "X" if a != "X" else "Q"))
                    i += 1
                else:
                    pairs.append((a, b))
                    i += 2
            else:
                pairs.append((a, "X" if a != "X" else "Q"))
                i += 1
    else:
        if len(clean) % 2 != 0:
            raise ValueError(
                "النص المشفر بـ Playfair يجب أن يتكون من عدد زوجي من الحروف الإنجليزية."
            )
        pairs = [(clean[i], clean[i + 1]) for i in range(0, len(clean), 2)]

    shift = 1 if mode == "encrypt" else -1
    out = []
    for a, b in pairs:
        r1, c1 = pos[a]
        r2, c2 = pos[b]
        if r1 == r2:
            out.append(matrix[r1][(c1 + shift) % 5])
            out.append(matrix[r2][(c2 + shift) % 5])
        elif c1 == c2:
            out.append(matrix[(r1 + shift) % 5][c1])
            out.append(matrix[(r2 + shift) % 5][c2])
        else:
            out.append(matrix[r1][c2])
            out.append(matrix[r2][c1])
    return "".join(out)


def rail_fence_process(text: str, key: str, mode: str = "encrypt") -> str:
    try:
        num_rails = int((key or "").strip())
    except ValueError:
        raise ValueError(
            "مفتاح Rail Fence يجب أن يكون رقماً صحيحاً يمثل عدد الصفوف (مثل: 3)."
        )

    if num_rails < 2 or num_rails > 50:
        raise ValueError("عدد الصفوف في Rail Fence يجب أن يكون بين 2 و 50.")

    n = len(text)
    if n <= 1 or num_rails >= n:
        return text

    if mode == "encrypt":
        rails = [[] for _ in range(num_rails)]
        row, step = 0, 1
        for ch in text:
            rails[row].append(ch)
            if row == 0:
                step = 1
            elif row == num_rails - 1:
                step = -1
            row += step
        return "".join("".join(r) for r in rails)

    pattern = []
    rail_counts = [0] * num_rails
    row, step = 0, 1
    for _ in range(n):
        pattern.append(row)
        rail_counts[row] += 1
        if row == 0:
            step = 1
        elif row == num_rails - 1:
            step = -1
        row += step

    rail_slices = []
    idx = 0
    for count in rail_counts:
        rail_slices.append(text[idx : idx + count])
        idx += count

    rail_pos = [0] * num_rails
    result = []
    for r in pattern:
        p = rail_pos[r]
        result.append(rail_slices[r][p])
        rail_pos[r] = p + 1
    return "".join(result)


def aes_encrypt(text: str, password: str) -> str:
    if not (password or "").strip():
        raise ValueError("يرجى إدخال كلمة مرور (مفتاح) لتشفير AES.")

    salt = get_random_bytes(16)
    nonce = get_random_bytes(12)
    key = _derive_key(password, salt, PBKDF2_ITERATIONS)

    header = TEXT_MAGIC_V2 + salt + nonce
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    cipher.update(header)
    ciphertext, tag = cipher.encrypt_and_digest(text.encode("utf-8"))
    return base64.b64encode(header + tag + ciphertext).decode("utf-8")


def aes_decrypt(encrypted_b64: str, password: str) -> str:
    if not (password or "").strip():
        raise ValueError("يرجى إدخال كلمة المرور لفك تشفير AES.")

    try:
        raw = base64.b64decode((encrypted_b64 or "").strip(), validate=True)
        if raw.startswith(TEXT_MAGIC_V2) and len(raw) >= 46:
            header = raw[:30]
            salt, nonce, tag, ciphertext = raw[2:18], raw[18:30], raw[30:46], raw[46:]
            key = _derive_key(password, salt, PBKDF2_ITERATIONS)
            cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
            cipher.update(header)
            return cipher.decrypt_and_verify(ciphertext, tag).decode("utf-8")

        if len(raw) < 44:
            raise ValueError("النص المشفر غير صالح أو ناقص.")
        salt, nonce, tag, ciphertext = raw[:16], raw[16:28], raw[28:44], raw[44:]
        key = _derive_key(password, salt, LEGACY_PBKDF2_ITERATIONS)
        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        return cipher.decrypt_and_verify(ciphertext, tag).decode("utf-8")
    except Exception:
        raise ValueError("فشل فك تشفير AES! تأكد من أن المفتاح والنص المشفر صحيحان.")


def chacha20_encrypt(text: str, password: str) -> str:
    if not (password or "").strip():
        raise ValueError("يرجى إدخال كلمة مرور لتشفير ChaCha20.")

    salt = get_random_bytes(16)
    nonce = get_random_bytes(12)
    key = _derive_key(password, salt, PBKDF2_ITERATIONS)

    header = TEXT_MAGIC_V2 + salt + nonce
    cipher = ChaCha20_Poly1305.new(key=key, nonce=nonce)
    cipher.update(header)
    ciphertext, tag = cipher.encrypt_and_digest(text.encode("utf-8"))
    return base64.b64encode(header + tag + ciphertext).decode("utf-8")


def chacha20_decrypt(encrypted_b64: str, password: str) -> str:
    if not (password or "").strip():
        raise ValueError("يرجى إدخال كلمة المرور لفك تشفير ChaCha20.")

    try:
        raw = base64.b64decode((encrypted_b64 or "").strip(), validate=True)
        if raw.startswith(TEXT_MAGIC_V2) and len(raw) >= 46:
            header = raw[:30]
            salt, nonce, tag, ciphertext = raw[2:18], raw[18:30], raw[30:46], raw[46:]
            key = _derive_key(password, salt, PBKDF2_ITERATIONS)
            cipher = ChaCha20_Poly1305.new(key=key, nonce=nonce)
            cipher.update(header)
            return cipher.decrypt_and_verify(ciphertext, tag).decode("utf-8")

        if len(raw) < 44:
            raise ValueError("النص المشفر غير صالح أو ناقص.")
        salt, nonce, tag, ciphertext = raw[:16], raw[16:28], raw[28:44], raw[44:]
        key = _derive_key(password, salt, LEGACY_PBKDF2_ITERATIONS)
        cipher = ChaCha20_Poly1305.new(key=key, nonce=nonce)
        return cipher.decrypt_and_verify(ciphertext, tag).decode("utf-8")
    except Exception:
        raise ValueError("فشل فك تشفير ChaCha20! تأكد من صحة المفتاح والنص المشفر.")


def generate_rsa_keys() -> dict:
    key = RSA.generate(2048)
    return {
        "public_key": key.publickey().export_key().decode("utf-8"),
        "private_key": key.export_key().decode("utf-8"),
    }


def rsa_encrypt(text: str, public_key_pem: str) -> str:
    if not (public_key_pem or "").strip():
        raise ValueError("يرجى إدخال المفتاح العام (Public Key) أو توليده أولاً.")

    try:
        rsa_key = RSA.import_key(public_key_pem.strip())
        max_bytes = rsa_key.size_in_bytes() - 66
        if max_bytes <= 0:
            raise ValueError("حجم مفتاح RSA غير صالح للتشفير.")
        data = text.encode("utf-8")
        if len(data) > max_bytes:
            raise ValueError(
                f"النص طويل جداً لخوارزمية RSA. الحد الأقصى هو {max_bytes} بايت تقريباً."
            )
        cipher = PKCS1_OAEP.new(rsa_key, hashAlgo=SHA256)
        return base64.b64encode(cipher.encrypt(data)).decode("utf-8")
    except ValueError:
        raise
    except Exception:
        raise ValueError("المفتاح العام (Public Key) غير صالح! تأكد من نسخه بالكامل.")


def rsa_decrypt(encrypted_b64: str, private_key_pem: str) -> str:
    if not (private_key_pem or "").strip():
        raise ValueError("يرجى إدخال المفتاح الخاص (Private Key).")

    try:
        rsa_key = RSA.import_key(private_key_pem.strip())
        if not rsa_key.has_private():
            raise ValueError(
                "المفتاح المدخل مفتاح عام وليس مفتاحاً خاصاً (Private Key)."
            )
        cipher = PKCS1_OAEP.new(rsa_key, hashAlgo=SHA256)
        raw = base64.b64decode((encrypted_b64 or "").strip(), validate=True)
        return cipher.decrypt(raw).decode("utf-8")
    except ValueError:
        raise
    except Exception:
        raise ValueError(
            "فشل فك تشفير RSA! تأكد من استخدام المفتاح الخاص الصحيح والنص المشفر كاملاً."
        )


def des_encrypt(text: str, key: str) -> str:
    key_bytes = (key or "").encode("utf-8")
    if len(key_bytes) != 8:
        raise ValueError(
            "مفتاح DES يجب أن يتكون من 8 أحرف إنجليزية أو أرقام بالضبط (مثل: 12345678)."
        )

    iv = get_random_bytes(8)
    cipher = DES.new(key_bytes, DES.MODE_CBC, iv=iv)
    ciphertext = cipher.encrypt(pad(text.encode("utf-8"), DES.block_size))
    return base64.b64encode(iv + ciphertext).decode("utf-8")


def des_decrypt(encrypted_b64: str, key: str) -> str:
    key_bytes = (key or "").encode("utf-8")
    if len(key_bytes) != 8:
        raise ValueError("مفتاح DES يجب أن يتكون من 8 أحرف إنجليزية أو أرقام بالضبط.")

    try:
        raw = base64.b64decode((encrypted_b64 or "").strip(), validate=True)
        if len(raw) < 16:
            raise ValueError("النص المشفر غير صالح أو ناقص.")
        iv, ciphertext = raw[:8], raw[8:]
        cipher = DES.new(key_bytes, DES.MODE_CBC, iv=iv)
        return unpad(cipher.decrypt(ciphertext), DES.block_size).decode("utf-8")
    except Exception:
        raise ValueError("فشل فك تشفير DES! تأكد من صحة المفتاح والنص المشفر.")


def hash_text(text: str, algo: str = "sha256") -> str:
    ctor = _HASH_ALGOS.get((algo or "sha256").lower().strip(), hashlib.sha256)
    return ctor(text.encode("utf-8")).hexdigest()


def hash_bytes(data: bytes) -> dict:
    return {
        "sha256": hashlib.sha256(data).hexdigest(),
        "sha512": hashlib.sha512(data).hexdigest(),
        "md5": hashlib.md5(data).hexdigest(),
    }


def base64_process(text: str, mode: str = "encrypt") -> str:
    if mode == "encrypt":
        return base64.b64encode(text.encode("utf-8")).decode("utf-8")
    try:
        return base64.b64decode((text or "").strip(), validate=True).decode("utf-8")
    except Exception:
        raise ValueError("النص المدخل ليس ترميز Base64 صحيحاً.")


def encrypt_file_bytes(
    file_bytes: bytes, original_filename: str, password: str, algorithm: str = "aes"
) -> bytes:
    if not (password or "").strip():
        raise ValueError("يرجى إدخال كلمة مرور قوية لتشفير الملف.")

    fname_bytes = (original_filename or "file.bin").encode("utf-8")
    if len(fname_bytes) > 255:
        fname_bytes = fname_bytes[:255].decode("utf-8", errors="ignore").encode("utf-8")

    payload = struct.pack(">H", len(fname_bytes)) + fname_bytes + file_bytes
    salt = get_random_bytes(16)
    nonce = get_random_bytes(12)
    key = _derive_key(password, salt, LEGACY_PBKDF2_ITERATIONS)

    if algorithm == "chacha20":
        algo_id = b"\x02"
        cipher = ChaCha20_Poly1305.new(key=key, nonce=nonce)
    else:
        algo_id = b"\x01"
        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)

    ciphertext, tag = cipher.encrypt_and_digest(payload)
    return ZORO_FILE_MAGIC + algo_id + salt + nonce + tag + ciphertext


def decrypt_file_bytes(encrypted_bytes: bytes, password: str) -> tuple:
    if not (password or "").strip():
        raise ValueError("يرجى إدخال كلمة المرور لفك تشفير الملف.")

    if len(encrypted_bytes) < 52 or not encrypted_bytes.startswith(ZORO_FILE_MAGIC):
        raise ValueError(
            "هذا الملف ليس ملف ZORO مشفراً صالحاً (يجب أن يكون بامتداد .zoro)."
        )

    algo_id = encrypted_bytes[5]
    salt = encrypted_bytes[6:22]
    nonce = encrypted_bytes[22:34]
    tag = encrypted_bytes[34:50]
    ciphertext = encrypted_bytes[50:]
    key = _derive_key(password, salt, LEGACY_PBKDF2_ITERATIONS)

    try:
        if algo_id == 2:
            cipher = ChaCha20_Poly1305.new(key=key, nonce=nonce)
        elif algo_id == 1:
            cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        else:
            raise ValueError("خوارزمية الملف غير معروفة.")

        payload = cipher.decrypt_and_verify(ciphertext, tag)
        fname_len = struct.unpack(">H", payload[:2])[0]
        original_filename = payload[2 : 2 + fname_len].decode("utf-8")
        file_bytes = payload[2 + fname_len :]
        return original_filename, file_bytes
    except ValueError:
        raise
    except Exception:
        raise ValueError(
            "فشل فك تشفير الملف! تأكد من أن كلمة المرور صحيحة وأن الملف لم يتلف."
        )
