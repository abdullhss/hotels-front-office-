import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, Plus, Search } from 'lucide-react'
import {
  mapReservationToCheckInBooking,
  resolveReservationForCheckIn,
} from '../../Hooks/GetReservations.js'
import CheckInSummaryCards from './components/CheckInSummaryCards.jsx'
import CheckInAdditionalInfo from './components/CheckInAdditionalInfo.jsx'
import CheckInRoomsTable from './components/CheckInRoomsTable.jsx'

const panelClass =
  'min-w-0 max-w-full rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-sm sm:p-4'

function AllocationCheckInPage() {
  const { bookingId } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isArabic = i18n.language === 'ar'
  const currency = t('newBooking.stay.currency')

  const [searchQuery, setSearchQuery] = useState('')
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadBooking = useCallback(
    async (idOrSearch) => {
      const target = String(idOrSearch ?? bookingId ?? '').trim()
      if (!target) {
        setBooking(null)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const result = await resolveReservationForCheckIn(target)
        if (!result.success || !result.reservation) {
          toast.error(result.error ?? t('allocation.notFound'))
          setBooking(null)
          return
        }

        const mapped = mapReservationToCheckInBooking(result.reservation, isArabic, currency)
        setBooking(mapped)
        setSearchQuery(
          mapped?.reservationNum ? `#${mapped.reservationNum}` : `#${result.reservation.id}`
        )

        if (String(result.reservation.id) !== String(bookingId)) {
          navigate(`/allocation/${result.reservation.id}/check-in`, { replace: true })
        }
      } catch (err) {
        toast.error(err?.message ?? t('allocation.loadFailed'))
        setBooking(null)
      } finally {
        setLoading(false)
      }
    },
    [bookingId, currency, isArabic, navigate, t]
  )

  useEffect(() => {
    loadBooking(bookingId)
  }, [loadBooking, bookingId])

  const handleSearch = () => {
    const q = searchQuery.trim()
    if (!q) return
    loadBooking(q)
  }

  if (!loading && !booking) {
    return <Navigate to="/allocation" replace />
  }

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

      {loading ? (
        <p className="m-0 py-12 text-center text-sm text-[#6b7280]">{t('allocation.searching')}</p>
      ) : booking ? (
        <>
          <CheckInSummaryCards booking={booking} isArabic={isArabic} />
          <CheckInAdditionalInfo booking={booking} isArabic={isArabic} />
          <CheckInRoomsTable key={booking.id} booking={booking} isArabic={isArabic} />

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover"
            >
              <Check className="h-4 w-4" />
              {t('allocation.checkInPage.completeAllocation')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/allocation')}
              className="text-sm font-medium text-[#dc2626] transition-colors hover:text-[#b91c1c]"
            >
              {t('allocation.checkInPage.cancel')}
            </button>
          </div>
        </>
      ) : null}
    </section>
  )
}

export default AllocationCheckInPage
