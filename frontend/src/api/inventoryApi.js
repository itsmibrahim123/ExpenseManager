import api from './axios';

export const getProducts = (search, lowStockOnly) => {
    return api.get('/products', {
        params: { search, lowStockOnly }
    });
};

export const getProductById = (id) => {
    return api.get(`/products/${id}`);
};

export const createProduct = (productData) => {
    return api.post('/products', productData);
};

export const updateProduct = (id, productData) => {
    return api.put(`/products/${id}`, productData);
};

export const restockProduct = (id, restockData) => {
    return api.post(`/products/${id}/restock`, restockData);
};

export const adjustStock = (adjustmentData) => {
    return api.post('/stock/adjust', adjustmentData);
};

export const getStockMovements = (productId) => {
    return api.get('/stock/movements', {
        params: { productId }
    });
};
