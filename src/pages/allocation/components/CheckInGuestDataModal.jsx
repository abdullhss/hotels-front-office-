import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Briefcase,
  Check,
  Flag,
  IdCard,
  MessageSquare,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react'
import useNationalities from '../../../Hooks/GetNationalities.js'
import { sanitizeNameInput, validateName } from '../../../lib/nameValidation.js'
import {
  NATIONAL_ID_LENGTH,
  sanitizeNationalIdInput,
  shouldSanitizeAsNationalId,
  validateNationalIdNumber,
} from '../../../lib/nationalIdValidation.js'
import {
  FieldLabel,
  IconDateInput,
  IconInput,
  IconSelect,
} from '../../new-booking/components/BookingFormFields.jsx'

function createEmptyGuest() {
  return {
    id: `guest-${crypto.randomUUID?.() ?? Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    fullName: '',
    idType: '',
    idNumber: '',
    nationality: '',
    birthDate: '',
    gender: '',
    profession: '',
  }
}

function CheckInGuestDataModal({ open, roomLabel, initialGuests, onClose, onSave, isArabic }) {
  const { t } = useTranslation()
  const { nationalities, loading: nationalitiesLoading } = useNationalities()
  const [guests, setGuests] = useState([createEmptyGuest()])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const list =
      Array.isArray(initialGuests) && initialGuests.length > 0
        ? initialGuests.map((g) => ({ ...createEmptyGuest(), ...g, id: g.id || createEmptyGuest().id }))
        : [createEmptyGuest()]
    setGuests(list)
  }, [open, initialGuests])

  if (!open) return null

  const updateGuest = (guestId, field, value) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, [field]: value } : g))
    )
  }

  const addGuest = () => {
    setGuests((prev) => [...prev, createEmptyGuest()])
  }

  const removeGuest = (guestId) => {
    setGuests((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((g) => g.id !== guestId)
    })
  }

  const handleSave = () => {
    const missingName = guests.find((g) => !String(g.fullName ?? '').trim())
    if (missingName) {
      toast.error(t('allocation.checkInPage.guestModal.fullNameRequired'))
      return
    }
    const invalidName = guests.find((g) => !validateName(g.fullName).valid)
    if (invalidName) {
      toast.error(t('common.validation.nameLettersOnly'))
      return
    }
    const missingNationality = guests.find((g) => !g.nationality)
    if (missingNationality) {
      toast.error(t('allocation.checkInPage.guestModal.nationalityRequired'))
      return
    }
    const missingGender = guests.find((g) => !g.gender)
    if (missingGender) {
      toast.error(t('allocation.checkInPage.guestModal.genderRequired'))
      return
    }
    const missingBirth = guests.find((g) => !g.birthDate)
    if (missingBirth) {
      toast.error(t('allocation.checkInPage.guestModal.birthDateRequired'))
      return
    }
    const invalidId = guests.find((g) => {
      if (!String(g.idNumber ?? '').trim()) return false
      return !validateNationalIdNumber(g.idNumber, g.idType).valid
    })
    if (invalidId) {
      toast.error(t('common.validation.nationalIdFormat'))
      return
    }

    setSaving(true)
    try {
      onSave(guests)
      toast.success(t('allocation.checkInPage.guestModal.saveSuccess'))
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-data-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label={t('allocation.checkInPage.guestModal.close')}
      />
      <div className="relative z-10 flex max-h-[min(92vh,840px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e8ecf2] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-white transition-colors hover:bg-brand-primary-hover"
            aria-label={t('allocation.checkInPage.guestModal.close')}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-start justify-end gap-3">
            <div className="min-w-0 text-end">
              <h2
                id="guest-data-modal-title"
                className="m-0 text-lg font-bold text-[#111827]"
              >
                {t('allocation.checkInPage.guestModal.title', { roomType: roomLabel })}
              </h2>
              <p className="m-0 mt-0.5 text-sm text-[#6b7280]">
                {t('allocation.checkInPage.guestModal.subtitle')}
              </p>
            </div>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f8f1] text-[#059669]">
              <MessageSquare className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {guests.map((guest, index) => (
            <div
              key={guest.id}
              className="rounded-2xl border border-[#e2e8f0] bg-[#fafbfd] p-4 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => removeGuest(guest.id)}
                  disabled={guests.length <= 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#dc2626] transition-colors hover:bg-[#fef2f2] disabled:pointer-events-none disabled:opacity-30"
                  aria-label={t('allocation.checkInPage.guestModal.removeGuest')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <p className="m-0 text-sm font-semibold text-[#111827]">
                  {t('allocation.checkInPage.guestModal.guestLabel', { number: index + 1 })}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <FieldLabel required>{t('newBooking.fields.fullName')}</FieldLabel>
                  <IconInput
                    icon={User}
                    type="text"
                    value={guest.fullName}
                    onChange={(e) =>
                      updateGuest(guest.id, 'fullName', sanitizeNameInput(e.target.value))
                    }
                    placeholder={t('allocation.checkInPage.guestModal.fullNamePlaceholder')}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <FieldLabel>{t('newBooking.fields.idType')}</FieldLabel>
                    <IconSelect
                      icon={User}
                      value={guest.idType}
                      onChange={(e) => updateGuest(guest.id, 'idType', e.target.value)}
                    >
                      <option value="">{t('newBooking.select')}</option>
                      <option value="national_id">{isArabic ? 'هوية' : 'National ID'}</option>
                      <option value="residency">{isArabic ? 'إقامة' : 'Residency'}</option>
                      <option value="passport">{isArabic ? 'جواز' : 'Passport'}</option>
                    </IconSelect>
                  </div>
                  <div>
                    <FieldLabel>{t('newBooking.fields.idNumber')}</FieldLabel>
                    <IconInput
                      icon={IdCard}
                      type="text"
                      inputMode={shouldSanitizeAsNationalId(guest.idType) ? 'numeric' : 'text'}
                      maxLength={
                        shouldSanitizeAsNationalId(guest.idType) ? NATIONAL_ID_LENGTH : undefined
                      }
                      value={guest.idNumber}
                      onChange={(e) =>
                        updateGuest(
                          guest.id,
                          'idNumber',
                          shouldSanitizeAsNationalId(guest.idType)
                            ? sanitizeNationalIdInput(e.target.value)
                            : e.target.value
                        )
                      }
                      placeholder={t('newBooking.placeholders.idNumber')}
                    />
                  </div>
                  <div>
                    <FieldLabel required>{t('newBooking.fields.nationality')}</FieldLabel>
                    <IconSelect
                      icon={Flag}
                      value={guest.nationality}
                      onChange={(e) => updateGuest(guest.id, 'nationality', e.target.value)}
                      disabled={nationalitiesLoading}
                    >
                      <option value="">
                        {nationalitiesLoading
                          ? isArabic
                            ? 'جاري التحميل...'
                            : 'Loading…'
                          : t('newBooking.select')}
                      </option>
                      {nationalities.map((n) => {
                        const natId = n.Id ?? n.id
                        return (
                          <option key={natId} value={String(natId)}>
                            {isArabic
                              ? n.NationalityNameA ?? n.nationalityNameA
                              : n.NationalityNameE ?? n.nationalityNameE}
                          </option>
                        )
                      })}
                    </IconSelect>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <FieldLabel required>{t('newBooking.fields.birthDate')}</FieldLabel>
                    <IconDateInput
                      value={guest.birthDate}
                      onChange={(e) => updateGuest(guest.id, 'birthDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel required>{t('newBooking.fields.gender')}</FieldLabel>
                    <IconSelect
                      value={guest.gender}
                      onChange={(e) => updateGuest(guest.id, 'gender', e.target.value)}
                    >
                      <option value="">{t('newBooking.select')}</option>
                      <option value="male">{isArabic ? 'ذكر' : 'Male'}</option>
                      <option value="female">{isArabic ? 'أنثى' : 'Female'}</option>
                    </IconSelect>
                  </div>
                  <div>
                    <FieldLabel>{t('newBooking.fields.profession')}</FieldLabel>
                    <IconInput
                      icon={Briefcase}
                      type="text"
                      value={guest.profession}
                      onChange={(e) => updateGuest(guest.id, 'profession', e.target.value)}
                      placeholder={t('newBooking.placeholders.profession')}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addGuest}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-primary/50 bg-[#fafbff] py-3.5 text-sm font-medium text-brand-primary transition-colors hover:border-brand-primary hover:bg-[#eef2ff]"
          >
            <Plus className="h-4 w-4" />
            {t('allocation.checkInPage.guestModal.addGuest')}
          </button>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-4 border-t border-[#e8ecf2] px-5 py-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {saving
              ? t('allocation.checkInPage.guestModal.saving')
              : t('allocation.checkInPage.guestModal.save')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-[#dc2626] transition-colors hover:text-[#b91c1c]"
          >
            {t('allocation.checkInPage.guestModal.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CheckInGuestDataModal
