import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Filter,
  KeyRound,
  LayoutGrid,
  List,
  LoaderCircle,
  UserRound,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '../../lib/utils.js'
import { getAuthHotelId } from '../../utils/authStorage.js'
import useExtraFeatures from '../../Hooks/GetExtraFeatures.js'
import {
  ROOMS_PAGE_SIZE,
  fetchRoomsStatus,
  fetchRoomsStatusStats,
  isRoomSeated,
} from '../../Hooks/GetRoomsStatus.js'
import { normalizeFloorNumParam } from '../../Hooks/GetMonthlyRoomsReport.js'
import { formatDisplayDate } from '../new-booking/dateUtils.js'
import useUnitTitles from '../../Hooks/GetUnitTitles.js'
import UnitsStatCard from './components/UnitsStatCard.jsx'
import UnitDetailCard from './components/UnitDetailCard.jsx'
import UnitAssignmentsPreview from './components/UnitAssignmentsPreview.jsx'
import UnitsPagination from './components/UnitsPagination.jsx'

function formatPrice(value, currencyLabel, locale) {
  const num = Number(value) || 0
  const formatted = num.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${formatted} ${currencyLabel}`
}

function UnitsPage() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const dir = isArabic ? 'rtl' : 'ltr'
  const locale = isArabic ? 'ar-LY' : 'en-US'
  const currencyLabel = t('unitsPage.currency')

  const { unitTitles } = useUnitTitles()
  const { extraFeatures } = useExtraFeatures()

  const [viewMode, setViewMode] = useState('grid')
  const [unitNameId, setUnitNameId] = useState(-1)
  const [floorInput, setFloorInput] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({
    unitNameId: -1,
    floorNum: -1,
  })

  const [page, setPage] = useState(1)
  const [rooms, setRooms] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    seated: 0,
    maintenance: 0,
  })
  const [loading, setLoading] = useState(false)

  const featureById = useMemo(() => {
    const map = new Map()
    extraFeatures.forEach((raw) => {
      const id = Number(raw?.Id ?? raw?.id ?? 0)
      if (!id) return
      const nameAr = String(raw?.FreatureNameA ?? raw?.FeatureNameA ?? '').trim()
      const nameEn = String(raw?.FreatureNameE ?? raw?.FeatureNameE ?? '').trim()
      map.set(id, isArabic ? nameAr || nameEn : nameEn || nameAr)
    })
    return map
  }, [extraFeatures, isArabic])

  const unitOptions = useMemo(
    () =>
      unitTitles
        .map((raw) => {
          const value = Number(raw?.Id ?? raw?.id ?? 0)
          if (!value) return null
          const labelAr = String(raw?.UnitNameA ?? raw?.unitNameA ?? '').trim()
          const labelEn = String(raw?.UnitNameE ?? raw?.unitNameE ?? '').trim()
          return {
            value,
            label: isArabic ? labelAr || labelEn : labelEn || labelAr,
          }
        })
        .filter(Boolean),
    [isArabic, unitTitles]
  )

  const loadStats = useCallback(async () => {
    try {
      const statsResult = await fetchRoomsStatusStats({
        hotelId: getAuthHotelId(),
        unitNameId: appliedFilters.unitNameId,
        floorNum: appliedFilters.floorNum,
      })
      if (!statsResult.success) return
      setStats({
        total: statsResult.total ?? 0,
        available: statsResult.stats.available ?? 0,
        seated: 0,
        maintenance: statsResult.stats.maintenance ?? 0,
      })
    } catch {
      /* keep previous stats */
    }
  }, [appliedFilters])

  const loadRooms = useCallback(async () => {
    setLoading(true)
    try {
      const pageResult = await fetchRoomsStatus({
        hotelId: getAuthHotelId(),
        unitNameId: appliedFilters.unitNameId,
        floorNum: appliedFilters.floorNum,
        page,
        pageSize: ROOMS_PAGE_SIZE,
      })

      if (!pageResult.success) {
        toast.error(pageResult.error ?? t('unitsPage.loadFailed'))
        setRooms([])
        setTotalCount(0)
      } else {
        setRooms(pageResult.rooms)
        setTotalCount(pageResult.total)
      }
    } catch (err) {
      toast.error(err?.message ?? t('unitsPage.loadFailed'))
      setRooms([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, page, t])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(totalCount / ROOMS_PAGE_SIZE)),
    [totalCount]
  )

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const applyFilters = () => {
    setAppliedFilters({
      unitNameId,
      floorNum: normalizeFloorNumParam(floorInput),
    })
    setPage(1)
  }

  const displayUnits = useMemo(() => {
    return rooms.map((unit) => {
        const unitTypeLabel = isArabic
          ? unit.unitNameAr || unit.unitNameEn
          : unit.unitNameEn || unit.unitNameAr
        const amenityItems = unit.featureIds.map((fid) => ({
          id: fid,
          label: featureById.get(fid) ?? `#${fid}`,
        }))
        const capacityLabel =
          unit.maxPersonCount > 0
            ? t('unitsPage.capacity.persons', {
                count: unit.personsCount,
                max: unit.maxPersonCount,
              })
            : t('unitsPage.capacity.unknown')

        return {
          ...unit,
          status: unit.statusKey,
          unitNameLabel: unitTypeLabel,
          floorNum: unit.floorNum,
          capacityLabel,
          priceLabel: formatPrice(unit.unitPricePerNight, currencyLabel, locale),
          amenityItems,
          statusLabel: unit.roomStatusRaw,
          fromDateLabel: formatDisplayDate(unit.fromDateIso),
          toDateLabel: formatDisplayDate(unit.toDateIso),
        }
      })
  }, [rooms, isArabic, featureById, t, currencyLabel, locale])

  const statCards = useMemo(
    () => [
      {
        title: t('unitsPage.stats.total'),
        subtitle: '',
        value: stats.total,
        icon: Building2,
        iconBg: 'bg-[#eef2ff]',
        iconColor: 'text-[#6366f1]',
      },
      {
        title: t('unitsPage.stats.available'),
        subtitle: t('unitsPage.stats.availableHint'),
        value: stats.available,
        icon: CheckCircle2,
        iconBg: 'bg-[#e7f8f1]',
        iconColor: 'text-[#059669]',
      },
      {
        title: t('unitsPage.stats.seated'),
        subtitle: t('unitsPage.stats.seatedHint'),
        value: stats.seated,
        icon: UserRound,
        iconBg: 'bg-[#fee2e2]',
        iconColor: 'text-[#dc2626]',
      },
      {
        title: t('unitsPage.stats.maintenance'),
        subtitle: t('unitsPage.stats.maintenanceHint'),
        value: stats.maintenance,
        icon: KeyRound,
        iconBg: 'bg-[#ffe9ef]',
        iconColor: 'text-[#e11d48]',
      },
    ],
    [t, stats]
  )

  const filterSelectClass =
    'h-11 min-w-[8.5rem] appearance-none rounded-xl border border-[#e2e8f0] bg-white pe-9 ps-3 text-sm text-[#374151] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary'

  return (
    <section className="space-y-4" dir={dir}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <UnitsStatCard key={item.title} {...item} />
        ))}
      </div>

      <div className="rounded-2xl border border-[#e2e8f0] bg-white px-3 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applyFilters}
            disabled={loading}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle size={16} className="animate-spin" strokeWidth={2} />
            ) : (
              <Filter size={16} strokeWidth={2} />
            )}
            {t('unitsPage.filters.filter')}
          </button>

          <div className="relative">
            <select
              value={unitNameId}
              onChange={(e) => {
                const nextId = Number(e.target.value)
                setUnitNameId(nextId)
                setAppliedFilters((prev) => ({
                  ...prev,
                  unitNameId: nextId,
                }))
                setPage(1)
              }}
              className={filterSelectClass}
              aria-label={t('unitsPage.filters.type')}
            >
              <option value={-1}>
                {isArabic ? 'كل أنواع الوحدات' : 'All unit types'}
              </option>
              {unitOptions.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
            />
          </div>

          <input
            type="text"
            inputMode="numeric"
            value={floorInput}
            onChange={(e) => setFloorInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyFilters()
            }}
            className="h-11 w-[120px] rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm text-[#374151] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary"
            placeholder={isArabic ? 'الدور' : 'Floor'}
            aria-label={t('unitsPage.filters.floor')}
          />

          <div className="ms-auto inline-flex rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-lg transition',
                viewMode === 'grid' ? 'bg-[#eef2ff] text-[#6366f1]' : 'text-[#6b7280]'
              )}
              aria-label={t('unitsPage.filters.gridViewAria')}
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid size={17} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-lg transition',
                viewMode === 'list' ? 'bg-[#eef2ff] text-[#6366f1]' : 'text-[#6b7280]'
              )}
              aria-label={t('unitsPage.filters.listViewAria')}
              aria-pressed={viewMode === 'list'}
            >
              <List size={17} />
            </button>
          </div>
        </div>
      </div>

      {loading && rooms.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#e2e8f0] bg-white px-4 py-16 text-sm text-[#6b7280]">
          <LoaderCircle className="h-5 w-5 animate-spin text-[#6366f1]" />
          {t('unitsPage.loading')}
        </div>
      ) : displayUnits.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#e2e8f0] bg-white px-4 py-10 text-center text-sm text-[#6b7280]">
          {t('unitsPage.empty')}
        </p>
      ) : viewMode === 'grid' ? (
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayUnits.map((unit) => (
            <UnitDetailCard key={unit.rowKey} unit={unit} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {displayUnits.map((unit) => (
            <div
              key={unit.rowKey}
              className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="m-0 text-xs text-[#9ca3af]">
                    {t('unitsPage.floor.label')}{' '}
                    <span className="font-semibold text-[#374151]">{unit.floorNum ?? '—'}</span>
                  </p>
                  <p className="m-0 text-lg font-bold text-[#111827]">{unit.unitNameLabel}</p>
                  <p className="m-0 mt-1 text-sm text-[#6b7280]">
                    {unit.capacityLabel} · {unit.priceLabel}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-semibold',
                    unit.statusKey === 'occupied' && 'bg-[#fee2e2] text-[#dc2626]',
                    unit.statusKey === 'cleaning' && 'bg-[#ffedd5] text-[#c2410c]',
                    unit.statusKey === 'available' && 'bg-[#dcfce7] text-[#15803d]',
                    unit.statusKey === 'reserved' && 'bg-[#fef9c3] text-[#a16207]',
                    unit.statusKey === 'maintenance' && 'bg-[#fce7f3] text-[#db2777]'
                  )}
                >
                  {unit.statusLabel ?? t(`unitsPage.status.${unit.statusKey}`)}
                </span>
              </div>
              {isRoomSeated(unit) ? <UnitAssignmentsPreview unit={unit} className="mt-3" /> : null}
            </div>
          ))}
        </div>
      )}

      <UnitsPagination
        page={page}
        pageCount={pageCount}
        total={totalCount}
        onPageChange={setPage}
        disabled={loading}
      />
    </section>
  )
}

export default UnitsPage
