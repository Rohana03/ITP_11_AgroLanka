import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // Validate token and get user data
            fetch('http://localhost:5000/api/auth/me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Token invalid');
                })
                .then(userData => {
                    setUser(userData);
                    setLoading(false);
                })
                .catch(() => {
                    logout();
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (email, password) => {
        console.log('🔐 Login attempt:', email);
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('📥 Login response:', data);

        if (response.ok) {
            localStorage.setItem('token', data.token);
            setToken(data.token);
            setUser(data);
            console.log('✅ User state set:', data);
            console.log('✅ User role:', data.role);
            return { success: true, user: data };
        } else {
            console.error('❌ Login failed:', data.message);
            return { success: false, message: data.message };
        }
    };

    const register = async (name, email, nic, password, role) => {
        console.log('📝 Register attempt:', { name, email, role });
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, nic, password, role })
        });

        const data = await response.json();
        console.log('📥 Register response:', data);

        if (response.ok) {
            localStorage.setItem('token', data.token);
            setToken(data.token);
            setUser(data);
            console.log('✅ User state set:', data);
            console.log('✅ User role:', data.role);
            return { success: true };
        } else {
            console.error('❌ Registration failed:', data.message);
            return { success: false, message: data.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
