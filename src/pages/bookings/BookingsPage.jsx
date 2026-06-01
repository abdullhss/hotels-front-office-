import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, Hourglass, Plus, Search } from 'lucide-react'
import TablePage from '../../components/table/TablePage.jsx'
import BookingStatTabs from './components/BookingStatTabs.jsx'
import { IconDateInput } from '../new-booking/components/BookingFormFields.jsx'
import { iconInputClass } from '../new-booking/bookingStyles.js'
import { formatDisplayDate, toInputDateValue } from '../new-booking/dateUtils.js'
import {
  fetchReservationsPage,
  filterReservationsByStat,
  getReservationDetails,
  mapReservationToTableRow,
} from '../../Hooks/GetReservations.js'
import BookingReservationPreviewModal from './components/BookingReservationPreviewModal.jsx'
import { cn } from '../../lib/utils'

const panelClass =
  'min-w-0 max-w-full rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-sm sm:p-4'

const LIST_FETCH_COUNT = 500

function BookingsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isArabic = i18n.language === 'ar'
  const currency = t('newBooking.stay.currency')

  const [activeStat, setActiveStat] = useState('total')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [appliedSearch, setAppliedSearch] = useState({ search: '', date: '' })

  const [allReservations, setAllReservations] = useState([])
  const [stats, setStats] = useState({ all: 0, done: 0, pending: 0 })
  const [tableData, setTableData] = useState({ rows: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewReservation, setPreviewReservation] = useState(null)

  const openReservationPreview = useCallback(
    async (item) => {
      const reservationId = item?.raw?.id ?? item?.id
      if (!reservationId) return

      setPreviewOpen(true)
      setPreviewLoading(true)
      setPreviewReservation(null)

      try {
        const result = await getReservationDetails(reservationId)
        if (!result.success || !result.reservation) {
          toast.error(
            result.error ?? (isArabic ? 'تعذر تحميل تفاصيل الحجز' : 'Failed to load reservation details')
          )
          setPreviewOpen(false)
          return
        }
        setPreviewReservation(result.reservation)
      } catch (err) {
        toast.error(err?.message ?? (isArabic ? 'تعذر تحميل تفاصيل الحجز' : 'Failed to load reservation details'))
        setPreviewOpen(false)
      } finally {
        setPreviewLoading(false)
      }
    },
    [isArabic]
  )

  const applyTablePage = useCallback(
    (page, rowsPerPage, reservations, statKey) => {
      const filtered = filterReservationsByStat(reservations, statKey)
      const uiRows = filtered
        .map((row) => mapReservationToTableRow(row, isArabic, currency))
        .filter(Boolean)
      const start = (page - 1) * rowsPerPage
      setTableData({
        rows: uiRows.slice(start, start + rowsPerPage),
        total: uiRows.length,
      })
    },
    [isArabic, currency]
  )

  const loadReservations = useCallback(
    async (filters = appliedSearch) => {
      setLoading(true)
      try {
        const result = await fetchReservationsPage({
          searchText: filters.search,
          date: filters.date,
          startNum: 1,
          count: LIST_FETCH_COUNT,
        })

        if (!result.success) {
          toast.error(result.error ?? (isArabic ? 'فشل تحميل الحجوزات' : 'Failed to load bookings'))
          setAllReservations([])
          setStats({ all: 0, done: 0, pending: 0 })
          setTableData({ rows: [], total: 0 })
          return
        }

        setAllReservations(result.reservations)
        setStats({
          all: result.stats.all,
          done: result.stats.done,
          pending: result.stats.pending,
        })
      } catch (err) {
        toast.error(err?.message ?? (isArabic ? 'فشل تحميل الحجوزات' : 'Failed to load bookings'))
        setAllReservations([])
        setTableData({ rows: [], total: 0 })
      } finally {
        setLoading(false)
      }
    },
    [appliedSearch, isArabic]
  )

  useEffect(() => {
    loadReservations(appliedSearch)
  }, [loadReservations, appliedSearch])

  useEffect(() => {
    if (!allReservations.length && !loading) {
      setTableData({ rows: [], total: 0 })
      return
    }
    applyTablePage(1, 6, allReservations, activeStat)
  }, [allReservations, activeStat, applyTablePage, loading])

  const fetchApi = useCallback(
    (page, rowsPerPage) => {
      applyTablePage(page, rowsPerPage, allReservations, activeStat)
    },
    [applyTablePage, allReservations, activeStat]
  )

  const handleSearch = (e) => {
    e?.preventDefault?.()
    const dateParam = dateFilter ? formatDisplayDate(toInputDateValue(dateFilter)) : ''
    setAppliedSearch({ search: searchQuery.trim(), date: dateParam })
  }

  const handleStatChange = (key) => {
    setActiveStat(key)
  }

  const columns = useMemo(
    () =>
      isArabic
        ? [
            { uid: 'bookingNumber', name: 'رقم الحجز', sortKey: 'bookingNumber' },
            { uid: 'customer', name: 'العميل' },
            { uid: 'unitCategory', name: 'نوع الحجز' },
            { uid: 'dates', name: 'التاريخ' },
            { uid: 'duration', name: 'المدة' },
            { uid: 'amount', name: 'المبلغ' },
            { uid: 'status', name: 'الحالة' },
            { uid: 'actions', name: 'الاجراءات' },
          ]
        : [
            { uid: 'bookingNumber', name: 'Booking #' },
            { uid: 'customer', name: 'Guest / agent' },
            { uid: 'unitCategory', name: 'Booking type' },
            { uid: 'dates', name: 'Dates' },
            { uid: 'duration', name: 'Duration' },
            { uid: 'amount', name: 'Amount' },
            { uid: 'status', name: 'Status' },
            { uid: 'actions', name: 'Actions' },
          ],
    [isArabic]
  )

  const specialCells = useMemo(
    () => [
      {
        key: 'bookingNumber',
        render: (_, item) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-[#111827]">#{item.bookingNumber}</span>
            <span className="text-xs text-[#9ca3af]">
              {isArabic ? item.bookingDateAr : item.bookingDateEn}
            </span>
          </div>
        ),
      },
      {
        key: 'customer',
        render: (_, item) => (
          <span className="font-medium text-[#111827]">
            {isArabic ? item.customerNameAr : item.customerNameEn}
          </span>
        ),
      },
      {
        key: 'unitCategory',
        render: (_, item) => (
          <span className="text-[#374151]">
            {isArabic ? item.unitCategoryAr : item.unitCategoryEn}
          </span>
        ),
      },
      {
        key: 'dates',
        render: (_, item) => (
          <div className="flex flex-col gap-0.5 text-xs text-[#6b7280]">
            <span>
              {isArabic ? 'دخول : ' : 'Check-in: '}
              {isArabic ? item.checkInAr : item.checkInEn}
            </span>
            <span>
              {isArabic ? 'خروج : ' : 'Check-out: '}
              {isArabic ? item.checkOutAr : item.checkOutEn}
            </span>
          </div>
        ),
      },
      {
        key: 'duration',
        render: (_, item) => (
          <span className="text-[#374151]">{isArabic ? item.durationAr : item.durationEn}</span>
        ),
      },
      {
        key: 'amount',
        render: (_, item) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-[#111827]">{item.amount}</span>
            <span
              className={cn(
                'text-xs font-medium',
                item.paymentStatus === 'paid' ? 'text-[#059669]' : 'text-[#dc2626]'
              )}
            >
              {item.paymentStatus === 'paid'
                ? isArabic
                  ? 'مدفوع بالكامل'
                  : 'Paid in full'
                : isArabic
                  ? 'غير مدفوع'
                  : 'Unpaid'}
            </span>
          </div>
        ),
      },
      {
        key: 'status',
        render: (_, item) => (
          <span
            className={cn(
              'inline-flex rounded-lg px-2.5 py-1 text-xs font-medium',
              item.isApproved ? 'bg-[#dff2e9] text-[#059669]' : 'bg-[#fef3c7] text-[#d97706]'
            )}
          >
            {isArabic ? item.statusAr : item.statusEn}
          </span>
        ),
      },
    ],
    [isArabic]
  )

  const actionsConfig = useMemo(
    () => [
      {
        label: isArabic ? 'عرض' : 'View',
        onClick: (item) => openReservationPreview(item),
      },
    ],
    [isArabic, openReservationPreview]
  )

  const statTabs = useMemo(
    () => [
      {
        key: 'total',
        label: t('bookings.stats.total'),
        value: stats.all,
        icon: Check,
        activeClass: 'bg-brand-primary text-white shadow-md',
      },
      {
        key: 'confirmed',
        label: t('bookings.stats.confirmed'),
        value: stats.done,
        icon: Check,
        activeClass: 'bg-white text-[#374151] shadow-sm',
      },
      {
        key: 'pending',
        label: t('bookings.stats.pending'),
        value: stats.pending,
        icon: Hourglass,
        activeClass: 'bg-white text-[#374151] shadow-sm',
      },
    ],
    [t, stats]
  )

  const statTabsWithActiveStyle = useMemo(
    () =>
      statTabs.map((tab) => ({
        ...tab,
        activeClass:
          activeStat === tab.key
            ? tab.key === 'total'
              ? 'bg-brand-primary text-white shadow-md'
              : 'bg-brand-primary text-white shadow-md'
            : 'bg-[#f8fafc] text-[#6b7280] hover:bg-white',
      })),
    [statTabs, activeStat]
  )

  return (
    <section className="mx-auto max-w-[1400px] space-y-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="m-0 text-2xl font-bold text-[#111827]">{t('bookings.title')}</h1>
          <p className="mt-1 text-sm text-[#6b7280]">{t('bookings.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/bookings/new')}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          {t('bookings.newBooking')}
        </button>
      </header>

      <BookingStatTabs
        tabs={statTabsWithActiveStyle}
        activeStat={activeStat}
        onSelect={handleStatChange}
      />

      <form onSubmit={handleSearch} className={panelClass}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative min-w-0 flex-1">
            <label className="mb-1.5 block text-sm font-medium text-[#374151]">
              {t('bookings.searchLabel')}
            </label>
            <Search
              className="pointer-events-none absolute start-3 top-[calc(50%+10px)] h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
              aria-hidden
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('bookings.searchPlaceholder')}
              className={iconInputClass}
            />
          </div>
          <div className="w-full lg:w-52">
            <label className="mb-1.5 block text-sm font-medium text-[#374151]">
              {t('bookings.dateLabel')}
            </label>
            <IconDateInput value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-50 lg:w-auto"
          >
            <Search className="h-4 w-4" />
            {loading ? t('bookings.searching') : t('bookings.search')}
          </button>
        </div>
      </form>

      <div className={panelClass}>
        <h2 className="mb-4 text-base font-semibold text-[#111827]">{t('bookings.listTitle')}</h2>
        <TablePage
          columns={columns}
          specialCells={specialCells}
          data={tableData.rows}
          total={tableData.total}
          fetchApi={fetchApi}
          actionsConfig={actionsConfig}
          onDoubleClick={openReservationPreview}
          hideSearch
          rowsPerPageDefault={6}
          isHeaderSticky
          isLoading={loading}
        />
      </div>

      <BookingReservationPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        reservation={previewReservation}
        loading={previewLoading}
        isArabic={isArabic}
      />
    </section>
  )
}

export default BookingsPage
