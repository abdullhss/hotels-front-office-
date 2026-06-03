function UnitsStatCard({ title, subtitle, value, icon: Icon, iconBg, iconColor }) {
  return (
    <article className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-sm font-medium text-[#6b7280]">{title}</p>
          {subtitle ? <p className="mt-1 text-xs text-[#9ca3af]">{subtitle}</p> : null}
        </div>
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
        >
          <Icon size={20} strokeWidth={1.75} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold leading-none text-[#111827]">{value}</p>
    </article>
  )
}

export default UnitsStatCard
