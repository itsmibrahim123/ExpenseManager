import axios from 'axios';

const BASE_URL = 'http://localhost:8080';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        // When sending FormData, delete Content-Type so browser sets multipart/form-data with the correct boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Auto-logout if 401 occurs (optional, but good for security)
            localStorage.removeItem('token');
            // window.location.href = '/login'; // Can be handled by AuthContext
        }
        return Promise.reject(error);
    }
);

export default api;
