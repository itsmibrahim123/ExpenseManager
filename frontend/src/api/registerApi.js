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

export const addCashMovement = (data) => {
    return api.post('/register/movement', data);
};

export const getSessionMovements = (sessionId) => {
    return api.get(`/register/movements/${sessionId}`);
};

export const getRegisterHistory = (startDate, endDate, userId) => {
    return api.get('/register/history', {
        params: { startDate, endDate, userId }
    });
};
