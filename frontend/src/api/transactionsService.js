import api from './axios';

const TransactionsService = {
    getAll: async (userId, accountId) => {
        const response = await api.get('/transactions', { params: { userId, accountId } });
        return response.data;
    },
    search: async (filter) => {
        const response = await api.get('/transactions/search', { params: filter });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/transactions/${id}`);
        return response.data;
    },
    create: async (data, allowNegative = false) => {
        const response = await api.post('/transactions', data, { params: { allowNegative } });
        return response.data;
    },
    transfer: async (data, allowNegative = false) => {
        const response = await api.post('/transactions/transfer', data, { params: { allowNegative } });
        return response.data;
    },
    updateStatus: async (id, status) => {
        const response = await api.patch(`/transactions/${id}/status`, null, { params: { status } });
        return response.data;
    }
};

export default TransactionsService;
