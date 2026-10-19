import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SIMULATED_USERS_DATA } from '../services/simulatedData';
import { authAPI } from '../services/api';

const AppContext = createContext(null);

export const SIMULATED_USERS = SIMULATED_USERS_DATA;

export const AppProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine view based on current path
  const isUserPath = location.pathname.startsWith('/user');
  const [currentView, setCurrentView] = useState(isUserPath ? 'user' : 'admin');

  // Authenticated state
  const [token, setToken] = useState(() => localStorage.getItem('payguard_token') || null);
  const [authUser, setAuthUser] = useState(() => {
    const saved = localStorage.getItem('payguard_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Selected simulated user account for testing ownership & data isolation
  const [selectedUserId, setSelectedUserId] = useState(() => {
    return localStorage.getItem('payguard_selected_user_id') || 'USR_1001';
  });

  // Keep view in sync with URL
  useEffect(() => {
    if (location.pathname.startsWith('/user')) {
      setCurrentView('user');
    } else if (location.pathname.startsWith('/admin')) {
      setCurrentView('admin');
    }
  }, [location.pathname]);

  // Check auth session on load
  useEffect(() => {
    if (token && !authUser) {
      authAPI.getMe()
        .then((profile) => {
          setAuthUser(profile);
          localStorage.setItem('payguard_auth_user', JSON.stringify(profile));
        })
        .catch(() => {
          // Token invalid or expired
          setToken(null);
          setAuthUser(null);
          localStorage.removeItem('payguard_token');
          localStorage.removeItem('payguard_auth_user');
        });
    }
  }, [token]);

  const currentUser = SIMULATED_USERS.find((u) => u.id === selectedUserId) || SIMULATED_USERS[0];

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    localStorage.setItem('payguard_selected_user_id', userId);
  };

  const login = async (username, password) => {
    try {
      const data = await authAPI.login(username, password);
      setToken(data.access_token);
      setAuthUser(data.user);
      localStorage.setItem('payguard_token', data.access_token);
      localStorage.setItem('payguard_auth_user', JSON.stringify(data.user));

      if (data.user.role === 'admin') {
        setCurrentView('admin');
        navigate('/admin/dashboard');
      } else {
        setCurrentView('user');
        handleSelectUser(data.user.user_id);
        navigate('/user/dashboard');
      }
      return { success: true, user: data.user };
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Invalid credentials.';
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    await authAPI.logout();
    setToken(null);
    setAuthUser(null);
    localStorage.removeItem('payguard_token');
    localStorage.removeItem('payguard_auth_user');
    navigate('/login');
  };

  const switchView = (targetView) => {
    if (targetView === 'user') {
      setCurrentView('user');
      navigate('/user/dashboard');
    } else {
      setCurrentView('admin');
      navigate('/admin/dashboard');
    }
  };

  // Administrator Profile
  const adminProfile = {
    name: authUser?.name || 'System Administrator',
    role: authUser?.role === 'admin' ? 'Lead Fraud Risk Specialist' : 'Analyst',
    department: 'Risk Operations',
    organization: 'PayGuard Defense Operations'
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        switchView,
        selectedUserId,
        setSelectedUserId: handleSelectUser,
        currentUser: authUser?.role === 'user' ? { ...currentUser, id: authUser.user_id, name: authUser.name } : currentUser,
        availableUsers: SIMULATED_USERS,
        adminProfile,
        token,
        authUser,
        isAuthenticated: !!token,
        login,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const useAuth = () => {
  const { adminProfile, currentUser, currentView, isAuthenticated, login, logout, authUser } = useApp();
  return {
    user: currentView === 'user' ? currentUser : adminProfile,
    authUser,
    isAuthenticated,
    login,
    logout,
  };
};

export default AppContext;
