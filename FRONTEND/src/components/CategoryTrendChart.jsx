import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function CategoryTrendChart({ data, color = "var(--color-emerald)" }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-ink-soft text-sm">
        No data for this category yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
        <Line
          type="monotone"
          dataKey="total"
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 4, fill: color }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}