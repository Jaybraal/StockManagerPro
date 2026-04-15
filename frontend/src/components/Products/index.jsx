import { useState } from 'react';
import { Package, Plus, FileDown, ArrowLeft, Search, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { DataTable, QuickStockModal } from '../common';
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
  onStockMovement,
  selectedCategory,
  onBackToCategories
}) => {
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [quickAdjust, setQuickAdjust] = useState(null);
  const [search, setSearch] = useState('');

  const displayProducts = (selectedCategory
    ? products.filter(p => p.category_id === selectedCategory.id)
    : products
  ).filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Sin categoría';
  };

  const getStockStatus = (stock, min) => {
    if (stock <= 0) return { label: 'Sin stock', dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', row: 'bg-rose-50/40 dark:bg-rose-900/10' };
    if (stock <= min) return { label: 'Stock bajo', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', row: 'bg-amber-50/40 dark:bg-amber-900/10' };
    return { label: 'Normal', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', row: '' };
  };

  const exportLowStock = (format = 'csv') => {
    const low = products.filter(p => p.stock <= p.stock_minimo);
    const data = low.map(p => ({
      ID: p.id, Nombre: p.name,
      Categoría: getCategoryName(p.category_id),
      Precio: p.price, Stock: p.stock,
      'Stock Mínimo': p.stock_minimo
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BajoStock');
    XLSX.writeFile(wb, `bajo_stock.${format}`, format === 'xlsx' ? {} : { bookType: 'csv' });
    setShowExportOptions(false);
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

  const handleQuickSave = async (data) => {
    await onStockMovement(data);
    setQuickAdjust(null);
  };

  const columns = [
    {
      header: 'Producto',
      render: (p) => {
        const status = getStockStatus(p.stock, p.stock_minimo);
        return (
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{p.name}</p>
            {p.barcode && <p className="text-xs text-slate-400 truncate">{p.barcode}</p>}
          </div>
        );
      }
    },
    {
      header: 'Categoría',
      render: (p) => (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          {getCategoryName(p.category_id)}
        </span>
      )
    },
    {
      header: 'Precio',
      render: (p) => (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          ${p.price?.toFixed(2) ?? '0.00'}
        </span>
      )
    },
    {
      header: 'Stock',
      render: (p) => {
        const s = getStockStatus(p.stock, p.stock_minimo);
        return (
          <div className="flex items-center gap-2">
            {/* Botón salida */}
            <button
              onClick={(e) => { e.stopPropagation(); setQuickAdjust({ ...p, _defaultType: 'salida' }); }}
              className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center transition-colors"
              title="Registrar salida"
            >
              <ArrowDownCircle size={16} />
            </button>

            {/* Stock badge */}
            <button
              onClick={(e) => { e.stopPropagation(); setQuickAdjust(p); }}
              className={`min-w-[3rem] text-center px-2 py-1 rounded-lg text-sm font-bold cursor-pointer hover:opacity-80 transition-opacity ${s.text}`}
              title="Ajustar stock"
            >
              {p.stock}
            </button>

            {/* Botón entrada */}
            <button
              onClick={(e) => { e.stopPropagation(); setQuickAdjust({ ...p, _defaultType: 'entrada' }); }}
              className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex items-center justify-center transition-colors"
              title="Registrar entrada"
            >
              <ArrowUpCircle size={16} />
            </button>
          </div>
        );
      }
    },
    {
      header: 'Estado',
      render: (p) => {
        const s = getStockStatus(p.stock, p.stock_minimo);
        return (
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${s.dot}`} />
            <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
          </div>
        );
      }
    },
    {
      header: 'Acciones',
      render: (p) => (
        <div className="flex gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setIsFormOpen(true); }}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteProduct(p.id); }}
            className="px-3 py-1.5 text-xs font-semibold bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
          >
            Eliminar
          </button>
        </div>
      )
    }
  ];

  const lowCount = products.filter(p => p.stock <= p.stock_minimo).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          {selectedCategory && (
            <button
              onClick={onBackToCategories}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {selectedCategory ? selectedCategory.name : 'Inventario'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {displayProducts.length} productos
              {lowCount > 0 && <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">· {lowCount} bajo stock</span>}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm"
          >
            <Plus size={17} />
            <span>Nuevo producto</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportOptions(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              <FileDown size={17} />
              <span className="hidden sm:inline">Exportar</span>
            </button>
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 z-10 py-1">
                <button className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => exportLowStock('csv')}>CSV bajo stock</button>
                <button className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => exportLowStock('xlsx')}>Excel bajo stock</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar producto por nombre o código..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={displayProducts}
          loading={loading}
          error={error}
          emptyMessage="No hay productos en esta categoría"
          searchable={false}
        />
      </div>

      {/* Form modal */}
      <ProductForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingProduct(null); }}
        onSave={handleSave}
        product={editingProduct}
        categories={categories}
      />

      {/* Quick stock modal */}
      {quickAdjust && (
        <QuickStockModal
          product={quickAdjust}
          onClose={() => setQuickAdjust(null)}
          onSave={handleQuickSave}
        />
      )}
    </div>
  );
};

export default Products;
