import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const RecentTransactions = ({ sales = [], onViewAll }) => {
  // Show last 5 transactions
  const recentSales = sales
    .sort((a, b) => new Date(b.fecha || b.date) - new Date(a.fecha || a.date))
    .slice(0, 5);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-DO', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Transacciones Recientes
        </h3>
        {sales.length > 5 && (
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Ver todas
          </button>
        )}
      </div>

      {recentSales.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay transacciones recientes
        </div>
      ) : (
        <div className="space-y-3">
          {recentSales.map(sale => (
            <div
              key={sale.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  sale.is_return
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-green-100 dark:bg-green-900/30'
                }`}>
                  {sale.is_return ? (
                    <ArrowDownRight size={16} className="text-red-600 dark:text-red-400" />
                  ) : (
                    <ArrowUpRight size={16} className="text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Factura #{sale.id}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(sale.fecha || sale.date)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  sale.is_return
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {sale.is_return ? '-' : '+'}
                  {Number(sale.total_amount || 0).toLocaleString('es-DO', {
                    style: 'currency',
                    currency: 'DOP'
                  })}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {sale.payment_method === 'cash' ? 'Efectivo' :
                   sale.payment_method === 'card' ? 'Tarjeta' : sale.payment_method}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
