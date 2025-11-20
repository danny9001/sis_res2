import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
import ReservationsPage from './pages/reservations/ReservationsPage'
import NewReservationPage from './pages/reservations/NewReservationPage'
import ApprovalsPage from './pages/approvals/ApprovalsPage'
import SectorsPage from './pages/admin/SectorsPage'
import EventsPage from './pages/admin/EventsPage'
import UsersPage from './pages/admin/UsersPage'
import AnalyticsPage from './pages/analytics/AnalyticsPage'
import AuditPage from './pages/admin/AuditPage'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/reservations/new" element={<NewReservationPage />} />
        
        {(user.role === 'APPROVER' || user.role === 'ADMIN') && (
          <Route path="/approvals" element={<ApprovalsPage />} />
        )}
        
        {user.role === 'ADMIN' && (
          <>
            <Route path="/admin/sectors" element={<SectorsPage />} />
            <Route path="/admin/events" element={<EventsPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/audit" element={<AuditPage />} />
          </>
        )}
        
        <Route path="/analytics" element={<AnalyticsPage />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
