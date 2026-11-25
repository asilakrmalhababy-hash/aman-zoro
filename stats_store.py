import hashlib
import ipaddress
import os
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta

try:
    import pymysql
    from pymysql.cursors import DictCursor
except ImportError:
    pymysql = None
    DictCursor = None

try:
    import certifi
except ImportError:
    certifi = None

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "zoro_stats.db")
USE_TIDB = bool(os.environ.get("TIDB_HOST", "").strip())

PBKDF2_ITERATIONS = 210_000
LEGACY_PBKDF2_ITERATIONS = 100_000
_DUMMY_SALT = "0000000000000000"

DEFAULT_SETTINGS = {
    "max_file_mb": "100",
    "maintenance_mode": "0",
    "rate_limit_per_min": "45",
    "tool_text_crypto": "1",
    "tool_file_crypto": "1",
    "tool_hashing": "1",
    "tool_scanner": "1",
    "platform_tagline": "سهل الاستخدام. قوي في الحماية.",
}

ALLOWED_SETTINGS = frozenset(DEFAULT_SETTINGS.keys())
_STAT_FIELDS = frozenset(("encryptions", "decryptions", "files_processed", "security_scans"))


class _DBWrapper:
    def __init__(self, conn, is_mysql: bool):
        self._conn = conn
        self.is_mysql = is_mysql

    def _adapt(self, sql: str) -> str:
        return sql.replace("?", "%s") if self.is_mysql else sql

    def execute(self, sql: str, params=()):
        q = self._adapt(sql)
        if self.is_mysql:
            cur = self._conn.cursor()
            cur.execute(q, params)
            return cur
        return self._conn.execute(q, params)

    def fetchone(self, sql: str, params=()):
        cur = self.execute(sql, params)
        row = cur.fetchone()
        if self.is_mysql:
            cur.close()
        return row

    def fetchall(self, sql: str, params=()):
        cur = self.execute(sql, params)
        rows = cur.fetchall()
        if self.is_mysql:
            cur.close()
        return rows

    def commit(self):
        self._conn.commit()


@contextmanager
def _get_conn():
    if USE_TIDB:
        if pymysql is None:
            raise RuntimeError("PyMySQL is required when TIDB_HOST is set.")
        ssl_cfg = {"ca": certifi.where()} if certifi else {"ssl": {}}
        conn = pymysql.connect(
            host=os.environ["TIDB_HOST"].strip(),
            port=int(os.environ.get("TIDB_PORT", "4000")),
            user=os.environ["TIDB_USER"].strip(),
            password=os.environ["TIDB_PASSWORD"],
            database=os.environ.get("TIDB_DATABASE", "test").strip(),
            charset="utf8mb4",
            cursorclass=DictCursor,
            ssl=ssl_cfg,
            connect_timeout=10,
            read_timeout=15,
            write_timeout=15,
            autocommit=False,
        )
        wrapper = _DBWrapper(conn, is_mysql=True)
        try:
            yield wrapper
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    else:
        conn = sqlite3.connect(DB_PATH, timeout=10)
        conn.row_factory = sqlite3.Row
        wrapper = _DBWrapper(conn, is_mysql=False)
        try:
            yield wrapper
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()


def _hash_pin(pin: str, salt_hex: str = None) -> str:
    salt = salt_hex or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", pin.encode("utf-8"), salt.encode("utf-8"), PBKDF2_ITERATIONS
    ).hex()
    return f"pbkdf2${PBKDF2_ITERATIONS}${salt}${digest}"


def _verify_pin_hash(pin: str, stored: str) -> bool:
    if not stored or "$" not in stored:
        return False
    parts = stored.split("$")
    if len(parts) == 4 and parts[0] == "pbkdf2":
        try:
            iterations = int(parts[1])
        except ValueError:
            return False
        salt, expected = parts[2], parts[3]
    elif len(parts) == 2:
        iterations = LEGACY_PBKDF2_ITERATIONS
        salt, expected = parts[0], parts[1]
    else:
        return False
    computed = hashlib.pbkdf2_hmac(
        "sha256", pin.encode("utf-8"), salt.encode("utf-8"), iterations
    ).hex()
    return secrets.compare_digest(computed, expected)


