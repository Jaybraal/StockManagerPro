import { useState } from 'react';
import { Users as UsersIcon, Plus } from 'lucide-react';
import { DataTable } from '../common';
import UserForm from './UserForm';

const Users = ({
  users,
  loading,
  error,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onResetPassword,
  isSuperAdmin = false,
  tenants = [],
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const currentUserId = parseInt(localStorage.getItem('userId'));

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleSave = async (userData) => {
    try {
      let result;
      if (editingUser) {
        result = await onEditUser(editingUser.id, userData);
      } else {
        result = await onAddUser(userData);
        if (result?.generated_password) {
          setGeneratedPassword(result.generated_password);
          setShowPasswordModal(true);
        }
      }
      setIsFormOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  // Mapa tenant_id → nombre para mostrar en tabla (superadmin)
  const tenantMap = Object.fromEntries(tenants.map(t => [t.id, t.display_name || t.name]));

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Usuario', accessor: 'username' },
    ...(isSuperAdmin ? [{
      header: 'Negocio',
      render: (user) => (
        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
          {tenantMap[user.tenant_id] || `#${user.tenant_id}`}
        </span>
      )
    }] : []),
    {
      header: 'Email',
      render: (user) => user.email || '-'
    },
    {
      header: 'Estado',
      render: (user) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          user.active
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
        }`}>
          {user.active ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      header: 'Rol',
      render: (user) => (
        <span className="capitalize">{user.role || '-'}</span>
      )
    },
    {
      header: 'Registro',
      render: (user) => {
        const date = user.createdAt || user.created_at;
        return date ? new Date(date).toLocaleDateString() : '-';
      }
    },
    {
      header: 'Ultimo Acceso',
      render: (user) => {
        const date = user.last_login || user.lastLogin;
        return date ? new Date(date).toLocaleString() : '-';
      }
    },
    {
      header: 'Acciones',
      render: (user) => (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(user); }}
            className="px-3 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
          >
            Editar
          </button>
          {user.id !== currentUserId && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteUser(user.id); }}
              className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
            >
              Eliminar
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UsersIcon size={24} />
          Gestion de Usuarios
        </h2>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
          onClick={handleAdd}
        >
          <Plus size={18} />
          Agregar Usuario
        </button>
      </div>

      {/* Table */}
      <div className="p-4 md:p-6">
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          error={error}
          emptyMessage="No hay usuarios registrados"
          searchPlaceholder="Buscar usuarios..."
        />
      </div>

      {/* User Form Modal */}
      <UserForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingUser(null); }}
        onSave={handleSave}
        user={editingUser}
        isSuperAdmin={isSuperAdmin}
        tenants={tenants}
      />

      {/* Generated Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Usuario Creado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Se ha generado la siguiente contrasena para el nuevo usuario:
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
              <code className="text-lg font-mono text-blue-600 dark:text-blue-400">
                {generatedPassword}
              </code>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
              Guarda esta contrasena. No se mostrara de nuevo.
            </p>
            <button
              onClick={() => { setShowPasswordModal(false); setGeneratedPassword(''); }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
