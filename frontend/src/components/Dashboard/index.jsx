import { Package, Users, AlertTriangle, Tag, TrendingUp, BarChart2 } from 'lucide-react';
import { KPICard } from '../common';
import StockAlerts from './StockAlerts';
import TopProducts from './TopProducts';

const Dashboard = ({
  dashboardData,
  users,
  lowStockProducts,
  onViewStockAlerts
}) => {
  const storedUsername = localStorage.getItem('username') || 'Admin';
  let displayName = storedUsername;
  if (users && users.length > 0) {
    const userObj = users.find(u => u.username === storedUsername);
    if (userObj) displayName = userObj.name || userObj.username;
  }

  const allProducts = dashboardData.allProducts || [];
  const totalStock = allProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalValue = allProducts.reduce((sum, p) => sum + ((Number(p.stock) || 0) * (Number(p.price) || 0)), 0);
  const categoriesCount = dashboardData.categoriesCount || 0;

  return (
    <div className="flex-1 flex flex-col w-full space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Bienvenido de nuevo, {displayName}</p>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard
          title="Total Productos"
          value={dashboardData.totalProducts || 0}
          icon={Package}
          iconBgColor="bg-blue-100 dark:bg-blue-900/50"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <KPICard
          title="Total Usuarios"
          value={dashboardData.totalUsers || 0}
          icon={Users}
          iconBgColor="bg-purple-100 dark:bg-purple-900/50"
          iconColor="text-purple-600 dark:text-purple-400"
        />
        <KPICard
          title="Categorias"
          value={categoriesCount}
          icon={Tag}
          iconBgColor="bg-indigo-100 dark:bg-indigo-900/50"
          iconColor="text-indigo-600 dark:text-indigo-400"
        />
        <KPICard
          title="Bajo Stock"
          value={`${(lowStockProducts || []).length} productos`}
          icon={AlertTriangle}
          iconBgColor="bg-red-100 dark:bg-red-900/50"
          iconColor="text-red-600 dark:text-red-400"
          valueColor="text-red-600 dark:text-red-400"
          onClick={onViewStockAlerts}
        />
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <KPICard
          title="Unidades en Stock"
          value={totalStock.toLocaleString()}
          icon={BarChart2}
          iconBgColor="bg-green-100 dark:bg-green-900/50"
          iconColor="text-green-600 dark:text-green-400"
        />
        <KPICard
          title="Valor del Inventario"
          value={totalValue.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
          icon={TrendingUp}
          iconBgColor="bg-emerald-100 dark:bg-emerald-900/50"
          iconColor="text-emerald-600 dark:text-emerald-400"
          valueColor="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <TopProducts products={allProducts} />
        <StockAlerts lowStockProducts={lowStockProducts} onViewAll={onViewStockAlerts} />
      </div>
    </div>
  );
};

export default Dashboard;
