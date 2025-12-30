import axios from 'axios';

const API_URL = 'http://localhost:8080/api/recurring';

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
