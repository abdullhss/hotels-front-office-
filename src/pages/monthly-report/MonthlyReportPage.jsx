import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, LoaderCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { EMPLOYEE_HOTEL_ID } from '../../Hooks/GetEmployees'
import useExtraFeatures from '../../Hooks/GetExtraFeatures'
import { fetchMonthlyRoomsReport, normalizeFloorNumParam } from '../../Hooks/GetMonthlyRoomsReport'

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
  const [loading, setLoading] = useState(false)
  const [reportRows, setReportRows] = useState([])

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
        hotelId: EMPLOYEE_HOTEL_ID,
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
        iso: d.toISOString().slice(0, 10),
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

  return (
    <section className="mx-auto max-w-[1450px] space-y-4">
      <header className="flex flex-col gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="m-0 text-2xl font-bold text-[#111827]">{title}</h1>
          <p className="mt-1 text-sm text-[#6b7280]">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/bookings/new')}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-primary-hover sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          {isArabic ? 'إضافة حجز' : 'Add Booking'}
        </button>
      </header>

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
                    <div className="sticky inset-s-0 z-10 border-e border-[#edf1f6] bg-white p-4 text-lg font-semibold text-[#475569]">
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
                    </div>
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
                                ? `إشغال ${occupied} · حجز ${booked}`
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
    </section>
  )
}

export default MonthlyReportPage
