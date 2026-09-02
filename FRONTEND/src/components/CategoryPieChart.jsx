import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { colorForCategory } from "../lib/categoryColors";

export default function CategoryPieChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-ink-soft text-sm">
        No spending data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="category"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.category} fill={colorForCategory(entry.category)} stroke="var(--color-paper-card)" strokeWidth={2} />
          ))}
        </Pie>
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
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 13, fontFamily: "var(--font-sans)", color: "var(--color-ink-soft)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}