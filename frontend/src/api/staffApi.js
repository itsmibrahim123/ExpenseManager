import api from './axios';

export const getStaff = () => {
    return api.get('/staff');
};

export const createStaff = (staffData) => {
    return api.post('/staff', staffData);
};

export const updateStaffRole = (id, role) => {
    return api.patch(`/staff/${id}/role`, { role });
};

export const toggleStaffStatus = (id) => {
    return api.patch(`/staff/${id}/status`);
};

export const deleteStaff = (id) => {
    return api.delete(`/staff/${id}`);
};
