import { Banknote, Shirt, Tv, Wifi, Wind } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isRoomSeated } from '../../../Hooks/GetRoomsStatus.js'
import { cn } from '../../../lib/utils.js'
import UnitAssignmentsPreview from './UnitAssignmentsPreview.jsx'

const statusStyles = {
  occupied: {
    border: 'border-t-[#ef4444]',
    badge: 'bg-[#fee2e2] text-[#dc2626]',
  },
  cleaning: {
    border: 'border-t-[#f97316]',
    badge: 'bg-[#ffedd5] text-[#c2410c]',
  },
  available: {
    border: 'border-t-[#22c55e]',
    badge: 'bg-[#dcfce7] text-[#15803d]',
  },
  reserved: {
    border: 'border-t-[#eab308]',
    badge: 'bg-[#fef9c3] text-[#a16207]',
  },
  maintenance: {
    border: 'border-t-[#f472b6]',
    badge: 'bg-[#fce7f3] text-[#db2777]',
  },
}

const amenityIcons = {
  wifi: Wifi,
  tv: Tv,
  ac: Wind,
  laundry: Shirt,
}

function UnitDetailCard({ unit }) {
  const { t } = useTranslation()
  const styles = statusStyles[unit.statusKey ?? unit.status] ?? statusStyles.available
  const showAssignments = isRoomSeated(unit)

  return (
    <article
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm',
        'border-t-4',
        styles.border
      )}
    >
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="m-0 text-xs text-[#9ca3af]">
              {t('unitsPage.floor.label')}{' '}
              <span className="font-semibold text-[#374151]">{unit.floorNum ?? '—'}</span>
            </p>
            <p className="m-0 text-lg font-bold text-[#111827]">{unit.unitNameLabel}</p>
          </div>
          <span className={cn('shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold', styles.badge)}>
            {unit.statusLabel ?? t(`unitsPage.status.${unit.statusKey ?? unit.status}`)}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="m-0 text-xs text-[#9ca3af]">{t('unitsPage.capacity.label')}</p>
          <p className="m-0 text-lg font-bold text-[#111827]">{unit.capacityLabel}</p>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 text-[#374151]">
          <span className="text-sm font-semibold">{unit.priceLabel}</span>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2ff] text-[#6366f1]">
            <Banknote size={16} strokeWidth={1.75} />
          </span>
        </div>

        {showAssignments ? <UnitAssignmentsPreview unit={unit} /> : null}

        <div className="mt-auto flex flex-wrap items-center justify-center gap-4 border-t border-[#f1f5f9] pt-4">
          {(unit.amenityItems ?? []).map((item) => {
            const Icon = item.key ? amenityIcons[item.key] : null
            return (
              <div key={item.id ?? item.label} className="flex flex-col items-center gap-1">
                {Icon ? (
                  <Icon size={16} className="text-[#9ca3af]" strokeWidth={1.75} />
                ) : (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded bg-[#f1f5f9] px-1 text-[9px] font-medium text-[#6b7280]">
                    •
                  </span>
                )}
                <span className="max-w-[4.5rem] truncate text-[10px] text-[#9ca3af]">{item.label}</span>
              </div>
            )
          })}
          {(unit.amenities ?? []).map((key) => {
            const Icon = amenityIcons[key]
            if (!Icon) return null
            return (
              <div key={key} className="flex flex-col items-center gap-1">
                <Icon size={16} className="text-[#9ca3af]" strokeWidth={1.75} />
                <span className="text-[10px] text-[#9ca3af]">{t(`unitsPage.amenities.${key}`)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </article>
  )
}

export default UnitDetailCard
