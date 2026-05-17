import { useEffect, useState } from 'react'
import { DoTransaction, executeProcedure } from '../services/apiServices'

const GET_NATIONALITIES_PROCEDURE = 'eJjIV7ynzs/m0INIgnx6Dw=='
const NATIONALITY_TABLE_NAME = 'DITBo1zqaUFiIO/E6qF0kg=='
const NATIONALITY_COLUMNS_NAMES = 'Id#NationalityNameA#NationalityNameE#imported'

export const saveNationality = async ({
  id = 0,
  nationalityNameA = '',
  nationalityNameE = '',
  imported = false,
  wantedAction = 0,
}) => {
  const normalizedId = Number(id) || 0
  const normalizedImported = imported === true || imported === 'true' || imported === 'True'
  const importedValue = normalizedImported ? 'True' : 'False'
  const columnsValues = `${normalizedId}#${nationalityNameA.trim()}#${nationalityNameE
    .trim()
    .toUpperCase()}#${importedValue}`

  return DoTransaction(
    NATIONALITY_TABLE_NAME,
    columnsValues,
    wantedAction,
    NATIONALITY_COLUMNS_NAMES
  )
}

export const deleteNationality = async (id) => {
  const normalizedId = Number(id) || 0
  if (!normalizedId) {
    return { success: false, errorMessage: 'Invalid nationality id' }
  }
  return DoTransaction(NATIONALITY_TABLE_NAME, `${normalizedId}`, 2, 'Id')
}

const useNationalities = (id = -1, value = '', startNum = 1, count = 2000) => {
  const [nationalities, setNationalities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const getNationalities = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = `${id}#${value}#${startNum}#${count}`
        const response = await executeProcedure(GET_NATIONALITIES_PROCEDURE, params)
        console.log(response);
        
        const payload = response?.decrypted ?? {}
        const parsedNationalities = payload.NationalityData
          ? JSON.parse(payload.NationalityData)
          : []
        const parsedTotal = Number(payload.NationalityCount ?? 0)

        setNationalities(parsedNationalities)
        setTotalCount(parsedTotal)
      } catch (err) {
        setError(err)
        setNationalities([])
        setTotalCount(0)
      } finally {
        setLoading(false)
      }
    }

    getNationalities()
  }, [id, value, startNum, count])

  return { nationalities, totalCount, loading, error }
}

export default useNationalities
