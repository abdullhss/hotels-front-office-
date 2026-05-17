import { BedDouble, CheckCircle2, CreditCard, Users } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { STEP_ORDER } from '../bookingData.js'

function BookingStepper({ currentStep, t }) {
  const steps = [
    { key: 'individuals', label: t('newBooking.steps.individuals'), icon: Users },
    { key: 'booking', label: t('newBooking.steps.booking'), icon: BedDouble },
    { key: 'payment', label: t('newBooking.steps.payment'), icon: CreditCard },
  ]
  const currentIdx = STEP_ORDER.indexOf(currentStep)

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      {steps.map((step, idx) => {
        const Icon = step.icon
        const isCompleted = idx < currentIdx
        const isActive = step.key === currentStep
        return (
          <div
            key={step.key}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all sm:px-4',
              isCompleted && 'bg-[#059669] text-white shadow-sm',
              isActive && !isCompleted && 'bg-brand-primary text-white shadow-md',
              !isCompleted && !isActive && 'text-[#9ca3af]'
            )}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <Icon className="h-4 w-4 shrink-0" />
            )}
            <span>{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default BookingStepper
