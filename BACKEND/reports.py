"""
reports.py
----------
SQL aggregate queries, scoped to a single user.
"""

from database import get_connection


def monthly_summary(user_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT strftime('%Y-%m', date) AS month,
               SUM(amount) AS total,
               COUNT(*) AS num_transactions
        FROM expenses
        WHERE user_id = ?
        GROUP BY month
        ORDER BY month DESC
    """, (user_id,))
    rows = cur.fetchall()
    conn.close()
    return rows


def category_wise_breakdown(user_id, month=None):
    conn = get_connection()
    cur = conn.cursor()
    if month:
        cur.execute("""
            SELECT c.name, SUM(e.amount) AS total, COUNT(*) AS num_transactions
            FROM expenses e
            JOIN categories c ON e.category_id = c.id
            WHERE e.user_id = ? AND strftime('%Y-%m', e.date) = ?
            GROUP BY c.name
            ORDER BY total DESC
        """, (user_id, month))
    else:
        cur.execute("""
            SELECT c.name, SUM(e.amount) AS total, COUNT(*) AS num_transactions
            FROM expenses e
            JOIN categories c ON e.category_id = c.id
            WHERE e.user_id = ?
            GROUP BY c.name
            ORDER BY total DESC
        """, (user_id,))
    rows = cur.fetchall()
    conn.close()
    return rows


def top_spending_categories(user_id, limit=5):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT c.name, SUM(e.amount) AS total
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = ?
        GROUP BY c.name
        ORDER BY total DESC
        LIMIT ?
    """, (user_id, limit))
    rows = cur.fetchall()
    conn.close()
    return rows


def monthly_trend_by_category(user_id, category_name):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT strftime('%Y-%m', e.date) AS month, SUM(e.amount) AS total
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = ? AND c.name = ?
        GROUP BY month
        ORDER BY month
    """, (user_id, category_name))
    rows = cur.fetchall()
    conn.close()
    return rows