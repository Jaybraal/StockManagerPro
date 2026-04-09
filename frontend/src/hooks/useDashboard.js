import { useState, useCallback, useEffect } from 'react';
import { dashboardApi } from '../services/api';

export const useDashboard = () => {
  const [data, setData] = useState({
    totalUsers: 0,
    totalProducts: 0,
    lowStockCount: 0,
    lowStockProducts: [],
    categoriesCount: 0,
    allProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const stats = await dashboardApi.getStats();
      setData(stats);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    ...data,
    loading,
    error,
    fetchDashboardData
  };
};

export default useDashboard;
