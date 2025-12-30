import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<ProtectedRoute />}>
                <Route element={<Layout><Dashboard /></Layout>} path="/" />
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
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;