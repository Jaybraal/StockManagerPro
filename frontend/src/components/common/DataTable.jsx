import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable DataTable component with search and pagination
 */
const DataTable = ({
  columns,
  data,
  loading = false,
  error = null,
  emptyMessage = 'No hay datos disponibles',
  searchable = true,
  searchPlaceholder = 'Buscar...',
  pageSize = 10,
  onRowClick = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter(row =>
      columns.some(col => {
        const value = col.accessor ? row[col.accessor] : col.render?.(row);
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 when search changes
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-4 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Search */}
      {searchable && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearch}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      )}

      {/* Mobile card view */}
      <div className="block sm:hidden space-y-3">
        {paginatedData.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">{emptyMessage}</div>
        ) : (
          paginatedData.map((row, rowIndex) => (
            <div
              key={row.id || rowIndex}
              onClick={() => onRowClick?.(row)}
              className={`bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${onRowClick ? 'cursor-pointer active:bg-gray-100 dark:active:bg-gray-700' : ''}`}
            >
              {columns.map((col, colIndex) => (
                <div key={colIndex} className="flex justify-between items-start gap-3 py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase shrink-0 pt-0.5">{col.header}</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 text-right">
                    {col.render ? col.render(row) : row[col.accessor]}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredData.length)} de {filteredData.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
