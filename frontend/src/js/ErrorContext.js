import React, { createContext, useContext, useState } from 'react';

const ErrorContext = createContext();

export function ErrorProvider({ children }) {
  const [errors, setErrors] = useState([]);

  const addError = (error) => {
    // Solo agregar errores que afecten al frontend
    if (error.affectsFrontend) {
      setErrors(prev => [...prev, {
        id: Date.now(),
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        severity: error.severity || 'medium',
        component: error.component,
        affectsFrontend: true
      }]);
    }
  };

  const clearError = (errorId) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  };

  const clearAllErrors = () => {
    setErrors([]);
  };

  return (
    <ErrorContext.Provider value={{ errors, addError, clearError, clearAllErrors }}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError debe ser usado dentro de un ErrorProvider');
  }
  return context;
} 