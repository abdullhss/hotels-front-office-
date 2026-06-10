import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ChevronLeft, ChevronRight, LoaderCircle, Minus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getAuthHotelId } from '../../utils/authStorage.js'
import useExtraFeatures from '../../Hooks/GetExtraFeatures'
import useUnitTitles from '../../Hooks/GetUnitTitles.js'
import { fetchMonthlyRoomsReport, normalizeFloorNumParam } from '../../Hooks/GetMonthlyRoomsReport'
import { FieldLabel, IconDateInput } from '../new-booking/components/BookingFormFields.jsx'
import { isArrivalBeforeDeparture, toInputDateValue } from '../new-booking/dateUtils.js'
import MonthlyReportUnitFeatureModal from './components/MonthlyReportUnitFeatureModal.jsx'
import {
  buildNewBookingNavigationState,
  mergeUnitSelection,
  selectionKey,
  validateBookingDraft,
} from './monthlyReportBookingUtils.js'

const monthNames = {
  ar: [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
}

const dayNames = {
  ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}

function getCellStatus(stat) {
  const occupied = stat?.occupiedRooms ?? 0
  const booked = stat?.bookedRooms ?? 0
  const available = stat?.availableRooms ?? 0
  if (occupied > 0 || booked > 0) return 'reserved'
  if (available > 0) return 'available'
  return 'empty'
}

const cellStatusStyles = {
  reserved: {
    box: 'border-[#86efac] bg-[#dcfce7]',
    main: 'text-[#15803d]',
    sub: 'text-[#166534]',
  },
  available: {
    box: 'border-[#fdba74] bg-[#ffedd5]',
    main: 'text-[#c2410c]',
    sub: 'text-[#9a3412]',
  },
  empty: {
    box: 'border-[#e2e8f0] bg-[#f1f5f9]',
    main: 'text-[#64748b]',
    sub: 'text-[#94a3b8]',
  },
}

const EMPTY_BOOKING_DRAFT = {
  fromDate: '',
  toDate: '',
  adults: 1,
  children: 0,
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

function MonthlyReportPage() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const isArabic = i18n.language === 'ar'
  const lang = isArabic ? 'ar' : 'en'
  const now = useMemo(() => new Date(), [])
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [unitNameId, setUnitNameId] = useState(-1)
  const [floorInput, setFloorInput] = useState('')
  const floorInputRef = useRef(floorInput)
  floorInputRef.current = floorInput
  const [featureId, setFeatureId] = useState(-1)
  const { extraFeatures, loading: featuresLoading } = useExtraFeatures()
  const { unitTitles } = useUnitTitles()
  const [loading, setLoading] = useState(false)
  const [reportRows, setReportRows] = useState([])
  const [bookingMode, setBookingMode] = useState(false)
  const [bookingDraft, setBookingDraft] = useState(EMPTY_BOOKING_DRAFT)
  const [selectedUnits, setSelectedUnits] = useState([])
  const [featureModalUnit, setFeatureModalUnit] = useState(null)

  const years = useMemo(() => {
    const currentYear = now.getFullYear()
    return Array.from({ length: 7 }, (_, idx) => currentYear - 3 + idx)
  }, [now])
  const monthLabels = monthNames[lang]
  const dayLabels = dayNames[lang]

  const loadReport = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchMonthlyRoomsReport({
        hotelId: getAuthHotelId(),
        year: selectedYear,
        month: selectedMonth + 1,
        unitNameId,
        floorNum: normalizeFloorNumParam(floorInputRef.current),
        featureId,
      })

      if (!result.success) {
        toast.error(result.error ?? (isArabic ? 'فشل تحميل التقرير الشهري' : 'Failed to load report'))
        setReportRows([])
        return
      }

      setReportRows(result.rows)
    } catch (err) {
      toast.error(err?.message ?? (isArabic ? 'فشل تحميل التقرير الشهري' : 'Failed to load report'))
      setReportRows([])
    } finally {
      setLoading(false)
    }
  }, [featureId, isArabic, selectedMonth, selectedYear, unitNameId])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const dates = useMemo(() => {
    const count = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    return Array.from({ length: count }, (_, idx) => {
      const d = new Date(selectedYear, selectedMonth, idx + 1)
      return {
        iso: toInputDateValue(d),
        label: dayLabels[d.getDay()],
        day: d.getDate(),
      }
    })
  }, [dayLabels, selectedMonth, selectedYear])

  const unitRows = useMemo(() => {
    const byDate = new Map(reportRows.map((row) => [row.reportDateIso, row.rooms]))
    const byUnit = new Map()

    reportRows.forEach((dayRow) => {
      dayRow.rooms.forEach((room) => {
        const existing = byUnit.get(room.unitNameId)
        if (existing) return
        byUnit.set(room.unitNameId, {
          unitNameId: room.unitNameId,
          unitNameAr: room.unitNameAr,
          unitNameEn: room.unitNameEn,
          statsByDate: {},
        })
      })
    })

    byUnit.forEach((unit) => {
      dates.forEach((date) => {
        const dayRooms = byDate.get(date.iso) ?? []
        const room = dayRooms.find((item) => item.unitNameId === unit.unitNameId)
        unit.statsByDate[date.iso] = room ?? {
          unitNameId: unit.unitNameId,
          totalRooms: 0,
          occupiedRooms: 0,
          bookedRooms: 0,
          availableRooms: 0,
        }
      })
    })

    return Array.from(byUnit.values()).sort((a, b) => a.unitNameId - b.unitNameId)
  }, [dates, reportRows])

  const unitOptions = useMemo(
    () =>
      unitRows.map((row) => ({
        value: row.unitNameId,
        label: isArabic ? row.unitNameAr || row.unitNameEn : row.unitNameEn || row.unitNameAr,
      })),
    [isArabic, unitRows]
  )

  const featureOptions = useMemo(
    () =>
      extraFeatures
        .map((raw) => {
          const id = Number(raw?.Id ?? raw?.id ?? 0)
          if (!id) return null
          const nameAr = String(raw?.FreatureNameA ?? raw?.FeatureNameA ?? '').trim()
          const nameEn = String(raw?.FreatureNameE ?? raw?.FeatureNameE ?? '').trim()
          return {
            value: id,
            label: isArabic ? nameAr || nameEn : nameEn || nameAr,
          }
        })
        .filter(Boolean),
    [extraFeatures, isArabic]
  )

  const title = isArabic ? 'التقرير الشهري' : 'Monthly Report'
  const subtitle = isArabic
    ? 'متابعة التسكين وحالة الغرف خلال الشهر'
    : 'Track room allocation and occupancy through the month'

  const updateBookingDraft = (field, value) => {
    setBookingDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handleStartBooking = () => {
    setBookingMode(true)
    setBookingDraft(EMPTY_BOOKING_DRAFT)
    setSelectedUnits([])
    setFeatureModalUnit(null)
  }

  const handleCancelBooking = () => {
    setBookingMode(false)
    setBookingDraft(EMPTY_BOOKING_DRAFT)
    setSelectedUnits([])
    setFeatureModalUnit(null)
  }

  const handleUnitNameClick = (unit) => {
    if (!bookingMode) return

    const validation = validateBookingDraft(bookingDraft, isArabic)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    setFeatureModalUnit({
      unitNameId: unit.unitNameId,
      unitNameAr: unit.unitNameAr,
      unitNameEn: unit.unitNameEn,
    })
  }

  const handleSaveUnitSelection = (selection) => {
    setSelectedUnits((prev) => mergeUnitSelection(prev, selection))
    toast.success(isArabic ? 'تمت إضافة الغرف' : 'Rooms added')
  }

  const handleRemoveSelection = (unitNameId, unitAddFeatureId) => {
    const key = selectionKey(unitNameId, unitAddFeatureId)
    setSelectedUnits((prev) =>
      prev.filter((item) => selectionKey(item.unitNameId, item.unitAddFeatureId) !== key)
    )
  }

  const handleContinueToBooking = () => {
    const validation = validateBookingDraft(bookingDraft, isArabic)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }
    if (selectedUnits.length === 0) {
      toast.error(
        isArabic ? 'اختر غرفة واحدة على الأقل من عمود الغرف' : 'Select at least one room from the rooms column'
      )
      return
    }

    navigate('/bookings/new', {
      state: buildNewBookingNavigationState({
        draft: bookingDraft,
        selectedUnits,
        unitTitles,
      }),
    })
  }

  return (
    <section className="mx-auto max-w-[1450px] space-y-4">
      <header className="flex flex-col gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="m-0 text-2xl font-bold text-[#111827]">{title}</h1>
          <p className="mt-1 text-sm text-[#6b7280]">{subtitle}</p>
        </div>
        {bookingMode ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={handleContinueToBooking}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d9488] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0f766e] sm:w-auto"
            >
              <ArrowRight className="h-4 w-4" />
              {isArabic ? 'متابعة إلى الحجز' : 'Continue to booking'}
            </button>
            <button
              type="button"
              onClick={handleCancelBooking}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-medium text-[#374151] transition hover:bg-[#f8fafc] sm:w-auto"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStartBooking}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-primary-hover sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            {isArabic ? 'إضافة حجز' : 'Add Booking'}
          </button>
        )}
      </header>

      {bookingMode ? (
        <div className="space-y-4 rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-4 shadow-sm">
          <div>
            <h2 className="m-0 text-base font-semibold text-[#1e3a8a]">
              {isArabic ? 'بيانات الحجز' : 'Booking details'}
            </h2>
            <p className="m-0 mt-1 text-sm text-[#3b82f6]">
              {isArabic
                ? 'حدد التواريخ وعدد الأفراد، ثم انقر على اسم الوحدة في عمود الغرف لاختيار الميزة'
                : 'Set dates and guest counts, then click a unit name in the rooms column to choose features'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <FieldLabel required>{isArabic ? 'من تاريخ' : 'From date'}</FieldLabel>
              <IconDateInput
                value={toInputDateValue(bookingDraft.fromDate)}
                onChange={(e) => {
                  const nextFrom = e.target.value
                  updateBookingDraft('fromDate', nextFrom)
                  const toDate = toInputDateValue(bookingDraft.toDate)
                  if (toDate && nextFrom && !isArrivalBeforeDeparture(nextFrom, toDate)) {
                    updateBookingDraft('toDate', '')
                  }
                }}
              />
            </div>
            <div>
              <FieldLabel required>{isArabic ? 'إلى تاريخ' : 'To date'}</FieldLabel>
              <IconDateInput
                value={toInputDateValue(bookingDraft.toDate)}
                min={toInputDateValue(bookingDraft.fromDate) || undefined}
                onChange={(e) => updateBookingDraft('toDate', e.target.value)}
              />
            </div>
            <div>
              <FieldLabel required>{isArabic ? 'عدد البالغين' : 'Adults'}</FieldLabel>
              <NumStepper
                value={bookingDraft.adults}
                onChange={(v) => updateBookingDraft('adults', v)}
                min={1}
              />
            </div>
            <div>
              <FieldLabel required>{isArabic ? 'عدد الأطفال' : 'Children'}</FieldLabel>
              <NumStepper
                value={bookingDraft.children}
                onChange={(v) => updateBookingDraft('children', v)}
                min={0}
              />
            </div>
          </div>

          {selectedUnits.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-[#dbeafe] bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-[640px] w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#f8fafc] text-[#374151]">
                      <th className="px-3 py-2 text-start font-semibold">
                        {isArabic ? 'نوع الوحدة' : 'Unit type'}
                      </th>
                      <th className="px-3 py-2 text-start font-semibold">
                        {isArabic ? 'الميزة' : 'Feature'}
                      </th>
                      <th className="px-3 py-2 text-center font-semibold">
                        {isArabic ? 'العدد' : 'Count'}
                      </th>
                      <th className="px-3 py-2 text-center font-semibold">
                        {isArabic ? 'إجراء' : 'Action'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUnits.map((item) => (
                      <tr key={selectionKey(item.unitNameId, item.unitAddFeatureId)} className="border-t border-[#f1f5f9]">
                        <td className="px-3 py-2 font-medium text-[#111827]">
                          {isArabic
                            ? item.unitNameAr || item.unitNameEn
                            : item.unitNameEn || item.unitNameAr}
                        </td>
                        <td className="px-3 py-2 text-[#6b7280]">
                          {isArabic
                            ? item.featureNameAr || item.featureNameEn
                            : item.featureNameEn || item.featureNameAr}
                        </td>
                        <td className="px-3 py-2 text-center">{item.unitsCount}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveSelection(item.unitNameId, item.unitAddFeatureId)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#dc2626] transition-colors hover:bg-[#fef2f2]"
                            aria-label={isArabic ? 'حذف' : 'Remove'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedYear((prev) => prev - 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#dbe3ee] bg-white text-[#4b5563] transition hover:bg-[#eef2ff] hover:text-brand-primary"
            >
              {isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            {years.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedYear(year)}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  year === selectedYear
                    ? 'bg-[#e8ebff] text-brand-primary'
                    : 'text-[#4b5563] hover:bg-[#f3f6fb]'
                }`}
              >
                {year}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedYear((prev) => prev + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#dbe3ee] bg-white text-[#4b5563] transition hover:bg-[#eef2ff] hover:text-brand-primary"
            >
              {isArabic ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#374151]"
            >
              {monthLabels.map((label, idx) => (
                <option key={label} value={idx}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={unitNameId}
              onChange={(e) => setUnitNameId(Number(e.target.value))}
              className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#374151]"
            >
              <option value={-1}>{isArabic ? 'كل أنواع الوحدات' : 'All unit types'}</option>
              {unitOptions.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              inputMode="numeric"
              value={floorInput}
              onChange={(e) => setFloorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') loadReport()
              }}
              className="w-[120px] rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#374151]"
              placeholder={isArabic ? 'الدور' : 'Floor'}
              aria-label={isArabic ? 'الدور' : 'Floor'}
            />
            <select
              value={featureId}
              onChange={(e) => setFeatureId(Number(e.target.value))}
              disabled={featuresLoading}
              className="min-w-[160px] rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#374151] disabled:opacity-60"
            >
              <option value={-1}>
                {featuresLoading
                  ? isArabic
                    ? 'جاري تحميل الميزات...'
                    : 'Loading features…'
                  : isArabic
                    ? 'كل الميزات'
                    : 'All features'}
              </option>
              {featureOptions.map((feature) => (
                <option key={feature.value} value={feature.value}>
                  {feature.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={loadReport}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {isArabic ? 'تحديث' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#dfe6ef] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[1400px]">
            <div
              className="grid border-b border-[#edf1f6] bg-[#fafcff]"
              style={{ gridTemplateColumns: `280px repeat(${dates.length}, minmax(96px, 1fr))` }}
            >
              <div className="sticky inset-s-0 z-10 border-e border-[#edf1f6] bg-[#fafcff] p-4 text-lg font-bold text-[#374151]">
                {isArabic ? 'الغرف' : 'Rooms'}
              </div>
              {dates.map((date, idx) => (
                <div key={`${date.day}-${idx}`} className="border-e border-[#edf1f6] px-2 py-4 text-center">
                  <p className="m-0 text-base font-semibold text-[#6b7280]">{date.label}</p>
                  <p className="m-0 mt-1 text-2xl font-bold text-[#111827]">
                    {String(date.day).padStart(2, '0')}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 border-b border-[#edf1f6] bg-[#fafcff] px-4 py-3 text-base">
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-8 rounded border border-[#86efac] bg-[#dcfce7]" />
                {isArabic ? 'محجوز' : 'Reserved'}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-8 rounded border border-[#fdba74] bg-[#ffedd5]" />
                {isArabic ? 'غير محجوز' : 'Not reserved'}
              </span>
            </div>

            {!loading && unitRows.length === 0 ? (
              <div className="p-10 text-center text-lg text-[#6b7280]">
                {isArabic ? 'لا توجد بيانات لهذا الشهر' : 'No data for this month'}
              </div>
            ) : (
              unitRows.map((unit) => (
                <div key={unit.unitNameId} className="border-b border-[#edf1f6] last:border-b-0">
                  <div
                    className="grid border-t border-[#f1f5f9]"
                    style={{ gridTemplateColumns: `280px repeat(${dates.length}, minmax(96px, 1fr))` }}
                  >
                    <button
                      type="button"
                      onClick={() => handleUnitNameClick(unit)}
                      disabled={!bookingMode}
                      className={`sticky inset-s-0 z-10 border-e border-[#edf1f6] bg-white p-4 text-start text-lg font-semibold text-[#475569] transition ${
                        bookingMode
                          ? 'cursor-pointer hover:bg-[#eff6ff] hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-primary/30'
                          : 'cursor-default'
                      }`}
                    >
                      <span
                        className={`inline-flex h-3 w-3 rounded-full ${
                          Object.values(unit.statsByDate).some(
                            (s) => getCellStatus(s) === 'reserved'
                          )
                            ? 'bg-[#22c55e]'
                            : 'bg-[#f97316]'
                        }`}
                      />
                      <span className="ms-2">
                        {isArabic ? unit.unitNameAr || unit.unitNameEn : unit.unitNameEn || unit.unitNameAr}
                      </span>
                      {bookingMode ? (
                        <span className="mt-1 block text-xs font-normal text-brand-primary">
                          {isArabic ? 'انقر للاختيار' : 'Click to select'}
                        </span>
                      ) : null}
                    </button>
                    {dates.map((date) => {
                      const stat = unit.statsByDate[date.iso]
                      const available = stat?.availableRooms ?? 0
                      const occupied = stat?.occupiedRooms ?? 0
                      const booked = stat?.bookedRooms ?? 0
                      const status = getCellStatus(stat)
                      const styles = cellStatusStyles[status]
                      const mainValue =
                        status === 'reserved'
                          ? occupied + booked
                          : status === 'available'
                            ? available
                            : stat?.totalRooms ?? 0
                      return (
                        <div
                          key={`${unit.unitNameId}-${date.iso}`}
                          className="border-e border-[#edf1f6] bg-white px-1.5 py-2.5"
                        >
                          <div
                            className={`mx-auto w-full rounded-lg border px-2 py-2.5 text-center ${styles.box}`}
                          >
                            <p className={`m-0 text-2xl font-bold leading-none ${styles.main}`}>{mainValue}</p>
                            <p className={`m-0 mt-2 text-sm font-semibold ${styles.sub}`}>
                              {isArabic ? `متاح ${available}` : `Avail ${available}`}
                            </p>
                            <p className={`m-0 text-sm ${styles.sub}`}>
                              {isArabic
                                ? `ساكنة ${occupied} · حجز ${booked}`
                                : `Occ ${occupied} · Bkd ${booked}`}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <MonthlyReportUnitFeatureModal
        open={Boolean(featureModalUnit)}
        unit={featureModalUnit}
        fromDate={bookingDraft.fromDate}
        toDate={bookingDraft.toDate}
        selectedUnits={selectedUnits}
        isArabic={isArabic}
        onClose={() => setFeatureModalUnit(null)}
        onSave={handleSaveUnitSelection}
      />
    </section>
  )
}

export default MonthlyReportPage
