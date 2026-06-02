import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, Plus, Search } from 'lucide-react'
import {
  deleteUnitAssignmentHeader,
  saveUnitAssignmentRowMulti,
  saveUnitAssignmentHeader,
  mapReservationToCheckInBooking,
  resolveReservationForCheckIn,
} from '../../Hooks/GetReservations.js'
import { isDoTransactionSuccess } from '../../Hooks/GetAgents.js'
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
  const [savingAssignment, setSavingAssignment] = useState(false)
  const [savedAssignmentId, setSavedAssignmentId] = useState(0)
  const [savedAssignmentUnitIds, setSavedAssignmentUnitIds] = useState([])
  const [allocationRowsData, setAllocationRowsData] = useState([])

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

  const handleCompleteAllocation = async () => {
    if (!booking?.raw) {
      toast.error(isArabic ? 'لا توجد بيانات حجز للحفظ' : 'No booking data to save')
      return
    }

    const rows = Array.isArray(allocationRowsData) ? allocationRowsData : []
    if (!rows.length) {
      toast.error(isArabic ? 'لا توجد صفوف للتسكين' : 'No allocation rows to save')
      return
    }

    const invalidRoomRowIndex = rows.findIndex((r) => Number(r?.unitAssignmentUnit?.hotelUnitId) <= 0)
    if (invalidRoomRowIndex >= 0) {
      toast.error(
        isArabic
          ? `يرجى اختيار رقم الغرفة في الصف ${invalidRoomRowIndex + 1}`
          : `Please select room number for row ${invalidRoomRowIndex + 1}`
      )
      return
    }

    const selectedRoomIds = rows.map((r) => Number(r?.unitAssignmentUnit?.hotelUnitId) || 0)
    const uniqueRoomIds = new Set(selectedRoomIds)
    if (uniqueRoomIds.size !== selectedRoomIds.length) {
      toast.error(
        isArabic
          ? 'لا يمكن اختيار نفس رقم الغرفة في أكثر من صف'
          : 'The same room number cannot be selected in multiple rows'
      )
      return
    }

    const mismatchGuestRowIndex = rows.findIndex((r) => {
      const expected = Number(r?.unitAssignmentUnit?.personsCountPerUnit) || 0
      const actual = Array.isArray(r?.persons) ? r.persons.length : 0
      return expected !== actual
    })
    if (mismatchGuestRowIndex >= 0) {
      const row = rows[mismatchGuestRowIndex]
      const expected = Number(row?.unitAssignmentUnit?.personsCountPerUnit) || 0
      const actual = Array.isArray(row?.persons) ? row.persons.length : 0
      toast.error(
        isArabic
          ? `عدد بيانات النزلاء في الصف ${mismatchGuestRowIndex + 1} يجب أن يساوي ${expected} (الحالي ${actual})`
          : `Guest data count in row ${mismatchGuestRowIndex + 1} must equal ${expected} (current ${actual})`
      )
      return
    }

    setSavingAssignment(true)
    let headerIdForRollback = 0
    try {
      const raw = booking.raw
      const assignmentNumFromSearch = String(searchQuery ?? '')
        .trim()
        .replace(/^#+/, '')
      console.group('[Allocation][Save] Start')
      console.log('Reservation raw:', raw)
      console.log('Rows payload (validated):', rows)

      const headerPayload = {
        hotelId: Number(raw.hotelId) || 0,
        assignmentNum:
          assignmentNumFromSearch || String(booking?.reservationNum ?? raw.reservationNum ?? '').trim(),
        assignDate: new Date().toISOString().slice(0, 10),
        assignType: Number(raw.reservationTypeId) || 0,
        reservationId: Number(raw.id) || 0,
        reservationTypeId: Number(raw.reservationTypeId) || 0,
        agentId: Number(raw.agentId) || 0,
        customerId: Number(raw.customerId) || 0,
        fromDate: raw.fromDate,
        toDate: raw.toDate,
        personsCount: Number(raw.personsCount) || 0,
        adultsCount: Number(raw.adultsCount) || 0,
        childrenCount: Number(raw.childrenCount) || 0,
        roomsCount: Number(raw.roomsCount) || booking.rooms?.length || 0,
        totalReservationAmount: Number(raw.totalAmount) || 0,
        downPayment: Number(raw.downPayment) || 0,
        status: Number(raw.status) || 0,
        statusRemarks: raw.statusRemarks ?? '',
      }
      console.log('Header payload:', headerPayload)

      const result = await saveUnitAssignmentHeader({
        ...headerPayload,
      })
      console.log('Header response:', result)

      if (!isDoTransactionSuccess(result)) {
        toast.error(result?.errorMessage ?? (isArabic ? 'فشل حفظ التسكين' : 'Failed to save allocation'))
        return
      }

      const newId = Number(result.assignmentId) || 0
      headerIdForRollback = newId
      setSavedAssignmentId(newId)
      if (!newId) {
        toast.error(isArabic ? 'لم يتم إرجاع رقم التسكين' : 'Assignment id was not returned')
        return
      }

      const savedUnitIds = []
      for (const row of rows) {
        console.group('[Allocation][Save][Row]')
        console.log('Row payload:', row)
        console.log('UnitAssignment_Id:', newId)
        const rowRes = await saveUnitAssignmentRowMulti({
          unitAssignmentId: newId,
          unit: row.unitAssignmentUnit,
          persons: row.persons,
        })
        console.log('Row response:', rowRes)
        console.groupEnd()
        if (!isDoTransactionSuccess(rowRes)) {
          const rollbackRes = await deleteUnitAssignmentHeader(newId)
          console.log('Rollback header response:', rollbackRes)
          setSavedAssignmentId(0)
          setSavedAssignmentUnitIds([])
          toast.error(isArabic ? 'فشل حفظ التسكين وتم التراجع عن رأس التسكين' : 'Allocation save failed and header was rolled back')
          return
        }
        const unitId = Number(rowRes.unitAssignmentUnitId) || 0
        if (unitId > 0) savedUnitIds.push(unitId)
      }
      setSavedAssignmentUnitIds(savedUnitIds)

      toast.success(
        isArabic
          ? 'تم حفظ التسكين بالكامل'
          : 'Allocation saved successfully'
      )
    } catch (err) {
      console.error('[Allocation][Save] Error:', err)
      if (headerIdForRollback > 0) {
        const rollbackRes = await deleteUnitAssignmentHeader(headerIdForRollback)
        console.log('Rollback header response:', rollbackRes)
        setSavedAssignmentId(0)
        setSavedAssignmentUnitIds([])
      }
      toast.error(err?.message ?? (isArabic ? 'فشل حفظ التسكين' : 'Failed to save allocation'))
    } finally {
      console.groupEnd()
      setSavingAssignment(false)
    }
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
          <CheckInRoomsTable
            key={booking.id}
            booking={booking}
            isArabic={isArabic}
            reservationId={booking.id}
            hotelId={booking?.raw?.hotelId}
            onRowsDataChange={setAllocationRowsData}
          />

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleCompleteAllocation}
              disabled={savingAssignment}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover"
            >
              <Check className="h-4 w-4" />
              {savingAssignment
                ? t('allocation.searching')
                : t('allocation.checkInPage.completeAllocation')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/allocation')}
              className="text-sm font-medium text-[#dc2626] transition-colors hover:text-[#b91c1c]"
            >
              {t('allocation.checkInPage.cancel')}
            </button>
            {savedAssignmentId > 0 ? (
              <span className="rounded-lg bg-[#eef2ff] px-3 py-1 text-sm font-medium text-brand-primary">
                {isArabic ? `رقم التسكين: ${savedAssignmentId}` : `Assignment ID: ${savedAssignmentId}`}
              </span>
            ) : null}
            {savedAssignmentUnitIds.length > 0 ? (
              <span className="rounded-lg bg-[#ecfeff] px-3 py-1 text-sm font-medium text-[#0f766e]">
                {isArabic
                  ? `وحدات محفوظة: ${savedAssignmentUnitIds.join(', ')}`
                  : `Saved unit rows: ${savedAssignmentUnitIds.join(', ')}`}
              </span>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  )
}

export default AllocationCheckInPage
