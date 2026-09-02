# 📒 Ledger – AI-Powered Expense Tracker with Analytics

A production-style full-stack expense management application that combines **Software Engineering**, **Data Analytics**, and **Generative AI** to help users securely track expenses, visualize spending patterns, generate analytical reports, and interact with their financial data using natural language.

---

# 🚀 Project Highlights

- 🔐 Secure JWT Authentication & Role-Based Access Control
- 💰 Complete Expense Management System (CRUD)
- 📊 SQL Reporting & Interactive Dashboard
- 📈 Advanced Data Analytics using Pandas
- 🤖 AI-powered Expense Assistant using Groq LLM
- 📄 Automated PDF Report Generation
- 👨‍💼 Admin Dashboard with Platform-wide Analytics

---
## 📸 Screenshots

### Login

<img width="1915" height="958" alt="image" src="https://github.com/user-attachments/assets/3191bb19-f8de-4a2f-bba5-6303d9dd1802" />


### Dashboard

<img width="1912" height="896" alt="image" src="https://github.com/user-attachments/assets/cbdf8f83-9b2a-4cf3-bdd3-843b56fd4e28" />


### Analytics

<img width="1917" height="885" alt="image" src="https://github.com/user-attachments/assets/2edba726-b165-47c1-b68a-e072331f85cc" />
<img width="1917" height="897" alt="image" src="https://github.com/user-attachments/assets/1332b45b-13b5-461b-80f0-f34c7a24772f" />


### AI Assistant

<img width="1580" height="631" alt="image" src="https://github.com/user-attachments/assets/27355af4-55db-4965-ae91-bd0a8452f524" />


### Admin Panel

<img width="1912" height="891" alt="image" src="https://github.com/user-attachments/assets/6fe70d2a-afe9-48df-ab80-f5c7322105d5" />
<img width="1580" height="876" alt="image" src="https://github.com/user-attachments/assets/225a9c3e-6722-4e97-857e-ddfc7993120b" />
<img width="1577" height="626" alt="image" src="https://github.com/user-attachments/assets/33daf59d-53ba-4c0a-a77a-c30afdfe7201" />


### PDF Report

<img width="1005" height="852" alt="image" src="https://github.com/user-attachments/assets/7d70633b-4f6e-47a9-9284-aa1e6a61f72c" />


---


# 🏗️ System Architecture

```
                     React + Tailwind CSS
                              │
                              ▼
                     Flask REST API Backend
                              │
      ┌───────────────────────┼────────────────────────┐
      │                       │                        │
      ▼                       ▼                        ▼
 SQLite Database      Pandas Analytics        Groq LLM API
      │                       │                        │
      └───────────────┬───────┴────────────────────────┘
                      ▼
             PDF Report Generator
```

---

# ✨ Features

## 🔐 Authentication & Security

- Secure user registration and login
- Password hashing using industry-standard techniques
- JWT-based authentication with token expiry
- Password reset using Gmail SMTP
- Time-limited password reset tokens
- Complete per-user data isolation
- Role-Based Access Control (Admin/User)

---

## 💰 Expense Management

- Add expenses
- Update expenses
- Delete expenses
- Custom expense categories
- Search & filter functionality
- Responsive dashboard
- Live expense statistics
- Interactive Pie & Bar Charts

---

## 📊 SQL Reporting

Generate reports using SQL aggregate queries.

Includes:

- Monthly Expense Summary
- Category-wise Spending
- Top Spending Categories
- Date-wise Reports

SQL Concepts Used:

- GROUP BY
- SUM()
- COUNT()
- strftime()

---

# 📈 Data Analytics & Business Intelligence

Ledger goes beyond traditional CRUD operations by integrating a complete **Pandas-powered analytics pipeline**.

## Data Processing

- Data Cleaning
- Data Transformation
- Date Feature Extraction
- Monthly Aggregations
- Category-wise Aggregations

## Exploratory Data Analysis (EDA)

- Descriptive Statistics
- Spending Distribution Analysis
- Category Concentration
- Month-over-Month Trends
- Day-of-Week Spending Behaviour
- Highest & Lowest Spending Periods

