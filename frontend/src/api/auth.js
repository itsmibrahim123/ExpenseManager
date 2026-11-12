import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const API_URL = `${BASE_URL}/api/auth`;

export const register = (data, email, password, preferredCurrency) => {
  if (typeof data === 'object' && data !== null) {
    return axios.post(`${API_URL}/register`, data);
  }
  return axios.post(`${API_URL}/register`, {
    fullName: data,
    email,
    password,
    preferredCurrency,
  });
};

export const login = (email, password) => {
  return axios.post(`${API_URL}/login`, {
    email,
    password,
  });
};

export const logout = () => {
  localStorage.removeItem('token');
};

const authService = {
  register,
  login,
  logout,
};

export default authService;
