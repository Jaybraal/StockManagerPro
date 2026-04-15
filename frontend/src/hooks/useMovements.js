import { useState, useCallback, useEffect } from 'react';
import { movementsApi } from '../services/api';
import { toast } from 'react-toastify';

export const useMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await movementsApi.getAll(100);
      setMovements(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createMovement = useCallback(async (movementData) => {
    const result = await movementsApi.create(movementData);
    await fetchMovements();
    return result;
  }, [fetchMovements]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return { movements, loading, error, fetchMovements, createMovement };
};

export default useMovements;
