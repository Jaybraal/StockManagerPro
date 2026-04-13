import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const storedRole = localStorage.getItem('userRole');
      const storedUser = localStorage.getItem('user');

      if (token) {
        setIsAuthenticated(true);
        setRole(storedRole);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            setUser({ role: storedRole });
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (userRole, userData = null) => {
    setIsAuthenticated(true);
    setRole(userRole);
    setUser(userData || { role: userRole });
    localStorage.setItem('userRole', userRole);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
  };

  const isSuperAdmin = role === 'superadmin' || (user && user.role === 'superadmin');

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, user, loading, login, logout, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 