import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  es: {
    translation: {
      // General
      'app.name': 'StockManagerPro',
      'app.loading': 'Cargando...',
      'app.error': 'Error',
      'app.success': 'Éxito',
      'app.save': 'Guardar',
      'app.cancel': 'Cancelar',
      'app.delete': 'Eliminar',
      'app.edit': 'Editar',
      'app.add': 'Agregar',
      'app.search': 'Buscar',
      'app.confirm': 'Confirmar',
      'app.back': 'Volver',

      // Login
      'login.title': 'Iniciar Sesión',
      'login.username': 'Usuario',
      'login.password': 'Contraseña',
      'login.role': 'Rol',
      'login.submit': 'Ingresar',
      'login.error': 'Usuario o contraseña incorrectos',

      // Admin
      'admin.title': 'Panel de Administración',
      'admin.dashboard': 'Dashboard',
      'admin.products': 'Productos',
      'admin.categories': 'Categorías',
      'admin.users': 'Usuarios',
      'admin.settings': 'Configuración',
      'admin.reports': 'Reportes',
      'admin.inventory': 'Inventario',
      'admin.import': 'Importar',
      'admin.export': 'Exportar',
      'admin.suppliers': 'Proveedores'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es',
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 