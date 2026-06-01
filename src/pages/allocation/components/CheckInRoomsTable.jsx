import { useState } from 'react'
import { User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function CheckInRoomsTable({ booking, isArabic }) {
  const { t } = useTranslation()
  const [roomNumbers, setRoomNumbers] = useState(() =>
    Object.fromEntries(booking.rooms.map((room) => [room.id, '']))
  )

  const roomsSummaryLabel = isArabic
    ? `${booking.totalRooms} غرف إجمالي`
    : `${booking.totalRooms} rooms total`
  const adultsSummaryLabel = t('allocation.checkInPage.guestsAdultsSummary', {
    count: booking.adults,
  })
  const childrenSummaryLabel = t('allocation.checkInPage.guestsChildrenSummary', {
    count: booking.children,
  })

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
              <th className="px-3 py-3 text-start font-medium">
                {t('allocation.checkInPage.roomNumber')}
              </th>
              <th className="px-3 py-3 text-start font-medium">
                {t('allocation.checkInPage.guestData')}
              </th>
            </tr>
          </thead>
          <tbody>
            {booking.rooms.map((room) => (
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
                <td className="px-3 py-4">
                  <input
                    type="text"
                    value={roomNumbers[room.id]}
                    onChange={(e) =>
                      setRoomNumbers((prev) => ({ ...prev, [room.id]: e.target.value }))
                    }
                    placeholder={t('allocation.checkInPage.roomNumberPlaceholder')}
                    className="w-full min-w-[120px] rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#374151] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </td>
                <td className="px-3 py-4">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary"
                  >
                    <User className="h-4 w-4" />
                    {t('allocation.checkInPage.enterGuestData')}
                  </button>
                </td>
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
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default CheckInRoomsTable
