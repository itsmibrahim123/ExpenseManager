import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, CircularProgress,
    Alert, Tabs, Tab, IconButton, Menu, Drawer, Divider, Grid, Card, CardContent,
    Tooltip
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PaymentIcon from '@mui/icons-material/Payment';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import CloseIcon from '@mui/icons-material/Close';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { getInvoices, recordPayment, downloadInvoicePdf, createInvoice } from '../api/invoiceApi';
import { getAccountsByUser } from '../api/accountsService';
import { useAuth } from '../context/AuthContext';
import ThermalReceipt from '../components/print/ThermalReceipt';

const Invoices = () => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabIndex, setTabIndex] = useState(0); // 0: ALL, 1: SALE, 2: PURCHASE, 3: RETURN
    const [statusFilter, setStatusFilter] = useState('');
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });
    const [accounts, setAccounts] = useState([]);

    // Action Menu Anchor & Target Invoice
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuInvoice, setMenuInvoice] = useState(null);

    // Slide-over Drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerInvoice, setDrawerInvoice] = useState(null);

    // Thermal Receipt Modal
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [printInvoice, setPrintInvoice] = useState(null);

    // Record Payment Dialog
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentMethod: 'CASH',
        referenceNotes: '',
        accountId: '',
    });

    // Process Return Dialog
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [returnForm, setReturnForm] = useState({
        returnNotes: '',
        refundMethod: 'CASH',
        accountId: '',
    });

    const tabTypes = [undefined, 'SALE', 'PURCHASE', 'RETURN'];

    useEffect(() => {
        fetchInvoices();
        if (user) {
            getAccountsByUser(user.id || user.userId)
                .then((res) => {
                    setAccounts(res.data || []);
                    if (res.data && res.data.length > 0) {
                        setPaymentForm((prev) => ({ ...prev, accountId: res.data[0].id }));
                        setReturnForm((prev) => ({ ...prev, accountId: res.data[0].id }));
                    }
                })
                .catch(() => {});
        }
    }, [tabIndex, statusFilter]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const currentType = tabTypes[tabIndex];
            const res = await getInvoices(statusFilter || undefined, currentType);
            setInvoices(res.data || []);
        } catch (err) {
            showAlert('Failed to load invoices', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message, severity = 'success') => {
        setAlert({ show: true, message, severity });
        setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 4500);
    };

    const handleMenuOpen = (e, inv) => {
        setMenuAnchor(e.currentTarget);
        setMenuInvoice(inv);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
    };

    const handleOpenDrawer = (inv) => {
        setDrawerInvoice(inv);
        setDrawerOpen(true);
        handleMenuClose();
    };

    const handleDownloadPdf = async (inv) => {
        handleMenuClose();
        try {
            showAlert('Generating and downloading branded PDF...', 'info');
            await downloadInvoicePdf(inv.id, inv.invoiceNumber);
            showAlert('PDF downloaded successfully!');
        } catch (err) {
            showAlert('Failed to download invoice PDF', 'error');
        }
    };

    const handleOpenPrint = (inv) => {
        setPrintInvoice(inv);
        setPrintModalOpen(true);
        handleMenuClose();
    };

    const handleOpenPayment = (inv) => {
        setPaymentForm({
            amount: inv.balanceDue > 0 ? inv.balanceDue : '',
            paymentMethod: 'CASH',
            referenceNotes: '',
            accountId: accounts[0]?.id || '',
        });
        setMenuInvoice(inv);
        setPaymentModalOpen(true);
        handleMenuClose();
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        if (!menuInvoice) return;
        try {
            await recordPayment(menuInvoice.id, {
                amount: Number(paymentForm.amount),
                paymentMethod: paymentForm.paymentMethod,
                referenceNotes: paymentForm.referenceNotes,
                accountId: paymentForm.accountId ? Number(paymentForm.accountId) : undefined,
            });
            showAlert(`Payment of ${paymentForm.amount} recorded successfully for ${menuInvoice.invoiceNumber}!`);
            setPaymentModalOpen(false);
            fetchInvoices();
            if (drawerInvoice && drawerInvoice.id === menuInvoice.id) {
                // Refresh drawer
                const updated = await getInvoices(undefined, undefined);
                const found = (updated.data || []).find((i) => i.id === menuInvoice.id);
                if (found) setDrawerInvoice(found);
            }
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to record payment', 'error');
        }
    };

    const handleOpenReturn = (inv) => {
        setReturnForm({
            returnNotes: `Customer return for ${inv.invoiceNumber}`,
            refundMethod: 'CASH',
            accountId: accounts[0]?.id || '',
        });
        setMenuInvoice(inv);
        setReturnModalOpen(true);
        handleMenuClose();
    };

    const handleSubmitReturn = async (e) => {
        e.preventDefault();
        if (!menuInvoice) return;
        try {
            // Generate Return Invoice linked to parent
            const returnPayload = {
                userId: user.id || user.userId || 1,
                invoiceType: 'RETURN',
                parentInvoiceId: menuInvoice.id,
                customerId: menuInvoice.customerId,
                accountId: returnForm.accountId ? Number(returnForm.accountId) : undefined,
                paymentMethod: returnForm.refundMethod,
                paidAmount: menuInvoice.paidAmount,
                notes: returnForm.returnNotes,
                items: menuInvoice.items.map((it) => ({
                    productId: it.productId,
                    quantity: it.quantity,
                    unitPrice: it.unitPrice,
                    taxRate: it.taxRate,
                    discountAmount: it.discountAmount,
                })),
            };

            await createInvoice(returnPayload);
            showAlert(`Return Credit Note generated and inventory restocked for ${menuInvoice.invoiceNumber}!`);
            setReturnModalOpen(false);
            fetchInvoices();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to process return', 'error');
        }
    };

    const getTypeChip = (type) => {
        switch (type) {
            case 'RETURN':
                return (
                    <Chip
                        icon={<ArrowDownwardIcon style={{ fontSize: 13 }} />}
                        label="Return"
                        size="small"
                        sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}
                    />
                );
            case 'PURCHASE':
                return (
                    <Chip
                        icon={<ArrowUpwardIcon style={{ fontSize: 13 }} />}
                        label="Purchase"
                        size="small"
                        sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700 }}
                    />
                );
            case 'SALE':
            default:
                return (
                    <Chip
                        icon={<ShoppingBagIcon style={{ fontSize: 13 }} />}
                        label="Sale"
                        size="small"
                        sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }}
                    />
                );
        }
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'PAID':
                return <Chip label="Paid" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }} />;
            case 'PARTIALLY_PAID':
                return <Chip label="Partial" size="small" sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700 }} />;
            case 'UNPAID':
                return <Chip label="Unpaid" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700 }} />;
            default:
                return <Chip label={status} size="small" />;
        }
    };

    // Financial KPI Totals for current view
    const totalCount = invoices.length;
    const totalGrandVolume = invoices.reduce((s, i) => s + (Number(i.grandTotal) || 0), 0);
    const totalPaidVolume = invoices.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
    const totalOutstanding = invoices.reduce((s, i) => s + (Number(i.balanceDue) || 0), 0);

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <ReceiptLongIcon color="primary" sx={{ fontSize: 34 }} />
                    <Box>
                        <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
                            Unified Invoicing & Transactions
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            POS Sales, Supplier Purchases, Customer Returns, and Payment Receipts
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {alert.show && (
                <Alert severity={alert.severity} sx={{ mb: 3, borderRadius: 2 }}>
                    {alert.message}
                </Alert>
            )}

            {/* KPI Cards */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={1}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                TOTAL INVOICES
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="#0f172a" mt={0.5}>
                                {totalCount}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={1}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                TOTAL BILLED
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="#2563eb" mt={0.5}>
                                {totalGrandVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={1}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                COLLECTED REVENUE
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="#16a34a" mt={0.5}>
                                {totalPaidVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={1}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                OUTSTANDING BALANCE
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="#dc2626" mt={0.5}>
                                {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Segmented Tabs & Filters */}
            <Paper sx={{ mb: 3 }} elevation={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" px={2} pt={1}>
                    <Tabs
                        value={tabIndex}
                        onChange={(e, v) => setTabIndex(v)}
                        indicatorColor="primary"
                        textColor="primary"
                    >
                        <Tab label="All Invoices" />
                        <Tab label="Sales (POS)" />
                        <Tab label="Purchases" />
                        <Tab label="Returns & Credit Notes" />
                    </Tabs>
                    <Box py={1}>
                        <FormControl size="small" sx={{ minWidth: 170 }}>
                            <InputLabel>Payment Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Payment Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="">All Statuses</MenuItem>
                                <MenuItem value="PAID">Paid Only</MenuItem>
                                <MenuItem value="PARTIALLY_PAID">Partially Paid</MenuItem>
                                <MenuItem value="UNPAID">Unpaid Only</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
            </Paper>

            {/* Invoices Table */}
            <TableContainer component={Paper} elevation={1}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Invoice #</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Customer / Supplier</TableCell>
                            <TableCell>Channel</TableCell>
                            <TableCell align="center">Status</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell align="right">Balance Due</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                    No invoices found matching criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((inv) => (
                                <TableRow key={inv.id} hover>
                                    <TableCell>
                                        <Typography
                                            variant="subtitle2"
                                            fontWeight={700}
                                            sx={{ cursor: 'pointer', color: '#2563eb' }}
                                            onClick={() => handleOpenDrawer(inv)}
                                        >
                                            {inv.invoiceNumber}
                                        </Typography>
                                        {inv.parentInvoiceId && (
                                            <Typography variant="caption" color="text.secondary">
                                                orig: #{inv.parentInvoiceId}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {new Date(inv.invoiceDate).toLocaleDateString()}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(inv.invoiceDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{getTypeChip(inv.invoiceType)}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>
                                            {inv.customerName || 'Walk-in Customer'}
                                        </Typography>
                                        {inv.customerPhone && (
                                            <Typography variant="caption" color="text.secondary">
                                                {inv.customerPhone}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={inv.paymentMethod} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell align="center">{getStatusChip(inv.paymentStatus)}</TableCell>
                                    <TableCell align="right">
                                        <Typography variant="subtitle2" fontWeight={700}>
                                            {Number(inv.grandTotal).toFixed(2)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography
                                            variant="body2"
                                            fontWeight={Number(inv.balanceDue) > 0 ? 700 : 400}
                                            color={Number(inv.balanceDue) > 0 ? 'error.main' : 'text.secondary'}
                                        >
                                            {Number(inv.balanceDue).toFixed(2)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box display="flex" justifyContent="center" gap={0.5}>
                                            <Tooltip title="View Breakdown Drawer">
                                                <IconButton size="small" onClick={() => handleOpenDrawer(inv)}>
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Download Branded PDF">
                                                <IconButton size="small" onClick={() => handleDownloadPdf(inv)}>
                                                    <PictureAsPdfIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <IconButton size="small" onClick={(e) => handleMenuOpen(e, inv)}>
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Quick-action Floating Menu */}
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
                <MenuItem onClick={() => handleOpenDrawer(menuInvoice)}>
                    <VisibilityIcon fontSize="small" sx={{ mr: 1.5, color: '#64748b' }} />
                    View Details Drawer
                </MenuItem>
                <MenuItem onClick={() => handleDownloadPdf(menuInvoice)}>
                    <PictureAsPdfIcon fontSize="small" sx={{ mr: 1.5, color: '#2563eb' }} />
                    Download PDF Invoice
                </MenuItem>
                <MenuItem onClick={() => handleOpenPrint(menuInvoice)}>
                    <PrintIcon fontSize="small" sx={{ mr: 1.5, color: '#0f172a' }} />
                    Print Thermal Receipt (80mm)
                </MenuItem>
                {menuInvoice && menuInvoice.balanceDue > 0 && (
                    <MenuItem onClick={() => handleOpenPayment(menuInvoice)}>
                        <PaymentIcon fontSize="small" sx={{ mr: 1.5, color: '#16a34a' }} />
                        Record Post-Checkout Payment
                    </MenuItem>
                )}
                {menuInvoice && menuInvoice.invoiceType === 'SALE' && (
                    <MenuItem onClick={() => handleOpenReturn(menuInvoice)}>
                        <AssignmentReturnIcon fontSize="small" sx={{ mr: 1.5, color: '#dc2626' }} />
                        Process Return / Credit Note
                    </MenuItem>
                )}
            </Menu>

            {/* Slide-over Invoice Preview Drawer */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: { width: { xs: '100%', sm: 520 }, p: 3 },
                }}
            >
                {drawerInvoice && (
                    <Box display="flex" flexDirection="column" height="100%">
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                            <Box>
                                <Typography variant="h5" fontWeight={800} color="#0f172a">
                                    {drawerInvoice.invoiceNumber}
                                </Typography>
                                <Box display="flex" gap={1} alignItems="center" mt={0.5}>
                                    {getTypeChip(drawerInvoice.invoiceType)}
                                    {getStatusChip(drawerInvoice.paymentStatus)}
                                </Box>
                            </Box>
                            <IconButton onClick={() => setDrawerOpen(false)}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        {/* Invoice Overview */}
                        <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, mb: 2 }}>
                            <Grid container spacing={1.5}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        DATE & TIME
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {new Date(drawerInvoice.invoiceDate).toLocaleString()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        PAYMENT METHOD
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {drawerInvoice.paymentMethod}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">
                                        CUSTOMER
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {drawerInvoice.customerName} {drawerInvoice.customerPhone && `(${drawerInvoice.customerPhone})`}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Items Breakdown */}
                        <Typography variant="subtitle2" fontWeight={700} mb={1}>
                            Items Breakdown ({drawerInvoice.items?.length || 0})
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Item</TableCell>
                                        <TableCell align="right">Qty</TableCell>
                                        <TableCell align="right">Price</TableCell>
                                        <TableCell align="right">Total</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(drawerInvoice.items || []).map((itm) => (
                                        <TableRow key={itm.id}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {itm.productName}
                                                </Typography>
                                                {itm.taxRate > 0 && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Tax: {itm.taxRate}%
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">{itm.quantity}</TableCell>
                                            <TableCell align="right">{Number(itm.unitPrice).toFixed(2)}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                {Number(itm.lineTotal).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Financial Totals */}
                        <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, mb: 3 }}>
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                                <Typography variant="body2" fontWeight={600}>{Number(drawerInvoice.subtotal).toFixed(2)}</Typography>
                            </Box>
                            {drawerInvoice.taxTotal > 0 && (
                                <Box display="flex" justifyContent="space-between" mb={0.5}>
                                    <Typography variant="body2" color="text.secondary">Tax Total:</Typography>
                                    <Typography variant="body2" fontWeight={600}>{Number(drawerInvoice.taxTotal).toFixed(2)}</Typography>
                                </Box>
                            )}
                            {drawerInvoice.discountTotal > 0 && (
                                <Box display="flex" justifyContent="space-between" mb={0.5}>
                                    <Typography variant="body2" color="text.secondary">Discount Total:</Typography>
                                    <Typography variant="body2" fontWeight={600}>-{Number(drawerInvoice.discountTotal).toFixed(2)}</Typography>
                                </Box>
                            )}
                            <Divider sx={{ my: 1 }} />
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Typography variant="subtitle1" fontWeight={800}>Grand Total:</Typography>
                                <Typography variant="subtitle1" fontWeight={800} color="#2563eb">
                                    {Number(drawerInvoice.grandTotal).toFixed(2)}
                                </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Typography variant="body2" color="#16a34a" fontWeight={600}>Paid Amount:</Typography>
                                <Typography variant="body2" color="#16a34a" fontWeight={700}>
                                    {Number(drawerInvoice.paidAmount).toFixed(2)}
                                </Typography>
                            </Box>
                            {drawerInvoice.balanceDue > 0 && (
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="#dc2626" fontWeight={700}>Balance Due:</Typography>
                                    <Typography variant="body2" color="#dc2626" fontWeight={800}>
                                        {Number(drawerInvoice.balanceDue).toFixed(2)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Payments Timeline */}
                        <Typography variant="subtitle2" fontWeight={700} mb={1}>
                            Payment History & Timeline ({drawerInvoice.payments?.length || 0})
                        </Typography>
                        {(drawerInvoice.payments || []).length === 0 ? (
                            <Typography variant="caption" color="text.secondary" mb={2}>
                                No separate installment payments recorded.
                            </Typography>
                        ) : (
                            <Box mb={2}>
                                {drawerInvoice.payments.map((p, idx) => (
                                    <Box
                                        key={p.id || idx}
                                        sx={{
                                            borderLeft: '2px solid #2563eb',
                                            pl: 1.5,
                                            py: 0.5,
                                            mb: 1,
                                        }}
                                    >
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography variant="body2" fontWeight={700}>
                                                +{Number(p.amount).toFixed(2)} ({p.paymentMethod})
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(p.paymentDate).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        {p.referenceNotes && (
                                            <Typography variant="caption" color="text.secondary">
                                                {p.referenceNotes}
                                            </Typography>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        )}

                        <Box mt="auto" pt={2} display="flex" gap={1}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<PictureAsPdfIcon />}
                                onClick={() => handleDownloadPdf(drawerInvoice)}
                            >
                                Download PDF
                            </Button>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<PrintIcon />}
                                onClick={() => handleOpenPrint(drawerInvoice)}
                            >
                                Thermal Print
                            </Button>
                        </Box>
                    </Box>
                )}
            </Drawer>

            {/* Record Payment Dialog */}
            <Dialog open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} maxWidth="xs" fullWidth>
                <form onSubmit={handleSubmitPayment}>
                    <DialogTitle fontWeight={700}>Record Post-Checkout Payment</DialogTitle>
                    <DialogContent dividers>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Invoice <strong>{menuInvoice?.invoiceNumber}</strong> balance due:{' '}
                            <strong style={{ color: '#dc2626' }}>
                                {Number(menuInvoice?.balanceDue || 0).toFixed(2)}
                            </strong>
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Payment Amount"
                                    type="number"
                                    fullWidth
                                    required
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Payment Method"
                                    select
                                    fullWidth
                                    value={paymentForm.paymentMethod}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                                >
                                    <MenuItem value="CASH">Cash Tender</MenuItem>
                                    <MenuItem value="CARD">Credit/Debit Card</MenuItem>
                                    <MenuItem value="TRANSFER">Bank Transfer</MenuItem>
                                    <MenuItem value="CUSTOMER_CREDIT">Customer Credit</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Deposit Account"
                                    select
                                    fullWidth
                                    value={paymentForm.accountId}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, accountId: e.target.value })}
                                >
                                    {accounts.map((acc) => (
                                        <MenuItem key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.type}) - Bal: {Number(acc.currentBalance).toFixed(2)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Reference Notes"
                                    fullWidth
                                    value={paymentForm.referenceNotes}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNotes: e.target.value })}
                                    placeholder="e.g. Check #4402 or Bank Transaction ID"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" color="success">
                            Record Payment
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Process Return Dialog */}
            <Dialog open={returnModalOpen} onClose={() => setReturnModalOpen(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmitReturn}>
                    <DialogTitle fontWeight={700}>Process Customer Return / Credit Note</DialogTitle>
                    <DialogContent dividers>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Processing return for sale <strong>{menuInvoice?.invoiceNumber}</strong>. This will automatically restock items back into inventory and record a refund transaction.
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Refund Channel"
                                    select
                                    fullWidth
                                    value={returnForm.refundMethod}
                                    onChange={(e) => setReturnForm({ ...returnForm, refundMethod: e.target.value })}
                                >
                                    <MenuItem value="CASH">Cash Refund</MenuItem>
                                    <MenuItem value="CARD">Card Reversal</MenuItem>
                                    <MenuItem value="CUSTOMER_CREDIT">Store Credit</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Disbursement Account"
                                    select
                                    fullWidth
                                    value={returnForm.accountId}
                                    onChange={(e) => setReturnForm({ ...returnForm, accountId: e.target.value })}
                                >
                                    {accounts.map((acc) => (
                                        <MenuItem key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.type})
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Return Reason & Notes"
                                    fullWidth
                                    required
                                    value={returnForm.returnNotes}
                                    onChange={(e) => setReturnForm({ ...returnForm, returnNotes: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setReturnModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" color="error">
                            Confirm Return & Restock
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Thermal Receipt Print Dialog */}
            <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Thermal Receipt (80mm)</DialogTitle>
                <DialogContent dividers>
                    {printInvoice && <ThermalReceipt invoice={printInvoice} />}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setPrintModalOpen(false)}>Close</Button>
                    <Button variant="contained" onClick={() => window.print()} startIcon={<PrintIcon />}>
                        Print
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Invoices;
