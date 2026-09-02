import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import CategoryPieChart from "../components/CategoryPieChart";
import MonthlyTrendChart from "../components/MonthlyTrendChart";
import CategoryTrendChart from "../components/CategoryTrendChart";
import CategoryTag from "../components/CategoryTag";
import { colorForCategory } from "../lib/categoryColors";
import * as api from "../lib/api";

const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Reports() {
  const [breakdown, setBreakdown] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryTrend, setCategoryTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [breakdownData, monthlyData, topData, categoriesData] = await Promise.all([
          api.getCategoryBreakdown(),
          api.getMonthlySummary(),
          api.getTopCategories(5),
          api.getCategories(),
        ]);
        setBreakdown(breakdownData);
        setMonthly(monthlyData);
        setTopCategories(topData);
        setCategories(categoriesData);
        if (categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].name);
        }
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;
    api.getCategoryTrend(selectedCategory).then(setCategoryTrend).catch((err) => setErrorMsg(err.message));
  }, [selectedCategory]);

  if (loading) {
    return <div className="p-10 text-ink-soft">Loading reports…</div>;
  }

  return (
    <div>
      <PageHeader eyebrow="Insights" title="Reports" />

      <div className="px-6 md:px-10 py-8 space-y-8">
        {errorMsg && (
          <p className="text-sm text-rust bg-rust/10 rounded px-3 py-2">{errorMsg}</p>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="perforated-top bg-paper-card border border-line rounded-lg pt-7 px-5 pb-5">
            <h2 className="font-display text-lg mb-2 text-ink">Category-wise breakdown</h2>
            <CategoryPieChart data={breakdown} />
          </div>
          <div className="perforated-top bg-paper-card border border-line rounded-lg pt-7 px-5 pb-5">
            <h2 className="font-display text-lg mb-2 text-ink">Monthly summary</h2>
            <MonthlyTrendChart data={monthly} />
          </div>
        </div>

        <div className="perforated-top bg-paper-card border border-line rounded-lg pt-7 px-5 pb-5">
          <h2 className="font-display text-lg mb-4 text-ink">Top spending categories</h2>
          <div className="space-y-3">
            {topCategories.map((row, i) => {
              const maxTotal = topCategories[0]?.total || 1;
              const pct = (row.total / maxTotal) * 100;
              return (
                <div key={row.category} className="flex items-center gap-4">
                  <span className="font-mono text-xs text-ink-soft w-4">{i + 1}</span>
                  <div className="w-32 shrink-0">
                    <CategoryTag name={row.category} />
                  </div>
                  <div className="flex-1 h-2 bg-line-soft rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: colorForCategory(row.category) }}
                    />
                  </div>
                  <span className="font-mono text-sm tabular-nums w-24 text-right">
                    {fmt(row.total)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="perforated-top bg-paper-card border border-line rounded-lg pt-7 px-5 pb-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
            <h2 className="font-display text-lg text-ink">Spending trend by category</h2>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-paper border border-line rounded-md px-3 py-1.5 text-sm focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <CategoryTrendChart data={categoryTrend} color={colorForCategory(selectedCategory)} />
        </div>
      </div>
    </div>
  );
}