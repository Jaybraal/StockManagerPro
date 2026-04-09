from functools import wraps
from flask import request, jsonify
import jwt
from datetime import datetime, timedelta
import os
from database import User

# Clave secreta para firmar los tokens JWT
# En producción, esto debería estar en variables de entorno
SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-here')

def generate_token(user):
    """Genera un token JWT para el usuario"""
    payload = {
        'user_id': user.id,
        'username': user.username,
        'role': user.role,
        'tenant_id': user.tenant_id,
        'exp': datetime.utcnow() + timedelta(hours=8)  # Token expira en 8 horas
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    """Verifica un token JWT y retorna el payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator para proteger rutas que requieren autenticación"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Obtener token del header Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Token inválido'}), 401

        if not token:
            return jsonify({'message': 'Token faltante'}), 401

        # Verificar token
        payload = verify_token(token)
        if not payload:
            return jsonify({'message': 'Token inválido o expirado'}), 401

        # Obtener usuario de la base de datos
        user = User.query.get(payload['user_id'])
        if not user:
            return jsonify({'message': 'Usuario no encontrado'}), 401

        # Agregar usuario al contexto de la request
        request.user = user
        return f(*args, **kwargs)

    return decorated

def admin_required(f):
    """Decorator para proteger rutas que requieren rol de administrador"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Token inválido'}), 401

        if not token:
            return jsonify({'message': 'Token faltante'}), 401

        payload = verify_token(token)
        if not payload:
            return jsonify({'message': 'Token inválido o expirado'}), 401

        if payload['role'] != 'administrador':
            return jsonify({'message': 'Se requiere rol de administrador'}), 403

        user = User.query.get(payload['user_id'])
        if not user:
            return jsonify({'message': 'Usuario no encontrado'}), 401

        request.user = user
        return f(*args, **kwargs)

    return decorated

def tenant_required(f):
    """Decorator para verificar que el usuario pertenece al tenant correcto"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Token inválido'}), 401

        if not token:
            return jsonify({'message': 'Token faltante'}), 401

        payload = verify_token(token)
        if not payload:
            return jsonify({'message': 'Token inválido o expirado'}), 401

        # Verificar que el tenant_id en el token coincide con el tenant_id en la URL
        tenant_id = kwargs.get('tenant_id')
        if payload['tenant_id'] != tenant_id:
            return jsonify({'message': 'No autorizado para acceder a este tenant'}), 403

        user = User.query.get(payload['user_id'])
        if not user:
            return jsonify({'message': 'Usuario no encontrado'}), 401

        request.user = user
        return f(*args, **kwargs)

    return decorated 