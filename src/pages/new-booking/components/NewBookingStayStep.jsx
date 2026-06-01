import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import useExtraFeatures from '../../../Hooks/GetExtraFeatures.js'
import useUnitTitles from '../../../Hooks/GetUnitTitles.js'
import { Building2, Minus, Plus, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table.jsx'
import { cn } from '../../../lib/utils'
import { FieldLabel, IconDateInput } from './BookingFormFields.jsx'
import {
  computeNightsCount,
  computeStayLineTotal,
  formatDisplayDate,
  isArrivalBeforeDeparture,
  toInputDateValue,
} from '../dateUtils.js'

const panelClass =
  'rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm sm:p-5'

const inputClass =
  'w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-3 ps-3 pe-10 text-sm text-[#374151] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary'

const selectClass =
  'w-full appearance-none rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-3 ps-3 pe-10 text-sm text-[#374151] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary'

const EMPTY_LINE = {
  unitType: '',
  unitsCount: 1,
  unitPrice: '',
  arrivalDate: '',
  departureDate: '',
  adults: 1,
  children: 0,
  notes: '',
  serviceId: '',
}

function normalizeExtraFeature(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = Number(raw.Id ?? raw.id ?? 0)
  if (!id) return null
  const priceRaw = Number(raw.FeaturePrice ?? raw.featurePrice ?? 0)
  return {
    id: String(id),
    nameAr: raw.FreatureNameA ?? raw.FeatureNameA ?? raw.featureNameA ?? '',
    nameEn: raw.FreatureNameE ?? raw.FeatureNameE ?? raw.featureNameE ?? '',
    price: Number.isFinite(priceRaw) ? priceRaw : 0,
  }
}

function NumStepper({ value, onChange, min = 0, max = 99 }) {
  const n = Number(value) || 0
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
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
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

function NewBookingStayStep({ stayRows = [], onStayRowsChange, onGrandTotalChange }) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const { unitTitles, loading: unitTitlesLoading } = useUnitTitles()
  const { extraFeatures, loading: extraFeaturesLoading } = useExtraFeatures()
  const [draft, setDraft] = useState({ ...EMPTY_LINE })

  const rows = stayRows
  const setRows = (updater) => {
    if (!onStayRowsChange) return
    onStayRowsChange(typeof updater === 'function' ? updater(stayRows) : updater)
  }

  const currency = t('newBooking.stay.currency')

  const featureOptions = useMemo(
    () =>
      extraFeatures
        .map((raw) => normalizeExtraFeature(raw))
        .filter(Boolean),
    [extraFeatures]
  )

  const featureById = useMemo(() => {
    const map = {}
    featureOptions.forEach((f) => {
      map[f.id] = f
    })
    return map
  }, [featureOptions])

  const getUnitTypeLabel = useCallback(
    (unitTypeId) => {
      const id = String(unitTypeId ?? '')
      if (!id) return '—'
      const item = unitTitles.find((u) => String(u.Id ?? u.id) === id)
      if (!item) return id
      return isArabic
        ? item.UnitNameA ?? item.unitNameA
        : item.UnitNameE ?? item.unitNameE
    },
    [unitTitles, isArabic]
  )

  const getUnitPricePerNight = useCallback(
    (unitTypeId) => {
      const id = String(unitTypeId ?? '')
      if (!id) return 0
      const item = unitTitles.find((u) => String(u.Id ?? u.id) === id)
      if (!item) return 0
      const raw = item.UnitPricePerNight ?? item.unitPricePerNight ?? 0
      const n = Number(raw)
      return Number.isFinite(n) ? n : 0
    },
    [unitTitles]
  )

  const updateDraft = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }))

  const handleUnitTypeChange = (unitTypeId) => {
    const price = getUnitPricePerNight(unitTypeId)
    setDraft((prev) => ({
      ...prev,
      unitType: unitTypeId,
      unitPrice: unitTypeId && price > 0 ? String(price) : '',
    }))
  }

  const formatFeatureLine = (feature, arabic) => {
    const name = arabic ? feature.nameAr : feature.nameEn || feature.nameAr
    return `${name} — ${feature.price.toLocaleString()} ${currency}`
  }

  const formatServiceLabel = (serviceId, arabic) => {
    const feature = featureById[serviceId]
    if (!feature) return '—'
    return formatFeatureLine(feature, arabic)
  }

  const getServicePrice = (serviceId) => featureById[serviceId]?.price ?? 0

  const handleAdd = () => {
    const arrival = toInputDateValue(draft.arrivalDate)
    const departure = toInputDateValue(draft.departureDate)

    if (!arrival) {
      toast.error(isArabic ? 'تاريخ الوصول مطلوب' : 'Arrival date is required')
      return
    }
    if (!departure) {
      toast.error(isArabic ? 'تاريخ المغادرة مطلوب' : 'Departure date is required')
      return
    }
    if (!isArrivalBeforeDeparture(arrival, departure)) {
      toast.error(
        isArabic
          ? 'تاريخ الوصول يجب أن يكون قبل تاريخ المغادرة'
          : 'Arrival date must be before departure date'
      )
      return
    }

    if (!draft.unitType) {
      toast.error(isArabic ? 'نوع الوحدة مطلوب' : 'Unit type is required')
      return
    }

    const price = getUnitPricePerNight(draft.unitType)
    if (!price) {
      toast.error(
        isArabic ? 'سعر الليلة غير متوفر لهذه الوحدة' : 'Nightly price is not available for this unit'
      )
      return
    }

    const nights = computeNightsCount(arrival, departure)
    if (!nights) {
      toast.error(
        isArabic
          ? 'يجب أن يكون تاريخ المغادرة بعد تاريخ الوصول بليلة واحدة على الأقل'
          : 'Departure must be at least one night after arrival'
      )
      return
    }

    const count = Number(draft.unitsCount) || 1
    const servicePrice = getServicePrice(draft.serviceId)
    const total = computeStayLineTotal({
      unitPricePerNight: price,
      servicePrice,
      nights,
      unitsCount: count,
    })
    const id = String(Date.now())
    setRows((prev) => [
      ...prev,
      {
        id,
        ...draft,
        unitPrice: price,
        arrivalDate: arrival,
        departureDate: departure,
        nightsCount: nights,
        servicePrice,
        servicesLabelAr: formatServiceLabel(draft.serviceId, true),
        servicesLabelEn: formatServiceLabel(draft.serviceId, false),
        total,
      },
    ])
    setDraft({ ...EMPTY_LINE })
  }

  const handleDelete = (id) => setRows((prev) => prev.filter((r) => r.id !== id))

  const grandTotal = rows.reduce((sum, r) => sum + (r.total || 0), 0)
  const draftNightPrice = draft.unitType ? getUnitPricePerNight(draft.unitType) : 0

  useEffect(() => {
    onGrandTotalChange?.(grandTotal)
    onStayRowsChange?.(rows)
  }, [grandTotal, rows, onGrandTotalChange, onStayRowsChange])

  return (
    <div className="space-y-4">
      <div className={panelClass}>
        <div className="mb-5 flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
            <Building2 className="h-4 w-4" />
          </span>
          <h2 className="m-0 text-base font-semibold text-[#111827]">
            {t('newBooking.stay.detailsTitle')}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <FieldLabel required>{t('newBooking.stay.unitType')}</FieldLabel>
              <select
                className={selectClass}
                value={draft.unitType}
                onChange={(e) => handleUnitTypeChange(e.target.value)}
                disabled={unitTitlesLoading}
              >
                <option value="">
                  {unitTitlesLoading
                    ? isArabic
                      ? 'جاري التحميل...'
                      : 'Loading…'
                    : isArabic
                      ? 'اختر نوع الوحدة'
                      : 'Select unit type'}
                </option>
                {unitTitles.map((u) => {
                  const unitId = u.Id ?? u.id
                  return (
                    <option key={unitId} value={String(unitId)}>
                      {isArabic
                        ? u.UnitNameA ?? u.unitNameA
                        : u.UnitNameE ?? u.unitNameE}
                    </option>
                  )
                })}
              </select>
            </div>
            <div>
              <FieldLabel required>{t('newBooking.stay.unitsCount')}</FieldLabel>
              <NumStepper
                value={draft.unitsCount}
                onChange={(v) => updateDraft('unitsCount', v)}
                min={1}
              />
            </div>
            <div>
              <FieldLabel>{t('newBooking.stay.unitPrice')}</FieldLabel>
              <div
                className={cn(
                  inputClass,
                  'flex min-h-[46px] items-center justify-between bg-[#f1f5f9] pe-3 text-[#374151]'
                )}
                aria-live="polite"
              >
                <span className="text-sm font-medium">
                  {draftNightPrice > 0 ? draftNightPrice.toLocaleString() : '—'}
                </span>
                <span className="text-xs text-[#9ca3af]">{currency}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel required>{t('newBooking.stay.arrivalDate')}</FieldLabel>
              <IconDateInput
                value={toInputDateValue(draft.arrivalDate)}
                onChange={(e) => {
                  const nextArrival = e.target.value
                  updateDraft('arrivalDate', nextArrival)
                  const dep = toInputDateValue(draft.departureDate)
                  if (dep && nextArrival && !isArrivalBeforeDeparture(nextArrival, dep)) {
                    updateDraft('departureDate', '')
                  }
                }}
              />
            </div>
            <div>
              <FieldLabel required>{t('newBooking.stay.departureDate')}</FieldLabel>
              <IconDateInput
                value={toInputDateValue(draft.departureDate)}
                min={toInputDateValue(draft.arrivalDate) || undefined}
                onChange={(e) => updateDraft('departureDate', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel required>{t('newBooking.stay.adults')}</FieldLabel>
              <NumStepper value={draft.adults} onChange={(v) => updateDraft('adults', v)} min={1} />
            </div>
            <div>
              <FieldLabel required>{t('newBooking.stay.children')}</FieldLabel>
              <NumStepper
                value={draft.children}
                onChange={(v) => updateDraft('children', v)}
                min={0}
              />
            </div>
          </div>

          <div>
            <FieldLabel>{t('newBooking.stay.lineNotes')}</FieldLabel>
            <textarea
              rows={3}
              className={cn(inputClass, 'resize-none pe-3')}
              value={draft.notes}
              onChange={(e) => updateDraft('notes', e.target.value)}
              placeholder={t('newBooking.stay.notesPlaceholder')}
            />
          </div>

          <div>
            <FieldLabel required>{t('newBooking.stay.servicesTitle')}</FieldLabel>
            <select
              className={selectClass}
              value={draft.serviceId}
              onChange={(e) => updateDraft('serviceId', e.target.value)}
              disabled={extraFeaturesLoading}
            >
              <option value="">
                {extraFeaturesLoading
                  ? isArabic
                    ? 'جاري التحميل...'
                    : 'Loading…'
                  : isArabic
                    ? 'اختر الخدمة'
                    : 'Select a service'}
              </option>
              {featureOptions.map((feature) => (
                <option key={feature.id} value={feature.id}>
                  {isArabic ? feature.nameAr : feature.nameEn || feature.nameAr} —{' '}
                  {feature.price.toLocaleString()} {currency}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0d9488] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0f766e]"
            >
              <Plus className="h-4 w-4" />
              {t('newBooking.stay.add')}
            </button>
          </div>
        </div>
      </div>

      {rows.length > 0 ? (
        <div className={cn(panelClass, 'overflow-hidden p-0')}>
          <div className="overflow-x-auto">
            <Table className="min-w-[900px] border-0">
              <TableHeader>
                <TableRow className="bg-[#f8fafc] hover:bg-[#f8fafc]">
                  <TableHead className="text-center text-xs font-semibold text-[#374151]">#</TableHead>
                  <TableHead className="text-start text-xs font-semibold text-[#374151]">
                    {t('newBooking.stay.unitType')}
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold text-[#374151]">
                    {t('newBooking.stay.unitsCount')}
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold text-[#374151]">
                    {t('newBooking.stay.unitPrice')}
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold text-[#374151]">
                    {t('newBooking.stay.arrivalDate')}
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold text-[#374151]">
                    {t('newBooking.stay.departureDate')}
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold text-[#374151]">
                    {t('newBooking.stay.adults')}
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold text-[#374151]">
                    {t('newBooking.stay.children')}
                  </TableHead>
                  <TableHead className="text-start text-xs font-semibold text-[#374151]">
                    {t('newBooking.stay.servicesTitle')}
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold text-[#374151]">
                    {t('newBooking.stay.totalPrice')}
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold text-[#374151]">
                    {t('newBooking.stay.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row.id} className="border-b border-[#f1f5f9]">
                    <TableCell className="text-center text-sm text-[#6b7280]">{index + 1}</TableCell>
                    <TableCell className="text-sm font-medium text-[#111827]">
                      {getUnitTypeLabel(row.unitType)}
                    </TableCell>
                    <TableCell className="text-center text-sm">{row.unitsCount}</TableCell>
                    <TableCell className="text-center text-sm">
                      {Number(row.unitPrice).toLocaleString()} {t('newBooking.stay.currency')}
                    </TableCell>
                    <TableCell className="text-center text-sm text-[#6b7280]">
                      {formatDisplayDate(row.arrivalDate)}
                    </TableCell>
                    <TableCell className="text-center text-sm text-[#6b7280]">
                      {formatDisplayDate(row.departureDate)}
                    </TableCell>
                    <TableCell className="text-center text-sm">{row.adults}</TableCell>
                    <TableCell className="text-center text-sm">{row.children}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm text-[#6b7280]">
                      {isArabic ? row.servicesLabelAr : row.servicesLabelEn}
                    </TableCell>
                    <TableCell className="text-center text-sm font-semibold text-[#111827]">
                      {row.total?.toLocaleString()} {t('newBooking.stay.currency')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#dc2626] transition-colors hover:bg-[#fef2f2]"
                          aria-label={t('newBooking.stay.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t border-[#e8ecf2] bg-[#f8fafc] px-4 py-3">
            <span className="text-sm font-bold text-[#111827]">
              {grandTotal.toLocaleString()} {t('newBooking.stay.currency')}
            </span>
            <span className="text-sm font-semibold text-[#374151]">{t('newBooking.stay.grandTotal')}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default NewBookingStayStep
