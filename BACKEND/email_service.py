"""
email_service.py
-----------------
Sends transactional emails (password reset links) via Gmail SMTP.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")


def send_reset_email(to_email, reset_link):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset your Ledger password"
    msg["From"] = GMAIL_ADDRESS
    msg["To"] = to_email

    text_body = (
        f"You requested a password reset for your Ledger account.\n\n"
        f"Click this link to set a new password (valid for 30 minutes):\n"
        f"{reset_link}\n\n"
        f"If you didn't request this, you can safely ignore this email."
    )

    html_body = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #1F6F54;">Reset your password</h2>
        <p>You requested a password reset for your Ledger account.</p>
        <p>
            <a href="{reset_link}"
               style="display: inline-block; background: #1F6F54; color: white;
                      padding: 10px 20px; border-radius: 6px; text-decoration: none;">
                Reset Password
            </a>
        </p>
        <p style="color: #666; font-size: 13px;">
            This link is valid for 30 minutes. If you didn't request this,
            you can safely ignore this email.
        </p>
    </div>
    """

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_ADDRESS, to_email, msg.as_string())