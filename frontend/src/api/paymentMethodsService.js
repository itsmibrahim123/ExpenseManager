import api from './axios';

const PaymentMethodsService = {
    getAll: async (userId) => {
        const response = await api.get('/payment-methods', { params: { userId } });
        if (response.data && response.data.content && Array.isArray(response.data.content)) {
            return response.data.content;
        }
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/payment-methods', data);
        return response.data;
    },
    delete: async (id) => {
        await api.delete(`/payment-methods/${id}`);
    }
};

export default PaymentMethodsService;