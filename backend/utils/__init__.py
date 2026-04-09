"""
Utilidades para StockManagerPro Backend
"""
from .decorators import (
    get_current_user,
    require_tenant_access,
    require_admin,
    require_role,
    validate_json_fields
)
from .websocket import (
    init_websocket,
    emit_to_tenant,
    emit_invoice_request,
    emit_invoice_ready,
    emit_invoice_rejected,
    emit_stock_alert,
    emit_sale_created
)

__all__ = [
    'get_current_user',
    'require_tenant_access',
    'require_admin',
    'require_role',
    'validate_json_fields',
    'init_websocket',
    'emit_to_tenant',
    'emit_invoice_request',
    'emit_invoice_ready',
    'emit_invoice_rejected',
    'emit_stock_alert',
    'emit_sale_created'
]
