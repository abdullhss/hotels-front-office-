import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  Calendar,
  Minus,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table.jsx'
import { cn } from '../../../lib/utils'

const panelClass =
  'rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm sm:p-5'

const inputClass =
  'w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-3 ps-3 pe-10 text-sm text-[#374151] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary'

const selectClass =
  'w-full appearance-none rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-3 ps-3 pe-10 text-sm text-[#374151] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary'

const EMPTY_LINE = {
  unitType: 'single',
  unitsCount: 1,
  unitPrice: '',
  arrivalDate: '',
  departureDate: '',
  adults: 1,
  children: 0,
  notes: '',
  services: ['breakfast_only', 'pool', 'gym', 'jacuzzi'],
}

const INITIAL_ROWS = [
  {
    id: '1',
    unitType: 'single',
    unitsCount: 2,
    unitPrice: '1200',
    arrivalDate: '04 / 07 / 2026',
    departureDate: '05 / 07 / 2026',
    adults: 1,
    children: 0,
    services: ['breakfast_only', 'pool', 'gym'],
    servicesLabelAr: 'افطار فقط، حمام سباحة، صالة رياضة',
    servicesLabelEn: 'Breakfast only, Pool, Gym',
    total: 2400,
  },
  {
    id: '2',
    unitType: 'suite',
    unitsCount: 1,
    unitPrice: '2150',
    arrivalDate: '04 / 07 / 2026',
    departureDate: '06 / 07 / 2026',
    adults: 2,
    children: 1,
    services: ['breakfast_lunch', 'jacuzzi'],
    servicesLabelAr: 'افطار وغداء، جاكوزي',
    servicesLabelEn: 'Breakfast & lunch, Jacuzzi',
    total: 2150,
  },
]

function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#374151]">
      {children}
      {required && <span className="text-[#dc2626]"> *</span>}
    </label>
  )
}

