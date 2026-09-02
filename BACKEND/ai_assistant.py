"""
ai_assistant.py
---------------
Lets a user ask natural-language questions about their own expense
data. Builds a compact, scoped data summary from their expenses,
then sends it + their question to Grok (xAI), instructing the model
to answer using ONLY that data — never inventing numbers.
"""

import os
from dotenv import load_dotenv
from openai import OpenAI
import pandas as pd

from database import get_connection

load_dotenv()

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)


def _load_user_expenses_df(user_id):
    conn = get_connection()
    query = """
        SELECT e.date, e.amount, c.name AS category, e.description
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = ?
        ORDER BY e.date
    """
    df = pd.read_sql_query(query, conn, params=(user_id,))
    conn.close()
    return df


def _build_data_context(df):
    """
    Turn the user's expenses into a compact plain-text table the model
    can read reliably — this is the ONLY data source the model sees,
    scoped entirely to this one user.
    """
    if df.empty:
        return "This user has no recorded expenses yet."

    lines = ["date | category | description | amount"]
    for _, row in df.iterrows():
        lines.append(f"{row['date']} | {row['category']} | {row['description'] or '-'} | {row['amount']:.2f}")

    total = df["amount"].sum()
    lines.append(f"\nTOTAL across all entries: {total:.2f}")
    return "\n".join(lines)


def ask_question(user_id, question):
    df = _load_user_expenses_df(user_id)
    data_context = _build_data_context(df)

    system_prompt = (
        "You are a helpful financial assistant embedded in a personal expense "
        "tracking app. You answer questions using ONLY the expense data provided "
        "below — never invent numbers or assume data that isn't shown. "
        "If the data doesn't contain enough information to answer confidently, "
        "say so clearly. Keep answers concise (2-4 sentences), friendly, and "
        "use the currency symbol/style implied by the numbers (assume plain "
        "numeric amounts, no currency conversion). Use exact figures from the "
        "data when possible.\n\n"
        f"EXPENSE DATA:\n{data_context}"
    )

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ],
        max_tokens=600,
    )

    answer = response.choices[0].message.content

    if not answer or not answer.strip():
        return "I wasn't able to form a complete answer to that — try rephrasing your question, or ask something more specific."

    return answer
