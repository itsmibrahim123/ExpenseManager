import api from './axios';

const downloadFile = (response) => {
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    const contentDisposition = response.headers['content-disposition'];
    let fileName = 'download.csv';
    if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2)
            fileName = fileNameMatch[1];
    }
    
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

const ExportService = {
    exportTransactions: async (data) => {
        const response = await api.post('/export/transactions', data, { responseType: 'blob' });
        downloadFile(response);
    },
    exportAccounts: async (data) => {
        const response = await api.post('/export/accounts', data, { responseType: 'blob' });
        downloadFile(response);
    },
    exportBudgets: async (data) => {
        const response = await api.post('/export/budgets', data, { responseType: 'blob' });
        downloadFile(response);
    },
    exportCategories: async (data) => {
        const response = await api.post('/export/categories', data, { responseType: 'blob' });
        downloadFile(response);
    },
    exportAll: async (data) => {
        const response = await api.post('/export/all', data, { responseType: 'blob' });
        downloadFile(response);
    }
};

export default ExportService;
