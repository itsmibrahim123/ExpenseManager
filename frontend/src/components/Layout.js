import React, { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import Header from './Header';
import Sidebar, { DRAWER_WIDTH_EXPANDED, DRAWER_WIDTH_COLLAPSED } from './Sidebar';

const Layout = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleToggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const currentDrawerWidth = isCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED;

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Header onSidebarToggle={handleDrawerToggle} />
            
            <Box
                component="nav"
                sx={{
                    width: { sm: currentDrawerWidth },
                    flexShrink: { sm: 0 },
                    transition: 'width 0.2s ease-in-out',
                }}
                aria-label="store navigation"
            >
                <Sidebar
                    variant="permanent"
                    open={true}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={handleToggleCollapse}
                />
                <Sidebar
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    isCollapsed={false}
                />
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, sm: 3 },
                    width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
                    transition: 'width 0.2s ease-in-out',
                    maxWidth: '100%',
                    overflowX: 'hidden',
                }}
            >
                <Toolbar variant="dense" />
                {children}
            </Box>
        </Box>
    );
};

export default Layout;
