import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BedDouble,
  Briefcase,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Flag,
  Hash,
  IdCard,
  ImagePlus,
  Phone,
  Search,
  Settings2,
  User,
  UserSearch,
  Users,
  X,
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion.jsx'
import NewBookingStayStep from './NewBookingStayStep.jsx'
import NewBookingPaymentStep from './NewBookingPaymentStep.jsx'
import { cn } from '../lib/utils'

const STEP_ORDER = ['individuals', 'booking', 'payment']

const EMPTY_FORM = {
  bookingNumber: '',
  bookingDate: '',
  fullName: '',
  idType: '',
  idNumber: '',
  birthDate: '',
  whatsappPhone: '',
  localPhone: '',
  gender: '',
  nationality: '',
  profession: '',
  visitPurpose: '',
  clientNotes: '',
  bookingSource: '',
  notes: '',
}

const EXISTING_CLIENTS = [
  {
    id: '1',
    labelAr: 'سعيد محمد علي — 925666666',
    labelEn: 'Saeed Mohammed Ali — 925666666',
    bookingNumber: '74',
    bookingDate: '06 / 04 / 2026',
    fullNameAr: 'سعيد محمد علي',
    fullNameEn: 'Saeed Mohammed Ali',
    idType: 'national_id',
    idNumber: '1987654321',
    birthDate: '15 / 03 / 1988',
    whatsappPhone: '925666666',
    localPhone: '0212345678',
    gender: 'male',
    nationality: 'ly',
    professionAr: 'مهندس',
    professionEn: 'Engineer',
    visitPurpose: 'tourism',
    clientNotes: 'عميل دائم',
    bookingSource: 'direct',
    notes: '',
  },
  {
    id: '2',
    labelAr: 'فاطمة أحمد حسن — 918887776',
    labelEn: 'Fatima Ahmed Hassan — 918887776',
    bookingNumber: '82',
    bookingDate: '10 / 05 / 2026',
    fullNameAr: 'فاطمة أحمد حسن',
    fullNameEn: 'Fatima Ahmed Hassan',
    idType: 'passport',
    idNumber: 'P88442211',
    birthDate: '22 / 08 / 1992',
    whatsappPhone: '918887776',
    localPhone: '0223456789',
    gender: 'female',
    nationality: 'eg',
    professionAr: 'طبيبة',
    professionEn: 'Doctor',
    visitPurpose: 'business',
    clientNotes: '',
    bookingSource: 'direct',
    notes: 'يفضل غرفة هادئة',
  },
  {
    id: '3',
    labelAr: 'خالد عمر السعدي — 935551122',
    labelEn: 'Khaled Omar Alsaadi — 935551122',
    bookingNumber: '91',
    bookingDate: '01 / 06 / 2026',
    fullNameAr: 'خالد عمر السعدي',
    fullNameEn: 'Khaled Omar Alsaadi',
    idType: 'national_id',
    idNumber: '2998877665',
    birthDate: '05 / 11 / 1985',
    whatsappPhone: '935551122',
    localPhone: '0234567890',
    gender: 'male',
    nationality: 'sa',
    professionAr: 'تاجر',
    professionEn: 'Merchant',
    visitPurpose: 'tourism',
    clientNotes: 'حساسية من المكسرات',
    bookingSource: 'agent',
    notes: '',
  },
]

function clientToForm(client, isArabic) {
  if (!client) return { ...EMPTY_FORM }
  return {
    bookingNumber: client.bookingNumber,
    bookingDate: client.bookingDate,
    fullName: isArabic ? client.fullNameAr : client.fullNameEn,
    idType: client.idType,
    idNumber: client.idNumber,
    birthDate: client.birthDate,
    whatsappPhone: client.whatsappPhone,
    localPhone: client.localPhone,
    gender: client.gender,
    nationality: client.nationality,
    profession: isArabic ? client.professionAr : client.professionEn,
    visitPurpose: client.visitPurpose,
    clientNotes: client.clientNotes,
    bookingSource: client.bookingSource,
    notes: client.notes,
  }
}

