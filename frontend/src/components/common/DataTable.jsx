import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

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

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(row =>
      columns.some(col => {
        const value = col.accessor ? row[col.accessor] : col.render?.(row);
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl p-4 text-center text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Search */}
      {searchable && (
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearch}
              className="w-full sm:w-64 pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Mobile: card view (< 640px) */}
      <div className="block sm:hidden">
        {paginatedData.length === 0 ? (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">{emptyMessage}</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {paginatedData.map((row, rowIndex) => (
              <div
                key={row.id || rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`p-4 space-y-2 ${onRowClick ? 'cursor-pointer active:bg-slate-50 dark:active:bg-slate-700/50' : ''}`}
              >
                {columns.map((col, colIndex) => (
                  <div key={colIndex} className="flex justify-between items-start gap-3">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide shrink-0 pt-0.5 min-w-[5rem]">
                      {col.header}
                    </span>
                    <span className="text-sm text-slate-800 dark:text-slate-200 text-right">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: table view (>= 640px) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-5 py-3.5 text-sm text-slate-800 dark:text-slate-200">
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredData.length)} de {filteredData.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
