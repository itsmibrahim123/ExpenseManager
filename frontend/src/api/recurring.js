import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const API_URL = `${BASE_URL}/api/recurring`;

const getRecurringRules = (token) => {
    return axios.get(API_URL, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
};

const createRecurringRule = (token, ruleData) => {
    return axios.post(API_URL, ruleData, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
};

export default {
    getRecurringRules,
    createRecurringRule
};
