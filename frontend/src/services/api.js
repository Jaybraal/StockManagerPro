/**
 * Centralized API service for all backend calls
 */

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const getTenantId = () => localStorage.getItem('adminTenantId');

// Generic API call wrapper
const apiCall = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // flask-jwt-extended usa "msg", otros usan "message"
    const msg = errorData.message || errorData.msg || `Error ${response.status}`;

    if (response.status === 401) {
      // Sesión expirada → limpiar y redirigir al login
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminTenantId');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    throw new Error(msg);
  }

  return response.json();
};

// Products API
export const productsApi = {
  getAll: () => apiCall(`/api/products/${getTenantId()}`),

  create: (productData) => apiCall(`/api/products/${getTenantId()}`, {
    method: 'POST',
    body: JSON.stringify(productData)
  }),

  update: (productId, productData) => apiCall(`/api/products/${getTenantId()}/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  }),

  delete: (productId) => apiCall(`/api/products/${getTenantId()}/${productId}`, {
    method: 'DELETE'
  })
};

// Categories API
export const categoriesApi = {
  getAll: () => apiCall(`/api/categories/${getTenantId()}`),

  create: (categoryData) => apiCall(`/api/categories/${getTenantId()}`, {
    method: 'POST',
    body: JSON.stringify(categoryData)
  }),

  update: (categoryId, categoryData) => apiCall(`/api/categories/${getTenantId()}/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(categoryData)
  }),

  delete: (categoryId) => apiCall(`/api/categories/${getTenantId()}/${categoryId}`, {
    method: 'DELETE'
  })
};

// Users API
export const usersApi = {
  getAll: () => apiCall(`/api/users/${getTenantId()}`),

  create: (userData) => apiCall(`/api/users/${getTenantId()}`, {
    method: 'POST',
    body: JSON.stringify(userData)
  }),

  update: (userId, userData) => apiCall(`/api/users/${getTenantId()}/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),

  delete: (userId) => apiCall(`/api/users/${getTenantId()}/${userId}`, {
    method: 'DELETE'
  }),

  updateAdminCredentials: (credentials) => apiCall(`/api/users/${getTenantId()}/admin-credentials`, {
    method: 'PUT',
    body: JSON.stringify(credentials)
  }),

  resetPassword: (userId) => apiCall(`/api/users/${getTenantId()}/${userId}/reset-password`, {
    method: 'POST'
  })
};

// Suppliers API
export const suppliersApi = {
  getAll: () => apiCall(`/api/suppliers/${getTenantId()}`),

  create: (supplierData) => apiCall(`/api/suppliers/${getTenantId()}`, {
    method: 'POST',
    body: JSON.stringify(supplierData)
  }),

  update: (supplierId, supplierData) => apiCall(`/api/suppliers/${getTenantId()}/${supplierId}`, {
    method: 'PUT',
    body: JSON.stringify(supplierData)
  }),

  delete: (supplierId) => apiCall(`/api/suppliers/${getTenantId()}/${supplierId}`, {
    method: 'DELETE'
  })
};

// Movements API
export const movementsApi = {
  getAll: (limit = 50) => apiCall(`/api/movements/${getTenantId()}?limit=${limit}`),

  create: (movementData) => apiCall(`/api/movements/${getTenantId()}`, {
    method: 'POST',
    body: JSON.stringify(movementData)
  })
};

// Config API
export const configApi = {
  get: () => apiCall(`/api/config/${getTenantId()}`),

  update: (configData) => apiCall(`/api/config/${getTenantId()}`, {
    method: 'PUT',
    body: JSON.stringify(configData)
  })
};

// Notifications API
export const notificationsApi = {
  getAll: () => apiCall(`/api/notifications/${getTenantId()}`)
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    const tenantId = getTenantId();
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };

    const [usersRes, productsRes] = await Promise.all([
      fetch(`/api/users/${tenantId}`, { headers }),
      fetch(`/api/products/${tenantId}`, { headers })
    ]);

    const users = usersRes.ok ? await usersRes.json() : [];
    const categories = productsRes.ok ? await productsRes.json() : [];

    // Flatten products from categories
    const allProducts = categories.reduce((acc, category) => {
      if (Array.isArray(category.products)) {
        return acc.concat(category.products);
      }
      return acc;
    }, []);

    const lowStockProducts = allProducts.filter(p => p.stock <= p.stock_minimo);

    return {
      totalUsers: users.length,
      totalProducts: allProducts.length,
      categoriesCount: categories.length,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      allProducts
    };
  }
};

// Reports API
export const reportsApi = {
  downloadInventory: async (format) => {
    const tenantId = getTenantId();
    const token = localStorage.getItem('adminToken');

    const response = await fetch(`/api/reports/${tenantId}/inventory?format=${format}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Error generating report');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_report.${format}`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
};

// Tenants API (superadmin only)
export const tenantsApi = {
  getAll: () => apiCall('/api/tenants'),

  create: (data) => apiCall('/api/tenants', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  delete: (tenantId) => apiCall(`/api/tenants/${tenantId}`, {
    method: 'DELETE'
  }),

  getAllUsers: () => apiCall('/api/users/all'),

  createUserInTenant: (tenantId, userData) => apiCall(`/api/users/${tenantId}`, {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
};

export default {
  products: productsApi,
  categories: categoriesApi,
  users: usersApi,
  suppliers: suppliersApi,
  config: configApi,
  notifications: notificationsApi,
  dashboard: dashboardApi,
  reports: reportsApi,
  tenants: tenantsApi
};
