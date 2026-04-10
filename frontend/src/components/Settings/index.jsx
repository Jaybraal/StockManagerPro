import { useState } from 'react';
import { Settings as SettingsIcon, Save, Shield, Building } from 'lucide-react';
import { toast } from 'react-toastify';

const Settings = ({
  config,
  onConfigChange,
  onUpdateAdminCredentials
}) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [saving, setSaving] = useState(false);

  // Admin credentials state
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentials, setCredentials] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleConfigChange = (key, value) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onConfigChange(localConfig);
    } finally {
      setSaving(false);
    }
  };

  const handleCredentialsChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (credentials.newPassword !== credentials.confirmPassword) {
      toast.error('Las contrasenas no coinciden');
      return;
    }
    try {
      await onUpdateAdminCredentials({
        current_password: credentials.currentPassword,
        new_username: credentials.newUsername || undefined,
        new_password: credentials.newPassword
      });
      setShowCredentialsModal(false);
      setCredentials({
        currentPassword: '',
        newUsername: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error updating credentials:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <SettingsIcon size={24} />
          Configuracion
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Administra la configuracion de tu negocio
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Building size={20} />
            Configuracion del Negocio
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Moneda
              </label>
              <select
                value={localConfig.currency || 'DOP'}
                onChange={(e) => handleConfigChange('currency', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="DOP">Peso Dominicano (DOP)</option>
                <option value="USD">Dolar Americano (USD)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Porcentaje de Impuesto (%)
              </label>
              <input
                type="number"
                value={localConfig.tax_percent || 0}
                onChange={(e) => handleConfigChange('tax_percent', parseFloat(e.target.value))}
                min="0"
                max="100"
                step="0.01"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        {/* Security Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Shield size={20} />
            Seguridad
          </h3>

          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Administra las credenciales de acceso al sistema.
          </p>

          <button
            onClick={() => setShowCredentialsModal(true)}
            className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2"
          >
            <Shield size={18} />
            Cambiar Credenciales
          </button>
        </div>
      </div>

      {/* Credentials Modal */}
      {showCredentialsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield size={24} />
              Cambiar Credenciales
            </h3>

            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contrasena Actual *
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={credentials.currentPassword}
                  onChange={handleCredentialsChange}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nuevo Usuario (opcional)
                </label>
                <input
                  type="text"
                  name="newUsername"
                  value={credentials.newUsername}
                  onChange={handleCredentialsChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nueva Contrasena *
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={credentials.newPassword}
                  onChange={handleCredentialsChange}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirmar Contrasena *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={credentials.confirmPassword}
                  onChange={handleCredentialsChange}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCredentialsModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
