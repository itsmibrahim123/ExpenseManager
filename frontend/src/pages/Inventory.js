import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Grid, FormControlLabel, Switch, MenuItem, Select, InputLabel, FormControl, Alert, CircularProgress,
    Avatar, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import EditIcon from '@mui/icons-material/Edit';
import WarningIcon from '@mui/icons-material/Warning';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
    getProducts,
    createProduct,
    updateProduct,
    restockProduct,
    uploadProductImage,
    uploadImage
} from '../api/inventoryApi';
import { getAccountsByUser } from '../api/accountsService';
import { useAuth } from '../context/AuthContext';

const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
};

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
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Image Upload State
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
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
        setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 4000);
    };

    const handleOpenCreateModal = () => {
        setSelectedProduct(null);
        setSelectedImageFile(null);
        setImagePreview(null);
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleQuickImageUpload = async (product, e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            await uploadProductImage(product.id, file);
            showAlert(`Photo uploaded for ${product.name}!`);
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

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setSavingProduct(true);
        try {
            if (selectedProduct) {
                // If editing existing product
                await updateProduct(selectedProduct.id, productForm);
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
                showAlert('Product created successfully with photo!');
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
                        Product & Plate Management
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateModal}
                    size="large"
                >
                    Add New Product / Plate
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
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>Plate Photo</strong></TableCell>
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

                                return (
                                    <TableRow key={p.id} hover>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar
                                                    variant="rounded"
                                                    src={getImageUrl(p.imageUrl)}
                                                    alt={p.name}
                                                    sx={{
                                                        width: 52,
                                                        height: 52,
                                                        bgcolor: '#f5f5f5',
                                                        border: '1px solid #e0e0e0',
                                                    }}
                                                >
                                                    <RestaurantMenuIcon color="action" />
                                                </Avatar>
                                                <label htmlFor={`quick-upload-${p.id}`}>
                                                    <input
                                                        id={`quick-upload-${p.id}`}
                                                        type="file"
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => handleQuickImageUpload(p, e)}
                                                    />
                                                    <IconButton
                                                        component="span"
                                                        size="small"
                                                        color="primary"
                                                        title="Upload / Change Photo"
                                                    >
                                                        <PhotoCameraIcon fontSize="small" />
                                                    </IconButton>
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
                                            <Typography variant="caption" color="textSecondary">{p.description}</Typography>
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
                                                onClick={() => handleOpenEditModal(p)}
                                            >
                                                Edit
                                            </Button>
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
                            {/* Plate Photo Upload Card */}
                            <Grid item xs={12}>
                                <Box
                                    sx={{
                                        border: '2px dashed #b0bec5',
                                        borderRadius: 2,
                                        p: 2.5,
                                        display: 'flex',
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        alignItems: 'center',
                                        gap: 2.5,
                                        bgcolor: '#fcfcfc',
                                    }}
                                >
                                    <Avatar
                                        variant="rounded"
                                        src={imagePreview}
                                        alt="Plate Preview"
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            bgcolor: '#e0e0e0',
                                            border: '2px solid #cfd8dc',
                                            boxShadow: 1,
                                        }}
                                    >
                                        <RestaurantMenuIcon sx={{ fontSize: 50, color: '#90a4ae' }} />
                                    </Avatar>
                                    <Box flexGrow={1}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Plate / Product Photo
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1.5 }}>
                                            Upload a clear photo of the plate so cashiers can quickly identify and tap it on the POS screen. Supports JPG, PNG, WEBP.
                                        </Typography>
                                        <Box display="flex" gap={1} alignItems="center">
                                            <label htmlFor="product-photo-file-input">
                                                <input
                                                    id="product-photo-file-input"
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={handleFileChange}
                                                />
                                                <Button
                                                    variant="outlined"
                                                    component="span"
                                                    startIcon={<PhotoCameraIcon />}
                                                    size="small"
                                                >
                                                    {imagePreview ? 'Change Photo' : 'Upload Plate Photo'}
                                                </Button>
                                            </label>
                                            {imagePreview && (
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    startIcon={<DeleteOutlineIcon />}
                                                    onClick={() => {
                                                        setSelectedImageFile(null);
                                                        setImagePreview(null);
                                                        setProductForm(prev => ({ ...prev, imageUrl: '' }));
                                                    }}
                                                >
                                                    Remove
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
                                    label="Product / Plate Name"
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
                                    label="Unit (PCS, PLATE, BOWL, KG)"
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
        </Box>
    );
};

export default Inventory;
