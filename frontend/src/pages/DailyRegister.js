import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Button, Card, CardContent, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Alert, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import PrintIcon from '@mui/icons-material/Print';
import PaymentsIcon from '@mui/icons-material/Payments';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
    openRegister,
    closeRegister,
    getActiveRegister,
    getDailySummary,
    addCashMovement,
    getRegisterHistory
} from '../api/registerApi';
import { useAuth } from '../context/AuthContext';
import DailyAccountStatement from '../components/print/DailyAccountStatement';

const DailyRegister = () => {
    const { user } = useAuth();
    const [tabIndex, setTabIndex] = useState(0); // 0: Live Drawer, 1: Session History
    const [activeSession, setActiveSession] = useState(null);
    const [dailySummary, setDailySummary] = useState(null);
    const [historyList, setHistoryList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHistorySession, setSelectedHistorySession] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

    // Modals
    const [openModalOpen, setOpenModalOpen] = useState(false);
    const [closeModalOpen, setCloseModalOpen] = useState(false);
    const [movementModalOpen, setMovementModalOpen] = useState(false);
    const [movementType, setMovementType] = useState('PAY_IN'); // PAY_IN, PAY_OUT, CASH_DROP
    const [printModalOpen, setPrintModalOpen] = useState(false);

    // Forms
    const [openForm, setOpenForm] = useState({ openingCashBalance: 5000, notes: '' });
    const [closeForm, setCloseForm] = useState({ actualCashBalance: '', notes: '' });
    const [movementForm, setMovementForm] = useState({ amount: '', reason: '' });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, tabIndex]);

    const fetchData = async () => {
        setLoading(true);
        const uid = user.id || user.userId;
        try {
            const [sessionRes, summaryRes, historyRes] = await Promise.all([
                getActiveRegister(uid),
                getDailySummary(null, uid),
                getRegisterHistory(undefined, undefined, uid)
            ]);
            setActiveSession(sessionRes.data || null);
            setDailySummary(summaryRes.data || null);
            setHistoryList(historyRes.data || []);
        } catch (err) {
            showAlert('Failed to load register session data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message, severity = 'success') => {
        setAlert({ show: true, message, severity });
        setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 4500);
    };

    const handleOpenRegister = async (e) => {
        e.preventDefault();
        try {
            await openRegister({
                userId: user.id || user.userId,
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

    const handleOpenMovementModal = (type) => {
        setMovementType(type);
        setMovementForm({ amount: '', reason: '' });
        setMovementModalOpen(true);
    };

    const handleSubmitMovement = async (e) => {
        e.preventDefault();
        if (!activeSession) return;
        try {
            await addCashMovement({
                sessionId: activeSession.id,
                movementType,
                amount: Number(movementForm.amount),
                reason: movementForm.reason,
                userId: user.id || user.userId
            });
            showAlert(`Recorded ${movementType.replace('_', ' ')} of Rs. ${movementForm.amount}`);
            setMovementModalOpen(false);
            fetchData();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Error recording drawer movement', 'error');
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

    // Live calculations for Drawer
    const opening = activeSession ? Number(activeSession.openingCashBalance) || 0 : 0;
    const cashSales = Number(dailySummary?.cashSales) || 0;
    const cashRefunds = Number(dailySummary?.returnsTotal) || 0;
    const cashExpenses = Number(dailySummary?.cashExpenses) || 0;
    const payIns = Number(dailySummary?.payIns) || 0;
    const payOuts = Number(dailySummary?.payOuts) || 0;
    const cashDrops = Number(dailySummary?.cashDrops) || 0;

    const liveCashInDrawer = opening + cashSales - cashRefunds - cashExpenses + payIns - payOuts - cashDrops;

    // Reconciliation live variance calculation
    const enteredActual = closeForm.actualCashBalance !== '' ? Number(closeForm.actualCashBalance) : null;
    const liveVariance = enteredActual !== null ? enteredActual - liveCashInDrawer : null;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <AccountBalanceWalletIcon color="primary" sx={{ fontSize: 34 }} />
                    <Box>
                        <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
                            Daily Register & Cash Drawer
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Live float balance, cash drop logging, and end-of-day Z-Report reconciliation
                        </Typography>
                    </Box>
                </Box>
                <Box display="flex" gap={1.5}>
                    {!activeSession ? (
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<LockOpenIcon />}
                            onClick={() => setOpenModalOpen(true)}
                            size="large"
                        >
                            Open Today's Register
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<LockIcon />}
                            onClick={() => {
                                setCloseForm({ actualCashBalance: '', notes: '' });
                                setCloseModalOpen(true);
                            }}
                            size="large"
                        >
                            Close Register & Reconcile
                        </Button>
                    )}
                </Box>
            </Box>

            {alert.show && (
                <Alert severity={alert.severity} sx={{ mb: 3, borderRadius: 2 }}>
                    {alert.message}
                </Alert>
            )}

            {/* Navigation Tabs */}
            <Paper sx={{ mb: 3 }} elevation={1}>
                <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} indicatorColor="primary" textColor="primary">
                    <Tab label="Live Cash Drawer" icon={<PaymentsIcon />} iconPosition="start" />
                    <Tab label="Historical Sessions (Z-Reports)" icon={<HistoryIcon />} iconPosition="start" />
                </Tabs>
            </Paper>

            {tabIndex === 0 && (
                <Box>
                    {/* Drawer State Banner */}
                    <Paper
                        sx={{
                            p: 2.5,
                            mb: 3,
                            bgcolor: activeSession ? '#eff6ff' : '#f8fafc',
                            borderColor: activeSession ? '#2563eb' : '#e2e8f0',
                        }}
                        elevation={1}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Chip
                                    label={activeSession ? 'DRAWER ACTIVE / OPEN' : 'DRAWER CLOSED'}
                                    color={activeSession ? 'primary' : 'default'}
                                    sx={{ fontWeight: 800, px: 1 }}
                                />
                                {activeSession && (
                                    <Typography variant="body2" color="text.secondary">
                                        Session #{activeSession.id} opened at{' '}
                                        <strong>{new Date(activeSession.openedAt).toLocaleTimeString()}</strong>
                                    </Typography>
                                )}
                            </Box>

                            {activeSession && (
                                <Box display="flex" gap={1}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="success"
                                        startIcon={<ArrowDownwardIcon />}
                                        onClick={() => handleOpenMovementModal('PAY_IN')}
                                    >
                                        Record Pay-In
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="warning"
                                        startIcon={<ArrowUpwardIcon />}
                                        onClick={() => handleOpenMovementModal('PAY_OUT')}
                                    >
                                        Record Pay-Out
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="secondary"
                                        startIcon={<PaymentsIcon />}
                                        onClick={() => handleOpenMovementModal('CASH_DROP')}
                                    >
                                        Cash Drop / Bank Safe
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Paper>

                    {/* KPI Balance Cards */}
                    <Grid container spacing={2} mb={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={1}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        OPENING CASH FLOAT
                                    </Typography>
                                    <Typography variant="h4" fontWeight={800} color="#0f172a" mt={0.5}>
                                        Rs. {opening.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={1}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        TODAY'S CASH SALES
                                    </Typography>
                                    <Typography variant="h4" fontWeight={800} color="#16a34a" mt={0.5}>
                                        Rs. {cashSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={1}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        NET DRAWER ADJUSTMENTS
                                    </Typography>
                                    <Typography variant="h4" fontWeight={800} color="#7c3aed" mt={0.5}>
                                        Rs. {(payIns - payOuts - cashDrops).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={2} sx={{ borderColor: '#2563eb', bgcolor: '#f0fdf4' }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Typography variant="caption" color="primary" fontWeight={700}>
                                        LIVE CASH IN DRAWER
                                    </Typography>
                                    <Typography variant="h4" fontWeight={900} color="#15803d" mt={0.5}>
                                        Rs. {liveCashInDrawer.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Mid-day Drawer Movements Table */}
                    <Paper sx={{ p: 2.5, mb: 3 }} elevation={1}>
                        <Typography variant="h6" fontWeight={700} mb={1.5}>
                            Today's Mid-Day Drawer Movements (Drops & Pay-Ins)
                        </Typography>
                        {(activeSession?.movements || []).length === 0 ? (
                            <Typography variant="body2" color="text.secondary" py={2}>
                                No mid-day cash adjustments logged for this session yet.
                            </Typography>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Time</TableCell>
                                            <TableCell>Adjustment Type</TableCell>
                                            <TableCell>Reason / Reference</TableCell>
                                            <TableCell align="right">Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {activeSession.movements.map((m) => {
                                            const isPositive = m.movementType === 'PAY_IN';
                                            return (
                                                <TableRow key={m.id} hover>
                                                    <TableCell>
                                                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={m.movementType.replace('_', ' ')}
                                                            size="small"
                                                            color={m.movementType === 'PAY_IN' ? 'success' : m.movementType === 'CASH_DROP' ? 'secondary' : 'warning'}
                                                            sx={{ fontWeight: 700 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{m.reason || '—'}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700, color: isPositive ? 'success.main' : 'error.main' }}>
                                                        {isPositive ? '+' : '-'}Rs. {Number(m.amount).toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </Box>
            )}

            {/* Historical Sessions Tab */}
            {tabIndex === 1 && (
                <TableContainer component={Paper} elevation={1}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Session #</TableCell>
                                <TableCell>Opened At</TableCell>
                                <TableCell>Closed At</TableCell>
                                <TableCell align="right">Opening Float</TableCell>
                                <TableCell align="right">Expected Cash</TableCell>
                                <TableCell align="right">Actual Cash</TableCell>
                                <TableCell align="center">Variance (Diff)</TableCell>
                                <TableCell align="center">Status</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {historyList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                        No historical register sessions archived yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                historyList.map((s) => {
                                    const diff = Number(s.cashDifference) || 0;
                                    const isMatch = Math.abs(diff) < 0.01;
                                    const isSurplus = diff > 0;

                                    return (
                                        <TableRow key={s.id} hover>
                                            <TableCell sx={{ fontWeight: 700 }}>#{s.id}</TableCell>
                                            <TableCell>{new Date(s.openedAt).toLocaleString()}</TableCell>
                                            <TableCell>{s.closedAt ? new Date(s.closedAt).toLocaleString() : 'Active'}</TableCell>
                                            <TableCell align="right">{Number(s.openingCashBalance).toFixed(2)}</TableCell>
                                            <TableCell align="right">{s.expectedCashBalance !== null ? Number(s.expectedCashBalance).toFixed(2) : '—'}</TableCell>
                                            <TableCell align="right">{s.actualCashBalance !== null ? Number(s.actualCashBalance).toFixed(2) : '—'}</TableCell>
                                            <TableCell align="center">
                                                {s.cashDifference === null ? (
                                                    '—'
                                                ) : isMatch ? (
                                                    <Chip label="Exact (0.00)" color="success" size="small" />
                                                ) : (
                                                    <Chip
                                                        label={`${isSurplus ? '+' : ''}${diff.toFixed(2)}`}
                                                        color={isSurplus ? 'success' : 'error'}
                                                        size="small"
                                                        sx={{ fontWeight: 700 }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={s.status} size="small" color={s.status === 'OPEN' ? 'primary' : 'default'} />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<PrintIcon />}
                                                    onClick={() => {
                                                        setSelectedHistorySession(s);
                                                        setPrintModalOpen(true);
                                                    }}
                                                >
                                                    Z-Report
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Open Register Modal */}
            <Dialog open={openModalOpen} onClose={() => setOpenModalOpen(false)} maxWidth="xs" fullWidth>
                <form onSubmit={handleOpenRegister}>
                    <DialogTitle fontWeight={700}>Open Register Drawer Float</DialogTitle>
                    <DialogContent dividers>
                        <TextField
                            label="Opening Cash Float (Rs.)"
                            type="number"
                            fullWidth
                            required
                            value={openForm.openingCashBalance}
                            onChange={(e) => setOpenForm({ ...openForm, openingCashBalance: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            label="Notes / Shift ID"
                            fullWidth
                            value={openForm.notes}
                            onChange={(e) => setOpenForm({ ...openForm, notes: e.target.value })}
                            placeholder="e.g. Morning Shift"
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setOpenModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" color="success">
                            Open Session
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Close Register & Reconcile Modal */}
            <Dialog open={closeModalOpen} onClose={() => setCloseModalOpen(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleCloseRegister}>
                    <DialogTitle fontWeight={700}>End of Day Drawer Reconciliation</DialogTitle>
                    <DialogContent dividers>
                        <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, mb: 3 }}>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">Expected Cash in Drawer:</Typography>
                                <Typography variant="subtitle1" fontWeight={800} color="#2563eb">
                                    Rs. {liveCashInDrawer.toFixed(2)}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                                Opening Float ({opening.toFixed(2)}) + Cash Sales ({cashSales.toFixed(2)}) + Net Adjustments ({(payIns - payOuts - cashDrops).toFixed(2)})
                            </Typography>
                        </Box>

                        <TextField
                            label="Actual Physical Cash Counted (Rs.)"
                            type="number"
                            fullWidth
                            required
                            autoFocus
                            value={closeForm.actualCashBalance}
                            onChange={(e) => setCloseForm({ ...closeForm, actualCashBalance: e.target.value })}
                            sx={{ mb: 2 }}
                        />

                        {/* Visual Variance Indicator */}
                        {liveVariance !== null && (
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    mb: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    bgcolor: Math.abs(liveVariance) < 0.01 ? '#f0fdf4' : liveVariance > 0 ? '#ecfdf5' : '#fef2f2',
                                    border: `1px solid ${Math.abs(liveVariance) < 0.01 ? '#86efac' : liveVariance > 0 ? '#6ee7b7' : '#fca5a5'}`,
                                }}
                            >
                                {Math.abs(liveVariance) < 0.01 ? (
                                    <>
                                        <CheckCircleOutlineIcon color="success" />
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={700} color="success.main">
                                                Perfect Match! No Cash Variance
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Physical drawer exactly matches recorded sales transactions.
                                            </Typography>
                                        </Box>
                                    </>
                                ) : liveVariance > 0 ? (
                                    <>
                                        <CheckCircleOutlineIcon color="success" />
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={700} color="success.main">
                                                Cash Surplus / Overage: +Rs. {liveVariance.toFixed(2)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Actual drawer has more cash than system expectation.
                                            </Typography>
                                        </Box>
                                    </>
                                ) : (
                                    <>
                                        <ErrorOutlineIcon color="error" />
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={700} color="error.main">
                                                Cash Deficit / Shortage: Rs. {liveVariance.toFixed(2)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Actual cash counted is below system transactions expectation.
                                            </Typography>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        )}

                        <TextField
                            label="Reconciliation Notes / Cashier Sign-off"
                            fullWidth
                            multiline
                            rows={2}
                            value={closeForm.notes}
                            onChange={(e) => setCloseForm({ ...closeForm, notes: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setCloseModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" color="error">
                            Confirm Close & Print Z-Report
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Drawer Movement Modal */}
            <Dialog open={movementModalOpen} onClose={() => setMovementModalOpen(false)} maxWidth="xs" fullWidth>
                <form onSubmit={handleSubmitMovement}>
                    <DialogTitle fontWeight={700}>
                        Record {movementType.replace('_', ' ')}
                    </DialogTitle>
                    <DialogContent dividers>
                        <TextField
                            label="Amount (Rs.)"
                            type="number"
                            fullWidth
                            required
                            autoFocus
                            value={movementForm.amount}
                            onChange={(e) => setMovementForm({ ...movementForm, amount: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            label="Reason / Notes"
                            fullWidth
                            required
                            value={movementForm.reason}
                            onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                            placeholder="e.g. Mid-day bank drop, petty cash expense"
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setMovementModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">
                            Save Movement
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Z-Report Print Dialog */}
            <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle fontWeight={700}>End-of-Day Z-Report Statement</DialogTitle>
                <DialogContent dividers>
                    {loading && !dailySummary ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <Typography color="text.secondary">Loading statement...</Typography>
                        </Box>
                    ) : (
                        (selectedHistorySession || dailySummary) && (
                            <DailyAccountStatement summaryData={selectedHistorySession || dailySummary} />
                        )
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setPrintModalOpen(false)}>Close</Button>
                    <Button variant="contained" onClick={() => window.print()} startIcon={<PrintIcon />}>
                        Print Statement
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DailyRegister;
