import api from './axios';

export const createInvoice = (invoiceData) => {
    return api.post('/invoices', invoiceData);
};

export const getInvoices = (status, type, startDate, endDate) => {
    return api.get('/invoices', {
        params: { status, type, startDate, endDate }
    });
};

export const getInvoiceById = (id) => {
    return api.get(`/invoices/${id}`);
};

export const getInvoiceByNumber = (invoiceNumber) => {
    return api.get(`/invoices/number/${invoiceNumber}`);
};

export const recordPayment = (invoiceId, paymentData) => {
    return api.post(`/invoices/${invoiceId}/payments`, paymentData);
};

export const getInvoicePdf = async (invoiceId) => {
    return api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
    });
};

export const downloadInvoicePdf = async (invoiceId, invoiceNumber) => {
    const res = await getInvoicePdf(invoiceId);
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${invoiceNumber || invoiceId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
};
