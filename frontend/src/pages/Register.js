import React, { useState } from 'react';
import {
    Container, Box, Typography, TextField, Button, Alert, Paper, Stepper, Step,
    StepLabel, Grid, MenuItem, Card, Chip, CircularProgress,
    InputAdornment
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const steps = ['Account Info', 'Store Profile', 'Plan & Launch'];

const CURRENCIES = [
    { code: 'PKR', label: 'PKR - Pakistani Rupee (Rs)' },
    { code: 'USD', label: 'USD - US Dollar ($)' },
    { code: 'EUR', label: 'EUR - Euro (€)' },
    { code: 'GBP', label: 'GBP - British Pound (£)' },
    { code: 'AED', label: 'AED - UAE Dirham' },
    { code: 'SAR', label: 'SAR - Saudi Riyal' },
    { code: 'CAD', label: 'CAD - Canadian Dollar ($)' },
];

const Register = () => {
    const { registerUser } = useAuth();
    const navigate = useNavigate();

    const [activeStep, setActiveStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        contactPhone: '',
        storeName: '',
        slug: '',
        currencyCode: 'PKR',
        planTier: 'STARTER',
    });

    const handleChange = (field) => (e) => {
        const val = e.target.value;
        setForm((prev) => {
            const updated = { ...prev, [field]: val };
            if (field === 'storeName' && (!prev.slug || prev.slug === autoSlug(prev.storeName))) {
                updated.slug = autoSlug(val);
            }
            return updated;
        });
    };

    const autoSlug = (name) => {
        return (name || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    };

    const validateStep = (step) => {
        setErrorMsg('');
        if (step === 0) {
            if (!form.fullName.trim()) return 'Full Name is required';
            if (!form.email.trim() || !form.email.includes('@')) return 'Valid email is required';
            if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters';
        } else if (step === 1) {
            if (!form.storeName.trim()) return 'Store / Business Name is required';
            if (!form.slug.trim()) return 'Store URL Slug is required';
        }
        return null;
    };

    const handleNext = () => {
        const err = validateStep(activeStep);
        if (err) {
            setErrorMsg(err);
            return;
        }
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setErrorMsg('');
        setActiveStep((prev) => prev - 1);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setErrorMsg('');

        try {
            await registerUser({
                fullName: form.fullName,
                email: form.email,
                password: form.password,
                contactPhone: form.contactPhone,
                storeName: form.storeName,
                slug: form.slug,
                currencyCode: form.currencyCode,
                planTier: form.planTier,
            });

            navigate('/pos', {
                state: { message: `Welcome to ${form.storeName}! Your store is ready.` },
            });
        } catch (err) {
            console.error('Onboarding Error:', err);
            setErrorMsg(
                err.response?.data?.message || 'Failed to provision store tenant. Please verify your details.'
            );
            setSubmitting(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                py: 6,
                px: 2,
            }}
        >
            <Container maxWidth="md">
                <Box textAlign="center" mb={4}>
                    <Box display="inline-flex" alignItems="center" gap={1.5} mb={1}>
                        <StorefrontIcon sx={{ fontSize: 38, color: '#2563eb' }} />
                        <Typography variant="h3" fontWeight={800} letterSpacing="-0.03em" color="#0f172a">
                            ExpenseManager ERP
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                        Provision your enterprise-grade retail store in under 60 seconds
                    </Typography>
                </Box>

                <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05)' }}>
                    <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {errorMsg && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {errorMsg}
                        </Alert>
                    )}

                    {/* Step 1: Owner Account */}
                    {activeStep === 0 && (
                        <Box>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <PersonOutlineIcon color="primary" />
                                <Typography variant="h6" fontWeight={700}>
                                    Store Owner Account
                                </Typography>
                            </Box>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Full Name"
                                        fullWidth
                                        required
                                        value={form.fullName}
                                        onChange={handleChange('fullName')}
                                        placeholder="e.g. Sarah Jenkins"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Contact Phone"
                                        fullWidth
                                        value={form.contactPhone}
                                        onChange={handleChange('contactPhone')}
                                        placeholder="+1 555-0199"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Work Email"
                                        type="email"
                                        fullWidth
                                        required
                                        value={form.email}
                                        onChange={handleChange('email')}
                                        placeholder="owner@yourstore.com"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Password"
                                        type="password"
                                        fullWidth
                                        required
                                        value={form.password}
                                        onChange={handleChange('password')}
                                        helperText="Minimum 6 characters"
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* Step 2: Store Profile */}
                    {activeStep === 1 && (
                        <Box>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <StorefrontIcon color="primary" />
                                <Typography variant="h6" fontWeight={700}>
                                    Store & Company Profile
                                </Typography>
                            </Box>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={7}>
                                    <TextField
                                        label="Store / Business Name"
                                        fullWidth
                                        required
                                        value={form.storeName}
                                        onChange={handleChange('storeName')}
                                        placeholder="e.g. Apex Hypermarket & Mart"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={5}>
                                    <TextField
                                        label="Operating Currency"
                                        select
                                        fullWidth
                                        value={form.currencyCode}
                                        onChange={handleChange('currencyCode')}
                                    >
                                        {CURRENCIES.map((c) => (
                                            <MenuItem key={c.code} value={c.code}>
                                                {c.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Store URL Slug"
                                        fullWidth
                                        required
                                        value={form.slug}
                                        onChange={handleChange('slug')}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    app.expensemanager.com/
                                                </InputAdornment>
                                            ),
                                        }}
                                        helperText="Unique tenant identifier for your store platform and receipt headers"
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* Step 3: Plan & Confirmation */}
                    {activeStep === 2 && (
                        <Box>
                            <Typography variant="h6" fontWeight={700} mb={1}>
                                Review & Launch Your Store
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>
                                You are provisioning a dedicated multi-tenant isolated database instance.
                            </Typography>

                            <Grid container spacing={2} mb={3}>
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', height: '100%' }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            STORE SUMMARY
                                        </Typography>
                                        <Typography variant="body1" fontWeight={700} color="#0f172a">
                                            {form.storeName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Slug: {form.slug}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Currency: {form.currencyCode}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Owner: {form.fullName} ({form.email})
                                        </Typography>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            borderColor: '#2563eb',
                                            bgcolor: '#eff6ff',
                                            height: '100%',
                                        }}
                                    >
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                            <Typography variant="subtitle1" fontWeight={700} color="#1d4ed8">
                                                Starter Plan (14-Day Free Trial)
                                            </Typography>
                                            <Chip label="Free Trial" color="primary" size="small" />
                                        </Box>
                                        <Box display="flex" flexDirection="column" gap={0.5} mt={1}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <VerifiedIcon sx={{ fontSize: 16, color: '#16a34a' }} />
                                                <Typography variant="caption">POS Checkout & Cash Register</Typography>
                                            </Box>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <VerifiedIcon sx={{ fontSize: 16, color: '#16a34a' }} />
                                                <Typography variant="caption">Inventory & Serial Tracking</Typography>
                                            </Box>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <VerifiedIcon sx={{ fontSize: 16, color: '#16a34a' }} />
                                                <Typography variant="caption">Double-entry Auto Accounting</Typography>
                                            </Box>
                                        </Box>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* Step Actions */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={4} pt={2} borderTop="1px solid #e2e8f0">
                        {activeStep > 0 ? (
                            <Button startIcon={<ArrowBackIcon />} onClick={handleBack} disabled={submitting}>
                                Back
                            </Button>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                Already have a store? <Link to="/login" style={{ color: '#2563eb', fontWeight: 600 }}>Login</Link>
                            </Typography>
                        )}

                        {activeStep < steps.length - 1 ? (
                            <Button
                                variant="contained"
                                endIcon={<ArrowForwardIcon />}
                                onClick={handleNext}
                                sx={{ px: 3 }}
                            >
                                Continue
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircleOutlineIcon />}
                                onClick={handleSubmit}
                                disabled={submitting}
                                sx={{ px: 4, py: 1.2, fontWeight: 700 }}
                            >
                                {submitting ? 'Provisioning Instance...' : 'Launch My Store'}
                            </Button>
                        )}
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Register;
