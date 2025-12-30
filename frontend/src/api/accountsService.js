import api from './axios';

const AccountsService = {
    getAll: async (userId, includeArchived = false) => {
        const response = await api.get('/accounts', { params: { userId, includeArchived } });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/accounts/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/accounts', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/accounts/${id}`, data);
        return response.data;
    },
    archive: async (id, force = false) => {
        const response = await api.delete(`/accounts/${id}/archive`, { params: { force } });
        return response.data;
    }
};

export default AccountsService;
