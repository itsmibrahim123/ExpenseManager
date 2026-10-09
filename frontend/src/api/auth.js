import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

export const register = (fullName, email, password, preferredCurrency) => {
  return axios.post(`${API_URL}/register`, {
    fullName,
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

export default {
  register,
  login,
  logout,
};
