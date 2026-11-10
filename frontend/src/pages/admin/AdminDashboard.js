import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Grid, Paper, Card, CardContent, Button, Alert, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
    Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    FormControl, InputLabel, Select, InputAdornment, Avatar, Stack, Menu,
    ListItemIcon, ListItemText, Switch, RadioGroup, Radio, FormControlLabel,
    FormLabel, Divider, TablePagination
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SecurityIcon from '@mui/icons-material/Security';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import StoreIcon from '@mui/icons-material/Store';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LockResetIcon from '@mui/icons-material/LockReset';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockIcon from '@mui/icons-material/Block';
import BusinessIcon from '@mui/icons-material/Business';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import {
    fetchPlatformMetrics,
    fetchUsers,
    createUser,
    updateUserAccess,
    resetUserPassword,
    deleteUser,
    getTenants
} from '../../api/adminApi';

const ROLE_CONFIG = {
    ROLE_SUPER_ADMIN: {
        label: 'Super Admin',
        color: '#673ab7',
        bg: '#ede7f6',
        chipColor: 'primary',
        icon: <SecurityIcon fontSize="small" sx={{ color: '#673ab7' }} />
    },
    ROLE_STORE_ADMIN: {
        label: 'Store Admin',
        color: '#1976d2',
        bg: '#e3f2fd',
        chipColor: 'secondary',
        icon: <AdminPanelSettingsIcon fontSize="small" sx={{ color: '#1976d2' }} />
    },
    ROLE_INVENTORY_MANAGER: {
        label: 'Inventory Manager',
        color: '#ed6c02',
        bg: '#fff3e0',
        chipColor: 'warning',
        icon: <StoreIcon fontSize="small" sx={{ color: '#ed6c02' }} />
    },
    ROLE_CASHIER: {
        label: 'Cashier',
        color: '#2e7d32',
        bg: '#e8f5e9',
        chipColor: 'success',
        icon: <PeopleIcon fontSize="small" sx={{ color: '#2e7d32' }} />
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
        return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
        return dateString;
    }
};