def init_db():
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    default_pin = os.environ.get("ZORO_ADMIN_PIN", "zoro2026")

    with _get_conn() as db:
        if db.is_mysql:
            db.execute("""
                CREATE TABLE IF NOT EXISTS stats (
                    id INT PRIMARY KEY,
                    encryptions INT NOT NULL DEFAULT 0,
                    decryptions INT NOT NULL DEFAULT 0,
                    files_processed INT NOT NULL DEFAULT 0,
                    security_scans INT NOT NULL DEFAULT 0
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """)
            db.execute("INSERT IGNORE INTO stats (id) VALUES (1)")
            db.execute("""
                CREATE TABLE IF NOT EXISTS daily_activity (
                    day_date VARCHAR(20) PRIMARY KEY,
                    users_count INT NOT NULL DEFAULT 0,
                    actions_count INT NOT NULL DEFAULT 0
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id VARCHAR(64) PRIMARY KEY,
                    full_name VARCHAR(120) DEFAULT '',
                    source VARCHAR(30) DEFAULT 'web',
                    first_seen VARCHAR(30) NOT NULL,
                    last_seen VARCHAR(30) NOT NULL,
                    actions_count INT NOT NULL DEFAULT 0,
                    is_banned TINYINT NOT NULL DEFAULT 0,
                    ban_reason VARCHAR(200) DEFAULT '',
                    banned_until VARCHAR(30) DEFAULT '',
                    INDEX idx_users_last_seen (last_seen),
                    INDEX idx_users_banned (is_banned)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS admins (
                    admin_id VARCHAR(64) PRIMARY KEY,
                    username VARCHAR(64) UNIQUE NOT NULL,
                    full_name VARCHAR(120) NOT NULL,
                    role VARCHAR(32) NOT NULL DEFAULT 'admin',
                    pin_hash VARCHAR(255) NOT NULL,
                    is_primary TINYINT NOT NULL DEFAULT 0,
                    is_banned TINYINT NOT NULL DEFAULT 0,
                    created_at VARCHAR(30) NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS banned_ips (
                    ip_address VARCHAR(64) PRIMARY KEY,
                    reason VARCHAR(200) DEFAULT '',
                    created_at VARCHAR(30) NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS security_events (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    event_type VARCHAR(64) NOT NULL,
                    actor_id VARCHAR(64) DEFAULT '',
                    ip_address VARCHAR(64) DEFAULT '',
                    details VARCHAR(255) DEFAULT '',
                    created_at VARCHAR(30) NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id VARCHAR(64) NOT NULL,
                    full_name VARCHAR(120) DEFAULT '',
                    action VARCHAR(100) NOT NULL,
                    details VARCHAR(255) DEFAULT '',
                    created_at VARCHAR(30) NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS platform_settings (
                    `key` VARCHAR(100) PRIMARY KEY,
                    `value` VARCHAR(255) NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """)
            for k, v in DEFAULT_SETTINGS.items():
                db.execute("INSERT IGNORE INTO platform_settings (`key`, `value`) VALUES (?, ?)", (k, v))
            if not db.fetchone("SELECT 1 FROM admins WHERE is_primary = 1"):
                db.execute(
                    "INSERT IGNORE INTO admins (admin_id, username, full_name, role, pin_hash, is_primary, is_banned, created_at) VALUES (?, ?, ?, 'super_admin', ?, 1, 0, ?)",
                    ("super_admin_root", "superadmin", "Super Admin (الأساسي)", _hash_pin(default_pin), now_str),
                )
        else:
            db.execute("PRAGMA journal_mode=WAL")
            db.execute("PRAGMA synchronous=NORMAL")
            db.execute("""
                CREATE TABLE IF NOT EXISTS stats (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    encryptions INTEGER NOT NULL DEFAULT 0,
                    decryptions INTEGER NOT NULL DEFAULT 0,
                    files_processed INTEGER NOT NULL DEFAULT 0,
                    security_scans INTEGER NOT NULL DEFAULT 0
                )
            """)
            db.execute("INSERT OR IGNORE INTO stats (id) VALUES (1)")
            db.execute("""
                CREATE TABLE IF NOT EXISTS daily_activity (
                    day_date TEXT PRIMARY KEY,
                    users_count INTEGER NOT NULL DEFAULT 0,
                    actions_count INTEGER NOT NULL DEFAULT 0
                )
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    full_name TEXT DEFAULT '',
                    source TEXT DEFAULT 'web',
                    first_seen TEXT NOT NULL,
                    last_seen TEXT NOT NULL,
                    actions_count INTEGER NOT NULL DEFAULT 0,
                    is_banned INTEGER NOT NULL DEFAULT 0,
                    ban_reason TEXT DEFAULT '',
                    banned_until TEXT DEFAULT ''
                )
            """)
            db.execute("CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen DESC)")
            db.execute("CREATE INDEX IF NOT EXISTS idx_users_banned ON users(is_banned)")
            db.execute("""
                CREATE TABLE IF NOT EXISTS admins (
                    admin_id TEXT PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    full_name TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'admin',
                    pin_hash TEXT NOT NULL,
                    is_primary INTEGER NOT NULL DEFAULT 0,
                    is_banned INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL
                )
            """)
            db.execute("CREATE INDEX IF NOT EXISTS idx_admins_lower_user ON admins(lower(username))")
            db.execute("""
                CREATE TABLE IF NOT EXISTS banned_ips (
                    ip_address TEXT PRIMARY KEY,
                    reason TEXT DEFAULT '',
                    created_at TEXT NOT NULL
                )
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS security_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_type TEXT NOT NULL,
                    actor_id TEXT DEFAULT '',
                    ip_address TEXT DEFAULT '',
                    details TEXT DEFAULT '',
                    created_at TEXT NOT NULL
                )
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    full_name TEXT DEFAULT '',
                    action TEXT NOT NULL,
                    details TEXT DEFAULT '',
                    created_at TEXT NOT NULL
                )
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS platform_settings (
                    `key` TEXT PRIMARY KEY,
                    `value` TEXT NOT NULL
                )
            """)
            for k, v in DEFAULT_SETTINGS.items():
                db.execute("INSERT OR IGNORE INTO platform_settings (`key`, `value`) VALUES (?, ?)", (k, v))
            if not db.fetchone("SELECT 1 FROM admins WHERE is_primary = 1"):
                db.execute(
                    "INSERT OR IGNORE INTO admins (admin_id, username, full_name, role, pin_hash, is_primary, is_banned, created_at) VALUES (?, ?, ?, 'super_admin', ?, 1, 0, ?)",
                    ("super_admin_root", "superadmin", "Super Admin (الأساسي)", _hash_pin(default_pin), now_str),
                )
        env_pin = os.environ.get("ZORO_ADMIN_PIN", "").strip()
        if env_pin:
            db.execute("UPDATE admins SET pin_hash = ?, is_banned = 0 WHERE is_primary = 1", (_hash_pin(env_pin),))
        db.commit()


