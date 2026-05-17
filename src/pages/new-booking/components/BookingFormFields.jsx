import { ChevronDown } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { formRowClass, inputClass, selectClass } from '../bookingStyles.js'

export function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#374151]">
      {children}
      {required && <span className="text-[#dc2626]"> *</span>}
    </label>
  )
}

export function IconInput({ icon: Icon, className, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <input className={inputClass} {...props} />
      <Icon className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
    </div>
  )
}

export function IconSelect({ icon: Icon, children, className, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <select className={selectClass} {...props}>
        {children}
      </select>
      {Icon ? (
        <Icon className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
      ) : (
        <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
      )}
    </div>
  )
}

export function SectionHeader({ icon: Icon, iconBg, iconColor, title, className }) {
  return (
    <div className={cn('mb-4 flex items-center gap-2', className)}>
      <span
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-lg',
          iconBg,
          iconColor
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <h2 className="m-0 text-base font-semibold text-[#111827]">{title}</h2>
    </div>
  )
}

export function AccordionChevron() {
  return (
    <ChevronDown
      className="h-5 w-5 shrink-0 text-[#6b7280] transition-transform duration-200 group-data-[state=open]:rotate-180"
      aria-hidden
    />
  )
}

export function FormRow({ icon: Icon, title, hint, children, accent = 'bg-[#eef2ff] text-brand-primary' }) {
  return (
    <div className={formRowClass}>
      <div className="mb-3 flex items-start gap-3">
        <span
          className={cn(
            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            accent
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="m-0 text-sm font-semibold text-[#111827]">{title}</p>
          {hint ? <p className="mt-0.5 text-xs leading-relaxed text-[#9ca3af]">{hint}</p> : null}
        </div>
      </div>
      {children}
    </div>
  )
}
