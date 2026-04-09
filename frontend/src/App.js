import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './js/Login';
import AdminPanel from './js/AdminPanel';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (isAuthenticated) {
        try {
          await logout();
        } catch (error) {
          console.error('Error al cerrar sesión:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated, logout]);

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/admin" />} />
      <Route path="/admin" element={isAuthenticated ? <AdminPanel /> : <Navigate to="/login" />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? '/admin' : '/login'} />} />
      <Route path="*" element={<Navigate to={isAuthenticated ? '/admin' : '/login'} />} />
    </Routes>
  );
}

export default App;
