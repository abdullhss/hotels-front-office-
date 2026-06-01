import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Bus, Plus, Search } from 'lucide-react'
import {
  expandReservationsForAllocation,
  isReservationLookupQuery,
  mapReservationToAllocationArrival,
  resolveReservationForCheckIn,
  searchReservationsForAllocation,
} from '../../Hooks/GetReservations.js'
import ArrivalCard from './components/ArrivalCard.jsx'
import AllocationEmptyState from './components/AllocationEmptyState.jsx'

const panelClass =
  'min-w-0 max-w-full rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-sm sm:p-4'

function AllocationPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isArabic = i18n.language === 'ar'
  const currency = t('newBooking.stay.currency')

  const [searchQuery, setSearchQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [arrivals, setArrivals] = useState([])
  const [loading, setLoading] = useState(true)

  const loadArrivals = useCallback(
    async (query = appliedQuery) => {
      setLoading(true)
      try {
        const result = await searchReservationsForAllocation({ searchText: query })

        if (!result.success) {
          toast.error(result.error ?? t('allocation.loadFailed'))
          setArrivals([])
          return
        }

        const expanded = expandReservationsForAllocation(result.reservations)
        const uiRows = expanded
          .map((slot) => mapReservationToAllocationArrival(slot, isArabic, currency))
          .filter(Boolean)
        setArrivals(uiRows)
      } catch (err) {
        toast.error(err?.message ?? t('allocation.loadFailed'))
        setArrivals([])
      } finally {
        setLoading(false)
      }
    },
    [appliedQuery, isArabic, currency, t]
  )

  useEffect(() => {
    loadArrivals(appliedQuery)
  }, [loadArrivals, appliedQuery])

  const hasData = !loading && arrivals.length > 0
  const bookingsCountLabel = isArabic
    ? `${arrivals.length} حجوزات`
    : `${arrivals.length} ${arrivals.length === 1 ? 'booking' : 'bookings'}`

  const handleSearch = async () => {
    const q = searchQuery.trim()
    if (!q) {
      setAppliedQuery('')
      return
    }

    if (isReservationLookupQuery(q)) {
      setLoading(true)
      try {
        const result = await resolveReservationForCheckIn(q)
        if (result.success && result.reservation) {
          navigate(`/allocation/${result.reservation.id}/check-in`)
          return
        }
        toast.error(result.error ?? t('allocation.notFound'))
        setArrivals([])
      } catch (err) {
        toast.error(err?.message ?? t('allocation.loadFailed'))
      } finally {
        setLoading(false)
      }
      return
    }

    setAppliedQuery(q)
  }

  const showEmpty = !loading && arrivals.length === 0

  return (
    <section className="mx-auto max-w-[1400px] space-y-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="m-0 text-2xl font-bold text-[#111827]">{t('allocation.title')}</h1>
          <p className="mt-1 text-sm text-[#6b7280]">{t('allocation.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/bookings/new')}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          {t('allocation.newBooking')}
        </button>
      </header>

      <div className={panelClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
              placeholder={t('allocation.searchPlaceholder')}
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-3 pe-10 ps-3 text-sm text-[#374151] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-50 sm:w-auto"
          >
            <Search className="h-4 w-4" />
            {loading ? t('allocation.searching') : t('allocation.search')}
          </button>
        </div>
      </div>

      <div className={panelClass}>
        {loading ? (
          <p className="m-0 py-8 text-center text-sm text-[#6b7280]">{t('allocation.searching')}</p>
        ) : showEmpty ? (
          <AllocationEmptyState />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7f8f1] text-[#059669]">
                  <Bus className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h2 className="m-0 text-base font-semibold text-[#111827]">
                  {t('allocation.todayArrivals')}
                </h2>
              </div>
              <span className="inline-flex rounded-lg bg-[#eef0ff] px-3 py-1 text-sm font-medium text-brand-primary">
                {bookingsCountLabel}
              </span>
            </div>

            <div className="space-y-3">
              {arrivals.map((arrival) => (
                <ArrivalCard key={arrival.key} arrival={arrival} isArabic={isArabic} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default AllocationPage
