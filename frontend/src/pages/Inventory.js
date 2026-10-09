import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Grid, FormControlLabel, Switch, MenuItem, Select, InputLabel, FormControl, Alert, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import EditIcon from '@mui/icons-material/Edit';
import WarningIcon from '@mui/icons-material/Warning';
import { getProducts, createProduct, updateProduct, restockProduct } from '../api/inventoryApi';
import { getAccountsByUser } from '../api/accountsService';
import { useAuth } from '../context/AuthContext';

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

    // Forms
    const [productForm, setProductForm] = useState({
        sku: '', barcode: '', name: '', description: '', costPrice: '', sellingPrice: '',
        currentStock: 0, reorderLevel: 5, unit: 'PCS', active: true
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
        setProductForm({
            sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
            barcode: '', name: '', description: '', costPrice: '', sellingPrice: '',
            currentStock: 0, reorderLevel: 5, unit: 'PCS', active: true
        });
        setProductModalOpen(true);
    };

    const handleOpenEditModal = (product) => {
        setSelectedProduct(product);
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
            active: product.active
        });
        setProductModalOpen(true);
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
        try {
            if (selectedProduct) {
                await updateProduct(selectedProduct.id, productForm);
                showAlert('Product updated successfully!');
            } else {
                await createProduct(productForm);
                showAlert('Product created successfully!');
            }
            setProductModalOpen(false);
            fetchProducts();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Error saving product', 'error');
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
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
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
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
                    <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
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
                                    disabled={!!selectedProduct} // Use Restock modal to adjust stock
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
                                    label="Unit (PCS, KG, BOX)"
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
                        <Button type="submit" variant="contained">Save Product</Button>
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
                            Restocking automatically logs an <strong>EXPENSE</strong> transaction against your selected account for total purchase cost.
                        </Alert>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Restock Quantity"
                                    type="number"
                                    required
                                    fullWidth
                                    value={restockForm.quantity}
                                    onChange={(e) => setRestockForm({ ...restockForm, quantity: parseInt(e.target.value) || 1 })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Unit Cost Price (PKR)"
                                    type="number"
                                    required
                                    fullWidth
                                    value={restockForm.unitCostPrice}
                                    onChange={(e) => setRestockForm({ ...restockForm, unitCostPrice: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel>Payment Source Account</InputLabel>
                                    <Select
                                        value={restockForm.accountId}
                                        label="Payment Source Account"
                                        onChange={(e) => setRestockForm({ ...restockForm, accountId: e.target.value })}
                                    >
                                        {accounts.map((acc) => (
                                            <MenuItem key={acc.id} value={acc.id}>
                                                {acc.name} (Balance: Rs. {Number(acc.currentBalance).toLocaleString()})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Supplier Invoice / PO Ref"
                                    fullWidth
                                    value={restockForm.referenceId}
                                    onChange={(e) => setRestockForm({ ...restockForm, referenceId: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 'bold', color: 'error.main' }}>
                                    Total Purchase Cost: Rs. {(Number(restockForm.unitCostPrice || 0) * Number(restockForm.quantity || 0)).toLocaleString()}
                                </Typography>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setRestockModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" color="success">
                            Confirm Restock & Pay Expense
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default Inventory;
