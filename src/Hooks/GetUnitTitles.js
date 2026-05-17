import { useEffect, useState } from 'react'
import { DoTransaction, executeProcedure } from '../services/apiServices'

const GET_UNIT_NAMES_PROCEDURE = 'DOT2sMVxwbgjUdxf6DFH4g=='
const UNIT_TITLE_TABLE_NAME = 'jGnqTa5IYAJP4AN9vtMLQg=='
const UNIT_TITLE_COLUMNS_NAMES = 'Id#UnitNameA#UnitNameE#imported'

export const saveUnitTitle = async ({
  id = 0,
  unitNameA = '',
  unitNameE = '',
  imported = false,
  wantedAction = 0,
}) => {
  const normalizedId = Number(id) || 0
  const normalizedImported = imported === true || imported === 'true' || imported === 'True'
  const importedValue = normalizedImported ? 'True' : 'False'
  const columnsValues = `${normalizedId}#${unitNameA.trim()}#${unitNameE.trim().toUpperCase()}#${importedValue}`

  return DoTransaction(UNIT_TITLE_TABLE_NAME, columnsValues, wantedAction, UNIT_TITLE_COLUMNS_NAMES)
}

export const deleteUnitTitle = async (id) => {
  const normalizedId = Number(id) || 0
  if (!normalizedId) {
    return { success: false, errorMessage: 'Invalid unit title id' }
  }
  return DoTransaction(UNIT_TITLE_TABLE_NAME, `${normalizedId}`, 2, 'Id')
}

const useUnitTitles = (id = -1, value = '', startNum = 1, count = 2000) => {
  const [unitTitles, setUnitTitles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const getUnitTitles = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = `${id}#${value}#${startNum}#${count}`
        const response = await executeProcedure(GET_UNIT_NAMES_PROCEDURE, params)
        console.log(response);
        const payload = response?.decrypted ?? {}
        let parsedUnitTitles = []
        try {
          const raw = payload.UnitNameData
          if (raw) {
            parsedUnitTitles = typeof raw === 'string' ? JSON.parse(raw) : raw
          }
        } catch {
          parsedUnitTitles = []
        }
        if (!Array.isArray(parsedUnitTitles)) {
          parsedUnitTitles = []
        }

        const parsedTotal = Number(
          payload.UnitNameCount ?? 0
        )

        setUnitTitles(parsedUnitTitles)
        setTotalCount(parsedTotal)
      } catch (err) {
        setError(err)
        setUnitTitles([])
        setTotalCount(0)
      } finally {
        setLoading(false)
      }
    }

    getUnitTitles()
  }, [id, value, startNum, count])

  return { unitTitles, totalCount, loading, error }
}

export default useUnitTitles
