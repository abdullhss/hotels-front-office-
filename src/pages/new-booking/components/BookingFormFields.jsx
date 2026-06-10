import { useEffect, useId, useRef, useState } from 'react'
import { Calendar, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { formRowClass, iconInputClass, selectClass } from '../bookingStyles.js'

const fieldIconClass =
  'pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]'

const selectIconClass =
  'pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]'

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
      <input className={iconInputClass} {...props} />
      <Icon className={fieldIconClass} aria-hidden />
    </div>
  )
}

export function IconDateInput({ className, value, onChange, min, max, disabled, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <input
        type="date"
        className={cn(iconInputClass, '[color-scheme:light]')}
        value={value ?? ''}
        onChange={onChange}
        min={min}
        max={max}
        disabled={disabled}
        {...props}
      />
      <Calendar className={fieldIconClass} aria-hidden />
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
        <Icon className={selectIconClass} aria-hidden />
      ) : (
        <ChevronDown className={selectIconClass} aria-hidden />
      )}
    </div>
  )
}

export function SearchableSelect({
  value = '',
  onChange,
  options = [],
  placeholder = '',
  disabled = false,
  loading = false,
  loadingLabel = 'Loading…',
  noResultsLabel = 'No results',
  className,
}) {
  const listboxId = useId()
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selectedOption = options.find((opt) => String(opt.value) === String(value))
  const normalizedQuery = query.trim().toLowerCase()
  const filteredOptions = normalizedQuery
    ? options.filter((opt) => opt.label.toLowerCase().includes(normalizedQuery))
    : options

  const displayValue = open ? query : selectedOption?.label ?? ''

  useEffect(() => {
    if (!open) return undefined
    const handlePointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const handleFocus = () => {
    if (disabled || loading) return
    setOpen(true)
    setQuery(selectedOption?.label ?? '')
    requestAnimationFrame(() => inputRef.current?.select())
  }

  const handleInputChange = (e) => {
    setQuery(e.target.value)
    if (!open) setOpen(true)
  }

  const handleSelect = (optionValue) => {
    onChange?.(optionValue)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    onChange?.('')
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setQuery('')
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (e.key === 'Enter' && open && filteredOptions.length > 0) {
      e.preventDefault()
      handleSelect(filteredOptions[0].value)
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Search className={fieldIconClass} aria-hidden />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        className={cn(iconInputClass, 'pe-16')}
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={loading ? loadingLabel : placeholder}
        disabled={disabled || loading}
        autoComplete="off"
      />
      {value && !disabled && !loading ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute end-9 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[#9ca3af] transition-colors hover:bg-[#f1f5f9] hover:text-[#6b7280]"
          aria-label="Clear"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <ChevronDown
        className={cn(selectIconClass, open && 'rotate-180 transition-transform')}
        aria-hidden
      />
      {open && !disabled && !loading ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-lg"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-[#9ca3af]">{noResultsLabel}</li>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value)
              return (
                <li key={opt.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'w-full px-3 py-2.5 text-start text-sm transition-colors hover:bg-[#f8fafc]',
                      isSelected
                        ? 'bg-[#f0fdf4] font-medium text-[#166534]'
                        : 'text-[#374151]'
                    )}
                  >
                    {opt.label}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      ) : null}
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
