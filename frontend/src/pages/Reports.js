import React, { useState } from 'react';
import { 
    Box, Typography, Button, Grid, Paper, FormControl, 
    InputLabel, Select, MenuItem, TextField 
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ExportService from '../api/exportService';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
    const { user } = useAuth();
    const [format, setFormat] = useState('CSV');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleExport = async (type) => {
        setMessage({ type: 'info', text: 'Exporting...' });
        const payload = {
            userId: user.userId,
            format: format,
            startDate: startDate || null,
            endDate: endDate || null
        };

        try {
            switch (type) {
                case 'TRANSACTIONS':
                    await ExportService.exportTransactions(payload);
                    break;
                case 'ACCOUNTS':
                    await ExportService.exportAccounts({ ...payload, startDate: null, endDate: null });
                    break;
                case 'BUDGETS':
                    await ExportService.exportBudgets({ ...payload, startDate: null, endDate: null });
                    break;
                case 'CATEGORIES':
                    await ExportService.exportCategories({ ...payload, startDate: null, endDate: null });
                    break;
                case 'ALL':
                    await ExportService.exportAll({ ...payload, format: 'JSON' });
                    break;
                default:
                    break;
            }
            setMessage({ type: 'success', text: 'Export started successfully' });
        } catch (error) {
            console.error("Export failed", error);
            setMessage({ type: 'error', text: 'Export failed. Please check backend logs.' });
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Reports & Export</Typography>
            
            {message.text && (
                <Typography color={message.type === 'error' ? 'error' : 'primary'} sx={{ mb: 2 }}>
                    {message.text}
                </Typography>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Export Settings</Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Format</InputLabel>
                            <Select
                                value={format}
                                label="Format"
                                onChange={(e) => setFormat(e.target.value)}
                            >
                                <MenuItem value="CSV">CSV</MenuItem>
                                <MenuItem value="EXCEL">Excel</MenuItem>
                                <MenuItem value="PDF">PDF</MenuItem>
                                <MenuItem value="JSON">JSON</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            label="Start Date"
                            type="date"
                            size="small"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            label="End Date"
                            type="date"
                            size="small"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Transactions Report</Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Export detailed transaction history with filters applied.
                        </Typography>
                        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('TRANSACTIONS')}>
                            Export Transactions
                        </Button>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Accounts Data</Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Export list of all accounts and current balances.
                        </Typography>
                        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('ACCOUNTS')}>
                            Export Accounts
                        </Button>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Budgets Overview</Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Export budget configurations and limits.
                        </Typography>
                        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('BUDGETS')}>
                            Export Budgets
                        </Button>
                    </Paper>
                </Grid>
                 <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>System Backup</Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Full system backup in JSON format (includes all data).
                        </Typography>
                        <Button variant="contained" color="warning" startIcon={<DownloadIcon />} onClick={() => handleExport('ALL')}>
                            Export Everything (Backup)
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Reports;
