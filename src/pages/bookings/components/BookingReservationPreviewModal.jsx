import { useTranslation } from 'react-i18next'
import { CalendarDays, CreditCard, Users, X } from 'lucide-react'
import { formatDisplayDate } from '../../new-booking/dateUtils.js'
import { cn } from '../../../lib/utils'

function DetailItem({ label, value, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-xs font-medium text-[#9ca3af]">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-[#111827]">{value || '—'}</dd>
    </div>
  )
}

function formatMoney(amount, currency) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

function PreviewBody({ reservation, isArabic, currency, t }) {
  const remaining = Math.max(0, reservation.totalAmount - reservation.downPayment)
  const typeLabel = isArabic
    ? reservation.typeNameAr || reservation.typeNameEn
    : reservation.typeNameEn || reservation.typeNameAr

  const customers = reservation.customerData ?? []
  const units = reservation.reservationUnits ?? []

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e8ecf2] pb-4">
        <div>
          <p className="m-0 text-xs font-medium text-[#9ca3af]">{t('bookings.preview.bookingNumber')}</p>
          <p className="m-0 mt-1 text-xl font-bold text-[#111827]">#{reservation.reservationNum}</p>
        </div>
        <span className="inline-flex rounded-lg bg-[#eef2ff] px-3 py-1.5 text-sm font-medium text-brand-primary">
          {typeLabel || '—'}
        </span>
      </header>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#111827]">
          <CalendarDays className="h-4 w-4 text-[#6b7280]" />
          {t('bookings.preview.dates')}
        </h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem
            label={t('bookings.preview.reservationDate')}
            value={formatDisplayDate(reservation.reservationDate)}
          />
          <DetailItem
            label={t('bookings.preview.checkIn')}
            value={formatDisplayDate(reservation.fromDate)}
          />
          <DetailItem
            label={t('bookings.preview.checkOut')}
            value={formatDisplayDate(reservation.toDate)}
          />
          <DetailItem label={t('bookings.preview.nights')} value={String(reservation.daysCount || '—')} />
        </dl>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#111827]">
          <Users className="h-4 w-4 text-[#6b7280]" />
          {t('bookings.preview.guests')}
        </h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem label={t('bookings.preview.adults')} value={String(reservation.adultsCount)} />
          <DetailItem label={t('bookings.preview.children')} value={String(reservation.childrenCount)} />
          <DetailItem label={t('bookings.preview.persons')} value={String(reservation.personsCount)} />
          <DetailItem label={t('bookings.preview.rooms')} value={String(reservation.roomsCount)} />
        </dl>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#111827]">
          <CreditCard className="h-4 w-4 text-[#6b7280]" />
          {t('bookings.preview.payment')}
        </h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem
            label={t('bookings.preview.total')}
            value={formatMoney(reservation.totalAmount, currency)}
          />
          <DetailItem
            label={t('bookings.preview.downPayment')}
            value={formatMoney(reservation.downPayment, currency)}
          />
          <DetailItem
            label={t('bookings.preview.remaining')}
            value={formatMoney(remaining, currency)}
          />
          <DetailItem
            label={t('bookings.preview.approved')}
            value={
              reservation.isApproved
                ? isArabic
                  ? 'نعم'
                  : 'Yes'
                : isArabic
                  ? 'لا'
                  : 'No'
            }
          />
        </dl>
      </section>

      <dl className="grid gap-4 border-t border-[#e8ecf2] pt-4 sm:grid-cols-2">
        <DetailItem label={t('bookings.preview.status')} value={String(reservation.status)} />
        <DetailItem label={t('bookings.preview.statusRemarks')} value={reservation.statusRemarks} />
        <DetailItem label={t('bookings.preview.customerId')} value={String(reservation.customerId || '—')} />
        {reservation.agentId > 0 ? (
          <DetailItem label={t('bookings.preview.agentId')} value={String(reservation.agentId)} />
        ) : null}
      </dl>

      {customers.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#111827]">{t('bookings.preview.customers')}</h3>
          <ul className="m-0 list-none space-y-2 p-0">
            {customers.map((c, idx) => {
              const name =
                c.CustomerNameA ??
                c.customerNameA ??
                c.CustomerNameE ??
                c.customerNameE ??
                '—'
              return (
                <li
                  key={c.Id ?? c.id ?? idx}
                  className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] px-3 py-2 text-sm text-[#374151]"
                >
                  {name}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {units.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#111827]">{t('bookings.preview.units')}</h3>
          <ul className="m-0 list-none space-y-2 p-0">
            {units.map((u, idx) => (
              <li
                key={u.Id ?? u.id ?? idx}
                className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] px-3 py-2 text-xs text-[#374151]"
              >
                {JSON.stringify(u)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function BookingReservationPreviewModal({ open, onClose, reservation, loading, isArabic }) {
  const { t } = useTranslation()
  const currency = t('newBooking.stay.currency')

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-preview-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label={t('bookings.preview.close')}
      />
      <div className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-[#e8ecf2] px-5 py-4">
          <h2 id="booking-preview-title" className="m-0 text-lg font-semibold text-[#111827]">
            {t('bookings.previewTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#f3f4f6]"
            aria-label={t('bookings.preview.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#e8ecf2] border-t-brand-primary" />
            </div>
          ) : reservation ? (
            <PreviewBody
              reservation={reservation}
              isArabic={isArabic}
              currency={currency}
              t={t}
            />
          ) : (
            <p className="m-0 py-8 text-center text-sm text-[#6b7280]">{t('bookings.notFound')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingReservationPreviewModal
