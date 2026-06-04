import { useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, LogOut, User, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import CheckInGuestDataModal from './CheckInGuestDataModal.jsx'
import RoomOperationsGuestsModal from '../../room-operations/components/RoomOperationsGuestsModal.jsx'
import { getAvailableRoomsForReservationUnit } from '../../../Hooks/GetReservations.js'

function CheckInRoomsTable({
  booking,
  isArabic,
  reservationId,
  hotelId,
  onRowsDataChange,
  initialRoomNumbers = null,
  initialRoomGuests = null,
  mode = 'allocation',
  onRoomCheckout,
  onRoomChange,
  readOnly = false,
}) {
  const isRoomOperations = mode === 'room-operations'
  const { t } = useTranslation()
  const [roomNumbers, setRoomNumbers] = useState(() => {
    const defaults = Object.fromEntries(booking.rooms.map((room) => [room.id, '']))
    if (!initialRoomNumbers) return defaults
    return { ...defaults, ...initialRoomNumbers }
  })
  const [guestModalRoom, setGuestModalRoom] = useState(null)
  const [viewGuestsRoom, setViewGuestsRoom] = useState(null)
  const [checkoutLoadingRoomId, setCheckoutLoadingRoomId] = useState(null)
  const [roomGuests, setRoomGuests] = useState(() => initialRoomGuests ?? {})
  const [availableRoomsByRow, setAvailableRoomsByRow] = useState({})
  const [loadingRows, setLoadingRows] = useState({})

  const roomRows = useMemo(() => booking.rooms ?? [], [booking.rooms])

  useEffect(() => {
    if (isRoomOperations) return undefined

    let ignore = false

    const loadRooms = async () => {
      const nextRows = {}
      const nextLoading = {}

      roomRows.forEach((room) => {
        nextRows[room.id] = []
        nextLoading[room.id] = false
      })

      setAvailableRoomsByRow(nextRows)
      setLoadingRows(nextLoading)

      await Promise.all(
        roomRows.map(async (room) => {
          const id = Number(room.id) || 0
          if (!id) return

          const preAssignedId = Number(room.hotelUnitId) || 0
          if (preAssignedId > 0) {
            if (!ignore) {
              setAvailableRoomsByRow((prev) => ({
                ...prev,
                [room.id]: [
                  {
                    id: preAssignedId,
                    unitNum: room.assignedUnitLabel || String(preAssignedId),
                    unitAddFeatureId: Number(room.unitAddFeatureId) || 0,
                    unitPricePerNight: 0,
                  },
                ],
              }))
              setLoadingRows((prev) => ({ ...prev, [room.id]: false }))
            }
            return
          }

          if (!ignore) {
            setLoadingRows((prev) => ({ ...prev, [room.id]: true }))
          }

          const result = await getAvailableRoomsForReservationUnit({
            reservationId,
            hotelId,
            id,
            fromDate: room.fromDate,
            toDate: room.toDate,
          })
          if (ignore) return

          if (!result.success) {
            setAvailableRoomsByRow((prev) => ({ ...prev, [room.id]: [] }))
            setLoadingRows((prev) => ({ ...prev, [room.id]: false }))
            toast.error(result.error ?? t('allocation.checkInPage.availableRoomsLoadFailed'))
            return
          }

          let rooms = result.rooms ?? []
          const assignedId = Number(room.hotelUnitId) || 0
          if (assignedId > 0 && !rooms.some((r) => Number(r.id) === assignedId)) {
            rooms = [
              {
                id: assignedId,
                unitNum: room.assignedUnitLabel || String(assignedId),
                unitAddFeatureId: Number(room.unitAddFeatureId) || 0,
                unitPricePerNight: 0,
              },
              ...rooms,
            ]
          }

          setAvailableRoomsByRow((prev) => ({ ...prev, [room.id]: rooms }))
          setLoadingRows((prev) => ({ ...prev, [room.id]: false }))
        })
      )
    }

    loadRooms()

    return () => {
      ignore = true
    }
  }, [roomRows, reservationId, hotelId, t, isRoomOperations])

  useEffect(() => {
    if (!initialRoomNumbers) return
    setRoomNumbers((prev) => ({ ...prev, ...initialRoomNumbers }))
  }, [booking.id, initialRoomNumbers])

  useEffect(() => {
    if (!initialRoomGuests) return
    setRoomGuests(initialRoomGuests)
  }, [booking.id, initialRoomGuests])

  useEffect(() => {
    if (typeof onRowsDataChange !== 'function') return
    const payload = roomRows.map((room) => {
      const selectedHotelUnitId = Number(roomNumbers[room.id]) || 0
      const selectedRoom = (availableRoomsByRow[room.id] ?? []).find(
        (r) => Number(r.id) === selectedHotelUnitId
      )
      return {
        roomId: room.id,
        unitAssignmentUnit: {
          hotelUnitId: selectedHotelUnitId,
          unitAddFeatureId:
            Number(selectedRoom?.unitAddFeatureId) || Number(room.unitAddFeatureId) || 0,
          personsCountPerUnit: (Number(room.adults) || 0) + (Number(room.children) || 0),
          fromDate: room.fromDate,
          toDate: room.toDate,
          unitPricePerNight: Number(selectedRoom?.unitPricePerNight) || 0,
          totalNightsCount: Number(room.nights) || 0,
          totalPricce:
            (Number(selectedRoom?.unitPricePerNight) || 0) * (Number(room.nights) || 0),
        },
        persons: roomGuests[room.id] ?? [],
      }
    })
    onRowsDataChange(payload)
  }, [roomRows, roomNumbers, availableRoomsByRow, roomGuests, onRowsDataChange])

  const roomsSummaryLabel = isArabic
    ? `${booking.totalRooms} غرف إجمالي`
    : `${booking.totalRooms} rooms total`
  const adultsSummaryLabel = t('allocation.checkInPage.guestsAdultsSummary', {
    count: booking.adults,
  })
  const childrenSummaryLabel = t('allocation.checkInPage.guestsChildrenSummary', {
    count: booking.children,
  })

  const handleCheckoutRoom = async (room) => {
    if (typeof onRoomCheckout !== 'function') {
      toast.info(t('roomOperations.roomsTable.checkoutComingSoon'))
      return
    }
    setCheckoutLoadingRoomId(room.id)
    try {
      await onRoomCheckout(room)
    } finally {
      setCheckoutLoadingRoomId(null)
    }
  }

  const handleChangeRoom = (room) => {
    if (typeof onRoomChange === 'function') {
      onRoomChange(room)
      return
    }
    toast.info(t('roomOperations.roomsTable.changeRoomComingSoon'))
  }

  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="m-0 text-sm font-semibold text-[#111827]">
          {t('allocation.checkInPage.roomsTable')}
        </h3>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex rounded-lg bg-[#eef0ff] px-3 py-1 text-xs font-medium text-brand-primary">
            {roomsSummaryLabel}
          </span>
          <span className="inline-flex rounded-lg bg-[#f1f5f9] px-3 py-1 text-xs font-medium text-[#475467]">
            {adultsSummaryLabel}
          </span>
          <span className="inline-flex rounded-lg bg-[#f1f5f9] px-3 py-1 text-xs font-medium text-[#475467]">
            {childrenSummaryLabel}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#e8edf5] text-[#6b7280]">
              <th className="px-3 py-3 text-start font-medium">
                {t('allocation.checkInPage.roomType')}
              </th>
              <th className="px-3 py-3 text-start font-medium">
                {t('allocation.checkInPage.adults')}
              </th>
              <th className="px-3 py-3 text-start font-medium">
                {t('allocation.checkInPage.children')}
              </th>
              <th className="px-3 py-3 text-start font-medium">
                {t('allocation.checkInPage.services')}
              </th>
              <th className="px-3 py-3 text-start font-medium">
                {t('allocation.checkInPage.fromDate')}
              </th>
              <th className="px-3 py-3 text-start font-medium">
                {t('allocation.checkInPage.toDate')}
              </th>
              <th className="px-3 py-3 text-start font-medium">
                {t('allocation.checkInPage.nights')}
              </th>
              <th className="px-3 py-3 text-start font-medium">
                {t('allocation.checkInPage.price')}
              </th>
              {isRoomOperations ? (
                <>
                  <th className="px-3 py-3 text-start font-medium">
                    {t('allocation.checkInPage.roomNumber')}
                  </th>
                  <th className="px-3 py-3 text-start font-medium">
                    {t('roomOperations.roomsTable.actions')}
                  </th>
                </>
              ) : (
                <>
                  <th className="px-3 py-3 text-start font-medium">
                    {t('allocation.checkInPage.roomNumber')}
                  </th>
                  <th className="px-3 py-3 text-start font-medium">
                    {t('allocation.checkInPage.guestData')}
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {roomRows.map((room) => (
              <tr key={room.id} className="border-b border-[#f1f5f9]">
                <td className="px-3 py-4 font-medium text-[#111827]">
                  {isArabic ? room.typeAr : room.typeEn}
                </td>
                <td className="px-3 py-4 text-[#374151] tabular-nums">{room.adults}</td>
                <td className="px-3 py-4 text-[#374151] tabular-nums">{room.children}</td>
                <td className="px-3 py-4 text-[#374151]">
                  {isArabic
                    ? room.featureAr && room.featureAr !== '—'
                      ? room.featureAr
                      : t('allocation.checkInPage.services')
                    : room.featureEn && room.featureEn !== '—'
                      ? room.featureEn
                      : t('allocation.checkInPage.services')}
                </td>
                <td className="px-3 py-4 text-[#374151]" dir="ltr">
                  {room.fromDate}
                </td>
                <td className="px-3 py-4 text-[#374151]" dir="ltr">
                  {room.toDate}
                </td>
                <td className="px-3 py-4 text-[#374151]">
                  {isArabic ? room.nightsAr : room.nightsEn}
                </td>
                <td className="px-3 py-4 font-semibold text-[#111827]">
                  {isArabic ? room.priceAr : room.priceEn}
                </td>
                {isRoomOperations ? (
                  <>
                    <td className="px-3 py-4 font-semibold text-[#111827]" dir="ltr">
                      {room.unitNum || '—'}
                    </td>
                    <td className="px-3 py-4">
                    <div className="flex min-w-[220px] flex-col gap-2">
                      {readOnly ? (
                        <button
                          type="button"
                          onClick={() => setViewGuestsRoom(room)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-medium text-[#374151]"
                        >
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          {t('roomOperations.roomsTable.viewGuests')}
                        </button>
                      ) : (
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleChangeRoom(room)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-medium text-[#374151] transition-colors hover:border-brand-primary hover:text-brand-primary"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
                            {t('roomOperations.roomsTable.changeRoom')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCheckoutRoom(room)}
                            disabled={checkoutLoadingRoomId === room.id}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs font-medium text-[#dc2626] transition-colors hover:bg-[#fee2e2] disabled:opacity-60"
                          >
                            <LogOut className="h-3.5 w-3.5 shrink-0" />
                            {t('roomOperations.roomsTable.checkoutRoom')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewGuestsRoom(room)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-primary px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-primary-hover"
                          >
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            {t('roomOperations.roomsTable.viewGuests')}
                          </button>
                        </div>
                      )}
                    </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-4">
                      <select
                        value={roomNumbers[room.id] ?? ''}
                        onChange={(e) =>
                          setRoomNumbers((prev) => ({ ...prev, [room.id]: e.target.value }))
                        }
                        disabled={loadingRows[room.id] || !availableRoomsByRow[room.id]?.length}
                        className="w-full min-w-[140px] appearance-none rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#374151] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-60"
                      >
                        <option value="">
                          {loadingRows[room.id]
                            ? t('allocation.checkInPage.loadingAvailableRooms')
                            : t('allocation.checkInPage.roomNumberPlaceholder')}
                        </option>
                        {(availableRoomsByRow[room.id] ?? []).map((availableRoom) => (
                          <option key={availableRoom.id} value={availableRoom.id}>
                            {availableRoom.unitNum}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-4">
                      <button
                        type="button"
                        onClick={() => setGuestModalRoom(room)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary"
                      >
                        <User className="h-4 w-4" />
                        {t('allocation.checkInPage.enterGuestData')}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} className="px-3 py-4 text-sm font-semibold text-[#111827]">
                {t('allocation.checkInPage.total')}
              </td>
              <td className="px-3 py-4 text-sm font-semibold text-[#d97706]">
                {isArabic ? booking.totalNightsAr : booking.totalNightsEn}
              </td>
              <td className="px-3 py-4 text-sm font-semibold text-[#059669]">
                {isArabic ? booking.totalRoomsPriceAr : booking.totalRoomsPriceEn}
              </td>
              <td colSpan={isRoomOperations ? 2 : 2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {!isRoomOperations ? (
        <CheckInGuestDataModal
          open={Boolean(guestModalRoom)}
          roomLabel={
            guestModalRoom
              ? isArabic
                ? guestModalRoom.typeAr
                : guestModalRoom.typeEn
              : ''
          }
          initialGuests={guestModalRoom ? roomGuests[guestModalRoom.id] : []}
          isArabic={isArabic}
          onClose={() => setGuestModalRoom(null)}
          onSave={(guests) => {
            if (!guestModalRoom) return
            setRoomGuests((prev) => ({ ...prev, [guestModalRoom.id]: guests }))
          }}
        />
      ) : (
        <RoomOperationsGuestsModal
          open={Boolean(viewGuestsRoom)}
          roomLabel={
            viewGuestsRoom
              ? isArabic
                ? viewGuestsRoom.typeAr
                : viewGuestsRoom.typeEn
              : ''
          }
          guests={viewGuestsRoom ? roomGuests[viewGuestsRoom.id] : []}
          isArabic={isArabic}
          onClose={() => setViewGuestsRoom(null)}
        />
      )}
    </div>
  )
}

export default CheckInRoomsTable
