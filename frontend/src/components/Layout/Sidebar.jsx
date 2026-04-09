import { Home, Users, ShoppingBag, Truck, Calendar, Settings, LogOut, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'inventory', label: 'Inventario', icon: ShoppingBag },
  { id: 'suppliers', label: 'Proveedores', icon: Truck },
  { id: 'reports', label: 'Reportes', icon: Calendar },
  { id: 'settings', label: 'Configuracion', icon: Settings },
];

const Sidebar = ({ activeTab, setActiveTab, onLogout, isOpen, onToggle }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
          shadow-sm h-full fixed left-0 top-0 z-30 transition-all duration-300
          ${isOpen ? 'w-64' : 'w-20'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          {isOpen && (
            <h1 className="text-xl font-bold text-blue-700 dark:text-blue-400 tracking-tight">
              StockManagerPro
            </h1>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col justify-between py-4">
          <div className="px-2 space-y-1">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`
                  w-full flex items-center p-3 rounded-lg transition-all duration-200
                  ${activeTab === item.id
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }
                `}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 768) onToggle();
                }}
              >
                <item.icon size={20} className={isOpen ? 'mr-3' : 'mx-auto'} />
                {isOpen && <span>{item.label}</span>}
              </button>
            ))}
          </div>

          {/* Bottom actions */}
          <div className="px-2 space-y-1">
            {/* Theme toggle */}
            <button
              className="w-full flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={20} className={isOpen ? 'mr-3' : 'mx-auto'} />
                  {isOpen && <span>Modo claro</span>}
                </>
              ) : (
                <>
                  <Moon size={20} className={isOpen ? 'mr-3' : 'mx-auto'} />
                  {isOpen && <span>Modo oscuro</span>}
                </>
              )}
            </button>

            {/* Logout */}
            <button
              className="w-full flex items-center p-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={onLogout}
            >
              <LogOut size={20} className={isOpen ? 'mr-3' : 'mx-auto'} />
              {isOpen && <span>Cerrar sesion</span>}
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
