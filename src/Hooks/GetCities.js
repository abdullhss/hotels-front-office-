import { useEffect, useState } from 'react'
import { DoTransaction, executeProcedure } from '../services/apiServices'

const GET_CITIES_PROCEDURE = 'EtvTP9aYvLrqxr2EeWFhrA=='
const CITY_TABLE_NAME = '0MomPyA4q+4ZMI8avKbfUg=='
const CITY_COLUMNS_NAMES = 'Id#CityNameA#CityNameE#Country_id#imported'

export const saveCity = async ({
  id = 0,
  cityNameA = '',
  cityNameE = '',
  countryId = 0,
  imported = false,
  wantedAction = 0,
}) => {
  const normalizedId = Number(id) || 0
  const normalizedCountryId = Number(countryId) || 0
  const normalizedImported = imported === true || imported === 'true' || imported === 'True'
  const importedValue = normalizedImported ? 'True' : 'False'
  const columnsValues = `${normalizedId}#${cityNameA.trim()}#${cityNameE
    .trim()
    .toUpperCase()}#${normalizedCountryId}#${importedValue}`

  return DoTransaction(CITY_TABLE_NAME, columnsValues, wantedAction, CITY_COLUMNS_NAMES)
}

export const deleteCity = async (id) => {
  const normalizedId = Number(id) || 0
  if (!normalizedId) {
    return { success: false, errorMessage: 'Invalid city id' }
  }

  return DoTransaction(CITY_TABLE_NAME, `${normalizedId}`, 2, 'Id')
}

const useCities = (
  id = -1,
  countryId = -1,
  value = '',
  startNum = 1,
  count = 10
) => {
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const getCities = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = `${id}#${countryId}#${value}#${startNum}#${count}`
        const response = await executeProcedure(GET_CITIES_PROCEDURE, params)
        console.log(response);
        
        const payload = response?.decrypted ?? {}
        const parsedCities = payload.CityData ? JSON.parse(payload.CityData) : []
        const parsedTotal = Number(payload.CityCount ?? 0)

        setCities(parsedCities)
        setTotalCount(parsedTotal)
      } catch (err) {
        setError(err)
        setCities([])
        setTotalCount(0)
      } finally {
        setLoading(false)
      }
    }

    getCities()
  }, [id, countryId, value, startNum, count])

  return { cities, totalCount, loading, error }
}

export default useCities
