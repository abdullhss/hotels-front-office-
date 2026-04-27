import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  ar: {
    translation: {
      common: {
        arabic: 'العربية',
        english: 'ENGLISH',
      },
      login: {
        ariaLabel: 'تسجيل الدخول',
        subtitle: 'فنادق الإدارة',
        title: 'ملاذ الفخامة',
        description: 'ادخل بيانات اعتمادك الخاصة للوصول إلى بوابة الإدارة',
        username: 'اسم المستخدم',
        password: 'كلمة المرور',
        rememberMe: 'تذكرني',
        forgotPassword: 'نسيت كلمة المرور؟',
        submit: 'تسجيل الدخول',
      },
      table: {
        rowsPerPage: 'العرض',
        searchPlaceholder: 'ابحث هنا....',
        searchSubmit: 'عرض البيانات',
        clearSearchAria: 'مسح البحث',
        empty: 'لا توجد بيانات',
        exportExcel: 'طباعة',
        filterSelectPrefix: 'برجاء اختيار',
      },
      dashboard: {
        greeting: 'مساء الخير، مريم',
        date: 'الثلاثاء، 7 أبريل 2026',
        stats: {
          units: 'الوحدات',
          availableUnits: 'الوحدات المتاحة',
          availableHint: 'جاهز لتسجيل الدخول',
          needCleaning: 'يحتاج إلى تنظيف',
          cleaningHint: 'خدمة الغرف قيد التنفيذ',
          maintenance: 'صيانة',
          maintenanceHint: 'قيد الخدمة',
        },
        filters: {
          filter: 'فلتر',
          status: 'الحالة:',
          type: 'النوع:',
          floor: 'الدور',
          all: 'الكل',
          gridViewAria: 'عرض شبكي',
          listViewAria: 'عرض قائمة',
        },
        today: {
          title: 'نظرة على اليوم',
          time: '07:07 م',
          arrivals: 'القادمون',
          departures: 'المغادرون',
          noArrivals: 'لا يوجد قادمون',
          noDepartures: 'لا يوجد مغادرون',
        },
        units: {
          title: 'حالة الوحدات',
          settingsAria: 'إعدادات الحالة',
          viewAll: 'عرض الكل',
          room: 'غرفة',
          suiteOne: '1 جناح',
          roomsTen: '10 غرفة',
        },
        legend: {
          available: 'متاحة',
          occupied: 'مشغولة',
          needed: 'بحاجة',
          cleaning: 'تنظيف',
          maintenance: 'صيانة',
        },
      },
    },
  },
  en: {
    translation: {
      common: {
        arabic: 'ARABIC',
        english: 'ENGLISH',
      },
      login: {
        ariaLabel: 'Login',
        subtitle: 'Management Hotels',
        title: 'Luxury Haven',
        description: 'Enter your credentials to access the management portal',
        username: 'Username',
        password: 'Password',
        rememberMe: 'Remember me',
        forgotPassword: 'Forgot password?',
        submit: 'Sign in',
      },
      table: {
        rowsPerPage: 'Rows per page',
        searchPlaceholder: 'Search…',
        searchSubmit: 'Apply',
        clearSearchAria: 'Clear search',
        empty: 'No data',
        exportExcel: 'Export',
        filterSelectPrefix: 'Select',
      },
      dashboard: {
        greeting: 'Good evening, Mariam',
        date: 'Tuesday, April 7, 2026',
        stats: {
          units: 'Units',
          availableUnits: 'Available units',
          availableHint: 'Ready to check in',
          needCleaning: 'Needs cleaning',
          cleaningHint: 'Housekeeping in progress',
          maintenance: 'Maintenance',
          maintenanceHint: 'Out of service',
        },
        filters: {
          filter: 'Filter',
          status: 'Status:',
          type: 'Type:',
          floor: 'Floor',
          all: 'All',
          gridViewAria: 'Grid view',
          listViewAria: 'List view',
        },
        today: {
          title: 'Today at a glance',
          time: '07:07 PM',
          arrivals: 'Arrivals',
          departures: 'Departures',
          noArrivals: 'No arrivals',
          noDepartures: 'No departures',
        },
        units: {
          title: 'Unit status',
          settingsAria: 'Status settings',
          viewAll: 'View all',
          room: 'Room',
          suiteOne: '1 suite',
          roomsTen: '10 rooms',
        },
        legend: {
          available: 'Available',
          occupied: 'Occupied',
          needed: 'Needed',
          cleaning: 'Cleaning',
          maintenance: 'Maintenance',
        },
      },
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'ar',
  fallbackLng: 'ar',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
