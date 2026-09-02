"""
database.py
------------
Handles SQLite connection, schema creation, and CRUD operations.
All expenses and categories now belong to a specific user.
"""

import sqlite3
from datetime import date, datetime

DB_NAME = "expenses.db"

DEFAULT_CATEGORIES = ["Food", "Transport", "Utilities", "Entertainment",
                       "Health", "Shopping", "Rent", "Other"]


def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    
    try:
        cur.execute("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0")
    except sqlite3.OperationalError:
        pass  # column already exists

    try:
        cur.execute("ALTER TABLE users ADD COLUMN name TEXT")
    except sqlite3.OperationalError:
        pass  # column already exists

    try:
        cur.execute("ALTER TABLE users ADD COLUMN reset_token TEXT")
    except sqlite3.OperationalError:
        pass  # column already exists

    try:
        cur.execute("ALTER TABLE users ADD COLUMN reset_token_expiry TEXT")
    except sqlite3.OperationalError:
        pass  # column already exists

    cur.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            UNIQUE(user_id, name),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            amount REAL NOT NULL,
            category_id INTEGER NOT NULL,
            description TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    """)

    conn.commit()
    conn.close()


# ---------- USERS ----------

def create_user(email, password_hash, name=None):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)",
        (email, password_hash, name, datetime.utcnow().isoformat())
    )
    conn.commit()
    user_id = cur.lastrowid
    conn.close()
    return user_id


def get_user_by_email(email):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, email, password_hash FROM users WHERE email = ?", (email,))
    row = cur.fetchone()
    conn.close()
    return row


def get_user_by_id(user_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, email, is_admin, name FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()
    return row

def is_user_admin(user_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT is_admin FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()
    return bool(row and row[0])


def get_all_users():
    """Admin-only: list every user with basic activity stats."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT u.id, u.email, u.created_at, u.is_admin, u.name,
               COUNT(e.id) AS expense_count,
               COALESCE(SUM(e.amount), 0) AS total_spent
        FROM users u
        LEFT JOIN expenses e ON e.user_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC
    """)
    rows = cur.fetchall()
    conn.close()
    return rows


def get_platform_stats():
    """Admin-only: platform-wide numbers across all users."""
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM users")
    total_users = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM expenses")
    total_expenses = cur.fetchone()[0]

    cur.execute("SELECT COALESCE(SUM(amount), 0) FROM expenses")
    total_amount = cur.fetchone()[0]

    cur.execute("""
        SELECT u.email, COUNT(e.id) AS cnt
        FROM users u
        JOIN expenses e ON e.user_id = u.id
        GROUP BY u.id
        ORDER BY cnt DESC
        LIMIT 1
    """)
    most_active = cur.fetchone()

    conn.close()
    return {
        "total_users": total_users,
        "total_expenses": total_expenses,
        "total_amount_tracked": total_amount,
        "most_active_user": most_active[0] if most_active else None,
        "most_active_user_count": most_active[1] if most_active else 0,
    }

def set_reset_token(email, token, expiry_iso):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?",
        (token, expiry_iso, email)
    )
    conn.commit()
    affected = cur.rowcount
    conn.close()
    return affected > 0


def get_user_by_reset_token(token):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, email, reset_token_expiry FROM users WHERE reset_token = ?",
        (token,)
    )
    row = cur.fetchone()
    conn.close()
    return row


def update_password(user_id, new_password_hash):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
        (new_password_hash, user_id)
    )
    conn.commit()
    conn.close()

# ---------- CATEGORIES (per-user) ----------

def create_default_categories(user_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.executemany(
        "INSERT OR IGNORE INTO categories (user_id, name) VALUES (?, ?)",
        [(user_id, c) for c in DEFAULT_CATEGORIES]
    )
    conn.commit()
    conn.close()


def get_categories(user_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM categories WHERE user_id = ? ORDER BY name", (user_id,))
    rows = cur.fetchall()
    conn.close()
    return rows


def add_category(user_id, name):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO categories (user_id, name) VALUES (?, ?)", (user_id, name.strip()))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()


def get_category_id_by_name(user_id, name):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM categories WHERE user_id = ? AND name = ?", (user_id, name))
    row = cur.fetchone()
    conn.close()
    return row[0] if row else None


def _category_belongs_to_user(user_id, category_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM categories WHERE id = ? AND user_id = ?", (category_id, user_id))
    row = cur.fetchone()
    conn.close()
    return row is not None


# ---------- EXPENSES (per-user CRUD) ----------

def add_expense(user_id, amount, category_id, description="", expense_date=None):
    if not _category_belongs_to_user(user_id, category_id):
        return None  # prevents assigning an expense to someone else's category

    if expense_date is None:
        expense_date = date.today().isoformat()

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO expenses (user_id, date, amount, category_id, description) "
        "VALUES (?, ?, ?, ?, ?)",
        (user_id, expense_date, amount, category_id, description)
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return new_id


def get_all_expenses(user_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT e.id, e.date, e.amount, c.name, e.description
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = ?
        ORDER BY e.date DESC, e.id DESC
    """, (user_id,))
    rows = cur.fetchall()
    conn.close()
    return rows


def get_expense_by_id(user_id, expense_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT e.id, e.date, e.amount, c.name, e.description, e.category_id
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        WHERE e.id = ? AND e.user_id = ?
    """, (expense_id, user_id))
    row = cur.fetchone()
    conn.close()
    return row


def update_expense(user_id, expense_id, amount=None, category_id=None,
                    description=None, expense_date=None):
    existing = get_expense_by_id(user_id, expense_id)
    if not existing:
        return False

    if category_id is not None and not _category_belongs_to_user(user_id, category_id):
        return False

    _, cur_date, cur_amount, _, cur_desc, cur_cat_id = existing

    new_date = expense_date if expense_date is not None else cur_date
    new_amount = amount if amount is not None else cur_amount
    new_cat_id = category_id if category_id is not None else cur_cat_id
    new_desc = description if description is not None else cur_desc

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE expenses
        SET date = ?, amount = ?, category_id = ?, description = ?
        WHERE id = ? AND user_id = ?
    """, (new_date, new_amount, new_cat_id, new_desc, expense_id, user_id))
    conn.commit()
    conn.close()
    return True


def delete_expense(user_id, expense_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM expenses WHERE id = ? AND user_id = ?", (expense_id, user_id))
    conn.commit()
    affected = cur.rowcount
    conn.close()
    return affected > 0