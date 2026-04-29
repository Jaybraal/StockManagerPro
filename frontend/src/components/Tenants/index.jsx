import { useState } from 'react';
import { Building2, Plus, Trash2, Users, RefreshCw, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import TenantForm from './TenantForm';
import { superadminApi } from '../../services/api';

const Tenants = ({
  tenants,
  allUsers,
  loading,
  onCreateTenant,
  onDeleteTenant,
  onCreateUserInTenant,
  onRefresh,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [createdInfo, setCreatedInfo] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [editCredUser, setEditCredUser] = useState(null);
  const [credForm, setCredForm] = useState({ newUsername: '', newPassword: '' });
  const [credSaving, setCredSaving] = useState(false);

  const handleCredentialsSave = async (e) => {
    e.preventDefault();
    if (!credForm.newUsername && !credForm.newPassword) {
      toast.error('Ingresa al menos un campo a cambiar');
      return;
    }
    setCredSaving(true);
    try {
      await superadminApi.setUserCredentials(editCredUser.id, {
        new_username: credForm.newUsername || undefined,
        new_password: credForm.newPassword || undefined
      });
      toast.success(`Credenciales de "${editCredUser.username}" actualizadas`);
      setEditCredUser(null);
      setCredForm({ newUsername: '', newPassword: '' });
      onRefresh();
    } catch (err) {
      toast.error(err.message || 'Error al actualizar credenciales');
    } finally {
      setCredSaving(false);
    }
  };

  const handleSave = async (data) => {
    try {
      const result = await onCreateTenant(data);
      setIsFormOpen(false);
      setCreatedInfo({
        tenantName: result.tenant.name,
        username: result.admin_username,
        password: result.generated_password,
      });
    } catch (_) {}
  };

  const handleDelete = async (tenant) => {
    if (!window.confirm(`¿Eliminar el negocio "${tenant.name}"? Se eliminarán todos sus usuarios y productos.`)) return;
    await onDeleteTenant(tenant.id);
    if (selectedTenant?.id === tenant.id) setSelectedTenant(null);
  };

  // Usuarios del tenant seleccionado
  const tenantUsers = selectedTenant
    ? allUsers.filter(u => u.tenant_id === selectedTenant.id)
    : [];

  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 size={24} />
            Gestión de Negocios
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {tenants.length} negocio{tenants.length !== 1 ? 's' : ''} registrado{tenants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            title="Actualizar"
          >
            <RefreshCw size={17} />
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-semibold text-sm shadow"
          >
            <Plus size={18} />
            Nuevo Negocio
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-6">
        {/* Lista de negocios */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando...</div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No hay negocios registrados</div>
          ) : (
            <div className="space-y-3">
              {tenants.map(tenant => (
                <div
                  key={tenant.id}
                  onClick={() => setSelectedTenant(tenant)}
                  className={`bg-white dark:bg-slate-800 rounded-2xl border p-4 cursor-pointer transition-all ${
                    selectedTenant?.id === tenant.id
                      ? 'border-indigo-500 dark:border-indigo-400 shadow-md shadow-indigo-100 dark:shadow-indigo-900/20'
                      : 'border-gray-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                        <Building2 size={20} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{tenant.display_name || tenant.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {tenant.currency} · Admin: <span className="font-medium">{tenant.admin_username || 'Sin admin'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Users size={13} />
                        <span>{tenant.user_count}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(tenant); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar negocio"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel lateral: usuarios del tenant seleccionado */}
        {selectedTenant && (
          <div className="lg:w-80 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700">
              <p className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <Users size={15} />
                Usuarios de {selectedTenant.display_name || selectedTenant.name}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700">
              {tenantUsers.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">Sin usuarios</p>
              ) : (
                tenantUsers.map(u => (
                  <div key={u.id} className="px-4 py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{u.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{u.role}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        u.active
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                      {u.role !== 'superadmin' && (
                        <button
                          onClick={() => { setEditCredUser(u); setCredForm({ newUsername: '', newPassword: '' }); }}
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 text-gray-400 hover:text-amber-600 transition-colors"
                          title="Cambiar credenciales"
                        >
                          <Shield size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Formulario nuevo negocio */}
      <TenantForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
      />

      {/* Modal cambio de credenciales de usuario (solo superadmin) */}
      {editCredUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Shield size={20} />
              Cambiar Credenciales
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Usuario: <strong>{editCredUser.username}</strong> ({editCredUser.role})
            </p>
            <form onSubmit={handleCredentialsSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nuevo usuario (opcional)
                </label>
                <input
                  type="text"
                  value={credForm.newUsername}
                  onChange={e => setCredForm(p => ({ ...p, newUsername: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nueva contraseña (opcional, mín. 6 caracteres)
                </label>
                <input
                  type="password"
                  value={credForm.newPassword}
                  onChange={e => setCredForm(p => ({ ...p, newPassword: e.target.value }))}
                  minLength={credForm.newPassword ? 6 : undefined}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                El usuario deberá cambiar su contraseña al próximo inicio de sesión.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditCredUser(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={credSaving}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  {credSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de credenciales generadas */}
      {createdInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Negocio creado
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Comparte estas credenciales con el administrador del negocio <strong>{createdInfo.tenantName}</strong>:
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Usuario:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{createdInfo.username}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Contraseña:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{createdInfo.password}</span>
              </div>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
              Guarda esta contraseña. Al primer inicio de sesión se pedirá cambiarla.
            </p>
            <button
              onClick={() => setCreatedInfo(null)}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenants;
