import { useState } from 'react';
import { ShoppingBag, Plus, X } from 'lucide-react';
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

  const handleAdd = () => {
    setIsFormOpen(true);
  };

  const handleSave = async (categoryData) => {
    await onAddCategory(categoryData);
    setIsFormOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Inventario</h2>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
        >
          <Plus size={18} />
          Nueva Categoria
        </button>
        {onImport && (
          <button
            onClick={onImport}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            Importar
          </button>
        )}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div
            key={cat.id}
            className="relative group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl shadow-lg p-6 md:p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl border border-blue-100 dark:border-blue-800"
            onClick={() => onSelectCategory(cat)}
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-200 dark:bg-blue-800 mb-4 shadow-inner">
              <ShoppingBag size={36} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-2 text-center">
              {cat.name}
            </h3>
            <span className="inline-block bg-blue-600 dark:bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded-full mb-2 shadow">
              {cat.products?.length || 0} productos
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCategory(cat.id);
              }}
              className="absolute top-3 right-3 p-2 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 transition-opacity opacity-0 group-hover:opacity-100 shadow"
              title="Eliminar categoria"
            >
              <X size={20} />
            </button>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>No hay categorias. Crea una para empezar.</p>
          </div>
        )}
      </div>

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default Categories;