def _read_settings(db) -> dict:
    rows = db.fetchall("SELECT `key`, `value` FROM platform_settings")
    data = dict(DEFAULT_SETTINGS)
    for r in rows:
        data[r["key"]] = r["value"]
    return data


def get_settings() -> dict:
    with _get_conn() as db:
        return _read_settings(db)


def update_settings(updates: dict):
    with _get_conn() as db:
        for k, v in (updates or {}).items():
            if k in ALLOWED_SETTINGS:
                val = str(v).strip()[:200]
                if db.is_mysql:
                    db.execute("INSERT INTO platform_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)", (k, val))
                else:
                    db.execute("INSERT INTO platform_settings (`key`, `value`) VALUES (?, ?) ON CONFLICT(`key`) DO UPDATE SET `value` = excluded.`value`", (k, val))
        db.commit()


def increment_stat(field: str, amount: int = 1):
    if field not in _STAT_FIELDS:
        return
    with _get_conn() as db:
        db.execute(f"UPDATE stats SET {field} = {field} + ? WHERE id = 1", (int(amount),))
        db.commit()


def _read_stats(db) -> dict:
    row = db.fetchone("SELECT encryptions, decryptions, files_processed, security_scans FROM stats WHERE id = 1")
    if not row:
        return {"encryptions": 0, "decryptions": 0, "files_processed": 0, "security_scans": 0}
    return dict(row)


def get_stats() -> dict:
    with _get_conn() as db:
        return _read_stats(db)


