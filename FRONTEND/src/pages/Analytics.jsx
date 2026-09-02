import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import CategoryTag from "../components/CategoryTag";
import * as api from "../lib/api";
import AIAssistant from "../components/AIAssistant";
import { Download } from "lucide-react";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const fmt = (n) => (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [concentration, setConcentration] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [anomalies, setAnomalies] = useState(null);
  const [dayOfWeek, setDayOfWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, c, m, a, d] = await Promise.all([
          api.getAnalyticsSummary(),
          api.getAnalyticsConcentration(),
          api.getAnalyticsMonthlyTrend(),
          api.getAnalyticsAnomalies(),
          api.getAnalyticsDayOfWeek(),
        ]);
        setSummary(s);
        setConcentration(c);
        setMonthlyTrend(m);
        setAnomalies(a);
        setDayOfWeek(d);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="p-10 text-ink-soft">Crunching the numbers…</div>;
  }

  const latestChange = monthlyTrend.length > 0 ? monthlyTrend[monthlyTrend.length - 1] : null;

  const handleDownload = async () => {
    setDownloading(true);
    setErrorMsg("");
    try {
      await api.downloadPdfReport();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Deeper insights" title="Analytics">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 bg-emerald text-paper-card px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-dark transition-colors disabled:opacity-60"
        >
          <Download size={16} />
          {downloading ? "Generating…" : "Download Report"}
        </button>
      </PageHeader>

      <div className="px-6 md:px-10 py-8 space-y-8">
        {errorMsg && (
          <p className="text-sm text-rust bg-rust/10 rounded px-3 py-2">{errorMsg}</p>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Avg transaction" value={fmt(summary?.average)} accent="emerald" />
          <StatCard label="Median transaction" value={fmt(summary?.median)} accent="ink" />
          <StatCard
            label="Volatility"
            value={`${summary?.volatility_pct ?? 0}%`}
            sub="how spiky spending is"
            accent="gold"
          />
          <StatCard
            label="Latest month change"
            value={latestChange?.pct_change != null ? `${latestChange.pct_change > 0 ? "+" : ""}${latestChange.pct_change}%` : "—"}
            accent={latestChange?.pct_change > 0 ? "rust" : "emerald"}
          />
        </div>

        {/* AI Assistant */}
        <AIAssistant />

        {/* Category concentration */}
        <div className="perforated-top bg-paper-card border border-line rounded-lg pt-7 px-5 pb-5">
          <h2 className="font-display text-lg mb-3 text-ink">Category concentration</h2>
          {concentration?.top_category ? (
            <p className="text-sm text-ink-soft">
              Your biggest spending category is{" "}
              <CategoryTag name={concentration.top_category} />, making up{" "}
              <span className="font-mono font-medium text-ink">{concentration.top_category_pct}%</span> of all
              spending. Your top 2 categories together account for{" "}
              <span className="font-mono font-medium text-ink">{concentration.top_2_pct}%</span> of total spend.
            </p>
          ) : (
            <p className="text-sm text-ink-soft">Not enough data yet.</p>
          )}
        </div>

        {/* Monthly trend with % change */}
        <div className="perforated-top bg-paper-card border border-line rounded-lg pt-7 px-5 pb-5">
          <h2 className="font-display text-lg mb-2 text-ink">Monthly trend</h2>
          {monthlyTrend.length > 0 ? (
            <>
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
              <div className="mt-3 space-y-1">
                {monthlyTrend.map((m) => (
                  <div key={m.month} className="flex justify-between text-xs text-ink-soft font-mono">
                    <span>{m.month}</span>
                    <span>
                      {fmt(m.total)}
                      {m.pct_change != null && (
                        <span className={m.pct_change > 0 ? "text-rust ml-2" : "text-emerald ml-2"}>
                          {m.pct_change > 0 ? "▲" : "▼"} {Math.abs(m.pct_change)}%
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-soft">Not enough data yet.</p>
          )}
        </div>

        {/* Anomalies */}
        <div className="perforated-top bg-paper-card border border-line rounded-lg pt-7 px-5 pb-5">
          <h2 className="font-display text-lg mb-3 text-ink flex items-center gap-2">
            <AlertTriangle size={18} className="text-rust" />
            Unusual transactions
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
                  </div>
                  <span className="font-mono font-medium text-rust">{fmt(a.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-soft">No unusually large transactions detected.</p>
          )}
        </div>

        {/* Day of week */}
        <div className="perforated-top bg-paper-card border border-line rounded-lg pt-7 px-5 pb-5">
          <h2 className="font-display text-lg mb-2 text-ink">Spending by day of week</h2>
          {dayOfWeek?.busiest_day && (
            <p className="text-sm text-ink-soft mb-3">
              You tend to spend the most on <span className="font-medium text-ink">{dayOfWeek.busiest_day}s</span>.
            </p>
          )}
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dayOfWeek?.by_day || []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line-soft)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: "var(--font-sans)", fill: "var(--color-ink-soft)" }} axisLine={{ stroke: "var(--color-line)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fontFamily: "var(--font-mono)", fill: "var(--color-ink-soft)" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                contentStyle={{ backgroundColor: "var(--color-paper-card)", border: "1px solid var(--color-line)", borderRadius: 8, fontFamily: "var(--font-sans)", fontSize: 13 }}
              />
              <Bar dataKey="total" fill="var(--color-gold)" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}