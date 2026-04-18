import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { Modal } from '../common';

const UserForm = ({
  isOpen,
  onClose,
  onSave,
  user,
  tenants = [],        // solo para superadmin
  isSuperAdmin = false,
}) => {
  const [formData, setFormData] = useState({
    username: '',
    role: 'operador',
    email: '',
    active: true,
    tenant_id: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          username: user.username || '',
          role: user.role || 'operador',
          email: user.email || '',
          active: user.active !== false,
          tenant_id: user.tenant_id || '',
        });
      } else {
        setFormData({
          username: '',
          role: 'operador',
          email: '',
          active: true,
          tenant_id: tenants.length > 0 ? String(tenants[0].id) : '',
        });
      }
      setErrors({});
    }
  }, [isOpen, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    }
    if (isSuperAdmin && !user && !formData.tenant_id) {
      newErrors.tenant_id = 'Selecciona un negocio';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(formData);
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
        {user ? 'Guardar Cambios' : 'Guardar'}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? 'Editar Usuario' : 'Agregar Usuario'}
      icon={User}
      maxWidth="max-w-md"
      footer={footer}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre de usuario *
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={!!user}
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } ${user ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
          />
          {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Selector de negocio: solo superadmin al crear */}
        {isSuperAdmin && !user && tenants.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Negocio *
            </label>
            <select
              name="tenant_id"
              value={formData.tenant_id}
              onChange={handleChange}
              className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.tenant_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            >
              <option value="">— Selecciona un negocio —</option>
              {tenants.map(t => (
                <option key={t.id} value={String(t.id)}>
                  {t.display_name || t.name}
                </option>
              ))}
            </select>
            {errors.tenant_id && <p className="text-red-500 text-sm mt-1">{errors.tenant_id}</p>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rol
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="operador">Operador</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>

        {user && (
          <div className="flex items-center">
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Usuario activo
            </label>
          </div>
        )}
      </div>

    </Modal>
  );
};

export default UserForm;
