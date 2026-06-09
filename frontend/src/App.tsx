import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsListPage from './pages/LeadsListPage';
import LeadCreatePage from './pages/LeadCreatePage';
import LeadEditPage from './pages/LeadEditPage';
import EmployeesListPage from './pages/EmployeesListPage';
import EmployeeCreatePage from './pages/EmployeeCreatePage';
import EmployeeEditPage from './pages/EmployeeEditPage';
import LeadSourcesPage from './pages/LeadSourcesPage';
import ReportsPage from './pages/ReportsPage';
import MessageLogsPage from './pages/MessageLogsPage';
import CalendarPage from './pages/CalendarPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout><DashboardPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <Layout><LeadsListPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads/create"
        element={
          <ProtectedRoute>
            <Layout><LeadCreatePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads/:id"
        element={
          <ProtectedRoute>
            <Layout><LeadEditPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employees"
        element={
          <ProtectedRoute requiredRoles={['Administrator']}>
            <Layout><EmployeesListPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/create"
        element={
          <ProtectedRoute requiredRoles={['Administrator']}>
            <Layout><EmployeeCreatePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/:id"
        element={
          <ProtectedRoute requiredRoles={['Administrator']}>
            <Layout><EmployeeEditPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/lead-sources"
        element={
          <ProtectedRoute requiredRoles={['Administrator', 'Manager']}>
            <Layout><LeadSourcesPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute requiredRoles={['Administrator', 'Manager']}>
            <Layout><ReportsPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Layout><CalendarPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Layout><MessageLogsPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout><ProfilePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute>
            <Layout><EditProfilePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/change-password"
        element={
          <ProtectedRoute>
            <Layout><ChangePasswordPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
