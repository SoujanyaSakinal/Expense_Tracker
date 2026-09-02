import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function MonthlyTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-ink-soft text-sm">
        No spending data yet.
      </div>
    );
  }

  // Reverse so chart reads left-to-right chronologically
  const chartData = [...data].reverse();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line-soft)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fontFamily: "var(--font-mono)", fill: "var(--color-ink-soft)" }}
          axisLine={{ stroke: "var(--color-line)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fontFamily: "var(--font-mono)", fill: "var(--color-ink-soft)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          contentStyle={{
            backgroundColor: "var(--color-paper-card)",
            border: "1px solid var(--color-line)",
            borderRadius: 8,
            fontFamily: "var(--font-sans)",
            fontSize: 13,
          }}
        />
        <Bar dataKey="total" fill="var(--color-emerald)" radius={[4, 4, 0, 0]} maxBarSize={56} />
      </BarChart>
    </ResponsiveContainer>
  );
}