import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, User, X } from 'lucide-react'
import NewBookingStayStep from '../../new-booking/components/NewBookingStayStep.jsx'
import CheckInGuestDataModal from '../../allocation/components/CheckInGuestDataModal.jsx'
import {
  getAvailableRoomsForReservationUnit,
  mapStayRowToUnitAssignmentPayload,
  performRoomChange,
} from '../../../Hooks/GetReservations.js'
import { toInputDateValue } from '../../new-booking/dateUtils.js'

const panelClass =
  'rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm sm:p-5'

function ChangeRoomModal({
  open,
  onClose,
  room,
  booking,
  initialGuests = [],
  isArabic,
  onSuccess,
}) {
  const { t } = useTranslation()
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const originalDeparture = toInputDateValue(room?.toDate)

  const [stayRows, setStayRows] = useState([])
  const [stayGrandTotal, setStayGrandTotal] = useState(0)
  const [hotelUnitId, setHotelUnitId] = useState('')
  const [availableRooms, setAvailableRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [guests, setGuests] = useState([])
  const [guestModalOpen, setGuestModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setStayRows([])
    setStayGrandTotal(0)
    setHotelUnitId('')
    setAvailableRooms([])
    setGuests(Array.isArray(initialGuests) ? [...initialGuests] : [])
  }, [open, initialGuests, room?.id])

  const stayLine = stayRows[0] ?? null
  const reservationId = Number(booking?.reservationId) || Number(booking?.raw?.reservationId) || 0
  const hotelId = Number(booking?.raw?.hotelId) || 0
  const unitNameId = Number(stayLine?.unitType) || 0

  useEffect(() => {
    if (!open || !stayLine || !reservationId || !unitNameId) {
      setAvailableRooms([])
      return
    }

    let ignore = false
    setLoadingRooms(true)

    getAvailableRoomsForReservationUnit({
      reservationId,
      hotelId,
      id: unitNameId,
      fromDate: stayLine.arrivalDate,
      toDate: stayLine.departureDate,
    }).then((result) => {
      if (ignore) return
      if (!result.success) {
        setAvailableRooms([])
        toast.error(result.error ?? t('allocation.checkInPage.availableRoomsLoadFailed'))
      } else {
        setAvailableRooms(result.rooms ?? [])
      }
      setLoadingRooms(false)
    })

    return () => {
      ignore = true
    }
  }, [open, stayLine, reservationId, hotelId, unitNameId, t])

  if (!open || !room) return null

  const roomLabel = isArabic ? room.typeAr : room.typeEn
  const expectedGuests = stayLine
    ? (Number(stayLine.adults) || 0) + (Number(stayLine.children) || 0)
    : Number(room.adults) || 0

  const handleConfirm = async () => {
    if (!stayLine) {
      toast.error(t('roomOperations.changeRoom.stayRequired'))
      return
    }
    if (!hotelUnitId) {
      toast.error(t('allocation.checkInPage.roomNumberPlaceholder'))
      return
    }
    if (!guests.length || guests.length !== expectedGuests) {
      toast.error(
        isArabic
          ? `عدد النزلاء يجب أن يساوي ${expectedGuests}`
          : `Guest count must equal ${expectedGuests}`
      )
      return
    }

    const selectedRoom = availableRooms.find((r) => String(r.id) === String(hotelUnitId))
    const unitPayload = mapStayRowToUnitAssignmentPayload(stayLine, hotelUnitId, selectedRoom)

    setSaving(true)
    try {
      const result = await performRoomChange({
        unitAssignmentId: booking.id,
        closedUnitAssignmentUnitId: room.id,
        closedFromDate: room.fromDate,
        closedUnitPricePerNight: room.unitPricePerNight,
        assignmentUnits: booking?.raw?.unitAssignmentUnits ?? [],
        newUnit: unitPayload,
        persons: guests,
      })

      if (!result?.success) {
        toast.error(result?.errorMessage ?? t('roomOperations.changeRoom.failed'))
        return
      }

      toast.success(t('roomOperations.changeRoom.success'))
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err?.message ?? t('roomOperations.changeRoom.failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label={t('roomOperations.changeRoom.close')}
      />
      <div className="relative z-10 flex max-h-[min(94vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#dce3ee] bg-white px-5 py-4">
          <div>
            <h2 className="m-0 text-lg font-bold text-[#111827]">
              {t('roomOperations.changeRoom.title', { room: roomLabel })}
            </h2>
            <p className="m-0 mt-1 text-sm text-[#6b7280]">
              {t('roomOperations.changeRoom.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#eef2ff]"
            aria-label={t('roomOperations.changeRoom.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <NewBookingStayStep
            stayRows={stayRows}
            onStayRowsChange={setStayRows}
            onGrandTotalChange={setStayGrandTotal}
            fixedArrivalDate={todayIso}
            fixedDepartureDate={originalDeparture}
            maxRows={1}
            singleUnitMode
            initialDraft={{
              adults: Number(room.adults) || 1,
              children: Number(room.children) || 0,
              serviceId: String(room.unitAddFeatureId || ''),
            }}
          />

          {stayLine ? (
            <div className={panelClass}>
              <label className="mb-2 block text-sm font-semibold text-[#111827]">
                {t('allocation.checkInPage.roomNumber')}
                <span className="text-[#dc2626]"> *</span>
              </label>
              <select
                value={hotelUnitId}
                onChange={(e) => setHotelUnitId(e.target.value)}
                disabled={loadingRooms || !availableRooms.length}
                className="w-full appearance-none rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-60"
              >
                <option value="">
                  {loadingRooms
                    ? t('allocation.checkInPage.loadingAvailableRooms')
                    : t('allocation.checkInPage.roomNumberPlaceholder')}
                </option>
                {availableRooms.map((availableRoom) => (
                  <option key={availableRoom.id} value={availableRoom.id}>
                    {availableRoom.unitNum}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {stayLine ? (
            <div className={panelClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="m-0 text-sm font-semibold text-[#111827]">
                    {t('allocation.checkInPage.guestData')}
                  </p>
                  <p className="m-0 mt-1 text-xs text-[#6b7280]">
                    {t('roomOperations.changeRoom.guestsHint', {
                      count: guests.length,
                      expected: expectedGuests,
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGuestModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary"
                >
                  <User className="h-4 w-4" />
                  {t('allocation.checkInPage.enterGuestData')}
                </button>
              </div>
            </div>
          ) : null}

          {stayGrandTotal > 0 ? (
            <p className="m-0 text-end text-sm font-medium text-[#059669]">
              {t('roomOperations.changeRoom.newLineTotal', {
                amount: `${stayGrandTotal.toLocaleString()} ${t('newBooking.stay.currency')}`,
              })}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-[#dce3ee] bg-white px-5 py-4">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {saving ? t('roomOperations.searching') : t('roomOperations.changeRoom.confirm')}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-sm font-medium text-[#dc2626] hover:text-[#b91c1c]"
          >
            {t('allocation.checkInPage.cancel')}
          </button>
        </div>
      </div>

      <CheckInGuestDataModal
        open={guestModalOpen}
        roomLabel={roomLabel}
        initialGuests={guests}
        isArabic={isArabic}
        onClose={() => setGuestModalOpen(false)}
        onSave={(list) => {
          setGuests(list)
          setGuestModalOpen(false)
        }}
      />
    </div>
  )
}

export default ChangeRoomModal
