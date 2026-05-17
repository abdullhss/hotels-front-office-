import { useTranslation } from 'react-i18next'

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="m-0 text-xs text-[#9ca3af]">{label}</p>
      <p className="m-0 mt-1 text-sm font-medium text-[#111827]">{value}</p>
    </div>
  )
}

function CheckInAdditionalInfo({ booking, isArabic }) {
  const { t } = useTranslation()

  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm sm:p-5">
      <h3 className="m-0 mb-4 text-sm font-semibold text-[#111827]">
        {t('allocation.checkInPage.additionalInfo')}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DetailItem
          label={t('allocation.checkInPage.nationality')}
          value={isArabic ? booking.nationalityAr : booking.nationalityEn}
        />
        <DetailItem
          label={t('allocation.checkInPage.profession')}
          value={isArabic ? booking.professionAr : booking.professionEn}
        />
        <DetailItem
          label={t('allocation.checkInPage.birthDate')}
          value={booking.birthDate}
        />
        <DetailItem
          label={t('allocation.checkInPage.visitPurpose')}
          value={isArabic ? booking.visitPurposeAr : booking.visitPurposeEn}
        />
        <DetailItem
          label={t('allocation.checkInPage.gender')}
          value={isArabic ? booking.genderAr : booking.genderEn}
        />
        <DetailItem
          label={t('allocation.checkInPage.source')}
          value={isArabic ? booking.source || booking.sourceEn : booking.sourceEn || booking.source}
        />
      </div>
      <div className="mt-4 border-t border-[#e8edf5] pt-4">
        <p className="m-0 text-xs text-[#9ca3af]">{t('allocation.checkInPage.notes')}</p>
        <p className="m-0 mt-2 text-sm leading-relaxed text-[#374151]">
          {isArabic ? booking.notesAr : booking.notesEn}
        </p>
      </div>
    </div>
  )
}

export default CheckInAdditionalInfo
