import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('transitsync_user');
    const token = localStorage.getItem('transitsync_token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('transitsync_user');
        localStorage.removeItem('transitsync_token');
      }
    }
    setLoading(false);
  }, []);

  const loginCustomer = async (email, password) => {
    const res = await api.post('/auth/customer/login', { email, password });
    const authData = res.data;
    localStorage.setItem('transitsync_token', authData.token);
    localStorage.setItem('transitsync_user', JSON.stringify(authData));
    setUser(authData);
    return authData;
  };

  const loginAdmin = async (email, password) => {
    const res = await api.post('/auth/admin/login', { email, password });
    const authData = res.data;
    localStorage.setItem('transitsync_token', authData.token);
    localStorage.setItem('transitsync_user', JSON.stringify(authData));
    setUser(authData);
    return authData;
  };

  const registerCustomer = async (data) => {
    const res = await api.post('/auth/customer/register', data);
    const authData = res.data;
    localStorage.setItem('transitsync_token', authData.token);
    localStorage.setItem('transitsync_user', JSON.stringify(authData));
    setUser(authData);
    return authData;
  };

  const logout = () => {
    localStorage.removeItem('transitsync_token');
    localStorage.removeItem('transitsync_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      loginCustomer,
      loginAdmin,
      registerCustomer,
      logout,
      isAdmin: user?.role === 'ROLE_ADMIN',
      isCustomer: user?.role === 'ROLE_CUSTOMER'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
