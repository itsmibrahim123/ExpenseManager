import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

const register = (fullName, email, password, preferredCurrency) => {
  return axios.post(`${API_URL}/register`, {
    fullName,
    email,
    password,
    preferredCurrency,
  });
};

const login = (email, password) => {
  return axios.post(`${API_URL}/login`, {
    email,
    password,
  });
};

const logout = () => {
  localStorage.removeItem('token');
};

export default {
  register,
  login,
  logout,
};
