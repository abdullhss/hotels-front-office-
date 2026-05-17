import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'sonner'
import AppLayout from './components/AppLayout.jsx'
import DashboardHome from './components/DashboardHome.jsx'
import BookingsPage from './components/BookingsPage.jsx'
import Login from './components/Login.jsx'

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
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/allocation" element={<DashboardHome />} />
          <Route path="/units" element={<DashboardHome />} />
          <Route path="/unit-transfer" element={<DashboardHome />} />
          <Route path="/check-out" element={<DashboardHome />} />
          <Route path="/customers" element={<DashboardHome />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-center" dir={isArabic ? 'rtl' : 'ltr'} />
    </>
  )
}

export default App
