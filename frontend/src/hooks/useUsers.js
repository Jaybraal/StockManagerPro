import { useState, useCallback, useEffect } from 'react';
import { usersApi } from '../services/api';
import { toast } from 'react-toastify';

/**
 * Custom hook for managing users
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create user
  const createUser = useCallback(async (userData) => {
    try {
      const result = await usersApi.create(userData);
      toast.success('Usuario creado exitosamente');
      await fetchUsers();
      return result;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, [fetchUsers]);

  // Update user
  const updateUser = useCallback(async (userId, userData) => {
    try {
      const result = await usersApi.update(userId, userData);
      toast.success('Usuario actualizado exitosamente');
      await fetchUsers();
      return result;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, [fetchUsers]);

  // Delete user
  const deleteUser = useCallback(async (userId) => {
    try {
      await usersApi.delete(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('Usuario eliminado exitosamente');
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (userId) => {
    try {
      const result = await usersApi.resetPassword(userId);
      toast.success('Contrasena restablecida exitosamente');
      return result;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, []);

  // Update admin credentials
  const updateAdminCredentials = useCallback(async (credentials) => {
    try {
      const result = await usersApi.updateAdminCredentials(credentials);
      toast.success('Credenciales actualizadas exitosamente');
      return result;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, []);

  // Get active users count
  const getActiveUsersCount = useCallback(() => {
    return users.filter(u => u.active).length;
  }, [users]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    updateAdminCredentials,
    activeUsersCount: getActiveUsersCount()
  };
};

export default useUsers;
