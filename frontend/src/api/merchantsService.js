import api from './axios';

const MerchantsService = {
    getAll: async (userId) => {
        const response = await api.get('/merchants', { params: { userId } });
        if (response.data && response.data.content && Array.isArray(response.data.content)) {
            return response.data.content;
        }
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/merchants', data);
        return response.data;
    },
    delete: async (id) => {
        await api.delete(`/merchants/${id}`);
    }
};

export default MerchantsService;