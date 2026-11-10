import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Grid, Paper, FormControl,
    InputLabel, Select, MenuItem, TextField, Tabs, Tab,
    Card, CardContent, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, LinearProgress,
    CircularProgress, Alert
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PrintIcon from '@mui/icons-material/Print';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ExportService from '../api/exportService';
import { getDailySummary } from '../api/registerApi';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
    const { user, storeName } = useAuth();
    const [tabIndex, setTabIndex] = useState(0); // 0: Executive Summary, 1: Data Export
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [summaryData, setSummaryData] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

    // Export Settings
    const [format, setFormat] = useState('CSV');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (tabIndex === 0 && user) {
            fetchSummary();
        }
    }, [tabIndex, selectedDate, user]);

    const fetchSummary = async () => {
        setLoadingSummary(true);
        const uid = user.id || user.userId;
        try {
            const res = await getDailySummary(selectedDate, uid);
            setSummaryData(res.data);
        } catch (err) {
            console.error('Failed to load executive summary', err);
        } finally {
            setLoadingSummary(false);
        }
    };

    const handleExport = async (type) => {
        setMessage({ type: 'info', text: 'Exporting...' });
        const payload = {
            userId: user.id || user.userId,
            format: format,
            startDate: startDate || null,
            endDate: endDate || null,
        };

        try {
            switch (type) {
                case 'TRANSACTIONS':
                    await ExportService.exportTransactions(payload);
                    break;
                case 'ACCOUNTS':
                    await ExportService.exportAccounts({ ...payload, startDate: null, endDate: null });
                    break;
                case 'BUDGETS':
                    await ExportService.exportBudgets({ ...payload, startDate: null, endDate: null });
                    break;
                case 'CATEGORIES':
                    await ExportService.exportCategories({ ...payload, startDate: null, endDate: null });
                    break;
                case 'ALL':
                    await ExportService.exportAll({ ...payload, format: 'JSON' });
                    break;
                default:
                    break;
            }
            setMessage({ type: 'success', text: 'Export started successfully' });
        } catch (error) {
            console.error('Export failed', error);
            setMessage({ type: 'error', text: 'Export failed. Please check backend logs.' });
        }
    };

    const grossSales = Number(summaryData?.grossSales) || 0;
    const returnsTotal = Number(summaryData?.returnsTotal) || 0;
    const netSales = Number(summaryData?.netSales) || 0;
    const grossProfit = Number(summaryData?.grossProfit) || 0;
    const totalInvoices = Number(summaryData?.totalInvoicesCount) || 0;
    const cashSales = Number(summaryData?.cashSales) || 0;
    const cardSales = Number(summaryData?.cardSales) || 0;
    const transferSales = Number(summaryData?.transferSales) || 0;
    const creditSales = Number(summaryData?.creditSales) || 0;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <AssessmentIcon color="primary" sx={{ fontSize: 34 }} />
                    <Box>
                        <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
                            Reports & Executive Intelligence
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Daily gross sales, product velocity, payment breakdowns, and audit exports
                        </Typography>
                    </Box>
                </Box>
                {tabIndex === 0 && (
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={() => window.print()}
                    >
                        Print / PDF Export
                    </Button>
                )}
            </Box>

            {message.text && (
                <Alert severity={message.type} sx={{ mb: 3, borderRadius: 2 }}>
                    {message.text}
                </Alert>
            )}

            {/* Segmented Tabs */}
            <Paper sx={{ mb: 3 }} elevation={1}>
                <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} indicatorColor="primary" textColor="primary">
                    <Tab label="Daily Executive Summary" icon={<MonetizationOnIcon />} iconPosition="start" />
                    <Tab label="Raw Data & Audit Export" icon={<DownloadIcon />} iconPosition="start" />
                </Tabs>
            </Paper>

            {/* Tab 0: Daily Executive Summary */}
            {tabIndex === 0 && (
                <Box className="printable-report">
                    <style>
                        {`
                          @media print {
                            body * {
                              visibility: hidden;
                            }
                            .printable-report, .printable-report * {
                              visibility: visible;
                            }
                            .printable-report {
                              position: absolute;
                              left: 0;
                              top: 0;
                              width: 100%;
                            }
                            @page {
                              size: A4 portrait;
                              margin: 12mm;
                            }
                          }
                        `}
                    </style>

                    {/* Date Selector Bar */}
                    <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }} elevation={1}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography variant="subtitle2" fontWeight={700}>
                                Reporting Date:
                            </Typography>
                            <TextField
                                type="date"
                                size="small"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                        <Box display="flex" gap={1}>
                            <Button
                                size="small"
                                variant={selectedDate === new Date().toISOString().split('T')[0] ? 'contained' : 'outlined'}
                                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                            >
                                Today
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                    const y = new Date();
                                    y.setDate(y.getDate() - 1);
                                    setSelectedDate(y.toISOString().split('T')[0]);
                                }}
                            >
                                Yesterday
                            </Button>
                        </Box>
                    </Paper>

                    {loadingSummary ? (
                        <Box textAlign="center" py={8}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Box>
                            {/* KPI Metrics */}
                            <Grid container spacing={2} mb={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card elevation={1}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                GROSS POS SALES
                                            </Typography>
                                            <Typography variant="h4" fontWeight={800} color="#0f172a" mt={0.5}>
                                                Rs. {grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                                <TrendingUpIcon sx={{ fontSize: 16, color: '#16a34a' }} />
                                                <Typography variant="caption" color="success.main" fontWeight={600}>
                                                    {totalInvoices} Invoices Issued
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card elevation={1}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                RETURNS & REFUNDS
                                            </Typography>
                                            <Typography variant="h4" fontWeight={800} color="#dc2626" mt={0.5}>
                                                Rs. {returnsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                                <TrendingDownIcon sx={{ fontSize: 16, color: '#dc2626' }} />
                                                <Typography variant="caption" color="error.main" fontWeight={600}>
                                                    Customer Credit Restocked
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card elevation={1} sx={{ borderColor: '#2563eb' }}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Typography variant="caption" color="primary" fontWeight={700}>
                                                NET REALIZED SALES
                                            </Typography>
                                            <Typography variant="h4" fontWeight={800} color="#2563eb" mt={0.5}>
                                                Rs. {netSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Gross Sales minus Returns
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card elevation={1} sx={{ bgcolor: '#f0fdf4', borderColor: '#86efac' }}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Typography variant="caption" color="#15803d" fontWeight={700}>
                                                ESTIMATED GROSS PROFIT
                                            </Typography>
                                            <Typography variant="h4" fontWeight={800} color="#15803d" mt={0.5}>
                                                Rs. {grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Net Inflow after store expenses
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Velocity & Payment Breakdown Grid */}
                            <Grid container spacing={3} mb={3}>
                                {/* Top-Selling Products Velocity */}
                                <Grid item xs={12} md={7}>
                                    <Paper sx={{ p: 2.5, height: '100%' }} elevation={1}>
                                        <Typography variant="h6" fontWeight={700} mb={1.5}>
                                            Top-Selling Products (Daily Velocity)
                                        </Typography>
                                        {(summaryData?.topSellingItems || []).length === 0 ? (
                                            <Typography variant="body2" color="text.secondary" py={4} textAlign="center">
                                                No product sales recorded for this date.
                                            </Typography>
                                        ) : (
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Product</TableCell>
                                                            <TableCell align="center">Units Sold</TableCell>
                                                            <TableCell align="right">Revenue</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {summaryData.topSellingItems.map((item, idx) => (
                                                            <TableRow key={idx} hover>
                                                                <TableCell>
                                                                    <Typography variant="body2" fontWeight={700}>
                                                                        #{idx + 1} {item.name}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    <Chip
                                                                        label={`${item.quantity} units`}
                                                                        size="small"
                                                                        sx={{ fontWeight: 600, height: 22 }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 700, color: '#2563eb' }}>
                                                                    Rs. {Number(item.revenue).toFixed(2)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </Paper>
                                </Grid>

                                {/* Payment Methods Share */}
                                <Grid item xs={12} md={5}>
                                    <Paper sx={{ p: 2.5, height: '100%' }} elevation={1}>
                                        <Typography variant="h6" fontWeight={700} mb={2}>
                                            Payment Method Breakdown
                                        </Typography>
                                        {[
                                            { label: 'Cash Tender', amount: cashSales, color: '#16a34a' },
                                            { label: 'Card / POS Terminal', amount: cardSales, color: '#2563eb' },
                                            { label: 'Bank Transfer', amount: transferSales, color: '#7c3aed' },
                                            { label: 'Store / Customer Credit', amount: creditSales, color: '#ea580c' },
                                        ].map((ch) => {
                                            const pct = grossSales > 0 ? (ch.amount / grossSales) * 100 : 0;
                                            return (
                                                <Box key={ch.label} mb={2}>
                                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {ch.label}
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            Rs. {ch.amount.toFixed(2)} ({pct.toFixed(0)}%)
                                                        </Typography>
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={pct}
                                                        sx={{
                                                            height: 8,
                                                            borderRadius: 4,
                                                            bgcolor: '#f1f5f9',
                                                            '& .MuiLinearProgress-bar': { bgcolor: ch.color },
                                                        }}
                                                    />
                                                </Box>
                                            );
                                        })}
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Box>
            )}

            {/* Tab 1: Raw Data & Audit Export */}
            {tabIndex === 1 && (
                <Box>
                    <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Export Configuration
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Format</InputLabel>
                                    <Select value={format} label="Format" onChange={(e) => setFormat(e.target.value)}>
                                        <MenuItem value="CSV">CSV</MenuItem>
                                        <MenuItem value="EXCEL">Excel</MenuItem>
                                        <MenuItem value="PDF">PDF</MenuItem>
                                        <MenuItem value="JSON">JSON</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    label="Start Date"
                                    type="date"
                                    size="small"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    label="End Date"
                                    type="date"
                                    size="small"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2.5 }} elevation={1}>
                                <Typography variant="h6" fontWeight={700} gutterBottom>
                                    Transactions Report
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Export detailed financial ledger entries and general account journals.
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    onClick={() => handleExport('TRANSACTIONS')}
                                >
                                    Export Transactions
                                </Button>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2.5 }} elevation={1}>
                                <Typography variant="h6" fontWeight={700} gutterBottom>
                                    Accounts Balances
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Export cash drawers, bank accounts, and current balances.
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    onClick={() => handleExport('ACCOUNTS')}
                                >
                                    Export Accounts
                                </Button>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2.5 }} elevation={1}>
                                <Typography variant="h6" fontWeight={700} gutterBottom>
                                    Budgets vs Actuals
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Export category budgets and progress metrics.
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    onClick={() => handleExport('BUDGETS')}
                                >
                                    Export Budgets
                                </Button>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2.5 }} elevation={1}>
                                <Typography variant="h6" fontWeight={700} gutterBottom>
                                    Full Platform Archive
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Export all store operational data in JSON format for offsite backup.
                                </Typography>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    startIcon={<DownloadIcon />}
                                    onClick={() => handleExport('ALL')}
                                >
                                    Backup Store Data (JSON)
                                </Button>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            )}
        </Box>
    );
};

export default Reports;
