import { useState } from 'react';
import { ShoppingBag, Plus, Import, X, FileDown } from 'lucide-react';
import { DataTable } from '../common';
import ProductForm from './ProductForm';
import * as XLSX from 'xlsx';

const Products = ({
  products,
  categories,
  loading,
  error,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  selectedCategory,
  onBackToCategories
}) => {
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Filter products by selected category
  const displayProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory.id)
    : products;

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sin categoria';
  };

  const getStockStatus = (stock, stockMinimo) => {
    if (stock <= 0) {
      return { text: 'Sin stock', color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' };
    } else if (stock <= stockMinimo) {
      return { text: 'Stock bajo', color: 'text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' };
    }
    return { text: 'En stock', color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20' };
  };

  const exportLowStockProducts = (format = 'csv') => {
    const lowStock = products.filter(p => p.stock <= p.stock_minimo);
    const data = lowStock.map(p => ({
      ID: p.id,
      Nombre: p.name,
      Categoria: getCategoryName(p.category_id),
      Precio: p.price,
      Stock: p.stock,
      'Stock Minimo': p.stock_minimo,
      'Unidades/Empaque': p.unidadesPorEmpaque || '',
      'Coste/Item': p.costePorItem || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BajoStock');

    if (format === 'xlsx') {
      XLSX.writeFile(wb, 'productos_bajo_stock.xlsx');
    } else {
      XLSX.writeFile(wb, 'productos_bajo_stock.csv', { bookType: 'csv' });
    }
    setShowExportOptions(false);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleSave = async (productData) => {
    if (editingProduct) {
      await onEditProduct(editingProduct.id, productData);
    } else {
      await onAddProduct(productData);
    }
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    {
      header: 'Nombre',
      render: (product) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
          {product.barcode && (
            <div className="text-sm text-gray-500 dark:text-gray-400">Codigo: {product.barcode}</div>
          )}
        </div>
      )
    },
    {
      header: 'Categoria',
      render: (product) => (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
          {getCategoryName(product.category_id)}
        </span>
      )
    },
    {
      header: 'Precio',
      render: (product) => `$${product.price?.toFixed(2) || '0.00'}`
    },
    {
      header: 'Stock',
      render: (product) => {
        const status = getStockStatus(product.stock, product.stock_minimo);
        return (
          <div className={`font-medium ${status.color}`}>
            {product.stock} ({status.text})
          </div>
        );
      }
    },
    { header: 'Stock Min', accessor: 'stock_minimo' },
    {
      header: 'Acciones',
      render: (product) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
            className="px-3 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
          >
            Editar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteProduct(product.id); }}
            className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
          >
            Eliminar
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          {selectedCategory && (
            <button
              onClick={onBackToCategories}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
            >
              ← Volver
            </button>
          )}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
              {selectedCategory ? selectedCategory.name : 'Gestion de Productos'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {displayProducts.length} productos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 text-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nuevo Producto</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportOptions(v => !v)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 text-sm"
            >
              <FileDown size={18} />
              <span className="hidden sm:inline">Exportar bajo stock</span>
            </button>
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => exportLowStockProducts('csv')}
                  >
                    Descargar CSV
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => exportLowStockProducts('xlsx')}
                  >
                    Descargar Excel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={displayProducts}
        loading={loading}
        error={error}
        emptyMessage="No hay productos registrados"
        searchPlaceholder="Buscar productos..."
      />

      {/* Product Form Modal */}
      <ProductForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingProduct(null); }}
        onSave={handleSave}
        product={editingProduct}
        categories={categories}
      />
    </div>
  );
};

export default Products;
