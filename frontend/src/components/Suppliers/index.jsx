import { useState } from 'react';
import { Truck, Plus, Search, Trash2, Edit } from 'lucide-react';
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
  onDeleteSupplier
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

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
    {
      header: 'Proveedor',
      render: (s) => (
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white truncate">{s.name}</p>
          {s.contact_name && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{s.contact_name}</p>
          )}
        </div>
      )
    },
    {
      header: 'Contacto',
      render: (s) => (
        <div className="min-w-0 space-y-0.5">
          {s.phone && <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{s.phone}</p>}
          {s.email && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{s.email}</p>}
          {!s.phone && !s.email && <span className="text-slate-400 text-sm">-</span>}
        </div>
      )
    },
    {
      header: 'Estado',
      render: (s) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          s.status === 'active'
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
        }`}>
          {s.status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      header: 'Acciones',
      render: (s) => (
        <div className="flex gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(s); }}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteSupplier(s.id); }}
            className="px-3 py-1.5 text-xs font-semibold bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
          >
            Eliminar
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Proveedores</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{(filteredSuppliers || []).length} proveedores</p>
        </div>
        <button
          onClick={() => { setEditingSupplier(null); setIsFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm"
        >
          <Plus size={17} />
          <span className="hidden sm:inline">Nuevo proveedor</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={filteredSuppliers}
          loading={loading}
          error={error}
          emptyMessage="No hay proveedores registrados"
          searchable={false}
        />
      </div>

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
