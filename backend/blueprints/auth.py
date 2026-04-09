"""
Auth Blueprint - Handles authentication routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required, get_jwt_identity, get_jwt,
    create_access_token, create_refresh_token,
    set_access_cookies, set_refresh_cookies, unset_jwt_cookies
)
from datetime import datetime, timezone
from database import db, User, TokenBlocklist

auth_bp = Blueprint('auth', __name__, url_prefix='/api')


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login endpoint"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')

    if not username or not password or not role:
        return jsonify({"message": "Faltan usuario, contraseña o rol"}), 400

    user = User.query.filter_by(username=username, role=role).first()

    # Demo user logic
    if user and user.username == 'demo' and user.role == 'administrador' and user.active:
        admin_count = User.query.filter_by(role='administrador', active=True).count()
        if admin_count == 1:
            if user.check_password(password):
                access_token = create_access_token(identity=str(user.id))
                return jsonify({
                    "message": "Debes crear un usuario administrador real.",
                    "token": access_token,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "role": user.role,
                        "tenant_id": user.tenant_id,
                        "must_create_admin": True
                    },
                    "force_create_admin": True
                }), 200
            else:
                return jsonify({"message": "Usuario, contraseña o rol incorrectos"}), 401
        elif admin_count > 1:
            return jsonify({"message": "El usuario demo está deshabilitado. Usa tu usuario administrador real."}), 403

    if user and user.check_password(password):
        user.active = True
        user.last_login = datetime.now(timezone.utc)
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        response = jsonify({
            "message": "Login exitoso",
            "token": access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "tenant_id": user.tenant_id,
                "must_change_password": user.must_change_password
            }
        })

        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)

        return response, 200
    else:
        return jsonify({"message": "Usuario, contraseña o rol incorrectos"}), 401


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)

    response = jsonify({
        'message': 'Token refrescado exitosamente',
        'token': access_token
    })
    set_access_cookies(response, access_token)

    return response, 200


@auth_bp.route('/csrf-token', methods=['GET'])
@jwt_required()
def get_csrf_token():
    """Get CSRF token"""
    from flask_jwt_extended import get_csrf_token as jwt_get_csrf_token
    csrf_token = jwt_get_csrf_token(get_jwt()['jti'])
    return jsonify({'csrf_token': csrf_token}), 200


@auth_bp.route('/auth/status', methods=['GET'])
@jwt_required(optional=True)
def auth_status():
    """Check authentication status"""
    current_user_id_str = get_jwt_identity()

    if current_user_id_str:
        try:
            current_user_id = int(current_user_id_str)
            current_user = db.session.get(User, current_user_id)
            if current_user:
                return jsonify({
                    'authenticated': True,
                    'user': {
                        'id': current_user.id,
                        'username': current_user.username,
                        'role': current_user.role,
                        'tenant_id': current_user.tenant_id
                    }
                }), 200
        except (ValueError, TypeError):
            pass

    return jsonify({'authenticated': False}), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout endpoint"""
    try:
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)

        if current_user:
            current_user.last_logout = datetime.now(timezone.utc)

        # Add token to blocklist
        jti = get_jwt()["jti"]
        now = datetime.now(timezone.utc)
        db.session.add(TokenBlocklist(jti=jti, created_at=now))
        db.session.commit()

        response = jsonify({"message": "Logout exitoso"})
        unset_jwt_cookies(response)
        return response, 200

    except Exception as e:
        return jsonify({"message": "Error al cerrar sesión", "error": str(e)}), 500
