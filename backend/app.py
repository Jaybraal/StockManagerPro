import sys
print("[Backend] Iniciando app.py...")
try:
    from flask import Flask, request, jsonify, send_from_directory, send_file
    print("[Backend] Flask importado correctamente")
    from flask_cors import CORS
    from database import db, init_db, User, Product, Tenant, Category, TokenBlocklist, Supplier, Purchase, PurchaseItem, PurchaseInvoice, PurchaseInvoicePayment, Notification
    from auth import token_required, admin_required, tenant_required, generate_token
    import json
    import os
    from datetime import datetime, timedelta, timezone
    from werkzeug.security import check_password_hash, generate_password_hash
    from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token, create_refresh_token, get_jwt, set_access_cookies, set_refresh_cookies, unset_jwt_cookies
    import secrets
    import io
    from config import Config
    import logging
    from werkzeug.exceptions import HTTPException
    from api_scanner import APIScanner
    from flask_caching import Cache
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker, joinedload
    from sqlalchemy.orm.attributes import flag_modified
    from sqlalchemy.pool import QueuePool
    import traceback
    from werkzeug.utils import secure_filename
    import requests
    import uuid
    from flask_migrate import Migrate
    from flask_socketio import SocketIO, emit, join_room, leave_room
    print("[Backend] Todos los módulos importados correctamente")
except Exception as e:
    print(f"[Backend] ERROR durante la importación de módulos: {e}")
    raise Exception(f"Error durante la importación de módulos: {e}")

app = Flask(__name__, static_folder=None)
app.config.from_object(Config)

# Inicializar la base de datos
db.init_app(app)
migrate = Migrate(app, db)

# Crear tablas y datos iniciales al arrancar
with app.app_context():
    try:
        init_db(app)
    except Exception as e:
        print(f"[Backend] Advertencia init_db: {e}")

# Inicializar JWT
jwt = JWTManager(app)

# Inicializar WebSocket (Socket.IO)
socketio = SocketIO(
    app,
    cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    async_mode='threading',
    logger=True,
    engineio_logger=False
)

# Callback para verificar si un token está en la lista negra
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload: dict) -> bool:
    jti = jwt_payload["jti"]
    token = db.session.query(TokenBlocklist.id).filter_by(jti=jti).scalar()
    return token is not None

# Configuración de CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Ruta absoluta al build de React
REACT_BUILD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'build')

# ==================== WEBSOCKET HANDLERS ====================
# Almacén de conexiones por tenant para broadcast
connected_clients = {}

