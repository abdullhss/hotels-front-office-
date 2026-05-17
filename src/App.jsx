import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'sonner'
import AppLayout from './components/AppLayout.jsx'
import DashboardPage from './pages/dashboard/DashboardPage.jsx'
import BookingsPage from './pages/bookings/BookingsPage.jsx'
import NewBookingPage from './pages/new-booking/NewBookingPage.jsx'
import LoginPage from './pages/login/LoginPage.jsx'

function App() {
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  useEffect(() => {
    document.documentElement.lang = i18n.language
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr'
  }, [i18n.language, isArabic])

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/bookings/new" element={<NewBookingPage />} />
          <Route path="/allocation" element={<DashboardPage />} />
          <Route path="/units" element={<DashboardPage />} />
          <Route path="/unit-transfer" element={<DashboardPage />} />
          <Route path="/check-out" element={<DashboardPage />} />
          <Route path="/customers" element={<DashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-center" dir={isArabic ? 'rtl' : 'ltr'} />
    </>
  )
}

export default App
