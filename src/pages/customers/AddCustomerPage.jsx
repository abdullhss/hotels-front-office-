import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Flag,
  IdCard,
  ImagePlus,
  Mail,
  Phone,
  Settings2,
  User,
  UserPlus,
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
import { sanitizeNameInput, validateName } from '../../lib/nameValidation.js'
import {
  NATIONAL_ID_LENGTH,
  sanitizeNationalIdInput,
  shouldSanitizeAsNationalId,
  validateNationalIdNumber,
} from '../../lib/nationalIdValidation.js'
import {
  AccordionChevron,
  FieldLabel,
  FormRow,
  IconInput,
  IconSelect,
  SectionHeader,
} from '../new-booking/components/BookingFormFields.jsx'
import { inputClass, panelClass } from '../new-booking/bookingStyles.js'
import { cn } from '../../lib/utils.js'
import useAgentsSimple, { getAgentDetails } from '../../Hooks/GetAgents.js'
import useNationalities from '../../Hooks/GetNationalities.js'
import useCustomersSimple, {
  getCustomerDetails,
  saveCustomerFromForm,
} from '../../Hooks/GetCustomers.js'
import {
  agentToForm,
  customerToForm,
  EMPTY_CUSTOMER_FORM,
} from './customerFormData.js'

function AddCustomerPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isArabic = i18n.language === 'ar'
  const { nationalities, loading: nationalitiesLoading } = useNationalities()
  const { customers, loading: customersLoading } = useCustomersSimple()
  const { agents, loading: agentsLoading } = useAgentsSimple()
  const fileInputRef = useRef(null)

  const [customerType, setCustomerType] = useState('client')
  const [selectedExistingId, setSelectedExistingId] = useState('')
  const [form, setForm] = useState(EMPTY_CUSTOMER_FORM)
  const [idFile, setIdFile] = useState(null)
  const [idFileName, setIdFileName] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingExistingDetails, setLoadingExistingDetails] = useState(false)
  const [loadedExistingName, setLoadedExistingName] = useState('')

  const isCompanies = customerType === 'companies'
  const existingOptions = (isCompanies ? agents : customers).filter((item) => item.id > 0)
  const existingLoading = isCompanies ? agentsLoading : customersLoading

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleIdFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIdFile(file)
    setIdFileName(file.name)
  }

  const handleCustomerTypeChange = (type) => {
    setCustomerType(type)
    setSelectedExistingId('')
    setLoadedExistingName('')
    setForm({ ...EMPTY_CUSTOMER_FORM })
    setIdFile(null)
    setIdFileName('')
  }

  const handleExistingChange = async (e) => {
    const id = e.target.value
    setSelectedExistingId(id)
    setLoadedExistingName('')
    if (!id) {
      setForm({ ...EMPTY_CUSTOMER_FORM })
      return
    }

    setLoadingExistingDetails(true)
    try {
      if (isCompanies) {
        const { success, agent, error } = await getAgentDetails(id)
        if (!success || !agent) {
          toast.error(error ?? (isArabic ? 'تعذر تحميل بيانات الشركة' : 'Failed to load company'))
          setSelectedExistingId('')
          return
        }
        setForm(agentToForm(agent, isArabic))
        setLoadedExistingName(isArabic ? agent.nameAr : agent.nameEn || agent.nameAr)
        return
      }

      const { success, customer, error } = await getCustomerDetails(id)
      if (!success || !customer) {
        toast.error(error ?? (isArabic ? 'تعذر تحميل بيانات العميل' : 'Failed to load customer'))
        setSelectedExistingId('')
        return
      }
      setForm(customerToForm(customer, isArabic))
      setLoadedExistingName(isArabic ? customer.nameAr : customer.nameEn || customer.nameAr)
    } finally {
      setLoadingExistingDetails(false)
    }
  }

  const clearExistingSelection = () => {
    setSelectedExistingId('')
    setLoadedExistingName('')
    setForm({ ...EMPTY_CUSTOMER_FORM })
  }

  const hasSelectedExisting = Boolean(selectedExistingId && loadedExistingName)

  const formatExistingOptionLabel = (item) => {
    const name = isArabic ? item.nameAr : item.nameEn || item.nameAr
    const phone = isCompanies
      ? item.whatsapp || item.phone1 || ''
      : item.whatsUp || item.mobile || ''
    return phone ? `${name} — ${phone}` : name
  }

  const customerTypeOptions = [
    { value: 'client', label: t('newBooking.fields.client'), icon: User },
    { value: 'companies', label: t('newBooking.fields.companies'), icon: Building2 },
  ]

  const handleSubmit = async () => {
    const nameCheck = validateName(form.fullName)
    if (!nameCheck.valid) {
      toast.error(
        nameCheck.errorKey === 'required'
          ? isArabic
            ? 'الاسم الكامل مطلوب'
            : 'Full name is required'
          : t('common.validation.nameLettersOnly')
      )
      return
    }
    const idCheck = validateNationalIdNumber(form.idNumber, form.idType)
    if (!idCheck.valid) {
      toast.error(
        idCheck.errorKey === 'required'
          ? isArabic
            ? 'رقم الهوية مطلوب'
            : 'ID number is required'
          : t('common.validation.nationalIdFormat')
      )
      return
    }
    if (!form.nationality) {
      toast.error(isArabic ? 'الجنسية مطلوبة' : 'Nationality is required')
      return
    }
    if (!form.gender) {
      toast.error(isArabic ? 'الجنس مطلوب' : 'Gender is required')
      return
    }

    setSaving(true)
    try {
      const result = await saveCustomerFromForm(form, { idFile, wantedAction: 0, isArabic })
      if (!result.success) {
        toast.error(result.errorMessage ?? (isArabic ? 'فشل الحفظ' : 'Save failed'))
        return
      }
      toast.success(isArabic ? 'تم إضافة العميل بنجاح' : 'Customer added successfully')
      navigate('/customers')
    } catch (e) {
      toast.error(e?.message ?? (isArabic ? 'فشل الحفظ' : 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-[1200px] space-y-4">
      <header className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef2ff] text-brand-primary">
          <UserPlus className="h-5 w-5" />
        </span>
        <div>
          <h1 className="m-0 text-xl font-bold text-[#111827] sm:text-2xl">
            {t('customers.addCustomerForm.title')}
          </h1>
          <p className="mt-0.5 text-sm text-[#6b7280]">{t('customers.addCustomerForm.subtitle')}</p>
        </div>
      </header>

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
            {customerTypeOptions.map((opt) => {
              const Icon = opt.icon
              const isActive = customerType === opt.value
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
                    name="customerType"
                    value={opt.value}
                    checked={isActive}
                    onChange={() => handleCustomerTypeChange(opt.value)}
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
              ? t('customers.addCustomerForm.existingCompany')
              : t('newBooking.fields.existingClient')
          }
          hint={
            isCompanies
              ? t('customers.addCustomerForm.existingCompanyHint')
              : t('newBooking.hints.existingClient')
          }
          accent="bg-[#e0f2fe] text-[#0284c7]"
        >
          <IconSelect
            value={selectedExistingId}
            onChange={handleExistingChange}
            disabled={existingLoading || loadingExistingDetails}
            className={cn(
              selectedExistingId &&
                '[&_select]:border-[#86efac] [&_select]:ring-2 [&_select]:ring-[#bbf7d0]'
            )}
          >
            <option value="">
              {existingLoading || loadingExistingDetails
                ? isArabic
                  ? 'جاري التحميل...'
                  : 'Loading…'
                : isCompanies
                  ? t('customers.addCustomerForm.existingCompanyPlaceholder')
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
                onClick={clearExistingSelection}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#16a34a] transition-colors hover:bg-[#dcfce7]"
                aria-label={
                  isCompanies
                    ? t('customers.addCustomerForm.clearCompany')
                    : t('newBooking.clearClient')
                }
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </FormRow>
      </div>

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <FieldLabel required>{t('newBooking.fields.idType')}</FieldLabel>
              <IconSelect value={form.idType} onChange={(e) => updateField('idType', e.target.value)}>
                <option value="">{t('newBooking.placeholders.idType')}</option>
                <option value="national_id">{isArabic ? 'هوية' : 'National ID'}</option>
                <option value="residency">{isArabic ? 'إقامة' : 'Residency'}</option>
                <option value="passport">{isArabic ? 'جواز' : 'Passport'}</option>
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
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleIdFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e2e8f0] bg-[#f8fafc] py-6 text-[#9ca3af] transition-colors hover:border-brand-primary/40 hover:bg-[#eef2ff]"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="max-w-full truncate px-2 text-xs">
                  {idFileName || t('newBooking.fields.uploadId')}
                </span>
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

      <Accordion type="multiple" defaultValue={['additional', 'extra']} className="space-y-4">
        <AccordionItem
          value="additional"
          className={cn(panelClass, 'border-b-0 border-[#fed7aa] bg-[#fffbeb]')}
        >
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

        <AccordionItem
          value="extra"
          className={cn(panelClass, 'border-b-0 border-[#ddd6fe] bg-[#f5f3ff]')}
        >
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

      <div
        className={cn(
          panelClass,
          'flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center'
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => navigate('/customers')}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#fecaca] bg-white px-6 py-3 text-sm font-medium text-[#dc2626] transition-colors hover:bg-[#fef2f2] disabled:opacity-50 sm:flex-none"
          >
            {t('newBooking.cancel')}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-50 sm:flex-none"
          >
            {saving ? (isArabic ? 'جاري الحفظ...' : 'Saving…') : t('newBooking.next')}
            {!saving ? <ChevronLeft className="h-4 w-4" /> : null}
          </button>
        </div>
      </div>
    </section>
  )
}

export default AddCustomerPage
