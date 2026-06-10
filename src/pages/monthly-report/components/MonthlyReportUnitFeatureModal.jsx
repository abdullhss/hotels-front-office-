import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, Minus, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import useExtraFeatures from '../../../Hooks/GetExtraFeatures.js'
import { fetchAvailableReservationUnits } from '../../../Hooks/GetAvailableReservationUnits.js'
import { getAuthHotelId } from '../../../utils/authStorage.js'
import { FieldLabel } from '../../new-booking/components/BookingFormFields.jsx'
import {
  getRemainingAvailableCount,
  getSelectedUnitsCount,
} from '../monthlyReportBookingUtils.js'

function NumStepper({ value, onChange, min = 1, max = 99 }) {
  const n = Number(value) || min
  const dec = () => onChange(Math.max(min, n - 1))
  const inc = () => onChange(Math.min(max, n + 1))

  return (
    <div className="flex overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
      <button
        type="button"
        onClick={dec}
        className="flex h-11 w-10 shrink-0 items-center justify-center text-[#6b7280] transition-colors hover:bg-[#eef2ff] hover:text-brand-primary"
        aria-label="decrease"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={n}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
        className="h-11 min-w-0 flex-1 border-x border-[#e2e8f0] bg-white px-2 text-center text-sm text-[#374151] focus:outline-none"
      />
      <button
        type="button"
        onClick={inc}
        className="flex h-11 w-10 shrink-0 items-center justify-center text-[#6b7280] transition-colors hover:bg-[#eef2ff] hover:text-brand-primary"
        aria-label="increase"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

function MonthlyReportUnitFeatureModal({
  open,
  unit,
  fromDate,
  toDate,
  selectedUnits = [],
  isArabic,
  onClose,
  onSave,
}) {
  const { extraFeatures, loading: featuresLoading } = useExtraFeatures()
  const [selectedFeatureId, setSelectedFeatureId] = useState('')
  const [availability, setAvailability] = useState(null)
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [unitsCount, setUnitsCount] = useState(1)

  const featureOptions = useMemo(
    () =>
      extraFeatures
        .map((raw) => {
          const id = Number(raw?.Id ?? raw?.id ?? 0)
          if (!id) return null
          const nameAr = String(raw?.FreatureNameA ?? raw?.FeatureNameA ?? '').trim()
          const nameEn = String(raw?.FreatureNameE ?? raw?.FeatureNameE ?? '').trim()
          return {
            value: String(id),
            nameAr,
            nameEn,
            price: Number(raw?.FeaturePrice ?? raw?.featurePrice ?? 0) || 0,
          }
        })
        .filter(Boolean),
    [extraFeatures]
  )

  useEffect(() => {
    if (!open) return
    setSelectedFeatureId('')
    setAvailability(null)
    setUnitsCount(1)
  }, [open, unit?.unitNameId])

  useEffect(() => {
    if (!open || !unit?.unitNameId || !selectedFeatureId) {
      setAvailability(null)
      return
    }

    let ignore = false
    setLoadingAvailability(true)

    fetchAvailableReservationUnits({
      hotelId: getAuthHotelId(),
      fromDate,
      toDate,
      unitNameId: unit.unitNameId,
      unitAddFeatureId: Number(selectedFeatureId),
    }).then((result) => {
      if (ignore) return
      if (!result.success || !result.unit) {
        setAvailability(null)
        toast.error(result.error ?? (isArabic ? 'فشل التحقق من التوفر' : 'Failed to check availability'))
      } else {
        setAvailability(result.unit)
        const available = Math.max(0, Number(result.unit.availableRoomsCount) || 0)
        const alreadySelected = getSelectedUnitsCount(
          selectedUnits,
          unit.unitNameId,
          Number(selectedFeatureId)
        )
        const remaining = getRemainingAvailableCount(available, alreadySelected)
        setUnitsCount(remaining > 0 ? Math.min(1, remaining) : 1)
      }
      setLoadingAvailability(false)
    })

    return () => {
      ignore = true
    }
  }, [open, unit?.unitNameId, selectedFeatureId, fromDate, toDate, isArabic, selectedUnits])

  if (!open || !unit) return null

  const unitLabel = isArabic
    ? unit.unitNameAr || unit.unitNameEn
    : unit.unitNameEn || unit.unitNameAr

  const availableCount = Math.max(0, Number(availability?.availableRoomsCount) || 0)
  const alreadySelectedCount = selectedFeatureId
    ? getSelectedUnitsCount(selectedUnits, unit.unitNameId, Number(selectedFeatureId))
    : 0
  const remainingCount = getRemainingAvailableCount(availableCount, alreadySelectedCount)
  const maxUnits = remainingCount > 0 ? remainingCount : 1
  const selectedFeature = featureOptions.find((f) => f.value === selectedFeatureId)

  const handleSave = () => {
    if (!selectedFeatureId) {
      toast.error(isArabic ? 'اختر الميزة أولاً' : 'Select a feature first')
      return
    }
    if (!availability || availableCount <= 0) {
      toast.error(isArabic ? 'لا توجد غرف متاحة لهذا الاختيار' : 'No rooms available for this selection')
      return
    }
    if (remainingCount <= 0) {
      toast.error(
        isArabic
          ? `تم الوصول للحد الأقصى (${availableCount}) لهذا النوع`
          : `Maximum available (${availableCount}) already selected for this type`
      )
      return
    }
    if (unitsCount < 1 || unitsCount > remainingCount) {
      toast.error(
        isArabic
          ? `يمكنك اختيار ${remainingCount} غرفة فقط (${alreadySelectedCount} محددة مسبقاً)`
          : `You can only select ${remainingCount} more room(s) (${alreadySelectedCount} already selected)`
      )
      return
    }

    onSave({
      unitNameId: unit.unitNameId,
      unitNameAr: availability.unitNameAr || unit.unitNameAr,
      unitNameEn: availability.unitNameEn || unit.unitNameEn,
      unitAddFeatureId: Number(selectedFeatureId),
      featureNameAr: availability.featureNameAr || selectedFeature?.nameAr || '',
      featureNameEn: availability.featureNameEn || selectedFeature?.nameEn || '',
      featurePrice: availability.featurePrice ?? selectedFeature?.price ?? 0,
      availableRoomsCount: availableCount,
      unitsCount,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="monthly-unit-feature-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label={isArabic ? 'إغلاق' : 'Close'}
      />
      <div className="relative z-10 flex max-h-[min(92vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e8ecf2] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-white transition-colors hover:bg-brand-primary-hover"
            aria-label={isArabic ? 'إغلاق' : 'Close'}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 text-end">
            <h2 id="monthly-unit-feature-modal-title" className="m-0 text-lg font-bold text-[#111827]">
              {isArabic ? 'اختيار الميزة' : 'Choose feature'}
            </h2>
            <p className="m-0 mt-0.5 text-sm text-[#6b7280]">{unitLabel}</p>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <FieldLabel required>{isArabic ? 'الميزة' : 'Feature'}</FieldLabel>
            <select
              value={selectedFeatureId}
              onChange={(e) => setSelectedFeatureId(e.target.value)}
              disabled={featuresLoading}
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="">
                {featuresLoading
                  ? isArabic
                    ? 'جاري التحميل...'
                    : 'Loading…'
                  : isArabic
                    ? 'اختر الميزة'
                    : 'Select feature'}
              </option>
              {featureOptions.map((feature) => (
                <option key={feature.value} value={feature.value}>
                  {isArabic ? feature.nameAr || feature.nameEn : feature.nameEn || feature.nameAr}
                </option>
              ))}
            </select>
          </div>

          {loadingAvailability ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-[#6b7280]">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              {isArabic ? 'جاري التحقق من التوفر...' : 'Checking availability…'}
            </div>
          ) : null}

          {selectedFeatureId && availability && !loadingAvailability ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[#e0f2fe] px-3 py-1 text-sm font-semibold text-[#0369a1]">
                  {isArabic ? 'عدد المتاح' : 'Available'}
                  <span className="ms-2 inline-flex min-w-6 items-center justify-center rounded-full bg-white px-2 py-0.5 text-[#0c4a6e]">
                    {availableCount}
                  </span>
                </span>
                {alreadySelectedCount > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-[#fef3c7] px-3 py-1 text-sm font-semibold text-[#92400e]">
                    {isArabic ? 'المتبقي' : 'Remaining'}
                    <span className="ms-2 inline-flex min-w-6 items-center justify-center rounded-full bg-white px-2 py-0.5 text-[#78350f]">
                      {remainingCount}
                    </span>
                  </span>
                ) : null}
              </div>

              {remainingCount > 0 ? (
                <div>
                  <FieldLabel required>{isArabic ? 'عدد الغرف' : 'Rooms count'}</FieldLabel>
                  <NumStepper
                    value={unitsCount}
                    onChange={setUnitsCount}
                    min={1}
                    max={maxUnits}
                  />
                </div>
              ) : (
                <p className="m-0 text-sm text-[#92400e]">
                  {isArabic
                    ? `تم اختيار ${alreadySelectedCount} من ${availableCount} غرف متاحة`
                    : `${alreadySelectedCount} of ${availableCount} available rooms already selected`}
                </p>
              )}
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-[#e8ecf2] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-sm font-medium text-[#374151] transition hover:bg-[#f8fafc]"
          >
            {isArabic ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedFeatureId || loadingAvailability || remainingCount <= 0}
            className="rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
          >
            {isArabic ? 'حفظ' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MonthlyReportUnitFeatureModal
