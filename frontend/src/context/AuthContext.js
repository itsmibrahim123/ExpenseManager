import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthService from '../api/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const data = await AuthService.login(email, password);
            setUser(data);
            return data;
        } catch (error) {
            throw error;
        }
    };

    const loginAsGuest = async () => {
        try {
            // Use credentials from DataSeeder
            console.log("Attempting guest login...");
            const data = await AuthService.login('guest@example.com', 'guest123');
            console.log("Guest login successful", data);
            setUser(data);
            return data;
        } catch (error) {
            console.error("Guest login failed details:", error.response ? error.response.data : error.message);
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            return await AuthService.register(userData);
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        AuthService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, loginAsGuest, logout, register, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);