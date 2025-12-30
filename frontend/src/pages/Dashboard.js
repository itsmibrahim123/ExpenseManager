import React, { useEffect, useState } from 'react';
import { 
    Typography, Grid, Paper, Box, Divider, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Chip, CircularProgress 
} from '@mui/material';
import DashboardService from '../api/dashboardService';
import { useAuth } from '../context/AuthContext';
import '../utils/chartSetup'; // Register charts
import { format } from 'date-fns';

const SummaryCard = ({ title, value, color, currency = 'PKR' }) => (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140, borderTop: `4px solid ${color}` }}>
        <Typography component="h2" variant="h6" color="text.secondary" gutterBottom>
            {title}
        </Typography>
        <Typography component="p" variant="h4" sx={{ mt: 'auto', fontWeight: 'bold' }}>
            {currency} {value?.toLocaleString()}
        </Typography>
    </Paper>
);

const Dashboard = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await DashboardService.getSummary(user.userId);
                setSummary(data);
            } catch (err) {
                setError('Failed to load dashboard data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    if (error) return <Typography color="error">{error}</Typography>;
    if (!summary) return null;

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 300 }}>
                Financial Overview <Typography component="span" variant="h6" color="textSecondary">| {summary.periodDescription}</Typography>
            </Typography>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard title="Total Balance" value={summary.totalBalance} color="#0a6ed1" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard title="Total Income" value={summary.totalIncome} color="#107e3e" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard title="Total Expenses" value={summary.totalExpense} color="#bb0000" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard title="Net Savings" value={summary.netSavings} color={summary.netSavings >= 0 ? "#107e3e" : "#bb0000"} />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Recent Transactions */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography component="h2" variant="h6" gutterBottom color="primary">
                            Recent Transactions
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell>Category</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                        <TableCell>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {summary.recentTransactions?.map((row) => (
                                        <TableRow key={row.transactionId}>
                                            <TableCell>{format(new Date(row.transactionDate), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell>{row.description}</TableCell>
                                            <TableCell>{row.categoryName}</TableCell>
                                            <TableCell align="right" sx={{ 
                                                color: row.type === 'INCOME' ? 'success.main' : 'error.main',
                                                fontWeight: 'bold'
                                            }}>
                                                {row.type === 'INCOME' ? '+' : '-'}{row.currencyCode} {row.amount?.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={row.status} 
                                                    size="small" 
                                                    color={row.status === 'COMPLETED' ? 'success' : 'default'} 
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Accounts Overview */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography component="h2" variant="h6" gutterBottom color="primary">
                            My Accounts
                        </Typography>
                        <Box>
                            {summary.accounts?.map((acc) => (
                                <Box key={acc.accountId} sx={{ mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        {acc.accountName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {acc.institutionName}
                                    </Typography>
                                    <Typography variant="h6" align="right" color="primary">
                                        {acc.currencyCode} {acc.balance?.toLocaleString()}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;