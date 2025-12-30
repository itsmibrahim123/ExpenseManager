import React, { useEffect, useState } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, MenuItem, IconButton, Box, Typography,
    Table, TableBody, TableCell, TableHead, TableRow, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import BudgetsService from '../api/budgetsService';
import CategoriesService from '../api/categoriesService';
import { useAuth } from '../context/AuthContext';

const PERIOD_TYPES = ['MONTHLY', 'WEEKLY', 'YEARLY', 'CUSTOM'];

const BudgetDialog = ({ open, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState('');

    const { control, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            name: '',
            periodType: 'MONTHLY',
            startDate: new Date().toISOString().split('T')[0],
            items: [] // { categoryId, limitAmount }
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    const periodType = watch('periodType');

    useEffect(() => {
        if (open && user) {
            CategoriesService.getAll(user.userId, 'EXPENSE').then(setCategories);
        }
    }, [open, user]);

    const onSubmit = async (data) => {
        setError('');
        try {
            await BudgetsService.create({
                userId: user.userId,
                name: data.name,
                periodType: data.periodType,
                startDate: data.startDate,
                endDate: data.periodType === 'CUSTOM' ? data.endDate : null,
                totalLimit: data.totalLimit || null, // Optional
                notes: data.notes,
                items: data.items.map(item => ({
                    categoryId: item.categoryId,
                    limitAmount: item.limitAmount
                }))
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create budget');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>New Budget</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Controller
                            name="name"
                            control={control}
                            rules={{ required: 'Name is required' }}
                            render={({ field, fieldState: { error } }) => (
                                <TextField {...field} label="Budget Name" fullWidth margin="dense" error={!!error} helperText={error?.message} />
                            )}
                        />
                         <Controller
                            name="periodType"
                            control={control}
                            rules={{ required: 'Period Type is required' }}
                            render={({ field }) => (
                                <TextField {...field} select label="Period" fullWidth margin="dense">
                                    {PERIOD_TYPES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                                </TextField>
                            )}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Controller
                            name="startDate"
                            control={control}
                            rules={{ required: 'Start Date is required' }}
                            render={({ field, fieldState: { error } }) => (
                                <TextField {...field} type="date" label="Start Date" fullWidth margin="dense" error={!!error} helperText={error?.message} InputLabelProps={{ shrink: true }} />
                            )}
                        />
                        {periodType === 'CUSTOM' && (
                            <Controller
                                name="endDate"
                                control={control}
                                rules={{ required: 'End Date is required for Custom Period' }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField {...field} type="date" label="End Date" fullWidth margin="dense" error={!!error} helperText={error?.message} InputLabelProps={{ shrink: true }} />
                                )}
                            />
                        )}
                    </Box>

                     <Controller
                        name="totalLimit"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} type="number" label="Overall Limit (Optional)" fullWidth margin="dense" />
                        )}
                    />

                    <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Budget Items (Categories)</Typography>
                    
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Category</TableCell>
                                <TableCell>Limit</TableCell>
                                <TableCell width={50}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {fields.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Controller
                                            name={`items.${index}.categoryId`}
                                            control={control}
                                            rules={{ required: true }}
                                            render={({ field }) => (
                                                <TextField {...field} select fullWidth size="small">
                                                    {categories.map(c => <MenuItem key={c.categoryId} value={c.categoryId}>{c.name}</MenuItem>)}
                                                </TextField>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Controller
                                            name={`items.${index}.limitAmount`}
                                            control={control}
                                            rules={{ required: true, min: 0.01 }}
                                            render={({ field }) => (
                                                <TextField {...field} type="number" fullWidth size="small" />
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small" onClick={() => remove(index)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Button 
                        startIcon={<AddIcon />} 
                        onClick={() => append({ categoryId: '', limitAmount: '' })}
                        sx={{ mt: 1 }}
                    >
                        Add Category
                    </Button>

                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained">Save</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default BudgetDialog;
