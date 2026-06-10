import {
  computeNightsCount,
  computeStayLineTotal,
  isArrivalBeforeDeparture,
  toInputDateValue,
} from '../new-booking/dateUtils.js'

export function selectionKey(unitNameId, unitAddFeatureId) {
  return `${Number(unitNameId) || 0}:${Number(unitAddFeatureId) || 0}`
}

export function getSelectedUnitsCount(list, unitNameId, unitAddFeatureId) {
  const key = selectionKey(unitNameId, unitAddFeatureId)
  const existing = list.find(
    (item) => selectionKey(item.unitNameId, item.unitAddFeatureId) === key
  )
  return Math.max(0, Number(existing?.unitsCount) || 0)
}

export function getRemainingAvailableCount(availableRoomsCount, alreadySelected = 0) {
  const max = Math.max(0, Number(availableRoomsCount) || 0)
  const selected = Math.max(0, Number(alreadySelected) || 0)
  return Math.max(0, max - selected)
}

export function mergeUnitSelection(list, nextItem) {
  const key = selectionKey(nextItem.unitNameId, nextItem.unitAddFeatureId)
  const maxAvailable = Math.max(0, Number(nextItem.availableRoomsCount) || 0)
  const addCount = Math.max(1, Number(nextItem.unitsCount) || 1)
  const existingIdx = list.findIndex(
    (item) => selectionKey(item.unitNameId, item.unitAddFeatureId) === key
  )

  if (existingIdx < 0) {
    const unitsCount = maxAvailable > 0 ? Math.min(addCount, maxAvailable) : addCount
    return [...list, { ...nextItem, unitsCount: Math.max(1, unitsCount) }]
  }

  return list.map((item, idx) => {
    if (idx !== existingIdx) return item

    const currentCount = Math.max(0, Number(item.unitsCount) || 0)
    const nextTotal = maxAvailable > 0 ? Math.min(maxAvailable, currentCount + addCount) : currentCount + addCount

    return {
      ...item,
      ...nextItem,
      unitsCount: Math.max(1, nextTotal),
    }
  })
}

export function validateBookingDraft(draft, isArabic) {
  const fromDate = toInputDateValue(draft?.fromDate)
  const toDate = toInputDateValue(draft?.toDate)
  const adults = Number(draft?.adults) || 0

  if (!fromDate) {
    return { valid: false, error: isArabic ? 'تاريخ الوصول مطلوب' : 'From date is required' }
  }
  if (!toDate) {
    return { valid: false, error: isArabic ? 'تاريخ المغادرة مطلوب' : 'To date is required' }
  }
  if (!isArrivalBeforeDeparture(fromDate, toDate)) {
    return {
      valid: false,
      error: isArabic
        ? 'تاريخ الوصول يجب أن يكون قبل تاريخ المغادرة'
        : 'From date must be before to date',
    }
  }
  if (adults < 1) {
    return { valid: false, error: isArabic ? 'عدد البالغين مطلوب' : 'Adults count is required' }
  }

  return { valid: true, fromDate, toDate, adults, children: Math.max(0, Number(draft?.children) || 0) }
}

export function buildStayRowsFromMonthlyReport({ draft, selectedUnits = [], unitTitles = [] }) {
  const fromDate = toInputDateValue(draft?.fromDate)
  const toDate = toInputDateValue(draft?.toDate)
  const nights = computeNightsCount(fromDate, toDate)
  const adults = Math.max(1, Number(draft?.adults) || 1)
  const children = Math.max(0, Number(draft?.children) || 0)

  return selectedUnits.map((sel, index) => {
    const unitType = String(sel.unitNameId ?? '')
    const unitTitle = unitTitles.find((u) => String(u.Id ?? u.id) === unitType)
    const unitBasePrice = Number(unitTitle?.UnitPricePerNight ?? unitTitle?.unitPricePerNight ?? 0) || 0
    const servicePrice = Number(sel.featurePrice ?? 0) || 0
    const nightlyCombined = unitBasePrice + servicePrice
    const unitsCount = Math.max(1, Number(sel.unitsCount) || 1)
    const total = computeStayLineTotal({
      unitPricePerNight: nightlyCombined,
      servicePrice: 0,
      nights,
      unitsCount,
    })

    return {
      id: `monthly-${sel.unitNameId}-${sel.unitAddFeatureId}-${index}`,
      unitType,
      unitsCount,
      unitPrice: nightlyCombined,
      unitBasePrice,
      arrivalDate: fromDate,
      departureDate: toDate,
      nightsCount: nights,
      serviceId: String(sel.unitAddFeatureId ?? ''),
      servicePrice,
      servicesLabelAr: sel.featureNameAr || '—',
      servicesLabelEn: sel.featureNameEn || sel.featureNameAr || '—',
      adults,
      children,
      notes: '',
      total,
    }
  })
}

export function buildNewBookingNavigationState({ draft, selectedUnits, unitTitles = [] }) {
  const normalizedDraft = {
    fromDate: toInputDateValue(draft.fromDate),
    toDate: toInputDateValue(draft.toDate),
    adults: Math.max(1, Number(draft.adults) || 1),
    children: Math.max(0, Number(draft.children) || 0),
  }
  const normalizedUnits = selectedUnits.map((item) => ({ ...item }))
  const stayRows =
    normalizedUnits.length > 0
      ? buildStayRowsFromMonthlyReport({
          draft: normalizedDraft,
          selectedUnits: normalizedUnits,
          unitTitles,
        })
      : []

  return {
    fromMonthlyReport: true,
    draft: normalizedDraft,
    selectedUnits: normalizedUnits,
    stayRows,
  }
}
