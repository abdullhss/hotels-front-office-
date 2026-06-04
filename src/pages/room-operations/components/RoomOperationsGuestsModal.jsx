import { useTranslation } from 'react-i18next'
import { MessageSquare, User, X } from 'lucide-react'
import useNationalities from '../../../Hooks/GetNationalities.js'

const ID_TYPE_LABELS = {
  national_id: { ar: 'هوية', en: 'National ID' },
  passport: { ar: 'جواز', en: 'Passport' },
  residency: { ar: 'إقامة', en: 'Residency' },
}

const GENDER_LABELS = {
  male: { ar: 'ذكر', en: 'Male' },
  female: { ar: 'أنثى', en: 'Female' },
}

function GuestDetail({ label, value }) {
  return (
    <div>
      <p className="m-0 text-xs text-[#9ca3af]">{label}</p>
      <p className="m-0 mt-1 text-sm font-medium text-[#111827]">{value || '—'}</p>
    </div>
  )
}

function RoomOperationsGuestsModal({ open, roomLabel, guests, isArabic, onClose }) {
  const { t } = useTranslation()
  const { nationalities } = useNationalities()

  if (!open) return null

  const list = Array.isArray(guests) ? guests : []

  const nationalityName = (id) => {
    const nat = nationalities.find((n) => String(n.Id ?? n.id) === String(id))
    if (!nat) return '—'
    return isArabic
      ? nat.NationalityNameA ?? nat.nationalityNameA
      : nat.NationalityNameE ?? nat.nationalityNameE
  }

  const idTypeLabel = (key) => {
    const labels = ID_TYPE_LABELS[key]
    if (!labels) return '—'
    return isArabic ? labels.ar : labels.en
  }

  const genderLabel = (key) => {
    const labels = GENDER_LABELS[key]
    if (!labels) return '—'
    return isArabic ? labels.ar : labels.en
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-ops-guests-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label={t('roomOperations.guestsModal.close')}
      />
      <div className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e8ecf2] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-white transition-colors hover:bg-brand-primary-hover"
            aria-label={t('roomOperations.guestsModal.close')}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-start justify-end gap-3">
            <div className="min-w-0 text-end">
              <h2 id="room-ops-guests-title" className="m-0 text-lg font-bold text-[#111827]">
                {t('roomOperations.guestsModal.title', { roomType: roomLabel })}
              </h2>
              <p className="m-0 mt-0.5 text-sm text-[#6b7280]">
                {t('roomOperations.guestsModal.subtitle', { count: list.length })}
              </p>
            </div>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f8f1] text-[#059669]">
              <MessageSquare className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {list.length === 0 ? (
            <p className="m-0 py-8 text-center text-sm text-[#6b7280]">
              {t('roomOperations.guestsModal.empty')}
            </p>
          ) : (
            list.map((guest, index) => (
              <div
                key={guest.id ?? index}
                className="rounded-2xl border border-[#e2e8f0] bg-[#fafbfd] p-4 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-end gap-2">
                  <User className="h-4 w-4 text-brand-primary" />
                  <p className="m-0 text-sm font-semibold text-[#111827]">
                    {t('allocation.checkInPage.guestModal.guestLabel', { number: index + 1 })}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <GuestDetail
                    label={t('newBooking.fields.fullName')}
                    value={guest.fullName}
                  />
                  <GuestDetail
                    label={t('newBooking.fields.idType')}
                    value={idTypeLabel(guest.idType)}
                  />
                  <GuestDetail
                    label={t('newBooking.fields.idNumber')}
                    value={guest.idNumber}
                  />
                  <GuestDetail
                    label={t('newBooking.fields.nationality')}
                    value={nationalityName(guest.nationality)}
                  />
                  <GuestDetail
                    label={t('newBooking.fields.birthDate')}
                    value={guest.birthDate}
                  />
                  <GuestDetail
                    label={t('newBooking.fields.gender')}
                    value={genderLabel(guest.gender)}
                  />
                  <GuestDetail
                    label={t('newBooking.fields.profession')}
                    value={guest.profession}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-[#e8ecf2] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-brand-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover"
          >
            {t('roomOperations.guestsModal.close')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoomOperationsGuestsModal
