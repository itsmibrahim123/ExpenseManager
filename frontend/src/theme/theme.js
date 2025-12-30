import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#0a6ed1', // SAP Blue-ish
            light: '#589ce6',
            dark: '#00449e',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#354a5f', // Neutral Dark Blue/Grey
            light: '#60768c',
            dark: '#0f2235',
            contrastText: '#ffffff',
        },
        background: {
            default: '#f5f7fa', // Light Grey Background
            paper: '#ffffff',
        },
        text: {
            primary: '#32363a', // Dark Grey Text
            secondary: '#6a6d70',
        },
        success: {
            main: '#107e3e',
        },
        error: {
            main: '#bb0000',
        },
        warning: {
            main: '#e9730c',
        },
    },
    typography: {
        fontFamily: '"72", "Roboto", "Helvetica", "Arial", sans-serif', // "72" is SAP's font, fallback to Roboto
        h1: { fontSize: '2.5rem', fontWeight: 300 },
        h2: { fontSize: '2rem', fontWeight: 300 },
        h3: { fontSize: '1.75rem', fontWeight: 400 },
        h4: { fontSize: '1.5rem', fontWeight: 400 },
        h5: { fontSize: '1.25rem', fontWeight: 500 },
        h6: { fontSize: '1rem', fontWeight: 600 },
        body1: { fontSize: '0.875rem' },
        body2: { fontSize: '0.75rem' },
        button: { textTransform: 'none' }, // No uppercase buttons
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 4,
                },
                containedPrimary: {
                    '&:hover': {
                        backgroundColor: '#0059b3',
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#354a5f', // Dark Header
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#f0f2f5',
                    color: '#32363a',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    backgroundColor: '#eff4f9',
                    color: '#32363a',
                    fontWeight: 600,
                },
            },
        },
    },
});

export default theme;
