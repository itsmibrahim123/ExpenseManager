import { useState, useEffect } from 'react';
import reportsService from '../../api/reports';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = ({ token, onLogout }) => {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      if (!token) return; // Don't fetch if there's no token

      try {
        const response = await reportsService.getDashboardReport(token);
        setReport(response.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        if (err.response && err.response.status === 403) {
          // Token is invalid or expired, trigger logout
          onLogout();
        } else {
          setError('Failed to fetch dashboard data.');
        }
      }
    };
    fetchReport();
  }, [token, onLogout]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!report) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <div className="stats-cards">
        <div className="card">
          <h3>Total Balance</h3>
          <p>${report.totalBalance}</p>
        </div>
        <div className="card">
          <h3>Income This Month</h3>
          <p>${report.incomeThisMonth}</p>
        </div>
        <div className="card">
          <h3>Expense This Month</h3>
          <p>${report.expenseThisMonth}</p>
        </div>
      </div>
      <div className="quick-actions">
        <Link to="/transactions/new" className="btn">Add Expense</Link>
        <Link to="/transactions/new" className="btn">Add Income</Link>
        <Link to="/transactions/transfer" className="btn">Make a Transfer</Link>
      </div>
      <div className="charts">
        {/* Chart component would go here */}
        <h3>Expense by Category</h3>
      </div>
    </div>
  );
};

export default Dashboard;

