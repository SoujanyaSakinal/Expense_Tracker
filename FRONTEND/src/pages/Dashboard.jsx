import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import CategoryPieChart from "../components/CategoryPieChart";
import MonthlyTrendChart from "../components/MonthlyTrendChart";
import ExpenseTable from "../components/ExpenseTable";
import ExpenseFormModal from "../components/ExpenseFormModal";
import * as api from "../lib/api";

const fmt = (n) => (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [recent, setRecent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadAll = async () => {
    try {
      const [statsData, breakdownData, monthlyData, expensesData, categoriesData] =
        await Promise.all([
          api.getSummaryStats(),
          api.getCategoryBreakdown(),
          api.getMonthlySummary(),
          api.getExpenses(),
          api.getCategories(),
        ]);
      setStats(statsData);
      setBreakdown(breakdownData);
      setMonthly(monthlyData);
      setRecent(expensesData.slice(0, 5));
      setCategories(categoriesData);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreate = async (payload) => {
    await api.createExpense(payload);
    await loadAll();
  };

  const handleCreateCategory = async (name) => {
    const created = await api.createCategory(name);
    setCategories((prev) => [...prev, created]);
    return created;
  };

  if (loading) {
    return <div className="p-10 text-ink-soft">Loading ledger…</div>;
  }

  return (
    <div>
      <PageHeader eyebrow="Overview" title="Dashboard">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-emerald text-paper-card px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-dark transition-colors"
        >
          <Plus size={16} /> New entry
        </button>
      </PageHeader>

      <div className="px-6 md:px-10 py-8 space-y-8">
        {errorMsg && (
          <p className="text-sm text-rust bg-rust/10 rounded px-3 py-2">
            {errorMsg} — is the Flask backend running on port 5000?
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="This month" value={fmt(stats?.current_month_total)} accent="emerald" />
          <StatCard label="All-time total" value={fmt(stats?.total_spent)} accent="ink" />
          <StatCard label="Transactions" value={stats?.total_transactions ?? 0} accent="gold" />
          <StatCard label="Top category" value={stats?.top_category || "—"} accent="rust" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="perforated-top bg-paper-card border border-line rounded-lg pt-7 px-5 pb-5">
            <h2 className="font-display text-lg mb-2 text-ink">Where it goes</h2>
            <CategoryPieChart data={breakdown} />
          </div>
          <div className="perforated-top bg-paper-card border border-line rounded-lg pt-7 px-5 pb-5">
            <h2 className="font-display text-lg mb-2 text-ink">Monthly trend</h2>
            <MonthlyTrendChart data={monthly} />
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg mb-3 text-ink">Recent entries</h2>
          <ExpenseTable expenses={recent} onEdit={() => {}} onDelete={() => {}} />
        </div>
      </div>

      <ExpenseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        categories={categories}
        onCreateCategory={handleCreateCategory}
      />
    </div>
  );
}