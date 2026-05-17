import { useEffect, useState } from 'react'
import { DoTransaction, executeProcedure } from '../services/apiServices'

const GET_EXTRA_FEATURES_PROCEDURE = 'VVVnlyM1kAnzZMTaWHs7m5ulHPHveiTXJHvow1iFCO8='
const EXTRA_FEATURE_TABLE_NAME = 'ROixian4PsBoTIQ1d+UXNQ=='
const EXTRA_FEATURE_COLUMNS_NAMES = 'Id#FreatureNameA#FreatureNameE#FeaturePrice#imported'

export const saveExtraFeature = async ({
  id = 0,
  featureNameA = '',
  featureNameE = '',
  featurePrice = 0,
  imported = false,
  wantedAction = 0,
}) => {
  const normalizedId = Number(id) || 0
  const normalizedPrice = Number(featurePrice)
  const safePrice = Number.isFinite(normalizedPrice) && normalizedPrice >= 0 ? normalizedPrice : 0
  const normalizedImported = imported === true || imported === 'true' || imported === 'True'
  const importedValue = normalizedImported ? 'True' : 'False'
  const columnsValues = `${normalizedId}#${featureNameA.trim()}#${featureNameE
    .trim()
    .toUpperCase()}#${safePrice}#${importedValue}`

  return DoTransaction(
    EXTRA_FEATURE_TABLE_NAME,
    columnsValues,
    wantedAction,
    EXTRA_FEATURE_COLUMNS_NAMES
  )
}

export const deleteExtraFeature = async (id) => {
  const normalizedId = Number(id) || 0
  if (!normalizedId) {
    return { success: false, errorMessage: 'Invalid extra feature id' }
  }
  return DoTransaction(EXTRA_FEATURE_TABLE_NAME, `${normalizedId}`, 2, 'Id')
}

const useExtraFeatures = (id = -1, value = '', startNum = 1, count = 2000) => {
  const [extraFeatures, setExtraFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const getExtraFeatures = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = `${id}#${value}#${startNum}#${count}`
        const response = await executeProcedure(GET_EXTRA_FEATURES_PROCEDURE, params)
        console.log(response);
        
        const payload = response?.decrypted ?? {}
        let parsedFeatures = []
        try {
          const raw = payload.UnitAddFeatureData
          if (raw) {
            parsedFeatures = typeof raw === 'string' ? JSON.parse(raw) : raw
          }
        } catch {
          parsedFeatures = []
        }
        if (!Array.isArray(parsedFeatures)) {
          parsedFeatures = []
        }

        const parsedTotal = Number(
          payload.UnitAddFeatureCount ?? 0
        )

        setExtraFeatures(parsedFeatures)
        setTotalCount(parsedTotal)
      } catch (err) {
        setError(err)
        setExtraFeatures([])
        setTotalCount(0)
      } finally {
        setLoading(false)
      }
    }

    getExtraFeatures()
  }, [id, value, startNum, count])

  return { extraFeatures, totalCount, loading, error }
}

export default useExtraFeatures
