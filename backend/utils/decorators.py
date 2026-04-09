"""
Decorators y helpers para StockManagerPro
Reduce la duplicación de código de verificación de autenticación y autorización
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from database import db, User


def get_current_user():
    """
    Obtiene el usuario actual desde el token JWT.
    Retorna (user, error_response) donde error_response es None si todo está bien.
    """
    current_user_id_str = get_jwt_identity()

    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return None, (jsonify({"message": "Invalid user ID in token"}), 403)

    if not current_user:
        return None, (jsonify({"message": "User specified in token not found"}), 404)

    return current_user, None


def require_tenant_access(f):
    """
    Decorator que verifica que el usuario tiene acceso al tenant especificado en la URL.
    Espera que la función tenga un parámetro 'tenant_id' en la URL.
    Agrega 'current_user' a los kwargs de la función decorada.

    Uso:
        @app.route('/api/products/<int:tenant_id>', methods=['GET'])
        @jwt_required()
        @require_tenant_access
        def get_products(tenant_id, current_user):
            # current_user ya está verificado y pertenece al tenant
            ...
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        tenant_id = kwargs.get('tenant_id')

        if tenant_id is None:
            return jsonify({"message": "tenant_id is required"}), 400

        current_user, error = get_current_user()
        if error:
            return error

        if current_user.tenant_id != tenant_id:
            return jsonify({'message': 'No autorizado para acceder a este tenant'}), 403

        kwargs['current_user'] = current_user
        return f(*args, **kwargs)

    return decorated_function


def require_admin(f):
    """
    Decorator que verifica que el usuario es administrador del tenant.
    Debe usarse después de @require_tenant_access.

    Uso:
        @app.route('/api/products/<int:tenant_id>', methods=['POST'])
        @jwt_required()
        @require_tenant_access
        @require_admin
        def create_product(tenant_id, current_user):
            ...
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = kwargs.get('current_user')

        if not current_user:
            return jsonify({"message": "Authentication required"}), 401

        if current_user.role != 'administrador':
            return jsonify({'message': 'Se requiere rol de administrador'}), 403

        return f(*args, **kwargs)

    return decorated_function


def require_role(*allowed_roles):
    """
    Decorator que verifica que el usuario tiene uno de los roles permitidos.
    Debe usarse después de @require_tenant_access.

    Uso:
        @app.route('/api/sales/<int:tenant_id>', methods=['POST'])
        @jwt_required()
        @require_tenant_access
        @require_role('administrador', 'cajero', 'vendedor')
        def create_sale(tenant_id, current_user):
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user = kwargs.get('current_user')

            if not current_user:
                return jsonify({"message": "Authentication required"}), 401

            if current_user.role not in allowed_roles:
                return jsonify({
                    'message': f'Se requiere uno de los siguientes roles: {", ".join(allowed_roles)}'
                }), 403

            return f(*args, **kwargs)

        return decorated_function
    return decorator


def validate_json_fields(*required_fields):
    """
    Decorator que valida que el JSON de la request contenga los campos requeridos.

    Uso:
        @app.route('/api/products/<int:tenant_id>', methods=['POST'])
        @jwt_required()
        @require_tenant_access
        @validate_json_fields('name', 'price')
        def create_product(tenant_id, current_user):
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import request
            data = request.get_json()

            if not data:
                return jsonify({'message': 'JSON body is required'}), 400

            missing_fields = [field for field in required_fields if field not in data]

            if missing_fields:
                return jsonify({
                    'message': f'Campos requeridos faltantes: {", ".join(missing_fields)}'
                }), 400

            return f(*args, **kwargs)

        return decorated_function
    return decorator
