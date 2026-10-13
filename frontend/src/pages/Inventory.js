import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Grid, FormControlLabel, Switch, MenuItem, Select, InputLabel, FormControl, Alert, CircularProgress,
    Avatar, IconButton, Tooltip, Card, CardMedia
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WarningIcon from '@mui/icons-material/Warning';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloseIcon from '@mui/icons-material/Close';
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    restockProduct,
    uploadProductImage,
    uploadImage,
    deleteProductImage
} from '../api/inventoryApi';
import { getAccountsByUser } from '../api/accountsService';
import { useAuth } from '../context/AuthContext';

const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
};

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const Inventory = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

    // Modals
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [restockModalOpen, setRestockModalOpen] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null);

    // Image Upload State
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [imageError, setImageError] = useState('');
    const [savingProduct, setSavingProduct] = useState(false);

    // Forms
    const [productForm, setProductForm] = useState({
        sku: '', barcode: '', name: '', description: '', costPrice: '', sellingPrice: '',
        currentStock: 0, reorderLevel: 5, unit: 'PCS', active: true, imageUrl: ''
    });

    const [restockForm, setRestockForm] = useState({
        quantity: 10, unitCostPrice: '', accountId: '', notes: '', referenceId: ''
    });

    useEffect(() => {
        fetchProducts();
        if (user) {
            getAccountsByUser(user.id).then(res => setAccounts(res.data)).catch(() => {});
        }
    }, [search, lowStockOnly]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await getProducts(search, lowStockOnly);
            setProducts(res.data || []);
        } catch (err) {
            showAlert('Failed to load products', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message, severity = 'success') => {
        setAlert({ show: true, message, severity });
        setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 4500);
    };

    const validateAndProcessFile = (file) => {
        setImageError('');
        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
            setImageError('Only JPG, PNG, and WebP images are allowed (up to 5MB).');
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            setImageError('File size exceeds the 5MB limit. Please choose a smaller image.');
            return;
        }

        setSelectedImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            validateAndProcessFile(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndProcessFile(e.dataTransfer.files[0]);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImageFile(null);
        setImagePreview(null);
        setImageError('');
        setProductForm(prev => ({ ...prev, imageUrl: '' }));
    };

    const handleOpenCreateModal = () => {
        setSelectedProduct(null);
        setSelectedImageFile(null);
        setImagePreview(null);
        setImageError('');
        setProductForm({
            sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
            barcode: '', name: '', description: '', costPrice: '', sellingPrice: '',
            currentStock: 0, reorderLevel: 5, unit: 'PCS', active: true, imageUrl: ''
        });
        setProductModalOpen(true);
    };

    const handleOpenEditModal = (product) => {
        setSelectedProduct(product);
        setSelectedImageFile(null);
        setImagePreview(product.imageUrl ? getImageUrl(product.imageUrl) : null);
        setImageError('');
        setProductForm({
            sku: product.sku,
            barcode: product.barcode || '',
            name: product.name,
            description: product.description || '',
            costPrice: product.costPrice,
            sellingPrice: product.sellingPrice,
            currentStock: product.currentStock,
            reorderLevel: product.reorderLevel,
            unit: product.unit || 'PCS',
            active: product.active,
            imageUrl: product.imageUrl || ''
        });
        setProductModalOpen(true);
    };

    const handleOpenPreviewModal = (product) => {
        setSelectedProduct(product);
        setPreviewModalOpen(true);
    };

    const handleQuickImageUpload = async (product, e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
            showAlert('Only JPG, PNG, and WebP images are allowed!', 'error');
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            showAlert('Image size exceeds 5MB limit.', 'error');
            return;
        }

        try {
            await uploadProductImage(product.id, file);
            showAlert(`Image updated successfully for ${product.name}!`);
            fetchProducts();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to upload photo', 'error');
        }
    };

    const handleOpenRestockModal = (product) => {
        setSelectedProduct(product);
        setRestockForm({
            quantity: 10,
            unitCostPrice: product.costPrice,
            accountId: accounts.length > 0 ? accounts[0].id : '',
            notes: '',
            referenceId: 'RESTOCK-' + Date.now().toString().slice(-6)
        });
        setRestockModalOpen(true);
    };

    const handleOpenDeleteModal = (product) => {
        setProductToDelete(product);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        try {
            await deleteProduct(productToDelete.id);
            showAlert(`Product "${productToDelete.name}" deleted successfully.`);
            setDeleteModalOpen(false);
            setProductToDelete(null);
            fetchProducts();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to delete product', 'error');
        }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setSavingProduct(true);
        try {
            if (selectedProduct) {
                // If editing existing product
                let updatedImageUrl = productForm.imageUrl;

                // Handle image removal if user removed previous image
                if (!imagePreview && selectedProduct.imageUrl) {
                    await deleteProductImage(selectedProduct.id);
                    updatedImageUrl = '';
                }

                await updateProduct(selectedProduct.id, {
                    ...productForm,
                    imageUrl: updatedImageUrl
                });

                // If user picked a new file to upload
                if (selectedImageFile) {
                    await uploadProductImage(selectedProduct.id, selectedImageFile);
                }

                showAlert('Product updated successfully!');
            } else {
                // If creating new product
                let finalImageUrl = productForm.imageUrl;
                if (selectedImageFile) {
                    const uploadRes = await uploadImage(selectedImageFile);
                    finalImageUrl = uploadRes.data?.imageUrl;
                }
                await createProduct({ ...productForm, imageUrl: finalImageUrl });
                showAlert('Product created successfully with image!');
            }
            setProductModalOpen(false);
            fetchProducts();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Error saving product', 'error');
        } finally {
            setSavingProduct(false);
        }
    };

    const handleSaveRestock = async (e) => {
        e.preventDefault();
        if (!restockForm.accountId) {
            showAlert('Please select an account to pay for restock expense', 'error');
            return;
        }
        try {
            await restockProduct(selectedProduct.id, restockForm);
            showAlert(`Restocked ${restockForm.quantity} units of ${selectedProduct.name}! Expense recorded.`);
            setRestockModalOpen(false);
            fetchProducts();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Error restocking product', 'error');
        }
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1}>
                    <InventoryIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" fontWeight="bold">
                        Product & Inventory Management
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateModal}
                    size="large"
                >
                    Add New Product
                </Button>
            </Box>

            {alert.show && (
                <Alert severity={alert.severity} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}

            {/* Filter Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={8}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by Product Name, SKU, or Barcode Scanner..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={lowStockOnly}
                                    onChange={(e) => setLowStockOnly(e.target.checked)}
                                    color="warning"
                                />
                            }
                            label="Show Low Stock Only"
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Inventory Table */}
            <TableContainer component={Paper} elevation={1}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ width: 110 }}><strong>Image</strong></TableCell>
                            <TableCell><strong>SKU / Barcode</strong></TableCell>
                            <TableCell><strong>Product Name</strong></TableCell>
                            <TableCell><strong>Stock Status</strong></TableCell>
                            <TableCell align="right"><strong>Cost Price</strong></TableCell>
                            <TableCell align="right"><strong>Selling Price</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    No products found in inventory.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((p) => {
                                let stockColor = 'success';
                                let stockLabel = `In Stock (${p.currentStock} ${p.unit})`;
                                if (p.currentStock === 0) {
                                    stockColor = 'error';
                                    stockLabel = `Out of Stock (${p.currentStock})`;
                                } else if (p.isLowStock) {
                                    stockColor = 'warning';
                                    stockLabel = `Low Stock (${p.currentStock} ${p.unit})`;
                                }

                                const resolvedImg = getImageUrl(p.imageUrl);

                                return (
                                    <TableRow key={p.id} hover>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Tooltip title={resolvedImg ? "Click to preview full image" : "No image uploaded"}>
                                                    <Box
                                                        onClick={() => resolvedImg && handleOpenPreviewModal(p)}
                                                        sx={{
                                                            position: 'relative',
                                                            cursor: resolvedImg ? 'pointer' : 'default',
                                                            '&:hover .zoom-overlay': {
                                                                opacity: resolvedImg ? 1 : 0
                                                            }
                                                        }}
                                                    >
                                                        <Avatar
                                                            variant="rounded"
                                                            src={resolvedImg}
                                                            alt={p.name}
                                                            sx={{
                                                                width: 44,
                                                                height: 44,
                                                                bgcolor: '#e3f2fd',
                                                                border: '1px solid #cfd8dc',
                                                                transition: 'transform 0.2s',
                                                                '&:hover': {
                                                                    transform: resolvedImg ? 'scale(1.05)' : 'none'
                                                                }
                                                            }}
                                                        >
                                                            <Inventory2OutlinedIcon color="primary" fontSize="small" />
                                                        </Avatar>
                                                        {resolvedImg && (
                                                            <Box
                                                                className="zoom-overlay"
                                                                sx={{
                                                                    position: 'absolute',
                                                                    inset: 0,
                                                                    bgcolor: 'rgba(0,0,0,0.3)',
                                                                    borderRadius: 1,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    opacity: 0,
                                                                    transition: 'opacity 0.2s'
                                                                }}
                                                            >
                                                                <ZoomInIcon sx={{ color: 'white', fontSize: 18 }} />
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Tooltip>
                                                <label htmlFor={`quick-upload-${p.id}`}>
                                                    <input
                                                        id={`quick-upload-${p.id}`}
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/webp"
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => handleQuickImageUpload(p, e)}
                                                    />
                                                    <Tooltip title="Quick upload / replace photo">
                                                        <IconButton
                                                            component="span"
                                                            size="small"
                                                            color="primary"
                                                        >
                                                            <PhotoCameraIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </label>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">{p.sku}</Typography>
                                            {p.barcode && (
                                                <Typography variant="caption" color="textSecondary">
                                                    Bar: {p.barcode}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">{p.name}</Typography>
                                            <Typography variant="caption" color="textSecondary" noWrap display="block" sx={{ maxWidth: 220 }}>
                                                {p.description || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={stockLabel}
                                                color={stockColor}
                                                size="small"
                                                icon={p.isLowStock ? <WarningIcon /> : null}
                                            />
                                        </TableCell>
                                        <TableCell align="right">Rs. {Number(p.costPrice).toLocaleString()}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                            Rs. {Number(p.sellingPrice).toLocaleString()}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="success"
                                                sx={{ mr: 1 }}
                                                onClick={() => handleOpenRestockModal(p)}
                                            >
                                                Restock
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<EditIcon />}
                                                sx={{ mr: 1 }}
                                                onClick={() => handleOpenEditModal(p)}
                                            >
                                                Edit
                                            </Button>
                                            <Tooltip title="Delete Product">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleOpenDeleteModal(p)}
                                                >
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Product Add/Edit Modal */}
            <Dialog open={productModalOpen} onClose={() => setProductModalOpen(false)} maxWidth="md" fullWidth>
                <form onSubmit={handleSaveProduct}>
                    <DialogTitle>{selectedProduct ? 'Edit Product & Photo' : 'Add New Product & Photo'}</DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            {/* Interactive Drag & Drop Product Image Uploader */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                    Product Image (Tenant Isolated)
                                </Typography>
                                {imageError && (
                                    <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setImageError('')}>
                                        {imageError}
                                    </Alert>
                                )}
                                <Box
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    sx={{
                                        border: `2px dashed ${isDragging ? '#1976d2' : '#90caf9'}`,
                                        borderRadius: 2,
                                        p: 2.5,
                                        display: 'flex',
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        alignItems: 'center',
                                        gap: 2.5,
                                        bgcolor: isDragging ? '#e3f2fd' : '#fcfcfc',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {/* Thumbnail Preview Box */}
                                    <Avatar
                                        variant="rounded"
                                        src={imagePreview}
                                        alt="Product Preview"
                                        sx={{
                                            width: 130,
                                            height: 130,
                                            bgcolor: '#e3f2fd',
                                            border: '2px solid #bbdefb',
                                            boxShadow: 1,
                                        }}
                                    >
                                        <Inventory2OutlinedIcon sx={{ fontSize: 56, color: '#1976d2', opacity: 0.8 }} />
                                    </Avatar>

                                    {/* Upload Trigger & Controls */}
                                    <Box flexGrow={1} textAlign={{ xs: 'center', sm: 'left' }}>
                                        <Box display="flex" alignItems="center" gap={1} justifyContent={{ xs: 'center', sm: 'flex-start' }} mb={0.5}>
                                            <CloudUploadIcon color="primary" />
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                Drag & drop product image or browse
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1.5 }}>
                                            Supports JPG, PNG, WebP up to 5MB. Stored with tenant isolation.
                                        </Typography>
                                        <Box display="flex" gap={1} alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                                            <label htmlFor="product-photo-file-input">
                                                <input
                                                    id="product-photo-file-input"
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp"
                                                    style={{ display: 'none' }}
                                                    onChange={handleFileChange}
                                                />
                                                <Button
                                                    variant="outlined"
                                                    component="span"
                                                    startIcon={<PhotoCameraIcon />}
                                                    size="small"
                                                >
                                                    {imagePreview ? 'Change Image' : 'Select Image File'}
                                                </Button>
                                            </label>
                                            {imagePreview && (
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    startIcon={<DeleteOutlineIcon />}
                                                    onClick={handleRemoveImage}
                                                >
                                                    Remove Image
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="SKU Code"
                                    required
                                    fullWidth
                                    value={productForm.sku}
                                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Barcode (Optional)"
                                    fullWidth
                                    value={productForm.barcode}
                                    onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Product Name"
                                    required
                                    fullWidth
                                    value={productForm.name}
                                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Description"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={productForm.description}
                                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Cost Price (Buying Price)"
                                    type="number"
                                    required
                                    fullWidth
                                    value={productForm.costPrice}
                                    onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Selling Price (Retail)"
                                    type="number"
                                    required
                                    fullWidth
                                    value={productForm.sellingPrice}
                                    onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Current Stock"
                                    type="number"
                                    required
                                    fullWidth
                                    disabled={!!selectedProduct}
                                    value={productForm.currentStock}
                                    onChange={(e) => setProductForm({ ...productForm, currentStock: parseInt(e.target.value) || 0 })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Reorder Alert Level"
                                    type="number"
                                    required
                                    fullWidth
                                    value={productForm.reorderLevel}
                                    onChange={(e) => setProductForm({ ...productForm, reorderLevel: parseInt(e.target.value) || 0 })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Unit (PCS, BOWL, KG, METER)"
                                    required
                                    fullWidth
                                    value={productForm.unit}
                                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setProductModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={savingProduct}>
                            {savingProduct ? 'Saving...' : 'Save Product'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Click-to-Zoom Lightbox Modal Preview */}
            <Dialog open={previewModalOpen} onClose={() => setPreviewModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6" fontWeight="bold">
                            {selectedProduct?.name}
                        </Typography>
                        <Chip label={selectedProduct?.sku} size="small" color="primary" variant="outlined" />
                    </Box>
                    <IconButton size="small" onClick={() => setPreviewModalOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    <Card elevation={0}>
                        <CardMedia
                            component="img"
                            image={getImageUrl(selectedProduct?.imageUrl)}
                            alt={selectedProduct?.name}
                            sx={{
                                maxHeight: 380,
                                width: '100%',
                                objectFit: 'contain',
                                bgcolor: '#fafafa',
                                p: 1
                            }}
                        />
                    </Card>
                    <Box p={2.5}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary">Selling Price</Typography>
                                <Typography variant="h6" fontWeight="bold" color="primary.main">
                                    Rs. {Number(selectedProduct?.sellingPrice || 0).toLocaleString()}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary">Stock Available</Typography>
                                <Typography variant="h6" fontWeight="bold">
                                    {selectedProduct?.currentStock} {selectedProduct?.unit}
                                </Typography>
                            </Grid>
                            {selectedProduct?.description && (
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="textSecondary">Description</Typography>
                                    <Typography variant="body2">{selectedProduct.description}</Typography>
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewModalOpen(false)}>Close</Button>
                    <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={() => {
                            setPreviewModalOpen(false);
                            if (selectedProduct) handleOpenEditModal(selectedProduct);
                        }}
                    >
                        Edit Product
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Restock Modal */}
            <Dialog open={restockModalOpen} onClose={() => setRestockModalOpen(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleSaveRestock}>
                    <DialogTitle>
                        Restock Inventory: {selectedProduct?.name}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Restocking records an expense against your store's account and updates stock levels immediately.
                        </Alert>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Quantity to Add"
                                    type="number"
                                    required
                                    fullWidth
                                    value={restockForm.quantity}
                                    onChange={(e) => setRestockForm({ ...restockForm, quantity: parseInt(e.target.value) || 0 })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Unit Cost Price"
                                    type="number"
                                    required
                                    fullWidth
                                    value={restockForm.unitCostPrice}
                                    onChange={(e) => setRestockForm({ ...restockForm, unitCostPrice: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel>Pay from Account</InputLabel>
                                    <Select
                                        value={restockForm.accountId}
                                        label="Pay from Account"
                                        onChange={(e) => setRestockForm({ ...restockForm, accountId: e.target.value })}
                                    >
                                        {accounts.map(acc => (
                                            <MenuItem key={acc.id} value={acc.id}>
                                                {acc.name} ({acc.type}) - Balance: Rs. {acc.currentBalance}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Supplier Invoice / Reference"
                                    fullWidth
                                    value={restockForm.referenceId}
                                    onChange={(e) => setRestockForm({ ...restockForm, referenceId: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Notes"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={restockForm.notes}
                                    onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setRestockModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" color="success">
                            Confirm Restock
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Confirm Delete Product Dialog */}
            <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        Are you sure you want to delete product <strong>{productToDelete?.name}</strong>?
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        This will remove the product and clean up its stored image file.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Inventory;
