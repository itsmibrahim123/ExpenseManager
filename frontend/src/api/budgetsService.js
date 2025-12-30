import api from './axios';

const BudgetsService = {
    getAll: async (userId) => {
        const response = await api.get('/budgets', { params: { userId } });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/budgets/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/budgets', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/budgets/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        await api.delete(`/budgets/${id}`);
    }
};

export default BudgetsService;
