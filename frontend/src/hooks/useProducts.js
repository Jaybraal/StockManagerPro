import { useState, useCallback, useEffect } from 'react';
import { productsApi, categoriesApi } from '../services/api';
import { toast } from 'react-toastify';

/**
 * Custom hook for managing products and categories
 */
export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productsApi.getAll();

      // Flatten products from categories structure
      const allProducts = data.reduce((acc, category) => {
        if (Array.isArray(category.products)) {
          return acc.concat(category.products);
        }
        return acc;
      }, []);

      setProducts(allProducts);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Create product
  const createProduct = useCallback(async (productData) => {
    try {
      const result = await productsApi.create(productData);
      toast.success('Producto creado exitosamente');
      await fetchProducts();
      return result;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, [fetchProducts]);

  // Update product
  const updateProduct = useCallback(async (productId, productData) => {
    try {
      const result = await productsApi.update(productId, productData);
      toast.success('Producto actualizado exitosamente');
      await fetchProducts();
      return result;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, [fetchProducts]);

  // Delete product
  const deleteProduct = useCallback(async (productId) => {
    try {
      await productsApi.delete(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Producto eliminado exitosamente');
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, []);

  // Create category
  const createCategory = useCallback(async (categoryData) => {
    try {
      const result = await categoriesApi.create(categoryData);
      toast.success('Categoria creada exitosamente');
      await fetchCategories();
      return result;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, [fetchCategories]);

  // Delete category
  const deleteCategory = useCallback(async (categoryId) => {
    try {
      await categoriesApi.delete(categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      toast.success('Categoria eliminada exitosamente');
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, []);

  // Get low stock products
  const getLowStockProducts = useCallback(() => {
    return products.filter(p => p.stock <= p.stock_minimo);
  }, [products]);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  return {
    products,
    categories,
    loading,
    error,
    fetchProducts,
    fetchCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    deleteCategory,
    getLowStockProducts,
    lowStockCount: getLowStockProducts().length
  };
};

export default useProducts;
