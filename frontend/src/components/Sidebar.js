import React from 'react';
import {
    Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Divider, Typography
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PieChartIcon from '@mui/icons-material/PieChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const Sidebar = ({ variant, open, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isSuperAdmin, storeName } = useAuth();

    const superAdminItems = [
        { text: 'Platform Overview', icon: <DashboardIcon />, path: '/admin/dashboard' },
        { text: 'Store Tenants', icon: <StorefrontIcon />, path: '/admin/stores' },
        { text: 'Launch Store POS', icon: <PointOfSaleIcon />, path: '/pos' },
    ];

    const storeItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'POS Terminal', icon: <PointOfSaleIcon />, path: '/pos' },
        { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
        { text: 'Invoices', icon: <ReceiptLongIcon />, path: '/invoices' },
        { text: 'Daily Register', icon: <AccountBalanceWalletIcon />, path: '/register' },
        { text: 'Accounts', icon: <AccountBalanceIcon />, path: '/accounts' },
        { text: 'Transactions', icon: <ReceiptIcon />, path: '/transactions' },
        { text: 'Budgets', icon: <PieChartIcon />, path: '/budgets' },
        { text: 'Transfers', icon: <SwapHorizIcon />, path: '/transfers' },
        { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ];

    const menuItems = isSuperAdmin() ? superAdminItems : storeItems;

    const handleNavigate = (path) => {
        navigate(path);
        if (onClose) onClose();
    };

    const drawerContent = (
        <Box sx={{ overflow: 'auto' }}>
            <Toolbar variant="dense" />
            <Box sx={{ px: 2, py: 1, backgroundColor: '#f5f5f5' }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>
                    {isSuperAdmin() ? 'SUPER ADMIN PLATFORM' : (storeName || 'STORE TENANT')}
                </Typography>
            </Box>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton 
                            selected={location.pathname === item.path}
                            onClick={() => handleNavigate(item.path)}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
        </Box>
    );

    return (
        <Drawer
            variant={variant}
            open={open}
            onClose={onClose}
            ModalProps={{ keepMounted: true }}
            sx={{
                display: { xs: variant === 'temporary' ? 'block' : 'none', sm: variant === 'permanent' ? 'block' : 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
        >
            {drawerContent}
        </Drawer>
    );
};

export default Sidebar;