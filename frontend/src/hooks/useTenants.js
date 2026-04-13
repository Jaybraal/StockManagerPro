import { useState, useCallback, useEffect } from 'react';
import { tenantsApi } from '../services/api';
import { toast } from 'react-toastify';

export const useTenants = (enabled = false) => {
  const [tenants, setTenants] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tenantsApi.getAll();
      setTenants(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllUsers = useCallback(async () => {
    try {
      const data = await tenantsApi.getAllUsers();
      setAllUsers(data);
    } catch (err) {
      console.error('Error fetching all users:', err);
    }
  }, []);

  const createTenant = useCallback(async (data) => {
    try {
      const result = await tenantsApi.create(data);
      toast.success(`Negocio "${data.name}" creado`);
      await fetchTenants();
      await fetchAllUsers();
      return result;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, [fetchTenants, fetchAllUsers]);

  const deleteTenant = useCallback(async (tenantId) => {
    try {
      await tenantsApi.delete(tenantId);
      setTenants(prev => prev.filter(t => t.id !== tenantId));
      toast.success('Negocio eliminado');
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, []);

  const createUserInTenant = useCallback(async (tenantId, userData) => {
    try {
      const result = await tenantsApi.createUserInTenant(tenantId, userData);
      toast.success('Usuario creado exitosamente');
      await fetchAllUsers();
      return result;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, [fetchAllUsers]);

  useEffect(() => {
    if (enabled) {
      fetchTenants();
      fetchAllUsers();
    }
  }, [enabled, fetchTenants, fetchAllUsers]);

  return {
    tenants,
    allUsers,
    loading,
    error,
    fetchTenants,
    fetchAllUsers,
    createTenant,
    deleteTenant,
    createUserInTenant,
  };
};

export default useTenants;
