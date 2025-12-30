import React, { useEffect, useState } from 'react';
import { 
    Box, Typography, Button, Grid, Paper, Chip, 
    CircularProgress, IconButton, Collapse
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import BudgetsService from '../api/budgetsService';
import BudgetDialog from '../components/BudgetDialog';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const Budgets = () => {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [expandedBudget, setExpandedBudget] = useState(null); // ID of expanded budget

    const fetchBudgets = async () => {
        setLoading(true);
        try {
            const data = await BudgetsService.getAll(user.userId);
            setBudgets(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchBudgets();
    }, [user]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this budget?')) {
            try {
                await BudgetsService.delete(id);
                fetchBudgets();
            } catch (error) {
                alert('Failed to delete budget');
            }
        }
    };

    const handleExpand = async (id) => {
        if (expandedBudget === id) {
            setExpandedBudget(null);
        } else {
            setExpandedBudget(id);
            // If we needed to fetch items separately, we would do it here. 
            // But usually getAll returns simplified objects. 
            // For now, I won't fetch items for simplified view to save time, unless required.
            // Wait, I should probably fetch details to show items? 
            // The endpoint `/budgets/{id}` returns items. 
            // I'll implement a details fetch if I want to show items inside the card.
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Budgets</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
                    New Budget
                </Button>
            </Box>

            <BudgetDialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)} 
                onSuccess={fetchBudgets} 
            />

            {loading ? <CircularProgress /> : (
                <Grid container spacing={3}>
                    {budgets.map((budget) => (
                        <Grid item xs={12} md={6} lg={4} key={budget.id}>
                            <Paper sx={{ p: 2, position: 'relative' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Box>
                                        <Typography variant="h6">{budget.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {format(new Date(budget.startDate), 'MMM dd, yyyy')} - {budget.endDate ? format(new Date(budget.endDate), 'MMM dd, yyyy') : 'Ongoing'}
                                        </Typography>
                                    </Box>
                                    <Chip 
                                        label={budget.status} 
                                        color={budget.status === 'ACTIVE' ? 'success' : (budget.status === 'EXPIRED' ? 'error' : 'default')} 
                                        size="small" 
                                        variant="outlined"
                                    />
                                </Box>
                                
                                <Typography variant="h5" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                                    {budget.totalLimit ? `Limit: ${budget.totalLimit.toLocaleString()}` : 'No Overall Limit'}
                                </Typography>
                                <Typography variant="caption" display="block" gutterBottom>
                                    {budget.periodType}
                                </Typography>

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(budget.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                    {/* Expansion logic for items could go here */}
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default Budgets;