const panelClass =
  'rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm sm:p-5'

const inputClass =
  'w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-3 ps-3 pe-10 text-sm text-[#374151] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary'

const selectClass =
  'w-full appearance-none rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-3 ps-3 pe-10 text-sm text-[#374151] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary'

function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#374151]">
      {children}
      {required && <span className="text-[#dc2626]"> *</span>}
    </label>
  )
}

function IconInput({ icon: Icon, className, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <input className={inputClass} {...props} />
      <Icon className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
    </div>
  )
}

function IconSelect({ icon: Icon, children, className, ...props }) {
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

function SectionHeader({ icon: Icon, iconBg, iconColor, title, className }) {
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

function AccordionChevron() {
  return (
    <ChevronDown
      className="h-5 w-5 shrink-0 text-[#6b7280] transition-transform duration-200 group-data-[state=open]:rotate-180"
      aria-hidden
    />
  )
}

const formRowClass =
  'rounded-xl border border-[#e8ecf2] bg-linear-to-b from-[#fafbfd] to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]'

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

function FormRow({ icon: Icon, title, hint, children, accent = 'bg-[#eef2ff] text-brand-primary' }) {
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

function NewBookingPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isArabic = i18n.language === 'ar'
  const [bookingType, setBookingType] = useState('client')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExistingClientId, setSelectedExistingClientId] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [currentStep, setCurrentStep] = useState('individuals')

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleExistingClientChange = (e) => {
    const id = e.target.value
    setSelectedExistingClientId(id)
    if (!id) {
      setForm({ ...EMPTY_FORM })
      return
    }
    const client = EXISTING_CLIENTS.find((c) => c.id === id)
    if (client) {
      setForm(clientToForm(client, isArabic))
    }
  }

  const showBookingMeta = !selectedExistingClientId
  const selectedClient = EXISTING_CLIENTS.find((c) => c.id === selectedExistingClientId)

  const clearExistingClient = () => {
    setSelectedExistingClientId('')
    setForm({ ...EMPTY_FORM })
  }

  const bookingTypeOptions = [
    { value: 'client', label: t('newBooking.fields.client'), icon: User },
    { value: 'companies', label: t('newBooking.fields.companies'), icon: Building2 },
  ]

  const pageHeader =
    currentStep === 'booking'
      ? { title: t('newBooking.stay.title'), subtitle: t('newBooking.stay.subtitle') }
      : currentStep === 'payment'
        ? { title: t('newBooking.payment.title'), subtitle: t('newBooking.payment.subtitle') }
        : { title: t('newBooking.title'), subtitle: t('newBooking.subtitle') }

  const handleNext = () => {
    if (currentStep === 'individuals') setCurrentStep('booking')
    else if (currentStep === 'booking') setCurrentStep('payment')
  }

  const handleBack = () => {
    if (currentStep === 'booking') setCurrentStep('individuals')
    else if (currentStep === 'payment') setCurrentStep('booking')
    else navigate('/bookings')
  }

  return (
    <section className="mx-auto max-w-[1200px] space-y-4">
      <header className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#dff2e9] text-[#059669]">
          <CalendarDays className="h-5 w-5" />
        </span>
        <div>
          <h1 className="m-0 text-xl font-bold text-[#111827] sm:text-2xl">{pageHeader.title}</h1>
          <p className="mt-0.5 text-sm text-[#6b7280]">{pageHeader.subtitle}</p>
        </div>
      </header>

      <BookingStepper currentStep={currentStep} t={t} />

      {currentStep === 'individuals' && (
        <>

      <div className={panelClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover sm:order-first"
          >
            <Search className="h-4 w-4" />
            {t('newBooking.search')}
          </button>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('newBooking.searchPlaceholder')}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className={cn(panelClass, 'space-y-3')}>
        <FormRow
          icon={Users}
          title={
            <>
              {t('newBooking.fields.bookingType')}
              <span className="text-[#dc2626]"> *</span>
            </>
          }
          hint={t('newBooking.hints.bookingType')}
          accent="bg-[#eef2ff] text-brand-primary"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {bookingTypeOptions.map((opt) => {
              const Icon = opt.icon
              const isActive = bookingType === opt.value
              return (
                <label
                  key={opt.value}
                  className={cn(
                    'flex cursor-pointer items-center justify-center gap-2.5 rounded-xl border px-4 py-3.5 text-sm font-medium transition-all',
                    isActive
                      ? 'border-brand-primary/35 bg-white text-brand-primary shadow-sm ring-2 ring-brand-primary/12'
                      : 'border-[#e8ecf2] bg-[#f8fafc] text-[#6b7280] hover:border-[#d1d9e6] hover:bg-white hover:text-[#374151]'
                  )}
                >
                  <input
                    type="radio"
                    name="bookingType"
                    value={opt.value}
                    checked={isActive}
                    onChange={() => setBookingType(opt.value)}
                    className="sr-only"
                  />
                  <Icon className="h-4 w-4 shrink-0" />
                  {opt.label}
                </label>
              )
            })}
          </div>
        </FormRow>

        <FormRow
          icon={UserSearch}
          title={t('newBooking.fields.existingClient')}
          hint={t('newBooking.hints.existingClient')}
          accent="bg-[#e0f2fe] text-[#0284c7]"
        >
          <IconSelect
            value={selectedExistingClientId}
            onChange={handleExistingClientChange}
            className={cn(
              selectedExistingClientId &&
                '[&_select]:border-[#86efac] [&_select]:ring-2 [&_select]:ring-[#bbf7d0]'
            )}
          >
            <option value="">{t('newBooking.placeholders.existingClient')}</option>
            {EXISTING_CLIENTS.map((client) => (
              <option key={client.id} value={client.id}>
                {isArabic ? client.labelAr : client.labelEn}
              </option>
            ))}
          </IconSelect>

          {selectedClient ? (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2.5">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#16a34a]" />
              <div className="min-w-0 flex-1">
                <p className="m-0 text-sm font-medium text-[#166534]">
                  {t('newBooking.clientLoaded')}
                </p>
                <p className="m-0 truncate text-xs text-[#16a34a]">
                  {isArabic ? selectedClient.fullNameAr : selectedClient.fullNameEn}
                </p>
              </div>
              <button
                type="button"
                onClick={clearExistingClient}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#16a34a] transition-colors hover:bg-[#dcfce7]"
                aria-label={t('newBooking.clearClient')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </FormRow>

        {showBookingMeta ? (
          <FormRow
            icon={Hash}
            title={t('newBooking.sections.newBookingDetails')}
            hint={t('newBooking.hints.newBookingDetails')}
            accent="bg-[#fef3c7] text-[#d97706]"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel required>{t('newBooking.fields.bookingNumber')}</FieldLabel>
                <div className="relative">
                  <input
                    type="text"
                    className={inputClass}
                    value={form.bookingNumber}
                    onChange={(e) => updateField('bookingNumber', e.target.value)}
                    placeholder={t('newBooking.placeholders.bookingNumber')}
                  />
                  <Hash className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                </div>
              </div>
              <div>
                <FieldLabel required>{t('newBooking.fields.bookingDate')}</FieldLabel>
                <div className="relative">
                  <input
                    type="text"
                    className={inputClass}
                    value={form.bookingDate}
                    onChange={(e) => updateField('bookingDate', e.target.value)}
                    placeholder={t('newBooking.placeholders.bookingDate')}
                  />
                  <Calendar className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                </div>
              </div>
            </div>
          </FormRow>
        ) : null}
      </div>

      <div className={panelClass}>
        <SectionHeader
          icon={User}
          iconBg="bg-[#dbeafe]"
          iconColor="text-[#2563eb]"
          title={t('newBooking.sections.personal')}
        />
        <div className="space-y-4">
          <div>
            <FieldLabel required>{t('newBooking.fields.fullName')}</FieldLabel>
            <IconInput
              icon={User}
              type="text"
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder={t('newBooking.placeholders.fullName')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <FieldLabel required>{t('newBooking.fields.idType')}</FieldLabel>
              <IconSelect
                value={form.idType}
                onChange={(e) => updateField('idType', e.target.value)}
              >
                <option value="">{t('newBooking.placeholders.idType')}</option>
                <option value="national_id">{isArabic ? 'بطاقة وطنية' : 'National ID'}</option>
                <option value="passport">{isArabic ? 'جواز سفر' : 'Passport'}</option>
              </IconSelect>
            </div>
            <div>
              <FieldLabel required>{t('newBooking.fields.idNumber')}</FieldLabel>
              <IconInput
                icon={IdCard}
                type="text"
                value={form.idNumber}
                onChange={(e) => updateField('idNumber', e.target.value)}
                placeholder={t('newBooking.placeholders.idNumber')}
              />
            </div>
            <div>
              <FieldLabel required>{t('newBooking.fields.idPhoto')}</FieldLabel>
              <button
                type="button"
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e2e8f0] bg-[#f8fafc] py-6 text-[#9ca3af] transition-colors hover:border-brand-primary/40 hover:bg-[#eef2ff]"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs">{t('newBooking.fields.uploadId')}</span>
              </button>
            </div>
            <div>
              <FieldLabel required>{t('newBooking.fields.birthDate')}</FieldLabel>
              <IconInput
                icon={Calendar}
                type="text"
                value={form.birthDate}
                onChange={(e) => updateField('birthDate', e.target.value)}
                placeholder={t('newBooking.placeholders.birthDate')}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <FieldLabel required>{t('newBooking.fields.whatsappPhone')}</FieldLabel>
              <IconInput
                icon={Phone}
                type="tel"
                dir="ltr"
                value={form.whatsappPhone}
                onChange={(e) => updateField('whatsappPhone', e.target.value)}
                placeholder={t('newBooking.placeholders.whatsappPhone')}
              />
            </div>
            <div>
              <FieldLabel required>{t('newBooking.fields.localPhone')}</FieldLabel>
              <IconInput
                icon={Phone}
                type="tel"
                dir="ltr"
                value={form.localPhone}
                onChange={(e) => updateField('localPhone', e.target.value)}
                placeholder={t('newBooking.placeholders.localPhone')}
              />
            </div>
            <div>
              <FieldLabel required>{t('newBooking.fields.gender')}</FieldLabel>
              <IconSelect value={form.gender} onChange={(e) => updateField('gender', e.target.value)}>
                <option value="">{t('newBooking.placeholders.gender')}</option>
                <option value="male">{isArabic ? 'ذكر' : 'Male'}</option>
                <option value="female">{isArabic ? 'أنثى' : 'Female'}</option>
              </IconSelect>
            </div>
            <div>
              <FieldLabel required>{t('newBooking.fields.nationality')}</FieldLabel>
              <IconSelect
                icon={Flag}
                value={form.nationality}
                onChange={(e) => updateField('nationality', e.target.value)}
              >
                <option value="">{t('newBooking.placeholders.nationality')}</option>
                <option value="ly">{isArabic ? 'ليبيا' : 'Libya'}</option>
                <option value="eg">{isArabic ? 'مصر' : 'Egypt'}</option>
                <option value="sa">{isArabic ? 'السعودية' : 'Saudi Arabia'}</option>
              </IconSelect>
            </div>
          </div>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={['additional', 'extra']} className="space-y-4">
        <AccordionItem value="additional" className={cn(panelClass, 'border-b-0')}>
          <AccordionTrigger className="group flex w-full items-center justify-between gap-3 py-0 hover:no-underline">
            <SectionHeader
              icon={Briefcase}
              iconBg="bg-[#ffedd5]"
              iconColor="text-[#ea580c]"
              title={t('newBooking.sections.additional')}
              className="mb-0"
            />
            <AccordionChevron />
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>{t('newBooking.fields.profession')}</FieldLabel>
                <IconInput
                  icon={Briefcase}
                  type="text"
                  value={form.profession}
                  onChange={(e) => updateField('profession', e.target.value)}
                  placeholder={t('newBooking.placeholders.profession')}
                />
              </div>
              <div>
                <FieldLabel>{t('newBooking.fields.visitPurpose')}</FieldLabel>
                <IconSelect
                  value={form.visitPurpose}
                  onChange={(e) => updateField('visitPurpose', e.target.value)}
                >
                  <option value="">{t('newBooking.placeholders.visitPurpose')}</option>
                  <option value="tourism">{isArabic ? 'سياحة' : 'Tourism'}</option>
                  <option value="business">{isArabic ? 'عمل' : 'Business'}</option>
                </IconSelect>
              </div>
            </div>
            <div className="mt-4">
              <FieldLabel>{t('newBooking.fields.clientNotes')}</FieldLabel>
              <textarea
                rows={4}
                className={cn(inputClass, 'resize-none pe-3')}
                value={form.clientNotes}
                onChange={(e) => updateField('clientNotes', e.target.value)}
                placeholder={t('newBooking.placeholders.clientNotes')}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="extra" className={cn(panelClass, 'border-b-0')}>
          <AccordionTrigger className="group flex w-full items-center justify-between gap-3 py-0 hover:no-underline">
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
              <SectionHeader
                icon={Settings2}
                iconBg="bg-[#ede9fe]"
                iconColor="text-[#7c3aed]"
                title={t('newBooking.sections.extra')}
                className="mb-0"
              />
              <span className="text-xs text-[#9ca3af]">{t('newBooking.sections.extraHint')}</span>
            </div>
            <AccordionChevron />
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>{t('newBooking.fields.bookingSource')}</FieldLabel>
                <IconSelect
                  value={form.bookingSource}
                  onChange={(e) => updateField('bookingSource', e.target.value)}
                >
                  <option value="">{t('newBooking.placeholders.bookingSource')}</option>
                  <option value="direct">{t('newBooking.fields.direct')}</option>
                  <option value="agent">{isArabic ? 'وكيل' : 'Agent'}</option>
                </IconSelect>
              </div>
              <div>
                <FieldLabel>{t('newBooking.fields.notes')}</FieldLabel>
                <input
                  type="text"
                  className={inputClass}
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder={t('newBooking.placeholders.notes')}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
        </>
      )}

      {currentStep === 'booking' && <NewBookingStayStep />}

      {currentStep === 'payment' && <NewBookingPaymentStep />}

      {currentStep === 'payment' ? (
        <div className={cn(panelClass, 'flex flex-col gap-3 sm:flex-row sm:flex-wrap')}>
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover sm:min-w-[140px]"
          >
            {t('newBooking.payment.confirmBooking')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/allocation')}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#0d9488] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0f766e] sm:min-w-[140px]"
          >
            {t('newBooking.payment.goToAllocation')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#fecaca] bg-white px-6 py-3 text-sm font-medium text-[#dc2626] transition-colors hover:bg-[#fef2f2] sm:min-w-[140px]"
          >
            {t('newBooking.payment.cancel')}
          </button>
        </div>
      ) : (
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
              onClick={handleNext}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover sm:flex-none"
            >
              {t('newBooking.next')}
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center justify-center gap-2 self-end rounded-xl border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-medium text-[#6b7280] transition-colors hover:bg-[#f8fafc] sm:self-auto"
          >
            <ChevronRight className="h-4 w-4" />
            {t('newBooking.back')}
          </button>
        </div>
      )}
    </section>
  )
}

export default NewBookingPage
