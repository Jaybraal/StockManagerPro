"""
WebSocket utility functions for real-time notifications
"""
from datetime import datetime

# This will be set by app.py after socketio is initialized
socketio = None
connected_clients = {}


def init_websocket(socketio_instance):
    """Initialize the socketio instance for this module"""
    global socketio
    socketio = socketio_instance


def emit_to_tenant(tenant_id, event, data):
    """Emits an event to all clients of a tenant"""
    if not socketio:
        print("[WebSocket] Warning: socketio not initialized")
        return
    room_name = f"tenant_{tenant_id}"
    socketio.emit(event, data, room=room_name)
    print(f"[WebSocket] Emitido '{event}' a {room_name}: {data}")


def emit_invoice_request(tenant_id, sale_id, sale_data):
    """Notifies admins about new invoice request"""
    emit_to_tenant(tenant_id, 'invoice_request', {
        'sale_id': sale_id,
        'message': f'Nueva solicitud de factura - Venta #{sale_id}',
        'sale': sale_data,
        'timestamp': datetime.now().isoformat()
    })


def emit_invoice_ready(tenant_id, sale_id, ncf, cashier_id=None):
    """Notifies cashier that invoice is ready"""
    emit_to_tenant(tenant_id, 'invoice_ready', {
        'sale_id': sale_id,
        'ncf': ncf,
        'message': f'Factura #{sale_id} lista con NCF: {ncf}',
        'cashier_id': cashier_id,
        'timestamp': datetime.now().isoformat()
    })


def emit_invoice_rejected(tenant_id, sale_id, reason, cashier_id=None):
    """Notifies cashier that invoice was rejected"""
    emit_to_tenant(tenant_id, 'invoice_rejected', {
        'sale_id': sale_id,
        'reason': reason,
        'message': f'Solicitud de factura #{sale_id} rechazada',
        'cashier_id': cashier_id,
        'timestamp': datetime.now().isoformat()
    })


def emit_stock_alert(tenant_id, product_id, product_name, current_stock, min_stock):
    """Notifies about low stock"""
    emit_to_tenant(tenant_id, 'stock_low', {
        'product_id': product_id,
        'product_name': product_name,
        'current_stock': current_stock,
        'min_stock': min_stock,
        'message': f'Stock bajo: {product_name} ({current_stock} unidades)',
        'timestamp': datetime.now().isoformat()
    })


def emit_sale_created(tenant_id, sale_id, sale_data):
    """Notifies about new sale created"""
    emit_to_tenant(tenant_id, 'sale_created', {
        'sale_id': sale_id,
        'sale': sale_data,
        'timestamp': datetime.now().isoformat()
    })
