import { useState, useEffect } from 'react';
import recurringService from '../../api/recurring';
import './Recurring.css';

const Recurring = ({ token, onLogout }) => {
    const [rules, setRules] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRules = async () => {
            if (!token) return;
            try {
                const response = await recurringService.getRecurringRules(token);
                setRules(response.data);
            } catch (err) {
                console.error("Error fetching recurring rules:", err);
                if (err.response && err.response.status === 403) {
                    onLogout();
                } else {
                    setError('Failed to fetch recurring rules.');
                }
            }
        };
        fetchRules();
    }, [token, onLogout]);

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="recurring-container">
            <h1>Recurring Transactions</h1>
            {/* Create rule form/button would go here */}
            <table className="recurring-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Frequency</th>
                        <th>Next Run Date</th>
                    </tr>
                </thead>
                <tbody>
                    {rules.map(rule => (
                        <tr key={rule.id}>
                            <td>{rule.type}</td>
                            <td>${rule.amount}</td>
                            <td>{rule.frequency}</td>
                            <td>{new Date(rule.nextRunDate).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Recurring;
