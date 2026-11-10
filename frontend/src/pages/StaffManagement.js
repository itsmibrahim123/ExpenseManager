import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Alert, CircularProgress, Grid, Card, CardContent, IconButton,
    Tooltip
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import InventoryIcon from '@mui/icons-material/Inventory';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import { getStaff, createStaff, updateStaffRole, toggleStaffStatus, deleteStaff } from '../api/staffApi';
import { useAuth } from '../context/AuthContext';

const StaffManagement = () => {
    const { user } = useAuth();
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);

    // Form
    const [staffForm, setStaffForm] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'ROLE_CASHIER',
    });

    const [newRole, setNewRole] = useState('ROLE_CASHIER');

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await getStaff();
            setStaffList(res.data || []);
        } catch (err) {
            showAlert('Failed to load store staff members', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message, severity = 'success') => {
        setAlert({ show: true, message, severity });
        setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 4500);
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        try {
            await createStaff(staffForm);
            showAlert(`Staff member '${staffForm.fullName}' registered successfully!`);
            setCreateModalOpen(false);
            setStaffForm({ fullName: '', email: '', password: '', role: 'ROLE_CASHIER' });
            fetchStaff();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Error creating staff member', 'error');
        }
    };

    const handleUpdateRole = async (e) => {
        e.preventDefault();
        if (!selectedStaff) return;
        try {
            await updateStaffRole(selectedStaff.id, newRole);
            showAlert(`Role for '${selectedStaff.fullName}' updated to ${formatRole(newRole)}`);
            setEditRoleModalOpen(false);
            fetchStaff();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Error updating staff role', 'error');
        }
    };

    const handleToggleStatus = async (staff) => {
        try {
            await toggleStaffStatus(staff.id);
            showAlert(`Status toggled for ${staff.fullName}`);
            fetchStaff();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Error toggling staff status', 'error');
        }
    };

    const handleDeleteStaff = async (staff) => {
        if (!window.confirm(`Are you sure you want to remove ${staff.fullName} from your store team?`)) {
            return;
        }
        try {
            await deleteStaff(staff.id);
            showAlert(`Staff member ${staff.fullName} removed`);
            fetchStaff();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Error deleting staff member', 'error');
        }
    };

    const formatRole = (role) => {
        switch (role) {
            case 'ROLE_STORE_ADMIN':
                return 'Store Admin';
            case 'ROLE_CASHIER':
                return 'Cashier';
            case 'ROLE_INVENTORY_MANAGER':
                return 'Inventory Manager';
            case 'ROLE_SUPER_ADMIN':
                return 'Super Admin';
            default:
                return role;
        }
    };

    const getRoleChip = (role) => {
        if (role === 'ROLE_STORE_ADMIN') {
            return <Chip label="Store Admin" size="small" icon={<AdminPanelSettingsIcon />} color="success" variant="outlined" />;
        }
        if (role === 'ROLE_CASHIER') {
            return <Chip label="Cashier" size="small" icon={<PointOfSaleIcon />} color="primary" variant="outlined" />;
        }
        if (role === 'ROLE_INVENTORY_MANAGER') {
            return <Chip label="Inventory Manager" size="small" icon={<InventoryIcon />} color="secondary" variant="outlined" />;
        }
        return <Chip label={role} size="small" />;
    };

    const totalCashiers = staffList.filter((s) => s.role === 'ROLE_CASHIER').length;
    const totalInventoryManagers = staffList.filter((s) => s.role === 'ROLE_INVENTORY_MANAGER').length;
    const totalActive = staffList.filter((s) => s.userStatus === 'ACTIVE' || s.status === 'ACTIVE').length;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <PeopleIcon color="primary" sx={{ fontSize: 32 }} />
                    <Box>
                        <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
                            Staff & Roles Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Invite team members and assign Cashier or Inventory Manager access
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setCreateModalOpen(true)}
                    size="large"
                >
                    Add Store Team Member
                </Button>
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
                                TOTAL STORE STAFF
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="#0f172a" mt={0.5}>
                                {staffList.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={1}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                CASHIERS
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="#2563eb" mt={0.5}>
                                {totalCashiers}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={1}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                INVENTORY MANAGERS
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="#7c3aed" mt={0.5}>
                                {totalInventoryManagers}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={1}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                ACTIVE USERS
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="#16a34a" mt={0.5}>
                                {totalActive}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Staff Table */}
            <TableContainer component={Paper} elevation={1}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Team Member</TableCell>
                            <TableCell>Assigned Role</TableCell>
                            <TableCell align="center">Account Status</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : staffList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                    No staff members registered yet. Click 'Add Store Team Member' to invite cashiers.
                                </TableCell>
                            </TableRow>
                        ) : (
                            staffList.map((staff) => {
                                const isActive = staff.userStatus === 'ACTIVE' || staff.status === 'ACTIVE';
                                const isCurrentUser = user && (user.id === staff.id || user.userId === staff.id);

                                return (
                                    <TableRow key={staff.id} hover>
                                        <TableCell>
                                            <Typography variant="subtitle2" fontWeight={700}>
                                                {staff.fullName} {isCurrentUser && <Chip label="You" size="small" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {staff.email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{getRoleChip(staff.role)}</TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={isActive ? 'Active' : 'Inactive'}
                                                color={isActive ? 'success' : 'default'}
                                                size="small"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box display="flex" justifyContent="center" gap={1}>
                                                <Tooltip title="Change Role">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setSelectedStaff(staff);
                                                                setNewRole(staff.role);
                                                                setEditRoleModalOpen(true);
                                                            }}
                                                            disabled={isCurrentUser}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title={isActive ? 'Deactivate Account' : 'Activate Account'}>
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            color={isActive ? 'warning' : 'success'}
                                                            onClick={() => handleToggleStatus(staff)}
                                                            disabled={isCurrentUser}
                                                        >
                                                            {isActive ? <ToggleOnIcon /> : <ToggleOffIcon />}
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Remove Staff Member">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeleteStaff(staff)}
                                                            disabled={isCurrentUser}
                                                        >
                                                            <DeleteOutlineIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Invite Staff Modal */}
            <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleCreateStaff}>
                    <DialogTitle fontWeight={700}>Add Store Team Member</DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2.5}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Full Name"
                                    fullWidth
                                    required
                                    value={staffForm.fullName}
                                    onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                                    placeholder="e.g. Johnathan Davis"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Email Address"
                                    type="email"
                                    fullWidth
                                    required
                                    value={staffForm.email}
                                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                                    placeholder="johnathan@store.com"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Initial Password"
                                    type="password"
                                    fullWidth
                                    required
                                    value={staffForm.password}
                                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                                    helperText="Minimum 6 characters"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Assigned Store Role"
                                    select
                                    fullWidth
                                    value={staffForm.role}
                                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                                >
                                    <MenuItem value="ROLE_CASHIER">
                                        Cashier (POS Checkout, Invoices & Receipt Print)
                                    </MenuItem>
                                    <MenuItem value="ROLE_INVENTORY_MANAGER">
                                        Inventory Manager (Catalog, Stock Movements & Barcodes)
                                    </MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">
                            Create Staff Account
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Edit Role Modal */}
            <Dialog open={editRoleModalOpen} onClose={() => setEditRoleModalOpen(false)} maxWidth="xs" fullWidth>
                <form onSubmit={handleUpdateRole}>
                    <DialogTitle fontWeight={700}>Update Assigned Role</DialogTitle>
                    <DialogContent dividers>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Update system access level for <strong>{selectedStaff?.fullName}</strong>:
                        </Typography>
                        <TextField
                            label="Role"
                            select
                            fullWidth
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                        >
                            <MenuItem value="ROLE_CASHIER">Cashier (POS & Sales Invoices)</MenuItem>
                            <MenuItem value="ROLE_INVENTORY_MANAGER">Inventory Manager</MenuItem>
                            <MenuItem value="ROLE_STORE_ADMIN">Store Admin (Full Store Access)</MenuItem>
                        </TextField>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setEditRoleModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">
                            Save Role
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default StaffManagement;
