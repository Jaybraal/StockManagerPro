import { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, SlidersHorizontal, RefreshCw, Plus, Layers } from 'lucide-react';
import QuickStockModal from '../common/QuickStockModal';
import BulkMovementModal from '../common/BulkMovementModal';

const typeConfig = {
  entrada: { label: 'Entrada',  icon: ArrowUpCircle,     color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  salida:  { label: 'Salida',   icon: ArrowDownCircle,   color: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-50 dark:bg-rose-900/20' },
  ajuste:  { label: 'Ajuste',   icon: SlidersHorizontal, color: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
};

const formatDate = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const Movements = ({ movements, loading, onRefresh, onCreateMovement, products }) => {
  const [filter, setFilter] = useState('all');
  const [quickProduct, setQuickProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [bulkType, setBulkType] = useState(null); // 'entrada' | 'salida' | null

  const filtered = movements.filter(m => {
    if (filter !== 'all' && m.type !== filter) return false;
    if (search && !m.product_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = async (data) => {
    await onCreateMovement(data);
    setQuickProduct(null);
  };

  // Stats rápidas
  const todayStr = new Date().toDateString();
  const todayMoves = movements.filter(m => new Date(m.created_at).toDateString() === todayStr);
  const todayEntradas = todayMoves.filter(m => m.type === 'entrada').reduce((s, m) => s + m.quantity, 0);
  const todaySalidas = todayMoves.filter(m => m.type === 'salida').reduce((s, m) => s + m.quantity, 0);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Movimientos de Stock</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Historial de entradas y salidas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors shrink-0"
            title="Actualizar"
          >
            <RefreshCw size={17} />
          </button>
          {/* Botones masivos — en móvil solo icono */}
          <button
            onClick={() => setBulkType('entrada')}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm text-sm shrink-0"
            title="Recepción masiva"
          >
            <Layers size={17} />
            <span className="hidden sm:inline">Recepción</span>
          </button>
          <button
            onClick={() => setBulkType('salida')}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors shadow-sm text-sm shrink-0"
            title="Pedido rápido"
          >
            <Layers size={17} />
            <span className="hidden sm:inline">Pedido</span>
          </button>
          <button
            onClick={() => setQuickProduct('_pick')}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm shrink-0"
          >
            <Plus size={17} />
            <span className="hidden sm:inline">Individual</span>
          </button>
        </div>
      </div>

      {/* Stats hoy */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Movimientos hoy</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{todayMoves.length}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-1">Unidades recibidas</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">+{todayEntradas}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 border border-rose-100 dark:border-rose-800/30">
          <p className="text-xs text-rose-700 dark:text-rose-400 mb-1">Unidades salidas</p>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">-{todaySalidas}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {['all','entrada','salida','ajuste'].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-2 text-xs font-semibold transition-colors
                ${filter === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
            >
              {t === 'all' ? 'Todos' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No hay movimientos registrados</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filtered.map(m => {
              const cfg = typeConfig[m.type] || typeConfig.ajuste;
              const Icon = cfg.icon;
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <Icon size={18} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{m.product_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {m.reason || cfg.label} · {formatDate(m.created_at)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${cfg.color}`}>
                      {m.type === 'salida' ? '-' : m.type === 'ajuste' ? '=' : '+'}{m.quantity}
                    </p>
                    <p className="text-xs text-slate-400">{m.stock_before} → {m.stock_after}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selector de producto */}
      {quickProduct === '_pick' && (
        <ProductPickerModal
          products={products}
          onSelect={setQuickProduct}
          onClose={() => setQuickProduct(null)}
        />
      )}

      {/* Modal individual */}
      {quickProduct && quickProduct !== '_pick' && (
        <QuickStockModal
          product={quickProduct}
          onClose={() => setQuickProduct(null)}
          onSave={handleSave}
        />
      )}

      {/* Modal de recepción masiva / pedido rápido */}
      {bulkType && (
        <BulkMovementModal
          products={products}
          defaultType={bulkType}
          onClose={() => setBulkType(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

// Selector de producto para movimiento desde este tab
const ProductPickerModal = ({ products, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const flat = (products || []).flatMap(cat =>
    Array.isArray(cat.products) ? cat.products : []
  );
  const filtered = flat.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3">Selecciona un producto</h3>
          <input
            autoFocus
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-700">
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-left transition-colors"
            >
              <span className="text-sm font-medium text-slate-900 dark:text-white">{p.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">Stock: {p.stock}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-8">No se encontraron productos</p>
          )}
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Movements;
