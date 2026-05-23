export const EMPTY_CUSTOMER_FORM = {
  fullName: '',
  email: '',
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
  bookingSource: 'direct',
  notes: '',
}

export function customerToForm(row, isArabic) {
  if (!row) return { ...EMPTY_CUSTOMER_FORM }
  return {
    ...EMPTY_CUSTOMER_FORM,
    fullName: isArabic ? row.nameAr : row.nameEn || row.nameAr,
    email: row.email ?? '',
    idType: row.idType ?? '',
    idNumber: row.idNumber ?? '',
    whatsappPhone: row.whatsUp ?? '',
    localPhone: row.mobile ?? '',
    gender: row.genderKey ?? '',
    nationality: row.nationalityId ? String(row.nationalityId) : '',
  }
}

export function agentToForm(agent, isArabic) {
  if (!agent) return { ...EMPTY_CUSTOMER_FORM }
  return {
    ...EMPTY_CUSTOMER_FORM,
    fullName: isArabic ? agent.nameAr : agent.nameEn || agent.nameAr,
    email: agent.email ?? '',
    whatsappPhone: agent.whatsapp || agent.phone1 || '',
    localPhone: agent.phone1 ?? '',
    nationality: agent.nationalityId ? String(agent.nationalityId) : '',
    notes: isArabic ? agent.descAr : agent.descEn || agent.descAr,
  }
}
