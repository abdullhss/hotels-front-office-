import { Check, Hourglass } from 'lucide-react'
import { cn } from '../../../lib/utils'

function BookingStatTabs({ tabs, activeStat, onSelect }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeStat === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect(tab.key)}
            className={cn(
              'flex items-center justify-between gap-3 rounded-2xl border border-[#e2e8f0] px-4 py-3 transition-all',
              isActive ? tab.activeClass : 'bg-[#f8fafc] text-[#6b7280] hover:bg-white'
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-full',
                  isActive && tab.key === 'confirmed'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#eef2ff] text-brand-primary'
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium">{tab.label}</span>
            </div>
            <span className="text-xl font-bold">{tab.value}</span>
          </button>
        )
      })}
    </div>
  )
}

export default BookingStatTabs
