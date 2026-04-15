import { useState, useCallback, useMemo, useEffect } from 'react';
import { suppliersApi } from '../services/api';
import { toast } from 'react-toastify';

/**
 * Custom hook for managing suppliers
 */
export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch all suppliers
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await suppliersApi.getAll();
      setSuppliers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create supplier
  const createSupplier = useCallback(async (supplierData) => {
    try {
      const result = await suppliersApi.create(supplierData);
      toast.success('Proveedor creado exitosamente');
      await fetchSuppliers();
      return result;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, [fetchSuppliers]);

  // Update supplier
  const updateSupplier = useCallback(async (supplierId, supplierData) => {
    try {
      const result = await suppliersApi.update(supplierId, supplierData);
      toast.success('Proveedor actualizado exitosamente');
      await fetchSuppliers();
      return result;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, [fetchSuppliers]);

  // Delete supplier
  const deleteSupplier = useCallback(async (supplierId) => {
    try {
      await suppliersApi.delete(supplierId);
      setSuppliers(prev => prev.filter(s => s.id !== supplierId));
      toast.success('Proveedor eliminado exitosamente');
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, []);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesName = (supplier.name || '').toLowerCase().includes(search);
        const matchesContact = (supplier.contact_name || '').toLowerCase().includes(search);
        const matchesEmail = (supplier.email || '').toLowerCase().includes(search);
        if (!matchesName && !matchesContact && !matchesEmail) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && supplier.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [suppliers, searchTerm, statusFilter]);

  // Initial fetch
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return {
    suppliers,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredSuppliers,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
  };
};

export default useSuppliers;
