import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FileText, Search } from 'lucide-react'
import {
  finalizeUnitAssignmentStatus,
  getReservationInvoice,
  mapUnitAssignmentToCheckInBooking,
  performRoomCheckout,
  resolveUnitAssignmentForCheckIn,
} from '../../Hooks/GetReservations.js'
import CheckInSummaryCards from '../allocation/components/CheckInSummaryCards.jsx'
import CheckInAdditionalInfo from '../allocation/components/CheckInAdditionalInfo.jsx'
import CheckInRoomsTable from '../allocation/components/CheckInRoomsTable.jsx'
import ChangeRoomModal from './components/ChangeRoomModal.jsx'
import ReservationInvoiceModal from './components/ReservationInvoiceModal.jsx'

const panelClass =
  'min-w-0 max-w-full rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-sm sm:p-4'

function RoomOperationsCheckInPage() {
  const { assignmentId } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isArabic = i18n.language === 'ar'
  const currency = t('newBooking.stay.currency')

  const [searchQuery, setSearchQuery] = useState('')
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [changeRoomTarget, setChangeRoomTarget] = useState(null)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [invoiceLines, setInvoiceLines] = useState([])
  const [loadingInvoice, setLoadingInvoice] = useState(false)
  const [endingAssignment, setEndingAssignment] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadAssignment = useCallback(
    async (idOrSearch, { silent = false } = {}) => {
      const target = String(idOrSearch ?? assignmentId ?? '').trim()
      if (!target) {
        setBooking(null)
        setLoading(false)
        return
      }

      if (silent) setRefreshing(true)
      else setLoading(true)

      try {
        const result = await resolveUnitAssignmentForCheckIn(target)
        if (!result.success || !result.assignment) {
          toast.error(result.error ?? t('roomOperations.notFound'))
          if (!silent) setBooking(null)
          return
        }

        const mapped = mapUnitAssignmentToCheckInBooking(result.assignment, isArabic, currency)
        setBooking(mapped)
        setRefreshKey((k) => k + 1)
        setSearchQuery(
          mapped?.assignmentNum ? `#${mapped.assignmentNum}` : `#${result.assignment.id}`
        )

        if (String(result.assignment.id) !== String(assignmentId)) {
          navigate(`/room-operations/${result.assignment.id}/check-in`, { replace: true })
        }
      } catch (err) {
        toast.error(err?.message ?? t('roomOperations.loadFailed'))
        if (!silent) setBooking(null)
      } finally {
        if (silent) setRefreshing(false)
        else setLoading(false)
      }
    },
    [assignmentId, currency, isArabic, navigate, t]
  )

  useEffect(() => {
    loadAssignment(assignmentId)
  }, [loadAssignment, assignmentId])

  const handleSearch = () => {
    const q = searchQuery.trim()
    if (!q) return
    loadAssignment(q)
  }

  const handleRoomCheckout = async (room) => {
    const unitId = Number(room?.id) || 0
    const assignmentHeaderId = Number(booking?.id) || 0
    if (!unitId) {
      toast.error(isArabic ? 'معرف الغرفة غير صالح' : 'Invalid room id')
      return
    }
    if (!assignmentHeaderId) {
      toast.error(isArabic ? 'معرف التسكين غير صالح' : 'Invalid assignment id')
      return
    }

    try {
      const result = await performRoomCheckout({
        unitAssignmentId: assignmentHeaderId,
        unitAssignmentUnitId: unitId,
        fromDate: room.fromDate,
        unitPricePerNight: room.unitPricePerNight,
        assignmentUnits: booking?.raw?.unitAssignmentUnits ?? [],
      })

      if (!result?.success) {
        toast.error(result?.errorMessage ?? t('roomOperations.roomsTable.checkoutFailed'))
        return
      }

      toast.success(t('roomOperations.roomsTable.checkoutSuccess'))
      await loadAssignment(assignmentId)
    } catch (err) {
      toast.error(err?.message ?? t('roomOperations.roomsTable.checkoutFailed'))
    }
  }

  const handleViewInvoice = async () => {
    const assignmentHeaderId = Number(booking?.id) || 0
    if (!assignmentHeaderId) {
      toast.error(isArabic ? 'معرف التسكين غير صالح' : 'Invalid assignment id')
      return
    }

    setLoadingInvoice(true)
    try {
      const result = await getReservationInvoice({
        hotelId: booking?.raw?.hotelId,
        unitAssignmentId: assignmentHeaderId,
      })

      if (!result?.success) {
        toast.error(result?.error ?? t('roomOperations.invoice.loadFailed'))
        return
      }

      setInvoiceLines(result.lines)
      setInvoiceOpen(true)
    } catch (err) {
      toast.error(err?.message ?? t('roomOperations.invoice.loadFailed'))
    } finally {
      setLoadingInvoice(false)
    }
  }

  const handleInvoiceClose = () => {
    setInvoiceOpen(false)
  }

  const handleEndAssignment = async () => {
    const assignmentHeaderId = Number(booking?.id) || 0
    if (!assignmentHeaderId) return

    setEndingAssignment(true)
    try {
      const result = await finalizeUnitAssignmentStatus({
        unitAssignmentId: assignmentHeaderId,
        status: 2,
      })

      if (!result?.success) {
        toast.error(result?.errorMessage ?? t('roomOperations.finalize.failed'))
        return
      }

      toast.success(t('roomOperations.finalize.success'))
      setInvoiceOpen(false)
      await loadAssignment(assignmentId, { silent: true })
    } catch (err) {
      toast.error(err?.message ?? t('roomOperations.finalize.failed'))
    } finally {
      setEndingAssignment(false)
    }
  }

  const isFinalized = Number(booking?.status ?? booking?.raw?.status) === 2

  if (!loading && !booking) {
    return <Navigate to="/room-operations" replace />
  }

  return (
    <section className="mx-auto max-w-[1400px] space-y-4">
      <header>
        <h1 className="m-0 text-2xl font-bold text-[#111827]">{t('roomOperations.title')}</h1>
        <p className="mt-1 text-sm text-[#6b7280]">{t('roomOperations.subtitle')}</p>
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
              placeholder={t('roomOperations.searchPlaceholder')}
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
            {loading ? t('roomOperations.searching') : t('roomOperations.search')}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="m-0 py-12 text-center text-sm text-[#6b7280]">{t('roomOperations.searching')}</p>
      ) : booking ? (
        <>
          <CheckInSummaryCards booking={booking} isArabic={isArabic} />
          <CheckInAdditionalInfo booking={booking} isArabic={isArabic} />
          <CheckInRoomsTable
            key={`${booking.id}-${refreshKey}`}
            booking={booking}
            isArabic={isArabic}
            mode="room-operations"
            readOnly={isFinalized}
            reservationId={booking.reservationId || booking.raw?.reservationId}
            hotelId={booking?.raw?.hotelId}
            initialRoomNumbers={booking.initialRoomNumbers}
            initialRoomGuests={booking.initialRoomGuests}
            onRoomCheckout={handleRoomCheckout}
            onRoomChange={(room) => setChangeRoomTarget(room)}
          />

          <ChangeRoomModal
            open={Boolean(changeRoomTarget)}
            room={changeRoomTarget}
            booking={booking}
            initialGuests={
              changeRoomTarget ? booking?.initialRoomGuests?.[changeRoomTarget.id] : []
            }
            isArabic={isArabic}
            onClose={() => setChangeRoomTarget(null)}
            onSuccess={() => loadAssignment(assignmentId)}
          />

          <div className="flex flex-col gap-4 border-t border-[#e2e8f0] pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleViewInvoice}
                disabled={loadingInvoice || refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#059669] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#047857] disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                {loadingInvoice ? t('roomOperations.searching') : t('roomOperations.invoice.viewButton')}
              </button>
              {refreshing ? (
                <span className="text-sm text-[#6b7280]">{t('roomOperations.refreshing')}</span>
              ) : null}
              {isFinalized ? (
                <span className="rounded-lg bg-[#dcfce7] px-3 py-1 text-sm font-medium text-[#166534]">
                  {t('roomOperations.finalize.finalizedBadge')}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => navigate('/room-operations')}
                className="text-sm font-medium text-[#dc2626] transition-colors hover:text-[#b91c1c]"
              >
                {t('allocation.checkInPage.cancel')}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-[#eef2ff] px-3 py-1 text-sm font-medium text-brand-primary">
                {isArabic
                  ? `رقم التسكين: ${booking.assignmentNum || booking.id}`
                  : `Assignment #${booking.assignmentNum || booking.id}`}
              </span>
              {booking.reservationId ? (
                <span className="rounded-lg bg-[#ecfeff] px-3 py-1 text-sm font-medium text-[#0f766e]">
                  {isArabic
                    ? `رقم الحجز: ${booking.reservationId}`
                    : `Reservation #${booking.reservationId}`}
                </span>
              ) : null}
            </div>
          </div>

          <ReservationInvoiceModal
            open={invoiceOpen}
            onClose={handleInvoiceClose}
            onEndAssignment={handleEndAssignment}
            isFinalized={isFinalized}
            endingAssignment={endingAssignment}
            lines={invoiceLines}
            assignmentNum={booking.assignmentNum || String(booking.id)}
            isArabic={isArabic}
            currencyLabel={currency}
          />
        </>
      ) : null}
    </section>
  )
}

export default RoomOperationsCheckInPage
