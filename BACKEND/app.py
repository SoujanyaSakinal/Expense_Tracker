"""
app.py
------
Flask REST API with JWT authentication. Every expense/category/report
endpoint is scoped to the logged-in user.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
from flask import send_file
from datetime import datetime, timedelta

import database as db
import reports
import re
import analytics
import ai_assistant
import pdf_report
import secrets
import email_service
import os

app = Flask(__name__)
CORS(app)

app.config["JWT_SECRET_KEY"] = "dev-secret-change-this-before-going-live"
jwt = JWTManager(app)

from functools import wraps

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        if not db.is_user_admin(user_id):
            return jsonify({"error": "Admin access required."}), 403
        return fn(*args, **kwargs)
    return wrapper


# ---------- AUTH ----------

@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    name = (data.get("name") or "").strip()

    EMAIL_PATTERN = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
    if not email or not re.match(EMAIL_PATTERN, email):
        return jsonify({"error": "Please enter a valid email address."}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400
    if not name:
        return jsonify({"error": "Name is required."}), 400
    if db.get_user_by_email(email):
        return jsonify({"error": "An account with this email already exists."}), 409

    password_hash = generate_password_hash(password)
    user_id = db.create_user(email, password_hash, name)
    db.create_default_categories(user_id)

    token = create_access_token(identity=str(user_id))
    return jsonify({"token": token, "user": {"id": user_id, "email": email, "name": name}}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = db.get_user_by_email(email)
    if not user or not check_password_hash(user[2], password):
        return jsonify({"error": "Invalid email or password."}), 401

    token = create_access_token(identity=str(user[0]))
    is_admin = db.is_user_admin(user[0])
    full_user = db.get_user_by_id(user[0])
    name = full_user[3] if full_user else None
    return jsonify({"token": token, "user": {"id": user[0], "email": user[1], "is_admin": is_admin, "name": name}})


@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = db.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify({"id": user[0], "email": user[1], "is_admin": bool(user[2]), "name": user[3]})


# ---------- ADMIN ----------

@app.route("/api/admin/users", methods=["GET"])
@admin_required
def admin_list_users():
    rows = db.get_all_users()
    return jsonify([
        {
            "id": r[0], "email": r[1], "created_at": r[2], "is_admin": bool(r[3]), "name": r[4],
            "expense_count": r[5], "total_spent": round(r[6], 2),
        }
        for r in rows
    ])

@app.route("/api/admin/stats", methods=["GET"])
@admin_required
def admin_stats():
    return jsonify(db.get_platform_stats())


@app.route("/api/admin/analytics/summary", methods=["GET"])
@admin_required
def admin_analytics_summary():
    return jsonify(analytics.get_platform_summary_stats())


@app.route("/api/admin/analytics/concentration", methods=["GET"])
@admin_required
def admin_analytics_concentration():
    return jsonify(analytics.get_platform_category_concentration())


@app.route("/api/admin/analytics/monthly-trend", methods=["GET"])
@admin_required
def admin_analytics_monthly_trend():
    return jsonify(analytics.get_platform_monthly_trend())


@app.route("/api/admin/analytics/anomalies", methods=["GET"])
@admin_required
def admin_analytics_anomalies():
    return jsonify(analytics.get_platform_anomalies())

# ---------- CATEGORIES ----------

@app.route("/api/categories", methods=["GET"])
@jwt_required()
def list_categories():
    user_id = int(get_jwt_identity())
    rows = db.get_categories(user_id)
    return jsonify([{"id": cid, "name": name} for cid, name in rows])


@app.route("/api/categories", methods=["POST"])
@jwt_required()
def create_category():
    user_id = int(get_jwt_identity())
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Category name is required."}), 400

    if db.add_category(user_id, name):
        new_id = db.get_category_id_by_name(user_id, name)
        return jsonify({"id": new_id, "name": name}), 201
    return jsonify({"error": f"Category '{name}' already exists."}), 409


# ---------- EXPENSES ----------

def _serialize_expense(row):
    eid, edate, amount, category, description = row
    return {
        "id": eid, "date": edate, "amount": amount,
        "category": category, "description": description or "",
    }


@app.route("/api/expenses", methods=["GET"])
@jwt_required()
def list_expenses():
    user_id = int(get_jwt_identity())
    rows = db.get_all_expenses(user_id)
    return jsonify([_serialize_expense(r) for r in rows])


@app.route("/api/expenses", methods=["POST"])
@jwt_required()
def create_expense():
    user_id = int(get_jwt_identity())
    data = request.get_json(force=True)

    try:
        amount = float(data["amount"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "A valid numeric amount is required."}), 400

    category_id = data.get("category_id")
    if not category_id:
        return jsonify({"error": "category_id is required."}), 400

    description = (data.get("description") or "").strip()
    expense_date = data.get("date") or None

    new_id = db.add_expense(user_id, amount, category_id, description, expense_date)
    if new_id is None:
        return jsonify({"error": "Invalid category."}), 400

    row = db.get_expense_by_id(user_id, new_id)
    eid, edate, amt, category, desc, _cat_id = row
    return jsonify(_serialize_expense((eid, edate, amt, category, desc))), 201


@app.route("/api/expenses/<int:expense_id>", methods=["PUT"])
@jwt_required()
def update_expense(expense_id):
    user_id = int(get_jwt_identity())
    data = request.get_json(force=True)

    existing = db.get_expense_by_id(user_id, expense_id)
    if not existing:
        return jsonify({"error": "Expense not found."}), 404

    amount = data.get("amount")
    if amount is not None:
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            return jsonify({"error": "Amount must be numeric."}), 400

    success = db.update_expense(
        user_id, expense_id,
        amount=amount,
        category_id=data.get("category_id"),
        description=data.get("description"),
        expense_date=data.get("date"),
    )
    if not success:
        return jsonify({"error": "Update failed — check category ownership."}), 400

    row = db.get_expense_by_id(user_id, expense_id)
    eid, edate, amt, category, desc, _cat_id = row
    return jsonify(_serialize_expense((eid, edate, amt, category, desc)))


@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
@jwt_required()
def delete_expense(expense_id):
    user_id = int(get_jwt_identity())
    success = db.delete_expense(user_id, expense_id)
    if not success:
        return jsonify({"error": "Expense not found."}), 404
    return jsonify({"deleted": expense_id})


# ---------- REPORTS ----------

@app.route("/api/reports/monthly-summary", methods=["GET"])
@jwt_required()
def monthly_summary():
    user_id = int(get_jwt_identity())
    rows = reports.monthly_summary(user_id)
    return jsonify([{"month": m, "total": t, "count": c} for m, t, c in rows])


@app.route("/api/reports/category-breakdown", methods=["GET"])
@jwt_required()
def category_breakdown():
    user_id = int(get_jwt_identity())
    month = request.args.get("month")
    rows = reports.category_wise_breakdown(user_id, month)
    return jsonify([{"category": c, "total": t, "count": n} for c, t, n in rows])


@app.route("/api/reports/top-categories", methods=["GET"])
@jwt_required()
def top_categories():
    user_id = int(get_jwt_identity())
    limit = request.args.get("limit", default=5, type=int)
    rows = reports.top_spending_categories(user_id, limit)
    return jsonify([{"category": c, "total": t} for c, t in rows])


@app.route("/api/reports/category-trend", methods=["GET"])
@jwt_required()
def category_trend():
    user_id = int(get_jwt_identity())
    category_name = request.args.get("category")
    if not category_name:
        return jsonify({"error": "category query param is required."}), 400
    rows = reports.monthly_trend_by_category(user_id, category_name)
    return jsonify([{"month": m, "total": t} for m, t in rows])


@app.route("/api/reports/summary-stats", methods=["GET"])
@jwt_required()
def summary_stats():
    user_id = int(get_jwt_identity())
    all_time = reports.category_wise_breakdown(user_id)
    monthly = reports.monthly_summary(user_id)

    total_spent = sum(row[1] for row in all_time)
    total_transactions = sum(row[2] for row in all_time)
    current_month_total = monthly[0][1] if monthly else 0
    top_category = all_time[0][0] if all_time else None

    return jsonify({
        "total_spent": total_spent,
        "total_transactions": total_transactions,
        "current_month_total": current_month_total,
        "top_category": top_category,
    })

# ---------- ANALYTICS (pandas-driven insights) ----------

@app.route("/api/analytics/summary", methods=["GET"])
@jwt_required()
def analytics_summary():
    user_id = int(get_jwt_identity())
    return jsonify(analytics.get_summary_stats(user_id))


@app.route("/api/analytics/concentration", methods=["GET"])
@jwt_required()
def analytics_concentration():
    user_id = int(get_jwt_identity())
    return jsonify(analytics.get_category_concentration(user_id))


@app.route("/api/analytics/monthly-trend", methods=["GET"])
@jwt_required()
def analytics_monthly_trend():
    user_id = int(get_jwt_identity())
    return jsonify(analytics.get_monthly_trend(user_id))


@app.route("/api/analytics/anomalies", methods=["GET"])
@jwt_required()
def analytics_anomalies():
    user_id = int(get_jwt_identity())
    return jsonify(analytics.get_anomalies(user_id))


@app.route("/api/analytics/day-of-week", methods=["GET"])
@jwt_required()
def analytics_day_of_week():
    user_id = int(get_jwt_identity())
    return jsonify(analytics.get_day_of_week_pattern(user_id))

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


# ---------- AI Assistant ----------

@app.route("/api/ai/ask", methods=["POST"])
@jwt_required()
def ai_ask():
    user_id = int(get_jwt_identity())
    data = request.get_json(force=True)
    question = (data.get("question") or "").strip()

    if not question:
        return jsonify({"error": "A question is required."}), 400
    if len(question) > 500:
        return jsonify({"error": "Question is too long (max 500 characters)."}), 400

    try:
        answer = ai_assistant.ask_question(user_id, question)
        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({"error": f"AI request failed: {str(e)}"}), 500


# ---------- PDF Reports ---------

@app.route("/api/reports/pdf", methods=["GET"])
@jwt_required()
def download_pdf_report():
    user_id = int(get_jwt_identity())
    buffer = pdf_report.generate_report(user_id)
    return send_file(
        buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name="expense_report.pdf",
    )


# -------------- Forgot Password ------------
@app.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()

    # Always return the same generic message, whether or not the email
    # exists — this prevents leaking which emails are registered.
    generic_response = jsonify({
        "message": "If an account with that email exists, a reset link has been sent."
    })

    user = db.get_user_by_email(email)
    if not user:
        return generic_response

    token = secrets.token_urlsafe(32)
    expiry = (datetime.utcnow() + timedelta(minutes=30)).isoformat()
    db.set_reset_token(email, token, expiry)

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_url}/reset-password?token={token}"

    try:
        email_service.send_reset_email(email, reset_link)
    except Exception as e:
        # Don't leak SMTP errors to the client — log server-side only.
        print(f"Failed to send reset email: {e}")

    return generic_response


@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(force=True)
    token = data.get("token") or ""
    new_password = data.get("password") or ""

    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400

    row = db.get_user_by_reset_token(token)
    if not row:
        return jsonify({"error": "Invalid or expired reset link."}), 400

    user_id, email, expiry_iso = row
    if not expiry_iso or datetime.fromisoformat(expiry_iso) < datetime.utcnow():
        return jsonify({"error": "This reset link has expired. Please request a new one."}), 400

    new_hash = generate_password_hash(new_password)
    db.update_password(user_id, new_hash)

    return jsonify({"message": "Password reset successfully. You can now log in."})


if __name__ == "__main__":
    db.init_db()
    app.run(debug=True, port=5000)


