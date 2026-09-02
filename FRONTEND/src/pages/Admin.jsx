import { useEffect, useState } from "react";
import { Users, Crown, AlertTriangle } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import CategoryTag from "../components/CategoryTag";
import * as api from "../lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { colorForCategory } from "../lib/categoryColors";

const fmt = (n) => (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [platformSummary, setPlatformSummary] = useState(null);
  const [concentration, setConcentration] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [statsData, usersData, summaryData, concData, trendData, anomData] = await Promise.all([
          api.getAdminStats(),
          api.getAdminUsers(),
          api.getAdminAnalyticsSummary(),
          api.getAdminAnalyticsConcentration(),
          api.getAdminAnalyticsMonthlyTrend(),
          api.getAdminAnalyticsAnomalies(),
        ]);
        setStats(statsData);
        setUsers(usersData);
        setPlatformSummary(summaryData);
        setConcentration(concData);
        setMonthlyTrend(trendData);
        setAnomalies(anomData);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="p-10 text-ink-soft">Loading admin data…</div>;
  }

  return (
    <div>
      <PageHeader eyebrow="Platform overview" title="Admin" />

      <div className="px-6 md:px-10 py-8 space-y-8">
        {errorMsg && (
          <p className="text-sm text-rust bg-rust/10 rounded px-3 py-2">{errorMsg}</p>
        )}

        {/* Platform stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total users" value={stats?.total_users ?? 0} accent="emerald" />
          <StatCard label="Total expenses logged" value={stats?.total_expenses ?? 0} accent="ink" />
          <StatCard label="Total tracked" value={fmt(stats?.total_amount_tracked)} accent="gold" />
          <StatCard
            label="Most active user"
            value={stats?.most_active_user || "—"}
            sub={stats?.most_active_user ? `${stats.most_active_user_count} entries` : undefined}
            accent="rust"
          />
        </div>

        {/* Platform-wide statistical summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Avg transaction (all users)" value={fmt(platformSummary?.average)} accent="emerald" />
          <StatCard label="Std deviation" value={fmt(platformSummary?.std_dev)} accent="ink" />
          <StatCard label="Volatility" value={`${platformSummary?.volatility_pct ?? 0}%`} accent="gold" />
        </div>

        {/* Platform category breakdown */}
        <div className="perforated-top bg-paper-card border border-line rounded-lg pt-7 px-5 pb-5">
          <h2 className="font-display text-lg mb-4 text-ink">Spending by category — all users</h2>
          <div className="space-y-3">
            {(concentration?.breakdown || []).map((row) => (
              <div key={row.category} className="flex items-center gap-4">
                <div className="w-32 shrink-0">
                  <CategoryTag name={row.category} />
                </div>
                <div className="flex-1 h-2 bg-line-soft rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${row.pct}%`, backgroundColor: colorForCategory(row.category) }}
                  />
                </div>
                <span className="font-mono text-sm tabular-nums w-24 text-right">{fmt(row.total)}</span>
                <span className="font-mono text-xs text-ink-soft w-12 text-right">{row.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform monthly trend */}
        <div className="perforated-top bg-paper-card border border-line rounded-lg pt-7 px-5 pb-5">
          <h2 className="font-display text-lg mb-2 text-ink">Monthly trend — all users</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line-soft)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fontFamily: "var(--font-mono)", fill: "var(--color-ink-soft)" }} axisLine={{ stroke: "var(--color-line)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fontFamily: "var(--font-mono)", fill: "var(--color-ink-soft)" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                contentStyle={{ backgroundColor: "var(--color-paper-card)", border: "1px solid var(--color-line)", borderRadius: 8, fontFamily: "var(--font-sans)", fontSize: 13 }}
              />
              <Bar dataKey="total" fill="var(--color-emerald)" radius={[4, 4, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Platform anomalies */}
        <div className="perforated-top bg-paper-card border border-line rounded-lg pt-7 px-5 pb-5">
          <h2 className="font-display text-lg mb-3 text-ink flex items-center gap-2">
            <AlertTriangle size={18} className="text-rust" />
            Unusual transactions — all users
          </h2>
          {anomalies?.anomalies?.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-ink-soft mb-2">
                Flagged using mean + 2 standard deviations (threshold: {fmt(anomalies.threshold)})
              </p>
              {anomalies.anomalies.map((a, i) => (
                <div key={i} className="flex items-center justify-between border-b border-line-soft last:border-0 py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-ink-soft">{a.date}</span>
                    <CategoryTag name={a.category} />
                    <span className="text-ink-soft">{a.description}</span>
                    <span className="text-xs text-ink-soft">({a.user})</span>
                  </div>
                  <span className="font-mono font-medium text-rust">{fmt(a.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-soft">No unusually large transactions detected.</p>
          )}
        </div>

        {/* User list */}
        <div>
          <h2 className="font-display text-lg mb-3 text-ink flex items-center gap-2">
            <Users size={18} className="text-emerald" />
            All users
          </h2>
          <div className="border border-line rounded-lg overflow-hidden bg-paper-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium text-right">Entries</th>
                  <th className="px-5 py-3 font-medium text-right">Total spent</th>
                  <th className="px-5 py-3 font-medium text-right">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className={`border-b border-line-soft last:border-b-0 ${i % 2 === 1 ? "bg-paper/40" : ""}`}>
                    <td className="px-5 py-3 font-medium text-ink">{u.name || "—"}</td>
                    <td className="px-5 py-3 font-medium text-ink">{u.email}</td>
                    <td className="px-5 py-3 font-mono text-xs text-ink-soft">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-3 text-right font-mono">{u.expense_count}</td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums">{fmt(u.total_spent)}</td>
                    <td className="px-5 py-3 text-right">
                      {u.is_admin ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gold">
                          <Crown size={13} /> Admin
                        </span>
                      ) : (
                        <span className="text-xs text-ink-soft">User</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}