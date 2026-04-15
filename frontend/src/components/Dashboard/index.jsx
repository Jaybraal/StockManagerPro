import { Package, Users, AlertTriangle, Tag, TrendingUp, BarChart2, ArrowUpCircle, ArrowDownCircle, ArrowRight } from 'lucide-react';
import StockAlerts from './StockAlerts';

const StatCard = ({ title, value, sub, icon: Icon, accent = 'indigo', onClick }) => {
  const colors = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    violet: 'bg-violet-500',
    slate: 'bg-slate-500',
  };
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3 overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className={`w-12 h-12 rounded-xl ${colors[accent]} flex items-center justify-center shrink-0 shadow-md`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0 overflow-hidden">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide truncate">{title}</p>
        <p className="text-base sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 leading-tight break-words">{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
};

const Dashboard = ({ dashboardData, users, lowStockProducts, onViewStockAlerts, recentMovements = [], onViewMovements }) => {
  const storedUsername = localStorage.getItem('username') || 'Admin';
  const allProducts = dashboardData.allProducts || [];
  const totalStock = allProducts.reduce((s, p) => s + (Number(p.stock) || 0), 0);
  const totalValue = allProducts.reduce((s, p) => s + ((Number(p.stock) || 0) * (Number(p.price) || 0)), 0);
  const categoriesCount = dashboardData.categoriesCount || 0;

  const typeConfig = {
    entrada: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: ArrowUpCircle, sign: '+' },
    salida:  { color: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-50 dark:bg-rose-900/20',       icon: ArrowDownCircle, sign: '-' },
    ajuste:  { color: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-50 dark:bg-indigo-900/20',   icon: ArrowUpCircle, sign: '=' },
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="space-y-5">
      {/* Bienvenida */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{greeting}, {storedUsername} 👋</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <StatCard title="Productos" value={dashboardData.totalProducts || 0} icon={Package} accent="indigo" sub={`${categoriesCount} categorías`} />
        <StatCard title="Unidades" value={totalStock.toLocaleString()} icon={BarChart2} accent="violet" />
        <StatCard
          title="Bajo stock"
          value={(lowStockProducts || []).length}
          icon={AlertTriangle}
          accent="amber"
          sub="Requieren atención"
          onClick={onViewStockAlerts}
        />
        <StatCard
          title="Valor inventario"
          value={totalValue.toLocaleString('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 })}
          icon={TrendingUp}
          accent="emerald"
        />
        <StatCard title="Usuarios" value={(users || []).length} icon={Users} accent="slate" />
        <StatCard title="Categorías" value={categoriesCount} icon={Tag} accent="indigo" />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Movimientos recientes */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Últimos movimientos</h3>
            <button onClick={onViewMovements} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight size={13} />
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {recentMovements.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">Sin movimientos registrados</p>
            ) : recentMovements.slice(0, 5).map(m => {
              const cfg = typeConfig[m.type] || typeConfig.ajuste;
              const Icon = cfg.icon;
              return (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <Icon size={15} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{m.product_name}</p>
                    <p className="text-xs text-slate-400">{m.reason || m.type} · {formatTime(m.created_at)}</p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${cfg.color}`}>
                    {cfg.sign}{m.quantity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alertas stock */}
        <StockAlerts lowStockProducts={lowStockProducts} onViewAll={onViewStockAlerts} />
      </div>
    </div>
  );
};

export default Dashboard;
