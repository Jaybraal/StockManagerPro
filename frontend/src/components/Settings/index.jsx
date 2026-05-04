import { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, Save, Building, Link, RefreshCw, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { billingApi } from '../../services/api';

const Settings = ({
  config,
  onConfigChange,
}) => {
  const { role, isSuperAdmin } = useAuth();
  const tenantId = localStorage.getItem('adminTenantId');

  const [localConfig, setLocalConfig] = useState(config);
  const [saving, setSaving] = useState(false);

  // Billing integration
  const [billingConfig, setBillingConfig] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);
  const [showKey, setShowKey] = useState(false);

  const fetchBillingConfig = useCallback(async () => {
    if (!tenantId) return;
    try {
      setBillingLoading(true);
      const data = await billingApi.getConfig(tenantId);
      setBillingConfig(data);
    } catch {
      // No mostrar error si no está configurado aún
    } finally {
      setBillingLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (role === 'administrador' || isSuperAdmin) fetchBillingConfig();
  }, [role, isSuperAdmin, fetchBillingConfig]);

  const handleConfigChange = (key, value) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onConfigChange(localConfig);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!window.confirm('¿Generar una nueva clave? La clave anterior quedará inválida.')) return;
    try {
      const result = await billingApi.regenerateKey(tenantId);
      setNewApiKey(result.api_key);
      setShowKey(true);
      await fetchBillingConfig();
      toast.success('Nueva clave generada. Guárdala ahora, no se mostrará de nuevo.');
    } catch (err) {
      toast.error(err.message || 'Error al generar la clave');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copiado al portapapeles'));
  };

  return (
    <div className="flex-1 flex flex-col w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <SettingsIcon size={24} />
          Configuracion
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Administra la configuracion de tu negocio
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración del negocio */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Building size={20} />
            Configuracion del Negocio
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Moneda
              </label>
              <select
                value={localConfig.currency || 'DOP'}
                onChange={(e) => handleConfigChange('currency', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="DOP">Peso Dominicano (DOP)</option>
                <option value="USD">Dolar Americano (USD)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Porcentaje de Impuesto (%)
              </label>
              <input
                type="number"
                value={localConfig.tax_percent || 0}
                onChange={(e) => handleConfigChange('tax_percent', parseFloat(e.target.value))}
                min="0"
                max="100"
                step="0.01"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        {/* Integración con sistemas de facturación */}
        {(role === 'administrador' || isSuperAdmin) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
              <Link size={20} />
              Integración con Sistema de Facturación
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Conecta tu sistema de facturación externo (Alegra, Factus, etc.) para sincronizar el stock automáticamente
              cada vez que se registre una venta. El sistema externo envía los datos a la URL webhook usando la clave API.
            </p>

            {billingLoading ? (
              <p className="text-sm text-gray-500">Cargando...</p>
            ) : (
              <div className="space-y-4">
                {/* Webhook URL */}
                {billingConfig?.webhook_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      URL Webhook
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={billingConfig.webhook_url}
                        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(billingConfig.webhook_url)}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        title="Copiar URL"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Método: <span className="font-mono">POST</span> — Header: <span className="font-mono">X-API-Key: tu_clave</span>
                    </p>
                  </div>
                )}

                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Clave API
                  </label>
                  {newApiKey ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type={showKey ? 'text' : 'password'}
                          readOnly
                          value={newApiKey}
                          className="flex-1 border border-green-400 rounded-lg px-3 py-2 bg-green-50 dark:bg-green-900/20 text-gray-800 dark:text-green-300 text-sm font-mono"
                        />
                        <button onClick={() => setShowKey(v => !v)} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200">
                          {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button onClick={() => copyToClipboard(newApiKey)} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200" title="Copiar clave">
                          <Copy size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Copia esta clave ahora. No se mostrará completa de nuevo.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {billingConfig?.has_key
                        ? `Clave configurada: ${billingConfig.api_key_masked}`
                        : 'Sin clave configurada. Genera una para conectar tu sistema de facturación.'}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleRegenerateKey}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                >
                  <RefreshCw size={16} />
                  {billingConfig?.has_key ? 'Regenerar Clave API' : 'Generar Clave API'}
                </button>

                {/* Formato del payload */}
                <details className="mt-2">
                  <summary className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                    Ver formato de datos que debe enviar el sistema externo
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
{`POST ${billingConfig?.webhook_url || '/api/webhook/invoice/{tenant_id}'}
Headers:
  X-API-Key: tu_clave_api
  Content-Type: application/json

Body:
{
  "invoice_number": "FAC-001",
  "items": [
    { "barcode": "123456", "quantity": 2 },
    { "name": "Producto X",  "quantity": 1 }
  ]
}`}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default Settings;
