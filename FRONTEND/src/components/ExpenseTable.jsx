import { Pencil, Trash2 } from "lucide-react";
import CategoryTag from "./CategoryTag";

const formatAmount = (n) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function ExpenseTable({ expenses, onEdit, onDelete }) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-line rounded-lg">
        <p className="text-ink-soft">No entries yet.</p>
        <p className="text-sm text-ink-soft mt-1">Add your first expense to start the ledger.</p>
      </div>
    );
  }

  return (
    <div className="border border-line rounded-lg overflow-hidden bg-paper-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
            <th className="px-5 py-3 font-medium">Date</th>
            <th className="px-5 py-3 font-medium">Category</th>
            <th className="px-5 py-3 font-medium">Description</th>
            <th className="px-5 py-3 font-medium text-right">Amount</th>
            <th className="px-5 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e, i) => (
            <tr
              key={e.id}
              className={`border-b border-line-soft last:border-b-0 hover:bg-line-soft/40 transition-colors ${
                i % 2 === 1 ? "bg-paper/40" : ""
              }`}
            >
              <td className="px-5 py-3 font-mono text-xs text-ink-soft whitespace-nowrap">
                {formatDate(e.date)}
              </td>
              <td className="px-5 py-3">
                <CategoryTag name={e.category} />
              </td>
              <td className="px-5 py-3 text-ink-soft max-w-xs truncate">
                {e.description || "—"}
              </td>
              <td className="px-5 py-3 text-right font-mono tabular-nums font-medium">
                {formatAmount(e.amount)}
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(e)}
                    className="p-1.5 rounded text-ink-soft hover:text-emerald hover:bg-emerald/10"
                    aria-label={`Edit entry from ${formatDate(e.date)}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(e)}
                    className="p-1.5 rounded text-ink-soft hover:text-rust hover:bg-rust/10"
                    aria-label={`Delete entry from ${formatDate(e.date)}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}