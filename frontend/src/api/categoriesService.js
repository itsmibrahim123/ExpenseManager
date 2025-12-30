import api from './axios';

const CategoriesService = {
    getAll: async (userId, type) => {
        const response = await api.get('/categories', { params: { userId, type } });
        // Handle Spring Data Page response
        if (response.data && response.data.content && Array.isArray(response.data.content)) {
            return response.data.content;
        }
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/categories', data);
        return response.data;
    },
    delete: async (id) => {
        await api.delete(`/categories/${id}`);
    }
};

export default CategoriesService;