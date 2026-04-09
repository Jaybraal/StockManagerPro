import React from 'react';
import { ErrorProvider } from './ErrorContext';
import AdminDashboard from './AdminPanel';
import InvoiceView from './InvoiceView';
import SupplierDetailPage from './SupplierDetailPage';
import Login from './Login';
import PrivateRoute from './PrivateRoute';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <ErrorProvider>
      <div className="app">
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
            <Route path="/supplier/:id" element={<PrivateRoute><SupplierDetailPage /></PrivateRoute>} />
            <Route path="/facturas/:tenantId/:saleId" element={<PrivateRoute><InvoiceView /></PrivateRoute>} />
            <Route path="*" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
          </Routes>
        </Router>
      </div>
    </ErrorProvider>
  );
}

export default App; 