@socketio.on('connect')
def handle_connect():
    """Maneja nueva conexión WebSocket"""
    print(f"[WebSocket] Cliente conectado: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    """Maneja desconexión WebSocket"""
    print(f"[WebSocket] Cliente desconectado: {request.sid}")
    # Limpiar de todas las rooms
    for tenant_id in list(connected_clients.keys()):
        if request.sid in connected_clients.get(tenant_id, []):
            connected_clients[tenant_id].remove(request.sid)

@socketio.on('join_tenant')
def handle_join_tenant(data):
    """Une al cliente a la room de su tenant"""
    tenant_id = data.get('tenant_id')
    user_role = data.get('role', 'unknown')
    user_id = data.get('user_id')

    if tenant_id:
        room_name = f"tenant_{tenant_id}"
        join_room(room_name)

        # Registrar conexión
        if tenant_id not in connected_clients:
            connected_clients[tenant_id] = []
        if request.sid not in connected_clients[tenant_id]:
            connected_clients[tenant_id].append(request.sid)

        print(f"[WebSocket] Usuario {user_id} ({user_role}) unido a {room_name}")

        # Confirmar unión
        emit('joined', {
            'room': room_name,
            'message': f'Conectado a notificaciones en tiempo real'
        })

@socketio.on('leave_tenant')
def handle_leave_tenant(data):
    """Remueve al cliente de la room de su tenant"""
    tenant_id = data.get('tenant_id')
    if tenant_id:
        room_name = f"tenant_{tenant_id}"
        leave_room(room_name)
        if tenant_id in connected_clients and request.sid in connected_clients[tenant_id]:
            connected_clients[tenant_id].remove(request.sid)
        print(f"[WebSocket] Cliente {request.sid} salió de {room_name}")

def emit_to_tenant(tenant_id, event, data):
    """Emite un evento a todos los clientes de un tenant"""
    room_name = f"tenant_{tenant_id}"
    socketio.emit(event, data, room=room_name)
    print(f"[WebSocket] Emitido '{event}' a {room_name}: {data}")

def emit_stock_alert(tenant_id, product_id, product_name, current_stock, min_stock):
    """Notifica sobre stock bajo"""
    emit_to_tenant(tenant_id, 'stock_low', {
        'product_id': product_id,
        'product_name': product_name,
        'current_stock': current_stock,
        'min_stock': min_stock,
        'message': f'Stock bajo: {product_name} ({current_stock} unidades)',
        'timestamp': datetime.now().isoformat()
    })

# ==================== FIN WEBSOCKET HANDLERS ====================

# --- Definición de rutas API (TODAS deben ir antes de serve_react) ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')

    if not username or not password or not role:
        return jsonify({"message": "Faltan usuario, contraseña o rol"}), 400

    user = User.query.filter_by(username=username, role=role).first()

    # Si el usuario demo intenta loguearse y es el único admin activo, forzar creación de admin real
    if user and user.username == 'demo' and user.role == 'administrador' and user.active:
        admin_count = User.query.filter_by(role='administrador', active=True).count()
        if admin_count == 1:
            # Login demo permitido solo para crear admin real
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
            # Demo ya no puede loguear si hay otro admin
            return jsonify({"message": "El usuario demo está deshabilitado. Usa tu usuario administrador real."}), 403

    if user and user.check_password(password):
        # Marcar usuario como activo
        user.active = True
        db.session.commit()
        # Actualizar la fecha de último acceso
        user.last_login = datetime.now(timezone.utc)
        db.session.commit()
        # Generar tokens JWT usando flask_jwt_extended
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        # Crear respuesta con datos del usuario
        response = jsonify({
            "message": "Login exitoso",
            "token": access_token,  # Mantener para compatibilidad con frontend actual
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "tenant_id": user.tenant_id,
                "must_change_password": user.must_change_password
            }
        })

        # Establecer tokens en cookies HttpOnly (más seguro)
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)

        return response, 200
    else:
        return jsonify({"message": "Usuario, contraseña o rol incorrectos"}), 401

# Endpoint para refrescar el access token usando el refresh token
@app.route('/api/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)

    response = jsonify({
        'message': 'Token refrescado exitosamente',
        'token': access_token  # Para compatibilidad
    })
    set_access_cookies(response, access_token)

    return response, 200


# Endpoint para obtener el token CSRF (necesario para requests desde el frontend)
@app.route('/api/csrf-token', methods=['GET'])
@jwt_required()
def get_csrf_token():
    from flask_jwt_extended import get_csrf_token
    csrf_token = get_csrf_token(get_jwt()['jti'])
    return jsonify({'csrf_token': csrf_token}), 200


# Endpoint para verificar estado de autenticación
@app.route('/api/auth/status', methods=['GET'])
@jwt_required(optional=True)
def auth_status():
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


@app.route('/api/categories/<int:tenant_id>', methods=['GET'])
@jwt_required()
def get_categories_with_products(tenant_id):
    # Obtener la identidad del token JWT (ahora es el user_id como cadena)
    current_user_id_str = get_jwt_identity()

    # Convertir la identidad de cadena a entero y obtener el objeto User
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Verificar si el usuario pertenece al tenant
    if current_user.tenant_id != tenant_id:
        return jsonify({'message': 'No autorizado para acceder a este tenant'}), 403

    try:
        # Usar joinedload para cargar eager los productos con las categorías
        categories = Category.query.options(joinedload(Category.products)).filter_by(tenant_id=current_user.tenant_id).all()
        
        result = []
        for cat in categories:
            # Verificar si cat.products se ha cargado correctamente
            if not hasattr(cat, 'products') or cat.products is None:
                print(f"[DEBUG BACKEND] ERROR: products relationship not loaded for category {cat.id} ({cat.name})")
                continue

            print(f"[DEBUG BACKEND] Procesando categoría {cat.id} ({cat.name}). Productos encontrados: {len(cat.products)}")
            for p in cat.products:
                print(f"[DEBUG BACKEND]   - Producto: {p.id} - {p.name}")
            
            result.append({
                'id': cat.id,
                'name': cat.name,
                'products': [
                    {
                        'id': p.id,
                        'name': p.name,
                        'price': p.price,
                        'stock': p.stock,
                        'barcode': p.barcode,
                        'unidadesPorEmpaque': p.unidadesPorEmpaque,
                        'costePorItem': p.costePorItem,
                        'category_id': p.category_id
                    } for p in cat.products
                ]
            })
        return jsonify(result), 200
    except Exception as e:
        traceback.print_exc() # Descomentar para depuración detallada
        return jsonify({"message": "Error al obtener categorías", "error": str(e)}), 500

@app.route('/api/categories/<int:tenant_id>', methods=['POST'])
@jwt_required()
def create_category_with_products(tenant_id):
    # Obtener la identidad del token JWT (ahora es el user_id como cadena)
    current_user_id_str = get_jwt_identity()

    # Convertir la identidad de cadena a entero y obtener el objeto User
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Verificar que el usuario pertenece al tenant de la URL
    if current_user.tenant_id != tenant_id:
        return jsonify({'message': 'No autorizado para este tenant'}), 403

    data = request.get_json()
    # Permitir ambos: categoryName/taxPercent o name/tax_percent
    category_name = data.get('categoryName') or data.get('name')
    tax_percent = data.get('taxPercent') if 'taxPercent' in data else data.get('tax_percent', 0)
    products = data.get('products', [])
    if not category_name:
        return jsonify({'message': 'Falta el nombre de la categoría'}), 400
    try:
        category = Category(tenant_id=tenant_id, name=category_name, tax_percent=tax_percent)
        db.session.add(category)
        db.session.flush()  # Para obtener el id
        created_products = []
        for prod in products:
            if not prod.get('nombre') or not prod.get('precio') or prod.get('stock') is None:
                continue
            new_product = Product(
                tenant_id=tenant_id,
                name=prod['nombre'],
                price=float(prod['precio']),
                stock=int(prod['stock']),
                category_id=category.id
            )
            db.session.add(new_product)
            created_products.append({
                'id': new_product.id,
                'name': new_product.name,
                'price': new_product.price,
                'stock': new_product.stock,
                'category_id': new_product.category_id
            })
        db.session.commit()
        return jsonify({'message': 'Categoría y productos creados' if products else 'Categoría creada', 'category_id': category.id, 'products': created_products}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error al crear la categoría/productos', 'error': str(e)}), 500

@app.route('/api/products/<int:tenant_id>', methods=['GET'])
@jwt_required()
def get_products(tenant_id):
    # Obtener la identidad del token JWT (ahora es el user_id como cadena)
    current_user_id_str = get_jwt_identity()

    # Convertir la identidad de cadena a entero y obtener el objeto User
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Verificar si el usuario está autenticado y pertenece al tenant
    if current_user.tenant_id != tenant_id:
        return jsonify({'message': 'No autorizado para acceder a este tenant'}), 403

    try:
        # Obtener todas las categorías para este tenant y cargar eager los productos
        # Esto mantiene compatibilidad con la lógica actual del frontend que "aplana" productos
        categories = Category.query.options(joinedload(Category.products)).filter_by(tenant_id=tenant_id).all()

        # Serializar las categorías con sus productos
        result = []
        for cat in categories:
            products_data = []
            for p in cat.products:
                products_data.append({
                    'id': p.id,
                    'name': p.name,
                    'description': p.description,
                    'unit': p.unit,
                    'price': float(p.price),
                    'stock': p.stock,
                    'stock_minimo': p.stock_minimo,
                    'unidadesPorEmpaque': p.unidadesPorEmpaque,
                    'costePorItem': float(p.costePorItem) if p.costePorItem is not None else None,
                    'category_id': p.category_id,
                    'barcode': p.barcode
                })
            result.append({
                'id': cat.id,
                'name': cat.name,
                'tax_percent': cat.tax_percent if hasattr(cat, 'tax_percent') else 0,
                'products': products_data # Incluir la lista de productos en cada categoría
            })

        print(f"[DEBUG BACKEND] GET /api/products/{tenant_id} - Categorías con productos cargados.")
        return jsonify(result), 200

    except Exception as e:
        traceback.print_exc() # Imprimir traceback para depuración detallada
        return jsonify({"message": "Error al obtener productos", "error": str(e)}), 500

@app.route('/api/products/<int:tenant_id>', methods=['POST'])
@jwt_required()
def create_product(tenant_id):
    # Obtener la identidad del token JWT (ahora es el user_id como cadena)
    current_user_id_str = get_jwt_identity()

    # Convertir la identidad de cadena a entero y obtener el objeto User
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Verificar que el usuario pertenece al tenant de la URL
    if current_user.tenant_id != tenant_id:
        return jsonify({'message': 'No autorizado para este tenant'}), 403

    data = request.get_json()
    name = data.get('name')
    price = data.get('price')
    stock = data.get('stock')
    stock_minimo = data.get('stock_minimo', 5)
    category_id = data.get('category_id')
    unidadesPorEmpaque = data.get('unidadesPorEmpaque')
    costePorItem = data.get('costePorItem')
    barcode = data.get('barcode')
    description = data.get('description')
    unit = data.get('unit')

    if not name or price is None or stock is None or category_id is None:
        return jsonify({'message': 'Faltan campos obligatorios: nombre, precio, stock, category_id'}), 400

    try:
        category = Category.query.filter_by(id=category_id, tenant_id=tenant_id).first()
        if not category:
            return jsonify({'message': 'Categoría no encontrada para este tenant'}), 404

        if barcode:
            existing_product_with_barcode = Product.query.filter_by(tenant_id=tenant_id, barcode=barcode).first()
            if existing_product_with_barcode:
                return jsonify({'message': f"El código de barras {barcode} ya está registrado"}), 400

        new_product = Product(
            tenant_id=tenant_id,
            name=name,
            description=description or None,
            unit=unit or None,
            price=float(price),
            stock=int(stock),
            stock_minimo=int(stock_minimo),
            category_id=int(category_id),
            unidadesPorEmpaque=int(unidadesPorEmpaque) if unidadesPorEmpaque is not None else None,
            costePorItem=float(costePorItem) if costePorItem is not None else None,
            barcode=barcode
        )
        db.session.add(new_product)
        db.session.commit()

        return jsonify({
            'message': 'Producto creado exitosamente',
            'product': {
                'id': new_product.id,
                'name': new_product.name,
                'description': new_product.description,
                'unit': new_product.unit,
                'price': new_product.price,
                'stock': new_product.stock,
                'stock_minimo': new_product.stock_minimo,
                'category_id': new_product.category_id,
                'unidadesPorEmpaque': new_product.unidadesPorEmpaque,
                'costePorItem': new_product.costePorItem,
                'barcode': new_product.barcode
            }
        }), 201

    except ValueError as ve:
        db.session.rollback()
        return jsonify({'message': 'Error de validación de datos', 'error': str(ve)}), 400
    except Exception as e:
        db.session.rollback()
        print(f"Error al crear producto: {e}")
        # Registrar el traceback en el log del backend
        traceback.print_exc()
        return jsonify({'message': 'Error interno al crear el producto', 'error': str(e)}), 500

@app.route('/api/product/<int:tenant_id>/barcode/<string:barcode>', methods=['GET'])
@jwt_required()
def get_product_by_barcode(tenant_id, barcode):
    # Obtener la identidad del token JWT (ahora es el user_id como cadena)
    current_user_id_str = get_jwt_identity()

    # Convertir la identidad de cadena a entero y obtener el objeto User
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Verificar si el usuario está autenticado y pertenece al tenant
    if current_user.tenant_id != tenant_id:
        return jsonify({'message': 'No autorizado para acceder a este tenant'}), 403
    
    product = Product.query.filter_by(tenant_id=tenant_id, barcode=barcode).first()
    if product:
        return jsonify({
            "id": product.id,
            "barcode": product.barcode,
            "name": product.name,
            "price": product.price,
            "stock": product.stock,
            "category_id": product.category_id
        }), 200
    else:
        return jsonify({"message": "Producto no encontrado en este negocio"}), 404

@app.route('/api/products/<int:tenant_id>/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(tenant_id, product_id):
    print(f"[DEBUG BACKEND] Solicitud PUT recibida para actualizar producto {product_id} en tenant {tenant_id}")
    # Obtener la identidad del token JWT (ahora es el user_id como cadena)
    current_user_id_str = get_jwt_identity()

    # Convertir la identidad de cadena a entero y obtener el objeto User
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Verificar que el usuario pertenece al tenant de la URL y es administrador
    if current_user.tenant_id != tenant_id or current_user.role != 'administrador':
        return jsonify({'message': 'No autorizado para actualizar productos en este tenant'}), 403

    data = request.get_json()

    # Validar campos obligatorios (al menos uno para actualizar)
    allowed_fields = ['name', 'description', 'unit', 'price', 'stock', 'stock_minimo', 'category_id', 'unidadesPorEmpaque', 'costePorItem', 'barcode']
    if not any(field in data for field in allowed_fields):
         return jsonify({'message': 'No se proporcionaron campos para actualizar'}), 400

    try:
        # Buscar el producto por ID y tenant
        product = Product.query.filter_by(id=product_id, tenant_id=tenant_id).first()
        if not product:
            return jsonify({'message': 'Producto no encontrado para este tenant'}), 404

        # Actualizar campos proporcionados en los datos
        for field in allowed_fields:
            if field in data:
                value = data[field]
                # Convertir cadenas vacías a None para manejar campos opcionales
                if isinstance(value, str) and value.strip() == '':
                    value = None

                # Manejar la conversión de tipos si es necesario (ej. float, int)
                if field in ['price', 'costePorItem'] and value is not None:
                    setattr(product, field, float(value))
                elif field in ['stock', 'stock_minimo', 'unidadesPorEmpaque'] and value is not None:
                     setattr(product, field, int(value))
                else:
                     setattr(product, field, value)

        # Validar category_id si se proporciona
        if 'category_id' in data and data['category_id'] is not None:
             category = Category.query.filter_by(id=data['category_id'], tenant_id=tenant_id).first()
             if not category:
                 return jsonify({'message': 'Categoría no encontrada para este tenant'}), 400
             product.category_id = int(data['category_id'])

        # Validar código de barras si se proporciona y es diferente al actual
        if 'barcode' in data and data['barcode'] is not None and data['barcode'] != product.barcode:
             existing_product_with_barcode = Product.query.filter_by(tenant_id=tenant_id, barcode=data['barcode']).first()
             if existing_product_with_barcode:
                 return jsonify({'message': f"El código de barras {data['barcode']} ya está registrado"}), 400
             product.barcode = data['barcode']

        db.session.commit()

        return jsonify({'message': 'Producto actualizado exitosamente', 'product_id': product.id}), 200

    except ValueError as ve:
         db.session.rollback()
         return jsonify({'message': 'Error de validación de datos', 'error': str(ve)}), 400
    except Exception as e:
        db.session.rollback()
        print(f"Error al actualizar producto {product_id}: {e}")
        traceback.print_exc()
        return jsonify({'message': 'Error interno al actualizar el producto', 'error': str(e)}), 500

@app.route('/api/products/<int:tenant_id>/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(tenant_id, product_id):
    """Eliminar un producto específico"""
    current_user_id_str = get_jwt_identity()

    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Verificar que el usuario pertenece al tenant y es administrador
    if current_user.tenant_id != tenant_id or current_user.role != 'administrador':
        return jsonify({'message': 'No autorizado para eliminar productos en este tenant'}), 403

    try:
        product = Product.query.filter_by(id=product_id, tenant_id=tenant_id).first()
        if not product:
            return jsonify({'message': 'Producto no encontrado'}), 404

        db.session.delete(product)
        db.session.commit()
        return jsonify({'message': 'Producto eliminado exitosamente'}), 200

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'message': 'Error al eliminar el producto', 'error': str(e)}), 500

@app.route('/api/notifications/<int:tenant_id>', methods=['GET'])
@jwt_required()
def get_notifications(tenant_id):
    """Obtener notificaciones del usuario"""
    current_user_id_str = get_jwt_identity()
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User not found"}), 404

    if current_user.tenant_id != tenant_id:
        return jsonify({'message': 'No autorizado'}), 403

    try:
        # Obtener notificaciones para el usuario o su rol
        notifications = Notification.query.filter(
            Notification.tenant_id == tenant_id,
            Notification.read == False,
            db.or_(
                Notification.user_id == current_user.id,
                Notification.target_role == current_user.role
            )
        ).order_by(Notification.created_at.desc()).limit(50).all()

        return jsonify({
            'notifications': [n.to_dict() for n in notifications],
            'count': len(notifications)
        }), 200

    except Exception as e:
        return jsonify({'message': 'Error al obtener notificaciones', 'error': str(e)}), 500


@app.route('/api/notifications/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    """Marcar notificación como leída"""
    current_user_id_str = get_jwt_identity()
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User not found"}), 404

    try:
        notification = db.session.get(Notification, notification_id)
        if not notification:
            return jsonify({'message': 'Notificación no encontrada'}), 404

        if notification.tenant_id != current_user.tenant_id:
            return jsonify({'message': 'No autorizado'}), 403

        notification.read = True
        db.session.commit()

        return jsonify({'message': 'Notificación marcada como leída'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error', 'error': str(e)}), 500


@app.route('/api/config/<int:tenant_id>', methods=['GET'])
@jwt_required()
def get_config(tenant_id):
    # Obtener la identidad del token JWT (ahora es el user_id como cadena)
    current_user_id_str = get_jwt_identity()

    # Convertir la identidad de cadena a entero y obtener el objeto User
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Verificar si el usuario pertenece al tenant
    if current_user.tenant_id != tenant_id:
        return jsonify({'message': 'No autorizado para acceder a este tenant'}), 403

    try:
        tenant = db.session.get(Tenant, tenant_id)
        if not tenant:
            return jsonify({'message': 'Tenant no encontrado'}), 404

        config_data = tenant.config
        if config_data is None or not isinstance(config_data, dict):
            if isinstance(config_data, str):
                try:
                    config_data = json.loads(config_data)
                except (json.JSONDecodeError, TypeError):
                    config_data = {}
            else:
                config_data = {}

        if 'currency' not in config_data:
            config_data['currency'] = 'DOP'  # Peso Dominicano por defecto

        config_data['tenant_id'] = tenant_id
        return jsonify(config_data), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": "Error al obtener configuración", "error": str(e)}), 500

@app.route('/api/config/<int:tenant_id>', methods=['PUT'])
@jwt_required()
def update_config(tenant_id):
    # Obtener la identidad del token JWT (ahora es el user_id como cadena)
    current_user_id_str = get_jwt_identity()

    # Convertir la identidad de cadena a entero y obtener el objeto User
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Verificar si el usuario pertenece al tenant y es administrador
    if current_user.tenant_id != tenant_id or current_user.role != 'administrador':
        return jsonify({'message': 'No autorizado para actualizar la configuración de este tenant'}), 403

    data = request.get_json()
    allowed_fields = {'currency', 'address', 'name', 'rfc', 'phone', 'email', 'logo', 'custom_message', 'advanced_features_enabled', 'tax_percent'}
    
    # Obtener la configuración del tenant y asegurar que sea un diccionario
    tenant = db.session.get(Tenant, tenant_id)
    if not tenant:
        return jsonify({'message': 'Tenant no encontrado'}), 404

    config_data = tenant.config
    if config_data is None or not isinstance(config_data, dict):
        # Si no hay configuración o no es un diccionario, inicializar como diccionario vacío
        if isinstance(config_data, str):
            # Intentar parsear si es una cadena (por si acaso hay datos antiguos guardados como string)
            try:
                config_data = json.loads(config_data)
            except (json.JSONDecodeError, TypeError):
                config_data = {} # Fallback a diccionario vacío si el parseo falla
        else:
            config_data = {} # Inicializar si es None o otro tipo no esperado

    for key in allowed_fields:
        if key in data:
            config_data[key] = data[key]

    # Si se actualiza el nombre, también actualizar el campo name del modelo Tenant
    if 'name' in data:
        # Ya tenemos el objeto tenant
        tenant.name = data['name']

    # Asignar el diccionario modificado de vuelta al campo JSON del tenant
    tenant.config = config_data
    # Marcar el campo como modificado para que SQLAlchemy lo detecte
    flag_modified(tenant, 'config')

    db.session.commit()
    # Devolver la configuración actualizada en la respuesta
    response_config = config_data.copy()

    # Incluir tenant_id en la respuesta de configuración
    response_config['tenant_id'] = tenant.id

    return jsonify({'message': 'Configuración actualizada', 'config': response_config}), 200

@app.route('/api/users/<int:tenant_id>', methods=['GET'])
@jwt_required()
def get_users(tenant_id):
    print(f"[DEBUG BACKEND] Recibida solicitud GET /api/users/{tenant_id}")
    # Obtener la identidad del token JWT (ahora es el user_id como cadena)
    current_user_id_str = get_jwt_identity()

    # Convertir la identidad de cadena a entero y obtener el objeto User
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Verificar si el usuario pertenece al tenant
    if current_user.tenant_id != tenant_id:
        return jsonify({'message': 'No autorizado para acceder a este tenant'}), 403

    try:
        users = User.query.filter_by(tenant_id=tenant_id).all()
        users_list = []
        for user in users:
            users_list.append({
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'active': user.active,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'created_at': user.created_at.isoformat() if user.created_at else None
            })
        return jsonify(users_list), 200
    except Exception as e:
        traceback.print_exc() # Descomentar para depuración detallada
        return jsonify({"message": "Error al obtener usuarios", "error": str(e)}), 500

def generate_random_password(length=5):
    digits = '0123456789'
    return ''.join(secrets.choice(digits) for _ in range(length))

@app.route('/api/users/<int:tenant_id>', methods=['POST'])
def create_user(tenant_id):
    # Verificar si ya existe un administrador activo para este tenant
    admin_exists = User.query.filter_by(tenant_id=tenant_id, role='administrador', active=True).first() is not None
    
    if admin_exists:
        # Si ya existe un admin, exigir autenticación como antes
        from flask_jwt_extended import jwt_required, get_jwt_identity
        @jwt_required()
        def inner_create_user(tenant_id=tenant_id):
            current_user_id_str = get_jwt_identity()
            try:
                current_user_id = int(current_user_id_str)
                current_user = db.session.get(User, current_user_id)
            except (ValueError, TypeError):
                return jsonify({"message": "Invalid user ID in token"}), 403
            if not current_user:
                return jsonify({"message": "User specified in token not found"}), 404
            # Solo admin puede crear usuarios
            if current_user.tenant_id != tenant_id or current_user.role != 'administrador':
                return jsonify({'message': 'No autorizado para crear usuarios'}), 403
            data = request.get_json()
            username = data.get('username')
            role = data.get('role')
            password = data.get('password', 'changeme')
            if not username or not role:
                return jsonify({'message': 'Faltan datos obligatorios'}), 400
            if User.query.filter_by(username=username, tenant_id=tenant_id).first():
                return jsonify({'message': 'El nombre de usuario ya existe'}), 400
            user = User(username=username, role=role, tenant_id=tenant_id)
            user.set_password(password)
            user.active = True
            user.must_change_password = True
            db.session.add(user)
            db.session.commit()
            # Si se acaba de crear el primer admin real, desactivar demo
            if role == 'administrador':
                demo_user = User.query.filter_by(username='demo', tenant_id=tenant_id, role='administrador').first()
                if demo_user and demo_user.active:
                    demo_user.active = False
                    db.session.commit()
            return jsonify({'message': 'Usuario creado exitosamente', 'generated_password': password}), 201
        return inner_create_user()
    # Si NO existe admin, permitir crear el primer admin sin autenticación
    data = request.get_json()
    username = data.get('username')
    role = data.get('role')
    password = data.get('password', 'changeme')
    if not username or not role:
        return jsonify({'message': 'Faltan datos obligatorios'}), 400
    if role != 'administrador':
        return jsonify({'message': 'El primer usuario debe ser administrador'}), 400
    if User.query.filter_by(username=username, tenant_id=tenant_id).first():
        return jsonify({'message': 'El nombre de usuario ya existe'}), 400
    user = User(username=username, role=role, tenant_id=tenant_id)
    user.set_password(password)
    user.active = True
    user.must_change_password = True
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Usuario administrador creado exitosamente', 'generated_password': password}), 201

@app.route('/api/users/<int:tenant_id>/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(tenant_id, user_id):
    current_user_id_str = get_jwt_identity()
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user or current_user.tenant_id != tenant_id or current_user.role != 'administrador':
        return jsonify({'message': 'No autorizado'}), 403

    user_to_update = User.query.filter_by(id=user_id, tenant_id=tenant_id).first()
    if not user_to_update:
        return jsonify({'message': 'Usuario no encontrado'}), 404

    data = request.get_json()
    if 'email' in data:
        user_to_update.email = data['email'] or None
    if 'role' in data and data['role'] in ('administrador', 'operador'):
        # Prevent removing last admin
        if user_to_update.role == 'administrador' and data['role'] != 'administrador':
            admin_count = User.query.filter_by(tenant_id=tenant_id, role='administrador', active=True).count()
            if admin_count <= 1:
                return jsonify({'message': 'No puedes cambiar el rol del último administrador'}), 400
        user_to_update.role = data['role']
    if 'active' in data:
        user_to_update.active = bool(data['active'])

    db.session.commit()
    return jsonify({'message': 'Usuario actualizado exitosamente'}), 200


@app.route('/api/users/<int:tenant_id>/<int:user_id>/reset-password', methods=['POST'])
@jwt_required()
def reset_user_password(tenant_id, user_id):
    # Obtener la identidad del token JWT (ahora es el user_id como cadena)
    current_user_id_str = get_jwt_identity()

    # Convertir la identidad de cadena a entero y obtener el objeto User
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Verificar si el usuario actual es administrador y pertenece al tenant correcto
    if current_user.tenant_id != tenant_id or current_user.role != 'administrador':
        return jsonify({'message': 'No autorizado para resetear contraseñas'}), 403

    # No permitir que un administrador resetee su propia contraseña a través de esta ruta
    if current_user_id == user_id:
         return jsonify({'message': 'No puedes resetear tu propia contraseña a través de esta ruta.'}), 400

    user_to_reset = User.query.filter_by(id=user_id, tenant_id=tenant_id).first()
    if not user_to_reset:
        return jsonify({'message': 'Usuario no encontrado'}), 404
    try:
        new_password = generate_random_password()
        user_to_reset.set_password(new_password)
        db.session.commit()
        return jsonify({'message': 'Contraseña reseteada exitosamente', 'generated_password': new_password}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error al resetear la contraseña', 'error': str(e)}), 500

@app.route('/api/users/<int:tenant_id>/admin-credentials', methods=['PUT'])
@jwt_required()
def update_admin_credentials(tenant_id):
    # Obtener la identidad del token JWT (ahora es el user_id como cadena)
    current_user_id_str = get_jwt_identity()

    # Convertir la identidad de cadena a entero y obtener el objeto User
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Solo un administrador del mismo tenant puede usar esta ruta
    if current_user.tenant_id != tenant_id or current_user.role != 'administrador':
        return jsonify({'message': 'No autorizado para actualizar credenciales de administrador'}), 403

    data = request.get_json()
    current_password = data.get('current_password')
    new_username = data.get('new_username')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify({'message': 'Se requieren la contraseña actual y la nueva contraseña'}), 400

    # Obtener el usuario administrador actual
    admin = User.query.filter_by(tenant_id=tenant_id, role='administrador').first()
    if not admin:
        return jsonify({'message': 'Usuario administrador no encontrado'}), 404

    # Verificar la contraseña actual
    if not check_password_hash(admin.password_hash, current_password):
        return jsonify({'message': 'Contraseña actual incorrecta'}), 401

    # Actualizar las credenciales
    if new_username:
        # Verificar si el nuevo nombre de usuario ya existe
        existing_user = User.query.filter_by(tenant_id=tenant_id, username=new_username).first()
        if existing_user and existing_user.id != admin.id:
            return jsonify({'message': 'El nombre de usuario ya está en uso'}), 400
        admin.username = new_username

    admin.password_hash = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({'message': 'Credenciales actualizadas exitosamente'}), 200

@app.route('/api/users/<int:tenant_id>/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(tenant_id, user_id):
    # Obtener la identidad del token JWT (ahora es el user_id como cadena)
    current_user_id_str = get_jwt_identity()

    # Convertir la identidad de cadena a entero y obtener el objeto User
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Verificar si el usuario actual es administrador y pertenece al tenant correcto
    if current_user.tenant_id != tenant_id or current_user.role != 'administrador':
        return jsonify({'message': 'No autorizado para eliminar usuarios'}), 403

    # No permitir que un administrador se elimine a sí mismo
    if current_user_id == user_id:
        return jsonify({'message': 'No puedes eliminar tu propio usuario.'}), 400

    user_to_delete = User.query.filter_by(id=user_id, tenant_id=tenant_id).first()
    if not user_to_delete:
        return jsonify({'message': 'Usuario no encontrado'}), 404

    # Si el usuario a eliminar es administrador, verificar si es el último
    if user_to_delete.role == 'administrador':
        admin_count = User.query.filter_by(tenant_id=tenant_id, role='administrador').count()
        if admin_count <= 1:
            return jsonify({'message': 'No puedes eliminar el último usuario administrador de este tenant.'}), 400

    db.session.delete(user_to_delete)
    db.session.commit()
    return jsonify({'message': 'Usuario eliminado exitosamente'}), 200

@app.route('/api/logout', methods=['POST'])
@jwt_required()
def logout():
    # Obtener la identidad del token JWT (ahora es el user_id como cadena)
    current_user_id_str = get_jwt_identity()

    # Convertir la identidad de cadena a entero y obtener el objeto User
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Opcional: Marcar al usuario como inactivo al cerrar sesión
    # current_user.active = False
    # db.session.commit()

    jti = get_jwt()["jti"]
    now = datetime.now(timezone.utc)
    token_block = TokenBlocklist(jti=jti, created_at=now)
    db.session.add(token_block)
    db.session.commit()

    # Crear respuesta y limpiar cookies
    response = jsonify({
        'message': 'Sesión cerrada exitosamente',
        'logout_time': now.isoformat()
    })
    unset_jwt_cookies(response)

    return response, 200

@app.route('/api/categories/<int:tenant_id>/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(tenant_id, category_id):
    # Obtener la identidad del token JWT (ahora es el user_id como cadena)
    current_user_id_str = get_jwt_identity()

    # Convertir la identidad de cadena a entero y obtener el objeto User
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Verificar si el usuario pertenece al tenant y es administrador
    if current_user.tenant_id != tenant_id or current_user.role != 'administrador':
        return jsonify({'message': 'No autorizado para eliminar categorías en este tenant'}), 403

    category = Category.query.filter_by(id=category_id, tenant_id=tenant_id).first()
    if not category:
        return jsonify({'message': 'Categoría no encontrada'}), 404
    try:
        # Eliminar productos asociados
        for product in category.products:
            db.session.delete(product)
        db.session.delete(category)
        db.session.commit()
        return jsonify({'message': 'Categoría y productos asociados eliminados'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error al eliminar la categoría', 'error': str(e)}), 500

@app.route('/api/users/<int:tenant_id>/<int:user_id>/change-credentials', methods=['POST'])
@jwt_required()
def change_credentials(tenant_id, user_id):
    # Obtener la identidad del token. Ahora es una cadena (el user_id).
    current_user_id_str = get_jwt_identity()

    # Convertir la identidad de cadena a entero
    try:
        current_user_id = int(current_user_id_str)
    except ValueError:
        return jsonify({"message": "Invalid user ID in token"}), 403

    # Buscar el objeto de usuario actual basado en el ID del token
    current_user = db.session.get(User, current_user_id)

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Verificar si el usuario del token es el mismo que se está intentando modificar
    # y si pertenece al tenant especificado en la URL.
    # Usar el user_id obtenido del token (current_user_id) para la comparación
    # y el tenant_id del objeto current_user
    if current_user_id != user_id or current_user.tenant_id != tenant_id:
        return jsonify({"message": "Forbidden: You can only change your own credentials within your tenant"}), 403

    data = request.get_json()
    new_username = data.get('new_username')
    new_password = data.get('new_password')

    if not new_username or not new_password:
        return jsonify({"message": "Nuevo usuario y nueva contraseña son requeridos"}), 400

    # Buscar el usuario que se va a modificar (debe ser el mismo que el current_user)
    user_to_change = db.session.get(User, user_id)
    
    if not user_to_change or user_to_change.tenant_id != tenant_id or user_to_change.id != current_user_id:
         # This check should ideally not be reached if the previous check passes,
         # but added for safety.
        return jsonify({"message": "User not found or mismatch"}), 404


    # Validar si el nuevo nombre de usuario ya existe en el mismo tenant (excepto si es el mismo usuario)
    existing_user = User.query.filter(User.tenant_id == tenant_id, User.username == new_username, User.id != user_to_change.id).first()
    if existing_user:
        return jsonify({"message": f"El nombre de usuario '{new_username}' ya existe en este tenant."}), 400

    # Aquí puedes añadir más validaciones para la contraseña (longitud, complejidad, etc.)
    # Flask-SQLAlchemy no maneja esto automáticamente, debes hacerlo manualmente.
    if len(new_password) < 6: # Ejemplo de validación simple
         return jsonify({"message": "La contraseña debe tener al menos 6 caracteres."}), 400

    user_to_change.username = new_username
    user_to_change.set_password(new_password) # Asegúrate de usar el método para hashear
    user_to_change.must_change_password = False # Una vez cambiadas, ya no necesita cambiarlas
    
    # Asegurarse de que el rol no pueda ser cambiado a través de esta ruta si es administrador
    # Si el usuario es un administrador, mantener el rol de administrador.
    # Si no es administrador, el rol no se cambia en esta ruta.
    # if user_to_change.role != 'admin':
    #     # Si necesitas permitir cambiar roles para no-admins, añade lógica aquí
    #     pass # No se cambia el rol
    
    # Asegurarse de que solo el propio usuario pueda cambiar sus credenciales
    # Esta verificación ya está cubierta arriba con current_user_id == user_id

    db.session.commit()

    return jsonify({"message": "Credenciales actualizadas exitosamente"}), 200

@app.route('/api/import-from-api', methods=['POST'])
@jwt_required()
def import_from_api():
    current_user_id_str = get_jwt_identity()

    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Obtener el tenant_id del usuario actual
    tenant_id = current_user.tenant_id

    data = request.get_json()
    program_name = data.get('program_name')

    if not program_name:
        return jsonify({'error': 'Nombre del programa no proporcionado'}), 400

    scanner = APIScanner(program_name=program_name)
    success = scanner.run_scan(tenant_id)

    if success:
        return jsonify({
            'message': 'Productos importados exitosamente',
            'api_url': scanner.api_url
        }), 200
    else:
        return jsonify({'error': 'No se pudo detectar la API o importar los productos'}), 500

# Configuración de logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.errorhandler(Exception)
def handle_exception(e):
    # Si es una excepción HTTP, usar su código y descripción
    if isinstance(e, HTTPException):
        return jsonify({
            "error": e.name,
            "message": e.description
        }), e.code
    # Para cualquier otra excepción, devolver 500
    # Log the traceback for unexpected errors
    logging.error("Unhandled exception: %s", e, exc_info=True)
    traceback.print_exc() # Asegurarse de imprimir el traceback aquí también

    # Escribir el traceback a un archivo para depuración detallada
    # error_log_path = os.path.join(os.path.dirname(__file__), 'backend_errors.log')
    # with open(error_log_path, 'a') as f:
    #     f.write(f\"Timestamp: {datetime.now(timezone.utc).isoformat()}\n\")
    #     f.write(f\"Error Type: {type(e).__name__}\n\")
    #     f.write(f\"Error Message: {str(e)}\n\")
    #     traceback.print_exc(file=f) # Escribir el traceback completo al archivo
    #     f.write(\"\\n\" + \"=\"*50 + \"\\n\\n\")

    return jsonify({
        "error": "Error interno del servidor",
        "message": str(e)
    }), 500

# --- Definición de la ruta para servir archivos estáticos (DEBE ir al final) ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    safe_path = os.path.normpath(path)
    file_path = os.path.join(REACT_BUILD_DIR, safe_path)
    print(f"[DEBUG] Solicitado: {path} | Buscando: {file_path}")
    if path != "" and os.path.isfile(file_path):
        return send_from_directory(REACT_BUILD_DIR, safe_path)
    else:
        return send_from_directory(REACT_BUILD_DIR, 'index.html')

@app.route('/api/suppliers/<int:tenant_id>', methods=['GET'])
@jwt_required()
def get_suppliers(tenant_id):
    current_user_id_str = get_jwt_identity()
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403
    if not current_user or current_user.tenant_id != tenant_id:
        return jsonify({'message': 'No autorizado para acceder a este tenant'}), 403
    suppliers = Supplier.query.filter_by(tenant_id=tenant_id).all()
    return jsonify([s.to_dict() for s in suppliers]), 200

@app.route('/api/suppliers/<int:tenant_id>/<int:supplier_id>', methods=['GET'])
@jwt_required()
def get_supplier(tenant_id, supplier_id):
    """Obtener un proveedor específico por ID"""
    current_user_id_str = get_jwt_identity()
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403
    if not current_user or current_user.tenant_id != tenant_id:
        return jsonify({'message': 'No autorizado para acceder a este tenant'}), 403
    supplier = Supplier.query.filter_by(id=supplier_id, tenant_id=tenant_id).first()
    if not supplier:
        return jsonify({'message': 'Proveedor no encontrado'}), 404
    return jsonify(supplier.to_dict()), 200

@app.route('/api/suppliers/<int:tenant_id>', methods=['POST'])
@jwt_required()
def create_supplier(tenant_id):
    current_user_id_str = get_jwt_identity()
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403
    if not current_user or current_user.tenant_id != tenant_id:
        return jsonify({'message': 'No autorizado para acceder a este tenant'}), 403
    data = request.get_json()
    supplier = Supplier(
        tenant_id=tenant_id,
        name=data.get('name'),
        contact_name=data.get('contact_name'),
        email=data.get('email'),
        phone=data.get('phone'),
        address=data.get('address'),
        tax_id=data.get('tax_id'),
        status=data.get('status', 'active'),
        notes=data.get('notes')
    )
    db.session.add(supplier)
    db.session.commit()
    return jsonify(supplier.to_dict()), 201

@app.route('/api/suppliers/<int:tenant_id>/<int:supplier_id>', methods=['PUT'])
@jwt_required()
def update_supplier(tenant_id, supplier_id):
    current_user_id_str = get_jwt_identity()
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403
    if not current_user or current_user.tenant_id != tenant_id:
        return jsonify({'message': 'No autorizado para acceder a este tenant'}), 403
    supplier = Supplier.query.filter_by(id=supplier_id, tenant_id=tenant_id).first_or_404()
    data = request.get_json()
    supplier.name = data.get('name', supplier.name)
    supplier.contact_name = data.get('contact_name', supplier.contact_name)
    supplier.email = data.get('email', supplier.email)
    supplier.phone = data.get('phone', supplier.phone)
    supplier.address = data.get('address', supplier.address)
    supplier.tax_id = data.get('tax_id', supplier.tax_id)
    supplier.status = data.get('status', supplier.status)
    supplier.notes = data.get('notes', supplier.notes)
    db.session.commit()
    return jsonify(supplier.to_dict()), 200

@app.route('/api/suppliers/<int:tenant_id>/<int:supplier_id>', methods=['DELETE'])
@jwt_required()
def delete_supplier(tenant_id, supplier_id):
    current_user_id_str = get_jwt_identity()
    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403
    if not current_user or current_user.tenant_id != tenant_id:
        return jsonify({'message': 'No autorizado para acceder a este tenant'}), 403
    supplier = Supplier.query.filter_by(id=supplier_id, tenant_id=tenant_id).first_or_404()
    db.session.delete(supplier)
    db.session.commit()
    return jsonify({'message': 'Proveedor eliminado'}), 200

# --- Endpoints para Compras (Facturas de Proveedor) ---
@app.route('/api/suppliers/<int:supplier_id>/purchases', methods=['GET'])
@jwt_required()
def get_purchases_for_supplier(supplier_id):
    purchases = Purchase.query.filter_by(supplier_id=supplier_id).all()
    return jsonify([{
        'id': p.id,
        'date': p.date.isoformat(),
        'total_amount': p.total_amount,
        'notes': p.notes
    } for p in purchases]), 200

@app.route('/api/suppliers/<int:supplier_id>/purchases', methods=['POST'])
@jwt_required()
def create_purchase_for_supplier(supplier_id):
    data = request.get_json()
    tenant_id = data.get('tenant_id')
    total_amount = data.get('total_amount')
    notes = data.get('notes')
    items = data.get('items', [])
    purchase = Purchase(
        tenant_id=tenant_id,
        supplier_id=supplier_id,
        total_amount=total_amount,
        notes=notes
    )
    db.session.add(purchase)
    db.session.flush()  # Para obtener el ID antes de agregar items
    for item in items:
        purchase_item = PurchaseItem(
            purchase_id=purchase.id,
            product_id=item['product_id'],
            quantity=item['quantity'],
            price=item['price']
        )
        db.session.add(purchase_item)
    db.session.commit()
    return jsonify({'id': purchase.id}), 201

@app.route('/api/purchases/<int:purchase_id>', methods=['GET'])
@jwt_required()
def get_purchase(purchase_id):
    purchase = Purchase.query.get_or_404(purchase_id)
    items = [{
        'id': item.id,
        'product_id': item.product_id,
        'quantity': item.quantity,
        'price': item.price
    } for item in purchase.items]
    return jsonify({
        'id': purchase.id,
        'supplier_id': purchase.supplier_id,
        'date': purchase.date.isoformat(),
        'total_amount': purchase.total_amount,
        'notes': purchase.notes,
        'items': items
    }), 200

# --- Endpoints para Facturas de Compra (PurchaseInvoice) ---
@app.route('/api/suppliers/<int:supplier_id>/invoices', methods=['GET'])
@jwt_required()
def get_supplier_invoices(supplier_id):
    invoices = PurchaseInvoice.query.filter_by(supplier_id=supplier_id).all()
    return jsonify([inv.to_dict() for inv in invoices]), 200

@app.route('/api/suppliers/<int:supplier_id>/invoices', methods=['POST'])
@jwt_required()
def create_supplier_invoice(supplier_id):
    data = request.get_json()
    invoice = PurchaseInvoice(
        supplier_id=supplier_id,
        tenant_id=data.get('tenant_id'),
        date=datetime.fromisoformat(data.get('date')) if data.get('date') else datetime.now(timezone.utc),
        total_amount=data.get('total_amount'),
        status=data.get('status', 'pending'),
        notes=data.get('notes')
    )
    db.session.add(invoice)
    db.session.commit()
    return jsonify(invoice.to_dict()), 201

# --- Endpoints para pagos de facturas de compra ---
@app.route('/api/purchase-invoices/<int:invoice_id>/payments', methods=['GET'])
@jwt_required()
def get_invoice_payments(invoice_id):
    current_user_id_str = get_jwt_identity()

    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Verificar que la factura existe y pertenece al tenant del usuario
    invoice = PurchaseInvoice.query.get(invoice_id)
    if not invoice:
        return jsonify({'message': 'Factura no encontrada'}), 404

    if invoice.tenant_id != current_user.tenant_id:
        return jsonify({'message': 'No autorizado para acceder a esta factura'}), 403

    payments = PurchaseInvoicePayment.query.filter_by(invoice_id=invoice_id).all()
    return jsonify([p.to_dict() for p in payments]), 200

@app.route('/api/purchase-invoices/<int:invoice_id>/payments', methods=['POST'])
@jwt_required()
def add_invoice_payment(invoice_id):
    current_user_id_str = get_jwt_identity()

    try:
        current_user_id = int(current_user_id_str)
        current_user = db.session.get(User, current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user ID in token"}), 403

    if not current_user:
        return jsonify({"message": "User specified in token not found"}), 404

    # Verificar que la factura existe y pertenece al tenant del usuario
    invoice = PurchaseInvoice.query.get(invoice_id)
    if not invoice:
        return jsonify({'message': 'Factura no encontrada'}), 404

    if invoice.tenant_id != current_user.tenant_id:
        return jsonify({'message': 'No autorizado para acceder a esta factura'}), 403

    data = request.get_json()
    amount = data.get('amount')
    notes = data.get('notes')

    if amount is None:
        return jsonify({'message': 'El monto es requerido'}), 400

    if amount <= 0:
        return jsonify({'message': 'El monto debe ser mayor que 0'}), 400

    # Calcular el saldo pendiente
    total_paid = sum(p.amount for p in invoice.payments)
    remaining = invoice.total_amount - total_paid

    if amount > remaining:
        return jsonify({
            'message': f'El monto ({amount}) excede el saldo pendiente ({remaining})',
            'remaining': remaining
        }), 400

    payment = PurchaseInvoicePayment(
        invoice_id=invoice_id,
        amount=amount,
        notes=notes
    )
    db.session.add(payment)

    # Actualizar estado de la factura si está completamente pagada
    new_total_paid = total_paid + amount
    if new_total_paid >= invoice.total_amount:
        invoice.status = 'paid'

    db.session.commit()
    return jsonify(payment.to_dict()), 201

# Mantener el bloque principal de ejecución aquí
if __name__ == '__main__':
    import os
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'

    if debug_mode:
        print("Iniciando servidor en modo desarrollo con WebSocket...")
        socketio.run(app, host='0.0.0.0', port=5003, debug=True, allow_unsafe_werkzeug=True)
    else:
        print("Iniciando servidor en modo producción con WebSocket...")
        # Para producción con WebSocket usamos eventlet o gevent
        # Si no están disponibles, usar threading
        socketio.run(app, host='0.0.0.0', port=5003, debug=False, allow_unsafe_werkzeug=True)