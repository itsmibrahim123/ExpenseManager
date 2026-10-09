import React from 'react';
import { Box, Typography, Divider, Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { useTenant } from '../../context/TenantContext';

const ThermalReceipt = ({ invoice, onPrint }) => {
    const tenantBrand = useTenant();
    if (!invoice) return null;

    const handlePrint = () => {
        if (onPrint) {
            onPrint();
        } else {
            window.print();
        }
    };

    return (
        <Box sx={{ width: '100%', maxWidth: '350px', margin: '0 auto', p: 1 }}>
            <Box className="no-print" sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<PrintIcon />} 
                    onClick={handlePrint}
                    size="small"
                >
                    Print Thermal Receipt
                </Button>
            </Box>

            <Box 
                id="thermal-receipt-content"
                sx={{
                    fontFamily: '"Courier New", Courier, monospace',
                    backgroundColor: '#fff',
                    color: '#000',
                    p: 2,
                    border: '1px dashed #ccc',
                    fontSize: '12px',
                    lineHeight: 1.4,
                    '& *': { fontFamily: '"Courier New", Courier, monospace !important' }
                }}
            >
                {/* Dynamic Store Header */}
                <Box textAlign="center" mb={1}>
                    {tenantBrand.logoUrl && (
                        <Box component="img" src={tenantBrand.logoUrl} alt="Store Logo" sx={{ maxHeight: 40, mb: 1 }} />
                    )}
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase' }}>
                        {tenantBrand.storeName}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '11px', whiteSpace: 'pre-line' }}>
                        {tenantBrand.receiptHeader}
                    </Typography>
                    {tenantBrand.taxNumber && (
                        <Typography variant="body2" sx={{ fontSize: '10px' }}>
                            Tax Reg #: {tenantBrand.taxNumber}
                        </Typography>
                    )}
                </Box>

                <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#000' }} />

                {/* Meta */}
                <Box sx={{ fontSize: '11px', mb: 1 }}>
                    <Box display="flex" justifyContent="space-between">
                        <span>Invoice #:</span>
                        <strong>{invoice.invoiceNumber}</strong>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                        <span>Date:</span>
                        <span>{new Date(invoice.invoiceDate || invoice.createdAt).toLocaleString()}</span>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                        <span>Customer:</span>
                        <span>{invoice.customerName || 'Walk-in Customer'}</span>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                        <span>Payment:</span>
                        <span>{invoice.paymentMethod}</span>
                    </Box>
                </Box>

                <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#000' }} />

                {/* Items Table */}
                <Box sx={{ mb: 1 }}>
                    <Box display="flex" justifyContent="space-between" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        <span style={{ flex: 2 }}>Item</span>
                        <span style={{ flex: 1, textAlign: 'center' }}>Qty</span>
                        <span style={{ flex: 1, textAlign: 'right' }}>Total</span>
                    </Box>

                    {invoice.items && invoice.items.map((item, idx) => (
                        <Box key={idx} sx={{ mb: 0.5 }}>
                            <Box display="flex" justifyContent="space-between">
                                <span style={{ flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.productName}
                                </span>
                                <span style={{ flex: 1, textAlign: 'center' }}>{item.quantity}</span>
                                <span style={{ flex: 1, textAlign: 'right' }}>
                                    Rs. {Number(item.lineTotal).toLocaleString()}
                                </span>
                            </Box>
                            <Box sx={{ fontSize: '10px', color: '#444', pl: 1 }}>
                                @ Rs. {Number(item.unitPrice).toLocaleString()}
                                {Number(item.discountAmount) > 0 && ` (Disc: Rs.${item.discountAmount})`}
                            </Box>
                        </Box>
                    ))}
                </Box>

                <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#000' }} />

                {/* Financial Summary */}
                <Box sx={{ fontSize: '11px', mb: 1 }}>
                    <Box display="flex" justifyContent="space-between">
                        <span>Subtotal:</span>
                        <span>Rs. {Number(invoice.subtotal).toLocaleString()}</span>
                    </Box>
                    {Number(invoice.taxTotal) > 0 && (
                        <Box display="flex" justifyContent="space-between">
                            <span>Tax / VAT:</span>
                            <span>Rs. {Number(invoice.taxTotal).toLocaleString()}</span>
                        </Box>
                    )}
                    {Number(invoice.discountTotal) > 0 && (
                        <Box display="flex" justifyContent="space-between">
                            <span>Discount:</span>
                            <span>- Rs. {Number(invoice.discountTotal).toLocaleString()}</span>
                        </Box>
                    )}
                    <Box display="flex" justifyContent="space-between" sx={{ fontWeight: 'bold', fontSize: '13px', mt: 0.5 }}>
                        <span>GRAND TOTAL:</span>
                        <span>Rs. {Number(invoice.grandTotal).toLocaleString()}</span>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                        <span>Paid Amount:</span>
                        <span>Rs. {Number(invoice.paidAmount).toLocaleString()}</span>
                    </Box>
                    {Number(invoice.balanceDue) > 0 && (
                        <Box display="flex" justifyContent="space-between" sx={{ color: 'red', fontWeight: 'bold' }}>
                            <span>Balance Due:</span>
                            <span>Rs. {Number(invoice.balanceDue).toLocaleString()}</span>
                        </Box>
                    )}
                </Box>

                <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#000' }} />

                {/* Dynamic Store Footer */}
                <Box textAlign="center" mt={1}>
                    <Typography variant="body2" sx={{ fontSize: '10px', tracking: '2px', fontFamily: 'monospace' }}>
                        ||||| |||||| |||||||| |||||
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '10px', mt: 0.5, whiteSpace: 'pre-line' }}>
                        {tenantBrand.receiptFooter}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default ThermalReceipt;
