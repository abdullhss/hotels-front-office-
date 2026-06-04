import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { formatDisplayDate } from '../../new-booking/dateUtils.js'

function formatMoney(amount, currencyLabel) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return `0.00 ${currencyLabel}`
  return `${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currencyLabel}`
}

function InvoiceCell({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="m-0 text-xs text-[#6b7280]">{label}</p>
      <p className="m-0 mt-0.5 text-sm font-medium text-[#111827]">{value}</p>
    </div>
  )
}

function ReservationInvoiceModal({
  open,
  onClose,
  onEndAssignment,
  isFinalized = false,
  endingAssignment = false,
  lines = [],
  assignmentNum = '',
  isArabic,
  currencyLabel = 'د.ل.',
}) {
  const { t } = useTranslation()

  const grandTotal = useMemo(
    () => lines.reduce((sum, row) => sum + (Number(row.roomTotal) || 0), 0),
    [lines]
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={() => onClose?.()}
        aria-label={t('roomOperations.invoice.close')}
      />

      <div className="relative z-10 flex max-h-[min(94vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e8ecf2] px-5 py-4">
          <div>
            <h2 className="m-0 text-lg font-bold text-[#111827]">
              {t('roomOperations.invoice.title')}
            </h2>
            <p className="m-0 mt-1 text-sm text-[#6b7280]">
              {t('roomOperations.invoice.assignment', { num: assignmentNum })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#eef2ff]"
            aria-label={t('roomOperations.invoice.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {lines.length === 0 ? (
            <p className="m-0 py-12 text-center text-sm text-[#6b7280]">
              {t('roomOperations.invoice.empty')}
            </p>
          ) : (
            <div className="space-y-6">
              {lines.map((row, index) => {
                const unitDesc = isArabic
                  ? row.unitDescAr || row.unitDescEn
                  : row.unitDescEn || row.unitDescAr
                const featureName = isArabic
                  ? row.featureNameAr || row.featureNameEn
                  : row.featureNameEn || row.featureNameAr

                return (
                  <article
                    key={`${row.hotelUnitId}-${index}`}
                    className="rounded-2xl border border-[#e2e8f0] bg-[#fafbfd] p-4"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#e8ecf2] pb-3">
                      <h3 className="m-0 text-base font-bold text-[#111827]">
                        {t('roomOperations.invoice.roomLine', {
                          num: row.unitNum || row.hotelUnitId,
                          index: index + 1,
                        })}
                      </h3>
                      <span className="text-sm font-semibold text-brand-primary">
                        {formatMoney(row.roomTotal, currencyLabel)}
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <InvoiceCell
                        label={t('roomOperations.invoice.unitDesc')}
                        value={unitDesc || '—'}
                      />
                      <InvoiceCell
                        label={t('allocation.checkInPage.fromDate')}
                        value={formatDisplayDate(row.fromDate)}
                      />
                      <InvoiceCell
                        label={t('allocation.checkInPage.toDate')}
                        value={formatDisplayDate(row.toDate)}
                      />
                      <InvoiceCell
                        label={t('allocation.checkInPage.nights')}
                        value={String(row.nightsNum)}
                      />
                      <InvoiceCell
                        label={t('roomOperations.invoice.pricePerNight')}
                        value={formatMoney(row.unitPricePerNight, currencyLabel)}
                      />
                      <InvoiceCell
                        label={t('roomOperations.invoice.roomBase')}
                        value={formatMoney(row.roomBaseTotal, currencyLabel)}
                      />
                      <InvoiceCell
                        label={t('roomOperations.invoice.features')}
                        value={formatMoney(row.featuresTotal, currencyLabel)}
                      />
                      <InvoiceCell
                        label={t('roomOperations.invoice.services')}
                        value={formatMoney(row.servicesTotal, currencyLabel)}
                      />
                      <InvoiceCell
                        label={t('allocation.checkInPage.services')}
                        value={featureName || '—'}
                      />
                      <InvoiceCell
                        label={t('roomOperations.invoice.featurePrice')}
                        value={formatMoney(row.featurePrice, currencyLabel)}
                      />
                      <InvoiceCell
                        label={t('roomOperations.invoice.roomWithFeatures')}
                        value={formatMoney(row.totalRoomWithFeatures, currencyLabel)}
                      />
                    </div>
                  </article>
                )
              })}

              <div className="flex items-center justify-between rounded-2xl border-2 border-brand-primary/20 bg-[#eef2ff] px-5 py-4">
                <span className="text-base font-bold text-[#111827]">
                  {t('roomOperations.invoice.grandTotal')}
                </span>
                <span className="text-xl font-bold text-brand-primary">
                  {formatMoney(grandTotal, currencyLabel)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-[#e8ecf2] px-5 py-4">
          <button
            type="button"
            onClick={() => onClose?.()}
            disabled={endingAssignment}
            className="rounded-xl border border-[#e2e8f0] bg-white px-6 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#f8fafc] disabled:opacity-50"
          >
            {t('roomOperations.invoice.close')}
          </button>
          {!isFinalized ? (
            <button
              type="button"
              onClick={() => onEndAssignment?.()}
              disabled={endingAssignment}
              className="rounded-xl bg-[#059669] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#047857] disabled:opacity-50"
            >
              {endingAssignment
                ? t('roomOperations.searching')
                : t('roomOperations.finalize.endAssignment')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ReservationInvoiceModal
