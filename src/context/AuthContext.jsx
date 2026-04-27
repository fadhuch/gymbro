import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAndStoreMembership = async () => {
    try {
      const res = await api.get('/auth/me');
      setMembership(res.data.user?.membership ?? null);
    } catch {
      // silently ignore — membership stays null
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (accessToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          await fetchAndStoreMembership();
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const register = async (data) => {
    try {
      const response = await api.post('/auth/register', data);
      const { accessToken, refreshToken, role, firstname, lastname, priority } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      const userData = { role, firstname, lastname, priority, email: data.email };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      await fetchAndStoreMembership();

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, role, firstname, lastname, priority } = response.data;

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Create user object
      const userData = {
        role,
        firstname,
        lastname,
        priority,
        email,
      };

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      await fetchAndStoreMembership();

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setMembership(null);
  };

  // true if role is not 'user', OR if membership is active and not expired
  const isMembershipActive = (() => {
    if (!user) return false;
    if (user.role !== 'user') return true;
    if (!membership?.isActive) return false;
    if (!membership?.endDate) return false;
    return new Date(membership.endDate) >= new Date();
  })();

  const value = {
    user,
    membership,
    isMembershipActive,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
