import api from './axios';

export const getCustomers = (query) => {
    return api.get('/customers', {
        params: { query }
    });
};

export const getCustomerById = (id) => {
    return api.get(`/customers/${id}`);
};

export const createCustomer = (customerData) => {
    return api.post('/customers', customerData);
};

export const updateCustomer = (id, customerData) => {
    return api.put(`/customers/${id}`, customerData);
};
