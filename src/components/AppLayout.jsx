import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Hotel,
  Users,
  ClipboardList,
  Menu,
  X,
  LogOut,
  CalendarDays,
} from 'lucide-react'

import { cn } from '../lib/utils.js'

const navItems = [
  { key: 'dashboard', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', path: '/', icon: LayoutDashboard },
  { key: 'bookings', labelAr: 'الحجوزات', labelEn: 'Bookings', path: '/bookings', icon: ClipboardList },
  { key: 'allocation', labelAr: 'التسكين', labelEn: 'Allocation', path: '/allocation', icon: Hotel },
  {
    key: 'room-operations',
    labelAr: 'متابعه التسكيين',
    labelEn: 'Allocation follow-up',
    path: '/room-operations',
    icon: Hotel,
  },
  { key: 'units', labelAr: 'الوحدات', labelEn: 'Units', path: '/units', icon: Hotel },
  { key: 'unit-transfer', labelAr: 'نقل بين الوحدات', labelEn: 'Unit Transfer', path: '/unit-transfer', icon: Hotel },
  { key: 'checkout', labelAr: 'المغادرة', labelEn: 'Check-out', path: '/check-out', icon: Users },
  {
    key: 'monthly-report',
    labelAr: 'التقرير الشهري',
    labelEn: 'Monthly Report',
    path: '/monthly-report',
    icon: CalendarDays,
  },
  { key: 'customers', labelAr: 'العملاء', labelEn: 'Customers', path: '/customers', icon: Users },
]

function isParentActive(item, pathname) {
  if (item.path === '/') return pathname === '/'
  if (item.path && (pathname === item.path || pathname.startsWith(`${item.path}/`))) {
    return true
  }
  if (Array.isArray(item.children) && item.children.length > 0) {
    return item.children.some(
      (child) => pathname === child.path || pathname.startsWith(`${child.path}/`)
    )
  }
  return false
}

function SidebarLeafLink({ item, location, isArabic, onNavigate }) {
  const Icon = item.icon
  const active = isParentActive(item, location.pathname)
  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
        active
          ? 'bg-[#5b56f7] text-white shadow-md'
          : 'text-[#374151] hover:bg-[#eef2ff] hover:text-[#5b56f7]'
      )}
    >
      <Icon size={20} strokeWidth={1.75} />
      <span>{isArabic ? item.labelAr : item.labelEn}</span>
    </Link>
  )
}

function buildSidebarNav(navItems, location, isArabic, onNavigate) {
  const nodes = []
  for (const item of navItems) {
    nodes.push(
      <SidebarLeafLink
        key={item.key}
        item={item}
        location={location}
        isArabic={isArabic}
        onNavigate={onNavigate}
      />
    )
  }
  return nodes
}

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const closeMobileNav = () => setMobileNavOpen(false)
  const logoutLabel = isArabic ? 'تسجيل الخروج' : 'Logout'

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('SessionID')
    localStorage.removeItem('userData')
    localStorage.removeItem('userRole')
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileNavOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileNavOpen])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const menuLabel = isArabic ? 'القائمة' : 'Menu'

  return (
    <div className="min-h-screen bg-[#eef2f7] text-[#1f2937]" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header - enhanced spacing */}
      <header className="sticky top-0 z-30 border-b border-[#dce3ee] bg-white/90 backdrop-blur-sm px-4 py-3 shadow-sm sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dce3ee] bg-white text-[#374151] shadow-sm transition hover:bg-[#eef2ff] hover:text-[#5b56f7] md:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-expanded={mobileNavOpen}
              aria-controls="app-sidebar"
              aria-label={menuLabel}
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>

            {/* Brand */}
            <div className="flex min-w-0 items-center gap-2">
              <div className="truncate rounded-xl bg-linear-to-r from-[#5b56f7] to-[#7c6eff] px-3 py-2 text-xs font-semibold text-white shadow-sm sm:px-4 sm:text-sm">
                LuxeStay
              </div>
            </div>
          </div>

          {/* Language toggles */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className={`rounded-xl px-2 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm ${
                isArabic ? 'bg-[#5b56f7] text-white' : 'bg-[#f1f5f9] text-[#4b5563] hover:bg-[#e2e8f0]'
              }`}
              onClick={() => i18n.changeLanguage('ar')}
            >
              العربية
            </button>
            <button
              type="button"
              className={`rounded-xl px-2 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm ${
                !isArabic ? 'bg-[#5b56f7] text-white' : 'bg-[#f1f5f9] text-[#4b5563] hover:bg-[#e2e8f0]'
              }`}
              onClick={() => i18n.changeLanguage('en')}
            >
              English
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] transition-opacity md:hidden',
          mobileNavOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={closeMobileNav}
      />

      <div className="flex min-h-[calc(100vh-76px)]">
        {/* Sidebar — drawer on small screens, static from md */}
        <aside
          id="app-sidebar"
          className={cn(
            'border-[#dce3ee] bg-[#f8fafc] shadow-sm motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out',
            'fixed top-0 z-50 h-full w-[min(280px,88vw)] overflow-y-auto p-5 motion-reduce:transition-none',
            isArabic ? 'border-s' : 'border-e',
            'start-0',
            mobileNavOpen
              ? 'translate-x-0'
              : isArabic
                ? 'translate-x-full md:translate-x-0'
                : '-translate-x-full md:translate-x-0',
            'md:static md:z-0 md:h-auto md:min-h-[calc(100vh-76px)] md:w-[280px] md:translate-x-0 md:overflow-visible md:border-[#dce3ee] md:shadow-sm',
            isArabic ? 'md:border-s' : 'md:border-e'
          )}
        >
          <div className="flex items-center justify-between gap-2 pb-4 md:hidden">
            <span className="text-sm font-semibold text-[#1f2937]">
              {isArabic ? 'التنقل' : 'Navigation'}
            </span>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#4b5563] transition hover:bg-[#eef2ff] hover:text-[#5b56f7]"
              onClick={closeMobileNav}
              aria-label={isArabic ? 'إغلاق القائمة' : 'Close menu'}
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
          <nav className="space-y-1.5">{buildSidebarNav(navItems, location, isArabic, closeMobileNav)}</nav>
          <div className="mt-6 border-t border-[#dce3ee] pt-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#dce3ee] bg-white px-4 py-3 text-sm font-medium text-[#374151] transition hover:bg-[#eef2ff] hover:text-[#5b56f7]"
            >
              <LogOut size={18} strokeWidth={1.9} />
              <span>{logoutLabel}</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
