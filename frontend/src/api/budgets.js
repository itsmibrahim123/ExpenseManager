import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const API_URL = `${BASE_URL}/api/budgets`;

const getBudgets = (token) => {
    return axios.get(API_URL, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
};

const createBudget = (token, budgetData) => {
    return axios.post(API_URL, budgetData, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
};

export default {
    getBudgets,
    createBudget
};
