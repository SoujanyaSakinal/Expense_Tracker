"""
analytics.py
------------
Deeper, pandas-driven analysis beyond simple SQL aggregates:
month-over-month trends, category concentration, anomaly
detection, and day-of-week spending patterns. Mirrors the
logic in the Jupyter notebook, but scoped to a single user
and exposed as JSON for the web app.
"""

import pandas as pd
from database import get_connection


def _load_user_expenses_df(user_id):
    """Load one user's expenses into a pandas DataFrame."""
    conn = get_connection()
    query = """
        SELECT e.id, e.date, e.amount, c.name AS category, e.description
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = ?
        ORDER BY e.date
    """
    df = pd.read_sql_query(query, conn, params=(user_id,))
    conn.close()

    if not df.empty:
        df["date"] = pd.to_datetime(df["date"])
    return df


def get_summary_stats(user_id):
    df = _load_user_expenses_df(user_id)
    if df.empty:
        return {
            "total_spent": 0, "count": 0, "average": 0, "median": 0,
            "largest": 0, "smallest": 0, "std_dev": 0, "volatility_pct": 0,
        }

    total = df["amount"].sum()
    avg = df["amount"].mean()
    std = df["amount"].std()
    std = 0 if pd.isna(std) else std

    return {
        "total_spent": round(total, 2),
        "count": len(df),
        "average": round(avg, 2),
        "median": round(df["amount"].median(), 2),
        "largest": round(df["amount"].max(), 2),
        "smallest": round(df["amount"].min(), 2),
        "std_dev": round(std, 2),
        "volatility_pct": round((std / avg * 100), 1) if avg else 0,
    }


def get_category_concentration(user_id):
    df = _load_user_expenses_df(user_id)
    if df.empty:
        return {"top_category": None, "top_category_pct": 0, "top_2_pct": 0}

    total = df["amount"].sum()
    cat_totals = df.groupby("category")["amount"].sum().sort_values(ascending=False)
    pct = (cat_totals / total * 100).round(1)

    return {
        "top_category": cat_totals.index[0],
        "top_category_pct": float(pct.iloc[0]),
        "top_2_pct": float(pct.iloc[:2].sum()),
    }


def get_monthly_trend(user_id):
    df = _load_user_expenses_df(user_id)
    if df.empty:
        return []

    df["month"] = df["date"].dt.to_period("M").astype(str)
    monthly = df.groupby("month")["amount"].sum().sort_index()
    pct_change = monthly.pct_change() * 100

    return [
        {
            "month": month,
            "total": round(total, 2),
            "pct_change": None if pd.isna(pct_change[month]) else round(pct_change[month], 1),
        }
        for month, total in monthly.items()
    ]


def get_anomalies(user_id):
    df = _load_user_expenses_df(user_id)
    if df.empty or len(df) < 2:
        return {"threshold": 0, "anomalies": []}

    mean_amt = df["amount"].mean()
    std_amt = df["amount"].std()
    if pd.isna(std_amt):
        return {"threshold": 0, "anomalies": []}

    threshold = mean_amt + (2 * std_amt)
    flagged = df[df["amount"] > threshold].sort_values("amount", ascending=False)

    return {
        "threshold": round(threshold, 2),
        "anomalies": [
            {
                "date": row["date"].strftime("%Y-%m-%d"),
                "category": row["category"],
                "description": row["description"] or "",
                "amount": round(row["amount"], 2),
            }
            for _, row in flagged.iterrows()
        ],
    }


def get_day_of_week_pattern(user_id):
    df = _load_user_expenses_df(user_id)
    day_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    if df.empty:
        return {"by_day": [{"day": d, "total": 0} for d in day_order], "busiest_day": None}

    df["day_of_week"] = df["date"].dt.day_name()
    totals = df.groupby("day_of_week")["amount"].sum().reindex(day_order).fillna(0)

    return {
        "by_day": [{"day": day, "total": round(total, 2)} for day, total in totals.items()],
        "busiest_day": totals.idxmax(),
    }

# ---------- PLATFORM-WIDE ANALYTICS (admin only, all users combined) ----------

def _load_all_expenses_df():
    """Load every user's expenses into one DataFrame — admin-only use."""
    conn = get_connection()
    query = """
        SELECT e.id, e.date, e.amount, c.name AS category, e.description,
               u.email AS user_email
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        JOIN users u ON e.user_id = u.id
        ORDER BY e.date
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    if not df.empty:
        df["date"] = pd.to_datetime(df["date"])
    return df


def get_platform_summary_stats():
    df = _load_all_expenses_df()
    if df.empty:
        return {"total_spent": 0, "count": 0, "average": 0, "std_dev": 0, "volatility_pct": 0}

    total = df["amount"].sum()
    avg = df["amount"].mean()
    std = df["amount"].std()
    std = 0 if pd.isna(std) else std

    return {
        "total_spent": round(total, 2),
        "count": len(df),
        "average": round(avg, 2),
        "std_dev": round(std, 2),
        "volatility_pct": round((std / avg * 100), 1) if avg else 0,
    }


def get_platform_category_concentration():
    df = _load_all_expenses_df()
    if df.empty:
        return {"breakdown": []}

    total = df["amount"].sum()
    cat_totals = df.groupby("category")["amount"].sum().sort_values(ascending=False)
    pct = (cat_totals / total * 100).round(1)

    return {
        "breakdown": [
            {"category": cat, "total": round(val, 2), "pct": float(pct[cat])}
            for cat, val in cat_totals.items()
        ]
    }


def get_platform_monthly_trend():
    df = _load_all_expenses_df()
    if df.empty:
        return []

    df["month"] = df["date"].dt.to_period("M").astype(str)
    monthly = df.groupby("month")["amount"].sum().sort_index()
    pct_change = monthly.pct_change() * 100

    return [
        {
            "month": month,
            "total": round(total, 2),
            "pct_change": None if pd.isna(pct_change[month]) else round(pct_change[month], 1),
        }
        for month, total in monthly.items()
    ]


def get_platform_anomalies():
    df = _load_all_expenses_df()
    if df.empty or len(df) < 2:
        return {"threshold": 0, "anomalies": []}

    mean_amt = df["amount"].mean()
    std_amt = df["amount"].std()
    if pd.isna(std_amt):
        return {"threshold": 0, "anomalies": []}

    threshold = mean_amt + (2 * std_amt)
    flagged = df[df["amount"] > threshold].sort_values("amount", ascending=False)

    return {
        "threshold": round(threshold, 2),
        "anomalies": [
            {
                "date": row["date"].strftime("%Y-%m-%d"),
                "category": row["category"],
                "description": row["description"] or "",
                "amount": round(row["amount"], 2),
                "user": row["user_email"],
            }
            for _, row in flagged.iterrows()
        ],
    }