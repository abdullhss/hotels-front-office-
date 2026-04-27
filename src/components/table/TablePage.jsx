import React from 'react'
import { useTranslation } from 'react-i18next'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table.jsx'
import { useTablePage } from './hooks/useTablePage.jsx'
import ActionsDropdown from './ActionsDropdown.jsx'
import { cn } from '../../lib/utils'
import logoImage from '../../assets/logo.png'

export const TableEmptyLogo = () => (
  <div className="flex flex-col items-center justify-center py-10">
    <div className="w-24 lg:w-48 h-24 lg:h-48 mb-4">
      <img src={logoImage} alt="Logo" className="w-full h-full object-contain" />
    </div>
  </div>
)

const panelClass =
  'min-w-0 max-w-full rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-sm sm:p-4'

/**
 * @param {Array} filters - Optional. Array of filter configs: { key: string, label?: string, allLabel?: string, options: { label, value }[], hide?: boolean, loading?: boolean }
 * @param {Object} exportAsExcel - Optional. { display?: boolean, loading?: boolean, onClick?: (params) => void, fetchAllData?: (filterState, searchValue) => Promise<{ data }> | Promise<any[]>, filename?: string }
 * @param {string} [searchPanelClassName] - When defined (including ""), wraps search/filters in a white panel; merged with base panel styles.
 * @param {string} [tablePanelClassName] - When defined (including ""), wraps table + pagination in a white panel.
 */
