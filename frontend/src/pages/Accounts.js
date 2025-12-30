import React, { useEffect, useState } from 'react';
import { 
    Box, Typography, Button, Grid, Paper, IconButton, 
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
    MenuItem, CircularProgress, Chip, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import { useForm, Controller } from 'react-hook-form';
import AccountsService from '../api/accountsService';
import { useAuth } from '../context/AuthContext';

const ACCOUNT_TYPES = ['CASH', 'BANK', 'CREDIT_CARD', 'MOBILE_WALLET', 'OTHER'];
const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP']; // Simplified list

const Accounts = () => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    const { control, handleSubmit, reset, setValue } = useForm();

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const data = await AccountsService.getAll(user.userId);
            setAccounts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchAccounts();
    }, [user]);

    const handleOpenDialog = (account = null) => {
        setEditingAccount(account);
        setErrorMessage('');
        if (account) {
            setValue('name', account.name);
            setValue('type', account.type);
            setValue('currencyCode', account.currencyCode);
            setValue('initialBalance', account.initialBalance); // Usually read-only on edit, but let's see
            // Note: UpdateDTO might differ. Usually initial balance isn't editable after creation.
        } else {
            reset({
                name: '',
                type: 'CASH',
                currencyCode: 'PKR',
                initialBalance: 0
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingAccount(null);
    };

    const onSubmit = async (data) => {
        try {
            if (editingAccount) {
                // Update
                // Assuming UpdateDTO only takes name, type? Let's check DTO later.
                // Generally Update shouldn't change currency or initial balance easily.
                await AccountsService.update(editingAccount.id, {
                    name: data.name,
                    type: data.type,
                    // Sending others might be ignored by backend
                });
            } else {
                // Create
                await AccountsService.create({
                    ...data,
                    userId: user.userId
                });
            }
            fetchAccounts();
            handleCloseDialog();
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleArchive = async (id) => {
        if (window.confirm('Are you sure you want to archive this account?')) {
            try {
                await AccountsService.archive(id);
                fetchAccounts();
            } catch (error) {
                alert('Failed to archive: ' + (error.response?.data?.message || 'Unknown error'));
            }
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Accounts</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                    New Account
                </Button>
            </Box>

            {loading ? <CircularProgress /> : (
                <Grid container spacing={3}>
                    {accounts.map((acc) => (
                        <Grid item xs={12} sm={6} md={4} key={acc.id}>
                            <Paper sx={{ p: 2, position: 'relative' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="h6">{acc.name}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{acc.type}</Typography>
                                        <Chip label={acc.archived ? 'Archived' : 'Active'} color={acc.archived ? 'default' : 'success'} size="small" />
                                    </Box>
                                    <Box>
                                        <IconButton size="small" onClick={() => handleOpenDialog(acc)}><EditIcon /></IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleArchive(acc.id)}><ArchiveIcon /></IconButton>
                                    </Box>
                                </Box>
                                <Typography variant="h5" align="right" sx={{ mt: 2, fontWeight: 'bold', color: 'primary.main' }}>
                                    {acc.currencyCode} {acc.currentBalance?.toLocaleString()}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>{editingAccount ? 'Edit Account' : 'New Account'}</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogContent sx={{ minWidth: 300 }}>
                        {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
                        
                        <Controller
                            name="name"
                            control={control}
                            rules={{ required: 'Name is required' }}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    margin="dense"
                                    label="Account Name"
                                    fullWidth
                                    error={!!error}
                                    helperText={error?.message}
                                />
                            )}
                        />

                        <Controller
                            name="type"
                            control={control}
                            rules={{ required: 'Type is required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    margin="dense"
                                    label="Account Type"
                                    fullWidth
                                >
                                    {ACCOUNT_TYPES.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />

                        {!editingAccount && (
                             <Controller
                                name="currencyCode"
                                control={control}
                                rules={{ required: 'Currency is required' }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        margin="dense"
                                        label="Currency"
                                        fullWidth
                                    >
                                        {CURRENCIES.map((option) => (
                                            <MenuItem key={option} value={option}>
                                                {option}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        )}

                        {!editingAccount && (
                            <Controller
                                name="initialBalance"
                                control={control}
                                rules={{ required: 'Initial Balance is required', min: 0 }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        type="number"
                                        margin="dense"
                                        label="Initial Balance"
                                        fullWidth
                                        error={!!error}
                                        helperText={error?.message}
                                    />
                                )}
                            />
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained">Save</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default Accounts;
