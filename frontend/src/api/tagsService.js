import api from './axios';

const TagsService = {
    getAll: async (userId) => {
        const response = await api.get('/tags', { params: { userId } });
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/tags', data);
        return response.data;
    },
    delete: async (id) => {
        await api.delete(`/tags/${id}`);
    }
};

export default TagsService;
