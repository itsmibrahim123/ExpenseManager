import api from './axios';

// Store Tenant Lifecycle Endpoints
export const getTenants = (params) => {
    return api.get('/admin/tenants', { params });
};
export const fetchTenants = getTenants;

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

export const getTenantSettings = (id) => {
    return api.get(`/admin/tenants/${id}/settings`);
};

export const updateTenantSettings = (id, data) => {
    return api.put(`/admin/tenants/${id}/settings`, data);
};

// Platform Governance Metrics (No sales/financial data)
export const fetchPlatformMetrics = () => {
    return api.get('/admin/metrics');
};
export const getPlatformMetrics = fetchPlatformMetrics;

// Platform User Directory & Access Governance
export const fetchUsers = (params) => {
    return api.get('/admin/users', { params });
};
export const getAllAdminUsers = fetchUsers;

export const createUser = (data) => {
    return api.post('/admin/users', data);
};
export const createAdminUser = createUser;

export const updateUserAccess = (id, data) => {
    return api.put(`/admin/users/${id}/access`, data);
};
export const updateAdminUserAccess = updateUserAccess;

export const resetUserPassword = (id, password) => {
    return api.put(`/admin/users/${id}/reset-password`, { password });
};

export const deleteUser = (id) => {
    return api.delete(`/admin/users/${id}`);
};
export const deleteAdminUser = deleteUser;
