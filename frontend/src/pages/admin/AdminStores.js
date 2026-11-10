import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Grid, MenuItem, Select, FormControl, InputLabel, Alert, CircularProgress, Card,
    CardContent
} from '@mui/material';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import SearchIcon from '@mui/icons-material/Search';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import StorefrontIcon from '@mui/icons-material/Storefront';
import StarIcon from '@mui/icons-material/Star';
import DiamondIcon from '@mui/icons-material/Diamond';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { getTenants, createTenant, updateTenantStatus, updateSubscription } from '../../api/adminApi';

const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'CAD'];

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
        setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 4500);
    };

    const handleOnboardSubmit = async (e) => {
        e.preventDefault();
        try {
            await createTenant(onboardForm);
            showAlert(`Store tenant '${onboardForm.storeName}' provisioned successfully!`);
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

    const getPlanBadge = (plan) => {
        switch (plan) {
            case 'ENTERPRISE':
                return (
                    <Chip
                        icon={<DiamondIcon style={{ fontSize: 14 }} />}
                        label="Enterprise"
                        size="small"
                        sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700 }}
                    />
                );
            case 'PROFESSIONAL':
                return (
                    <Chip
                        icon={<WorkspacePremiumIcon style={{ fontSize: 14 }} />}
                        label="Pro"
                        size="small"
                        sx={{ bgcolor: '#ede9fe', color: '#6d28d9', fontWeight: 700 }}
                    />
                );
            case 'STARTER':
            default:
                return (
                    <Chip
                        icon={<StarIcon style={{ fontSize: 14 }} />}
                        label="Starter"
                        size="small"
                        sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}
                    />
                );
        }
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'ACTIVE':
                return (
                    <Chip
                        label="Active"
                        size="small"
                        sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }}
                    />
                );
            case 'TRIAL':
                return (
                    <Chip
                        label="In Trial"
                        size="small"
                        sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }}
                    />
                );
            case 'SUSPENDED':
                return (
                    <Chip
                        label="Suspended"
                        size="small"
                        sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}
                    />
                );
            default:
                return <Chip label={status} size="small" />;
        }
    };

    // Metric counts
    const totalStores = tenants.length;
    const activeStores = tenants.filter((t) => t.status === 'ACTIVE').length;
    const trialStores = tenants.filter((t) => t.status === 'TRIAL').length;
    const suspendedStores = tenants.filter((t) => t.status === 'SUSPENDED').length;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <StorefrontIcon color="primary" sx={{ fontSize: 34 }} />
                    <Box>
                        <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
                            Store Tenant Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Super Admin multi-tenant store provisioning, subscription control, and metrics
                        </Typography>
                    </Box>
                </Box>
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
                <Alert severity={alert.severity} sx={{ mb: 3, borderRadius: 2 }}>
                    {alert.message}
                </Alert>
            )}

            {/* Metric Summary Cards */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={1}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                TOTAL STORE TENANTS
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="#0f172a" mt={0.5}>
                                {totalStores}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={1}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                ACTIVE STORES
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="#16a34a" mt={0.5}>
                                {activeStores}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={1}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                TRIAL STORES
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="#2563eb" mt={0.5}>
                                {trialStores}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={1}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                SUSPENDED
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="#dc2626" mt={0.5}>
                                {suspendedStores}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filter Bar */}
            <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={8}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by Store Name, Slug, or Owner Email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
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
            <TableContainer component={Paper} elevation={1}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Store Name & Slug</TableCell>
                            <TableCell>Owner Contact</TableCell>
                            <TableCell align="center">Plan Tier</TableCell>
                            <TableCell align="center">Status</TableCell>
                            <TableCell>Expiration Date</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : tenants.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                    No store tenants found matching criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tenants.map((t) => (
                                <TableRow key={t.id} hover>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight={700}>
                                            {t.storeName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            slug: <strong>{t.slug}</strong> | {t.currencyCode || 'PKR'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{t.ownerName || 'Store Owner'}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {t.contactEmail}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">{getPlanBadge(t.planTier)}</TableCell>
                                    <TableCell align="center">{getStatusChip(t.status)}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {t.expiresAt ? new Date(t.expiresAt).toLocaleDateString() : 'Lifetime'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box display="flex" justifyContent="center" gap={1}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color={t.status === 'SUSPENDED' ? 'success' : 'error'}
                                                startIcon={t.status === 'SUSPENDED' ? <PlayCircleIcon /> : <PauseCircleIcon />}
                                                onClick={() => handleToggleStatus(t)}
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
                                                Renew
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Provision Store Tenant Modal */}
            <Dialog open={onboardModalOpen} onClose={() => setOnboardModalOpen(false)} maxWidth="md" fullWidth>
                <form onSubmit={handleOnboardSubmit}>
                    <DialogTitle fontWeight={700}>Provision New SaaS Store Tenant</DialogTitle>
                    <DialogContent dividers>
                        <Typography variant="caption" color="primary" fontWeight={700} display="block" mb={2}>
                            STORE PROFILE & TENANT ISOLATION
                        </Typography>
                        <Grid container spacing={2.5} mb={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Store Business Name"
                                    required
                                    fullWidth
                                    value={onboardForm.storeName}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        setOnboardForm({
                                            ...onboardForm,
                                            storeName: name,
                                            slug: autoGenerateSlug(name),
                                        });
                                    }}
                                    placeholder="e.g. Apex Hypermarket"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Unique URL Slug"
                                    required
                                    fullWidth
                                    value={onboardForm.slug}
                                    onChange={(e) => setOnboardForm({ ...onboardForm, slug: e.target.value })}
                                    helperText="app.expensemanager.com/{slug}"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Operating Currency"
                                    select
                                    fullWidth
                                    value={onboardForm.currencyCode}
                                    onChange={(e) => setOnboardForm({ ...onboardForm, currencyCode: e.target.value })}
                                >
                                    {CURRENCIES.map((c) => (
                                        <MenuItem key={c} value={c}>
                                            {c}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Plan Tier"
                                    select
                                    fullWidth
                                    value={onboardForm.planTier}
                                    onChange={(e) => setOnboardForm({ ...onboardForm, planTier: e.target.value })}
                                >
                                    <MenuItem value="STARTER">Starter Tier</MenuItem>
                                    <MenuItem value="PROFESSIONAL">Professional Tier</MenuItem>
                                    <MenuItem value="ENTERPRISE">Enterprise Tier</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Initial Trial (Days)"
                                    type="number"
                                    fullWidth
                                    value={onboardForm.trialDays}
                                    onChange={(e) => setOnboardForm({ ...onboardForm, trialDays: Number(e.target.value) })}
                                />
                            </Grid>
                        </Grid>

                        <Typography variant="caption" color="primary" fontWeight={700} display="block" mb={2}>
                            OWNER ACCOUNT & CREDENTIALS
                        </Typography>
                        <Grid container spacing={2.5}>
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
                                    label="Contact Phone"
                                    fullWidth
                                    value={onboardForm.contactPhone}
                                    onChange={(e) => setOnboardForm({ ...onboardForm, contactPhone: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Owner Login Email"
                                    type="email"
                                    required
                                    fullWidth
                                    value={onboardForm.ownerEmail}
                                    onChange={(e) => setOnboardForm({ ...onboardForm, ownerEmail: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Temporary Owner Password"
                                    type="password"
                                    required
                                    fullWidth
                                    value={onboardForm.ownerPassword}
                                    onChange={(e) => setOnboardForm({ ...onboardForm, ownerPassword: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setOnboardModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">
                            Provision Store Instance
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Renew / Update Subscription Modal */}
            <Dialog open={extendModalOpen} onClose={() => setExtendModalOpen(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleExtendSubmit}>
                    <DialogTitle fontWeight={700}>Renew & Update Subscription</DialogTitle>
                    <DialogContent dividers>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Updating store subscription for <strong>{selectedTenant?.storeName}</strong> ({selectedTenant?.slug})
                        </Typography>
                        <Grid container spacing={2.5}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Subscription Tier"
                                    select
                                    fullWidth
                                    value={extendForm.planTier}
                                    onChange={(e) => setExtendForm({ ...extendForm, planTier: e.target.value })}
                                >
                                    <MenuItem value="STARTER">Starter Tier</MenuItem>
                                    <MenuItem value="PROFESSIONAL">Professional Tier</MenuItem>
                                    <MenuItem value="ENTERPRISE">Enterprise Tier</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Extend Subscription By (Days)"
                                    type="number"
                                    fullWidth
                                    value={extendForm.extendDays}
                                    onChange={(e) => setExtendForm({ ...extendForm, extendDays: Number(e.target.value) })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setExtendModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">
                            Confirm Extension
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default AdminStores;
