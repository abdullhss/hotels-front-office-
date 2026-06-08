import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Flag,
  Hash,
  IdCard,
  ImagePlus,
  Mail,
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
} from '../../components/ui/accordion.jsx'
import NewBookingStayStep from './components/NewBookingStayStep.jsx'
import NewBookingPaymentStep from './components/NewBookingPaymentStep.jsx'
import BookingStepper from './components/BookingStepper.jsx'
import NewBookingStepFooter from './components/NewBookingStepFooter.jsx'
import {
  AccordionChevron,
  FieldLabel,
  FormRow,
  IconDateInput,
  IconInput,
  IconSelect,
  SectionHeader,
} from './components/BookingFormFields.jsx'
import { getTodayIso, isTodayOrFuture, toInputDateValue } from './dateUtils.js'
import { STEP_ORDER } from './bookingData.js'
import useAgentsSimple, { getAgentDetails } from '../../Hooks/GetAgents.js'
import useCustomersSimple, { getCustomerDetails } from '../../Hooks/GetCustomers.js'
import useNationalities from '../../Hooks/GetNationalities.js'
import useBookingTypes from '../../Hooks/GetBookingTypes.js'
import {
  saveReservationFromBooking,
  validateReservationBooking,
} from '../../Hooks/GetReservations.js'
import {
  agentRowToBookingForm,
  customerRowToBookingForm,
  EMPTY_FORM,
} from './bookingData.js'
import { sanitizeNameInput } from '../../lib/nameValidation.js'
import {
  NATIONAL_ID_LENGTH,
  sanitizeNationalIdInput,
  shouldSanitizeAsNationalId,
} from '../../lib/nationalIdValidation.js'
import { iconInputClass, inputClass, panelClass } from './bookingStyles.js'
import { cn } from '../../lib/utils'


function NewBookingPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isArabic = i18n.language === 'ar'
  const { customers, loading: customersLoading } = useCustomersSimple()
  const { agents, loading: agentsLoading } = useAgentsSimple()
  const { nationalities, loading: nationalitiesLoading } = useNationalities()
  const { bookingTypes, loading: bookingTypesLoading } = useBookingTypes()
  const idFileInputRef = useRef(null)

  const [bookingType, setBookingType] = useState('client')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExistingClientId, setSelectedExistingClientId] = useState('')
  const [loadedExistingName, setLoadedExistingName] = useState('')
  const [loadingExistingDetails, setLoadingExistingDetails] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [idFile, setIdFile] = useState(null)
  const [idFileName, setIdFileName] = useState('')
  const [stayGrandTotal, setStayGrandTotal] = useState(0)
  const [stayRows, setStayRows] = useState([])
  const [downPayment, setDownPayment] = useState('')
  const [savingReservation, setSavingReservation] = useState(false)
  const [currentStep, setCurrentStep] = useState('individuals')

  const isCompanies = bookingType === 'companies'
  const existingOptions = (isCompanies ? agents : customers).filter((item) => item.id > 0)
  const existingListLoading = isCompanies ? agentsLoading : customersLoading

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const clearIdFile = () => {
    setIdFile(null)
    setIdFileName('')
    if (idFileInputRef.current) idFileInputRef.current.value = ''
  }

  const handleIdFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIdFile(file)
    setIdFileName(file.name)
  }

  const handleBookingTypeChange = (type) => {
    setBookingType(type)
    setSelectedExistingClientId('')
    setLoadedExistingName('')
    setForm({ ...EMPTY_FORM })
    clearIdFile()
  }

  const formatExistingOptionLabel = (item) => {
    const name = isArabic ? item.nameAr : item.nameEn || item.nameAr
    const phone = isCompanies
      ? item.whatsapp || item.phone1 || ''
      : item.whatsUp || item.mobile || ''
    return phone ? `${name} — ${phone}` : name
  }

  const handleExistingClientChange = async (e) => {
    const id = e.target.value
    setSelectedExistingClientId(id)
    setLoadedExistingName('')
    if (!id) {
      setForm({ ...EMPTY_FORM })
      clearIdFile()
      return
    }

    clearIdFile()

    setLoadingExistingDetails(true)
    try {
      if (isCompanies) {
        const { success, agent, error } = await getAgentDetails(id)
        if (!success || !agent) {
          toast.error(error ?? (isArabic ? 'تعذر تحميل بيانات الشركة' : 'Failed to load company'))
          setSelectedExistingClientId('')
          return
        }
        setForm(agentRowToBookingForm(agent, isArabic))
        setLoadedExistingName(isArabic ? agent.nameAr : agent.nameEn || agent.nameAr)
        return
      }

      const { success, customer, error } = await getCustomerDetails(id)
      if (!success || !customer) {
        toast.error(error ?? (isArabic ? 'تعذر تحميل بيانات العميل' : 'Failed to load customer'))
        setSelectedExistingClientId('')
        return
      }
      setForm(customerRowToBookingForm(customer, isArabic))
      setLoadedExistingName(isArabic ? customer.nameAr : customer.nameEn || customer.nameAr)
    } finally {
      setLoadingExistingDetails(false)
    }
  }

  const hasSelectedExisting = Boolean(selectedExistingClientId && loadedExistingName)

  const clearExistingClient = () => {
    setSelectedExistingClientId('')
    setLoadedExistingName('')
    setForm({ ...EMPTY_FORM })
    clearIdFile()
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
    if (currentStep === 'individuals') {
      const bookingDate = toInputDateValue(form.bookingDate)
      if (bookingDate && !isTodayOrFuture(bookingDate)) {
        toast.error(t('common.validation.bookingDateTodayOrFuture'))
        return
      }
      setCurrentStep('booking')
    } else if (currentStep === 'booking') {
      if (stayGrandTotal <= 0) {
        toast.error(
          isArabic
            ? 'أضف وحدة واحدة على الأقل من تفاصيل الإقامة'
            : 'Add at least one stay line before continuing'
        )
        return
      }
      setCurrentStep('payment')
    }
  }

  const handleBack = () => {
    if (currentStep === 'booking') setCurrentStep('individuals')
    else if (currentStep === 'payment') setCurrentStep('booking')
    else navigate('/bookings')
  }

  const handleStepClick = (stepKey) => {
    const targetIdx = STEP_ORDER.indexOf(stepKey)
    const currentIdx = STEP_ORDER.indexOf(currentStep)
    if (targetIdx < 0 || targetIdx >= currentIdx) return
    setCurrentStep(stepKey)
  }

  const handleConfirmBooking = async () => {
    const { valid, errors } = validateReservationBooking({
      form,
      bookingType,
      selectedPartyId: selectedExistingClientId,
      stayRows,
      stayGrandTotal,
      downPayment,
      idFile,
      isArabic,
    })

    if (!valid) {
      toast.error(errors[0])
      return
    }

    setSavingReservation(true)
    try {
      const result = await saveReservationFromBooking({
        form,
        bookingType,
        selectedPartyId: selectedExistingClientId,
        stayRows,
        stayGrandTotal,
        downPayment,
        idFile,
      })

      if (!result.success) {
        toast.error(result.errorMessage ?? (isArabic ? 'فشل حفظ الحجز' : 'Failed to save booking'))
        return
      }

      toast.success(isArabic ? 'تم تأكيد الحجز بنجاح' : 'Booking confirmed successfully')
      navigate('/bookings')
    } catch (e) {
      toast.error(e?.message ?? (isArabic ? 'فشل حفظ الحجز' : 'Failed to save booking'))
    } finally {
      setSavingReservation(false)
    }
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

      <BookingStepper currentStep={currentStep} t={t} onStepClick={handleStepClick} />

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
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" aria-hidden />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('newBooking.searchPlaceholder')}
              className={iconInputClass}
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
                    onChange={() => handleBookingTypeChange(opt.value)}
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
          title={
            isCompanies
              ? t('newBooking.fields.existingCompany')
              : t('newBooking.fields.existingClient')
          }
          hint={t('newBooking.hints.existingClient')}
          accent="bg-[#e0f2fe] text-[#0284c7]"
        >
          <IconSelect
            value={selectedExistingClientId}
            onChange={handleExistingClientChange}
            disabled={existingListLoading || loadingExistingDetails}
            className={cn(
              selectedExistingClientId &&
                '[&_select]:border-[#86efac] [&_select]:ring-2 [&_select]:ring-[#bbf7d0]'
            )}
          >
            <option value="">
              {existingListLoading || loadingExistingDetails
                ? isArabic
                  ? 'جاري التحميل...'
                  : 'Loading…'
                : isCompanies
                  ? t('newBooking.placeholders.existingClient')
                  : t('newBooking.placeholders.existingClient')}
            </option>
            {existingOptions.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {formatExistingOptionLabel(item)}
              </option>
            ))}
          </IconSelect>

          {hasSelectedExisting ? (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2.5">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#16a34a]" />
              <div className="min-w-0 flex-1">
                <p className="m-0 text-sm font-medium text-[#166534]">
                  {isCompanies
                    ? t('customers.addCustomerForm.companyLoaded')
                    : t('newBooking.clientLoaded')}
                </p>
                <p className="m-0 truncate text-xs text-[#16a34a]">{loadedExistingName}</p>
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

        <FormRow
          icon={Hash}
          title={t('newBooking.sections.newBookingDetails')}
          hint={t('newBooking.hints.newBookingDetails')}
          accent="bg-[#fef3c7] text-[#d97706]"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <FieldLabel required>{t('newBooking.fields.bookingNumber')}</FieldLabel>
              <div className="relative">
                <input
                  type="text"
                  className={iconInputClass}
                  value={form.bookingNumber}
                  onChange={(e) => updateField('bookingNumber', e.target.value)}
                  placeholder={t('newBooking.placeholders.bookingNumber')}
                />
                <Hash className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" aria-hidden />
              </div>
            </div>
            <div>
              <FieldLabel required>{t('newBooking.fields.bookingDate')}</FieldLabel>
              <IconDateInput
                value={toInputDateValue(form.bookingDate)}
                min={getTodayIso()}
                onChange={(e) => updateField('bookingDate', e.target.value)}
              />
            </div>
            <div>
              <FieldLabel required>{t('newBooking.fields.reservationType')}</FieldLabel>
              <IconSelect
                value={form.reservationTypeId}
                onChange={(e) => updateField('reservationTypeId', e.target.value)}
                disabled={bookingTypesLoading}
              >
                <option value="">
                  {bookingTypesLoading
                    ? isArabic
                      ? 'جاري التحميل...'
                      : 'Loading…'
                    : t('newBooking.placeholders.reservationType')}
                </option>
                {bookingTypes.map((bt) => {
                  const typeId = bt.Id ?? bt.id
                  return (
                    <option key={typeId} value={String(typeId)}>
                      {isArabic
                        ? bt.TypeNameA ?? bt.typeNameA
                        : bt.TypeNameE ?? bt.typeNameE}
                    </option>
                  )
                })}
              </IconSelect>
            </div>
          </div>
        </FormRow>
      </div>

      {!isCompanies && !hasSelectedExisting ? (
      <div className={panelClass}>
        <SectionHeader
          icon={User}
          iconBg="bg-[#dbeafe]"
          iconColor="text-[#2563eb]"
          title={t('newBooking.sections.personal')}
        />
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel required>{t('newBooking.fields.fullName')}</FieldLabel>
              <IconInput
                icon={User}
                type="text"
                value={form.fullName}
                onChange={(e) => updateField('fullName', sanitizeNameInput(e.target.value))}
                placeholder={t('newBooking.placeholders.fullName')}
              />
            </div>
            <div>
              <FieldLabel>{t('newBooking.fields.email')}</FieldLabel>
              <IconInput
                icon={Mail}
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder={t('newBooking.placeholders.email')}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <FieldLabel required>{t('newBooking.fields.idType')}</FieldLabel>
              <IconSelect
                value={form.idType}
                onChange={(e) => updateField('idType', e.target.value)}
              >
                <option value="">{t('newBooking.placeholders.idType')}</option>
                <option value="national_id">{isArabic ? 'بطاقة وطنية' : 'National ID'}</option>
                <option value="passport">{isArabic ? 'جواز سفر' : 'Passport'}</option>
                <option value="residency">{isArabic ? 'إقامة' : 'Residency'}</option>
              </IconSelect>
            </div>
            <div>
              <FieldLabel required>{t('newBooking.fields.idNumber')}</FieldLabel>
              <IconInput
                icon={IdCard}
                type="text"
                inputMode={shouldSanitizeAsNationalId(form.idType) ? 'numeric' : 'text'}
                maxLength={shouldSanitizeAsNationalId(form.idType) ? NATIONAL_ID_LENGTH : undefined}
                value={form.idNumber}
                onChange={(e) =>
                  updateField(
                    'idNumber',
                    shouldSanitizeAsNationalId(form.idType)
                      ? sanitizeNationalIdInput(e.target.value)
                      : e.target.value
                  )
                }
                placeholder={t('newBooking.placeholders.idNumber')}
              />
            </div>
            <div>
              <FieldLabel required>{t('newBooking.fields.idPhoto')}</FieldLabel>
              <input
                ref={idFileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleIdFileChange}
              />
              <button
                type="button"
                onClick={() => idFileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e2e8f0] bg-[#f8fafc] py-6 text-[#9ca3af] transition-colors hover:border-brand-primary/40 hover:bg-[#eef2ff]"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="max-w-full truncate px-2 text-xs">
                  {idFileName || t('newBooking.fields.uploadId')}
                </span>
              </button>
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
                disabled={nationalitiesLoading}
              >
                <option value="">
                  {nationalitiesLoading
                    ? isArabic
                      ? 'جاري التحميل...'
                      : 'Loading…'
                    : t('newBooking.placeholders.nationality')}
                </option>
                {nationalities.map((n) => {
                  const natId = n.Id ?? n.id
                  return (
                    <option key={natId} value={String(natId)}>
                      {isArabic
                        ? n.NationalityNameA ?? n.nationalityNameA
                        : n.NationalityNameE ?? n.nationalityNameE}
                    </option>
                  )
                })}
              </IconSelect>
            </div>
          </div>
        </div>
      </div>
      ) : null}

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
                <IconInput
                  icon={Briefcase}
                  type="text"
                  value={form.visitPurpose}
                  onChange={(e) => updateField('visitPurpose', e.target.value)}
                  placeholder={t('newBooking.placeholders.visitPurpose')}
                />
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
                <IconInput
                  icon={Settings2}
                  type="text"
                  value={form.bookingSource}
                  onChange={(e) => updateField('bookingSource', e.target.value)}
                  placeholder={t('newBooking.placeholders.bookingSource')}
                />
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

      {currentStep === 'booking' && (
        <NewBookingStayStep
          stayRows={stayRows}
          onGrandTotalChange={setStayGrandTotal}
          onStayRowsChange={setStayRows}
          enforceMinToday
        />
      )}

      {currentStep === 'payment' && (
        <NewBookingPaymentStep
          totalPrice={stayGrandTotal}
          downPayment={downPayment}
          onDownPaymentChange={setDownPayment}
        />
      )}

      <NewBookingStepFooter
        currentStep={currentStep}
        onNext={handleNext}
        onBack={handleBack}
        onConfirmBooking={handleConfirmBooking}
        saving={savingReservation}
      />
    </section>
  )
}

export default NewBookingPage
