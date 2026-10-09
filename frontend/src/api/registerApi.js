import api from './axios';

export const openRegister = (data) => {
    return api.post('/register/open', data);
};

export const closeRegister = (sessionId, data) => {
    return api.post(`/register/close/${sessionId}`, data);
};

export const getActiveRegister = (userId) => {
    return api.get('/register/active', {
        params: { userId }
    });
};

export const getDailySummary = (date, userId) => {
    return api.get('/register/daily-summary', {
        params: { date, userId }
    });
};
