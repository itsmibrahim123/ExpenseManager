import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Alert, Paper } from '@mui/material';

const Login = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { login, loginAsGuest } = useAuth();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');

    const onSubmit = async (data) => {
        try {
            setServerError('');
            await login(data.email, data.password);
            navigate('/');
        } catch (error) {
            console.error("Login Error:", error);
            if (error.response) {
                // Server responded with a status code that falls out of the range of 2xx
                setServerError(error.response.data?.message || `Login failed (${error.response.status})`);
            } else if (error.request) {
                // The request was made but no response was received
                setServerError('No response from server. Please ensure the backend is running.');
            } else {
                // Something happened in setting up the request that triggered an Error
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
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper sx={{ p: 4, width: '100%' }} elevation={3}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom>
                        Sign in
                    </Typography>
                    {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
                    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            autoComplete="email"
                            autoFocus
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
                            {...register('password', { required: 'Password is required' })}
                            error={!!errors.password}
                            helperText={errors.password?.message}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
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
                        <Box sx={{ textAlign: 'center' }}>
                            <Link to="/register" style={{ textDecoration: 'none', color: '#1976d2' }}>
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
