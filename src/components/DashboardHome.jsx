import {
  BedDouble,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Filter,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Wrench,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'


const unitToneStyles = {
  available: 'bg-[#dff2e9] text-[#0f766e]',
  occupied: 'bg-[#e4e7ec] text-[#475467]',
  cleaning: 'bg-[#f6e7d2] text-[#b45309]',
  maintenance: 'bg-[#f7dce2] text-[#be123c]',
  'needs-cleaning': 'bg-[#f6efcb] text-[#ca8a04]',
}

function StatCard({ item }) {
  const Icon = item.icon
  return (
    <article className="rounded-3xl border border-[#d8dee8] bg-[#f7f8fb] px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-sm font-semibold text-[#374151]">{item.title}</p>
          <p className="mt-1 text-xs text-[#9aa3b2]">{item.subtitle || '\u00a0'}</p>
        </div>
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.iconBg} ${item.accent}`}
        >
          <Icon size={18} strokeWidth={2} />
        </span>
      </div>
      <p className="mt-1 text-3xl font-bold leading-none text-[#111827]">{item.value}</p>
    </article>
  )
}

function DashboardHome() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const dir = isArabic ? 'rtl' : 'ltr'

  const stats = [
    {
      title: t('dashboard.stats.units'),
      subtitle: '',
      value: 3,
      icon: BedDouble,
      accent: 'text-[#6366f1]',
      iconBg: 'bg-[#eef2ff]',
    },
    {
      title: t('dashboard.stats.availableUnits'),
      subtitle: t('dashboard.stats.availableHint'),
      value: 1,
      icon: CheckCircle2,
      accent: 'text-[#059669]',
      iconBg: 'bg-[#e7f8f1]',
    },
    {
      title: t('dashboard.stats.needCleaning'),
      subtitle: t('dashboard.stats.cleaningHint'),
      value: 1,
      icon: ClipboardCheck,
      accent: 'text-[#d97706]',
      iconBg: 'bg-[#fff4e6]',
    },
    {
      title: t('dashboard.stats.maintenance'),
      subtitle: t('dashboard.stats.maintenanceHint'),
      value: 0,
      icon: Wrench,
      accent: 'text-[#e11d48]',
      iconBg: 'bg-[#ffe9ef]',
    },
  ]

  const unitCards = [
    { value: '1', label: t('dashboard.units.suiteOne'), tone: 'available' },
    { value: '3', label: t('dashboard.units.roomsTen'), tone: 'available' },
    { value: 'c1', label: t('dashboard.units.room'), tone: 'available' },
    { value: 'c1', label: t('dashboard.units.room'), tone: 'available' },
    { value: '1', label: t('dashboard.units.suiteOne'), tone: 'available' },
    { value: '3', label: t('dashboard.units.roomsTen'), tone: 'maintenance' },
    { value: 'c1', label: t('dashboard.units.room'), tone: 'cleaning' },
    { value: 'c1', label: t('dashboard.units.room'), tone: 'available' },
    { value: '1', label: t('dashboard.units.suiteOne'), tone: 'occupied' },
    { value: '3', label: t('dashboard.units.roomsTen'), tone: 'needs-cleaning' },
    { value: 'c1', label: t('dashboard.units.room'), tone: 'available' },
    { value: 'c1', label: t('dashboard.units.room'), tone: 'available' },
  ]

  const legendItems = [
    { label: t('dashboard.legend.available'), color: 'bg-[#0f766e]' },
    { label: t('dashboard.legend.occupied'), color: 'bg-[#475467]' },
    { label: t('dashboard.legend.needed'), color: 'bg-[#ca8a04]' },
    { label: t('dashboard.legend.cleaning'), color: 'bg-[#b45309]' },
    { label: t('dashboard.legend.maintenance'), color: 'bg-[#e11d48]' },
  ]

  return (
    <section className="space-y-4" dir={dir}>
      <header className="px-1">
        <h1 className="m-0 text-2xl font-bold text-[#111827]">{t('dashboard.greeting')}</h1>
        <p className="mt-1 text-sm text-[#6b7280]">{t('dashboard.date')}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.title} item={item} />
        ))}
      </div>

      <div className="rounded-3xl border border-[#d8dee8] bg-[#f7f8fb] px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d8dee8] bg-white px-4 text-sm font-medium text-[#6b7280]"
          >
            <Filter size={16} />
            {t('dashboard.filters.filter')}
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d8dee8] bg-white px-3 text-sm text-[#9ca3af]"
          >
            <span>{t('dashboard.filters.status')}</span>
            <span>{t('dashboard.filters.all')}</span>
            <ChevronDown size={16} />
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d8dee8] bg-white px-3 text-sm text-[#9ca3af]"
          >
            <span>{t('dashboard.filters.type')}</span>
            <span>{t('dashboard.filters.all')}</span>
            <ChevronDown size={16} />
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d8dee8] bg-white px-3 text-sm text-[#9ca3af]"
          >
            <span>{t('dashboard.filters.floor')}</span>
            <span>{t('dashboard.filters.all')}</span>
            <ChevronDown size={16} />
          </button>
          <div className="ms-auto inline-flex rounded-xl border border-[#d8dee8] bg-white p-1">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef2ff] text-[#6366f1]"
              aria-label={t('dashboard.filters.gridViewAria')}
            >
              <LayoutGrid size={17} />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7280]"
              aria-label={t('dashboard.filters.listViewAria')}
            >
              <List size={17} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
        <aside className="rounded-3xl border border-[#d8dee8] bg-[#f7f8fb] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="m-0 text-2xl font-semibold text-[#111827]">{t('dashboard.today.title')}</h2>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#dbe6ff] text-[#2563eb]">
              <BedDouble size={18} />
            </span>
          </div>
          <p className="mb-4 text-xs text-[#9aa3b2]">{t('dashboard.today.time')}</p>
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#e0e6ef] bg-white p-3">
              <div className="mb-2 flex items-center justify-between text-sm font-semibold text-[#374151]">
                <span>{t('dashboard.today.arrivals')}</span>
                <span className="rounded-md bg-[#ebf2ff] px-2 py-0.5 text-[#2563eb]">0</span>
              </div>
              <p className="m-0 rounded-xl bg-[#f5f7fb] py-3 text-center text-sm text-[#b2bac8]">
                {t('dashboard.today.noArrivals')}
              </p>
            </div>
            <div className="rounded-2xl border border-[#e0e6ef] bg-white p-3">
              <div className="mb-2 flex items-center justify-between text-sm font-semibold text-[#374151]">
                <span>{t('dashboard.today.departures')}</span>
                <span className="rounded-md bg-[#ffeef2] px-2 py-0.5 text-[#dc2626]">0</span>
              </div>
              <p className="m-0 rounded-xl bg-[#f5f7fb] py-3 text-center text-sm text-[#b2bac8]">
                {t('dashboard.today.noDepartures')}
              </p>
            </div>
          </div>
        </aside>

        <section className="rounded-3xl border border-[#d8dee8] bg-[#f7f8fb] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="m-0 text-2xl font-semibold text-[#111827]">{t('dashboard.units.title')}</h2>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8dee8] bg-white text-[#6b7280]"
              aria-label={t('dashboard.units.settingsAria')}
            >
              <SlidersHorizontal size={17} />
            </button>
          </div>
          <a href="#" className="mb-4 inline-block text-sm font-medium text-[#6366f1]">
            {t('dashboard.units.viewAll')}
          </a>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {unitCards.map((card, index) => (
              <article
                key={`${card.label}-${index}`}
                className={`rounded-2xl p-4 text-center ${unitToneStyles[card.tone]}`}
              >
                <p className="m-0 text-3xl font-bold leading-none">{card.value}</p>
                <p className="mt-2 text-sm font-medium">{card.label}</p>
              </article>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-5 border-t border-[#e0e6ef] pt-4 text-sm text-[#6b7280]">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${item.color}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

export default DashboardHome
