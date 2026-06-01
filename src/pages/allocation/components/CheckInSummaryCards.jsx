import { useTranslation } from 'react-i18next'

function InfoField({ label, value, valueClassName = 'text-[#111827]' }) {
  return (
    <div>
      <p className="m-0 text-xs text-[#9ca3af]">{label}</p>
      <p className={`m-0 mt-1 text-sm font-semibold ${valueClassName}`}>{value}</p>
    </div>
  )
}

function CheckInSummaryCards({ booking, isArabic }) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="m-0 text-sm font-semibold text-[#111827]">
            {t('allocation.checkInPage.clientCard')}
          </h3>
          <span className="inline-flex rounded-lg bg-[#eef0ff] px-2.5 py-1 text-xs font-medium text-brand-primary">
            {isArabic
              ? booking.clientTypeAr || t('allocation.checkInPage.clientBadge')
              : booking.clientTypeEn || t('allocation.checkInPage.clientBadge')}
          </span>
        </div>
        <div className="space-y-3">
          <InfoField
            label={t('allocation.checkInPage.name')}
            value={isArabic ? booking.guestNameAr : booking.guestNameEn}
          />
          <InfoField label={t('allocation.checkInPage.phone')} value={booking.phone} />
          <InfoField label={t('allocation.checkInPage.idNumber')} value={booking.idNumber} />
        </div>
      </div>

      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
        <h3 className="m-0 mb-4 text-sm font-semibold text-[#111827]">
          {t('allocation.checkInPage.stayCard')}
        </h3>
        <div className="space-y-3">
          <InfoField
            label={t('allocation.checkInPage.bookingDate')}
            value={booking.bookingDate}
          />
          <InfoField
            label={t('allocation.checkInPage.arrivalDate')}
            value={booking.arrivalDate}
          />
          <InfoField
            label={t('allocation.checkInPage.departureDate')}
            value={booking.departureDate}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
        <h3 className="m-0 mb-4 text-sm font-semibold text-[#111827]">
          {t('allocation.checkInPage.financialCard')}
        </h3>
        <div className="space-y-3">
          <InfoField
            label={t('allocation.checkInPage.totalAmount')}
            value={isArabic ? booking.totalAmountAr : booking.totalAmountEn}
          />
          <InfoField
            label={t('allocation.checkInPage.paidAmount')}
            value={isArabic ? booking.paidAmountAr : booking.paidAmountEn}
            valueClassName="text-[#059669]"
          />
          <InfoField
            label={t('allocation.checkInPage.remainingAmount')}
            value={isArabic ? booking.remainingAmountAr : booking.remainingAmountEn}
            valueClassName="text-[#dc2626]"
          />
        </div>
      </div>
    </div>
  )
}

export default CheckInSummaryCards
