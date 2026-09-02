const BASE = "/api";

function getToken() {
  return localStorage.getItem("ledger_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Only force a redirect-to-login on 401s from AUTHENTICATED routes
    // (i.e. an expired/invalid session). A 401 from the login/signup
    // endpoints themselves just means "wrong password" — that should
    // show as a normal inline error, not force a page reload.
    const isAuthEndpoint = path.startsWith("/auth/");
    if (res.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("ledger_token");
      localStorage.removeItem("ledger_user");
      window.location.href = "/login";
    }
    const message = data?.error || data?.msg || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

// ---------- Auth ----------
export const signup = (email, password, name) =>
  request("/auth/signup", { method: "POST", body: JSON.stringify({ email, password, name }) });

export const login = (email, password) =>
  request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const getMe = () => request("/auth/me");

// ---------- Categories ----------
export const getCategories = () => request("/categories");
export const createCategory = (name) =>
  request("/categories", { method: "POST", body: JSON.stringify({ name }) });

// ---------- Expenses ----------
export const getExpenses = () => request("/expenses");

export const createExpense = (payload) =>
  request("/expenses", { method: "POST", body: JSON.stringify(payload) });

export const updateExpense = (id, payload) =>
  request(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteExpense = (id) =>
  request(`/expenses/${id}`, { method: "DELETE" });

// ---------- Reports ----------
export const getMonthlySummary = () => request("/reports/monthly-summary");

export const getCategoryBreakdown = (month) =>
  request(`/reports/category-breakdown${month ? `?month=${month}` : ""}`);

export const getTopCategories = (limit = 5) =>
  request(`/reports/top-categories?limit=${limit}`);

export const getCategoryTrend = (category) =>
  request(`/reports/category-trend?category=${encodeURIComponent(category)}`);

export const getSummaryStats = () => request("/reports/summary-stats");

// ---------- Analytics (pandas-driven) ----------
export const getAnalyticsSummary = () => request("/analytics/summary");
export const getAnalyticsConcentration = () => request("/analytics/concentration");
export const getAnalyticsMonthlyTrend = () => request("/analytics/monthly-trend");
export const getAnalyticsAnomalies = () => request("/analytics/anomalies");
export const getAnalyticsDayOfWeek = () => request("/analytics/day-of-week");

// ---------- Admin ----------
export const getAdminUsers = () => request("/admin/users");
export const getAdminStats = () => request("/admin/stats");

// ---------- Admin analytics (platform-wide) ----------
export const getAdminAnalyticsSummary = () => request("/admin/analytics/summary");
export const getAdminAnalyticsConcentration = () => request("/admin/analytics/concentration");
export const getAdminAnalyticsMonthlyTrend = () => request("/admin/analytics/monthly-trend");
export const getAdminAnalyticsAnomalies = () => request("/admin/analytics/anomalies");

// ---------- AI Assistant ----------
export const askAI = (question) =>
  request("/ai/ask", { method: "POST", body: JSON.stringify({ question }) });


// ------------  PDF downloads --------------------
export async function downloadPdfReport() {
  const token = getToken();
  const res = await fetch(`${BASE}/reports/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || "Failed to generate report.");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "expense_report.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// ----------- Forgot password-------------
export const forgotPassword = (email) =>
  request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });

export const resetPassword = (token, password) =>
  request("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });