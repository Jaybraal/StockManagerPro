import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

const TopProducts = ({ products = [] }) => {
  const { isDark } = useTheme();

  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.stock || 0) - (a.stock || 0))
      .slice(0, 10)
      .map(p => ({ name: p.name || 'Sin nombre', stock: p.stock || 0 }));
  }, [products]);

  return (
    <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
        Top 10 Productos con Mayor Stock
      </h3>

      {topProducts.length === 0 ? (
        <div className="h-48 sm:h-64 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
          No hay productos disponibles
        </div>
      ) : (
        <div className="h-48 sm:h-64 md:h-80 overflow-x-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topProducts}
              layout="vertical"
              margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                vertical={false}
                stroke={isDark ? '#374151' : '#E5E7EB'}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#374151' : '#E5E7EB' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#374151' : '#E5E7EB' }}
                width={Math.max(60, Math.min(120, window.innerWidth > 768 ? 100 : 70))}
                tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: isDark ? '#F3F4F6' : '#111827'
                }}
                formatter={(value) => [value, 'Unidades en stock']}
              />
              <Bar dataKey="stock" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default TopProducts;
