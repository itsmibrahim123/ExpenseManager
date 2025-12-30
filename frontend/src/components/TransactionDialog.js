import React, { useEffect, useState } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, MenuItem, Tabs, Tab, Box, Alert,
    FormControlLabel, Checkbox
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import TransactionsService from '../api/transactionsService';
import AccountsService from '../api/accountsService';
import CategoriesService from '../api/categoriesService';
import PaymentMethodsService from '../api/paymentMethodsService';
import MerchantsService from '../api/merchantsService';
import { useAuth } from '../context/AuthContext';

const TransactionDialog = ({ open, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [tabValue, setTabValue] = useState(0); // 0: Expense, 1: Income, 2: Transfer
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [merchants, setMerchants] = useState([]);
    const [error, setError] = useState('');
    
    const { control, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            transactionDate: new Date().toISOString().split('T')[0],
            status: 'CLEARED',
            currencyCode: 'PKR',
            allowNegative: false
        }
    });

    // Fetch data on open
    useEffect(() => {
        if (open && user) {
            const fetchData = async () => {
                try {
                    const [accData, pmData, merchData] = await Promise.all([
                        AccountsService.getAll(user.userId),
                        PaymentMethodsService.getAll(user.userId),
                        MerchantsService.getAll(user.userId)
                    ]);
                    setAccounts(accData);
                    setPaymentMethods(pmData);
                    setMerchants(merchData);
                } catch (err) {
                    console.error(err);
                }
            };
            fetchData();
        }
    }, [open, user]);

    // Fetch categories when type changes
    useEffect(() => {
        if (open && user && tabValue !== 2) {
            const type = tabValue === 0 ? 'EXPENSE' : 'INCOME';
            CategoriesService.getAll(user.userId, type).then(setCategories);
        }
    }, [open, user, tabValue]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        reset({
            transactionDate: new Date().toISOString().split('T')[0],
            status: 'CLEARED',
            currencyCode: 'PKR',
            allowNegative: false
        });
        setError('');
    };

    const onSubmit = async (data) => {
        setError('');
        try {
            if (tabValue === 2) {
                // Transfer
                await TransactionsService.transfer({
                    userId: user.userId,
                    sourceAccountId: data.sourceAccountId,
                    destinationAccountId: data.destinationAccountId,
                    amount: data.amount,
                    transferDate: data.transactionDate,
                    description: data.description,
                    referenceNumber: data.referenceNumber
                }, data.allowNegative);
            } else {
                // Expense / Income
                const type = tabValue === 0 ? 'EXPENSE' : 'INCOME';
                await TransactionsService.create({
                    userId: user.userId,
                    accountId: data.accountId,
                    categoryId: data.categoryId,
                    type: type,
                    amount: data.amount,
                    currencyCode: data.currencyCode, // Should probably come from Account, but manual for now
                    transactionDate: data.transactionDate,
                    status: data.status,
                    paymentMethodId: data.paymentMethodId || null,
                    merchantId: data.merchantId || null,
                    description: data.description,
                    referenceNumber: data.referenceNumber
                }, data.allowNegative);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Transaction failed');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>New Transaction</DialogTitle>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
                    <Tab label="Expense" />
                    <Tab label="Income" />
                    <Tab label="Transfer" />
                </Tabs>
            </Box>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    
                    {/* Common Fields */}
                    <Controller
                        name="transactionDate"
                        control={control}
                        rules={{ required: 'Date is required' }}
                        render={({ field, fieldState: { error } }) => (
                            <TextField {...field} type="date" label="Date" fullWidth margin="dense" error={!!error} helperText={error?.message} InputLabelProps={{ shrink: true }} />
                        )}
                    />

                    {/* Transfer Specific */}
                    {tabValue === 2 ? (
                        <>
                            <Controller
                                name="sourceAccountId"
                                control={control}
                                rules={{ required: 'Source Account is required' }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField {...field} select label="From Account" fullWidth margin="dense" error={!!error} helperText={error?.message}>
                                        {accounts.map(acc => <MenuItem key={acc.id} value={acc.id}>{acc.name} ({acc.currencyCode})</MenuItem>)}
                                    </TextField>
                                )}
                            />
                            <Controller
                                name="destinationAccountId"
                                control={control}
                                rules={{ 
                                    required: 'Destination Account is required',
                                    validate: (val) => val !== watch('sourceAccountId') || 'Source and Destination cannot be same'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField {...field} select label="To Account" fullWidth margin="dense" error={!!error} helperText={error?.message}>
                                        {accounts.map(acc => <MenuItem key={acc.id} value={acc.id}>{acc.name} ({acc.currencyCode})</MenuItem>)}
                                    </TextField>
                                )}
                            />
                        </>
                    ) : (
                        // Expense / Income Specific
                        <>
                            <Controller
                                name="accountId"
                                control={control}
                                rules={{ required: 'Account is required' }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField {...field} select label="Account" fullWidth margin="dense" error={!!error} helperText={error?.message}>
                                        {accounts.map(acc => <MenuItem key={acc.id} value={acc.id}>{acc.name} ({acc.currencyCode})</MenuItem>)}
                                    </TextField>
                                )}
                            />
                            <Controller
                                name="categoryId"
                                control={control}
                                rules={{ required: 'Category is required' }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField {...field} select label="Category" fullWidth margin="dense" error={!!error} helperText={error?.message}>
                                        {categories.map(cat => <MenuItem key={cat.categoryId} value={cat.categoryId}>{cat.name}</MenuItem>)}
                                    </TextField>
                                )}
                            />
                        </>
                    )}

                    <Controller
                        name="amount"
                        control={control}
                        rules={{ required: 'Amount is required', min: 0.01 }}
                        render={({ field, fieldState: { error } }) => (
                            <TextField {...field} type="number" label="Amount" fullWidth margin="dense" error={!!error} helperText={error?.message} />
                        )}
                    />

                    {tabValue !== 2 && (
                         <Controller
                            name="currencyCode"
                            control={control}
                            rules={{ required: 'Currency is required' }}
                            render={({ field }) => (
                                <TextField {...field} select label="Currency" fullWidth margin="dense">
                                    {['PKR', 'USD', 'EUR', 'GBP'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                </TextField>
                            )}
                        />
                    )}
                    
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} label="Description" fullWidth margin="dense" multiline rows={2} />
                        )}
                    />

                    {tabValue !== 2 && (
                        <>
                             <Controller
                                name="merchantId"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} select label="Merchant (Optional)" fullWidth margin="dense">
                                        <MenuItem value=""><em>None</em></MenuItem>
                                        {merchants.map(m => <MenuItem key={m.merchantId} value={m.merchantId}>{m.name}</MenuItem>)}
                                    </TextField>
                                )}
                            />
                             <Controller
                                name="paymentMethodId"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} select label="Payment Method (Optional)" fullWidth margin="dense">
                                        <MenuItem value=""><em>None</em></MenuItem>
                                        {paymentMethods.map(pm => <MenuItem key={pm.paymentMethodId} value={pm.paymentMethodId}>{pm.name}</MenuItem>)}
                                    </TextField>
                                )}
                            />
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} select label="Status" fullWidth margin="dense">
                                        <MenuItem value="CLEARED">Cleared</MenuItem>
                                        <MenuItem value="PENDING">Pending</MenuItem>
                                    </TextField>
                                )}
                            />
                        </>
                    )}

                    <Controller
                        name="allowNegative"
                        control={control}
                        render={({ field }) => (
                            <FormControlLabel
                                control={<Checkbox {...field} checked={field.value} />}
                                label="Allow Negative Balance (Overdraft)"
                            />
                        )}
                    />

                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained">Save</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default TransactionDialog;
