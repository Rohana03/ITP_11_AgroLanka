import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

<<<<<<< HEAD
export const AuthProvider = ({ children }) => {
=======
const AuthProvider = ({ children }) => {
>>>>>>> 9b47020 (solved)
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

<<<<<<< HEAD
    useEffect(() => {
        if (token) {
            // Validate token and get user data
=======
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    useEffect(() => {
        let isMounted = true;
        if (token) {
>>>>>>> 9b47020 (solved)
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
<<<<<<< HEAD
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
=======
                    if (isMounted) {
                        setUser(userData);
                        setLoading(false);
                    }
                })
                .catch(() => {
                    if (isMounted) {
                        logout();
                        setLoading(false);
                    }
                });
        } else {
            // Delay to avoid synchronous state update warning
            const timer = setTimeout(() => {
                if (isMounted) setLoading(false);
            }, 0);
            return () => clearTimeout(timer);
        }
        return () => { isMounted = false; };
    }, [token]);

    const login = async (email, password) => {
>>>>>>> 9b47020 (solved)
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
<<<<<<< HEAD
        console.log('📥 Login response:', data);
=======
>>>>>>> 9b47020 (solved)

        if (response.ok) {
            localStorage.setItem('token', data.token);
            setToken(data.token);
            setUser(data);
<<<<<<< HEAD
            console.log('✅ User state set:', data);
            console.log('✅ User role:', data.role);
            return { success: true, user: data };
        } else {
            console.error('❌ Login failed:', data.message);
=======
            return { success: true, user: data };
        } else {
>>>>>>> 9b47020 (solved)
            return { success: false, message: data.message };
        }
    };

<<<<<<< HEAD
    const register = async (name, email, nic, password, role, assignedAsc, specialization) => {
        console.log('📝 Register attempt:', { name, email, role, assignedAsc, specialization });
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, nic, password, role, assignedAsc, specialization })
        });

        const data = await response.json();
        console.log('📥 Register response:', data);

        if (response.ok) {
            console.log('✅ Registration successful');
            return { success: true };
        } else {
            console.error('❌ Registration failed:', data.message);
=======
    const register = async (name, email, nic, password, role) => {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, nic, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            setToken(data.token);
            setUser(data);
            return { success: true };
        } else {
>>>>>>> 9b47020 (solved)
            return { success: false, message: data.message };
        }
    };

<<<<<<< HEAD
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const updateUser = (userData) => {
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading, updateUser }}>
=======


    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
>>>>>>> 9b47020 (solved)
            {children}
        </AuthContext.Provider>
    );
};

<<<<<<< HEAD
export const useAuth = () => useContext(AuthContext);
=======
const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };
>>>>>>> 9b47020 (solved)
