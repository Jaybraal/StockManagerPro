import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { Modal } from '../common';

const UNITS = [
  'Unidad', 'Kg', 'g', 'Libra', 'Litro', 'ml',
  'Caja', 'Paquete', 'Docena', 'Par', 'Rollo',
  'Metro', 'cm', 'Bolsa', 'Bulto', 'Otro'
];

const INPUT_BASE = 'w-full border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white';
const INPUT_OK = 'border-gray-300 dark:border-gray-600';
const INPUT_ERR = 'border-red-500';

const ProductForm = ({ isOpen, onClose, onSave, product, categories }) => {
  const EMPTY = {
    nombre: '', category_id: '', unit: '',
    precio: '', costePorItem: '',
    stock: '', stock_minimo: '5', unidadesPorEmpaque: ''
  };

  const [formData, setFormData] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setFormData(product ? {
      nombre: product.name || '',
      category_id: product.category_id || '',
      unit: product.unit || '',
      precio: product.price || '',
      costePorItem: product.costePorItem || '',
      stock: product.stock ?? '',
      stock_minimo: product.stock_minimo ?? '5',
      unidadesPorEmpaque: product.unidadesPorEmpaque || ''
    } : EMPTY);
  }, [isOpen, product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!formData.nombre.trim()) e.nombre = 'Requerido';
    if (!formData.category_id) e.category_id = 'Requerido';
    if (!formData.precio || parseFloat(formData.precio) < 0) e.precio = 'Requerido';
    if (formData.stock === '') e.stock = 'Requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      name: formData.nombre,
      category_id: parseInt(formData.category_id),
      unit: formData.unit || null,
      price: parseFloat(formData.precio),
      costePorItem: formData.costePorItem !== '' ? parseFloat(formData.costePorItem) : null,
      stock: parseInt(formData.stock),
      stock_minimo: parseInt(formData.stock_minimo) || 5,
      unidadesPorEmpaque: formData.unidadesPorEmpaque !== '' ? parseInt(formData.unidadesPorEmpaque) : null,
    });
  };

  const Label = ({ text, required }) => (
    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
      {text}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  const Err = ({ name }) => errors[name]
    ? <p className="text-red-500 text-xs mt-0.5">{errors[name]}</p>
    : null;

  const footerActions = (
    <div className="flex gap-2">
      <button
        onClick={onClose}
        className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        Cancelar
      </button>
      <button
        onClick={handleSubmit}
        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-colors"
      >
        {product ? 'Guardar' : 'Agregar'}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Editar Producto' : 'Nuevo Producto'}
      icon={Package}
      maxWidth="max-w-md"
      footer={footerActions}
    >
      <div className="space-y-3">

        {/* Nombre */}
        <div>
          <Label text="Nombre" required />
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Nombre del producto"
            className={`${INPUT_BASE} ${errors.nombre ? INPUT_ERR : INPUT_OK}`}
            autoFocus
          />
          <Err name="nombre" />
        </div>

        {/* Categoría + Unidad */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label text="Categoría" required />
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className={`${INPUT_BASE} ${errors.category_id ? INPUT_ERR : INPUT_OK}`}
            >
              <option value="">Seleccionar...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <Err name="category_id" />
          </div>
          <div>
            <Label text="Unidad" />
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className={`${INPUT_BASE} ${INPUT_OK}`}
            >
              <option value="">—</option>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-gray-700" />

        {/* Precio venta + Costo */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label text="Precio venta" required />
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">$</span>
              <input
                type="number"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                step="0.01" min="0"
                placeholder="0.00"
                className={`${INPUT_BASE} pl-6 ${errors.precio ? INPUT_ERR : INPUT_OK}`}
              />
            </div>
            <Err name="precio" />
          </div>
          <div>
            <Label text="Costo/item" />
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">$</span>
              <input
                type="number"
                name="costePorItem"
                value={formData.costePorItem}
                onChange={handleChange}
                step="0.01" min="0"
                placeholder="0.00"
                className={`${INPUT_BASE} pl-6 ${INPUT_OK}`}
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-gray-700" />

        {/* Stock + Mínimo + Empaque */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label text="Stock" required />
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0" placeholder="0"
              className={`${INPUT_BASE} ${errors.stock ? INPUT_ERR : INPUT_OK}`}
            />
            <Err name="stock" />
          </div>
          <div>
            <Label text="Mín." />
            <input
              type="number"
              name="stock_minimo"
              value={formData.stock_minimo}
              onChange={handleChange}
              min="0" placeholder="5"
              className={`${INPUT_BASE} ${INPUT_OK}`}
            />
          </div>
          <div>
            <Label text="Empaque" />
            <input
              type="number"
              name="unidadesPorEmpaque"
              value={formData.unidadesPorEmpaque}
              onChange={handleChange}
              min="1" placeholder="—"
              className={`${INPUT_BASE} ${INPUT_OK}`}
            />
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default ProductForm;
