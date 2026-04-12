import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { Modal } from '../common';

const UNITS = [
  'Unidad', 'Kg', 'g', 'Libra', 'Litro', 'ml', 'Caja', 'Paquete',
  'Docena', 'Par', 'Rollo', 'Metro', 'cm', 'Bolsa', 'Bulto', 'Otro'
];

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
    description: '',
    unit: '',
    precio: '',
    costePorItem: '',
    stock: '',
    stock_minimo: '5',
    unidadesPorEmpaque: '',
    barcode: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({
          nombre: product.name || '',
          category_id: product.category_id || '',
          description: product.description || '',
          unit: product.unit || '',
          precio: product.price || '',
          costePorItem: product.costePorItem || '',
          stock: product.stock ?? '',
          stock_minimo: product.stock_minimo ?? '5',
          unidadesPorEmpaque: product.unidadesPorEmpaque || '',
          barcode: product.barcode || ''
        });
      } else {
        setFormData({
          nombre: '',
          category_id: '',
          description: '',
          unit: '',
          precio: '',
          costePorItem: '',
          stock: '',
          stock_minimo: '5',
          unidadesPorEmpaque: '',
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
    if (!formData.category_id) newErrors.category_id = 'La categoría es requerida';
    if (!formData.precio || parseFloat(formData.precio) < 0) newErrors.precio = 'El precio de venta es requerido';
    if (formData.stock === '') newErrors.stock = 'El stock es requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      name: formData.nombre,
      category_id: parseInt(formData.category_id),
      description: formData.description || null,
      unit: formData.unit || null,
      price: parseFloat(formData.precio),
      costePorItem: formData.costePorItem !== '' ? parseFloat(formData.costePorItem) : null,
      stock: parseInt(formData.stock),
      stock_minimo: parseInt(formData.stock_minimo) || 5,
      unidadesPorEmpaque: formData.unidadesPorEmpaque !== '' ? parseInt(formData.unidadesPorEmpaque) : null,
      barcode: formData.barcode || null
    });
  };

  const field = (label, name, type = 'text', props = {}) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
          errors[name] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        }`}
        {...props}
      />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Editar Producto' : 'Agregar Producto'}
      icon={Package}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Arroz blanco largo"
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.nombre ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            placeholder="Descripción opcional del producto"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          />
        </div>

        {/* Categoría + Unidad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoría *
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.category_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">Selecciona...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Unidad de medida
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Sin especificar</option>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Precio venta + Costo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Precio de venta *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className={`w-full border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.precio ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>
            {errors.precio && <p className="text-red-500 text-xs mt-1">{errors.precio}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Costo por item
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                name="costePorItem"
                value={formData.costePorItem}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Stock + Stock Mínimo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field('Stock actual *', 'stock', 'number', { min: '0', placeholder: '0' })}
          {field('Stock mínimo *', 'stock_minimo', 'number', { min: '0', placeholder: '5' })}
        </div>

        {/* Unidades por empaque + Código de barras */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field('Unidades por empaque', 'unidadesPorEmpaque', 'number', { min: '1', placeholder: 'Ej: 12' })}
          {field('Código de barras', 'barcode', 'text', { placeholder: 'Opcional' })}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={onClose}
          className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow text-sm"
        >
          {product ? 'Guardar Cambios' : 'Agregar Producto'}
        </button>
      </div>
    </Modal>
  );
};

export default ProductForm;
