import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout = ({ children, activeTab, setActiveTab }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminTenantId');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Main content */}
      <main
        className={`
          flex-1 flex flex-col overflow-y-auto min-h-screen transition-all duration-300
          ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}
        `}
      >
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Abrir menú"
          >
            <Menu size={22} className="text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-lg font-bold text-blue-700 dark:text-blue-400">StockManagerPro</span>
        </div>

        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default AdminLayout;
