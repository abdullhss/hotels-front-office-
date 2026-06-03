import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../../lib/utils.js'

function UnitsPagination({ page, pageCount, total, onPageChange, disabled }) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  if (pageCount <= 1 && total <= 0) return null

  const canPrev = page > 1 && !disabled
  const canNext = page < pageCount && !disabled

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3 shadow-sm">
      <p className="m-0 text-sm text-[#6b7280]">
        {t('unitsPage.pagination.summary', { page, pageCount, total })}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#374151] transition',
            canPrev ? 'hover:bg-[#eef2ff] hover:text-[#6366f1]' : 'cursor-not-allowed opacity-40'
          )}
          aria-label={t('unitsPage.pagination.prev')}
        >
          {isArabic ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <span className="min-w-[4rem] text-center text-sm font-medium text-[#111827]">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#374151] transition',
            canNext ? 'hover:bg-[#eef2ff] hover:text-[#6366f1]' : 'cursor-not-allowed opacity-40'
          )}
          aria-label={t('unitsPage.pagination.next')}
        >
          {isArabic ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  )
}

export default UnitsPagination
