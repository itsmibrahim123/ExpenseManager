import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, CircularProgress, Alert
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getInvoices } from '../api/invoiceApi';
import ThermalReceipt from '../components/print/ThermalReceipt';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

    // Details / Thermal Receipt Modal
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        fetchInvoices();
    }, [statusFilter]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await getInvoices(statusFilter);
            setInvoices(res.data || []);
        } catch (err) {
            showAlert('Failed to load invoices', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message, severity = 'success') => {
        setAlert({ show: true, message, severity });
        setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 4000);
    };

    const handleViewInvoice = (inv) => {
        setSelectedInvoice(inv);
        setModalOpen(true);
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1}>
                    <ReceiptLongIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" fontWeight="bold">
                        Sales Invoices & Billing History
                    </Typography>
                </Box>
            </Box>

            {alert.show && (
                <Alert severity={alert.severity} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}

            {/* Filter */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box display="flex" gap={2} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Payment Status Filter</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Payment Status Filter"
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <MenuItem value="">All Invoices</MenuItem>
                            <MenuItem value="PAID">Paid Only</MenuItem>
                            <MenuItem value="PARTIALLY_PAID">Partially Paid</MenuItem>
                            <MenuItem value="UNPAID">Unpaid Only</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {/* Invoices Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>Invoice #</strong></TableCell>
                            <TableCell><strong>Date & Time</strong></TableCell>
                            <TableCell><strong>Customer</strong></TableCell>
                            <TableCell><strong>Payment Channel</strong></TableCell>
                            <TableCell align="center"><strong>Status</strong></TableCell>
                            <TableCell align="right"><strong>Grand Total</strong></TableCell>
                            <TableCell align="right"><strong>Paid Amount</strong></TableCell>
                            <TableCell align="center"><strong>Action</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    No invoices found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((inv) => {
                                let statusColor = 'success';
                                if (inv.paymentStatus === 'UNPAID') statusColor = 'error';
                                else if (inv.paymentStatus === 'PARTIALLY_PAID') statusColor = 'warning';

                                return (
                                    <TableRow key={inv.id} hover>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{inv.invoiceNumber}</TableCell>
                                        <TableCell>{new Date(inv.invoiceDate || inv.createdAt).toLocaleString()}</TableCell>
                                        <TableCell>{inv.customerName || 'Walk-in Customer'}</TableCell>
                                        <TableCell>{inv.paymentMethod}</TableCell>
                                        <TableCell align="center">
                                            <Chip label={inv.paymentStatus} color={statusColor} size="small" />
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                            Rs. {Number(inv.grandTotal).toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right">
                                            Rs. {Number(inv.paidAmount).toLocaleString()}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<VisibilityIcon />}
                                                onClick={() => handleViewInvoice(inv)}
                                            >
                                                View & Reprint
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Modal for Invoice View & Thermal Print */}
            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Invoice Details & Receipt</DialogTitle>
                <DialogContent dividers>
                    <ThermalReceipt invoice={selectedInvoice} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModalOpen(false)}>Close</Button>
                    <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
                        Print Thermal Receipt
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Invoices;
