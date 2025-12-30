import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import './App.css';
import authService from './api/auth';

// Page imports
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Accounts from './pages/Accounts/Accounts';
import Transactions from './pages/Transactions/Transactions';
import Budgets from './pages/Budgets/Budgets';
import Recurring from './pages/Recurring/Recurring';
import Settings from './pages/Settings/Settings';

// Placeholder for settings sub-pages
const Profile = () => <div>Profile Settings</div>;
const Categories = () => <div>Categories Settings</div>;
const PaymentMethods = () => <div>Payment Methods Settings</div>;
const Notifications = () => <div>Notifications Settings</div>;
const DataExport = () => <div>Data Export</div>;

const App = () => {
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check for token in localStorage on initial app load
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    authService.logout(); // This will clear the token from localStorage
  };

  return (
    <Router>
      <div className="App">
        {token && (
          <nav className="main-nav">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/accounts">Accounts</NavLink>
            <NavLink to="/transactions">Transactions</NavLink>
            <NavLink to="/budgets">Budgets</NavLink>
            <NavLink to="/recurring">Recurring</NavLink>
            <NavLink to="/settings">Settings</NavLink>
            <a href="/login" onClick={handleLogout}>Logout</a>
          </nav>
        )}
        <main className="content">
          <Routes>
            <Route path="/login" element={!token ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!token ? <Register /> : <Navigate to="/dashboard" />} />

            {/* Protected Routes */}
            <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={token ? <Dashboard token={token} onLogout={handleLogout} /> : <Navigate to="/login" />} />
            <Route path="/accounts" element={token ? <Accounts token={token} /> : <Navigate to="/login" />} />
            <Route path="/transactions" element={token ? <Transactions token={token} /> : <Navigate to="/login" />} />
            <Route path="/budgets" element={token ? <Budgets token={token} /> : <Navigate to="/login" />} />
            <Route path="/recurring" element={token ? <Recurring token={token} /> : <Navigate to="/login" />} />
            <Route path="/settings" element={token ? <Settings /> : <Navigate to="/login" />} >
              <Route path="profile" element={<Profile />} />
              <Route path="categories" element={<Categories />} />
              <Route path="payment-methods" element={<PaymentMethods />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="data" element={<DataExport />} />
            </Route>
            
            {/* Catch-all for any other route to redirect to login if not authenticated */}
            <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;