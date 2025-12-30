import React, { useEffect, useState } from 'react';
import { 
    Box, Typography, Tabs, Tab, Paper, List, ListItem, ListItemText, 
    IconButton, TextField, Button, Dialog, DialogTitle, DialogContent, 
    DialogActions, Chip, Switch
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../context/AuthContext';
import CategoriesService from '../api/categoriesService';
import MerchantsService from '../api/merchantsService';
import PaymentMethodsService from '../api/paymentMethodsService';
import TagsService from '../api/tagsService';

const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ padding: '24px 0' }}>
        {value === index && children}
    </div>
);

const SimpleCrud = ({ title, service, user, fields = ['name'] }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [newItem, setNewItem] = useState({});

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await service.getAll(user.userId);
            setItems(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchItems();
    }, [user]);

    const handleCreate = async () => {
        try {
            await service.create({ ...newItem, userId: user.userId });
            setOpen(false);
            setNewItem({});
            fetchItems();
        } catch (error) {
            alert('Failed to create');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this item?')) {
            try {
                const idField = title === 'Categories' ? 'categoryId' : (title === 'Merchants' ? 'merchantId' : (title === 'Payment Methods' ? 'paymentMethodId' : 'tagId'));
                // Wait, response DTOs have specific IDs. I need to be careful.
                // Categories: categoryId. Merchants: merchantId. PaymentMethods: paymentMethodId. Tags: tagId.
                // The service.delete takes an ID.
                await service.delete(id);
                fetchItems();
            } catch (error) {
                alert('Failed to delete');
            }
        }
    };

    const getId = (item) => {
        if (title === 'Categories') return item.categoryId;
        if (title === 'Merchants') return item.merchantId;
        if (title === 'Payment Methods') return item.paymentMethodId;
        if (title === 'Tags') return item.tagId;
        return item.id;
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">{title}</Typography>
                <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setOpen(true)}>Add New</Button>
            </Box>
            <Paper>
                <List>
                    {loading ? (
                        <ListItem><ListItemText primary="Loading..." /></ListItem>
                    ) : (
                        items.length === 0 ? (
                            <ListItem><ListItemText primary="No items found" /></ListItem>
                        ) : (
                            items.map((item) => (
                                <ListItem key={getId(item)} secondaryAction={
                                    <IconButton edge="end" onClick={() => handleDelete(getId(item))}>
                                        <DeleteIcon />
                                    </IconButton>
                                }>
                                    <ListItemText 
                                        primary={item.name} 
                                        secondary={item.type ? `Type: ${item.type}` : (item.description || '')} 
                                    />
                                </ListItem>
                            ))
                        )
                    )}
                </List>
            </Paper>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Add {title}</DialogTitle>
                <DialogContent>
                    <TextField 
                        autoFocus
                        margin="dense"
                        label="Name"
                        fullWidth
                        value={newItem.name || ''}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                    {title === 'Categories' && (
                         <TextField 
                            select
                            margin="dense"
                            label="Type"
                            fullWidth
                            value={newItem.type || 'EXPENSE'}
                            onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                            SelectProps={{ native: true }}
                        >
                            <option value="EXPENSE">Expense</option>
                            <option value="INCOME">Income</option>
                        </TextField>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

const Settings = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState(0);

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Settings</Typography>
            <Tabs value={tab} onChange={(e, v) => setTab(v)}>
                <Tab label="Categories" />
                <Tab label="Merchants" />
                <Tab label="Payment Methods" />
                <Tab label="Tags" />
            </Tabs>

            <TabPanel value={tab} index={0}>
                <SimpleCrud title="Categories" service={CategoriesService} user={user} />
            </TabPanel>
            <TabPanel value={tab} index={1}>
                <SimpleCrud title="Merchants" service={MerchantsService} user={user} />
            </TabPanel>
            <TabPanel value={tab} index={2}>
                <SimpleCrud title="Payment Methods" service={PaymentMethodsService} user={user} />
            </TabPanel>
            <TabPanel value={tab} index={3}>
                <SimpleCrud title="Tags" service={TagsService} user={user} />
            </TabPanel>
        </Box>
    );
};

export default Settings;
