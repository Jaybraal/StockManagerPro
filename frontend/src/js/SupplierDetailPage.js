import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const SupplierDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);

  const getAuthData = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('adminTenantId');
    return { token, tenantId };
  };

  useEffect(() => {
    fetchSupplierDetails();
  }, [id]);

  const fetchSupplierDetails = async () => {
    try {
      const { token, tenantId } = getAuthData();
      const response = await fetch(`/api/suppliers/${tenantId}/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al cargar el proveedor');
      const data = await response.json();
      setSupplier(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!supplier) return <div>Cargando...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{supplier.name}</h2>
        <button
          onClick={() => navigate('/admin')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Volver
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Contacto</p>
          <p className="font-medium">{supplier.contact_name || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-medium">{supplier.email || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Teléfono</p>
          <p className="font-medium">{supplier.phone || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Dirección</p>
          <p className="font-medium">{supplier.address || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">RNC / Tax ID</p>
          <p className="font-medium">{supplier.tax_id || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Estado</p>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            supplier.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        {supplier.notes && (
          <div className="sm:col-span-2">
            <p className="text-sm text-gray-500">Notas</p>
            <p className="font-medium">{supplier.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierDetailPage;
