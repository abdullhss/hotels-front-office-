import { useEffect, useState } from 'react'
import { DoTransaction, executeProcedure } from '../services/apiServices'

const GET_BOOKING_TYPES_PROCEDURE = 'vwoq8jF4ejiOYtATCC6G3ZXv5+/yyRIUKSwHIBa16TQ='
const BOOKING_TYPE_TABLE_NAME = 'iwU46md4fZgu50s2IIy29g=='
const BOOKING_TYPE_COLUMNS_NAMES = 'Id#TypeNameA#TypeNameE#imported'

export const saveBookingType = async ({
  id = 0,
  typeNameA = '',
  typeNameE = '',
  imported = false,
  wantedAction = 0,
}) => {
  const normalizedId = Number(id) || 0
  const normalizedImported = imported === true || imported === 'true' || imported === 'True'
  const importedValue = normalizedImported ? 'True' : 'False'
  const columnsValues = `${normalizedId}#${typeNameA.trim()}#${typeNameE
    .trim()
    .toUpperCase()}#${importedValue}`

  return DoTransaction(
    BOOKING_TYPE_TABLE_NAME,
    columnsValues,
    wantedAction,
    BOOKING_TYPE_COLUMNS_NAMES
  )
}

export const deleteBookingType = async (id) => {
  const normalizedId = Number(id) || 0
  if (!normalizedId) {
    return { success: false, errorMessage: 'Invalid booking type id' }
  }
  return DoTransaction(BOOKING_TYPE_TABLE_NAME, `${normalizedId}`, 2, 'Id')
}

const useBookingTypes = (id = -1, value = '', startNum = 1, count = 2000) => {
  const [bookingTypes, setBookingTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const getBookingTypes = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = `${id}#${value}#${startNum}#${count}`
        const response = await executeProcedure(GET_BOOKING_TYPES_PROCEDURE, params)
        console.log(response);
        
        const payload = response?.decrypted ?? {}
        let parsedBookingTypes = []
        try {
          const raw = payload.ReservationTypeData
          if (raw) {
            parsedBookingTypes = typeof raw === 'string' ? JSON.parse(raw) : raw
          }
        } catch {
          parsedBookingTypes = []
        }
        if (!Array.isArray(parsedBookingTypes)) {
          parsedBookingTypes = []
        }

        const parsedTotal = Number(
          payload.ReservationTypeCount ?? 0
        )

        setBookingTypes(parsedBookingTypes)
        setTotalCount(parsedTotal)
      } catch (err) {
        setError(err)
        setBookingTypes([])
        setTotalCount(0)
      } finally {
        setLoading(false)
      }
    }

    getBookingTypes()
  }, [id, value, startNum, count])

  return { bookingTypes, totalCount, loading, error }
}

export default useBookingTypes
