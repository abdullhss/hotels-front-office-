import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'sonner'
import Login from './components/Login.jsx'
import AppLayout from './components/AppLayout.jsx'
import DashboardPage from './pages/dashboard/DashboardPage.jsx'
import BookingsPage from './pages/bookings/BookingsPage.jsx'
import NewBookingPage from './pages/new-booking/NewBookingPage.jsx'
import AllocationPage from './pages/allocation/AllocationPage.jsx'
import AllocationCheckInPage from './pages/allocation/AllocationCheckInPage.jsx'
import RoomOperationsPage from './pages/room-operations/RoomOperationsPage.jsx'
import RoomOperationsCheckInPage from './pages/room-operations/RoomOperationsCheckInPage.jsx'
import CustomersPage from './pages/customers/CustomersPage.jsx'
import AddCustomerPage from './pages/customers/AddCustomerPage.jsx'
import MonthlyReportPage from './pages/monthly-report/MonthlyReportPage.jsx'
import UnitsPage from './pages/units/UnitsPage.jsx'

function App() {
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  useLocation()
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'

  useEffect(() => {
    document.documentElement.lang = i18n.language
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr'
  }, [i18n.language, isArabic])

  const guard = (element) =>
    isAuthenticated ? element : <Navigate to="/login" replace />

  return (
    <>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={guard(<DashboardPage />)} />
          <Route path="/bookings" element={guard(<BookingsPage />)} />
          <Route path="/bookings/new" element={guard(<NewBookingPage />)} />
          <Route path="/allocation" element={guard(<AllocationPage />)} />
          <Route path="/allocation/:bookingId/check-in" element={guard(<AllocationCheckInPage />)} />
          <Route path="/room-operations" element={guard(<RoomOperationsPage />)} />
          <Route
            path="/room-operations/:assignmentId/check-in"
            element={guard(<RoomOperationsCheckInPage />)}
          />
          <Route path="/units" element={guard(<UnitsPage />)} />
          <Route path="/unit-transfer" element={guard(<DashboardPage />)} />
          <Route path="/check-out" element={guard(<DashboardPage />)} />
          <Route path="/monthly-report" element={guard(<MonthlyReportPage />)} />
          <Route path="/customers" element={guard(<CustomersPage />)} />
          <Route path="/customers/new" element={guard(<AddCustomerPage />)} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
      </Routes>
      <Toaster richColors position="top-center" dir={isArabic ? 'rtl' : 'ltr'} />
    </>
  )
}

export default App
