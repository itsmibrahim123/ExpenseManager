import React from 'react';
import { useState, useEffect } from 'react';
import transactionsService from '../../api/transactions';
import './Transactions.css';

const Transactions = ({ token, onLogout }) => {
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!token) return;
            try {
                const response = await transactionsService.getTransactions(token);
                setTransactions(response.data);
            } catch (err) {
                console.error("Error fetching transactions:", err);
                if (err.response && err.response.status === 403) {
                    onLogout();
                } else {
                    setError('Failed to fetch transactions.');
                }
            }
        };
        fetchTransactions();
    }, [token, onLogout]);

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="transactions-container">
            <h1>Transactions</h1>
            {/* Add transaction form/button and filtering would go here */}
            <table className="transactions-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Account</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(tx => (
                        <tr key={tx.id}>
                            <td>{new Date(tx.date).toLocaleDateString()}</td>
                            <td>{tx.category}</td>
                            <td>{tx.type}</td>
                            <td>${tx.amount}</td>
                            <td>{tx.account}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Transactions;
