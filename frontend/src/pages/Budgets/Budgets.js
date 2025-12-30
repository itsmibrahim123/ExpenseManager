import { useState, useEffect } from 'react';
import budgetsService from '../../api/budgets';
import './Budgets.css';

const Budgets = ({ token, onLogout }) => {
    const [budgets, setBudgets] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBudgets = async () => {
            if (!token) return;
            try {
                const response = await budgetsService.getBudgets(token);
                setBudgets(response.data);
            } catch (err) {
                console.error("Error fetching budgets:", err);
                if (err.response && err.response.status === 403) {
                    onLogout();
                } else {
                    setError('Failed to fetch budgets.');
                }
            }
        };
        fetchBudgets();
    }, [token, onLogout]);

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="budgets-container">
            <h1>Budgets</h1>
            {/* Create budget form/button would go here */}
            <div className="budgets-list">
                {budgets.map(budget => (
                    <div key={budget.id} className="budget-card card">
                        <h3>{budget.category}</h3>
                        <progress value={budget.spentAmount} max={budget.limitAmount}></progress>
                        <p>${budget.spentAmount} / ${budget.limitAmount}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Budgets;
