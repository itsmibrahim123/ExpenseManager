/**
 * Resolves product and asset image paths to full URLs in both local development and production.
 * Supports absolute URLs (e.g. Unsplash, external CDNs) and relative tenant upload paths.
 */
export const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${cleanBase}${cleanPath}`;
};

export default getImageUrl;
