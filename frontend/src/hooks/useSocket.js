import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

/**
 * Hook personalizado para manejar conexiones WebSocket con Socket.IO
 * Proporciona notificaciones en tiempo real para facturas
 */
export const useSocket = (tenantId, userRole, userId) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Callbacks para eventos específicos
  const handlersRef = useRef({
    onInvoiceRequest: null,
    onInvoiceReady: null,
    onInvoiceRejected: null,
    onProductUpdate: null,
    onStockAlert: null,
  });

  // Conectar al servidor WebSocket
  useEffect(() => {
    if (!tenantId) return;

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5003';

    socketRef.current = io(backendUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    // Eventos de conexión
    socket.on('connect', () => {
      console.log('[WebSocket] Conectado al servidor');
      setIsConnected(true);

      // Unirse a la sala del tenant
      socket.emit('join_tenant', {
        tenant_id: tenantId,
        user_role: userRole,
        user_id: userId
      });
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Desconectado del servidor');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Error de conexión:', error);
      setIsConnected(false);
    });

    // Confirmación de unión a sala
    socket.on('joined', (data) => {
      console.log('[WebSocket] Unido a sala:', data);
    });

    // Evento: Nueva solicitud de factura (para admin)
    socket.on('invoice_request', (data) => {
      console.log('[WebSocket] Nueva solicitud de factura:', data);
      addNotification({
        type: 'invoice_request',
        title: 'Nueva solicitud de factura',
        message: `Venta #${data.sale_id} solicita factura`,
        data: data,
        timestamp: new Date()
      });
      if (handlersRef.current.onInvoiceRequest) {
        handlersRef.current.onInvoiceRequest(data);
      }
    });

    // Evento: Factura lista (para cajero)
    socket.on('invoice_ready', (data) => {
      console.log('[WebSocket] Factura lista:', data);
      addNotification({
        type: 'invoice_ready',
        title: 'Factura emitida',
        message: `Factura #${data.sale_id} emitida con NCF: ${data.ncf}`,
        data: data,
        timestamp: new Date()
      });
      if (handlersRef.current.onInvoiceReady) {
        handlersRef.current.onInvoiceReady(data);
      }
    });

    // Evento: Factura rechazada (para cajero)
    socket.on('invoice_rejected', (data) => {
      console.log('[WebSocket] Factura rechazada:', data);
      addNotification({
        type: 'invoice_rejected',
        title: 'Solicitud rechazada',
        message: data.message || `Solicitud de factura #${data.sale_id} rechazada`,
        data: data,
        timestamp: new Date()
      });
      if (handlersRef.current.onInvoiceRejected) {
        handlersRef.current.onInvoiceRejected(data);
      }
    });

    // Evento: Actualización de producto
    socket.on('product_update', (data) => {
      console.log('[WebSocket] Producto actualizado:', data);
      if (handlersRef.current.onProductUpdate) {
        handlersRef.current.onProductUpdate(data);
      }
    });

    // Evento: Alerta de stock bajo
    socket.on('stock_alert', (data) => {
      console.log('[WebSocket] Alerta de stock:', data);
      addNotification({
        type: 'stock_alert',
        title: 'Alerta de stock',
        message: `${data.product_name}: Stock bajo (${data.current_stock})`,
        data: data,
        timestamp: new Date()
      });
      if (handlersRef.current.onStockAlert) {
        handlersRef.current.onStockAlert(data);
      }
    });

    // Cleanup al desmontar
    return () => {
      if (socket) {
        socket.emit('leave_tenant', { tenant_id: tenantId });
        socket.disconnect();
      }
    };
  }, [tenantId, userRole, userId]);

  // Agregar notificación a la lista
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Máximo 50 notificaciones
  }, []);

  // Limpiar notificación
  const clearNotification = useCallback((index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Limpiar todas las notificaciones
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Registrar handlers para eventos
  const registerHandler = useCallback((event, handler) => {
    if (handlersRef.current.hasOwnProperty(event)) {
      handlersRef.current[event] = handler;
    }
  }, []);

  // Desregistrar handler
  const unregisterHandler = useCallback((event) => {
    if (handlersRef.current.hasOwnProperty(event)) {
      handlersRef.current[event] = null;
    }
  }, []);

  return {
    isConnected,
    notifications,
    clearNotification,
    clearAllNotifications,
    registerHandler,
    unregisterHandler,
    socket: socketRef.current
  };
};

export default useSocket;
