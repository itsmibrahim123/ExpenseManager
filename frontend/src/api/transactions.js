import axios from 'axios';

const API_URL = 'http://localhost:8080/api/transactions';

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

// ... and so on for search and attachments

export default {
    getTransactions,
    recordTransaction,
    transfer
};
