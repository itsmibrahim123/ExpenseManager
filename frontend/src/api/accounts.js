import axios from 'axios';

const API_URL = 'http://localhost:8080/api/accounts';

const getAccounts = (token) => {
  return axios.get(API_URL, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

const createAccount = (token, accountData) => {
  return axios.post(API_URL, accountData, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

const updateAccount = (token, id, accountData) => {
  return axios.put(`${API_URL}/${id}`, accountData, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

const deleteAccount = (token, id) => {
  return axios.delete(`${API_URL}/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export default {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
};