def reset_stats() -> dict:
    with _get_conn() as db:
        db.execute("UPDATE stats SET encryptions = 0, decryptions = 0, files_processed = 0, security_scans = 0 WHERE id = 1")
        db.commit()
        return _read_stats(db)


def _trim_table_to_200(db, table_name: str):
    if table_name not in ("activity_logs", "security_events"):
        return
    cutoff = db.fetchone(f"SELECT id FROM {table_name} ORDER BY id DESC LIMIT 1 OFFSET 199")
    if cutoff:
        db.execute(f"DELETE FROM {table_name} WHERE id < ?", (cutoff["id"],))


def add_activity_log(user_id: str, full_name: str, action: str, details: str = ""):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with _get_conn() as db:
        db.execute(
            "INSERT INTO activity_logs (user_id, full_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)",
            (str(user_id)[:64], str(full_name)[:100], str(action)[:80], str(details)[:200], now_str),
        )
        _trim_table_to_200(db, "activity_logs")
        db.commit()


def record_security_event(event_type: str, actor_id: str = "", ip_address: str = "", details: str = ""):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with _get_conn() as db:
        db.execute(
            "INSERT INTO security_events (event_type, actor_id, ip_address, details, created_at) VALUES (?, ?, ?, ?, ?)",
            (str(event_type)[:60], str(actor_id)[:64], str(ip_address)[:64], str(details)[:200], now_str),
        )
        _trim_table_to_200(db, "security_events")
        db.commit()


def record_activity(user_info: dict, action: str, details: str = ""):
    now_dt = datetime.now()
    now_str = now_dt.strftime("%Y-%m-%d %H:%M:%S")
    day_str = now_dt.strftime("%Y-%m-%d")
    uid = str(user_info.get("user_id") or "web_guest")[:64]
    fname = str(user_info.get("full_name") or "زائر ويب")[:100]
    src = str(user_info.get("source") or "web")[:20]

    with _get_conn() as db:
        existing = db.fetchone("SELECT substr(last_seen, 1, 10) AS d FROM users WHERE user_id = ?", (uid,))
        is_new_user_today = False
        if not existing:
            is_new_user_today = True
            db.execute(
                "INSERT INTO users (user_id, full_name, source, first_seen, last_seen, actions_count) VALUES (?, ?, ?, ?, ?, 1)",
                (uid, fname, src, now_str, now_str),
            )
        else:
            if existing["d"] != day_str:
                is_new_user_today = True
            db.execute(
                "UPDATE users SET full_name = CASE WHEN ? != '' THEN ? ELSE full_name END, last_seen = ?, actions_count = actions_count + 1 WHERE user_id = ?",
                (fname, fname, now_str, uid),
            )

        if db.is_mysql:
            db.execute(
                "INSERT INTO daily_activity (day_date, users_count, actions_count) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE users_count = users_count + VALUES(users_count), actions_count = actions_count + 1",
                (day_str, 1 if is_new_user_today else 0),
            )
        else:
            db.execute(
                "INSERT INTO daily_activity (day_date, users_count, actions_count) VALUES (?, ?, 1) ON CONFLICT(day_date) DO UPDATE SET users_count = daily_activity.users_count + excluded.users_count, actions_count = daily_activity.actions_count + 1",
                (day_str, 1 if is_new_user_today else 0),
            )

        db.execute(
            "INSERT INTO activity_logs (user_id, full_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)",
            (uid, fname, action[:80], details[:200], now_str),
        )
        _trim_table_to_200(db, "activity_logs")
        db.commit()


def is_ip_banned(ip_address: str) -> tuple:
    if not ip_address:
        return False, ""
    with _get_conn() as db:
        row = db.fetchone("SELECT reason FROM banned_ips WHERE ip_address = ?", (str(ip_address).strip(),))
        if row:
            return True, (row["reason"] or "عنوان IP محظور من قبل إدارة المنصة.")
    return False, ""


