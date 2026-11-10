import React, { useState, useEffect } from 'react';
import {
    Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar,
    Box, Divider, Typography, Badge, IconButton, Tooltip, Chip
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
import PeopleIcon from '@mui/icons-material/People';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProducts } from '../api/inventoryApi';

export const DRAWER_WIDTH_EXPANDED = 250;
export const DRAWER_WIDTH_COLLAPSED = 72;

const Sidebar = ({ variant, open, onClose, isCollapsed, onToggleCollapse }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isSuperAdmin, isStoreAdmin, storeName } = useAuth();
    const [lowStockCount, setLowStockCount] = useState(0);

    useEffect(() => {
        if (!isSuperAdmin()) {
            getProducts('', true)
                .then((res) => {
                    const count = (res.data || []).length;
                    setLowStockCount(count);
                })
                .catch(() => {});
        }
    }, [location.pathname, isSuperAdmin]);

    const superAdminItems = [
        { text: 'Platform Overview', icon: <DashboardIcon />, path: '/admin/dashboard' },
        { text: 'Store Tenants', icon: <StorefrontIcon />, path: '/admin/stores' },
        { text: 'Launch Store POS', icon: <PointOfSaleIcon />, path: '/pos' },
    ];

    const storeItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'POS Terminal', icon: <PointOfSaleIcon />, path: '/pos' },
        {
            text: 'Inventory',
            icon: <InventoryIcon />,
            path: '/inventory',
            badge: lowStockCount > 0 ? lowStockCount : null,
        },
        { text: 'Invoices', icon: <ReceiptLongIcon />, path: '/invoices' },
        { text: 'Daily Register', icon: <AccountBalanceWalletIcon />, path: '/daily-register' },
        ...(isStoreAdmin()
            ? [{ text: 'Staff & Roles', icon: <PeopleIcon />, path: '/staff' }]
            : []),
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

    const drawerWidth = isCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED;

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflowX: 'hidden' }}>
            <Toolbar variant="dense" sx={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'space-between', px: 2 }}>
                {!isCollapsed && (
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2563eb' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: '-0.01em', color: '#0f172a' }}>
                            {isSuperAdmin() ? 'SUPER ADMIN' : (storeName || 'RETAIL STORE')}
                        </Typography>
                    </Box>
                )}
                {onToggleCollapse && (
                    <IconButton size="small" onClick={onToggleCollapse} sx={{ color: '#64748b' }}>
                        {isCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
                    </IconButton>
                )}
            </Toolbar>
            <Divider />

            {!isCollapsed && (
                <Box sx={{ px: 2, py: 1.5, bgcolor: '#f8fafc' }}>
                    <Chip
                        label={isSuperAdmin() ? 'Platform Owner' : 'Store Operations'}
                        size="small"
                        sx={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            bgcolor: isSuperAdmin() ? '#ede9fe' : '#e0f2fe',
                            color: isSuperAdmin() ? '#6d28d9' : '#0369a1',
                            width: '100%',
                        }}
                    />
                </Box>
            )}

            <List sx={{ px: 1, py: 1, flexGrow: 1, overflowY: 'auto' }}>
                {menuItems.map((item) => {
                    const isSelected = location.pathname === item.path;
                    const buttonContent = (
                        <ListItemButton
                            selected={isSelected}
                            onClick={() => handleNavigate(item.path)}
                            sx={{
                                minHeight: 40,
                                px: isCollapsed ? 1.5 : 2,
                                py: 1,
                                mb: 0.5,
                                borderRadius: 2,
                                justifyContent: isCollapsed ? 'center' : 'initial',
                                '&.Mui-selected': {
                                    bgcolor: '#eff6ff',
                                    color: '#2563eb',
                                    fontWeight: 700,
                                    '& .MuiListItemIcon-root': {
                                        color: '#2563eb',
                                    },
                                    '&:hover': {
                                        bgcolor: '#dbeafe',
                                    },
                                },
                                '&:hover': {
                                    bgcolor: '#f1f5f9',
                                },
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: isCollapsed ? 0 : 2,
                                    justifyContent: 'center',
                                    color: isSelected ? '#2563eb' : '#64748b',
                                }}
                            >
                                {item.badge ? (
                                    <Badge badgeContent={item.badge} color="error" max={99}>
                                        {item.icon}
                                    </Badge>
                                ) : (
                                    item.icon
                                )}
                            </ListItemIcon>
                            {!isCollapsed && (
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontSize: '0.84rem',
                                        fontWeight: isSelected ? 700 : 500,
                                    }}
                                />
                            )}
                            {!isCollapsed && item.badge && (
                                <Chip
                                    label={`${item.badge} Low`}
                                    size="small"
                                    color="error"
                                    icon={<WarningAmberIcon style={{ fontSize: 13 }} />}
                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                />
                            )}
                        </ListItemButton>
                    );

                    return (
                        <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                            {isCollapsed ? (
                                <Tooltip title={item.text} placement="right" arrow>
                                    {buttonContent}
                                </Tooltip>
                            ) : (
                                buttonContent
                            )}
                        </ListItem>
                    );
                })}
            </List>
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
                '& .MuiDrawer-paper': {
                    boxSizing: 'border-box',
                    width: drawerWidth,
                    transition: 'width 0.2s ease-in-out',
                    overflowX: 'hidden',
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
};

export default Sidebar;
