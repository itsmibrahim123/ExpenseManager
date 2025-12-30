import axios from 'axios';

const API_URL = '/api/auth';

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

export default {
  register,
  login,
};