def ban_ip(ip_address: str, reason: str = "نشاط مشبوه"):
    ip_raw = str(ip_address or "").strip()
    if not ip_raw:
        raise ValueError("يرجى إدخال عنوان IP صحيح.")
    try:
        ip_obj = ipaddress.ip_address(ip_raw)
    except ValueError:
        raise ValueError("صيغة عنوان IP غير صحيحة (مثال صحيح: 192.168.1.50).")
    if ip_obj.is_loopback:
        raise ValueError("لا يمكن حظر عنوان Loopback المحلي (127.0.0.1 / ::1) لحماية وصولك إلى الخادم.")
    ip_clean = ip_obj.compressed
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    reason_clean = (reason or "نشاط مشبوه")[:160]
    with _get_conn() as db:
        if db.is_mysql:
            db.execute("INSERT INTO banned_ips (ip_address, reason, created_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE reason = VALUES(reason)", (ip_clean, reason_clean, now_str))
        else:
            db.execute("INSERT INTO banned_ips (ip_address, reason, created_at) VALUES (?, ?, ?) ON CONFLICT(ip_address) DO UPDATE SET reason = excluded.reason", (ip_clean, reason_clean, now_str))
        db.commit()


def unban_ip(ip_address: str):
    with _get_conn() as db:
        db.execute("DELETE FROM banned_ips WHERE ip_address = ?", (str(ip_address).strip(),))
        db.commit()


def is_user_banned(user_id: str) -> tuple:
    if not user_id:
        return False, ""
    now_dt = datetime.now()
    uid = str(user_id).strip()
    with _get_conn() as db:
        row = db.fetchone("SELECT is_banned, ban_reason, banned_until FROM users WHERE user_id = ?", (uid,))
        if not row or row["is_banned"] != 1:
            return False, ""
        until_str = (row["banned_until"] or "").strip()
        if until_str:
            try:
                until_dt = datetime.strptime(until_str, "%Y-%m-%d %H:%M:%S")
                if now_dt >= until_dt:
                    db.execute("UPDATE users SET is_banned = 0, ban_reason = '', banned_until = '' WHERE user_id = ?", (uid,))
                    db.commit()
                    return False, ""
                return True, f"{row['ban_reason'] or 'حظر مؤقت'} (ينتهي في {until_str})"
            except ValueError:
                pass
        return True, (row["ban_reason"] or "تم حظر وصولك من قبل إدارة المنصة.")


def set_user_ban(user_id: str, banned: bool, reason: str = "", duration_hours: int = 0, actor_name: str = "Admin"):
    now_dt = datetime.now()
    now_str = now_dt.strftime("%Y-%m-%d %H:%M:%S")
    uid = str(user_id).strip()[:64]
    hrs = max(0, int(duration_hours or 0))
    until_str = (now_dt + timedelta(hours=hrs)).strftime("%Y-%m-%d %H:%M:%S") if (banned and hrs > 0) else ""
    params = (uid, now_str, now_str, 1 if banned else 0, reason[:160] if banned else "", until_str if banned else "")
    with _get_conn() as db:
        if db.is_mysql:
            db.execute(
                "INSERT INTO users (user_id, full_name, source, first_seen, last_seen, actions_count, is_banned, ban_reason, banned_until) VALUES (?, 'مستخدم', 'manual', ?, ?, 0, ?, ?, ?) ON DUPLICATE KEY UPDATE is_banned = VALUES(is_banned), ban_reason = VALUES(ban_reason), banned_until = VALUES(banned_until)",
                params,
            )
        else:
            db.execute(
                "INSERT INTO users (user_id, full_name, source, first_seen, last_seen, actions_count, is_banned, ban_reason, banned_until) VALUES (?, 'مستخدم', 'manual', ?, ?, 0, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET is_banned = excluded.is_banned, ban_reason = excluded.ban_reason, banned_until = excluded.banned_until",
                params,
            )
        db.commit()
    if banned:
        kind = f"حظر مؤقت ({hrs} ساعة)" if hrs > 0 else "حظر دائم"
        add_activity_log("admin", actor_name, kind, f"المستخدم: {uid} | السبب: {reason or 'غير محدد'}")
    else:
        add_activity_log("admin", actor_name, "إلغاء حظر مستخدم", f"المستخدم: {uid} | السبب: {reason or 'تمت المراجعة'}")


