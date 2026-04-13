import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Send, Search } from 'lucide-react';

/**
 * BulkMovementModal — Recepción masiva / Pedido rápido
 *
 * Flujo de teclado:
 *   - Escribir en búsqueda → Enter agrega el primer resultado a la lista
 *   - Tab / Enter en campo de cantidad pasa al siguiente producto
 *   - Escape cierra el modal
 *   - Ctrl+Enter (o Cmd+Enter) envía todo
 */

const TYPES = {
  entrada: { label: 'Entrada', icon: ArrowUpCircle, color: 'emerald' },
  salida:  { label: 'Salida',  icon: ArrowDownCircle, color: 'rose' },
};

const BulkMovementModal = ({ products = [], onClose, onSave, defaultType = 'entrada' }) => {
  const [type, setType] = useState(defaultType);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);   // [{ product, quantity, reason }]
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const searchRef = useRef(null);
  const quantityRefs = useRef({});

  // Todos los productos planos
  const flat = (products || []).flatMap(cat =>
    Array.isArray(cat.products) ? cat.products : []
  );

  // Resultados de búsqueda (excluye ya añadidos)
  const addedIds = new Set(items.map(i => i.product.id));
  const results = search.trim().length > 0
    ? flat.filter(p =>
        !addedIds.has(p.id) &&
        (p.name.toLowerCase().includes(search.toLowerCase()) ||
         (p.barcode && p.barcode.includes(search)))
      ).slice(0, 6)
    : [];

  // Focus en búsqueda al abrir
  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  // Escape cierra
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const addProduct = useCallback((product) => {
    if (addedIds.has(product.id)) return;
    setItems(prev => [...prev, { product, quantity: '', reason: '' }]);
    setSearch('');
    // focus en la cantidad del producto recién añadido
    setTimeout(() => {
      quantityRefs.current[product.id]?.focus();
    }, 50);
  }, [addedIds]);

  const removeItem = (productId) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  };

  const updateItem = (productId, field, value) => {
    setItems(prev => prev.map(i =>
      i.product.id === productId ? { ...i, [field]: value } : i
    ));
  };

  // Enter en búsqueda → añade primer resultado
  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      addProduct(results[0]);
    }
  };

  // Enter/Tab en cantidad → pasa al siguiente o vuelve a búsqueda
  const handleQtyKey = (e, idx) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const next = items[idx + 1];
      if (next) {
        quantityRefs.current[next.product.id]?.focus();
      } else {
        searchRef.current?.focus();
      }
    }
  };

  const handleSubmit = async () => {
    const valid = items.filter(i => parseInt(i.quantity) > 0);
    if (valid.length === 0) { setError('Agrega al menos un producto con cantidad'); return; }

    // Validar stock para salidas
    if (type === 'salida') {
      const over = valid.find(i => parseInt(i.quantity) > i.product.stock);
      if (over) {
        setError(`Stock insuficiente para "${over.product.name}" (disponible: ${over.product.stock})`);
        return;
      }
    }

    setSaving(true);
    setError('');
    try {
      for (const item of valid) {
        await onSave({
          product_id: item.product.id,
          type,
          quantity: parseInt(item.quantity),
          reason: item.reason || (type === 'entrada' ? 'Compra a proveedor' : 'Venta'),
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Error al registrar');
    } finally {
      setSaving(false);
    }
  };

  const total = items.reduce((s, i) => s + (parseInt(i.quantity) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {type === 'entrada' ? 'Recepción masiva' : 'Pedido rápido'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter para agregar · Tab/Enter avanza · Ctrl+Enter envía todo
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Tipo */}
        <div className="px-5 pt-4 pb-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(TYPES).map(([id, { label, icon: Icon, color }]) => (
              <button
                key={id}
                onClick={() => setType(id)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                  ${type === id
                    ? color === 'emerald'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                    : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                  }`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Buscador */}
        <div className="px-5 pb-2 shrink-0 relative">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder="Buscar producto o código de barras… (Enter para agregar)"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Dropdown de resultados */}
          {results.length > 0 && (
            <div className="absolute left-5 right-5 top-full mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg z-10 overflow-hidden">
              {results.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors ${i === 0 ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                >
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{p.name}</span>
                  <span className="text-xs text-slate-400 ml-4 shrink-0">Stock: {p.stock}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lista de items */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Busca un producto y presiona Enter para agregarlo
            </div>
          ) : (
            items.map((item, idx) => {
              const afterStock = type === 'entrada'
                ? item.product.stock + (parseInt(item.quantity) || 0)
                : item.product.stock - (parseInt(item.quantity) || 0);
              const stockColor = afterStock < 0 ? 'text-rose-600' : afterStock <= (item.product.stock_minimo || 5) ? 'text-amber-500' : 'text-emerald-600';

              return (
                <div key={item.product.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.product.name}</p>
                    <p className="text-xs text-slate-400">Stock actual: {item.product.stock}</p>
                  </div>

                  <input
                    ref={el => quantityRefs.current[item.product.id] = el}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => updateItem(item.product.id, 'quantity', e.target.value)}
                    onKeyDown={e => handleQtyKey(e, idx)}
                    placeholder="Cant."
                    className="w-20 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />

                  {item.quantity > 0 && (
                    <span className={`text-sm font-bold w-16 text-right ${stockColor}`}>
                      → {afterStock}
                    </span>
                  )}

                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-700 shrink-0 space-y-3">
          {error && <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

          {items.length > 0 && (
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>{items.filter(i => parseInt(i.quantity) > 0).length} producto(s)</span>
              <span className="font-bold text-slate-900 dark:text-white">
                Total: {total} unidades
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || items.filter(i => parseInt(i.quantity) > 0).length === 0}
              className="flex-2 flex-grow flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 text-sm"
            >
              <Send size={16} />
              {saving ? 'Registrando...' : `Registrar ${items.filter(i => parseInt(i.quantity) > 0).length > 0 ? `(${items.filter(i => parseInt(i.quantity) > 0).length})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkMovementModal;
