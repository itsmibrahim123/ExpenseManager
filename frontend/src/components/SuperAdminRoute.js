import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const SuperAdminRoute = () => {
    const { user, isSuperAdmin, loading } = useAuth();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!user || !isSuperAdmin()) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default SuperAdminRoute;
