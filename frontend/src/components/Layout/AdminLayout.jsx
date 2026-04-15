import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Menu, Home, Package, ArrowLeftRight, MoreHorizontal } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

// Bottom nav tabs visibles en móvil
const bottomNav = [
  { id: 'dashboard',  label: 'Inicio',        icon: Home },
  { id: 'inventory',  label: 'Inventario',    icon: Package },
  { id: 'movements',  label: 'Movimientos',   icon: ArrowLeftRight },
  { id: 'more',       label: 'Más',           icon: MoreHorizontal },
];

const AdminLayout = ({ children, activeTab, setActiveTab, lowStockCount = 0 }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Abrir sidebar por defecto en desktop
  useEffect(() => {
    const check = () => setSidebarOpen(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_) {}
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminTenantId');
    navigate('/login');
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const handleBottomNav = (id) => {
    if (id === 'more') {
      setSidebarOpen(true);
    } else {
      setActiveTab(id);
    }
  };

  const tabLabel = {
    dashboard: 'Dashboard',
    inventory: 'Inventario',
    movements: 'Movimientos',
    suppliers: 'Proveedores',
    users: 'Usuarios',
    reports: 'Reportes',
    settings: 'Configuración',
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        lowStockCount={lowStockCount}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto overflow-x-hidden lg:ml-64">

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/60 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 lg:hidden"
            aria-label="Menú"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
              <Package size={13} className="text-white" />
            </div>
            <span className="font-bold text-slate-800 dark:text-white text-sm">StockPro</span>
          </div>
          <span className="hidden lg:block text-lg font-bold text-slate-800 dark:text-white">
            {tabLabel[activeTab] || 'StockPro'}
          </span>
          {lowStockCount > 0 && (
            <span className="ml-auto flex items-center gap-1.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full font-medium">
              ⚠ {lowStockCount} bajo stock
            </span>
          )}
        </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6 lg:pb-6" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
          {children}
        </div>
      </main>

      {/* Bottom nav – solo móvil */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="flex">
          {bottomNav.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id || (id === 'more' && !['dashboard','inventory','movements'].includes(activeTab));
            return (
              <button
                key={id}
                onClick={() => handleBottomNav(id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors
                  ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
                `}
              >
                <Icon size={22} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        {/* Relleno para home indicator de iOS */}
        <div style={{ height: 'env(safe-area-inset-bottom)' }} />
      </nav>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default AdminLayout;
