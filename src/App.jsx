import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext';
import Login from './components/Login'
import SignUp from './components/signup'
import ForgotPassword from './components/ForgotPassword'
import AdminLayout from './components/AdminLayout'
import ClientLayout from './components/ClientLayout'
import Dashboard from './components/Dashboard'
import Profile from './components/Profile'

// Using the same Dashboard component for both admin and client
// import AdminDashboard from './components/AdminDashboard'

// Form Components (Original table components)
import SupplierInfo from './components/tables/SupplierInfo'
import CustomerOrder from './components/tables/CustomerOrder'
import MaterialInquiry from './components/tables/MaterialInquiry'
import MaterialReplenish from './components/tables/MaterialReplenish'
import CustomerDelivery from './components/tables/CustomerDelivery'
import DailyWork from './components/tables/DailyWork'
import ViewTables from './components/tables/ViewTables'
import CustomisedTable from './components/tables/CustomisedTable'
import TableCreation from './components/tables/TableCreation'

// View Components (New table view components)
import SupplierInfoView from './components/tables/SupplierInfoView'
import CustomerOrderView from './components/tables/CustomerOrderView'
import MaterialInquiryView from './components/tables/MaterialInquiryView'
import MaterialReplenishView from './components/tables/MaterialReplenishView'
import CustomerDeliveryView from './components/tables/CustomerDeliveryView'
import DailyWorkView from './components/tables/DailyWorkView'

// Updated ReadOnlyTableDisplay component
import ReadOnlyTableDisplay from './components/tables/ReadOnlyTableDisplay'

import ChatPage from './components/chat'

// // Admin-only components
// import ClientManagement from './components/ClientManagement'
// import AllClientsData from './components/AllClientsData'

// Loading Component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

// Protected Route Component
function ProtectedRoute({ children, requiredRole = null }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'} replace />
  }

  return children
}

// Public Route Component (for unauthenticated users only)
function PublicRoute({ children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'} replace />
  }

  return children
}

// Admin Routes Component
function AdminRoutes() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />

        {/* Admin Management Routes */}
        {/* <Route path="clients" element={<ClientManagement />} />
        <Route path="all-data" element={<AllClientsData />} /> */}
        <Route path="table-creation" element={<TableCreation userRole="admin" />} />

        {/* Table Management Routes */}
        <Route path="customised-table" element={<CustomisedTable userRole="admin" />} />

        {/* ReadOnly Table Display Route */}
        <Route path="readonly-table-display" element={<ReadOnlyTableDisplay />} />
        <Route path="readonly-table-display/:tableId" element={<ReadOnlyTableDisplay />} />

        {/* Form Routes (Original table components for data entry/management) */}
        <Route path="supplier-info" element={<SupplierInfo userRole="admin" />} />
        <Route path="customer-order" element={<CustomerOrder userRole="admin" />} />
        <Route path="material-inquiry" element={<MaterialInquiry userRole="admin" />} />
        <Route path="material-replenish" element={<MaterialReplenish userRole="admin" />} />
        <Route path="customer-delivery" element={<CustomerDelivery userRole="admin" />} />
        <Route path="daily-work" element={<DailyWork userRole="admin" />} />

        {/* View Routes (New table view components for data display) */}
        <Route path="supplier-info-view" element={<SupplierInfoView />} />
        <Route path="customer-order-view" element={<CustomerOrderView />} />
        <Route path="material-inquiry-view" element={<MaterialInquiryView />} />
        <Route path="material-replenish-view" element={<MaterialReplenishView />} />
        <Route path="customer-delivery-view" element={<CustomerDeliveryView />} />
        <Route path="daily-work-view" element={<DailyWorkView />} />

        {/* Other Routes */}
        <Route path="view-tables" element={<ViewTables userRole="admin" />} />
        <Route path="chat" element={<ChatPage userRole="admin" />} />

        {/* Client-specific data routes for admin (Form routes) */}
        <Route path="client/:clientId/profile" element={<Profile />} />
        <Route path="client/:clientId/supplier-info" element={<SupplierInfo userRole="admin" />} />
        <Route path="client/:clientId/customer-order" element={<CustomerOrder userRole="admin" />} />
        <Route path="client/:clientId/material-inquiry" element={<MaterialInquiry userRole="admin" />} />
        <Route path="client/:clientId/material-replenish" element={<MaterialReplenish userRole="admin" />} />
        <Route path="client/:clientId/customer-delivery" element={<CustomerDelivery userRole="admin" />} />
        <Route path="client/:clientId/daily-work" element={<DailyWork userRole="admin" />} />

        {/* Client-specific data routes for admin (View routes) */}
        <Route path="client/:clientId/supplier-info-view" element={<SupplierInfoView />} />
        <Route path="client/:clientId/customer-order-view" element={<CustomerOrderView />} />
        <Route path="client/:clientId/material-inquiry-view" element={<MaterialInquiryView />} />
        <Route path="client/:clientId/material-replenish-view" element={<MaterialReplenishView />} />
        <Route path="client/:clientId/customer-delivery-view" element={<CustomerDeliveryView />} />
        <Route path="client/:clientId/daily-work-view" element={<DailyWorkView />} />

        {/* Client-specific ReadOnly Table Display routes for admin */}
        <Route path="client/:clientId/readonly-table-display" element={<ReadOnlyTableDisplay />} />
        <Route path="client/:clientId/readonly-table-display/:tableId" element={<ReadOnlyTableDisplay />} />

        {/* Client-specific table management routes for admin */}
        <Route path="client/:clientId/customised-table" element={<CustomisedTable userRole="admin" />} />
        <Route path="client/:clientId/table-creation" element={<TableCreation userRole="admin" />} />
        <Route path="client/:clientId/view-tables" element={<ViewTables userRole="admin" />} />
        <Route path="client/:clientId/chat" element={<ChatPage userRole="admin" />} />
      </Routes>
    </AdminLayout>
  )
}