def authenticate_admin(username: str, pin: str):
    uname = (username or "").strip().lower()
    pin_val = pin or ""
    with _get_conn() as db:
        row = db.fetchone(
            "SELECT admin_id, username, full_name, role, pin_hash, is_primary, is_banned, created_at FROM admins WHERE lower(username) = ?",
            (uname,),
        )
        if not row:
            hashlib.pbkdf2_hmac("sha256", pin_val.encode("utf-8"), _DUMMY_SALT.encode("utf-8"), PBKDF2_ITERATIONS)
            return None, "بيانات الدخول غير صحيحة."
        if row["is_banned"] == 1:
            return None, "هذا الحساب الإداري محظور حالياً."
        if not _verify_pin_hash(pin_val, row["pin_hash"]):
            return None, "بيانات الدخول غير صحيحة."
        return {
            "admin_id": row["admin_id"],
            "username": row["username"],
            "full_name": row["full_name"],
            "role": row["role"],
            "is_primary": row["is_primary"],
            "is_banned": row["is_banned"],
            "created_at": row["created_at"],
        }, ""


def _read_admins(db) -> list:
    rows = db.fetchall("SELECT admin_id, username, full_name, role, is_primary, is_banned, created_at FROM admins ORDER BY is_primary DESC, created_at ASC")
    return [dict(r) for r in rows]


def list_admins() -> list:
    with _get_conn() as db:
        return _read_admins(db)


def add_admin_account(username: str, full_name: str, role: str, pin: str, actor_name: str = "Super Admin"):
    uname = " ".join((username or "").strip().lower().split())[:40]
    fname = " ".join((full_name or "").strip().split())[:100]
    r = "super_admin" if role == "super_admin" else "admin"
    pin_clean = (pin or "").strip()
    if not uname or len(uname) < 3:
        raise ValueError("Admin Name يجب أن يكون 3 أحرف على الأقل.")
    if not fname:
        raise ValueError("يرجى إدخال الاسم الكامل.")
    if not pin_clean or len(pin_clean) < 4:
        raise ValueError("Password يجب أن يكون 4 خانات على الأقل.")
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    aid = f"adm_{secrets.token_hex(4)}"
    with _get_conn() as db:
        if db.fetchone("SELECT admin_id FROM admins WHERE lower(trim(username)) = ?", (uname,)):
            raise ValueError(f"الاسم الإداري '{uname}' مستخدم مسبقاً.")
        integrity_errors = (sqlite3.IntegrityError, pymysql.err.IntegrityError) if pymysql else (sqlite3.IntegrityError,)
        try:
            db.execute(
                "INSERT INTO admins (admin_id, username, full_name, role, pin_hash, is_primary, is_banned, created_at) VALUES (?, ?, ?, ?, ?, 0, 0, ?)",
                (aid, uname, fname, r, _hash_pin(pin_clean), now_str),
            )
            db.commit()
        except integrity_errors as exc:
            raise ValueError("تعذر إضافة المسؤول لأن الاسم مستخدم مسبقاً.") from exc
    add_activity_log("admin", actor_name, "إضافة مسؤول", f"{fname} (@{uname}) - {r}")


def update_admin_role(admin_id: str, new_role: str, actor_name: str = "Super Admin"):
    r = "super_admin" if new_role == "super_admin" else "admin"
    with _get_conn() as db:
        row = db.fetchone("SELECT username, is_primary FROM admins WHERE admin_id = ?", (admin_id,))
        if not row:
            raise ValueError("حساب المسؤول غير موجود.")
        if row["is_primary"] == 1:
            raise ValueError("لا يمكن تغيير صلاحية حساب Super Admin الأساسي.")
        db.execute("UPDATE admins SET role = ? WHERE admin_id = ?", (r, admin_id))
        db.commit()
    add_activity_log("admin", actor_name, "تعديل صلاحية مسؤول", f"{row['username']} -> {r}")


def set_admin_ban(admin_id: str, banned: bool, actor_name: str = "Super Admin"):
    with _get_conn() as db:
        row = db.fetchone("SELECT username, is_primary FROM admins WHERE admin_id = ?", (admin_id,))
        if not row:
            raise ValueError("حساب المسؤول غير موجود.")
        if row["is_primary"] == 1:
            raise ValueError("حساب Super Admin الأساسي محمي ولا يمكن حظره.")
        db.execute("UPDATE admins SET is_banned = ? WHERE admin_id = ?", (1 if banned else 0, admin_id))
        db.commit()
    add_activity_log("admin", actor_name, "حظر مسؤول" if banned else "فك حظر مسؤول", row["username"])


