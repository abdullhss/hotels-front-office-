import { LogIn, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function ArrivalCard({ arrival, isArabic }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const guestName = isArabic ? arrival.guestNameAr : arrival.guestNameEn
  const startDate = isArabic ? arrival.startDateAr : arrival.startDateEn
  const endDate = isArabic ? arrival.endDateAr : arrival.endDateEn
  const price = isArabic ? arrival.priceAr : arrival.priceEn
  const roomLabel = isArabic
    ? `${arrival.roomCount} غرفة`
    : `${arrival.roomCount} ${arrival.roomCount === 1 ? 'room' : 'rooms'}`

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-[#e8edf5] bg-[#fafbfd] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef0ff] text-brand-primary">
          <User className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h3 className="m-0 truncate text-base font-bold text-[#111827]">{guestName}</h3>
          <p className="mt-1 text-sm text-[#6b7280]">
            {roomLabel}
            <span className="mx-1.5 text-[#cbd5e1]">.</span>
            {t('allocation.dateRange', { start: startDate, end: endDate })}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end sm:gap-6">
        <div className="text-end">
          <p className="m-0 text-base font-bold text-[#111827]">{price}</p>
          <p className="mt-0.5 text-sm text-[#9ca3af]" dir="ltr">
            #{arrival.id}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/allocation/${arrival.id}/check-in`)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover"
        >
          <LogIn className="h-4 w-4" />
          {t('allocation.checkIn')}
        </button>
      </div>
    </article>
  )
}

export default ArrivalCard
