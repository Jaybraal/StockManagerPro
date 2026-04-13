import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { Modal } from '../common';

const TenantForm = ({ isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: '',
    admin_username: '',
    admin_password: '',
    currency: 'DOP',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'El nombre del negocio es requerido';
    if (!form.admin_username.trim()) errs.admin_username = 'El usuario admin es requerido';
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Negocio"
      icon={Building2}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre del negocio *
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ej: Farmacia El Sol"
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Moneda
          </label>
          <select
            name="currency"
            value={form.currency}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="DOP">DOP — Peso Dominicano</option>
            <option value="USD">USD — Dólar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="MXN">MXN — Peso Mexicano</option>
            <option value="COP">COP — Peso Colombiano</option>
          </select>
        </div>

        <hr className="border-gray-200 dark:border-gray-600" />
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Cuenta administrador del negocio</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Usuario admin *
          </label>
          <input
            type="text"
            name="admin_username"
            value={form.admin_username}
            onChange={handleChange}
            placeholder="Ej: admin_farmacia"
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.admin_username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errors.admin_username && <p className="text-red-500 text-xs mt-1">{errors.admin_username}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contraseña admin <span className="text-gray-400 font-normal">(opcional — se genera automáticamente)</span>
          </label>
          <input
            type="text"
            name="admin_password"
            value={form.admin_password}
            onChange={handleChange}
            placeholder="Dejar vacío para generar automáticamente"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow"
        >
          Crear Negocio
        </button>
      </div>
    </Modal>
  );
};

export default TenantForm;