def remove_admin_account(admin_id: str, actor_name: str = "Super Admin"):
    with _get_conn() as db:
        row = db.fetchone("SELECT username, is_primary FROM admins WHERE admin_id = ?", (admin_id,))
        if not row:
            raise ValueError("حساب المسؤول غير موجود.")
        if row["is_primary"] == 1:
            raise ValueError("حساب Super Admin الأساسي محمي ولا يمكن حذفه.")
        db.execute("DELETE FROM admins WHERE admin_id = ?", (admin_id,))
        db.commit()
    add_activity_log("admin", actor_name, "إزالة مسؤول", row["username"])


def change_admin_pin(admin_id: str, new_pin: str, actor_name: str = "Admin"):
    if not new_pin or len(new_pin) < 4:
        raise ValueError("Password الأدمن الجديد يجب أن يكون 4 خانات على الأقل.")
    with _get_conn() as db:
        row = db.fetchone("SELECT username FROM admins WHERE admin_id = ?", (admin_id,))
        if not row:
            raise ValueError("حساب المسؤول غير موجود.")
        db.execute("UPDATE admins SET pin_hash = ? WHERE admin_id = ?", (_hash_pin(new_pin), admin_id))
        db.commit()
    add_activity_log("admin", actor_name, "تغيير كلمة مرور الأدمن", f"الحساب: {row['username']}")


def get_last_7_days_chart(db) -> list:
    today = datetime.now().date()
    days = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(6, -1, -1)]
    rows = db.fetchall("SELECT day_date, users_count, actions_count FROM daily_activity WHERE day_date IN (?,?,?,?,?,?,?)", days)
    by_day = {r["day_date"]: dict(r) for r in rows}
    result = []
    for d in days:
        item = by_day.get(d, {"day_date": d, "users_count": 0, "actions_count": 0})
        result.append({"date": d, "label": d[5:], "users": item["users_count"], "actions": item["actions_count"]})
    return result


def get_admin_overview() -> dict:
    cutoff_active = (datetime.now() - timedelta(hours=24)).strftime("%Y-%m-%d %H:%M:%S")
    with _get_conn() as db:
        counts = db.fetchone(
            "SELECT COUNT(*) AS total_users, COALESCE(SUM(CASE WHEN last_seen >= ? AND is_banned = 0 THEN 1 ELSE 0 END), 0) AS active_users, COALESCE(SUM(CASE WHEN is_banned = 1 THEN 1 ELSE 0 END), 0) AS banned_users FROM users",
            (cutoff_active,),
        )
        users = [dict(r) for r in db.fetchall("SELECT * FROM users ORDER BY last_seen DESC LIMIT 150")]
        logs = [dict(r) for r in db.fetchall("SELECT * FROM activity_logs ORDER BY id DESC LIMIT 200")]
        events = [dict(r) for r in db.fetchall("SELECT * FROM security_events ORDER BY id DESC LIMIT 200")]
        banned_ips = [dict(r) for r in db.fetchall("SELECT * FROM banned_ips ORDER BY created_at DESC")]
        chart_7d = get_last_7_days_chart(db)
        st = _read_stats(db)
        admins = _read_admins(db)
        settings = _read_settings(db)
    total_ops = st["encryptions"] + st["decryptions"] + st["files_processed"] + st["security_scans"]
    return {
        "stats": st,
        "total_users": int(counts["total_users"] or 0),
        "active_users": int(counts["active_users"] or 0),
        "banned_users": int(counts["banned_users"] or 0),
        "total_operations": total_ops,
        "chart_7d": chart_7d,
        "users": users,
        "admins": admins,
        "banned_ips": banned_ips,
        "security_events": events,
        "logs": logs,
        "settings": settings,
    }


def clear_admin_logs(actor_name: str = "Admin"):
    with _get_conn() as db:
        db.execute("DELETE FROM activity_logs")
        db.commit()
    add_activity_log("admin", actor_name, "مسح سجل الأنشطة", "تم تنظيف سجل الأنشطة")
