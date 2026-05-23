import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BedDouble, ChevronDown, Flag, Plus, Search, Star, Users } from 'lucide-react'
import TablePage from '../../components/table/TablePage.jsx'
import { cn } from '../../lib/utils.js'
import useNationalities from '../../Hooks/GetNationalities.js'
import {
  computeCustomerStats,
  fetchCustomersPage,
  GENDER_IDS,
  mapCustomerToTableRow,
} from '../../Hooks/GetCustomers.js'
import CustomerIdThumb from './components/CustomerIdThumb.jsx'

const panelClass =
  'min-w-0 max-w-full rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-sm sm:p-4'

function CustomerStatCard({ title, value, icon: Icon, iconBg, iconColor }) {
  return (
    <article className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-sm font-medium text-[#6b7280]">{title}</p>
          <p className="mt-2 text-3xl font-bold leading-none text-[#111827]">{value}</p>
        </div>
        <span
          className={cn(
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            iconBg,
            iconColor
          )}
        >
          <Icon size={20} strokeWidth={1.75} />
        </span>
      </div>
    </article>
  )
}

function CustomersPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  const { nationalities } = useNationalities()

  const [searchQuery, setSearchQuery] = useState('')
  const [nationalityFilter, setNationalityFilter] = useState('all')
  const [genderFilter, setGenderFilter] = useState('all')
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    nationalityId: -1,
    genderId: -1,
  })

  const [tableData, setTableData] = useState({ rows: [], total: 0 })
  const [statsData, setStatsData] = useState({ total: 0, local: 0, currentGuests: 0, repeat: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadCustomers = useCallback(
    async (page, rowsPerPage, filters = appliedFilters) => {
      setLoading(true)
      setError(null)
      const startNum = (page - 1) * rowsPerPage + 1
      const result = await fetchCustomersPage({
        id: -1,
        nationalityId: filters.nationalityId,
        genderId: filters.genderId,
        searchText: filters.search,
        startNum,
        count: rowsPerPage,
      })

      if (result.error) {
        setError(result.error)
        setTableData({ rows: [], total: 0 })
      } else {
        const uiRows = result.rows
          .map((row) => mapCustomerToTableRow(row, isArabic))
          .filter(Boolean)
        setTableData({ rows: uiRows, total: result.total })
      }
      setLoading(false)
    },
    [appliedFilters, isArabic]
  )

  const loadStats = useCallback(async (filters = appliedFilters) => {
    const result = await fetchCustomersPage({
      id: -1,
      nationalityId: filters.nationalityId,
      genderId: filters.genderId,
      searchText: filters.search,
      startNum: 1,
      count: 500,
    })
    if (!result.error) {
      setStatsData(computeCustomerStats(result.rows, result.total))
    }
  }, [appliedFilters])

  useEffect(() => {
    loadCustomers(1, 10, appliedFilters)
    loadStats(appliedFilters)
  }, [loadCustomers, loadStats, appliedFilters, location.pathname])

  const fetchApi = useCallback(
    (page, rowsPerPage) => {
      loadCustomers(page, rowsPerPage, appliedFilters)
    },
    [loadCustomers, appliedFilters]
  )

  const handleSearch = () => {
    const nat = nationalityFilter === 'all' ? -1 : Number(nationalityFilter)
    const gen =
      genderFilter === 'all'
        ? -1
        : genderFilter === 'male'
          ? GENDER_IDS.male
          : genderFilter === 'female'
            ? GENDER_IDS.female
            : -1
    setAppliedFilters({
      search: searchQuery.trim(),
      nationalityId: Number.isFinite(nat) ? nat : -1,
      genderId: gen,
    })
  }

  const stats = useMemo(
    () => [
      {
        title: t('customers.stats.total'),
        value: statsData.total,
        icon: Users,
        iconBg: 'bg-[#eef2ff]',
        iconColor: 'text-[#5b56f7]',
      },
      {
        title: t('customers.stats.local'),
        value: statsData.local,
        icon: Flag,
        iconBg: 'bg-[#fff4e6]',
        iconColor: 'text-[#d97706]',
      },
      {
        title: t('customers.stats.currentGuests'),
        value: statsData.currentGuests,
        icon: BedDouble,
        iconBg: 'bg-[#e7f8f1]',
        iconColor: 'text-[#059669]',
      },
      {
        title: t('customers.stats.repeat'),
        value: statsData.repeat,
        icon: Star,
        iconBg: 'bg-[#fff7ed]',
        iconColor: 'text-[#ea580c]',
      },
    ],
    [t, statsData]
  )

  const columns = useMemo(
    () =>
      isArabic
        ? [
            { uid: 'customer', name: 'العميل' },
            { uid: 'idInfo', name: 'نوع و رقم الهوية' },
            { uid: 'idImage', name: 'صورة الهوية' },
            { uid: 'whatsapp', name: 'واتس' },
            { uid: 'localPhone', name: 'رقم الهاتف المحلي' },
            { uid: 'nationality', name: 'الجنسية' },
            { uid: 'bookingsCount', name: 'عدد الحجوزات' },
            { uid: 'lastVisit', name: 'آخر زيارة' },
            { uid: 'status', name: 'الحالة' },
            { uid: 'actions', name: 'الاجراءات' },
          ]
        : [
            { uid: 'customer', name: 'Customer' },
            { uid: 'idInfo', name: 'ID type & number' },
            { uid: 'idImage', name: 'ID image' },
            { uid: 'whatsapp', name: 'WhatsApp' },
            { uid: 'localPhone', name: 'Local phone' },
            { uid: 'nationality', name: 'Nationality' },
            { uid: 'bookingsCount', name: 'Bookings' },
            { uid: 'lastVisit', name: 'Last visit' },
            { uid: 'status', name: 'Status' },
            { uid: 'actions', name: 'Actions' },
          ],
    [isArabic]
  )

  const statusBadge = (status) => {
    if (status === 'repeat') {
      return {
        label: isArabic ? 'عميل متكرر' : 'Repeat customer',
        className: 'bg-[#dff2e9] text-[#059669]',
      }
    }
    return {
      label: isArabic ? 'عميل جديد' : 'New customer',
      className: 'bg-[#f1f5f9] text-[#64748b]',
    }
  }

  const specialCells = useMemo(
    () => [
      {
        key: 'customer',
        render: (_, item) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-[#111827]">
              {isArabic ? item.nameAr : item.nameEn || item.nameAr}
            </span>
            {item.email ? (
              <span className="text-xs text-[#9ca3af]" dir="ltr">
                {item.email}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: 'idInfo',
        render: (_, item) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-[#374151]">
              {isArabic ? item.idTypeAr : item.idTypeEn}
            </span>
            <span className="text-xs text-[#9ca3af]" dir="ltr">
              {item.idNumber}
            </span>
          </div>
        ),
      },
      {
        key: 'idImage',
        render: (_, item) => <CustomerIdThumb fileId={item.idImageAttach} />,
      },
      {
        key: 'whatsapp',
        render: (_, item) => (
          <span className="text-[#374151]" dir="ltr">
            {item.whatsappPhone}
          </span>
        ),
      },
      {
        key: 'localPhone',
        render: (_, item) => (
          <span className="text-[#374151]" dir="ltr">
            {item.localPhone}
          </span>
        ),
      },
      {
        key: 'nationality',
        render: (_, item) => (
          <span className="text-[#374151]">
            {isArabic ? item.nationalityAr : item.nationalityEn || item.nationalityAr}
          </span>
        ),
      },
      {
        key: 'bookingsCount',
        render: (_, item) => (
          <span className="font-medium text-[#111827]">{item.bookingsCount}</span>
        ),
      },
      {
        key: 'lastVisit',
        render: (_, item) => (
          <span className="text-[#374151]">
            {isArabic ? item.lastVisitAr : item.lastVisitEn}
          </span>
        ),
      },
      {
        key: 'status',
        render: (_, item) => {
          const badge = statusBadge(item.status)
          return (
            <span
              className={cn(
                'inline-flex rounded-lg px-2.5 py-1 text-xs font-medium',
                badge.className
              )}
            >
              {badge.label}
            </span>
          )
        },
      },
    ],
    [isArabic]
  )

  const actionsConfig = useMemo(
    () => [
      { label: isArabic ? 'عرض' : 'View', onClick: () => {} },
      { label: isArabic ? 'تعديل' : 'Edit', onClick: () => {} },
    ],
    [isArabic]
  )

  const selectClass =
    'w-full appearance-none rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-3 ps-3 pe-9 text-sm text-[#374151] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary'

  return (
    <section className="mx-auto max-w-[1400px] space-y-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="m-0 text-2xl font-bold text-[#111827]">{t('customers.title')}</h1>
          <p className="mt-1 text-sm text-[#6b7280]">{t('customers.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/customers/new')}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          {t('customers.addCustomer')}
        </button>
      </header>

      {error ? (
        <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <CustomerStatCard key={item.title} {...item} />
        ))}
      </div>

      <div className={panelClass}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('customers.searchPlaceholder')}
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-3 pe-10 ps-3 text-sm text-[#374151] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
          <div className="relative w-full lg:w-44">
            <select
              value={nationalityFilter}
              onChange={(e) => setNationalityFilter(e.target.value)}
              className={selectClass}
              aria-label={t('customers.filters.nationality')}
            >
              <option value="all">{t('customers.filters.nationalityAll')}</option>
              {nationalities.map((n) => (
                <option key={n.Id ?? n.id} value={n.Id ?? n.id}>
                  {isArabic
                    ? n.NationalityNameA ?? n.nationalityNameA
                    : n.NationalityNameE ?? n.nationalityNameE}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
          </div>
          <div className="relative w-full lg:w-40">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className={selectClass}
              aria-label={t('customers.filters.gender')}
            >
              <option value="all">{t('customers.filters.genderAll')}</option>
              <option value="male">{isArabic ? 'ذكر' : 'Male'}</option>
              <option value="female">{isArabic ? 'أنثى' : 'Female'}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover lg:w-auto"
          >
            <Search className="h-4 w-4" />
            {t('customers.search')}
          </button>
        </div>
      </div>

      <div className={panelClass}>
        <h2 className="mb-4 text-base font-semibold text-[#111827]">{t('customers.listTitle')}</h2>
        <TablePage
          columns={columns}
          specialCells={specialCells}
          data={tableData.rows}
          total={tableData.total}
          fetchApi={fetchApi}
          actionsConfig={actionsConfig}
          hideSearch
          isLoading={loading}
          rowsPerPageDefault={10}
          isHeaderSticky
        />
      </div>
    </section>
  )
}

export default CustomersPage
