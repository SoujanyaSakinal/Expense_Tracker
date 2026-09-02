export default function StatCard({ label, value, sub, accent = "emerald" }) {
  const accentClass = {
    emerald: "text-emerald",
    rust: "text-rust",
    gold: "text-gold",
    ink: "text-ink",
  }[accent];

  const isLongText = typeof value === "string" && value.length > 12;

  return (
    <div className="perforated-top bg-paper-card border border-line rounded-lg px-6 pt-7 pb-5 min-w-0">
      <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">{label}</p>
      <p
        className={`font-mono tabular-nums ${accentClass} ${
          isLongText
            ? "text-base font-medium break-all leading-snug"
            : "text-3xl font-medium"
        }`}
        title={isLongText ? value : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-ink-soft mt-1.5">{sub}</p>}
    </div>
  );
}