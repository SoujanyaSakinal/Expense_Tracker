
import io
from datetime import datetime

import matplotlib
matplotlib.use("Agg")  # non-interactive backend — safe for a server process
import matplotlib.pyplot as plt

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

import analytics
from database import get_user_by_id


def _make_pie_chart(breakdown):
    """Returns a BytesIO buffer containing a PNG pie chart image."""
    fig, ax = plt.subplots(figsize=(4.5, 4.5))
    if breakdown:
        labels = [row["category"] for row in breakdown]
        values = [row["total"] for row in breakdown]
        ax.pie(values, labels=labels, autopct="%1.1f%%", startangle=140,
               colors=plt.cm.Set2.colors)
        ax.set_title("Spending by Category")
    else:
        ax.text(0.5, 0.5, "No data yet", ha="center", va="center")
        ax.axis("off")

    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf


def _make_trend_chart(monthly_trend):
    """Returns a BytesIO buffer containing a PNG bar chart image."""
    fig, ax = plt.subplots(figsize=(6.5, 3.2))
    if monthly_trend:
        months = [row["month"] for row in monthly_trend]
        totals = [row["total"] for row in monthly_trend]
        ax.bar(months, totals, color="#1F6F54")
        ax.set_title("Monthly Spending Trend")
        ax.set_ylabel("Total Spent")
        plt.xticks(rotation=45)
    else:
        ax.text(0.5, 0.5, "No data yet", ha="center", va="center")
        ax.axis("off")

    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf


def generate_report(user_id):
    """Builds the full PDF report and returns it as a BytesIO buffer."""
    user = get_user_by_id(user_id)
    user_email = user[1] if user else "Unknown user"
    user_name = user[3] if user and len(user) > 3 and user[3] else None
    display_name = user_name if user_name else user_email

    summary = analytics.get_summary_stats(user_id)
    concentration = analytics.get_category_concentration(user_id)
    monthly_trend = analytics.get_monthly_trend(user_id)
    anomalies_data = analytics.get_anomalies(user_id)

    breakdown_rows = []
    from database import get_connection
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT c.name, SUM(e.amount) AS total
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = ?
        GROUP BY c.name
        ORDER BY total DESC
    """, (user_id,))
    for name, total in cur.fetchall():
        breakdown_rows.append({"category": name, "total": total})
    conn.close()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        topMargin=0.6 * inch, bottomMargin=0.6 * inch,
        leftMargin=0.7 * inch, rightMargin=0.7 * inch,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle", parent=styles["Title"], fontSize=24, spaceAfter=18,
    )
    name_style = ParagraphStyle(
        "ReportName", parent=styles["Normal"], fontSize=13,
        textColor=colors.HexColor("#1B2420"), spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle", parent=styles["Normal"], fontSize=9,
        textColor=colors.HexColor("#4B5650"), spaceAfter=22,
    )
    section_style = ParagraphStyle(
        "SectionHeader", parent=styles["Heading2"], fontSize=14,
        spaceBefore=16, spaceAfter=8, textColor=colors.HexColor("#1F6F54"),
    )
    body_style = styles["Normal"]

    elements = []

    # ---- Header ----
    elements.append(Paragraph("Expense Report", title_style))
    elements.append(Paragraph(display_name, name_style))
    elements.append(Paragraph(
        f"Generated on {datetime.now().strftime('%B %d, %Y')}",
        subtitle_style,
    ))

    # ---- Summary stats table ----
    elements.append(Paragraph("Summary", section_style))
    summary_data = [
        ["Total spent", f"{summary['total_spent']:,.2f}"],
        ["Number of entries", str(summary["count"])],
        ["Average transaction", f"{summary['average']:,.2f}"],
        ["Median transaction", f"{summary['median']:,.2f}"],
        ["Largest expense", f"{summary['largest']:,.2f}"],
        ["Spending volatility", f"{summary['volatility_pct']}%"],
    ]
    summary_table = Table(summary_data, colWidths=[2.5 * inch, 2 * inch])
    summary_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#4B5650")),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, colors.HexColor("#D2C9AE")),
    ]))
    elements.append(summary_table)

    if concentration.get("top_category"):
        elements.append(Spacer(1, 10))
        elements.append(Paragraph(
            f"Your biggest spending category is <b>{concentration['top_category']}</b>, "
            f"making up <b>{concentration['top_category_pct']}%</b> of all spending. "
            f"Your top 2 categories together account for "
            f"<b>{concentration['top_2_pct']}%</b> of total spend.",
            body_style,
        ))

    # ---- Category breakdown chart ----
    elements.append(Paragraph("Category Breakdown", section_style))
    pie_buf = _make_pie_chart(breakdown_rows)
    elements.append(Image(pie_buf, width=3.2 * inch, height=3.2 * inch))

    # ---- Monthly trend chart ----
    elements.append(Paragraph("Monthly Trend", section_style))
    trend_buf = _make_trend_chart(monthly_trend)
    elements.append(Image(trend_buf, width=6 * inch, height=2.9 * inch))

    # ---- Anomalies table ----
    elements.append(Paragraph("Unusual Transactions", section_style))
    flagged = anomalies_data.get("anomalies", [])
    if flagged:
        anomaly_data = [["Date", "Category", "Description", "Amount"]]
        for a in flagged:
            anomaly_data.append([a["date"], a["category"], a["description"] or "-", f"{a['amount']:,.2f}"])
        anomaly_table = Table(anomaly_data, colWidths=[1.1 * inch, 1.3 * inch, 2.4 * inch, 1.1 * inch])
        anomaly_table.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F6F54")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D2C9AE")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(anomaly_table)
    else:
        elements.append(Paragraph("No unusually large transactions detected.", body_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer