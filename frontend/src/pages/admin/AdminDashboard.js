import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, Card, CardContent, Button, Alert, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
    Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    FormControl, InputLabel, Select, InputAdornment, Avatar, Stack
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
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
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import {
    getPlatformMetrics,
    getAllAdminUsers,
    updateAdminUserAccess,
    createAdminUser,
    deleteAdminUser,
    getTenants
} from '../../api/adminApi';
import { useNavigate } from 'react-router-dom';

const ROLE_CONFIG = {
    ROLE_SUPER_ADMIN: {
        label: 'Super Admin',
        color: '#673ab7',
        bg: '#ede7f6',
        icon: <SecurityIcon fontSize="small" sx={{ color: '#673ab7' }} />
    },
    ROLE_STORE_ADMIN: {
        label: 'Store Admin / Owner',
        color: '#1976d2',
        bg: '#e3f2fd',
        icon: <AdminPanelSettingsIcon fontSize="small" sx={{ color: '#1976d2' }} />
    },
    ROLE_CASHIER: {
        label: 'Store Cashier',
        color: '#2e7d32',
        bg: '#e8f5e9',
        icon: <PeopleIcon fontSize="small" sx={{ color: '#2e7d32' }} />
    },
    ROLE_INVENTORY_MANAGER: {
        label: 'Inventory Manager',
        color: '#ed6c02',
        bg: '#fff3e0',
        icon: <StoreIcon fontSize="small" sx={{ color: '#ed6c02' }} />
    }
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState(null);
    const [users, setUsers] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [accessModalOpen, setAccessModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form states
    const [userForm, setUserForm] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'ROLE_STORE_ADMIN',
        tenantId: ''
    });

    const [accessForm, setAccessForm] = useState({
        role: '',
        status: 'ACTIVE',
        tenantId: '',
        fullName: ''
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
                getPlatformMetrics().catch(() => ({ data: null })),
                getAllAdminUsers().catch(() => ({ data: [] })),
                getTenants({ size: 100 }).catch(() => ({ data: { content: [] } }))
            ]);

            setMetrics(metricsRes.data);
            setUsers(usersRes.data || []);
            setTenants(tenantsRes.data?.content || tenantsRes.data || []);
        } catch (err) {
            showAlert('Failed to load super admin dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const refreshUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await getAllAdminUsers({
                query: search || undefined,
                role: roleFilter !== 'ALL' ? roleFilter : undefined,
                status: statusFilter !== 'ALL' ? statusFilter : undefined
            });
            setUsers(res.data || []);
        } catch (err) {
            showAlert('Failed to refresh user list', 'error');
        } finally {
            setLoadingUsers(false);
        }
    };

    // Quick Toggle User Status (ACTIVE <-> INACTIVE)
    const handleToggleUserStatus = async (user) => {
        const newStatus = (user.userStatus === 'ACTIVE' || user.status === 'ACTIVE') ? 'INACTIVE' : 'ACTIVE';
        try {
            await updateAdminUserAccess(user.id, { status: newStatus });
            showAlert(`User "${user.fullName}" is now ${newStatus}`);
            refreshUsers();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to update user status', 'error');
        }
    };

    // Open Edit Access Modal
    const handleOpenAccessModal = (user) => {
        setSelectedUser(user);
        setAccessForm({
            fullName: user.fullName || '',
            role: user.role || 'ROLE_STORE_ADMIN',
            status: user.userStatus || user.status || 'ACTIVE',
            tenantId: user.tenantId || ''
        });
        setAccessModalOpen(true);
    };

    const handleSaveAccess = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        setSaving(true);
        try {
            await updateAdminUserAccess(selectedUser.id, {
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

    // Reset Password
    const handleOpenPasswordModal = (user) => {
        setSelectedUser(user);
        setNewPasswordInput('');
        setPasswordModalOpen(true);
    };

    const handleSavePassword = async (e) => {
        e.preventDefault();
        if (!selectedUser || !newPasswordInput || newPasswordInput.length < 6) {
            showAlert('Password must be at least 6 characters', 'error');
            return;
        }
        setSaving(true);
        try {
            await updateAdminUserAccess(selectedUser.id, { password: newPasswordInput });
            showAlert(`Password reset successfully for ${selectedUser.fullName}!`);
            setPasswordModalOpen(false);
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to reset password', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Create New Platform User
    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!userForm.fullName || !userForm.email || !userForm.password) {
            showAlert('Please complete all required fields', 'error');
            return;
        }
        if (userForm.role !== 'ROLE_SUPER_ADMIN' && !userForm.tenantId) {
            showAlert('Please select an assigned store for this user role', 'error');
            return;
        }
        setSaving(true);
        try {
            await createAdminUser({
                fullName: userForm.fullName,
                email: userForm.email,
                password: userForm.password,
                role: userForm.role,
                tenantId: userForm.role === 'ROLE_SUPER_ADMIN' ? null : userForm.tenantId
            });
            showAlert(`User account "${userForm.fullName}" created successfully!`);
            setCreateModalOpen(false);
            setUserForm({ fullName: '', email: '', password: '', role: 'ROLE_STORE_ADMIN', tenantId: '' });
            refreshUsers();
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
            await deleteAdminUser(selectedUser.id);
            showAlert(`User "${selectedUser.fullName}" removed.`);
            setDeleteModalOpen(false);
            refreshUsers();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to delete user', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Filtered users calculation
    const filteredUsers = users.filter((u) => {
        const matchesSearch = !search ||
            u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase()) ||
            u.tenant?.storeName?.toLowerCase().includes(search.toLowerCase());

        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
        const currentStatus = u.userStatus || u.status || 'ACTIVE';
        const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    const superAdminCount = users.filter(u => u.role === 'ROLE_SUPER_ADMIN').length;
    const storeAdminCount = users.filter(u => u.role === 'ROLE_STORE_ADMIN').length;
    const cashierCount = users.filter(u => u.role === 'ROLE_CASHIER').length;
    const inventoryCount = users.filter(u => u.role === 'ROLE_INVENTORY_MANAGER').length;
    const activeUsersCount = users.filter(u => (u.userStatus === 'ACTIVE' || u.status === 'ACTIVE')).length;

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
                            Super Admin Platform Control
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Manage store tenants, user accounts, and grant role-based platform access
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
                        Add Platform User
                    </Button>
                </Box>
            </Box>

            {alert.show && (
                <Alert severity={alert.severity} sx={{ mb: 3 }} onClose={() => setAlert({ show: false, message: '', severity: 'success' })}>
                    {alert.message}
                </Alert>
            )}

            {/* Top Metrics Row */}
            <Grid container spacing={2.5} mb={3.5}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="overline" color="textSecondary">Store Tenants</Typography>
                                <StorefrontIcon color="primary" />
                            </Box>
                            <Typography variant="h4" fontWeight="bold">
                                {metrics?.totalTenants || tenants.length || 0}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {(metrics?.activeTenants || 0) + (metrics?.trialTenants || 0)} active & trial stores
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#f3e5f5' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="overline" color="textSecondary">Total Platform Users</Typography>
                                <PeopleIcon sx={{ color: '#7b1fa2' }} />
                            </Box>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: '#7b1fa2' }}>
                                {users.length}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {activeUsersCount} active accounts across platform
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#e8f5e9' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="overline" color="textSecondary">Store Owners & Cashiers</Typography>
                                <CheckCircleIcon color="success" />
                            </Box>
                            <Typography variant="h4" fontWeight="bold" color="success.main">
                                {storeAdminCount + cashierCount}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {storeAdminCount} store owners · {cashierCount} cashiers
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#e3f2fd' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="overline" color="textSecondary">Platform Sales Volume (30D)</Typography>
                                <AttachMoneyIcon color="primary" />
                            </Box>
                            <Typography variant="h4" fontWeight="bold" color="primary.main">
                                Rs. {Number(metrics?.totalSalesVolume30Days || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Aggregated multi-tenant GMV
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Role Breakdown Badges */}
            <Box display="flex" gap={1.5} mb={3} flexWrap="wrap" alignItems="center">
                <Typography variant="subtitle2" color="textSecondary" sx={{ mr: 1 }}>
                    Role Distribution:
                </Typography>
                <Chip
                    icon={<SecurityIcon fontSize="small" />}
                    label={`Super Admins (${superAdminCount})`}
                    sx={{ bgcolor: '#ede7f6', color: '#673ab7', fontWeight: 600 }}
                    size="small"
                />
                <Chip
                    icon={<AdminPanelSettingsIcon fontSize="small" />}
                    label={`Store Owners (${storeAdminCount})`}
                    sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 600 }}
                    size="small"
                />
                <Chip
                    icon={<PeopleIcon fontSize="small" />}
                    label={`Cashiers (${cashierCount})`}
                    sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600 }}
                    size="small"
                />
                <Chip
                    icon={<StoreIcon fontSize="small" />}
                    label={`Inventory Managers (${inventoryCount})`}
                    sx={{ bgcolor: '#fff3e0', color: '#ed6c02', fontWeight: 600 }}
                    size="small"
                />
            </Box>

            {/* Main Interactive User & Role Access Panel */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5} flexWrap="wrap" gap={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <PeopleIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                            User Accounts & Role-Based Access Control
                        </Typography>
                        <Chip label={`${filteredUsers.length} Users`} size="small" variant="outlined" />
                    </Box>
                    <Button
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={refreshUsers}
                        disabled={loadingUsers}
                    >
                        Refresh
                    </Button>
                </Box>

                {/* Search & Filters */}
                <Grid container spacing={2} mb={3}>
                    <Grid item xs={12} md={5}>
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
                    <Grid item xs={6} md={3.5}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Filter by Role</InputLabel>
                            <Select
                                value={roleFilter}
                                label="Filter by Role"
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <MenuItem value="ALL">All Platform Roles</MenuItem>
                                <MenuItem value="ROLE_SUPER_ADMIN">Super Admins</MenuItem>
                                <MenuItem value="ROLE_STORE_ADMIN">Store Admins</MenuItem>
                                <MenuItem value="ROLE_CASHIER">Cashiers</MenuItem>
                                <MenuItem value="ROLE_INVENTORY_MANAGER">Inventory Managers</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} md={3.5}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Filter by Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Filter by Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="ALL">All Account Statuses</MenuItem>
                                <MenuItem value="ACTIVE">Active Accounts</MenuItem>
                                <MenuItem value="INACTIVE">Suspended / Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {/* Users Table */}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>User Name & Account</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Assigned Platform Role</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Assigned Store Tenant</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Access Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Created Date</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Access Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loadingUsers ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={30} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography color="textSecondary">
                                            No user accounts match the current filters.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((u) => {
                                    const roleConf = ROLE_CONFIG[u.role] || {
                                        label: u.role,
                                        color: '#555',
                                        bg: '#eee',
                                        icon: <PeopleIcon fontSize="small" />
                                    };
                                    const isActive = (u.userStatus === 'ACTIVE' || u.status === 'ACTIVE');

                                    return (
                                        <TableRow key={u.id} hover>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: roleConf.color,
                                                            width: 38,
                                                            height: 38,
                                                            fontSize: 15,
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {u.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {u.fullName}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {u.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={roleConf.icon}
                                                    label={roleConf.label}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: roleConf.bg,
                                                        color: roleConf.color,
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        border: `1px solid ${roleConf.color}30`
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {u.tenant ? (
                                                    <Box display="flex" alignItems="center" gap={0.5}>
                                                        <StorefrontIcon fontSize="small" color="action" />
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {u.tenant.storeName}
                                                        </Typography>
                                                    </Box>
                                                ) : u.role === 'ROLE_SUPER_ADMIN' ? (
                                                    <Chip
                                                        label="Global Platform Core"
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ color: '#673ab7', borderColor: '#673ab7' }}
                                                    />
                                                ) : (
                                                    <Typography variant="caption" color="error">
                                                        Unassigned
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={isActive ? 'Active' : 'Suspended'}
                                                    color={isActive ? 'success' : 'error'}
                                                    size="small"
                                                    variant="filled"
                                                    sx={{ fontWeight: 'bold' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="textSecondary">
                                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <Tooltip title={isActive ? "Suspend Access" : "Grant / Restore Access"}>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color={isActive ? "warning" : "success"}
                                                            onClick={() => handleToggleUserStatus(u)}
                                                            sx={{ minWidth: 80, textTransform: 'none' }}
                                                        >
                                                            {isActive ? "Suspend" : "Activate"}
                                                        </Button>
                                                    </Tooltip>
                                                    <Tooltip title="Configure Role & Assigned Store">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleOpenAccessModal(u)}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Reset Password">
                                                        <IconButton
                                                            size="small"
                                                            color="info"
                                                            onClick={() => handleOpenPasswordModal(u)}
                                                        >
                                                            <LockResetIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {u.role !== 'ROLE_SUPER_ADMIN' && (
                                                        <Tooltip title="Delete Account">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => {
                                                                    setSelectedUser(u);
                                                                    setDeleteModalOpen(true);
                                                                }}
                                                            >
                                                                <DeleteOutlineIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Modal: Edit User Access & Role */}
            <Dialog open={accessModalOpen} onClose={() => !saving && setAccessModalOpen(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleSaveAccess}>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SecurityIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                            Manage User Role & Store Access
                        </Typography>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Box display="flex" flexDirection="column" gap={2.5} pt={1}>
                            <TextField
                                label="Full Name"
                                fullWidth
                                required
                                value={accessForm.fullName}
                                onChange={(e) => setAccessForm({ ...accessForm, fullName: e.target.value })}
                            />

                            <FormControl fullWidth required>
                                <InputLabel>Assigned Role</InputLabel>
                                <Select
                                    value={accessForm.role}
                                    label="Assigned Role"
                                    onChange={(e) => setAccessForm({ ...accessForm, role: e.target.value })}
                                >
                                    <MenuItem value="ROLE_SUPER_ADMIN">Platform Super Admin</MenuItem>
                                    <MenuItem value="ROLE_STORE_ADMIN">Store Admin / Owner</MenuItem>
                                    <MenuItem value="ROLE_CASHIER">Store Cashier</MenuItem>
                                    <MenuItem value="ROLE_INVENTORY_MANAGER">Inventory Manager</MenuItem>
                                </Select>
                            </FormControl>

                            {accessForm.role !== 'ROLE_SUPER_ADMIN' && (
                                <FormControl fullWidth required>
                                    <InputLabel>Assigned Store Tenant</InputLabel>
                                    <Select
                                        value={accessForm.tenantId}
                                        label="Assigned Store Tenant"
                                        onChange={(e) => setAccessForm({ ...accessForm, tenantId: e.target.value })}
                                    >
                                        {tenants.map((t) => (
                                            <MenuItem key={t.id} value={t.id}>
                                                {t.storeName} ({t.slug}) - {t.planTier || 'PRO'}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            <FormControl fullWidth>
                                <InputLabel>Account Status</InputLabel>
                                <Select
                                    value={accessForm.status}
                                    label="Account Status"
                                    onChange={(e) => setAccessForm({ ...accessForm, status: e.target.value })}
                                >
                                    <MenuItem value="ACTIVE">ACTIVE (Access Granted)</MenuItem>
                                    <MenuItem value="INACTIVE">INACTIVE (Access Blocked)</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setAccessModalOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" disabled={saving}>
                            {saving ? 'Saving Changes...' : 'Save Access Configuration'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Modal: Create Platform User */}
            <Dialog open={createModalOpen} onClose={() => !saving && setCreateModalOpen(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleCreateUser}>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonAddIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                            Create New Platform User
                        </Typography>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Box display="flex" flexDirection="column" gap={2.5} pt={1}>
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
                                label="Password (Min 6 chars)"
                                type="password"
                                fullWidth
                                required
                                value={userForm.password}
                                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            />
                            <FormControl fullWidth required>
                                <InputLabel>Assign Role</InputLabel>
                                <Select
                                    value={userForm.role}
                                    label="Assign Role"
                                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                >
                                    <MenuItem value="ROLE_STORE_ADMIN">Store Admin / Owner</MenuItem>
                                    <MenuItem value="ROLE_CASHIER">Store Cashier</MenuItem>
                                    <MenuItem value="ROLE_INVENTORY_MANAGER">Inventory Manager</MenuItem>
                                    <MenuItem value="ROLE_SUPER_ADMIN">Platform Super Admin</MenuItem>
                                </Select>
                            </FormControl>

                            {userForm.role !== 'ROLE_SUPER_ADMIN' && (
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
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setCreateModalOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" disabled={saving}>
                            {saving ? 'Creating User...' : 'Create Account'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Modal: Reset Password */}
            <Dialog open={passwordModalOpen} onClose={() => !saving && setPasswordModalOpen(false)} maxWidth="xs" fullWidth>
                <form onSubmit={handleSavePassword}>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <VpnKeyIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                            Reset User Password
                        </Typography>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Typography variant="body2" color="textSecondary" mb={2}>
                            Set a new password for account <strong>{selectedUser?.fullName}</strong> ({selectedUser?.email}).
                        </Typography>
                        <TextField
                            label="New Password (Min 6 chars)"
                            type="password"
                            fullWidth
                            required
                            value={newPasswordInput}
                            onChange={(e) => setNewPasswordInput(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setPasswordModalOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" disabled={saving}>
                            {saving ? 'Updating...' : 'Set Password'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Modal: Delete User Confirmation */}
            <Dialog open={deleteModalOpen} onClose={() => !saving && setDeleteModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Revoke Account & Access</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete user account <strong>{selectedUser?.fullName}</strong> ({selectedUser?.email})?
                        They will permanently lose access to the platform.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDeleteModalOpen(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={saving}>
                        {saving ? 'Deleting...' : 'Delete User'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminDashboard;