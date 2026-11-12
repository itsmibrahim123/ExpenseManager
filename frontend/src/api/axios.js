import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 25000,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        // When sending FormData, ensure Content-Type is deleted so browser sets multipart/form-data with boundary
        if (config.data instanceof FormData) {
            if (config.headers && typeof config.headers.delete === 'function') {
                config.headers.delete('Content-Type');
                config.headers.delete('content-type');
            }
            if (config.headers) {
                delete config.headers['Content-Type'];
                delete config.headers['content-type'];
            }
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