## Statistical Analysis

- Mean
- Median
- Standard Deviation
- Spending Variance Analysis
- Outlier Detection using **Mean + 2σ**

## Data Visualization

Built using **Matplotlib** and **Seaborn**

Visualizations include:

- Monthly Spending Trends
- Category Distribution
- Spending Comparison Charts
- Weekly Spending Patterns
- Time Series Analysis

## Analytics Dashboard

The same analytical computations performed inside the Jupyter Notebook are exposed through Flask REST APIs and displayed dynamically inside the React Analytics Dashboard.

---

# 📊 Business Insights Generated

The analytics engine automatically identifies:

- 📌 Highest Spending Category
- 📌 Monthly Spending Trends
- 📌 Spending Distribution
- 📌 Category Concentration
- 📌 Day-of-Week Spending Behaviour
- 📌 Peak Spending Periods
- 📌 Statistical Spending Anomalies
- 📌 User Spending Patterns

---

# 🤖 AI Expense Assistant

Integrated with **Groq LLM** to provide natural-language financial insights.

Example questions:

- "Where did I spend the most money this month?"
- "How much did I spend on food?"
- "Which category increased compared to last month?"
- "Summarize my spending."

The AI responses are grounded strictly on the authenticated user's expense data, ensuring accurate and personalized insights.

---

# 📄 PDF Report Generation

Generate professional PDF reports containing:

- Expense Summary
- Spending Charts
- Category Breakdown
- Monthly Trends
- Statistical Anomalies
- Personalized User Details

---

# 👨‍💼 Admin Dashboard

Role-based Admin Panel providing:

- Platform-wide Statistics
- Total Registered Users
- User Activity Metrics
- Platform Expense Analytics
- Cross-user Reports

Unauthorized users receive **403 Forbidden** responses.

---

# 🛠️ Technology Stack

## Backend

- Python
- Flask
- SQLite
- Flask-JWT-Extended
- SMTP Email Service

## Frontend

- React
- Vite
- Tailwind CSS
- Recharts

## Data Analytics

- Pandas
- NumPy
- Matplotlib
- Seaborn

## AI

- Groq LLM API

---

# 🎯 Skills Demonstrated

## Full Stack Development

- REST API Development
- Database Design
- Authentication & Authorization
- CRUD Operations
- State Management
- Error Handling
- Role-Based Access Control

## Data Analytics

- Data Cleaning
- Exploratory Data Analysis (EDA)
- Statistical Analysis
- Business Intelligence
- Trend Analysis
- Data Visualization
- Dashboard Development

## Artificial Intelligence

- Prompt Engineering
- LLM API Integration
- Context-aware AI Responses
- AI-assisted Financial Insights

---

# 🚧 Technical Challenges Solved

During development, several real-world engineering challenges were addressed:

- Implemented secure JWT authentication with user-level data isolation.
- Designed role-based authorization for admin-specific features.
- Built reusable analytics APIs powered by Pandas.
- Integrated Groq LLM while ensuring AI responses remain grounded in authenticated user data.
- Generated dynamic PDF reports with embedded charts and analytical summaries.
- Debugged API authentication, AI integration, and report generation through systematic testing and iterative improvements.

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/SoujanyaSakinal/Expense_Tracker.git
```

## Backend

```bash
cd BACKEND

pip install -r requirements.txt

python app.py
```

## Frontend

```bash
cd FRONTEND

npm install

npm run dev
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend directory.

```env
SECRET_KEY=

JWT_SECRET_KEY=

GROQ_API_KEY=

EMAIL_USER=

EMAIL_PASSWORD=
```

---

# 🚀 Future Enhancements

- Machine Learning-based Expense Prediction
- Budget Recommendation System
- OCR Bill Scanner
- Mobile Application
- Email Report Scheduling
- Multi-currency Support
- Cloud Deployment
- Docker Containerization

---

# 👩‍💻 Author

**Soujanya Sakinal**

🎓 MCA Graduate | Full Stack Developer | Data Analytics Enthusiast | GenAI Developer

**GitHub:** https://github.com/SoujanyaSakinal

---
