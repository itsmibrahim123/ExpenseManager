import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, Card, CardContent, Button, Alert, CircularProgress
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import { getPlatformMetrics } from '../../api/adminApi';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const res = await getPlatformMetrics();
            setMetrics(res.data);
        } catch (err) {
            setAlert({ show: true, message: 'Failed to load platform metrics', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1}>
                    <StorefrontIcon color="primary" sx={{ fontSize: 36 }} />
                    <Typography variant="h4" fontWeight="bold">
                        Super Admin SaaS Platform Overview
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddBusinessIcon />}
                    onClick={() => navigate('/admin/stores')}
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

            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="overline" color="textSecondary">Total Store Tenants</Typography>
                                <StorefrontIcon color="primary" />
                            </Box>
                            <Typography variant="h4" fontWeight="bold">
                                {metrics?.totalTenants || 0}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {metrics?.newStoresLast7Days || 0} onboarded last 7 days
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ backgroundColor: '#e8f5e9' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="overline" color="textSecondary">Active & Trial Stores</Typography>
                                <CheckCircleIcon color="success" />
                            </Box>
                            <Typography variant="h4" fontWeight="bold" color="success.main">
                                {(metrics?.activeTenants || 0) + (metrics?.trialTenants || 0)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {metrics?.trialTenants || 0} currently on Trial
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ backgroundColor: '#ffebee' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="overline" color="textSecondary">Suspended / Inactive</Typography>
                                <PauseCircleIcon color="error" />
                            </Box>
                            <Typography variant="h4" fontWeight="bold" color="error.main">
                                {(metrics?.suspendedTenants || 0) + (metrics?.cancelledTenants || 0)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">Access blocked via interceptor</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ backgroundColor: '#e3f2fd' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="overline" color="textSecondary">Platform Sales Volume (30D)</Typography>
                                <AttachMoneyIcon color="primary" />
                            </Box>
                            <Typography variant="h4" fontWeight="bold" color="primary.main">
                                Rs. {Number(metrics?.totalSalesVolume30Days || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">Aggregated POS GMV</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Quick Actions Paper */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                    Super Admin Tenant Management Actions
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <Button 
                            fullWidth 
                            variant="outlined" 
                            size="large"
                            onClick={() => navigate('/admin/stores')}
                        >
                            Manage Store Tenants & Status
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Button 
                            fullWidth 
                            variant="outlined" 
                            color="success"
                            size="large"
                            onClick={() => navigate('/admin/stores')}
                        >
                            Extend Subscriptions & Tiers
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Button 
                            fullWidth 
                            variant="outlined" 
                            color="info"
                            size="large"
                            onClick={() => navigate('/pos')}
                        >
                            Launch Impersonation POS View
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default AdminDashboard;