const AdminDashboard = () => {
    const navigate = useNavigate();

    // Data States
    const [metrics, setMetrics] = useState(null);
    const [users, setUsers] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

    // Filter States
    const [search, setSearch] = useState('');
    const [storeFilter, setStoreFilter] = useState('ALL');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Context Action Menu
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuUser, setMenuUser] = useState(null);

    // Modal States
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [accessModalOpen, setAccessModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form States
    const [userForm, setUserForm] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'ROLE_STORE_ADMIN',
        tenantId: ''
    });

    const [accessForm, setAccessForm] = useState({
        fullName: '',
        role: 'ROLE_STORE_ADMIN',
        status: 'ACTIVE',
        tenantId: ''
    });

    const [newPasswordInput, setNewPasswordInput] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const showAlert = (message, severity = 'success') => {
        setAlert({ show: true, message, severity });
        setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 4500);
    };

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [metricsRes, usersRes, tenantsRes] = await Promise.all([
                fetchPlatformMetrics().catch(() => ({ data: null })),
                fetchUsers().catch(() => ({ data: [] })),
                getTenants({ size: 100 }).catch(() => ({ data: { content: [] } }))
            ]);

            setMetrics(metricsRes.data);
            setUsers(usersRes.data || []);
            setTenants(tenantsRes.data?.content || tenantsRes.data || []);
        } catch (err) {
            showAlert('Failed to load governance dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const refreshUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await fetchUsers({
                search: search || undefined,
                role: roleFilter !== 'ALL' ? roleFilter : undefined,
                tenantId: storeFilter !== 'ALL' ? storeFilter : undefined,
                status: statusFilter !== 'ALL' ? statusFilter : undefined
            });
            setUsers(res.data || []);
        } catch (err) {
            showAlert('Failed to refresh user list', 'error');
        } finally {
            setLoadingUsers(false);
        }
    };

    // Quick Toggle User Status (ACTIVE <-> SUSPENDED)
    const handleToggleUserStatus = async (user) => {
        const isCurrentlyActive = user.status === 'ACTIVE' && user.userStatus !== 'INACTIVE';
        const newStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE';
        try {
            await updateUserAccess(user.id, { status: newStatus });
            showAlert(`User "${user.fullName}" is now ${newStatus}`);
            // Optimistic update
            setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, status: newStatus, userStatus: newStatus === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE' } : u)));
            refreshUsers();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to update user status', 'error');
        }
    };

    // Action Menu Handlers
    const handleOpenMenu = (event, user) => {
        setMenuAnchor(event.currentTarget);
        setMenuUser(user);
    };

    const handleCloseMenu = () => {
        setMenuAnchor(null);
        setMenuUser(null);
    };

    const handleMenuAction = (action) => {
        const targetUser = menuUser;
        handleCloseMenu();
        if (!targetUser) return;

        if (action === 'edit') {
            handleOpenAccessModal(targetUser);
        } else if (action === 'toggle') {
            handleToggleUserStatus(targetUser);
        } else if (action === 'password') {
            handleOpenPasswordModal(targetUser);
        } else if (action === 'delete') {
            setSelectedUser(targetUser);
            setDeleteModalOpen(true);
        }
    };

    // Open Edit Access Modal
    const handleOpenAccessModal = (user) => {
        setSelectedUser(user);
        setAccessForm({
            fullName: user.fullName || '',
            role: user.role || 'ROLE_STORE_ADMIN',
            status: user.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
            tenantId: user.tenantId || ''
        });
        setAccessModalOpen(true);
    };

    const handleSaveAccess = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        setSaving(true);
        try {
            await updateUserAccess(selectedUser.id, {
                fullName: accessForm.fullName,
                role: accessForm.role,
                status: accessForm.status,
                tenantId: accessForm.role === 'ROLE_SUPER_ADMIN' ? null : (accessForm.tenantId || null)
            });
            showAlert(`Access permissions updated for ${selectedUser.fullName}!`);
            setAccessModalOpen(false);
            refreshUsers();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to update access permissions', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Reset Password Modal Handlers
    const handleOpenPasswordModal = (user) => {
        setSelectedUser(user);
        setNewPasswordInput('');
        setPasswordModalOpen(true);
    };

    const handleSavePassword = async (e) => {
        e.preventDefault();
        if (!selectedUser || !newPasswordInput || newPasswordInput.trim().length < 6) {
            showAlert('Password must be at least 6 characters long', 'error');
            return;
        }
        setSaving(true);
        try {
            await resetUserPassword(selectedUser.id, newPasswordInput.trim());
            showAlert(`Password reset successfully for ${selectedUser.fullName}!`);
            setPasswordModalOpen(false);
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to reset password', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Create New Platform User Handlers
    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!userForm.fullName || !userForm.email || !userForm.password) {
            showAlert('Please complete all required fields', 'error');
            return;
        }
        if (userForm.password.length < 6) {
            showAlert('Password must be at least 6 characters', 'error');
            return;
        }
        if (userForm.role !== 'ROLE_SUPER_ADMIN' && !userForm.tenantId) {
            showAlert('Please select an assigned store for this user role', 'error');
            return;
        }
        setSaving(true);
        try {
            await createUser({
                fullName: userForm.fullName.trim(),
                email: userForm.email.trim(),
                password: userForm.password,
                role: userForm.role,
                tenantId: userForm.role === 'ROLE_SUPER_ADMIN' ? null : userForm.tenantId
            });
            showAlert(`User account "${userForm.fullName}" provisioned successfully!`);
            setCreateModalOpen(false);
            setUserForm({ fullName: '', email: '', password: '', role: 'ROLE_STORE_ADMIN', tenantId: '' });
            refreshUsers();
            loadDashboardData();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to create user account', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Delete User
    const handleConfirmDelete = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            await deleteUser(selectedUser.id);
            showAlert(`User account "${selectedUser.fullName}" removed.`);
            setDeleteModalOpen(false);
            refreshUsers();
            loadDashboardData();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to delete user', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Client-side filtering fallback for instant search responsiveness
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchesSearch = !search ||
                u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
                u.email?.toLowerCase().includes(search.toLowerCase()) ||
                (u.tenantName || u.tenant?.storeName)?.toLowerCase().includes(search.toLowerCase());

            const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

            let matchesStore = true;
            if (storeFilter !== 'ALL') {
                if (storeFilter === 'PLATFORM') {
                    matchesStore = !u.tenantId;
                } else {
                    matchesStore = u.tenantId === storeFilter;
                }
            }

            const isSuspended = u.status === 'SUSPENDED' || u.userStatus === 'INACTIVE';
            const currentStatus = isSuspended ? 'SUSPENDED' : 'ACTIVE';
            const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter;

            return matchesSearch && matchesRole && matchesStore && matchesStatus;
        });
    }, [users, search, roleFilter, storeFilter, statusFilter]);

    // Paginated records
    const paginatedUsers = useMemo(() => {
        return filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredUsers, page, rowsPerPage]);

    const activeUsersCount = users.filter(u => u.status === 'ACTIVE' && u.userStatus !== 'INACTIVE').length;
    const superAdminCount = metrics?.usersByRole?.superAdmin ?? users.filter(u => u.role === 'ROLE_SUPER_ADMIN').length;
    const storeAdminCount = metrics?.usersByRole?.storeAdmin ?? users.filter(u => u.role === 'ROLE_STORE_ADMIN').length;
    const inventoryCount = metrics?.usersByRole?.inventoryManager ?? users.filter(u => u.role === 'ROLE_INVENTORY_MANAGER').length;
    const cashierCount = metrics?.usersByRole?.cashier ?? users.filter(u => u.role === 'ROLE_CASHIER').length;

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <SecurityIcon color="primary" sx={{ fontSize: 38 }} />
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            Platform & Access Governance
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Manage store tenant lifecycles, user accounts, and platform-wide role delegations
                        </Typography>
                    </Box>
                </Box>
                <Box display="flex" gap={1.5}>
                    <Button
                        variant="outlined"
                        startIcon={<StorefrontIcon />}
                        onClick={() => navigate('/admin/stores')}
                    >
                        Store Tenants
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PersonAddIcon />}
                        onClick={() => setCreateModalOpen(true)}
                    >
                        Add User
                    </Button>
                </Box>
            </Box>

            {alert.show && (
                <Alert severity={alert.severity} sx={{ mb: 3 }} onClose={() => setAlert({ show: false, message: '', severity: 'success' })}>
                    {alert.message}
                </Alert>
            )}

            {/* Top Governance KPI Cards */}
            <Grid container spacing={2.5} mb={3.5}>
                {/* 1. Total Stores */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', borderLeft: '4px solid #1976d2' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="overline" color="textSecondary" fontWeight="bold">
                                    Total Stores
                                </Typography>
                                <StorefrontIcon color="primary" />
                            </Box>
                            <Typography variant="h4" fontWeight="bold">
                                {metrics?.totalTenants ?? tenants.length ?? 0}
                            </Typography>
                            <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                                <Chip
                                    size="small"
                                    label={`${metrics?.activeTenants ?? 0} Active`}
                                    sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, fontSize: '0.7rem' }}
                                />
                                <Chip
                                    size="small"
                                    label={`${metrics?.trialTenants ?? 0} Trial`}
                                    sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 600, fontSize: '0.7rem' }}
                                />
                                {metrics?.suspendedTenants > 0 && (
                                    <Chip
                                        size="small"
                                        label={`${metrics.suspendedTenants} Suspended`}
                                        sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 600, fontSize: '0.7rem' }}
                                    />
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 2. Total Platform Users */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', borderLeft: '4px solid #7b1fa2' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="overline" color="textSecondary" fontWeight="bold">
                                    Platform Users
                                </Typography>
                                <PeopleIcon sx={{ color: '#7b1fa2' }} />
                            </Box>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: '#7b1fa2' }}>
                                {metrics?.totalUsers ?? users.length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" mt={1}>
                                <strong>{activeUsersCount}</strong> active user accounts across all tenants
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 3. Role Distribution */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', borderLeft: '4px solid #ed6c02' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="overline" color="textSecondary" fontWeight="bold">
                                    Role Distribution
                                </Typography>
                                <AdminPanelSettingsIcon sx={{ color: '#ed6c02' }} />
                            </Box>
                            <Box display="flex" flexDirection="column" gap={0.7} mt={0.5}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption" color="textSecondary">Store Owners:</Typography>
                                    <Chip label={storeAdminCount} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                                </Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption" color="textSecondary">Cashiers:</Typography>
                                    <Chip label={cashierCount} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                                </Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption" color="textSecondary">Inventory Mgrs:</Typography>
                                    <Chip label={inventoryCount} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 4. Subscription Watch */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        variant="outlined"
                        sx={{
                            borderRadius: 2,
                            height: '100%',
                            borderLeft: `4px solid ${(metrics?.expiringSubscriptionsCount > 0 ? '#d32f2f' : '#2e7d32')}`
                        }}
                    >
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="overline" color="textSecondary" fontWeight="bold">
                                    Subscription Watch
                                </Typography>
                                {metrics?.expiringSubscriptionsCount > 0 ? (
                                    <WarningAmberIcon color="error" />
                                ) : (
                                    <CheckCircleOutlineIcon color="success" />
                                )}
                            </Box>
                            <Typography
                                variant="h4"
                                fontWeight="bold"
                                color={metrics?.expiringSubscriptionsCount > 0 ? 'error.main' : 'success.main'}
                            >
                                {metrics?.expiringSubscriptionsCount ?? 0}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" mt={1}>
                                {metrics?.expiringSubscriptionsCount > 0
                                    ? 'Stores expiring in ≤ 7 days (review needed)'
                                    : 'All store subscriptions in good standing'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Role Breakdown Pill Filter Bar */}
            <Box display="flex" gap={1.2} mb={3} flexWrap="wrap" alignItems="center">
                <Typography variant="subtitle2" color="textSecondary" sx={{ mr: 0.5 }}>
                    Quick Role Filter:
                </Typography>
                <Chip
                    label={`All Roles (${users.length})`}
                    onClick={() => setRoleFilter('ALL')}
                    color={roleFilter === 'ALL' ? 'primary' : 'default'}
                    variant={roleFilter === 'ALL' ? 'filled' : 'outlined'}
                    size="small"
                />
                <Chip
                    icon={<SecurityIcon fontSize="small" />}
                    label={`Super Admins (${superAdminCount})`}
                    onClick={() => setRoleFilter('ROLE_SUPER_ADMIN')}
                    color={roleFilter === 'ROLE_SUPER_ADMIN' ? 'primary' : 'default'}
                    variant={roleFilter === 'ROLE_SUPER_ADMIN' ? 'filled' : 'outlined'}
                    size="small"
                />
                <Chip
                    icon={<AdminPanelSettingsIcon fontSize="small" />}
                    label={`Store Owners (${storeAdminCount})`}
                    onClick={() => setRoleFilter('ROLE_STORE_ADMIN')}
                    color={roleFilter === 'ROLE_STORE_ADMIN' ? 'primary' : 'default'}
                    variant={roleFilter === 'ROLE_STORE_ADMIN' ? 'filled' : 'outlined'}
                    size="small"
                />
                <Chip
                    icon={<StoreIcon fontSize="small" />}
                    label={`Inventory Mgrs (${inventoryCount})`}
                    onClick={() => setRoleFilter('ROLE_INVENTORY_MANAGER')}
                    color={roleFilter === 'ROLE_INVENTORY_MANAGER' ? 'primary' : 'default'}
                    variant={roleFilter === 'ROLE_INVENTORY_MANAGER' ? 'filled' : 'outlined'}
                    size="small"
                />
                <Chip
                    icon={<PeopleIcon fontSize="small" />}
                    label={`Cashiers (${cashierCount})`}
                    onClick={() => setRoleFilter('ROLE_CASHIER')}
                    color={roleFilter === 'ROLE_CASHIER' ? 'primary' : 'default'}
                    variant={roleFilter === 'ROLE_CASHIER' ? 'filled' : 'outlined'}
                    size="small"
                />
            </Box>

            {/* Platform User Access Management Card */}
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box p={2.5} bgcolor="#fafafa" borderBottom="1px solid #e0e0e0">
                    <Grid container spacing={2} alignItems="center">
                        {/* Search Input */}
                        <Grid item xs={12} sm={4} md={4}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by name, email, or store..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" color="action" />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>

                        {/* Store Tenant Filter */}
                        <Grid item xs={12} sm={3} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Assigned Store</InputLabel>
                                <Select
                                    value={storeFilter}
                                    label="Assigned Store"
                                    onChange={(e) => setStoreFilter(e.target.value)}
                                >
                                    <MenuItem value="ALL">All Stores & Platform</MenuItem>
                                    <MenuItem value="PLATFORM">Global / Platform (Super Admin)</MenuItem>
                                    <Divider />
                                    {tenants.map((t) => (
                                        <MenuItem key={t.id} value={t.id}>
                                            {t.storeName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Role Filter */}
                        <Grid item xs={6} sm={2.5} md={2.5}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={roleFilter}
                                    label="Role"
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <MenuItem value="ALL">All Roles</MenuItem>
                                    <MenuItem value="ROLE_SUPER_ADMIN">Super Admin</MenuItem>
                                    <MenuItem value="ROLE_STORE_ADMIN">Store Admin</MenuItem>
                                    <MenuItem value="ROLE_INVENTORY_MANAGER">Inventory Manager</MenuItem>
                                    <MenuItem value="ROLE_CASHIER">Cashier</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Status Filter */}
                        <Grid item xs={6} sm={2.5} md={2.5}>
                            <Box display="flex" gap={1} alignItems="center">
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={statusFilter}
                                        label="Status"
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <MenuItem value="ALL">All Statuses</MenuItem>
                                        <MenuItem value="ACTIVE">Active</MenuItem>
                                        <MenuItem value="SUSPENDED">Suspended</MenuItem>
                                    </Select>
                                </FormControl>
                                <Tooltip title="Refresh User Directory">
                                    <IconButton onClick={refreshUsers} disabled={loadingUsers}>
                                        <RefreshIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* User Directory Table */}
                <TableContainer>
                    <Table sx={{ minWidth: 750 }}>
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Assigned Store</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Created Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loadingUsers ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : paginatedUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
                                        <Typography color="textSecondary">
                                            No user accounts match the selected filters.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedUsers.map((user) => {
                                    const roleInfo = ROLE_CONFIG[user.role] || {
                                        label: user.role,
                                        color: '#757575',
                                        bg: '#f5f5f5'
                                    };
                                    const storeName = user.tenantName || user.tenant?.storeName;
                                    const isSuspended = user.status === 'SUSPENDED' || user.userStatus === 'INACTIVE';

                                    return (
                                        <TableRow key={user.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            {/* User (Avatar, Name, Email) */}
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: roleInfo.color,
                                                            width: 36,
                                                            height: 36,
                                                            fontSize: '0.95rem',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="600">
                                                            {user.fullName}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {user.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            {/* Assigned Store */}
                                            <TableCell>
                                                {user.role === 'ROLE_SUPER_ADMIN' ? (
                                                    <Chip
                                                        icon={<SecurityIcon fontSize="small" />}
                                                        label="Global / Platform"
                                                        size="small"
                                                        sx={{ bgcolor: '#ede7f6', color: '#673ab7', fontWeight: 600, fontSize: '0.75rem' }}
                                                    />
                                                ) : storeName ? (
                                                    <Chip
                                                        icon={<BusinessIcon fontSize="small" />}
                                                        label={storeName}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                                                    />
                                                ) : (
                                                    <Typography variant="caption" color="textSecondary">
                                                        Unassigned
                                                    </Typography>
                                                )}
                                            </TableCell>

                                            {/* Role */}
                                            <TableCell>
                                                <Chip
                                                    icon={roleInfo.icon}
                                                    label={roleInfo.label}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: roleInfo.bg,
                                                        color: roleInfo.color,
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem'
                                                    }}
                                                />
                                            </TableCell>

                                            {/* Status (Pill & Switch) */}
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Chip
                                                        label={isSuspended ? 'Suspended' : 'Active'}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 700,
                                                            fontSize: '0.72rem',
                                                            bgcolor: isSuspended ? '#ffebee' : '#e8f5e9',
                                                            color: isSuspended ? '#c62828' : '#2e7d32',
                                                            border: `1px solid ${isSuspended ? '#ef9a9a' : '#a5d6a7'}`
                                                        }}
                                                    />
                                                    <Tooltip title={isSuspended ? 'Activate account' : 'Suspend account'}>
                                                        <Switch
                                                            size="small"
                                                            color="success"
                                                            checked={!isSuspended}
                                                            onChange={() => handleToggleUserStatus(user)}
                                                        />
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>

                                            {/* Created Date */}
                                            <TableCell>
                                                <Typography variant="body2" color="textSecondary">
                                                    {formatDate(user.createdAt)}
                                                </Typography>
                                            </TableCell>

                                            {/* Actions Menu */}
                                            <TableCell align="center">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleOpenMenu(e, user)}
                                                >
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Table Pagination */}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredUsers.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
            </Paper>

            {/* Context Action Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleCloseMenu}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={() => handleMenuAction('edit')}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Edit Role / Store Assignment" />
                </MenuItem>
                <MenuItem onClick={() => handleMenuAction('toggle')}>
                    <ListItemIcon>
                        {menuUser?.status === 'SUSPENDED' ? (
                            <CheckCircleOutlineIcon fontSize="small" color="success" />
                        ) : (
                            <BlockIcon fontSize="small" color="warning" />
                        )}
                    </ListItemIcon>
                    <ListItemText primary={menuUser?.status === 'SUSPENDED' ? 'Activate Account' : 'Suspend Account'} />
                </MenuItem>
                <MenuItem onClick={() => handleMenuAction('password')}>
                    <ListItemIcon>
                        <LockResetIcon fontSize="small" color="secondary" />
                    </ListItemIcon>
                    <ListItemText primary="Reset Password" />
                </MenuItem>
                <Divider />
                <MenuItem
                    onClick={() => handleMenuAction('delete')}
                    sx={{ color: 'error.main' }}
                >
                    <ListItemIcon>
                        <DeleteOutlineIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Remove User" />
                </MenuItem>
            </Menu>

            {/* 1. Modal: Provision New User */}
            <Dialog
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <form onSubmit={handleCreateUser}>
                    <DialogTitle>
                        <Box display="flex" alignItems="center" gap={1}>
                            <PersonAddIcon color="primary" />
                            <Typography variant="h6" fontWeight="bold">
                                Provision New Platform User
                            </Typography>
                        </Box>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2.5} mt={0.5}>
                            <TextField
                                label="Full Name"
                                fullWidth
                                required
                                value={userForm.fullName}
                                onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                            />
                            <TextField
                                label="Email Address"
                                type="email"
                                fullWidth
                                required
                                value={userForm.email}
                                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                            />
                            <TextField
                                label="Temporary Password"
                                type="password"
                                fullWidth
                                required
                                helperText="Must be at least 6 characters"
                                value={userForm.password}
                                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            />

                            {/* Role Radio Selection */}
                            <FormControl component="fieldset">
                                <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1, fontSize: '0.9rem' }}>
                                    Assigned Platform Role
                                </FormLabel>
                                <RadioGroup
                                    value={userForm.role}
                                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                >
                                    <FormControlLabel
                                        value="ROLE_STORE_ADMIN"
                                        control={<Radio size="small" />}
                                        label={
                                            <Box>
                                                <Typography variant="body2" fontWeight="600">Store Owner / Admin</Typography>
                                                <Typography variant="caption" color="textSecondary">Full operational store control (POS, inventory, accounts, staff)</Typography>
                                            </Box>
                                        }
                                    />
                                    <FormControlLabel
                                        value="ROLE_CASHIER"
                                        control={<Radio size="small" />}
                                        label={
                                            <Box>
                                                <Typography variant="body2" fontWeight="600">Store Cashier</Typography>
                                                <Typography variant="caption" color="textSecondary">High-speed POS checkout and daily cash drawer reconciliation</Typography>
                                            </Box>
                                        }
                                    />
                                    <FormControlLabel
                                        value="ROLE_INVENTORY_MANAGER"
                                        control={<Radio size="small" />}
                                        label={
                                            <Box>
                                                <Typography variant="body2" fontWeight="600">Inventory Manager</Typography>
                                                <Typography variant="caption" color="textSecondary">Product catalog, barcode labels, and restock shipments</Typography>
                                            </Box>
                                        }
                                    />
                                    <FormControlLabel
                                        value="ROLE_SUPER_ADMIN"
                                        control={<Radio size="small" />}
                                        label={
                                            <Box>
                                                <Typography variant="body2" fontWeight="600">Super Admin (Platform Governance)</Typography>
                                                <Typography variant="caption" color="textSecondary">Global platform control, tenant provisioning, user governance</Typography>
                                            </Box>
                                        }
                                    />
                                </RadioGroup>
                            </FormControl>

                            {/* Store Tenant Select (Disabled for Super Admin) */}
                            {userForm.role === 'ROLE_SUPER_ADMIN' ? (
                                <Alert severity="info" sx={{ py: 0.5 }}>
                                    Super Admins operate across the platform and do not belong to a specific store tenant.
                                </Alert>
                            ) : (
                                <FormControl fullWidth required>
                                    <InputLabel>Assigned Store Tenant</InputLabel>
                                    <Select
                                        value={userForm.tenantId}
                                        label="Assigned Store Tenant"
                                        onChange={(e) => setUserForm({ ...userForm, tenantId: e.target.value })}
                                    >
                                        {tenants.map((t) => (
                                            <MenuItem key={t.id} value={t.id}>
                                                {t.storeName} ({t.slug})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                            startIcon={saving && <CircularProgress size={16} />}
                        >
                            {saving ? 'Provisioning...' : 'Provision User'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* 2. Modal: Edit Role / Store Assignment */}
            <Dialog
                open={accessModalOpen}
                onClose={() => setAccessModalOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <form onSubmit={handleSaveAccess}>
                    <DialogTitle>
                        <Box display="flex" alignItems="center" gap={1}>
                            <EditIcon color="primary" />
                            <Typography variant="h6" fontWeight="bold">
                                Edit User Access & Role
                            </Typography>
                        </Box>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2.5} mt={0.5}>
                            <TextField
                                label="Full Name"
                                fullWidth
                                required
                                value={accessForm.fullName}
                                onChange={(e) => setAccessForm({ ...accessForm, fullName: e.target.value })}
                            />

                            <FormControl fullWidth>
                                <InputLabel>Assigned Role</InputLabel>
                                <Select
                                    value={accessForm.role}
                                    label="Assigned Role"
                                    onChange={(e) => setAccessForm({ ...accessForm, role: e.target.value })}
                                >
                                    <MenuItem value="ROLE_STORE_ADMIN">Store Admin / Owner</MenuItem>
                                    <MenuItem value="ROLE_CASHIER">Store Cashier</MenuItem>
                                    <MenuItem value="ROLE_INVENTORY_MANAGER">Inventory Manager</MenuItem>
                                    <MenuItem value="ROLE_SUPER_ADMIN">Super Admin (Platform Governance)</MenuItem>
                                </Select>
                            </FormControl>

                            {accessForm.role !== 'ROLE_SUPER_ADMIN' ? (
                                <FormControl fullWidth required>
                                    <InputLabel>Assigned Store Tenant</InputLabel>
                                    <Select
                                        value={accessForm.tenantId}
                                        label="Assigned Store Tenant"
                                        onChange={(e) => setAccessForm({ ...accessForm, tenantId: e.target.value })}
                                    >
                                        {tenants.map((t) => (
                                            <MenuItem key={t.id} value={t.id}>
                                                {t.storeName} ({t.slug})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : (
                                <Alert severity="info" sx={{ py: 0.5 }}>
                                    Super Admins have platform-wide access and do not belong to an isolated store tenant.
                                </Alert>
                            )}

                            <FormControl fullWidth>
                                <InputLabel>Account Status</InputLabel>
                                <Select
                                    value={accessForm.status}
                                    label="Account Status"
                                    onChange={(e) => setAccessForm({ ...accessForm, status: e.target.value })}
                                >
                                    <MenuItem value="ACTIVE">Active (Can log in)</MenuItem>
                                    <MenuItem value="SUSPENDED">Suspended (Access blocked)</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setAccessModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                            startIcon={saving && <CircularProgress size={16} />}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* 3. Modal: Reset Password */}
            <Dialog
                open={passwordModalOpen}
                onClose={() => setPasswordModalOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <form onSubmit={handleSavePassword}>
                    <DialogTitle>
                        <Box display="flex" alignItems="center" gap={1}>
                            <LockResetIcon color="secondary" />
                            <Typography variant="h6" fontWeight="bold">
                                Reset User Password
                            </Typography>
                        </Box>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Typography variant="body2" color="textSecondary" mb={2}>
                            Set a new password for <strong>{selectedUser?.fullName}</strong> ({selectedUser?.email}):
                        </Typography>
                        <TextField
                            label="New Password"
                            type="password"
                            fullWidth
                            required
                            autoFocus
                            helperText="Minimum 6 characters"
                            value={newPasswordInput}
                            onChange={(e) => setNewPasswordInput(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setPasswordModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="secondary"
                            disabled={saving}
                            startIcon={saving && <CircularProgress size={16} />}
                        >
                            {saving ? 'Updating...' : 'Set Password'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* 4. Modal: Delete User Confirmation */}
            <Dialog
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ color: 'error.main' }}>
                    Remove User Account
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body1">
                        Are you sure you want to remove user account <strong>{selectedUser?.fullName}</strong> ({selectedUser?.email})?
                    </Typography>
                    <Typography variant="body2" color="textSecondary" mt={1}>
                        This action cannot be undone. The user will immediately lose access to the platform.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDeleteModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmDelete}
                        disabled={saving}
                        startIcon={saving && <CircularProgress size={16} />}
                    >
                        {saving ? 'Removing...' : 'Delete User'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminDashboard;
