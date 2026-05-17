function StatCard({ item }) {
  const Icon = item.icon
  return (
    <article className="rounded-3xl border border-[#d8dee8] bg-[#f7f8fb] px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-sm font-semibold text-[#374151]">{item.title}</p>
          <p className="mt-1 text-xs text-[#9aa3b2]">{item.subtitle || '\u00a0'}</p>
        </div>
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.iconBg} ${item.accent}`}
        >
          <Icon size={18} strokeWidth={2} />
        </span>
      </div>
      <p className="mt-1 text-3xl font-bold leading-none text-[#111827]">{item.value}</p>
    </article>
  )
}

export default StatCard
