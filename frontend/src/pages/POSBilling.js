import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, TextField, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Card, CardActionArea,
    Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
    DialogActions, Alert, ToggleButtonGroup, ToggleButton, Chip, Avatar
} from '@mui/material';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PrintIcon from '@mui/icons-material/Print';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { getProducts, uploadProductImage } from '../api/inventoryApi';
import { getCustomers, createCustomer } from '../api/customerApi';
import { createInvoice } from '../api/invoiceApi';
import { getAccountsByUser } from '../api/accountsService';
import { useAuth } from '../context/AuthContext';
import ThermalReceipt from '../components/print/ThermalReceipt';

const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
};

const POSBilling = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [search, setSearch] = useState('');
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

    // POS Cart State
    const [cart, setCart] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [discountTotal, setDiscountTotal] = useState(0);

    // Modals
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [completedInvoice, setCompletedInvoice] = useState(null);

    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '', address: '' });

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
        if (user) {
            getAccountsByUser(user.id).then(res => {
                setAccounts(res.data || []);
                if (res.data && res.data.length > 0) {
                    setSelectedAccountId(res.data[0].id);
                }
            }).catch(() => {});
        }
    }, []);

    const fetchProducts = async (query = '') => {
        try {
            const res = await getProducts(query, false);
            setProducts(res.data || []);
        } catch (err) {
            showAlert('Failed to fetch products', 'error');
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await getCustomers();
            setCustomers(res.data || []);
            if (res.data && res.data.length > 0) {
                // Find walk-in or default to first
                const walkIn = res.data.find(c => c.name.toLowerCase().includes('walk-in'));
                setSelectedCustomerId(walkIn ? walkIn.id : res.data[0].id);
            }
        } catch (err) {
            showAlert('Failed to fetch customers', 'error');
        }
    };

    const showAlert = (message, severity = 'success') => {
        setAlert({ show: true, message, severity });
        setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 4000);
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearch(val);
        fetchProducts(val);
    };

    const handleQuickPhotoUpload = async (product, e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type.toLowerCase())) {
            showAlert('Only JPG, PNG, and WebP images are allowed!', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showAlert('Image size exceeds 5MB limit.', 'error');
            return;
        }

        try {
            await uploadProductImage(product.id, file);
            showAlert(`Product photo updated for ${product.name}!`);
            fetchProducts(search);
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to upload photo', 'error');
        }
    };

    const handleAddToCart = (product) => {
        if (product.currentStock <= 0) {
            showAlert(`Cannot add ${product.name}. Out of stock!`, 'error');
            return;
        }

        setCart(prevCart => {
            const existingIndex = prevCart.findIndex(item => item.productId === product.id);
            if (existingIndex > -1) {
                const updated = [...prevCart];
                const currentQty = updated[existingIndex].quantity;
                if (currentQty + 1 > product.currentStock) {
                    showAlert(`Only ${product.currentStock} units available for ${product.name}`, 'warning');
                    return prevCart;
                }
                updated[existingIndex].quantity += 1;
                return updated;
            } else {
                return [...prevCart, {
                    productId: product.id,
                    productName: product.name,
                    productSku: product.sku,
                    imageUrl: product.imageUrl,
                    unitPrice: product.sellingPrice,
                    quantity: 1,
                    currentStock: product.currentStock,
                    discountAmount: 0,
                    taxRate: 0
                }];
            }
        });
    };

    const handleUpdateQuantity = (productId, delta) => {
        setCart(prevCart => {
            return prevCart.map(item => {
                if (item.productId === productId) {
                    const newQty = item.quantity + delta;
                    if (newQty > item.currentStock) {
                        showAlert(`Max stock limit (${item.currentStock}) reached`, 'warning');
                        return item;
                    }
                    return newQty > 0 ? { ...item, quantity: newQty } : null;
                }
                return item;
            }).filter(Boolean);
        });
    };

    const handleRemoveFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.productId !== productId));
    };

    // Financial Computations
    const subtotal = cart.reduce((acc, item) => acc + (Number(item.unitPrice) * item.quantity), 0);
    const grandTotal = Math.max(0, subtotal - Number(discountTotal || 0));

    const handleCheckout = async () => {
        if (cart.length === 0) {
            showAlert('Cart is empty. Add products to checkout.', 'error');
            return;
        }

        if (!user) {
            showAlert('Authentication required', 'error');
            return;
        }

        const payload = {
            userId: user.id,
            customerId: selectedCustomerId || null,
            accountId: selectedAccountId || null,
            paymentMethod: paymentMethod,
            discountTotal: Number(discountTotal || 0),
            paidAmount: grandTotal,
            items: cart.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: 0,
                discountAmount: 0
            }))
        };

        try {
            const res = await createInvoice(payload);
            setCompletedInvoice(res.data);
            setReceiptModalOpen(true);
            setCart([]);
            setDiscountTotal(0);
            fetchProducts(); // Refresh stock levels
            showAlert('POS Sale completed! Stock updated and income credited.');
        } catch (err) {
            showAlert(err.response?.data?.message || 'Error processing invoice', 'error');
        }
    };

    const handleSaveCustomer = async (e) => {
        e.preventDefault();
        try {
            const res = await createCustomer(customerForm);
            showAlert('Customer added successfully!');
            fetchCustomers();
            setSelectedCustomerId(res.data.id);
            setCustomerModalOpen(false);
            setCustomerForm({ name: '', phone: '', email: '', address: '' });
        } catch (err) {
            showAlert('Failed to save customer', 'error');
        }
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                    <PointOfSaleIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" fontWeight="bold">
                        POS Terminal & Billing Checkout
                    </Typography>
                </Box>
            </Box>

            {alert.show && (
                <Alert severity={alert.severity} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}

            <Grid container spacing={2}>
                {/* Left Pane: Catalog & Fast Picker */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Scan Barcode or Search by Name/SKU..."
                            value={search}
                            onChange={handleSearchChange}
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                            }}
                        />

                        <Grid container spacing={1.5} sx={{ overflowY: 'auto', maxHeight: 'calc(100vh - 220px)', p: 0.5 }}>
                            {products.map(p => {
                                const isOut = p.currentStock <= 0;
                                return (
                                    <Grid item xs={6} sm={4} key={p.id}>
                                        <Card 
                                            variant="outlined" 
                                            sx={{ 
                                                opacity: isOut ? 0.6 : 1,
                                                borderColor: p.isLowStock ? 'warning.main' : 'divider',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: '100%',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    boxShadow: isOut ? 'none' : 3,
                                                    transform: isOut ? 'none' : 'translateY(-2px)'
                                                }
                                            }}
                                        >
                                            {/* Plate Photo Banner */}
                                            <Box sx={{ position: 'relative', height: 110, width: '100%', bgcolor: '#f5f5f5', overflow: 'hidden' }}>
                                                {p.imageUrl ? (
                                                    <Box
                                                        component="img"
                                                        src={getImageUrl(p.imageUrl)}
                                                        alt={p.name}
                                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <Box
                                                        display="flex"
                                                        flexDirection="column"
                                                        alignItems="center"
                                                        justifyContent="center"
                                                        height="100%"
                                                        color="text.secondary"
                                                    >
                                                        <RestaurantMenuIcon sx={{ fontSize: 36, opacity: 0.35, mb: 0.5 }} />
                                                        <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.6 }}>No Photo</Typography>
                                                    </Box>
                                                )}

                                                {/* Stock Status Badge */}
                                                <Chip 
                                                    label={isOut ? 'Out' : `${p.currentStock} ${p.unit}`}
                                                    size="small"
                                                    color={isOut ? 'error' : (p.isLowStock ? 'warning' : 'primary')}
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 6,
                                                        right: 6,
                                                        fontWeight: 'bold',
                                                        fontSize: '0.65rem',
                                                        height: 20,
                                                        boxShadow: 1
                                                    }}
                                                />

                                                {/* Quick Upload Plate Photo for Cashier */}
                                                <label
                                                    htmlFor={`pos-upload-${p.id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ position: 'absolute', top: 6, left: 6 }}
                                                >
                                                    <input
                                                        id={`pos-upload-${p.id}`}
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/webp"
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => handleQuickPhotoUpload(p, e)}
                                                    />
                                                    <IconButton
                                                        component="span"
                                                        size="small"
                                                        sx={{
                                                            bgcolor: 'rgba(255,255,255,0.85)',
                                                            '&:hover': { bgcolor: 'white' },
                                                            p: 0.5,
                                                            boxShadow: 1
                                                        }}
                                                        title="Upload / Change Plate Photo"
                                                    >
                                                        <PhotoCameraIcon sx={{ fontSize: 16, color: '#455a64' }} />
                                                    </IconButton>
                                                </label>
                                            </Box>

                                            <CardActionArea 
                                                onClick={() => handleAddToCart(p)}
                                                disabled={isOut}
                                                sx={{ p: 1.2, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between' }}
                                            >
                                                <Box width="100%">
                                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}>
                                                        {p.sku}
                                                    </Typography>
                                                    <Typography variant="subtitle2" fontWeight="bold" noWrap title={p.name} sx={{ width: '100%' }}>
                                                        {p.name}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" mt={0.5}>
                                                    <Typography variant="body2" color="primary.main" fontWeight="bold">
                                                        Rs. {Number(p.sellingPrice).toLocaleString()}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                                                        Tap to Add
                                                    </Typography>
                                                </Box>
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Paper>
                </Grid>

                {/* Right Pane: Active Cart & Billing Form */}
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 160px)' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                            <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                                <ShoppingCartIcon /> Active Cart ({cart.reduce((a, c) => a + c.quantity, 0)})
                            </Typography>
                            <Button size="small" color="error" onClick={() => setCart([])} disabled={cart.length === 0}>
                                Clear Cart
                            </Button>
                        </Box>

                        {/* Customer & Account Selection */}
                        <Grid container spacing={1} sx={{ mb: 1.5 }}>
                            <Grid item xs={9}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Select Customer</InputLabel>
                                    <Select
                                        value={selectedCustomerId}
                                        label="Select Customer"
                                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                                    >
                                        {customers.map(c => (
                                            <MenuItem key={c.id} value={c.id}>
                                                {c.name} {c.phone ? `(${c.phone})` : ''}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={3}>
                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    size="small" 
                                    startIcon={<PersonAddIcon />}
                                    onClick={() => setCustomerModalOpen(true)}
                                    sx={{ height: '100%' }}
                                >
                                    New
                                </Button>
                            </Grid>
                        </Grid>

                        {/* Cart Items Table */}
                        <TableContainer component={Box} sx={{ flexGrow: 1, maxHeight: '250px', overflowY: 'auto', mb: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableRow>
                                        <TableCell>Item</TableCell>
                                        <TableCell align="center">Qty</TableCell>
                                        <TableCell align="right">Total</TableCell>
                                        <TableCell align="center"></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cart.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                Cart is empty. Click items to add.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        cart.map(item => (
                                            <TableRow key={item.productId}>
                                                <TableCell sx={{ py: 0.5 }}>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Avatar
                                                            variant="rounded"
                                                            src={getImageUrl(item.imageUrl)}
                                                            alt={item.productName}
                                                            sx={{ width: 34, height: 34, bgcolor: '#f0f2f5', border: '1px solid #e0e0e0' }}
                                                        >
                                                            <RestaurantMenuIcon sx={{ fontSize: 18, color: '#9e9e9e' }} />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="bold">{item.productName}</Typography>
                                                            <Typography variant="caption" color="textSecondary">@ Rs.{item.unitPrice}</Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 0.5 }}>
                                                    <Box display="flex" alignItems="center" justifyContent="center">
                                                        <IconButton size="small" onClick={() => handleUpdateQuantity(item.productId, -1)}>
                                                            <RemoveIcon fontSize="small" />
                                                        </IconButton>
                                                        <Typography variant="body2" sx={{ mx: 0.5, fontWeight: 'bold' }}>
                                                            {item.quantity}
                                                        </Typography>
                                                        <IconButton size="small" onClick={() => handleUpdateQuantity(item.productId, 1)}>
                                                            <AddIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right" sx={{ py: 0.5, fontWeight: 'bold' }}>
                                                    Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 0.5 }}>
                                                    <IconButton size="small" color="error" onClick={() => handleRemoveFromCart(item.productId)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Payment Settings */}
                        <Box sx={{ backgroundColor: '#fafafa', p: 1.5, borderRadius: 1, border: '1px solid #eee', mb: 2 }}>
                            <Typography variant="caption" fontWeight="bold" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                                PAYMENT CHANNEL & ACCOUNT
                            </Typography>
                            <ToggleButtonGroup
                                value={paymentMethod}
                                exclusive
                                onChange={(e, newMethod) => newMethod && setPaymentMethod(newMethod)}
                                size="small"
                                fullWidth
                                sx={{ mb: 1 }}
                            >
                                <ToggleButton value="CASH">Cash</ToggleButton>
                                <ToggleButton value="CARD">Card</ToggleButton>
                                <ToggleButton value="TRANSFER">Bank</ToggleButton>
                                <ToggleButton value="CUSTOMER_CREDIT">Credit</ToggleButton>
                            </ToggleButtonGroup>

                            <FormControl fullWidth size="small">
                                <InputLabel>Target Account for Ledger</InputLabel>
                                <Select
                                    value={selectedAccountId}
                                    label="Target Account for Ledger"
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                >
                                    {accounts.map(acc => (
                                        <MenuItem key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.type})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Financial Totals */}
                        <Box sx={{ mb: 2 }}>
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Typography variant="body2">Subtotal:</Typography>
                                <Typography variant="body2">Rs. {subtotal.toLocaleString()}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="body2">Discount (PKR):</Typography>
                                <TextField
                                    size="small"
                                    type="number"
                                    value={discountTotal}
                                    onChange={(e) => setDiscountTotal(e.target.value)}
                                    sx={{ width: '100px', input: { textAlign: 'right', py: 0.5 } }}
                                />
                            </Box>
                            <Box display="flex" justifyContent="space-between" pt={1} sx={{ borderTop: '2px solid #333' }}>
                                <Typography variant="h6" fontWeight="bold">GRAND TOTAL:</Typography>
                                <Typography variant="h6" fontWeight="bold" color="primary.main">
                                    Rs. {grandTotal.toLocaleString()}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Checkout Trigger */}
                        <Button
                            variant="contained"
                            color="success"
                            size="large"
                            fullWidth
                            disabled={cart.length === 0}
                            onClick={handleCheckout}
                            sx={{ py: 1.5, fontSize: '18px', fontWeight: 'bold' }}
                        >
                            Checkout & Print Receipt
                        </Button>
                    </Paper>
                </Grid>
            </Grid>

            {/* Thermal Receipt Print Preview Modal */}
            <Dialog open={receiptModalOpen} onClose={() => setReceiptModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Sale Completed - Print Thermal Receipt</DialogTitle>
                <DialogContent dividers>
                    <ThermalReceipt invoice={completedInvoice} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReceiptModalOpen(false)}>Close</Button>
                    <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
                        Print Thermal Receipt
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Quick Add Customer Modal */}
            <Dialog open={customerModalOpen} onClose={() => setCustomerModalOpen(false)} maxWidth="xs" fullWidth>
                <form onSubmit={handleSaveCustomer}>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Customer Name"
                                    required
                                    fullWidth
                                    value={customerForm.name}
                                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Phone Number"
                                    fullWidth
                                    value={customerForm.phone}
                                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Email Address"
                                    type="email"
                                    fullWidth
                                    value={customerForm.email}
                                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCustomerModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">Save Customer</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default POSBilling;
