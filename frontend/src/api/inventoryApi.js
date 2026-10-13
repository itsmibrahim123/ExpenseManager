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
    return api.post('/products/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

// Upload image specifically for a product
export const uploadProductImage = (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/products/${id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

// Delete image from a product
export const deleteProductImage = (id) => {
    return api.delete(`/products/${id}/image`);
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
