import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Modal } from '../common';

const ProductForm = ({
  isOpen,
  onClose,
  onSave,
  product,
  categories
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    category_id: '',
    precio: '',
    stock: '',
    stock_minimo: '5',
    unidadesPorEmpaque: '',
    costePorItem: '',
    barcode: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({
          nombre: product.name || '',
          category_id: product.category_id || '',
          precio: product.price || '',
          stock: product.stock || '',
          stock_minimo: product.stock_minimo || '5',
          unidadesPorEmpaque: product.unidadesPorEmpaque || '',
          costePorItem: product.costePorItem || '',
          barcode: product.barcode || ''
        });
      } else {
        setFormData({
          nombre: '',
          category_id: '',
          precio: '',
          stock: '',
          stock_minimo: '5',
          unidadesPorEmpaque: '',
          costePorItem: '',
          barcode: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.category_id) newErrors.category_id = 'La categoria es requerida';
    if (!formData.precio || formData.precio <= 0) newErrors.precio = 'El precio es requerido';
    if (formData.stock === '') newErrors.stock = 'El stock es requerido';
    if (!formData.stock_minimo) newErrors.stock_minimo = 'El stock minimo es requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const dataToSend = {
      name: formData.nombre,
      price: parseFloat(formData.precio),
      stock: parseInt(formData.stock),
      stock_minimo: parseInt(formData.stock_minimo),
      category_id: parseInt(formData.category_id),
      unidadesPorEmpaque: formData.unidadesPorEmpaque ? parseInt(formData.unidadesPorEmpaque) : null,
      costePorItem: formData.costePorItem ? parseFloat(formData.costePorItem) : null,
      barcode: formData.barcode || null
    };

    onSave(dataToSend);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Editar Producto' : 'Agregar Producto'}
      icon={ShoppingBag}
      maxWidth="max-w-lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.nombre ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Categoria *
          </label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.category_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Selecciona una categoria</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Precio *
          </label>
          <input
            type="number"
            name="precio"
            value={formData.precio}
            onChange={handleChange}
            step="0.01"
            min="0"
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.precio ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.precio && <p className="text-red-500 text-sm mt-1">{errors.precio}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Stock *
          </label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.stock ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Stock Minimo *
          </label>
          <input
            type="number"
            name="stock_minimo"
            value={formData.stock_minimo}
            onChange={handleChange}
            min="0"
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.stock_minimo ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.stock_minimo && <p className="text-red-500 text-sm mt-1">{errors.stock_minimo}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Unidades por Empaque
          </label>
          <input
            type="number"
            name="unidadesPorEmpaque"
            value={formData.unidadesPorEmpaque}
            onChange={handleChange}
            min="0"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Coste por Item
          </label>
          <input
            type="number"
            name="costePorItem"
            value={formData.costePorItem}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Codigo de Barras
          </label>
          <input
            type="text"
            name="barcode"
            value={formData.barcode}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
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
          {product ? 'Guardar Cambios' : 'Guardar'}
        </button>
      </div>
    </Modal>
  );
};

export default ProductForm;
