import { AlertTriangle, ArrowRight } from 'lucide-react';

const StockAlerts = ({ lowStockProducts = [], onViewAll }) => {
  // Show top 5 alerts
  const displayProducts = lowStockProducts.slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <AlertTriangle size={20} className="text-amber-500" />
          Alertas de Stock Bajo
        </h3>
        {lowStockProducts.length > 5 && (
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            Ver todos ({lowStockProducts.length})
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {displayProducts.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <AlertTriangle size={40} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p>No hay alertas de stock bajo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayProducts.map(product => {
            const isOutOfStock = product.stock <= 0;
            const percentage = product.stock_minimo > 0
              ? (product.stock / product.stock_minimo) * 100
              : 0;

            return (
              <div
                key={product.id}
                className={`p-3 rounded-lg border ${
                  isOutOfStock
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className={`text-sm ${
                      isOutOfStock
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      Stock: {product.stock} / Min: {product.stock_minimo}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    isOutOfStock
                      ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                      : 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
                  }`}>
                    {isOutOfStock ? 'Sin Stock' : 'Stock Bajo'}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      isOutOfStock
                        ? 'bg-red-500'
                        : percentage < 50
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StockAlerts;
