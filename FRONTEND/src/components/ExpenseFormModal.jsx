import { useState, useEffect } from "react";
import { X } from "lucide-react";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function ExpenseFormModal({
  open,
  onClose,
  onSubmit,
  categories,
  initialData,
  onCreateCategory,
}) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setAmount(String(initialData.amount));
      setDescription(initialData.description || "");
      setDate(initialData.date);
      const match = categories.find((c) => c.name === initialData.category);
      setCategoryId(match ? String(match.id) : "");
    } else {
      setAmount("");
      setDescription("");
      setDate(todayISO());
      setCategoryId(categories[0] ? String(categories[0].id) : "");
    }
    setError("");
    setShowNewCategory(false);
    setNewCategory("");
  }, [open, initialData, categories]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!categoryId) {
      setError("Choose a category.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        amount: numericAmount,
        category_id: parseInt(categoryId, 10),
        description: description.trim(),
        date,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      const created = await onCreateCategory(name);
      setCategoryId(String(created.id));
      setShowNewCategory(false);
      setNewCategory("");
    } catch (err) {
      setError(err.message || "Could not add category.");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-paper-card border border-line rounded-lg w-full max-w-md perforated-top pt-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pb-4 border-b border-line">
          <h2 className="font-display text-xl text-ink">
            {isEdit ? "Edit entry" : "New entry"}
          </h2>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink p-1 rounded"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-rust bg-rust/10 rounded px-3 py-2">{error}</p>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wide text-ink-soft mb-1.5">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full font-mono text-lg bg-paper border border-line rounded-md px-3 py-2 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-ink-soft mb-1.5">
              Category
            </label>
            {!showNewCategory ? (
              <div className="flex gap-2">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex-1 bg-paper border border-line rounded-md px-3 py-2 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="text-sm text-emerald border border-emerald/40 rounded-md px-3 hover:bg-emerald/10"
                >
                  + New
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Category name"
                  className="flex-1 bg-paper border border-line rounded-md px-3 py-2 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="text-sm bg-emerald text-paper-card rounded-md px-3 hover:bg-emerald-dark"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-ink-soft mb-1.5">
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional note"
              className="w-full bg-paper border border-line rounded-md px-3 py-2 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-ink-soft mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-paper border border-line rounded-md px-3 py-2 focus:outline-none font-mono text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-line rounded-md py-2 text-sm font-medium text-ink-soft hover:bg-line-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-emerald text-paper-card rounded-md py-2 text-sm font-medium hover:bg-emerald-dark disabled:opacity-60"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}