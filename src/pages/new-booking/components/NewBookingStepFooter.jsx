import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { panelClass } from '../bookingStyles.js'

function NewBookingStepFooter({ currentStep, onNext, onBack, onConfirmBooking, saving = false }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (currentStep === 'payment') {
    return (
      <div className={cn(panelClass, 'space-y-3')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={saving}
            onClick={onConfirmBooking}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-50 sm:min-w-[140px]"
          >
            {saving ? t('newBooking.payment.saving') : t('newBooking.payment.confirmBooking')}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => navigate('/allocation')}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#0d9488] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0f766e] disabled:opacity-50 sm:min-w-[140px]"
          >
            {t('newBooking.payment.goToAllocation')}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => navigate('/bookings')}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#fecaca] bg-white px-6 py-3 text-sm font-medium text-[#dc2626] transition-colors hover:bg-[#fef2f2] disabled:opacity-50 sm:min-w-[140px]"
          >
            {t('newBooking.payment.cancel')}
          </button>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={onBack}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-medium text-[#6b7280] transition-colors hover:bg-[#f8fafc] disabled:opacity-50 sm:w-auto sm:self-end"
        >
          <ChevronRight className="h-4 w-4" />
          {t('newBooking.back')}
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        panelClass,
        'flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center'
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/bookings')}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#fecaca] bg-white px-6 py-3 text-sm font-medium text-[#dc2626] transition-colors hover:bg-[#fef2f2] sm:flex-none"
        >
          {t('newBooking.cancel')}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover sm:flex-none"
        >
          {t('newBooking.next')}
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center justify-center gap-2 self-end rounded-xl border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-medium text-[#6b7280] transition-colors hover:bg-[#f8fafc] sm:self-auto"
      >
        <ChevronRight className="h-4 w-4" />
        {t('newBooking.back')}
      </button>
    </div>
  )
}

export default NewBookingStepFooter