function NumStepper({ value, onChange, min = 0, max = 99 }) {
  const n = Number(value) || 0
  const dec = () => onChange(Math.max(min, n - 1))
  const inc = () => onChange(Math.min(max, n + 1))
  return (
    <div className="flex overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
      <button
        type="button"
        onClick={dec}
        className="flex h-11 w-10 shrink-0 items-center justify-center text-[#6b7280] transition-colors hover:bg-[#eef2ff] hover:text-brand-primary"
        aria-label="decrease"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={n}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
        className="h-11 min-w-0 flex-1 border-x border-[#e2e8f0] bg-white px-2 text-center text-sm text-[#374151] focus:outline-none"
      />
      <button
        type="button"
        onClick={inc}
        className="flex h-11 w-10 shrink-0 items-center justify-center text-[#6b7280] transition-colors hover:bg-[#eef2ff] hover:text-brand-primary"
        aria-label="increase"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

function NewBookingStayStep() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const [draft, setDraft] = useState({
    ...EMPTY_LINE,
    unitType: 'single',
    unitsCount: 2,
    unitPrice: '1',
    arrivalDate: '04 / 07 / 2026',
    departureDate: '05 / 07 / 2026',
    adults: 1,
    children: 0,
  })
  const [rows, setRows] = useState(INITIAL_ROWS)

  const serviceOptions = useMemo(
    () => [
      { value: 'breakfast_only', label: t('newBooking.stay.serviceOptions.breakfastOnly') },
      { value: 'breakfast_lunch', label: t('newBooking.stay.serviceOptions.breakfastLunch') },
      { value: 'pool', label: t('newBooking.stay.serviceOptions.pool') },
      { value: 'gym', label: t('newBooking.stay.serviceOptions.gym') },
      { value: 'jacuzzi', label: t('newBooking.stay.serviceOptions.jacuzzi') },
    ],
    [t]
  )

  const unitTypeLabel = (type) => {
    if (type === 'suite') return isArabic ? 'سويت' : 'Suite'
    if (type === 'double') return isArabic ? 'مزدوج' : 'Double'
    return isArabic ? 'فردي' : 'Single'
  }

  const toggleService = (value) => {
    setDraft((prev) => {
      const has = prev.services.includes(value)
      return {
        ...prev,
        services: has ? prev.services.filter((s) => s !== value) : [...prev.services, value],
      }
    })
  }

  const updateDraft = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }))

  const formatServices = (ids) =>
    serviceOptions
      .filter((o) => ids.includes(o.value))
      .map((o) => o.label)
      .join(isArabic ? '، ' : ', ')

  const handleAdd = () => {
    const price = Number(draft.unitPrice) || 0
    const count = Number(draft.unitsCount) || 1
    const total = price * count
    const id = String(Date.now())
    setRows((prev) => [
      ...prev,
      {
        id,
        ...draft,
        servicesLabelAr: formatServices(draft.services),
        servicesLabelEn: formatServices(draft.services),
        total,
      },
    ])
    setDraft({ ...EMPTY_LINE, services: ['breakfast_only'] })
  }

  const handleDelete = (id) => setRows((prev) => prev.filter((r) => r.id !== id))

  const grandTotal = rows.reduce((sum, r) => sum + (r.total || 0), 0)

  return (
    <div className="space-y-4">
      <div className={panelClass}>
        <div className="mb-5 flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#ccfbf1] text-[#0d9488]">
            <Building2 className="h-4 w-4" />
          </span>
          <h2 className="m-0 text-base font-semibold text-[#111827]">
            {t('newBooking.stay.detailsTitle')}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <FieldLabel required>{t('newBooking.stay.unitType')}</FieldLabel>
              <select
                className={selectClass}
                value={draft.unitType}
                onChange={(e) => updateDraft('unitType', e.target.value)}
              >
                <option value="single">{isArabic ? 'فردي' : 'Single'}</option>
                <option value="double">{isArabic ? 'مزدوج' : 'Double'}</option>
                <option value="suite">{isArabic ? 'سويت' : 'Suite'}</option>
              </select>
            </div>
            <div>
              <FieldLabel required>{t('newBooking.stay.unitsCount')}</FieldLabel>
              <NumStepper
                value={draft.unitsCount}
                onChange={(v) => updateDraft('unitsCount', v)}
                min={1}
              />
            </div>
            <div>
              <FieldLabel required>{t('newBooking.stay.unitPrice')}</FieldLabel>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  className={cn(inputClass, 'pe-14')}
                  value={draft.unitPrice}
                  onChange={(e) => updateDraft('unitPrice', e.target.value)}
                  placeholder="0"
                />
                <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-[#9ca3af]">
                  {t('newBooking.stay.currency')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <FieldLabel required>{t('newBooking.stay.arrivalDate')}</FieldLabel>
              <div className="relative">
                <input
                  type="text"
                  className={inputClass}
                  value={draft.arrivalDate}
                  onChange={(e) => updateDraft('arrivalDate', e.target.value)}
                  placeholder={t('newBooking.placeholders.bookingDate')}
                />
                <Calendar className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
              </div>
            </div>
            <div>
              <FieldLabel required>{t('newBooking.stay.departureDate')}</FieldLabel>
              <div className="relative">
                <input
                  type="text"
                  className={inputClass}
                  value={draft.departureDate}
                  onChange={(e) => updateDraft('departureDate', e.target.value)}
                  placeholder={t('newBooking.placeholders.bookingDate')}
                />
                <Calendar className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
              </div>
            </div>
            <div>
              <FieldLabel required>{t('newBooking.stay.adults')}</FieldLabel>
              <NumStepper value={draft.adults} onChange={(v) => updateDraft('adults', v)} min={1} />
            </div>
            <div>
              <FieldLabel required>{t('newBooking.stay.children')}</FieldLabel>
              <NumStepper
                value={draft.children}
                onChange={(v) => updateDraft('children', v)}
                min={0}
              />
            </div>
          </div>

          <div>
            <FieldLabel>{t('newBooking.stay.lineNotes')}</FieldLabel>
            <textarea
              rows={3}
              className={cn(inputClass, 'resize-none pe-3')}
              value={draft.notes}
              onChange={(e) => updateDraft('notes', e.target.value)}
              placeholder={t('newBooking.stay.notesPlaceholder')}
            />
          </div>

          <div>
            <FieldLabel required>{t('newBooking.stay.servicesTitle')}</FieldLabel>
            <div className="flex flex-wrap gap-x-5 gap-y-3 rounded-xl border border-[#e8ecf2] bg-[#f8fafc] p-4">
              {serviceOptions.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-[#374151]"
                >
                  <input
                    type="checkbox"
                    checked={draft.services.includes(opt.value)}
                    onChange={() => toggleService(opt.value)}
                    className="h-4 w-4 rounded border-[#d1d5db] accent-brand-primary"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0d9488] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0f766e]"
            >
              <Plus className="h-4 w-4" />
              {t('newBooking.stay.add')}
            </button>
          </div>
        </div>
      </div>

      <div className={cn(panelClass, 'overflow-hidden p-0')}>
        <div className="overflow-x-auto">
          <Table className="min-w-[900px] border-0">
            <TableHeader>
              <TableRow className="bg-[#f8fafc] hover:bg-[#f8fafc]">
                <TableHead className="text-center text-xs font-semibold text-[#374151]">#</TableHead>
                <TableHead className="text-start text-xs font-semibold text-[#374151]">
                  {t('newBooking.stay.unitType')}
                </TableHead>
                <TableHead className="text-center text-xs font-semibold text-[#374151]">
                  {t('newBooking.stay.unitsCount')}
                </TableHead>
                <TableHead className="text-center text-xs font-semibold text-[#374151]">
                  {t('newBooking.stay.unitPrice')}
                </TableHead>
                <TableHead className="text-center text-xs font-semibold text-[#374151]">
                  {t('newBooking.stay.arrivalDate')}
                </TableHead>
                <TableHead className="text-center text-xs font-semibold text-[#374151]">
                  {t('newBooking.stay.departureDate')}
                </TableHead>
                <TableHead className="text-center text-xs font-semibold text-[#374151]">
                  {t('newBooking.stay.adults')}
                </TableHead>
                <TableHead className="text-center text-xs font-semibold text-[#374151]">
                  {t('newBooking.stay.children')}
                </TableHead>
                <TableHead className="text-start text-xs font-semibold text-[#374151]">
                  {t('newBooking.stay.servicesTitle')}
                </TableHead>
                <TableHead className="text-center text-xs font-semibold text-[#374151]">
                  {t('newBooking.stay.totalPrice')}
                </TableHead>
                <TableHead className="text-center text-xs font-semibold text-[#374151]">
                  {t('newBooking.stay.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.id} className="border-b border-[#f1f5f9]">
                  <TableCell className="text-center text-sm text-[#6b7280]">{index + 1}</TableCell>
                  <TableCell className="text-sm font-medium text-[#111827]">
                    {unitTypeLabel(row.unitType)}
                  </TableCell>
                  <TableCell className="text-center text-sm">{row.unitsCount}</TableCell>
                  <TableCell className="text-center text-sm">
                    {row.unitPrice} {t('newBooking.stay.currency')}
                  </TableCell>
                  <TableCell className="text-center text-sm text-[#6b7280]">{row.arrivalDate}</TableCell>
                  <TableCell className="text-center text-sm text-[#6b7280]">
                    {row.departureDate}
                  </TableCell>
                  <TableCell className="text-center text-sm">{row.adults}</TableCell>
                  <TableCell className="text-center text-sm">{row.children}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-sm text-[#6b7280]">
                    {isArabic ? row.servicesLabelAr : row.servicesLabelEn}
                  </TableCell>
                  <TableCell className="text-center text-sm font-semibold text-[#111827]">
                    {row.total?.toLocaleString()} {t('newBooking.stay.currency')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#16a34a] transition-colors hover:bg-[#dcfce7]"
                        aria-label={t('newBooking.stay.edit')}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#dc2626] transition-colors hover:bg-[#fef2f2]"
                        aria-label={t('newBooking.stay.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t border-[#e8ecf2] bg-[#f8fafc] px-4 py-3">
          <span className="text-sm font-bold text-[#111827]">
            {grandTotal.toLocaleString()} {t('newBooking.stay.currency')}
          </span>
          <span className="text-sm font-semibold text-[#374151]">{t('newBooking.stay.grandTotal')}</span>
        </div>
      </div>
    </div>
  )
}

export default NewBookingStayStep
