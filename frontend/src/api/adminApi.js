import api from './axios';

export const getTenants = (params) => {
    return api.get('/admin/tenants', { params });
};

export const getTenantById = (id) => {
    return api.get(`/admin/tenants/${id}`);
};

export const createTenant = (data) => {
    return api.post('/admin/tenants', data);
};

export const updateTenantStatus = (id, status) => {
    return api.put(`/admin/tenants/${id}/status`, { status });
};

export const updateSubscription = (id, data) => {
    return api.put(`/admin/tenants/${id}/subscription`, data);
};

export const getPlatformMetrics = () => {
    return api.get('/admin/metrics');
};

export const getTenantSettings = (id) => {
    return api.get(`/admin/tenants/${id}/settings`);
};

export const updateTenantSettings = (id, data) => {
    return api.put(`/admin/tenants/${id}/settings`, data);
};
