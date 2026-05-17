import { useEffect, useState } from 'react'
import { DoTransaction, executeProcedure } from '../services/apiServices'

const GET_UNIT_STATUSES_PROCEDURE = 'GVYRYYuIafxYGqVDOg974A=='
const UNIT_STATUS_TABLE_NAME = '4unBuiAHcK0KOH2QQGB9LQ=='
const UNIT_STATUS_COLUMNS_NAMES = 'Id#StatusNameA#StatusNameE#imported'

export const saveUnitStatus = async ({
  id = 0,
  statusNameA = '',
  statusNameE = '',
  imported = false,
  wantedAction = 0,
}) => {
  const normalizedId = Number(id) || 0
  const normalizedImported = imported === true || imported === 'true' || imported === 'True'
  const importedValue = normalizedImported ? 'True' : 'False'
  const columnsValues = `${normalizedId}#${statusNameA.trim()}#${statusNameE
    .trim()
    .toUpperCase()}#${importedValue}`

  return DoTransaction(
    UNIT_STATUS_TABLE_NAME,
    columnsValues,
    wantedAction,
    UNIT_STATUS_COLUMNS_NAMES
  )
}

export const deleteUnitStatus = async (id) => {
  const normalizedId = Number(id) || 0
  if (!normalizedId) {
    return { success: false, errorMessage: 'Invalid unit status id' }
  }
  return DoTransaction(UNIT_STATUS_TABLE_NAME, `${normalizedId}`, 2, 'Id')
}

const useUnitStatuses = (id = -1, value = '', startNum = 1, count = 2000) => {
  const [unitStatuses, setUnitStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const getUnitStatuses = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = `${id}#${value}#${startNum}#${count}`
        const response = await executeProcedure(GET_UNIT_STATUSES_PROCEDURE, params)
        console.log(response);
        
        const payload = response?.decrypted ?? {}
        let parsedUnitStatuses = []
        try {
          const raw = payload.UnitStatusData
          if (raw) {
            parsedUnitStatuses = typeof raw === 'string' ? JSON.parse(raw) : raw
          }
        } catch {
          parsedUnitStatuses = []
        }
        if (!Array.isArray(parsedUnitStatuses)) {
          parsedUnitStatuses = []
        }

        const parsedTotal = Number(
          payload.UnitStatusCount ?? 0
        )

        setUnitStatuses(parsedUnitStatuses)
        setTotalCount(parsedTotal)
      } catch (err) {
        setError(err)
        setUnitStatuses([])
        setTotalCount(0)
      } finally {
        setLoading(false)
      }
    }

    getUnitStatuses()
  }, [id, value, startNum, count])

  return { unitStatuses, totalCount, loading, error }
}

export default useUnitStatuses
