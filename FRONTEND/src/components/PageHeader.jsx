export default function PageHeader({ eyebrow, title, children }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-4 px-6 md:px-10 pt-8 pb-6 border-b border-line">
      <div>
        {eyebrow && (
          <p className="text-xs uppercase tracking-widest text-emerald mb-1">{eyebrow}</p>
        )}
        <h1 className="font-display text-3xl text-ink">{title}</h1>
      </div>
      {children}
    </div>
  );
}