export const STEP_ORDER = ['individuals', 'booking', 'payment']

export const EMPTY_FORM = {
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

export const EXISTING_CLIENTS = [
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

export function clientToForm(client, isArabic) {
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

/** Map API customer row (GetCustomers) into booking form fields */
export function customerRowToBookingForm(row, isArabic) {
  if (!row) return { ...EMPTY_FORM }
  return {
    ...EMPTY_FORM,
    fullName: isArabic ? row.nameAr : row.nameEn || row.nameAr,
    idType: row.idType ?? '',
    idNumber: row.idNumber ?? '',
    whatsappPhone: row.whatsUp ?? '',
    localPhone: row.mobile ?? '',
    gender: row.genderKey ?? '',
    nationality: row.nationalityId ? String(row.nationalityId) : '',
  }
}

/** Map API agent row (GetAgents) into booking form fields */
export function agentRowToBookingForm(agent, isArabic) {
  if (!agent) return { ...EMPTY_FORM }
  return {
    ...EMPTY_FORM,
    fullName: isArabic ? agent.nameAr : agent.nameEn || agent.nameAr,
    whatsappPhone: agent.whatsapp || agent.phone1 || '',
    localPhone: agent.phone1 ?? '',
    nationality: agent.nationalityId ? String(agent.nationalityId) : '',
    notes: isArabic ? agent.descAr : agent.descEn || agent.descAr,
  }
}
