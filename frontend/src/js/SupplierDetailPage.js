import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const SupplierDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [newInvoice, setNewInvoice] = useState({
    productName: '',
    quantity: '',
    purchasePrice: '',
    isPaid: false
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Obtener token y tenantId de forma consistente
  const getAuthData = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('adminTenantId');
    return { token, tenantId };
  };

  useEffect(() => {
    fetchSupplierDetails();
    fetchPurchaseInvoices();
  }, [id]);

  const fetchSupplierDetails = async () => {
    try {
      const { token, tenantId } = getAuthData();
      const response = await fetch(`/api/suppliers/${tenantId}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al cargar el proveedor');
      const data = await response.json();
      setSupplier(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchPurchaseInvoices = async () => {
    try {
      const { token } = getAuthData();
      const response = await fetch(`/api/suppliers/${id}/invoices`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al cargar las facturas de compra');
      const data = await response.json();
      setPurchaseInvoices(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAddInvoice = async () => {
    try {
      const { token, tenantId } = getAuthData();
      const response = await fetch(`/api/suppliers/${id}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          date: new Date().toISOString(),
          total_amount: newInvoice.purchasePrice * newInvoice.quantity,
          status: newInvoice.isPaid ? 'paid' : 'pending',
          notes: `Producto: ${newInvoice.productName}, Precio de compra: ${newInvoice.purchasePrice}`
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al guardar la factura de compra');
      }
      toast.success('Factura de compra guardada');
      fetchPurchaseInvoices();
      setIsAddInvoiceModalOpen(false);
      setNewInvoice({ productName: '', quantity: '', purchasePrice: '', isPaid: false });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedInvoice) return;
    try {
      const { token } = getAuthData();
      // Usar el endpoint correcto para pagos
      const response = await fetch(`/api/purchase-invoices/${selectedInvoice.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          notes: paymentNotes
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar el pago');
      }
      toast.success('Pago registrado');
      fetchPurchaseInvoices();
      setIsAddPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentNotes('');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!supplier) return <div>Cargando...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{supplier.name}</h2>
        <button
          onClick={() => navigate('/admin')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Volver
        </button>
      </div>
      <div className="mb-4">
        <p><strong>Contacto:</strong> {supplier.contact_name}</p>
        <p><strong>Email:</strong> {supplier.email}</p>
        <p><strong>Teléfono:</strong> {supplier.phone}</p>
      </div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Facturas de Compra</h3>
        <button
          onClick={() => setIsAddInvoiceModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Agregar Factura de Compra
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {purchaseInvoices.map((invoice) => {
          const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + p.amount, 0);
          const remaining = invoice.total_amount - totalPaid;
          return (
            <div
              key={invoice.id}
              className={`border p-4 rounded ${invoice.status === 'pending' ? 'bg-yellow-100' : ''}`}
            >
              <h4 className="font-semibold">{invoice.notes}</h4>
              <p>Total: {invoice.total_amount}</p>
              <p>Pagado: {totalPaid}</p>
              <p><strong>Saldo restante:</strong> {remaining}</p>
              <p>Estado: {invoice.status}</p>
              {invoice.payments && invoice.payments.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Historial de pagos:</p>
                  <ul className="list-disc ml-6">
                    {invoice.payments.map((p) => (
                      <li key={p.id}>
                        {p.date ? new Date(p.date).toLocaleDateString() : ''} - {p.amount} {p.notes ? `- ${p.notes}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {invoice.status === 'pending' && (
                <button
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setIsAddPaymentModalOpen(true);
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-2"
                >
                  Abonar
                </button>
              )}
            </div>
          );
        })}
      </div>
      {isAddInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Agregar Factura de Compra</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleAddInvoice(); }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
                <input
                  type="text"
                  value={newInvoice.productName}
                  onChange={(e) => setNewInvoice({ ...newInvoice, productName: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                <input
                  type="number"
                  value={newInvoice.quantity}
                  onChange={(e) => setNewInvoice({ ...newInvoice, quantity: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Precio de Compra</label>
                <input
                  type="number"
                  value={newInvoice.purchasePrice}
                  onChange={(e) => setNewInvoice({ ...newInvoice, purchasePrice: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={newInvoice.isPaid}
                    onChange={(e) => setNewInvoice({ ...newInvoice, isPaid: e.target.checked })}
                  />
                  Pagada
                </label>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setIsAddInvoiceModalOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mr-2">Cancelar</button>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isAddPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Registrar Pago</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleAddPayment(); }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Monto a Abonar</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Notas (opcional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => { setIsAddPaymentModalOpen(false); setPaymentNotes(''); }} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mr-2">Cancelar</button>
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierDetailPage; 