export default function TablePage({
  data = [],
  columns = [],
  specialCells = [],
  total = 0,
  fetchApi,
  isLoading = false,
  actionsConfig = [],
  onDoubleClick,
  onClick,
  specialRowClassName,
  rowsPerPageDefault = 10,
  isHeaderSticky = false,
  tableTitle,
  AddButtonProps,
  hidePagination = false,
  filters = [],
  hideSearch = true,
  exportAsExcel,
  emptyContent = null,
  searchPanelClassName,
  tablePanelClassName,
}) {
  const { t } = useTranslation()
  const {
    sortedItems,
    bottomContent,
    renderCell,
    sortDescriptor,
    setSortDescriptor,
    filtersContent,
    exportExcelProps,
  } = useTablePage({
    data,
    total,
    specialCells,
    fetchApi,
    rowsPerPageDefault,
    filters,
    hideSearch,
    exportAsExcel,
    columns,
  })

  const handleSort = (columnKey) => {
    setSortDescriptor(columnKey)
  }

  const dataTable = (
    <>
      <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <Table className="min-w-max border-0">
          <TableHeader
            className={cn(isHeaderSticky && 'sticky top-0 bg-gray-50 z-10', '[&_tr]:border-b-0')}
          >
            <TableRow className="bg-gray-50 hover:bg-gray-50 border-t border-gray-200 border-b-0">
              {columns.map((column) => (
                <TableHead
                  key={column.uid}
                  className={cn(
                    column.uid === 'actions' ||
                      column.uid === 'number' ||
                      column.uid === 'basicPrice' ||
                      column.uid === 'value' ||
                      column.uid === 'available' ||
                      column.uid === 'medicationTime'
                      ? 'text-center'
                      : 'text-start',
                    column.uid === 'actions' ||
                      column.uid === 'number' ||
                      column.uid === 'basicPrice' ||
                      column.uid === 'value' ||
                      column.uid === 'available' ||
                      column.uid === 'medicationTime'
                      ? 'cursor-default'
                      : 'cursor-pointer',
                    'px-2 py-2 text-xs font-semibold text-gray-700 select-none sm:px-4 sm:py-3 sm:text-sm',
                    sortDescriptor.column === column.uid && 'font-bold'
                  )}
                  onClick={() => {
                    if (
                      column.uid !== 'actions' &&
                      column.uid !== 'number' &&
                      column.uid !== 'basicPrice' &&
                      column.uid !== 'value' &&
                      column.uid !== 'available' &&
                      column.uid !== 'medicationTime'
                    ) {
                      handleSort(column.uid)
                    }
                  }}
                >
                  <div
                    className={cn(
                      'flex items-center gap-2',
                      column.uid === 'actions' ||
                        column.uid === 'number' ||
                        column.uid === 'basicPrice' ||
                        column.uid === 'value' ||
                        column.uid === 'available' ||
                        column.uid === 'medicationTime'
                        ? 'justify-center'
                        : 'justify-start'
                    )}
                  >
                    {column.name}
                    {sortDescriptor.column === column.uid && (
                      <span>{sortDescriptor.direction === 'ascending' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr]:border-b [&_tr]:border-gray-200">
            {isLoading ? (
              <TableRow className="border-b border-gray-200">
                <TableCell colSpan={columns.length} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedItems.length === 0 ? (
              <TableRow className="border-b border-gray-200">
                <TableCell colSpan={columns.length} className="text-center py-8">
                  {emptyContent ?? t('table.empty')}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {sortedItems.map((item, i) => (
                  <TableRow
                    key={item.id != null ? `${item.id}-${i}` : item.Id != null ? `${item.Id}-${i}` : i}
                    onClick={() => {
                      if (onClick) {
                        onClick(item)
                      }
                    }}
                    onDoubleClick={() => {
                      if (onDoubleClick) {
                        onDoubleClick(item)
                      }
                    }}
                    className={cn(
                      'border-b border-gray-200',
                      (onClick || onDoubleClick) && 'cursor-pointer hover:bg-gray-50',
                      specialRowClassName?.(item)
                    )}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.uid}
                        className={cn(
                          column.uid === 'actions' ||
                            column.uid === 'number' ||
                            column.uid === 'value' ||
                            column.uid === 'available' ||
                            column.uid === 'medicationTime'
                            ? 'text-center'
                            : 'text-start',
                          'px-2 py-2 text-xs text-gray-700 sm:px-4 sm:py-3 sm:text-sm'
                        )}
                      >
                        {column.uid === 'actions' ? (
                          <div className="flex justify-center items-center">
                            {actionsConfig && actionsConfig.length > 0 ? (
                              <ActionsDropdown
                                actions={actionsConfig.filter((action) => !action.disabled)}
                                item={item}
                                index={i}
                              />
                            ) : (
                              renderCell(item, column.uid) || '-'
                            )}
                          </div>
                        ) : column.uid === 'number' ||
                          column.uid === 'basicPrice' ||
                          column.uid === 'value' ? (
                          <div className="flex justify-center items-center">
                            {renderCell(item, column.uid) || '-'}
                          </div>
                        ) : (
                          renderCell(item, column.uid) || '-'
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {!hidePagination && bottomContent}
    </>
  )

  return (
    <div className="min-w-0 space-y-4">
      {(tableTitle || AddButtonProps || exportExcelProps.display) && (
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          {tableTitle && <h1 className="text-2xl font-bold text-gray-800">{tableTitle}</h1>}
          <div className="flex w-full flex-wrap items-center gap-2 sm:ms-auto sm:w-auto">
            {exportExcelProps.display && (
              <button
                type="button"
                onClick={exportExcelProps.onClick}
                disabled={exportExcelProps.loading}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-brand-primary bg-transparent px-4 py-2 font-medium text-brand-primary transition-colors hover:bg-brand-primary/10 disabled:opacity-50 sm:w-auto sm:justify-start"
              >
                <span>{t('table.exportExcel')}</span>
                {exportExcelProps.loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4 2.66667H12V5.33333H4V2.66667ZM2.66667 5.33333C1.93029 5.33333 1.33333 5.93029 1.33333 6.66667V12C1.33333 12.7364 1.93029 13.3333 2.66667 13.3333H4V14.6667H12V13.3333H13.3333C14.0697 13.3333 14.6667 12.7364 14.6667 12V6.66667C14.6667 5.93029 14.0697 5.33333 13.3333 5.33333H2.66667ZM4 8H12V11.3333H4V8Z"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </button>
            )}
            {AddButtonProps && (
              <button
                type="button"
                onClick={AddButtonProps.onClick}
                disabled={AddButtonProps.disabled}
                className="w-full rounded-md bg-brand-primary px-4 py-3 font-medium text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-50 disabled:hover:bg-brand-primary sm:w-auto"
              >
                {AddButtonProps.title}
              </button>
            )}
          </div>
        </div>
      )}

      {filtersContent &&
        (searchPanelClassName !== undefined ? (
          <div className={cn(panelClass, searchPanelClassName)}>{filtersContent}</div>
        ) : (
          filtersContent
        ))}

      {tablePanelClassName !== undefined ? (
        <div className={cn(panelClass, tablePanelClassName)}>{dataTable}</div>
      ) : (
        dataTable
      )}
    </div>
  )
}
