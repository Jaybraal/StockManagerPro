import { useState } from 'react';
import { ShoppingBag, Plus, Trash2, ChevronRight } from 'lucide-react';
import CategoryForm from './CategoryForm';

const Categories = ({
  categories,
  loading,
  onAddCategory,
  onDeleteCategory,
  onSelectCategory,
  onImport
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSave = async (categoryData) => {
    await onAddCategory(categoryData);
    setIsFormOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Inventario</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{categories.length} categorías</p>
        </div>
        <div className="flex gap-2">
          {onImport && (
            <button
              onClick={onImport}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              Importar
            </button>
          )}
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm"
          >
            <Plus size={17} />
            <span className="hidden xs:inline">Nueva</span>
            <span className="xs:hidden">+</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {categories.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={28} className="text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">No hay categorías. Crea una para empezar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map(cat => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat)}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all active:scale-[0.98]"
            >
              {/* Icono */}
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <ShoppingBag size={22} className="text-indigo-600 dark:text-indigo-400" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{cat.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {cat.products?.length || 0} productos
                </p>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id); }}
                  className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center transition-colors"
                  title="Eliminar categoría"
                >
                  <Trash2 size={15} />
                </button>
                <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default Categories;
