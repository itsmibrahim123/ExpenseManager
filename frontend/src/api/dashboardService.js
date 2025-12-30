import api from './axios';

const DashboardService = {
    getSummary: async (userId, params) => {
        const response = await api.get('/dashboard/summary', { params: { userId, ...params } });
        return response.data;
    },
    getCategoryBreakdown: async (userId, type, params) => {
        const response = await api.get('/dashboard/category-breakdown', { params: { userId, type, ...params } });
        return response.data;
    },
    getBudgetProgress: async (userId, params) => {
        const response = await api.get('/dashboard/budget-progress', { params: { userId, ...params } });
        return response.data;
    },
    getSpendingTrends: async (userId, params) => {
        const response = await api.get('/dashboard/spending-trends', { params: { userId, ...params } });
        return response.data;
    },
    getIncomeExpenseComparison: async (userId, params) => {
        const response = await api.get('/dashboard/income-expense-comparison', { params: { userId, ...params } });
        return response.data;
    },
    getTopCategories: async (userId, type, params) => {
        const response = await api.get('/dashboard/top-categories', { params: { userId, type, ...params } });
        return response.data;
    },
    getAccountSummary: async (userId) => {
        const response = await api.get('/dashboard/account-summary', { params: { userId } });
        return response.data;
    }
};

export default DashboardService;
