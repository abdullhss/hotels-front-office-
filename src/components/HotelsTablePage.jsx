import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TablePage from './table/TablePage.jsx'

const CITY_AR = ['القاهرة', 'الإسكندرية', 'الأقصر', 'شرم الشيخ']
const CITY_EN = ['Cairo', 'Alexandria', 'Luxor', 'Sharm']

const ALL_ROWS = Array.from({ length: 37 }, (_, i) => ({
  id: i + 1,
  nameAr: `فندق ${i + 1}`,
  nameEn: `Hotel ${i + 1}`,
  cityAr: CITY_AR[i % 4],
  cityEn: CITY_EN[i % 4],
}))

function HotelsTablePage() {
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const [lastAction, setLastAction] = useState('')
  const [tableData, setTableData] = useState(() => ({
    rows: ALL_ROWS.slice(0, 10),
    total: ALL_ROWS.length,
  }))

  const rowLabel = useCallback((item) => (isArabic ? item.nameAr : item.nameEn), [isArabic])

  const fetchApi = useCallback((page, rowsPerPage) => {
    const start = (page - 1) * rowsPerPage
    const slice = ALL_ROWS.slice(start, start + rowsPerPage)
    setTableData({ rows: slice, total: ALL_ROWS.length })
  }, [])

  const actionsConfig = useMemo(
    () => [
      {
        label: isArabic ? 'عرض' : 'View',
        onClick: (item) => setLastAction(`${isArabic ? 'عرض' : 'View'}: ${rowLabel(item)}`),
      },
      {
        label: isArabic ? 'تعديل' : 'Edit',
        onClick: (item) => setLastAction(`${isArabic ? 'تعديل' : 'Edit'}: ${rowLabel(item)}`),
      },
    ],
    [isArabic, rowLabel]
  )

  const titledColumns = useMemo(
    () =>
      isArabic
        ? [
            { uid: 'id', name: 'المعرف' },
            { uid: 'name', name: 'الاسم', sortKey: 'nameAr' },
            { uid: 'city', name: 'المدينة', sortKey: 'cityAr' },
            { uid: 'actions', name: 'إجراءات' },
          ]
        : [
            { uid: 'id', name: 'ID' },
            { uid: 'name', name: 'Name', sortKey: 'nameEn' },
            { uid: 'city', name: 'City', sortKey: 'cityEn' },
            { uid: 'actions', name: 'Actions' },
          ],
    [isArabic]
  )

  const specialCells = useMemo(
    () => [
      {
        key: 'name',
        render: (_, item) => (isArabic ? item.nameAr : item.nameEn),
      },
      {
        key: 'city',
        render: (_, item) => (isArabic ? item.cityAr : item.cityEn),
      },
    ],
    [isArabic]
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {lastAction && (
        <p className="mb-4 text-sm text-gray-600" role="status">
          {lastAction}
        </p>
      )}
      <TablePage
        tableTitle={isArabic ? 'الفنادق' : 'Hotels'}
        columns={titledColumns}
        specialCells={specialCells}
        data={tableData.rows}
        total={tableData.total}
        fetchApi={fetchApi}
        actionsConfig={actionsConfig}
        hideSearch
        rowsPerPageDefault={10}
      />
    </div>
  )
}

export default HotelsTablePage
