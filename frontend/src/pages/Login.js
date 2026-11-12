import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container, Box, Typography, TextField, Button, Alert, Paper,
    Chip, Stack, Divider
} from '@mui/material';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SecurityIcon from '@mui/icons-material/Security';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const DEMO_ACCOUNTS = [
    {
        name: 'Super Admin',
        roleLabel: 'Super Admin',
        roleColor: '#673ab7',
        bg: '#ede7f6',
        email: 'admin@saas.com',
        password: 'admin123',
        description: 'Platform Governance & All User Accounts'
    },
    {
        name: 'Main Retail Store',
        roleLabel: 'Store Admin',
        roleColor: '#1976d2',
        bg: '#e3f2fd',
        email: 'guest@example.com',
        password: 'guest123',
        description: 'Main Retail Store (POS, Stock, Register)'
    },
    {
        name: 'Prime Retail Store',
        roleLabel: 'Store Admin',
        roleColor: '#2e7d32',
        bg: '#e8f5e9',
        email: 'teststore@erp.com',
        password: 'password123',
        description: 'Prime Retail Store (POS & Inventory)'
    }
];

const Login = () => {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            email: '',
            password: ''
        }
    });
    const { login, loginAsGuest } = useAuth();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');
    const [selectedAccount, setSelectedAccount] = useState(null);

    const emailValue = watch('email');
    const passwordValue = watch('password');

    const handleSelectAccount = (account) => {
        setValue('email', account.email, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        setValue('password', account.password, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        setSelectedAccount(account.email);
        setServerError('');
    };

    const onSubmit = async (data) => {
        try {
            setServerError('');
            const cleanEmail = (data.email || '').trim();
            await login(cleanEmail, data.password);
            navigate('/');
        } catch (error) {
            console.error("Login Error:", error);
            if (error.response) {
                const msg = error.response.data?.message;
                const formattedMsg = Array.isArray(msg) ? msg.join(', ') : msg;
                setServerError(formattedMsg || `Login failed (${error.response.status})`);
            } else if (error.request) {
                setServerError('No response from server. Please ensure the backend is running.');
            } else {
                setServerError('Error setting up request: ' + error.message);
            }
        }
    };

    const handleGuestLogin = async () => {
        try {
            setServerError('');
            await loginAsGuest();
            navigate('/');
        } catch (error) {
             setServerError(error.message);
        }
    };

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    marginTop: 6,
                    marginBottom: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper sx={{ p: 4, width: '100%', borderRadius: 2 }} elevation={3}>
                    <Typography component="h1" variant="h5" align="center" fontWeight="bold" gutterBottom>
                        Sign in to ExpenseManager
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
                        Multi-tenant Retail ERP & Accounting SaaS
                    </Typography>

                    {/* Temporary Quick Load Accounts Panel */}
                    <Box
                        sx={{
                            mb: 3,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                            <FlashOnIcon sx={{ color: '#f59e0b', fontSize: 22 }} />
                            <Typography variant="subtitle2" fontWeight="700" color="text.primary">
                                Quick Load Accounts
                            </Typography>
                            <Chip
                                label="Click to Autofill"
                                size="small"
                                color="primary"
                                sx={{ ml: 'auto', height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                            />
                        </Box>

                        <Stack spacing={1}>
                            {DEMO_ACCOUNTS.map((acc) => {
                                const isSelected = selectedAccount === acc.email || emailValue === acc.email;
                                return (
                                    <Paper
                                        key={acc.email}
                                        variant="outlined"
                                        onClick={() => handleSelectAccount(acc)}
                                        sx={{
                                            p: 1.2,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            borderRadius: 1.5,
                                            bgcolor: isSelected ? acc.bg : '#ffffff',
                                            borderColor: isSelected ? acc.roleColor : '#e2e8f0',
                                            borderWidth: isSelected ? '1.5px' : '1px',
                                            transition: 'all 0.15s ease-in-out',
                                            '&:hover': {
                                                borderColor: acc.roleColor,
                                                bgcolor: acc.bg,
                                                transform: 'translateY(-1px)',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                                            }
                                        }}
                                    >
                                        <Box display="flex" alignItems="center" gap={1.2}>
                                            {isSelected ? (
                                                <CheckCircleIcon sx={{ color: acc.roleColor, fontSize: 20 }} />
                                            ) : (
                                                acc.roleLabel === 'Super Admin' ? (
                                                    <SecurityIcon sx={{ color: acc.roleColor, fontSize: 20 }} />
                                                ) : (
                                                    <StorefrontIcon sx={{ color: acc.roleColor, fontSize: 20 }} />
                                                )
                                            )}
                                            <Box>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Typography variant="body2" fontWeight="700">
                                                        {acc.name}
                                                    </Typography>
                                                    <Chip
                                                        label={acc.roleLabel}
                                                        size="small"
                                                        sx={{
                                                            height: 18,
                                                            fontSize: '0.65rem',
                                                            fontWeight: 700,
                                                            bgcolor: acc.bg,
                                                            color: acc.roleColor
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {acc.email} &bull; Password: <strong>{acc.password}</strong>
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Button
                                            size="small"
                                            variant={isSelected ? 'contained' : 'outlined'}
                                            sx={{
                                                fontSize: '0.7rem',
                                                py: 0.3,
                                                px: 1.2,
                                                minWidth: 0,
                                                textTransform: 'none',
                                                borderColor: acc.roleColor,
                                                color: isSelected ? '#fff' : acc.roleColor,
                                                bgcolor: isSelected ? acc.roleColor : 'transparent',
                                                '&:hover': {
                                                    bgcolor: acc.roleColor,
                                                    color: '#fff'
                                                }
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectAccount(acc);
                                            }}
                                        >
                                            {isSelected ? 'Loaded ✓' : 'Load'}
                                        </Button>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    </Box>

                    <Divider sx={{ my: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                            OR ENTER CREDENTIALS MANUALLY
                        </Typography>
                    </Divider>

                    {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

                    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address or Username"
                            autoComplete="email"
                            slotProps={{
                                inputLabel: { shrink: Boolean(emailValue) }
                            }}
                            {...register('email', { required: 'Email is required' })}
                            error={!!errors.email}
                            helperText={errors.email?.message}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            slotProps={{
                                inputLabel: { shrink: Boolean(passwordValue) }
                            }}
                            {...register('password', { required: 'Password is required' })}
                            error={!!errors.password}
                            helperText={errors.password?.message}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{ mt: 3, mb: 1.5, py: 1.2, fontWeight: 700 }}
                        >
                            Sign In
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            color="secondary"
                            onClick={handleGuestLogin}
                            sx={{ mb: 2 }}
                        >
                            Continue as Guest
                        </Button>
                        <Box sx={{ textAlign: 'center', mt: 1 }}>
                            <Link to="/signup" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 600 }}>
                                {"Don't have an account? Sign Up"}
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;
