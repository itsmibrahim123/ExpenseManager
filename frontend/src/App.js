import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Inventory from './pages/Inventory';
import POSBilling from './pages/POSBilling';
import Invoices from './pages/Invoices';
import DailyRegister from './pages/DailyRegister';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStores from './pages/admin/AdminStores';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <TenantProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Register />} />
              <Route path="/register-user" element={<Register />} />
              
              {/* Super Admin SaaS Platform Routes */}
              <Route element={<SuperAdminRoute />}>
                  <Route element={<Layout><AdminDashboard /></Layout>} path="/admin/dashboard" />
                  <Route element={<Layout><AdminDashboard /></Layout>} path="/admin" />
                  <Route element={<Layout><AdminStores /></Layout>} path="/admin/stores" />
              </Route>

              {/* Store Tenant Operations Routes */}
              <Route element={<ProtectedRoute />}>
                  <Route element={<Layout><Dashboard /></Layout>} path="/" />
                  <Route element={<Layout><POSBilling /></Layout>} path="/pos" />
                  <Route element={<Layout><POSBilling /></Layout>} path="/billing/pos" />
                  <Route element={<Layout><Inventory /></Layout>} path="/inventory" />
                  <Route element={<Layout><Invoices /></Layout>} path="/invoices" />
                  <Route element={<Layout><Invoices /></Layout>} path="/billing/invoices" />
                  <Route element={<Layout><DailyRegister /></Layout>} path="/daily-register" />
                  <Route element={<Layout><DailyRegister /></Layout>} path="/register" />
                  <Route element={<Layout><DailyRegister /></Layout>} path="/reports/daily-register" />
                  <Route element={<Layout><Accounts /></Layout>} path="/accounts" />
                  <Route element={<Layout><Transactions /></Layout>} path="/transactions" />
                  <Route element={<Layout><Transactions /></Layout>} path="/transfers" />
                  <Route element={<Layout><Budgets /></Layout>} path="/budgets" />
                  <Route element={<Layout><Reports /></Layout>} path="/reports" />
                  <Route element={<Layout><Settings /></Layout>} path="/settings" />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;