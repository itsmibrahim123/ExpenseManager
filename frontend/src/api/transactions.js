import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const API_URL = `${BASE_URL}/api/transactions`;

const getTransactions = (token) => {
    return axios.get(API_URL, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
};

const recordTransaction = (token, transactionData) => {
    return axios.post(API_URL, transactionData, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
};

const transfer = (token, transferData) => {
    return axios.post(`${API_URL}/transfer`, transferData, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
};

export default {
    getTransactions,
    recordTransaction,
    transfer
};
