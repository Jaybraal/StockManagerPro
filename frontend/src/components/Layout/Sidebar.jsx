import { Home, Users, Package, Truck, BarChart2, Settings, LogOut, Sun, Moon, ArrowLeftRight, X, Building2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export const menuItems = [
  { id: 'dashboard',   label: 'Dashboard',     icon: Home },
  { id: 'inventory',   label: 'Inventario',    icon: Package },
  { id: 'movements',   label: 'Movimientos',   icon: ArrowLeftRight },
  { id: 'suppliers',   label: 'Proveedores',   icon: Truck },
  { id: 'users',       label: 'Usuarios',      icon: Users },
  { id: 'reports',     label: 'Reportes',      icon: BarChart2 },
  { id: 'settings',    label: 'Configuración', icon: Settings },
];

const superadminItems = [
  { id: 'tenants', label: 'Negocios', icon: Building2, badge: 'SA' },
];

const Sidebar = ({ activeTab, setActiveTab, onLogout, isOpen, onToggle, lowStockCount = 0 }) => {
  const { theme, toggleTheme } = useTheme();
  const { isSuperAdmin } = useAuth();

  const handleNav = (id) => {
    setActiveTab(id);
    if (window.innerWidth < 1024) onToggle();
  };

  return (
    <>
      {/* Overlay móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full z-40 flex flex-col
          bg-slate-900 text-slate-300
          transition-transform duration-300 ease-in-out
          w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow">
              <Package size={17} className="text-white" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">StockPro</span>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 rounded hover:bg-slate-700 text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {/* Sección superadmin */}
          {isSuperAdmin && (
            <>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider px-3 pt-1 pb-1">
                Superadmin
              </p>
              {superadminItems.map(({ id, label, icon: Icon, badge }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleNav(id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-colors duration-150 text-left
                      ${active
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                        : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                      }
                    `}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="flex-1">{label}</span>
                    {badge && (
                      <span className="text-xs bg-indigo-500/70 text-white rounded px-1.5 py-0.5 font-bold leading-none">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
              <div className="border-t border-slate-700/60 my-2" />
            </>
          )}

          {menuItems.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            const badge = id === 'inventory' && lowStockCount > 0;
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150 text-left
                  ${active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                    : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                  }
                `}
              >
                <Icon size={18} className="shrink-0" />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className="text-xs bg-amber-500 text-white rounded-full px-1.5 py-0.5 font-bold leading-none">
                    {lowStockCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 pt-3 border-t border-slate-700/60 space-y-0.5">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            {theme === 'dark'
              ? <><Sun size={18} /><span>Modo claro</span></>
              : <><Moon size={18} /><span>Modo oscuro</span></>
            }
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 transition-colors"
          >
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
