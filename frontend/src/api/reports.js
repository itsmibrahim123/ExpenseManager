import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const API_URL = `${BASE_URL}/api/reports`;

const getDashboardReport = (token) => {
  return axios.get(`${API_URL}/dashboard`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export default {
  getDashboardReport,
};
