import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  Check,
  Hourglass,
  Plus,
  Search,
} from 'lucide-react'
import TablePage from '../../components/table/TablePage.jsx'
import BookingStatTabs from './components/BookingStatTabs.jsx'
import { cn } from '../../lib/utils'

const CUSTOMER_NAME = 'سعيد محمد علي'
const CUSTOMER_NAME_EN = 'Saeed Mohammed Ali'
const BOOKING_DATE_AR = '6 أكتوبر 2026'
const BOOKING_DATE_EN = '6 Oct 2026'
const CHECK_IN_AR = '6 أكتوبر 2026'
const CHECK_IN_EN = '6 Oct 2026'
const CHECK_OUT_AR = '8 أكتوبر 2026'
const CHECK_OUT_EN = '8 Oct 2026'

const ALL_ROWS = Array.from({ length: 60 }, (_, i) => ({
  id: 74 - i,
  bookingNumber: 74 - i,
  bookingDateAr: BOOKING_DATE_AR,
  bookingDateEn: BOOKING_DATE_EN,
  customerNameAr: CUSTOMER_NAME,
  customerNameEn: CUSTOMER_NAME_EN,
  phone: '925666666',
  unitCategoryAr: i % 2 === 0 ? 'غرفة' : 'سويت',
  unitCategoryEn: i % 2 === 0 ? 'Room' : 'Suite',
  checkInAr: CHECK_IN_AR,
  checkInEn: CHECK_IN_EN,
  checkOutAr: CHECK_OUT_AR,
  checkOutEn: CHECK_OUT_EN,
  durationAr: '2 ليلة',
  durationEn: '2 nights',
  amount: '900,00 د.ل.',
  paymentStatus: i % 2 === 0 ? 'paid' : 'unpaid',
  statusAr: 'نشط',
  statusEn: 'Active',
}))

const panelClass =
  'min-w-0 max-w-full rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-sm sm:p-4'

function BookingsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isArabic = i18n.language === 'ar'
  const [activeStat, setActiveStat] = useState('confirmed')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [tableData, setTableData] = useState(() => ({
    rows: ALL_ROWS.slice(0, 6),
    total: ALL_ROWS.length,
  }))

  const fetchApi = useCallback((page, rowsPerPage) => {
    const start = (page - 1) * rowsPerPage
    const slice = ALL_ROWS.slice(start, start + rowsPerPage)
    setTableData({ rows: slice, total: ALL_ROWS.length })
  }, [])

  const columns = useMemo(
    () =>
      isArabic
        ? [
            { uid: 'bookingNumber', name: 'رقم الحجز', sortKey: 'bookingNumber' },
            { uid: 'customer', name: 'العميل' },
            { uid: 'unitCategory', name: 'فئة الوحدة' },
            { uid: 'dates', name: 'التاريخ' },
            { uid: 'duration', name: 'المدة' },
            { uid: 'amount', name: 'المبلغ' },
            { uid: 'status', name: 'الحالة' },
            { uid: 'actions', name: 'الاجراءات' },
          ]
        : [
            { uid: 'bookingNumber', name: 'Booking #' },
            { uid: 'customer', name: 'Customer' },
            { uid: 'unitCategory', name: 'Unit type' },
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
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-[#111827]">
              {isArabic ? item.customerNameAr : item.customerNameEn}
            </span>
            <span className="text-xs text-[#9ca3af]" dir="ltr">
              {item.phone}
            </span>
          </div>
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
          <span className="inline-flex rounded-lg bg-[#dff2e9] px-2.5 py-1 text-xs font-medium text-[#059669]">
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
        onClick: () => {},
      },
      {
        label: isArabic ? 'تعديل' : 'Edit',
        onClick: () => {},
      },
    ],
    [isArabic]
  )

  const statTabs = useMemo(
    () => [
      {
        key: 'total',
        label: t('bookings.stats.total'),
        value: ALL_ROWS.length,
        icon: Check,
        activeClass: 'bg-white text-[#374151] shadow-sm',
      },
      {
        key: 'confirmed',
        label: t('bookings.stats.confirmed'),
        value: ALL_ROWS.length,
        icon: Check,
        activeClass: 'bg-brand-primary text-white shadow-md',
      },
      {
        key: 'pending',
        label: t('bookings.stats.pending'),
        value: 0,
        icon: Hourglass,
        activeClass: 'bg-white text-[#374151] shadow-sm',
      },
    ],
    [t]
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

      <BookingStatTabs tabs={statTabs} activeStat={activeStat} onSelect={setActiveStat} />

      <div className={panelClass}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('bookings.searchPlaceholder')}
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-3 pe-10 ps-3 text-sm text-[#374151] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
          <div className="relative w-full lg:w-48">
            <Calendar className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder={t('bookings.datePlaceholder')}
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-3 pe-10 ps-3 text-sm text-[#374151] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
          <button
            type="button"
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover lg:w-auto"
          >
            <Search className="h-4 w-4" />
            {t('bookings.search')}
          </button>
        </div>
      </div>

      <div className={panelClass}>
        <h2 className="mb-4 text-base font-semibold text-[#111827]">{t('bookings.listTitle')}</h2>
        <TablePage
          columns={columns}
          specialCells={specialCells}
          data={tableData.rows}
          total={tableData.total}
          fetchApi={fetchApi}
          actionsConfig={actionsConfig}
          hideSearch
          rowsPerPageDefault={6}
          isHeaderSticky
        />
      </div>
    </section>
  )
}

export default BookingsPage
