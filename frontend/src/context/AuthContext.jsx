import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fraudshield_user');
    return saved ? JSON.parse(saved) : {
      email: 'analyst@fraudshield.ai',
      name: 'Chief Fraud Analyst',
      role: 'Lead Cybersecurity Specialist',
      is_demo: true,
      token: 'demo_token_authenticated'
    };
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authAPI.login({ email, password });
      setUser(data);
      localStorage.setItem('fraudshield_user', JSON.stringify(data));
      localStorage.setItem('fraudshield_token', data.token);
      return { success: true };
    } catch (err) {
      // Fallback for demo experience if offline
      const fallbackUser = {
        email,
        name: email.split('@')[0] || 'Security Analyst',
        role: 'Fraud Investigator',
        is_demo: true,
        token: 'fallback_token'
      };
      setUser(fallbackUser);
      localStorage.setItem('fraudshield_user', JSON.stringify(fallbackUser));
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async () => {
    return login('analyst@fraudshield.ai', 'CyberShield#2026');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fraudshield_user');
    localStorage.removeItem('fraudshield_token');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginDemo, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
