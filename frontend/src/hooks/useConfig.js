import { useState, useCallback, useEffect } from 'react';
import { configApi } from '../services/api';
import { toast } from 'react-toastify';

/**
 * Custom hook for app configuration
 */
export const useConfig = () => {
  const [config, setConfig] = useState({
    currency: 'DOP',
    tax_percent: 0,
    advanced_features_enabled: false
  });
  const [emisorConfig, setEmisorConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch config
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await configApi.get();
      setConfig({
        ...data,
        currency: data.currency || 'DOP',
        tax_percent: data.tax_percent || 0,
        advanced_features_enabled: data.advanced_features_enabled || false
      });
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update config
  const updateConfig = useCallback(async (newConfig) => {
    try {
      await configApi.update(newConfig);
      setConfig(prev => ({ ...prev, ...newConfig }));
      toast.success('Configuracion actualizada exitosamente');
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, []);

  // Fetch emisor config
  const fetchEmisorConfig = useCallback(async () => {
    try {
      const data = await configApi.getEmisor();
      setEmisorConfig(data.emisor);
    } catch (err) {
      console.error('Error fetching emisor config:', err);
    }
  }, []);

  // Update emisor config
  const updateEmisorConfig = useCallback(async (emisorData) => {
    try {
      await configApi.updateEmisor(emisorData);
      setEmisorConfig(emisorData);
      toast.success('Configuracion del emisor actualizada');
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchConfig();
    fetchEmisorConfig();
  }, [fetchConfig, fetchEmisorConfig]);

  return {
    config,
    emisorConfig,
    loading,
    error,
    fetchConfig,
    updateConfig,
    fetchEmisorConfig,
    updateEmisorConfig
  };
};

export default useConfig;
