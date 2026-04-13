import { useState, useEffect, useRef } from 'react';
import { ArrowUpCircle, ArrowDownCircle, SlidersHorizontal, X } from 'lucide-react';

const REASONS = {
  entrada: ['Compra a proveedor', 'Devolución de cliente', 'Ajuste de inventario', 'Transferencia', 'Otro'],
  salida: ['Venta', 'Daño / pérdida', 'Muestra', 'Ajuste de inventario', 'Transferencia', 'Otro'],
  ajuste: ['Conteo físico', 'Corrección de error', 'Otro'],
};

const TYPES = ['entrada', 'salida', 'ajuste'];

const QuickStockModal = ({ product, onClose, onSave }) => {
  const [type, setType] = useState('entrada');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const quantityRef = useRef(null);

  useEffect(() => {
    setQuantity('');
    setReason('');
    setError('');
  }, [type]);

  // Atajos de teclado globales mientras el modal está abierto
  useEffect(() => {
    const handler = (e) => {
      // Escape → cerrar
      if (e.key === 'Escape') { onClose(); return; }
      // Enter → confirmar (solo si no está en un input de texto)
      if (e.key === 'Enter' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        handleSubmit();
        return;
      }
      // 1 / 2 / 3 → cambiar tipo (solo si el foco no está en input numérico)
      if (e.target.tagName === 'INPUT') return;
      if (e.key === '1') setType('entrada');
      if (e.key === '2') setType('salida');
      if (e.key === '3') setType('ajuste');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  if (!product) return null;

  const stockAfter = () => {
    const q = parseInt(quantity) || 0;
    if (type === 'entrada') return product.stock + q;
    if (type === 'salida') return product.stock - q;
    return q; // ajuste
  };

  const handleSubmit = async () => {
    const q = parseInt(quantity);
    if (!q || q <= 0) { setError('Ingresa una cantidad válida'); return; }
    if (type === 'salida' && q > product.stock) {
      setError(`Stock insuficiente. Disponible: ${product.stock}`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ product_id: product.id, type, quantity: q, reason });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al registrar');
    } finally {
      setSaving(false);
    }
  };

  const after = stockAfter();
  const afterColor = after <= 0 ? 'text-rose-600' : after <= (product.stock_minimo || 5) ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{product.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Stock actual: <span className="font-semibold text-slate-700 dark:text-slate-200">{product.stock}</span>
              {product.unit ? ` ${product.unit}` : ''}
            </p>
            <p className="text-xs text-slate-400 mt-1">1/2/3 cambia tipo · Enter confirma · Esc cierra</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'entrada', label: 'Entrada', icon: ArrowUpCircle, color: 'emerald' },
              { id: 'salida',  label: 'Salida',  icon: ArrowDownCircle, color: 'rose' },
              { id: 'ajuste',  label: 'Ajuste',  icon: SlidersHorizontal, color: 'indigo' },
            ].map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setType(id)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-semibold transition-all
                  ${type === id
                    ? color === 'emerald' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : color === 'rose'    ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                    : 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                  }
                `}
              >
                <Icon size={22} />
                {label}
              </button>
            ))}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {type === 'ajuste' ? 'Nuevo stock total' : 'Cantidad'}
            </label>
            <input
              ref={quantityRef}
              type="number"
              min="1"
              value={quantity}
              onChange={e => { setQuantity(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }}
              placeholder={type === 'ajuste' ? 'Ej: 50' : 'Ej: 10'}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              autoFocus
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Motivo</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">Sin especificar</option>
              {REASONS[type].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Preview */}
          {quantity && !error && (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 text-sm">
              <span className="text-slate-500 dark:text-slate-400">Stock resultante</span>
              <span className={`font-bold text-lg ${afterColor}`}>{after}</span>
            </div>
          )}

          {error && (
            <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-6 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md shadow-indigo-200 dark:shadow-indigo-900/30"
          >
            {saving ? 'Guardando...' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickStockModal;
