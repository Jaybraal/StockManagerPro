"""
Blueprints package for StockManagerPro
"""
from .auth import auth_bp
from .categories import categories_bp
from .products import products_bp
from .sales import sales_bp
from .users import users_bp
from .config import config_bp
from .notifications import notifications_bp
from .suppliers import suppliers_bp
from .fiscal import fiscal_bp

__all__ = [
    'auth_bp',
    'categories_bp',
    'products_bp',
    'sales_bp',
    'users_bp',
    'config_bp',
    'notifications_bp',
    'suppliers_bp',
    'fiscal_bp'
]
