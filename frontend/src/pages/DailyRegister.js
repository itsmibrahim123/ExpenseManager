import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Button, Card, CardContent, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Alert, Chip, Divider, CircularProgress
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import PrintIcon from '@mui/icons-material/Print';
import PaymentsIcon from '@mui/icons-material/Payments';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { openRegister, closeRegister, getActiveRegister, getDailySummary } from '../api/registerApi';
import { useAuth } from '../context/AuthContext';
import DailyAccountStatement from '../components/print/DailyAccountStatement';

const DailyRegister = () => {
    const { user } = useAuth();
    const [activeSession, setActiveSession] = useState(null);
    const [dailySummary, setDailySummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

    // Modals
    const [openModalOpen, setOpenModalOpen] = useState(false);
    const [closeModalOpen, setCloseModalOpen] = useState(false);
    const [printModalOpen, setPrintModalOpen] = useState(false);

    // Forms
    const [openForm, setOpenForm] = useState({ openingCashBalance: 5000, notes: '' });
    const [closeForm, setCloseForm] = useState({ actualCashBalance: '', notes: '' });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sessionRes, summaryRes] = await Promise.all([
                getActiveRegister(user.id),
                getDailySummary(null, user.id)
            ]);
            setActiveSession(sessionRes.data || null);
            setDailySummary(summaryRes.data || null);
        } catch (err) {
            showAlert('Failed to load register session data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message, severity = 'success') => {
        setAlert({ show: true, message, severity });
        setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 4000);
    };

    const handleOpenRegister = async (e) => {
        e.preventDefault();
        try {
            await openRegister({
                userId: user.id,
                openingCashBalance: Number(openForm.openingCashBalance),
                notes: openForm.notes
            });
            showAlert('Register session opened successfully!');
            setOpenModalOpen(false);
            fetchData();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Error opening register', 'error');
        }
    };

    const handleCloseRegister = async (e) => {
        e.preventDefault();
        if (!activeSession) return;
        try {
            await closeRegister(activeSession.id, {
                actualCashBalance: Number(closeForm.actualCashBalance),
                notes: closeForm.notes
            });
            showAlert('Register session closed & Z-Report statement generated!');
            setCloseModalOpen(false);
            fetchData();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Error closing register', 'error');
        }
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1}>
                    <AccountBalanceWalletIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" fontWeight="bold">
                        Daily Register & Account Reconciliation
                    </Typography>
                </Box>
                <Box display="flex" gap={1.5}>
                    {activeSession ? (
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<LockIcon />}
                            onClick={() => {
                                setCloseForm({
                                    actualCashBalance: dailySummary?.expectedCashInDrawer || '',
                                    notes: ''
                                });
                                setCloseModalOpen(true);
                            }}
                        >
                            Close Register & Cash Out
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<LockOpenIcon />}
                            onClick={() => setOpenModalOpen(true)}
                        >
                            Open New Register Session
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        startIcon={<PrintIcon />}
                        onClick={() => setPrintModalOpen(true)}
                    >
                        Print Day-End Z-Report
                    </Button>
                </Box>
            </Box>

            {alert.show && (
                <Alert severity={alert.severity} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}

            {/* Session Status Banner */}
            <Paper sx={{ p: 2.5, mb: 3, backgroundColor: activeSession ? '#e8f5e9' : '#fff3e0', border: '1px solid #ddd' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={2}>
                        <Chip
                            label={activeSession ? 'SESSION ACTIVE (REGISTER OPEN)' : 'REGISTER CLOSED'}
                            color={activeSession ? 'success' : 'warning'}
                            sx={{ fontWeight: 'bold' }}
                        />
                        {activeSession && (
                            <Typography variant="body2">
                                Opened At: <strong>{new Date(activeSession.openedAt).toLocaleString()}</strong> | 
                                Opening Float: <strong>Rs. {Number(activeSession.openingCashBalance).toLocaleString()}</strong>
                            </Typography>
                        )}
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                        Session ID: #{activeSession ? activeSession.id : 'N/A'}
                    </Typography>
                </Box>
            </Paper>

            {/* Daily Metrics Summary Grid */}
            <Grid container spacing={2.5} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="overline" color="textSecondary">Opening Cash Float</Typography>
                            <Typography variant="h5" fontWeight="bold">
                                Rs. {Number(dailySummary?.openingCashFloat || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">Session starting drawer balance</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ backgroundColor: '#f0f4c3' }}>
                        <CardContent>
                            <Typography variant="overline" color="textSecondary">Total Gross Sales Today</Typography>
                            <Typography variant="h5" fontWeight="bold" color="primary.main">
                                Rs. {Number(dailySummary?.totalSales || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {dailySummary?.totalInvoicesCount || 0} Invoices processed
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ backgroundColor: '#ffebee' }}>
                        <CardContent>
                            <Typography variant="overline" color="textSecondary">Daily Expenses Outflow</Typography>
                            <Typography variant="h5" fontWeight="bold" color="error.main">
                                - Rs. {Number(dailySummary?.totalExpenses || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">Operational expenses logged</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ backgroundColor: '#e3f2fd' }}>
                        <CardContent>
                            <Typography variant="overline" color="textSecondary">Expected Drawer Cash</Typography>
                            <Typography variant="h5" fontWeight="bold" color="success.main">
                                Rs. {Number(dailySummary?.expectedCashInDrawer || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">Opening + Cash In - Cash Out</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Sales Channel Breakdown Card */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight="bold" mb={2}>
                            Revenue by Payment Channel
                        </Typography>
                        <Box display="flex" justifyContent="space-between" py={1} sx={{ borderBottom: '1px solid #eee' }}>
                            <Typography variant="body1">Cash Collections:</Typography>
                            <Typography variant="body1" fontWeight="bold">
                                Rs. {Number(dailySummary?.cashSales || 0).toLocaleString()}
                            </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" py={1} sx={{ borderBottom: '1px solid #eee' }}>
                            <Typography variant="body1">Card Payments:</Typography>
                            <Typography variant="body1" fontWeight="bold">
                                Rs. {Number(dailySummary?.cardSales || 0).toLocaleString()}
                            </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" py={1} sx={{ borderBottom: '1px solid #eee' }}>
                            <Typography variant="body1">Bank / Online Transfers:</Typography>
                            <Typography variant="body1" fontWeight="bold">
                                Rs. {Number(dailySummary?.transferSales || 0).toLocaleString()}
                            </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" py={1}>
                            <Typography variant="body1">Customer Credit Balance:</Typography>
                            <Typography variant="body1" fontWeight="bold">
                                Rs. {Number(dailySummary?.creditSales || 0).toLocaleString()}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight="bold" mb={2}>
                            End-of-Day Cash Drawer Reconciliation
                        </Typography>
                        <Box display="flex" justifyContent="space-between" py={1}>
                            <Typography variant="body2">Opening Float:</Typography>
                            <Typography variant="body2">Rs. {Number(dailySummary?.openingCashFloat || 0).toLocaleString()}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" py={1}>
                            <Typography variant="body2">(+) Net Cash Inflow:</Typography>
                            <Typography variant="body2" color="success.main">+ Rs. {Number(dailySummary?.netCashInflow || 0).toLocaleString()}</Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box display="flex" justifyContent="space-between" py={1}>
                            <Typography variant="subtitle1" fontWeight="bold">Expected Cash:</Typography>
                            <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                                Rs. {Number(dailySummary?.expectedCashInDrawer || 0).toLocaleString()}
                            </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" py={1}>
                            <Typography variant="subtitle1" fontWeight="bold">Actual Counted Cash:</Typography>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Rs. {Number(dailySummary?.actualCashInDrawer || 0).toLocaleString()}
                            </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" py={1} sx={{ backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">Variance (Over/Short):</Typography>
                            <Typography 
                                variant="subtitle1" 
                                fontWeight="bold"
                                color={Number(dailySummary?.cashVariance || 0) === 0 ? 'success.main' : 'error.main'}
                            >
                                Rs. {Number(dailySummary?.cashVariance || 0).toLocaleString()}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Open Register Modal */}
            <Dialog open={openModalOpen} onClose={() => setOpenModalOpen(false)} maxWidth="xs" fullWidth>
                <form onSubmit={handleOpenRegister}>
                    <DialogTitle>Open Register Session</DialogTitle>
                    <DialogContent dividers>
                        <Typography variant="body2" color="textSecondary" mb={2}>
                            Specify the opening cash float in the cash drawer to start today's POS session.
                        </Typography>
                        <TextField
                            label="Opening Cash Float (PKR)"
                            type="number"
                            required
                            fullWidth
                            value={openForm.openingCashBalance}
                            onChange={(e) => setOpenForm({ ...openForm, openingCashBalance: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            label="Notes (Optional)"
                            fullWidth
                            multiline
                            rows={2}
                            value={openForm.notes}
                            onChange={(e) => setOpenForm({ ...openForm, notes: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" color="success">Open Session</Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Close Register Modal */}
            <Dialog open={closeModalOpen} onClose={() => setCloseModalOpen(false)} maxWidth="xs" fullWidth>
                <form onSubmit={handleCloseRegister}>
                    <DialogTitle>Close Register & Cash Reconciliation</DialogTitle>
                    <DialogContent dividers>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Expected Cash in Drawer: <strong>Rs. {Number(dailySummary?.expectedCashInDrawer || 0).toLocaleString()}</strong>
                        </Alert>
                        <TextField
                            label="Actual Counted Cash in Drawer (PKR)"
                            type="number"
                            required
                            fullWidth
                            value={closeForm.actualCashBalance}
                            onChange={(e) => setCloseForm({ ...closeForm, actualCashBalance: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            label="Closing Notes (Optional)"
                            fullWidth
                            multiline
                            rows={2}
                            value={closeForm.notes}
                            onChange={(e) => setCloseForm({ ...closeForm, notes: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCloseModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" color="error">Close Session & Generate Z-Report</Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Print Z-Report Modal */}
            <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Daily Financial Statement (Z-Report)</DialogTitle>
                <DialogContent dividers>
                    <DailyAccountStatement summary={dailySummary} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPrintModalOpen(false)}>Close</Button>
                    <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
                        Print Statement
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DailyRegister;
