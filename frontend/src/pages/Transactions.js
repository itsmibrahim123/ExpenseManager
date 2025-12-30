import React, { useEffect, useState, useCallback } from 'react';
import { 
    Box, Typography, Button, Paper, Grid, TextField, MenuItem, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
    Chip, IconButton, Collapse, Card, CardContent, CircularProgress, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import TransactionsService from '../api/transactionsService';
import AccountsService from '../api/accountsService';
import CategoriesService from '../api/categoriesService';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';
import TransactionDialog from '../components/TransactionDialog';

const Transactions = () => {
    const { user } = useAuth();
    const location = useLocation();
    const isTransferPage = location.pathname === '/transfers';
    
    const [transactions, setTransactions] = useState([]);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    
    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        accountId: '',
        categoryId: '',
        type: isTransferPage ? 'TRANSFER' : '',
        startDate: '',
        endDate: '',
        keyword: ''
    });

    // Reset filters if location changes (e.g. clicking sidebar from Transactions to Transfers)
    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            type: location.pathname === '/transfers' ? 'TRANSFER' : ''
        }));
        setPage(0);
    }, [location.pathname]);

    // Dropdown Data
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);

    // Fetch helpers
    const fetchMetadata = async () => {
        try {
            const [accData, catData] = await Promise.all([
                AccountsService.getAll(user.userId),
                CategoriesService.getAll(user.userId)
            ]);
            setAccounts(accData);
            setCategories(catData);
        } catch (err) {
            console.error("Failed to load metadata", err);
        }
    };

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const result = await TransactionsService.search({
                userId: user.userId,
                page,
                size: rowsPerPage,
                accountId: filters.accountId || null,
                categoryId: filters.categoryId || null,
                type: filters.type || null,
                startDate: filters.startDate || null,
                endDate: filters.endDate || null,
                keyword: filters.keyword || null
            });
            setTransactions(result.transactions);
            setTotalElements(result.totalElements);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [user.userId, page, rowsPerPage, filters]);

    useEffect(() => {
        if (user) {
            fetchMetadata();
            fetchTransactions();
        }
    }, [user, fetchTransactions]);

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleFilterChange = (prop) => (event) => {
        setFilters({ ...filters, [prop]: event.target.value });
        setPage(0); // Reset to first page on filter change
    };

    const clearFilters = () => {
        setFilters({
            accountId: '',
            categoryId: '',
            type: '',
            startDate: '',
            endDate: '',
            keyword: ''
        });
        setPage(0);
    };

    return (
        <Box>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">{isTransferPage ? 'Transfers' : 'Transactions'}</Typography>
                <Box>
                    <Button 
                        startIcon={<FilterListIcon />} 
                        onClick={() => setShowFilters(!showFilters)} 
                        sx={{ mr: 2 }}
                        variant="outlined"
                    >
                        {showFilters ? 'Hide Filters' : 'Filter'}
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
                        New Transaction
                    </Button>
                </Box>
            </Box>

            <TransactionDialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)} 
                onSuccess={() => {
                    fetchTransactions();
                    fetchMetadata(); // Refresh balances in background if we were showing them
                }} 
            />

            <Collapse in={showFilters}>
                <Card sx={{ mb: 3 }} variant="outlined">
                    <CardContent>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    select
                                    label="Account"
                                    fullWidth
                                    size="small"
                                    value={filters.accountId}
                                    onChange={handleFilterChange('accountId')}
                                >
                                    <MenuItem value=""><em>All Accounts</em></MenuItem>
                                    {accounts.map((acc) => (
                                        <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    select
                                    label="Category"
                                    fullWidth
                                    size="small"
                                    value={filters.categoryId}
                                    onChange={handleFilterChange('categoryId')}
                                >
                                    <MenuItem value=""><em>All Categories</em></MenuItem>
                                    {categories.map((cat) => (
                                        <MenuItem key={cat.categoryId} value={cat.categoryId}>{cat.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <TextField
                                    select
                                    label="Type"
                                    fullWidth
                                    size="small"
                                    value={filters.type}
                                    onChange={handleFilterChange('type')}
                                >
                                    <MenuItem value=""><em>All</em></MenuItem>
                                    <MenuItem value="EXPENSE">Expense</MenuItem>
                                    <MenuItem value="INCOME">Income</MenuItem>
                                    <MenuItem value="TRANSFER">Transfer</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    label="Search"
                                    fullWidth
                                    size="small"
                                    placeholder="Description..."
                                    value={filters.keyword}
                                    onChange={handleFilterChange('keyword')}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={1}>
                                <Button onClick={clearFilters} color="inherit" fullWidth>
                                    <ClearIcon />
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Collapse>

            <Paper sx={{ width: '100%', mb: 2 }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Account</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell align="right">Amount</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Ref #</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">No transactions found</TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((row) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell>{format(new Date(row.transactionDate), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell>{row.description}</TableCell>
                                        <TableCell>{row.accountName}</TableCell>
                                        <TableCell>{row.categoryName}</TableCell>
                                        <TableCell align="right" sx={{ 
                                            color: row.type === 'INCOME' ? 'success.main' : (row.type === 'EXPENSE' ? 'error.main' : 'info.main'),
                                            fontWeight: 'bold'
                                        }}>
                                            {row.type === 'INCOME' ? '+' : (row.type === 'EXPENSE' ? '-' : '')}
                                            {row.currencyCode} {row.amount?.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={row.status} 
                                                size="small" 
                                                color={row.status === 'COMPLETED' ? 'success' : 'default'} 
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>{row.referenceNumber || '-'}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={totalElements}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                />
            </Paper>
        </Box>
    );
};

export default Transactions;
