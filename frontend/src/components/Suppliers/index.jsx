import { useState } from 'react';
import { Truck, Plus, Search, Eye, Trash2, Edit } from 'lucide-react';
import { DataTable } from '../common';
import SupplierForm from './SupplierForm';

const Suppliers = ({
  suppliers,
  filteredSuppliers,
  loading,
  error,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onCreateSupplier,
  onEditSupplier,
  onDeleteSupplier,
  onViewSupplierInvoices
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const handleAdd = () => {
    setEditingSupplier(null);
    setIsFormOpen(true);
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleSave = async (supplierData) => {
    if (editingSupplier) {
      await onEditSupplier(editingSupplier.id, supplierData);
    } else {
      await onCreateSupplier(supplierData);
    }
    setIsFormOpen(false);
    setEditingSupplier(null);
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    {
      header: 'Nombre',
      render: (supplier) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{supplier.name}</p>
          {supplier.contact_name && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{supplier.contact_name}</p>
          )}
        </div>
      )
    },
    {
      header: 'Email',
      render: (supplier) => supplier.email || '-'
    },
    {
      header: 'Telefono',
      render: (supplier) => supplier.phone || '-'
    },
    {
      header: 'Direccion',
      render: (supplier) => supplier.address || '-'
    },
    {
      header: 'Estado',
      render: (supplier) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          supplier.status === 'active'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
        }`}>
          {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      header: 'Acciones',
      render: (supplier) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onViewSupplierInvoices(supplier); }}
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
            title="Ver facturas"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(supplier); }}
            className="p-2 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded"
            title="Editar"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteSupplier(supplier.id); }}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex-1 flex flex-col w-full">
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck size={24} />
            Proveedores
          </h2>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
          >
            <Plus size={18} />
            Nuevo Proveedor
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredSuppliers}
          loading={loading}
          error={error}
          emptyMessage="No hay proveedores registrados"
          searchable={false}
        />
      </div>

      {/* Supplier Form Modal */}
      <SupplierForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingSupplier(null); }}
        onSave={handleSave}
        supplier={editingSupplier}
      />
    </div>
  );
};

export default Suppliers;
