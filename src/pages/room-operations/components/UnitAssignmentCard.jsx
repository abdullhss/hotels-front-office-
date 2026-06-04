import { LogIn, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function UnitAssignmentCard({ arrival, isArabic }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const guestName = isArabic ? arrival.guestNameAr : arrival.guestNameEn
  const startDate = isArabic ? arrival.startDateAr : arrival.startDateEn
  const endDate = isArabic ? arrival.endDateAr : arrival.endDateEn
  const price = isArabic ? arrival.priceAr : arrival.priceEn
  const unitLabel = isArabic ? arrival.unitLabelAr : arrival.unitLabelEn
  const dateLabel = t('roomOperations.dateRange', { start: startDate, end: endDate })

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-[#e8edf5] bg-[#fafbfd] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef0ff] text-brand-primary">
          <User className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h3 className="m-0 truncate text-base font-bold text-[#111827]">{guestName}</h3>
          {arrival.phone ? (
            <p className="mt-0.5 text-sm text-[#9ca3af]" dir="ltr">
              {arrival.phone}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-[#6b7280]">
            <span className="block">{unitLabel}</span>
            <span className="mt-0.5 block">{dateLabel}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end sm:gap-6">
        <div className="text-end">
          <p className="m-0 text-base font-bold text-[#111827]">{price}</p>
          <p className="mt-0.5 text-sm text-[#9ca3af]" dir="ltr">
            {t('roomOperations.assignmentNum', { num: arrival.assignmentNum || arrival.id })}
          </p>
          {arrival.reservationId ? (
            <p className="mt-0.5 text-xs text-[#9ca3af]" dir="ltr">
              {t('roomOperations.reservationNum', { num: arrival.reservationId })}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => navigate(`/room-operations/${arrival.id}/check-in`)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover"
        >
          <LogIn className="h-4 w-4" />
          {t('roomOperations.viewDetails')}
        </button>
      </div>
    </article>
  )
}

export default UnitAssignmentCard
