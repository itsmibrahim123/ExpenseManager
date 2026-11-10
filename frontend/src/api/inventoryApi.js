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

export const deleteProduct = (id) => {
    return api.delete(`/products/${id}`);
};

// Upload standalone product image (returns { imageUrl, filename })
export const uploadImage = (file, productId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (productId) {
        formData.append('productId', productId);
    }
    return api.post('/products/upload-image', formData);
};

// Upload image specifically for a product
export const uploadProductImage = (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/products/${id}/image`, formData);
};

// Delete image from a product
export const deleteProductImage = (id) => {
    return api.delete(`/products/${id}/image`);
};

export const restockProduct = (id, restockData) => {
    return api.post(`/products/${id}/restock`, restockData);
};

export const getProductSerials = (id, status) => {
    return api.get(`/products/${id}/serials`, {
        params: { status }
    });
};

export const addProductSerials = (id, serialNumbers, notes) => {
    return api.post(`/products/${id}/serials`, { serialNumbers, notes });
};

export const adjustStock = (adjustmentData) => {
    return api.post('/stock/adjust', adjustmentData);
};

export const getStockMovements = (productId) => {
    return api.get('/stock/movements', {
        params: { productId }
    });
};
