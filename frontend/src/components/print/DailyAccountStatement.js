import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider, Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { useTenant } from '../../context/TenantContext';

const DailyAccountStatement = ({ summary, onPrint }) => {
    const tenantBrand = useTenant();
    if (!summary) return null;

    const handlePrint = () => {
        if (onPrint) {
            onPrint();
        } else {
            window.print();
        }
    };

    return (
        <Box sx={{ width: '100%', maxWidth: '800px', margin: '0 auto', p: 2 }}>
            <Box className="no-print" sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<PrintIcon />} 
                    onClick={handlePrint}
                >
                    Print Daily Financial Statement (Z-Report)
                </Button>
            </Box>

            <Paper 
                elevation={1}
                sx={{
                    p: 4,
                    backgroundColor: '#fff',
                    color: '#000',
                    border: '1px solid #ddd',
                    '@media print': {
                        border: 'none',
                        boxShadow: 'none',
                        p: 0
                    }
                }}
            >
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2', textTransform: 'uppercase' }}>
                            {tenantBrand.storeName}
                        </Typography>
                        <Typography variant="subtitle2" color="textSecondary">
                            Daily Register Closure & Account Statement (Z-Report)
                        </Typography>
                        {tenantBrand.taxNumber && (
                            <Typography variant="caption" color="textSecondary">
                                Tax Reg ID: {tenantBrand.taxNumber}
                            </Typography>
                        )}
                    </Box>
                    <Box textAlign="right">
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            Date: {new Date(summary.date || Date.now()).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Status: <strong>{summary.sessionStatus || 'ACTIVE'}</strong>
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Session Timeline */}
                <Box sx={{ backgroundColor: '#f9f9f9', p: 2, borderRadius: 1, mb: 3, border: '1px solid #eee' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        REGISTER SESSION METRICS
                    </Typography>
                    <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
                        <Box>
                            <Typography variant="caption" color="textSecondary">Session ID</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>#{summary.sessionId || 'N/A'}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="textSecondary">Opened At</Typography>
                            <Typography variant="body2">
                                {summary.sessionOpenedAt ? new Date(summary.sessionOpenedAt).toLocaleTimeString() : 'N/A'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="textSecondary">Closed At</Typography>
                            <Typography variant="body2">
                                {summary.sessionClosedAt ? new Date(summary.sessionClosedAt).toLocaleTimeString() : 'Open / In Progress'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* 1. Sales Breakdown by Payment Channel */}
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                    1. REVENUE BREAKDOWN BY PAYMENT CHANNEL
                </Typography>
                <TableContainer component={Box} sx={{ mb: 3 }}>
                    <Table size="small">
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><strong>Payment Channel</strong></TableCell>
                                <TableCell align="center"><strong>Transaction Count</strong></TableCell>
                                <TableCell align="right"><strong>Amount</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell>Cash Inflows</TableCell>
                                <TableCell align="center">-</TableCell>
                                <TableCell align="right">Rs. {Number(summary.cashSales || 0).toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Debit / Credit Card</TableCell>
                                <TableCell align="center">-</TableCell>
                                <TableCell align="right">Rs. {Number(summary.cardSales || 0).toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Bank Transfer / Online</TableCell>
                                <TableCell align="center">-</TableCell>
                                <TableCell align="right">Rs. {Number(summary.transferSales || 0).toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Customer Credit (Accounts Receivable)</TableCell>
                                <TableCell align="center">-</TableCell>
                                <TableCell align="right">Rs. {Number(summary.creditSales || 0).toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>TOTAL GROSS SALES ({summary.totalInvoicesCount || 0} Invoices)</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>{summary.totalInvoicesCount || 0}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1565c0' }}>
                                    Rs. {Number(summary.totalSales || 0).toLocaleString()}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* 2. Operational Expenses Incurred */}
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                    2. OPERATIONAL EXPENSES INCURRED TODAY
                </Typography>
                <TableContainer component={Box} sx={{ mb: 3 }}>
                    <Table size="small">
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><strong>Expense Category / Channel</strong></TableCell>
                                <TableCell align="right"><strong>Amount</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell>Total Cash Expenses Paid Out of Drawer</TableCell>
                                <TableCell align="right">Rs. {Number(summary.cashExpenses || 0).toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow sx={{ backgroundColor: '#ffebee' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>TOTAL DAY EXPENSES</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#c62828' }}>
                                    Rs. {Number(summary.totalExpenses || 0).toLocaleString()}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* 3. Physical Cash Drawer Reconciliation */}
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                    3. PHYSICAL CASH DRAWER RECONCILIATION
                </Typography>
                <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2, mb: 4 }}>
                    <Box display="flex" justifyContent="space-between" py={0.5}>
                        <Typography variant="body2">(+) Opening Cash Float:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Rs. {Number(summary.openingCashFloat || 0).toLocaleString()}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" py={0.5}>
                        <Typography variant="body2">(+) Total Cash Sales Collected:</Typography>
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>+ Rs. {Number(summary.cashSales || 0).toLocaleString()}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" py={0.5}>
                        <Typography variant="body2">(-) Total Cash Expenses Paid Out:</Typography>
                        <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold' }}>- Rs. {Number(summary.cashExpenses || 0).toLocaleString()}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between" py={0.5}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>EXPECTED CASH IN DRAWER:</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                            Rs. {Number(summary.expectedCashInDrawer || 0).toLocaleString()}
                        </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" py={0.5}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>ACTUAL COUNTED CASH:</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            Rs. {Number(summary.actualCashInDrawer || 0).toLocaleString()}
                        </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between" py={0.5}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>DRAWER VARIANCE (OVER/SHORT):</Typography>
                        <Typography 
                            variant="subtitle1" 
                            sx={{ 
                                fontWeight: 'bold', 
                                color: Number(summary.cashVariance || 0) === 0 ? 'success.main' : (Number(summary.cashVariance || 0) > 0 ? 'info.main' : 'error.main')
                            }}
                        >
                            Rs. {Number(summary.cashVariance || 0).toLocaleString()}
                        </Typography>
                    </Box>
                </Box>

                {/* Signatures */}
                <Box display="flex" justifyContent="space-between" pt={4} sx={{ borderTop: '1px dashed #ccc' }}>
                    <Box textAlign="center" sx={{ width: '220px' }}>
                        <Box sx={{ borderBottom: '1px solid #000', mb: 1, minHeight: '30px' }} />
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Cashier / Terminal Operator</Typography>
                    </Box>
                    <Box textAlign="center" sx={{ width: '220px' }}>
                        <Box sx={{ borderBottom: '1px solid #000', mb: 1, minHeight: '30px' }} />
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Store Manager Verification</Typography>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default DailyAccountStatement;
