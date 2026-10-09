import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(localStorage.getItem('role') || null);
    const [tenantId, setTenantId] = useState(localStorage.getItem('tenantId') || null);
    const [storeName, setStoreName] = useState(localStorage.getItem('storeName') || '');
    const [tenantSettings, setTenantSettings] = useState(
        localStorage.getItem('tenantSettings') ? JSON.parse(localStorage.getItem('tenantSettings')) : null
    );
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await loginApi(email, password);
        const data = res.data;
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        if (data.tenantId) localStorage.setItem('tenantId', data.tenantId);
        if (data.storeName) localStorage.setItem('storeName', data.storeName);
        if (data.tenantSettings) localStorage.setItem('tenantSettings', JSON.stringify(data.tenantSettings));

        const userInfo = {
            id: data.userId,
            userId: data.userId,
            fullName: data.fullName,
            email: data.email
        };
        localStorage.setItem('user', JSON.stringify(userInfo));

        setUser(userInfo);
        setRole(data.role);
        setTenantId(data.tenantId);
        setStoreName(data.storeName);
        setTenantSettings(data.tenantSettings);
        return data;
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
        setRole(null);
        setTenantId(null);
        setStoreName('');
        setTenantSettings(null);
    };

    const isSuperAdmin = () => role === 'ROLE_SUPER_ADMIN';
    const isStoreAdmin = () => role === 'ROLE_STORE_ADMIN';
    const isCashier = () => role === 'ROLE_CASHIER';
    const isInventoryManager = () => role === 'ROLE_INVENTORY_MANAGER';

    return (
        <AuthContext.Provider value={{
            user,
            role,
            tenantId,
            storeName,
            tenantSettings,
            setTenantSettings,
            loading,
            login,
            logout,
            isSuperAdmin,
            isStoreAdmin,
            isCashier,
            isInventoryManager
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);