// Client Routes Component
function ClientRoutes() {
  return (
    <ClientLayout>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="table-creation" element={<TableCreation userRole="client" />} />

        {/* Table Management Routes */}
        <Route path="customised-table" element={<CustomisedTable userRole="client" />} />

        {/* ReadOnly Table Display Route */}
        <Route path="readonly-table-display" element={<ReadOnlyTableDisplay />} />
        <Route path="readonly-table-display/:tableId" element={<ReadOnlyTableDisplay />} />

        {/* Form Routes (Original table components for data entry/management) */}
        <Route path="supplier-info" element={<SupplierInfo userRole="client" />} />
        <Route path="material-inquiry" element={<MaterialInquiry userRole="client" />} />
        <Route path="customer-delivery" element={<CustomerDelivery userRole="client" />} />
        <Route path="daily-work" element={<DailyWork userRole="client" />} />

        {/* View Routes (New table view components for data display) */}
        <Route path="supplier-info-view" element={<SupplierInfoView />} />
        <Route path="material-inquiry-view" element={<MaterialInquiryView />} />
        <Route path="customer-delivery-view" element={<CustomerDeliveryView />} />
        <Route path="daily-work-view" element={<DailyWorkView />} />

        {/* Other Routes */}
        <Route path="view-tables" element={<ViewTables userRole="client" />} />
        <Route path="chat" element={<ChatPage userRole="client" />} />

        {/* Quick Access Routes */}
        <Route path="material-replenish" element={<MaterialReplenish userRole="client" />} />
        <Route path="customer-order" element={<CustomerOrder userRole="client" />} />

        {/* Additional View Routes for Client */}
        <Route path="material-replenish-view" element={<MaterialReplenishView />} />
        <Route path="customer-order-view" element={<CustomerOrderView />} />
      </Routes>
    </ClientLayout>
  )
}

// Component to redirect based on user role
function RoleBasedRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace />
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  } else {
    return <Navigate to="/client/dashboard" replace />
  }
}

// App Routes Component (separate from App to access useAuth)
function AppRoutes() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/auth/signin"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/auth/signup"
        element={
          <PublicRoute>
            <SignUp />
          </PublicRoute>
        }
      />
      <Route
        path="/auth/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      {/* Legacy routes for backward compatibility */}
      <Route path="/login" element={<Navigate to="/auth/signin" replace />} />
      <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminRoutes />
          </ProtectedRoute>
        }
      />

      {/* Client Routes */}
      <Route
        path="/client/*"
        element={
          <ProtectedRoute requiredRole="client">
            <ClientRoutes />
          </ProtectedRoute>
        }
      />

      {/* Root redirect based on user role */}
      <Route path="/" element={<RoleBasedRedirect />} />

      {/* Catch all route - redirect to role-based dashboard */}
      <Route path="*" element={<RoleBasedRedirect />} />
    </Routes>
  )
}

// Main App Component
function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="App">
            <AppRoutes />
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  )
}

export default App