import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Grid, MenuItem, Select, FormControl, InputLabel, Alert, CircularProgress
} from '@mui/material';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import SearchIcon from '@mui/icons-material/Search';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { getTenants, createTenant, updateTenantStatus, updateSubscription } from '../../api/adminApi';

const AdminStores = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

    // Modals
    const [onboardModalOpen, setOnboardModalOpen] = useState(false);
    const [extendModalOpen, setExtendModalOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);

    // Forms
    const [onboardForm, setOnboardForm] = useState({
        storeName: '', slug: '', ownerName: '', ownerEmail: '', ownerPassword: '',
        contactPhone: '', currencyCode: 'PKR', planTier: 'STARTER', trialDays: 14
    });

    const [extendForm, setExtendForm] = useState({
        planTier: 'STARTER', extendDays: 30
    });

    useEffect(() => {
        fetchTenants();
    }, [search, statusFilter]);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const res = await getTenants({ query: search, status: statusFilter, page: 0, size: 50 });
            setTenants(res.data.content || []);
        } catch (err) {
            showAlert('Failed to load store tenants', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message, severity = 'success') => {
        setAlert({ show: true, message, severity });
        setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 4000);
    };

    const handleOnboardSubmit = async (e) => {
        e.preventDefault();
        try {
            await createTenant(onboardForm);
            showAlert('New store tenant provisioned successfully with initial baseline data!');
            setOnboardModalOpen(false);
            fetchTenants();
            setOnboardForm({
                storeName: '', slug: '', ownerName: '', ownerEmail: '', ownerPassword: '',
                contactPhone: '', currencyCode: 'PKR', planTier: 'STARTER', trialDays: 14
            });
        } catch (err) {
            showAlert(err.response?.data?.message || 'Error provisioning store tenant', 'error');
        }
    };

    const handleToggleStatus = async (tenant) => {
        const newStatus = tenant.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        try {
            await updateTenantStatus(tenant.id, newStatus);
            showAlert(`Store status updated to ${newStatus}`);
            fetchTenants();
        } catch (err) {
            showAlert('Failed to update tenant status', 'error');
        }
    };

    const handleExtendSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTenant) return;
        try {
            await updateSubscription(selectedTenant.id, extendForm);
            showAlert(`Extended subscription for ${selectedTenant.storeName} by ${extendForm.extendDays} days!`);
            setExtendModalOpen(false);
            fetchTenants();
        } catch (err) {
            showAlert('Failed to extend subscription', 'error');
        }
    };

    const autoGenerateSlug = (name) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight="bold">
                    Multi-Tenant Store Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddBusinessIcon />}
                    onClick={() => setOnboardModalOpen(true)}
                    size="large"
                >
                    Provision New Store Tenant
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
                    <Grid item xs={12} sm={8}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by Store Name, Slug, or Owner Email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status Filter</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status Filter"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="">All Statuses</MenuItem>
                                <MenuItem value="ACTIVE">Active</MenuItem>
                                <MenuItem value="TRIAL">Trial</MenuItem>
                                <MenuItem value="SUSPENDED">Suspended</MenuItem>
                                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* Stores Data Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>Store Name & Slug</strong></TableCell>
                            <TableCell><strong>Owner Contact</strong></TableCell>
                            <TableCell align="center"><strong>Plan Tier</strong></TableCell>
                            <TableCell align="center"><strong>Status</strong></TableCell>
                            <TableCell><strong>Expires At</strong></TableCell>
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
                        ) : tenants.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    No store tenants found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tenants.map((t) => {
                                let statusColor = 'success';
                                if (t.status === 'SUSPENDED' || t.status === 'CANCELLED') statusColor = 'error';
                                else if (t.status === 'TRIAL') statusColor = 'info';

                                return (
                                    <TableRow key={t.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">{t.storeName}</Typography>
                                            <Typography variant="caption" color="textSecondary">slug: {t.slug}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{t.ownerName || 'Store Owner'}</Typography>
                                            <Typography variant="caption" color="textSecondary">{t.contactEmail}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={t.planTier} variant="outlined" color="primary" size="small" />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={t.status} color={statusColor} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            {t.expiresAt ? new Date(t.expiresAt).toLocaleDateString() : 'Lifetime'}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color={t.status === 'SUSPENDED' ? 'success' : 'error'}
                                                startIcon={t.status === 'SUSPENDED' ? <PlayCircleIcon /> : <PauseCircleIcon />}
                                                onClick={() => handleToggleStatus(t)}
                                                sx={{ mr: 1 }}
                                            >
                                                {t.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<EditCalendarIcon />}
                                                onClick={() => {
                                                    setSelectedTenant(t);
                                                    setExtendForm({ planTier: t.planTier, extendDays: 30 });
                                                    setExtendModalOpen(true);
                                                }}
                                            >
                                                Renew / Tier
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Onboard New Store Modal Wizard */}
            <Dialog open={onboardModalOpen} onClose={() => setOnboardModalOpen(false)} maxWidth="md" fullWidth>
                <form onSubmit={handleOnboardSubmit}>
                    <DialogTitle>Provision New SaaS Store Tenant</DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Store Name"
                                    required
                                    fullWidth
                                    value={onboardForm.storeName}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        setOnboardForm({
                                            ...onboardForm,
                                            storeName: name,
                                            slug: autoGenerateSlug(name)
                                        });
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Store Slug (URL Identifier)"
                                    required
                                    fullWidth
                                    value={onboardForm.slug}
                                    onChange={(e) => setOnboardForm({ ...onboardForm, slug: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Store Owner Full Name"
                                    required
                                    fullWidth
                                    value={onboardForm.ownerName}
                                    onChange={(e) => setOnboardForm({ ...onboardForm, ownerName: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Store Owner Email"
                                    type="email"
                                    required
                                    fullWidth
                                    value={onboardForm.ownerEmail}
                                    onChange={(e) => setOnboardForm({ ...onboardForm, ownerEmail: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Owner Password"
                                    type="password"
                                    required
                                    fullWidth
                                    value={onboardForm.ownerPassword}
                                    onChange={(e) => setOnboardForm({ ...onboardForm, ownerPassword: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Contact Phone (Optional)"
                                    fullWidth
                                    value={onboardForm.contactPhone}
                                    onChange={(e) => setOnboardForm({ ...onboardForm, contactPhone: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth required>
                                    <InputLabel>Base Currency</InputLabel>
                                    <Select
                                        value={onboardForm.currencyCode}
                                        label="Base Currency"
                                        onChange={(e) => setOnboardForm({ ...onboardForm, currencyCode: e.target.value })}
                                    >
                                        <MenuItem value="PKR">PKR (Pakistani Rupee)</MenuItem>
                                        <MenuItem value="USD">USD (US Dollar)</MenuItem>
                                        <MenuItem value="EUR">EUR (Euro)</MenuItem>
                                        <MenuItem value="GBP">GBP (British Pound)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth required>
                                    <InputLabel>Subscription Tier</InputLabel>
                                    <Select
                                        value={onboardForm.planTier}
                                        label="Subscription Tier"
                                        onChange={(e) => setOnboardForm({ ...onboardForm, planTier: e.target.value })}
                                    >
                                        <MenuItem value="STARTER">STARTER</MenuItem>
                                        <MenuItem value="PROFESSIONAL">PROFESSIONAL</MenuItem>
                                        <MenuItem value="ENTERPRISE">ENTERPRISE</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Trial Duration (Days)"
                                    type="number"
                                    required
                                    fullWidth
                                    value={onboardForm.trialDays}
                                    onChange={(e) => setOnboardForm({ ...onboardForm, trialDays: parseInt(e.target.value) || 14 })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOnboardModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">Provision Store Tenant</Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Subscription Renewal Modal */}
            <Dialog open={extendModalOpen} onClose={() => setExtendModalOpen(false)} maxWidth="xs" fullWidth>
                <form onSubmit={handleExtendSubmit}>
                    <DialogTitle>Extend Subscription: {selectedTenant?.storeName}</DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <FormControl fullWidth required sx={{ mb: 2 }}>
                                    <InputLabel>Update Plan Tier</InputLabel>
                                    <Select
                                        value={extendForm.planTier}
                                        label="Update Plan Tier"
                                        onChange={(e) => setExtendForm({ ...extendForm, planTier: e.target.value })}
                                    >
                                        <MenuItem value="STARTER">STARTER</MenuItem>
                                        <MenuItem value="PROFESSIONAL">PROFESSIONAL</MenuItem>
                                        <MenuItem value="ENTERPRISE">ENTERPRISE</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Extend Expiration By (Days)"
                                    type="number"
                                    required
                                    fullWidth
                                    value={extendForm.extendDays}
                                    onChange={(e) => setExtendForm({ ...extendForm, extendDays: parseInt(e.target.value) || 30 })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setExtendModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" color="success">Update Subscription</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default AdminStores;
