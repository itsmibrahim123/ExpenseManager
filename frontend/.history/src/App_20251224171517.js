import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import './App.css';

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
  return (
    <Router>
      <div className="App">
        <nav className="main-nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/accounts">Accounts</NavLink>
          <NavLink to="/transactions">Transactions</NavLink>
          <NavLink to="/budgets">Budgets</NavLink>
          <NavLink to="/recurring">Recurring</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/recurring" element={<Recurring />} />
            <Route path="/settings" element={<Settings />}>
              <Route path="profile" element={<Profile />} />
              <Route path="categories" element={<Categories />} />
              <Route path="payment-methods" element={<PaymentMethods />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="data" element={<DataExport />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;