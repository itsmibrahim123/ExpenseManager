import { useState, useEffect } from 'react';
import accountsService from '../../api/accounts';
import './Accounts.css';

const Accounts = ({ token, onLogout }) => {
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!token) return;
      try {
        const response = await accountsService.getAccounts(token);
        setAccounts(response.data);
      } catch (err) {
        console.error("Error fetching accounts:", err);
        if (err.response && err.response.status === 403) {
          onLogout();
        } else {
          setError('Failed to fetch accounts.');
        }
      }
    };
    fetchAccounts();
  }, [token, onLogout]);

  // Handlers for create, update, delete would go here

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="accounts-container">
      <h1>Accounts</h1>
      {/* Button to open a create form modal would go here */}
      <div className="accounts-list">
        {accounts.map(account => (
          <div key={account.id} className="account-card card">
            <h3>{account.name}</h3>
            <p>Type: {account.type}</p>
            <p>Balance: ${account.balance}</p>
            {/* Buttons for edit/delete would go here */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Accounts;
