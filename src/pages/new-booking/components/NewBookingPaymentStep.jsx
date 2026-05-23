import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Banknote, Wallet } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { FieldLabel } from './BookingFormFields.jsx'
import { panelClass as bookingPanelClass } from '../bookingStyles.js'

const panelClass = bookingPanelClass

const inputClass =
  'w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-3 ps-3 pe-14 text-lg font-semibold text-[#111827] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary'

function parseAmount(value) {
  const n = Number(String(value).replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function formatAmount(value, locale) {
  return parseAmount(value).toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function NewBookingPaymentStep({
  totalPrice: totalFromStay = 0,
  downPayment = '',
  onDownPaymentChange,
}) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const locale = isArabic ? 'ar-LY' : 'en-US'

  const total = Number(totalFromStay) || 0
  const paid = parseAmount(downPayment)
  const remaining = Math.max(0, total - paid)
  const paidPercent = total > 0 ? Math.min(100, (paid / total) * 100) : 0

  const downPaymentError = useMemo(() => {
    if (downPayment.trim() === '') return null
    if (paid < 0) {
      return isArabic ? 'المبلغ غير صالح' : 'Invalid amount'
    }
    if (total <= 0) {
      return isArabic
        ? 'أضف وحدات من خطوة الحجز أولاً'
        : 'Add units from the booking step first'
    }
    if (paid >= total) {
      return t('newBooking.payment.downPaymentTooHigh')
    }
    return null
  }, [downPayment, paid, total, isArabic, t])

  const formatted = useMemo(
    () => ({
      total: formatAmount(total, locale),
      paid: formatAmount(paid, locale),
      remaining: formatAmount(remaining, locale),
    }),
    [total, paid, remaining, locale]
  )

  return (
    <div className="space-y-4">
      <div className={panelClass}>
        <div className="mb-5 flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#ede9fe] text-[#7c3aed]">
            <Wallet className="h-4 w-4" />
          </span>
          <h2 className="m-0 text-base font-semibold text-[#111827]">
            {t('newBooking.payment.summaryTitle')}
          </h2>
        </div>

        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-[#374151]">
            {t('newBooking.payment.totalPrice')}
          </span>
          <span className="text-2xl font-bold text-brand-primary" dir="ltr">
            {formatted.total} {t('newBooking.stay.currency')}
          </span>
        </div>

        <hr className="my-6 border-0 border-t border-[#e8ecf2]" />

        <div className="mb-5 flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#dbeafe] text-[#2563eb]">
            <Banknote className="h-4 w-4" />
          </span>
          <h3 className="m-0 text-base font-semibold text-[#111827]">
            {t('newBooking.payment.paymentsTitle')}
          </h3>
        </div>

        <div className="mb-4">
          <FieldLabel required>{t('newBooking.payment.downPayment')}</FieldLabel>
          <div className="relative max-w-md">
            <input
              type="text"
              inputMode="decimal"
              value={downPayment}
              onChange={(e) => onDownPaymentChange?.(e.target.value)}
              placeholder={t('newBooking.payment.downPaymentPlaceholder')}
              disabled={total <= 0}
              className={cn(
                inputClass,
                downPaymentError && 'border-[#fecaca] ring-2 ring-[#fecaca] focus:ring-[#fecaca]'
              )}
            />
            <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-[#9ca3af]">
              {t('newBooking.stay.currency')}
            </span>
          </div>
          {downPaymentError ? (
            <p className="mt-2 text-sm text-[#dc2626]">{downPaymentError}</p>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xl font-bold text-brand-primary sm:text-2xl">
              {formatted.total} {t('newBooking.stay.currency')}
            </span>
            <span className="text-base font-semibold text-[#111827] sm:text-lg">
              {t('newBooking.payment.grandTotal')}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 text-sm text-[#9ca3af]">
            <span>
              {t('newBooking.payment.remaining')}{' '}
              <span className="font-medium text-[#6b7280]">
                {formatted.remaining} {t('newBooking.stay.currency')}
              </span>
            </span>
            <span>
              {t('newBooking.payment.paid')}{' '}
              <span className="font-medium text-[#6b7280]">
                {formatted.paid} {t('newBooking.stay.currency')}
              </span>
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-[#e8ecf2]">
            <div
              className="h-full rounded-full bg-brand-primary transition-all duration-300"
              style={{ width: `${paidPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewBookingPaymentStep
