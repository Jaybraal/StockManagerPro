/**
 * AdminPanel - Main admin dashboard component
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Hooks
import { useProducts, useUsers, useSuppliers, useDashboard, useConfig, useMovements, useTenants } from '../hooks';
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
import Movements from '../components/Movements';
import Tenants from '../components/Tenants';
import { ConfirmDialog } from '../components/common';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const navigate = useNavigate();
  const { logout, isSuperAdmin } = useAuth();

  const {
    products, categories,
    loading: productsLoading, error: productsError,
    fetchProducts, fetchCategories,
    createProduct, updateProduct, deleteProduct,
    createCategory, deleteCategory,
    getLowStockProducts
  } = useProducts();

  const {
    users, loading: usersLoading, error: usersError,
    createUser, updateUser, deleteUser, updateAdminCredentials
  } = useUsers();

  const {
    suppliers, filteredSuppliers,
    loading: suppliersLoading, error: suppliersError,
    searchTerm: supplierSearchTerm, setSearchTerm: setSupplierSearchTerm,
    statusFilter: supplierStatusFilter, setStatusFilter: setSupplierStatusFilter,
    createSupplier, updateSupplier, deleteSupplier
  } = useSuppliers();

  const dashboardData = useDashboard();

  const {
    config, updateConfig
  } = useConfig();

  const {
    movements, loading: movementsLoading, fetchMovements, createMovement
  } = useMovements();

  const {
    tenants, allUsers, loading: tenantsLoading, fetchTenants, fetchAllUsers,
    createTenant, deleteTenant, createUserInTenant,
  } = useTenants(isSuperAdmin);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const tid = localStorage.getItem('adminTenantId');
    if (!token || !tid) navigate('/login');
  }, [navigate]);

  // Flatten products
  const allProducts = (categories || []).reduce((acc, cat) => {
    if (Array.isArray(cat.products)) return acc.concat(cat.products);
    return acc;
  }, []);

  const lowStockProducts = getLowStockProducts();

  // Stock movement handler (used by Products and Movements tabs)
  const handleStockMovement = async (data) => {
    try {
      await createMovement(data);
      await fetchProducts();
      await fetchCategories();
      const labels = { entrada: 'Entrada', salida: 'Salida', ajuste: 'Ajuste' };
      toast.success(`${labels[data.type] || 'Movimiento'} registrado correctamente`);
    } catch (err) {
      toast.error(err.message || 'Error al registrar movimiento');
      throw err;
    }
  };

  // Confirm helpers
  const showConfirm = (title, message, onConfirm) => setConfirmModal({ isOpen: true, title, message, onConfirm });
  const closeConfirm = () => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });

  const handleDeleteProduct = (id) => showConfirm('Eliminar Producto', '¿Seguro que deseas eliminar este producto?', async () => {
    try { await deleteProduct(id); } catch (_) {}
    closeConfirm();
  });
  const handleDeleteCategory = (id) => showConfirm('Eliminar Categoría', '¿Seguro? Todos los productos asociados serán eliminados.', async () => {
    try { await deleteCategory(id); } catch (_) {}
    closeConfirm();
  });
  const handleDeleteUser = (id) => showConfirm('Eliminar Usuario', '¿Seguro que deseas eliminar este usuario?', async () => {
    try { await deleteUser(id); } catch (_) {}
    closeConfirm();
  });
  const handleDeleteSupplier = (id) => showConfirm('Eliminar Proveedor', '¿Seguro que deseas eliminar este proveedor?', async () => {
    try { await deleteSupplier(id); } catch (_) {}
    closeConfirm();
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            dashboardData={{ ...dashboardData, allProducts, categoriesCount: (categories || []).length }}
            users={users}
            lowStockProducts={lowStockProducts}
            onViewStockAlerts={() => setActiveTab('inventory')}
            recentMovements={movements}
            onViewMovements={() => setActiveTab('movements')}
          />
        );

      case 'users':
        return (
          <Users
            users={isSuperAdmin ? allUsers : users}
            loading={isSuperAdmin ? tenantsLoading : usersLoading}
            error={usersError}
            onAddUser={isSuperAdmin
              ? (userData) => createUserInTenant(parseInt(userData.tenant_id), userData)
              : createUser
            }
            onEditUser={updateUser}
            onDeleteUser={handleDeleteUser}
            isSuperAdmin={isSuperAdmin}
            tenants={tenants}
          />
        );

      case 'inventory':
        if (selectedCategory) {
          return (
            <Products
              products={allProducts}
              categories={categories}
              loading={productsLoading}
              error={productsError}
              onAddProduct={createProduct}
              onEditProduct={updateProduct}
              onDeleteProduct={handleDeleteProduct}
              onStockMovement={handleStockMovement}
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

      case 'movements':
        return (
          <Movements
            movements={movements}
            loading={movementsLoading}
            onRefresh={fetchMovements}
            onCreateMovement={handleStockMovement}
            products={categories}
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

      case 'tenants':
        return isSuperAdmin ? (
          <Tenants
            tenants={tenants}
            allUsers={allUsers}
            loading={tenantsLoading}
            onCreateTenant={createTenant}
            onDeleteTenant={deleteTenant}
            onCreateUserInTenant={createUserInTenant}
            onRefresh={() => { fetchTenants(); fetchAllUsers(); }}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      setActiveTab={(tab) => { setActiveTab(tab); setSelectedCategory(null); }}
      lowStockCount={lowStockProducts.length}
    >
      {renderContent()}

      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </AdminLayout>
  );
}
