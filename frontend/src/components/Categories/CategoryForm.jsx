import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Modal } from '../common';

const CategoryForm = ({
  isOpen,
  onClose,
  onSave,
  category
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(category?.name || '');
      setError('');
    }
  }, [isOpen, category]);

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    onSave({ name: name.trim() });
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <button
        onClick={onClose}
        className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
      >
        Cancelar
      </button>
      <button
        onClick={handleSubmit}
        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow"
      >
        {category ? 'Guardar' : 'Crear'}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Editar Categoria' : 'Nueva Categoria'}
      icon={ShoppingBag}
      maxWidth="max-w-md"
      footer={footer}
    >
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nombre de la categoria *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Ej: Electronica, Ropa, Alimentos..."
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    </Modal>
  );
};

export default CategoryForm;
