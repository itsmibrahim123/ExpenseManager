import api from './axios';

export const createInvoice = (invoiceData) => {
    return api.post('/invoices', invoiceData);
};

export const getInvoices = (status, startDate, endDate) => {
    return api.get('/invoices', {
        params: { status, startDate, endDate }
    });
};

export const getInvoiceById = (id) => {
    return api.get(`/invoices/${id}`);
};

export const getInvoiceByNumber = (invoiceNumber) => {
    return api.get(`/invoices/number/${invoiceNumber}`);
};
