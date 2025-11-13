import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear localStorage on app start for fresh login each time
    // Uncomment the line below if you want to clear login on every app restart
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // If you want to keep persistence, uncomment this instead:
    // const token = localStorage.getItem('token');
    // const userData = localStorage.getItem('user');
    // if (token && userData) {
    //   setUser(JSON.parse(userData));
    //   axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // }
    
    setLoading(false);
  }, []);

  const login = async (aadhar_id, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        aadhar_id,
        password
      });

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}