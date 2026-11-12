import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Grid, Paper, TextField, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Card, CardActionArea,
    Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
    DialogActions, Alert, Chip, Tooltip, Divider
} from '@mui/material';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PrintIcon from '@mui/icons-material/Print';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { getProducts } from '../api/inventoryApi';
import { getCustomers, createCustomer } from '../api/customerApi';
import { createInvoice } from '../api/invoiceApi';
import { getAccountsByUser } from '../api/accountsService';
import { useAuth } from '../context/AuthContext';
import ThermalReceipt from '../components/print/ThermalReceipt';
import { getImageUrl } from '../utils/imageUrl';

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
    const [cameraScannerOpen, setCameraScannerOpen] = useState(false);

    // Refs
    const searchInputRef = useRef(null);
    const videoRef = useRef(null);
    const scannerStreamRef = useRef(null);
    const scanBufferRef = useRef('');
    const lastKeyTimeRef = useRef(0);

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
        if (user) {
            getAccountsByUser(user.id || user.userId).then((res) => {
                setAccounts(res.data || []);
                if (res.data && res.data.length > 0) {
                    setSelectedAccountId(res.data[0].id);
                }
            }).catch(() => {});
        }
    }, [user]);

    // Global Keyboard Listener for USB/Bluetooth Barcode Scanners & Shortcuts (F2, F4, Space)
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
            const isTypingInInput = activeTag === 'input' || activeTag === 'textarea';

            // Shortcut F2: Focus Product Search
            if (e.key === 'F2') {
                e.preventDefault();
                searchInputRef.current?.focus();
                return;
            }

            // Shortcut F4: Clear Cart
            if (e.key === 'F4') {
                e.preventDefault();
                if (cart.length > 0) {
                    setCart([]);
                    showAlert('Cart cleared (F4)', 'info');
                }
                return;
            }

            // Shortcut Space: Quick Cash Tender (only when not typing in text field)
            if (e.code === 'Space' && !isTypingInInput) {
                e.preventDefault();
                if (cart.length > 0) {
                    handleCheckout();
                }
                return;
            }

            // Hardware Barcode Scanner Processing (rapid keystrokes ending in Enter)
            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTimeRef.current;
            lastKeyTimeRef.current = currentTime;

            // Scanners emit characters rapidly (< 60ms between characters)
            if (e.key === 'Enter') {
                const scannedCode = scanBufferRef.current.trim();
                scanBufferRef.current = '';

                if (scannedCode.length >= 3) {
                    // Try to match product by barcode or SKU
                    const matched = products.find(
                        (p) =>
                            (p.barcode && p.barcode.toLowerCase() === scannedCode.toLowerCase()) ||
                            (p.sku && p.sku.toLowerCase() === scannedCode.toLowerCase())
                    );

                    if (matched) {
                        e.preventDefault();
                        handleAddToCart(matched);
                        showAlert(`Scanned barcode: ${matched.name}`, 'success');
                    }
                }
            } else if (e.key.length === 1) {
                // If elapsed time since last key is large, reset buffer (it was human typing)
                if (timeDiff > 100) {
                    scanBufferRef.current = '';
                }
                scanBufferRef.current += e.key;
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [products, cart]);

    // Camera Barcode Scanning using native BarcodeDetector or fallback video loop
    useEffect(() => {
        if (!cameraScannerOpen) {
            if (scannerStreamRef.current) {
                scannerStreamRef.current.getTracks().forEach((track) => track.stop());
                scannerStreamRef.current = null;
            }
            return;
        }

        let isScanning = true;

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                });
                scannerStreamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                // If native BarcodeDetector is supported in browser
                if ('BarcodeDetector' in window) {
                    const detector = new window.BarcodeDetector({
                        formats: ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e'],
                    });

                    const detectInterval = setInterval(async () => {
                        if (!isScanning || !videoRef.current) {
                            clearInterval(detectInterval);
                            return;
                        }
                        try {
                            const barcodes = await detector.detect(videoRef.current);
                            if (barcodes.length > 0) {
                                const rawVal = barcodes[0].rawValue;
                                const matched = products.find(
                                    (p) =>
                                        (p.barcode && p.barcode === rawVal) ||
                                        (p.sku && p.sku === rawVal)
                                );
                                if (matched) {
                                    handleAddToCart(matched);
                                    showAlert(`Camera scanned: ${matched.name}`, 'success');
                                    setCameraScannerOpen(false);
                                    clearInterval(detectInterval);
                                }
                            }
                        } catch (err) {}
                    }, 400);
                }
            } catch (err) {
                showAlert('Could not access camera for scanning. Please check permissions.', 'error');
            }
        };

        startCamera();

        return () => {
            isScanning = false;
            if (scannerStreamRef.current) {
                scannerStreamRef.current.getTracks().forEach((track) => track.stop());
                scannerStreamRef.current = null;
            }
        };
    }, [cameraScannerOpen, products]);

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
                const walkIn = res.data.find((c) => c.name.toLowerCase().includes('walk-in'));
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

    const handleAddToCart = (product) => {
        if (product.currentStock <= 0) {
            showAlert(`Cannot add ${product.name}. Out of stock!`, 'error');
            return;
        }

        setCart((prevCart) => {
            const existingIndex = prevCart.findIndex((item) => item.productId === product.id);
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
                return [
                    ...prevCart,
                    {
                        productId: product.id,
                        productName: product.name,
                        productSku: product.sku,
                        barcode: product.barcode,
                        imageUrl: product.imageUrl,
                        unitPrice: Number(product.sellingPrice),
                        quantity: 1,
                        currentStock: product.currentStock,
                        discountAmount: 0,
                        taxRate: 0,
                    },
                ];
            }
        });
    };

    const handleUpdateQuantity = (productId, delta) => {
        setCart((prevCart) => {
            return prevCart
                .map((item) => {
                    if (item.productId === productId) {
                        const newQty = item.quantity + delta;
                        if (newQty > item.currentStock) {
                            showAlert(`Max stock limit (${item.currentStock}) reached`, 'warning');
                            return item;
                        }
                        return newQty > 0 ? { ...item, quantity: newQty } : null;
                    }
                    return item;
                })
                .filter(Boolean);
        });
    };

    const handleRemoveFromCart = (productId) => {
        setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
    };

    // Financial Computations
    const subtotal = cart.reduce((acc, item) => acc + Number(item.unitPrice) * item.quantity, 0);
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
            userId: user.id || user.userId || 1,
            customerId: selectedCustomerId || null,
            accountId: selectedAccountId || null,
            paymentMethod: paymentMethod,
            discountTotal: Number(discountTotal || 0),
            paidAmount: grandTotal,
            items: cart.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: 0,
                discountAmount: 0,
            })),
        };

        try {
            const res = await createInvoice(payload);
            setCompletedInvoice(res.data);
            setReceiptModalOpen(true);
            setCart([]);
            setDiscountTotal(0);
            fetchProducts();
            showAlert('POS Sale completed! Inventory and income ledger updated.');
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
            {/* Top POS Header & Keyboard Shortcuts Bar */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} flexWrap="wrap" gap={1}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <PointOfSaleIcon color="primary" sx={{ fontSize: 32 }} />
                    <Box>
                        <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
                            POS Terminal & Checkout
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            USB Scanner & Bluetooth barcode ready
                        </Typography>
                    </Box>
                </Box>

                {/* Shortcuts Badges */}
                <Box display="flex" alignItems="center" gap={1} bgcolor="#ffffff" px={2} py={0.8} borderRadius={2} border="1px solid #e2e8f0">
                    <KeyboardIcon sx={{ fontSize: 16, color: '#64748b' }} />
                    <Chip label="F2: Search" size="small" variant="outlined" sx={{ fontWeight: 600, height: 22 }} />
                    <Chip label="F4: Clear Cart" size="small" variant="outlined" sx={{ fontWeight: 600, height: 22 }} />
                    <Chip label="Space: Tender" size="small" variant="outlined" color="primary" sx={{ fontWeight: 600, height: 22 }} />
                    <Button
                        size="small"
                        startIcon={<QrCodeScannerIcon />}
                        variant="outlined"
                        onClick={() => setCameraScannerOpen(true)}
                        sx={{ py: 0.2, px: 1, minHeight: 24, fontSize: '0.75rem' }}
                    >
                        Camera Scan
                    </Button>
                </Box>
            </Box>

            {alert.show && (
                <Alert severity={alert.severity} sx={{ mb: 2, borderRadius: 2 }}>
                    {alert.message}
                </Alert>
            )}

            <Grid container spacing={2}>
                {/* Left Pane: Catalog & Fast Picker */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }} elevation={1}>
                        <TextField
                            inputRef={searchInputRef}
                            fullWidth
                            size="small"
                            placeholder="Scan Barcode or Search by Name/SKU... (Press F2 to focus)"
                            value={search}
                            onChange={handleSearchChange}
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                            }}
                        />

                        <Grid container spacing={1.5} sx={{ overflowY: 'auto', maxHeight: 'calc(100vh - 240px)', p: 0.5 }}>
                            {products.map((p) => {
                                const isOut = p.currentStock <= 0;
                                return (
                                    <Grid item xs={6} sm={4} key={p.id}>
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                opacity: isOut ? 0.6 : 1,
                                                borderColor: p.currentStock <= p.reorderLevel ? '#f59e0b' : '#e2e8f0',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: '100%',
                                                transition: 'all 0.15s ease',
                                                '&:hover': {
                                                    boxShadow: isOut ? 'none' : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                    transform: isOut ? 'none' : 'translateY(-2px)',
                                                },
                                            }}
                                        >
                                            <Box sx={{ position: 'relative', height: 100, width: '100%', bgcolor: '#f8fafc', overflow: 'hidden' }}>
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
                                                        color="#94a3b8"
                                                    >
                                                        <RestaurantMenuIcon sx={{ fontSize: 32 }} />
                                                    </Box>
                                                )}
                                                {p.barcode && (
                                                    <Chip
                                                        label={p.barcode}
                                                        size="small"
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 6,
                                                            left: 6,
                                                            bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                            color: '#fff',
                                                            fontSize: '0.65rem',
                                                            height: 18,
                                                            fontWeight: 600,
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            <CardActionArea
                                                disabled={isOut}
                                                onClick={() => handleAddToCart(p)}
                                                sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                                            >
                                                <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ width: '100%' }}>
                                                    {p.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    SKU: {p.sku}
                                                </Typography>
                                                <Box display="flex" justifyContent="space-between" width="100%" mt={1} alignItems="center">
                                                    <Typography variant="subtitle1" fontWeight={800} color="#2563eb">
                                                        {Number(p.sellingPrice).toFixed(2)}
                                                    </Typography>
                                                    <Chip
                                                        label={isOut ? 'Out of Stock' : `${p.currentStock} left`}
                                                        size="small"
                                                        color={isOut ? 'error' : p.currentStock <= p.reorderLevel ? 'warning' : 'default'}
                                                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                                                    />
                                                </Box>
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Paper>
                </Grid>

                {/* Right Pane: Checkout Cart & Tender */}
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }} elevation={1}>
                        {/* Customer & Account Selector */}
                        <Box display="flex" gap={1} mb={2}>
                            <FormControl size="small" fullWidth>
                                <InputLabel>Billing Customer</InputLabel>
                                <Select
                                    value={selectedCustomerId}
                                    label="Billing Customer"
                                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                                >
                                    {customers.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>
                                            {c.name} {c.phone ? `(${c.phone})` : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Tooltip title="Quick Register Customer">
                                <IconButton
                                    color="primary"
                                    onClick={() => setCustomerModalOpen(true)}
                                    sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}
                                >
                                    <PersonAddIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>

                        {/* Cart Items Table */}
                        <TableContainer sx={{ flexGrow: 1, maxHeight: 'calc(100vh - 460px)', overflowY: 'auto' }}>
                            <Table size="small">
                                <TableHead>
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
                                            <TableCell colSpan={4} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                                                <ShoppingCartIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                                                <Typography variant="body2">
                                                    Cart is empty. Scan barcodes or click items.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        cart.map((item) => (
                                            <TableRow key={item.productId} hover>
                                                <TableCell sx={{ py: 1 }}>
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {item.productName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {Number(item.unitPrice).toFixed(2)} ea
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleUpdateQuantity(item.productId, -1)}
                                                        >
                                                            <RemoveIcon fontSize="small" />
                                                        </IconButton>
                                                        <Typography variant="body2" fontWeight={700} sx={{ minWidth: 20, textAlign: 'center' }}>
                                                            {item.quantity}
                                                        </Typography>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleUpdateQuantity(item.productId, 1)}
                                                        >
                                                            <AddIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                    {(item.unitPrice * item.quantity).toFixed(2)}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRemoveFromCart(item.productId)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Totals & Tender Block */}
                        <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #e2e8f0' }}>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                                <Typography variant="body2" fontWeight={600}>{subtotal.toFixed(2)}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="body2" color="text.secondary">Discount Total:</Typography>
                                <TextField
                                    size="small"
                                    type="number"
                                    value={discountTotal}
                                    onChange={(e) => setDiscountTotal(Math.max(0, Number(e.target.value)))}
                                    sx={{ width: 100 }}
                                    inputProps={{ style: { textAlign: 'right', padding: '4px 8px' } }}
                                />
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box display="flex" justifyContent="space-between" mb={2}>
                                <Typography variant="h6" fontWeight={800}>Amount Payable:</Typography>
                                <Typography variant="h5" fontWeight={800} color="#2563eb">
                                    {grandTotal.toFixed(2)}
                                </Typography>
                            </Box>

                            {/* Payment Channels */}
                            <Grid container spacing={1} mb={2}>
                                {['CASH', 'CARD', 'TRANSFER', 'CUSTOMER_CREDIT'].map((method) => (
                                    <Grid item xs={3} key={method}>
                                        <Button
                                            fullWidth
                                            size="small"
                                            variant={paymentMethod === method ? 'contained' : 'outlined'}
                                            onClick={() => setPaymentMethod(method)}
                                            sx={{ py: 0.8, fontSize: '0.72rem', fontWeight: 700 }}
                                        >
                                            {method === 'CUSTOMER_CREDIT' ? 'Credit' : method}
                                        </Button>
                                    </Grid>
                                ))}
                            </Grid>

                            {/* Action Buttons */}
                            <Box display="flex" gap={1}>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteSweepIcon />}
                                    onClick={() => setCart([])}
                                    disabled={cart.length === 0}
                                    sx={{ minWidth: 100 }}
                                >
                                    Clear (F4)
                                </Button>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    startIcon={<CheckCircleIcon />}
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0}
                                    sx={{ py: 1.2, fontWeight: 700, fontSize: '1rem' }}
                                >
                                    Complete Sale ({grandTotal.toFixed(2)})
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Camera Barcode Scanner Dialog */}
            <Dialog open={cameraScannerOpen} onClose={() => setCameraScannerOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Camera Barcode Scanner</DialogTitle>
                <DialogContent dividers sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Point your camera at a product barcode or QR code
                    </Typography>
                    <Box
                        sx={{
                            width: '100%',
                            height: 260,
                            bgcolor: '#000',
                            borderRadius: 2,
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        <video
                            ref={videoRef}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            playsInline
                            muted
                        />
                        {/* Targeting box overlay */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '70%',
                                height: '45%',
                                border: '2px solid #2563eb',
                                borderRadius: 1.5,
                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setCameraScannerOpen(false)}>Close Scanner</Button>
                </DialogActions>
            </Dialog>

            {/* Quick Customer Dialog */}
            <Dialog open={customerModalOpen} onClose={() => setCustomerModalOpen(false)} maxWidth="xs" fullWidth>
                <form onSubmit={handleSaveCustomer}>
                    <DialogTitle fontWeight={700}>Quick Register Customer</DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Customer Name"
                                    fullWidth
                                    required
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
                                    fullWidth
                                    value={customerForm.email}
                                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setCustomerModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">
                            Save Customer
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Thermal Receipt Print Dialog */}
            <Dialog open={receiptModalOpen} onClose={() => setReceiptModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Checkout Receipt</DialogTitle>
                <DialogContent dividers>
                    {completedInvoice && <ThermalReceipt invoice={completedInvoice} />}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setReceiptModalOpen(false)}>Done</Button>
                    <Button variant="contained" onClick={() => window.print()} startIcon={<PrintIcon />}>
                        Print Receipt
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default POSBilling;
