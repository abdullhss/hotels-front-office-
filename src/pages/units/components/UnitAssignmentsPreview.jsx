import { CalendarRange, Sparkles, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../../lib/utils.js'

function pickLabel(isArabic, ar, en) {
  const a = String(ar ?? '').trim()
  const e = String(en ?? '').trim()
  return isArabic ? a || e : e || a
}

function AssignmentRow({ item, isArabic }) {
  const { t } = useTranslation()
  const customerName = pickLabel(isArabic, item.customerNameAr, item.customerNameEn)
  const featureName = pickLabel(isArabic, item.featureNameAr, item.featureNameEn)
  const hasDates = item.fromDateLabel || item.toDateLabel

  return (
    <li className="rounded-xl border border-[#fecaca]/80 bg-white/90 p-3 shadow-sm">
      <div className="flex items-start gap-2.5">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fee2e2] text-[#dc2626]">
          <UserRound size={17} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-sm font-semibold text-[#111827]">
            {customerName || t('unitsPage.assignments.unknownGuest')}
          </p>
          {featureName ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-[#6b7280]">
              <Sparkles size={12} className="shrink-0 text-[#d97706]" />
              <span className="truncate">{featureName}</span>
            </p>
          ) : null}
          {hasDates ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#374151]">
              <CalendarRange size={13} className="shrink-0 text-[#6366f1]" />
              <span>
                {item.fromDateLabel || '—'}
                <span className="mx-1 text-[#9ca3af]">→</span>
                {item.toDateLabel || '—'}
              </span>
            </p>
          ) : null}
          {item.reservationId > 0 ? (
            <p className="mt-1.5 text-[11px] text-[#9ca3af]">
              {t('unitsPage.assignments.reservation', { id: item.reservationId })}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  )
}

function UnitAssignmentsPreview({ unit, className }) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  const assignments = unit.assignments ?? []
  const fallbackGuest = pickLabel(isArabic, unit.customerNameAr, unit.customerNameEn)
  const hasFallback =
    fallbackGuest || unit.fromDateLabel || unit.toDateLabel || unit.reservationId > 0

  const items =
    assignments.length > 0
      ? assignments
      : hasFallback
        ? [
            {
              customerNameAr: unit.customerNameAr,
              customerNameEn: unit.customerNameEn,
              featureNameAr: '',
              featureNameEn: '',
              fromDateLabel: unit.fromDateLabel,
              toDateLabel: unit.toDateLabel,
              fromDateIso: unit.fromDateIso,
              toDateIso: unit.toDateIso,
              reservationId: unit.reservationId ?? 0,
            },
          ]
        : []

  if (items.length === 0) return null

  return (
    <section
      className={cn(
        'mt-4 rounded-xl border border-[#fecaca] bg-linear-to-b from-[#fff5f5] to-[#fffafa] p-3',
        className
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="m-0 text-xs font-semibold uppercase tracking-wide text-[#b91c1c]">
          {t('unitsPage.assignments.title')}
        </h3>
        <span className="rounded-md bg-[#fee2e2] px-2 py-0.5 text-[10px] font-bold text-[#dc2626]">
          {items.length}
        </span>
      </div>
      <ul className="m-0 list-none space-y-2 p-0">
        {items.map((item, idx) => (
          <AssignmentRow
            key={`${item.reservationId}-${item.customerId}-${item.featureId}-${idx}`}
            item={item}
            isArabic={isArabic}
          />
        ))}
      </ul>
    </section>
  )
}

export default UnitAssignmentsPreview
