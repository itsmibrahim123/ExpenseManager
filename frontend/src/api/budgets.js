import axios from 'axios';

const API_URL = 'http://localhost:8080/api/budgets';

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
