import { useEffect, useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ExpenseTable from "../components/ExpenseTable";
import ExpenseFormModal from "../components/ExpenseFormModal";
import * as api from "../lib/api";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const loadAll = async () => {
    try {
      const [expensesData, categoriesData] = await Promise.all([
        api.getExpenses(),
        api.getCategories(),
      ]);
      setExpenses(expensesData);
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

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        !search ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, categoryFilter]);

  const openCreate = () => {
    setEditingExpense(null);
    setModalOpen(true);
  };

  const openEdit = (expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (editingExpense) {
      await api.updateExpense(editingExpense.id, payload);
    } else {
      await api.createExpense(payload);
    }
    await loadAll();
  };

  const handleCreateCategory = async (name) => {
    const created = await api.createCategory(name);
    setCategories((prev) => [...prev, created]);
    return created;
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await api.deleteExpense(pendingDelete.id);
    setPendingDelete(null);
    await loadAll();
  };

  if (loading) {
    return <div className="p-10 text-ink-soft">Loading entries…</div>;
  }

  return (
    <div>
      <PageHeader eyebrow="Every entry" title="Expenses">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-emerald text-paper-card px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-dark transition-colors"
        >
          <Plus size={16} /> New entry
        </button>
      </PageHeader>

      <div className="px-6 md:px-10 py-8 space-y-5">
        {errorMsg && (
          <p className="text-sm text-rust bg-rust/10 rounded px-3 py-2">{errorMsg}</p>
        )}

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description or category…"
              className="w-full bg-paper-card border border-line rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-paper-card border border-line rounded-md px-3 py-2 text-sm focus:outline-none"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <ExpenseTable expenses={filtered} onEdit={openEdit} onDelete={setPendingDelete} />
      </div>

      <ExpenseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        categories={categories}
        initialData={editingExpense}
        onCreateCategory={handleCreateCategory}
      />

      {pendingDelete && (
        <div
          className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="bg-paper-card border border-line rounded-lg w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-lg text-ink mb-2">Delete this entry?</h2>
            <p className="text-sm text-ink-soft mb-5">
              {pendingDelete.description || pendingDelete.category} —{" "}
              <span className="font-mono">{pendingDelete.amount.toFixed(2)}</span> on{" "}
              {pendingDelete.date}. This can't be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 border border-line rounded-md py-2 text-sm font-medium text-ink-soft hover:bg-line-soft"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-rust text-paper-card rounded-md py-2 text-sm font-medium hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}