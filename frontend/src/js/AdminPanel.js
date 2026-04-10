/**
 * AdminPanel - Main admin dashboard component
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Hooks
import { useProducts, useUsers, useSuppliers, useDashboard, useConfig } from '../hooks';
import { useAuth } from '../contexts/AuthContext';

// Layout
import { AdminLayout } from '../components/Layout';

// Components
import Dashboard from '../components/Dashboard';
import Products from '../components/Products';
import Categories from '../components/Categories';
import Users from '../components/Users';
import Suppliers from '../components/Suppliers';
import Settings from '../components/Settings';
import Reports from '../components/Reports';
import { ConfirmDialog } from '../components/common';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const navigate = useNavigate();
  const { logout } = useAuth();

  const {
    products,
    categories,
    loading: productsLoading,
    error: productsError,
    fetchProducts,
    fetchCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    deleteCategory,
    getLowStockProducts
  } = useProducts();

  const {
    users,
    loading: usersLoading,
    error: usersError,
    createUser,
    updateUser,
    deleteUser,
    updateAdminCredentials
  } = useUsers();

  const {
    suppliers,
    filteredSuppliers,
    loading: suppliersLoading,
    error: suppliersError,
    searchTerm: supplierSearchTerm,
    setSearchTerm: setSupplierSearchTerm,
    statusFilter: supplierStatusFilter,
    setStatusFilter: setSupplierStatusFilter,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierInvoices
  } = useSuppliers();

  const dashboardData = useDashboard();

  const {
    config,
    updateConfig
  } = useConfig();

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const tid = localStorage.getItem('adminTenantId');
    if (!token || !tid) {
      navigate('/login');
    }
  }, [navigate]);

  // Flatten products across categories for dashboard
  const allProducts = (categories || []).reduce((acc, cat) => {
    if (Array.isArray(cat.products)) return acc.concat(cat.products);
    return acc;
  }, []);

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });

  const handleDeleteProduct = (productId) => {
    showConfirm(
      'Eliminar Producto',
      '¿Estas seguro de que deseas eliminar este producto? Esta accion no se puede deshacer.',
      async () => {
        try { await deleteProduct(productId); } catch (_) {}
        closeConfirm();
      }
    );
  };

  const handleDeleteCategory = (categoryId) => {
    showConfirm(
      'Eliminar Categoria',
      '¿Estas seguro de que deseas eliminar esta categoria? Todos los productos asociados seran eliminados.',
      async () => {
        try { await deleteCategory(categoryId); } catch (_) {}
        closeConfirm();
      }
    );
  };

  const handleDeleteUser = (userId) => {
    showConfirm(
      'Eliminar Usuario',
      '¿Estas seguro de que deseas eliminar este usuario?',
      async () => {
        try { await deleteUser(userId); } catch (_) {}
        closeConfirm();
      }
    );
  };

  const handleDeleteSupplier = (supplierId) => {
    showConfirm(
      'Eliminar Proveedor',
      '¿Estas seguro de que deseas eliminar este proveedor?',
      async () => {
        try { await deleteSupplier(supplierId); } catch (_) {}
        closeConfirm();
      }
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            dashboardData={{
              ...dashboardData,
              allProducts,
              categoriesCount: (categories || []).length
            }}
            users={users}
            lowStockProducts={getLowStockProducts()}
            onViewStockAlerts={() => setActiveTab('inventory')}
          />
        );

      case 'users':
        return (
          <Users
            users={users}
            loading={usersLoading}
            error={usersError}
            onAddUser={createUser}
            onEditUser={updateUser}
            onDeleteUser={handleDeleteUser}
          />
        );

      case 'inventory':
        if (selectedCategory) {
          return (
            <Products
              products={products}
              categories={categories}
              loading={productsLoading}
              error={productsError}
              onAddProduct={createProduct}
              onEditProduct={updateProduct}
              onDeleteProduct={handleDeleteProduct}
              selectedCategory={selectedCategory}
              onBackToCategories={() => setSelectedCategory(null)}
            />
          );
        }
        return (
          <Categories
            categories={categories}
            loading={productsLoading}
            onAddCategory={createCategory}
            onDeleteCategory={handleDeleteCategory}
            onSelectCategory={setSelectedCategory}
          />
        );

      case 'suppliers':
        return (
          <Suppliers
            suppliers={suppliers}
            filteredSuppliers={filteredSuppliers}
            loading={suppliersLoading}
            error={suppliersError}
            searchTerm={supplierSearchTerm}
            setSearchTerm={setSupplierSearchTerm}
            statusFilter={supplierStatusFilter}
            setStatusFilter={setSupplierStatusFilter}
            onCreateSupplier={createSupplier}
            onEditSupplier={updateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onViewSupplierInvoices={getSupplierInvoices}
          />
        );

      case 'reports':
        return <Reports />;

      case 'settings':
        return (
          <Settings
            config={config}
            onConfigChange={updateConfig}
            onUpdateAdminCredentials={updateAdminCredentials}
          />
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}

      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </AdminLayout>
  );
}
