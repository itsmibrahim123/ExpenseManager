import { NavLink, Outlet } from 'react-router-dom';
import './Settings.css';

const Settings = () => {
  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <nav className="settings-nav">
        <NavLink to="/settings/profile">Profile</NavLink>
        <NavLink to="/settings/categories">Categories</NavLink>
        <NavLink to="/settings/payment-methods">Payment Methods</NavLink>
        <NavLink to="/settings/notifications">Notifications</NavLink>
        <NavLink to="/settings/data">Data Export</NavLink>
      </nav>
      <div className="settings-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Settings;
