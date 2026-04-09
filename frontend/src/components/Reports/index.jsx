import { useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { reportsApi } from '../../services/api';
import { toast } from 'react-toastify';

const reportTypes = [
  {
    id: 'inventory',
    title: 'Reporte de Inventario',
    description: 'Estado actual del inventario y productos bajo stock',
    icon: FileText,
    color: 'green',
    requiresDates: false
  },
  {
    id: 'users',
    title: 'Reporte de Usuarios',
    description: 'Lista de usuarios y sus actividades',
    icon: FileText,
    color: 'purple',
    requiresDates: false
  }
];

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [format, setFormat] = useState('pdf');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedReport) {
      toast.error('Selecciona un tipo de reporte');
      return;
    }

    if (selectedReport.requiresDates && (!startDate || !endDate)) {
      toast.error('Selecciona las fechas del periodo');
      return;
    }

    setGenerating(true);
    try {
      if (selectedReport.id === 'inventory') {
        await reportsApi.downloadInventory(format);
      }
      toast.success('Reporte generado exitosamente');
    } catch (error) {
      toast.error('Error al generar el reporte');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar size={24} />
          Reportes
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Genera reportes del estado de tu negocio
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Types */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tipo de Reporte
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reportTypes.map(report => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedReport?.id === report.id
                    ? `border-${report.color}-500 bg-${report.color}-50 dark:bg-${report.color}-900/20`
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${report.color}-100 dark:bg-${report.color}-900/30`}>
                    <report.icon size={24} className={`text-${report.color}-600 dark:text-${report.color}-400`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {report.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {report.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Opciones
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Formato
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
              </select>
            </div>

            {selectedReport?.requiresDates && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedReport || generating}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Download size={18} />
              {generating ? 'Generando...' : 'Generar Reporte'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
