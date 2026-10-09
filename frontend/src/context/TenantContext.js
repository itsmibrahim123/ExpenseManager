import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
    const { storeName, tenantSettings } = useAuth();

    const tenantBrand = {
        storeName: storeName || 'ExpenseManager ERP',
        taxNumber: tenantSettings?.taxNumber || 'TAX-STORE-0001',
        taxRateDefault: tenantSettings?.taxRateDefault || 0,
        receiptHeader: tenantSettings?.receiptHeader || (storeName || 'ExpenseManager POS Retail Store'),
        receiptFooter: tenantSettings?.receiptFooter || 'Thank you for shopping with us!\nPlease come again.',
        logoUrl: tenantSettings?.logoUrl || null,
        allowNegativeStock: tenantSettings?.allowNegativeStock || false
    };

    return (
        <TenantContext.Provider value={tenantBrand}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => useContext(TenantContext);
