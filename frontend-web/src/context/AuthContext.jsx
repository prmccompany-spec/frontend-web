import React, { createContext, useState, useCallback, useEffect } from 'react';
import authService from '../services/authService';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [routePermissions, setRoutePermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/route-permissions')
      .then((res) => setRoutePermissions(res.data.data ?? []))
      .catch(() => {});
  }, []);

  const login = useCallback(async (phone, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(phone, password);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid phone number or password';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (oldPassword, newPassword) => {
    return await authService.resetPassword(oldPassword, newPassword);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const canAccess = useCallback(
    (routeKey) => {
      const perm = routePermissions.find((p) => p.route_key === routeKey);
      if (!perm) return true;
      if (perm.require_login && !isAuthenticated) return false;
      const allowedIds =
        typeof perm.allowed_type_ids === 'string'
          ? JSON.parse(perm.allowed_type_ids)
          : perm.allowed_type_ids ?? [];
      if (allowedIds.length > 0) {
        return !!user && allowedIds.includes(user.user_type_id);
      }
      return true;
    },
    [routePermissions, isAuthenticated, user]
  );

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, routePermissions, loading, error, login, resetPassword, logout, canAccess }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
