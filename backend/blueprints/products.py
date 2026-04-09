"""
Products Blueprint - Handles product CRUD operations
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy.orm import joinedload
import traceback

from database import db, Category, Product
from utils.decorators import get_current_user, require_tenant_access, require_admin

products_bp = Blueprint('products', __name__, url_prefix='/api')


@products_bp.route('/products/<int:tenant_id>', methods=['GET'])
@jwt_required()
@require_tenant_access
def get_products(tenant_id, current_user):
    """Get all products organized by categories"""
    try:
        categories = Category.query.options(
            joinedload(Category.products)
        ).filter_by(tenant_id=tenant_id).all()

        result = []
        for cat in categories:
            products_data = []
            for p in cat.products:
                products_data.append({
                    'id': p.id,
                    'name': p.name,
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
                'products': products_data
            })

        return jsonify(result), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": "Error al obtener productos", "error": str(e)}), 500


@products_bp.route('/products/<int:tenant_id>', methods=['POST'])
@jwt_required()
@require_tenant_access
def create_product(tenant_id, current_user):
    """Create a new product"""
    data = request.get_json()
    name = data.get('name')
    price = data.get('price')
    stock = data.get('stock')
    stock_minimo = data.get('stock_minimo', 5)
    category_id = data.get('category_id')
    unidadesPorEmpaque = data.get('unidadesPorEmpaque')
    costePorItem = data.get('costePorItem')
    barcode = data.get('barcode')

    if not name or price is None or stock is None or category_id is None:
        return jsonify({'message': 'Faltan campos obligatorios: nombre, precio, stock, category_id'}), 400

    try:
        category = Category.query.filter_by(id=category_id, tenant_id=tenant_id).first()
        if not category:
            return jsonify({'message': 'Categoría no encontrada para este tenant'}), 404

        if barcode:
            existing = Product.query.filter_by(tenant_id=tenant_id, barcode=barcode).first()
            if existing:
                return jsonify({'message': f"El código de barras {barcode} ya está registrado"}), 400

        new_product = Product(
            tenant_id=tenant_id,
            name=name,
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
        traceback.print_exc()
        return jsonify({'message': 'Error interno al crear el producto', 'error': str(e)}), 500


@products_bp.route('/product/<int:tenant_id>/barcode/<string:barcode>', methods=['GET'])
@jwt_required()
@require_tenant_access
def get_product_by_barcode(tenant_id, barcode, current_user):
    """Get a product by its barcode"""
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


@products_bp.route('/products/<int:tenant_id>/<int:product_id>', methods=['PUT'])
@jwt_required()
@require_tenant_access
@require_admin
def update_product(tenant_id, product_id, current_user):
    """Update a product"""
    data = request.get_json()

    allowed_fields = ['name', 'price', 'stock', 'stock_minimo', 'category_id', 'unidadesPorEmpaque', 'costePorItem', 'barcode']
    if not any(field in data for field in allowed_fields):
        return jsonify({'message': 'No se proporcionaron campos para actualizar'}), 400

    try:
        product = Product.query.filter_by(id=product_id, tenant_id=tenant_id).first()
        if not product:
            return jsonify({'message': 'Producto no encontrado para este tenant'}), 404

        for field in allowed_fields:
            if field in data:
                value = data[field]
                if isinstance(value, str) and value.strip() == '':
                    value = None

                if field in ['price', 'costePorItem'] and value is not None:
                    setattr(product, field, float(value))
                elif field in ['stock', 'stock_minimo', 'unidadesPorEmpaque'] and value is not None:
                    setattr(product, field, int(value))
                else:
                    setattr(product, field, value)

        if 'category_id' in data and data['category_id'] is not None:
            category = Category.query.filter_by(id=data['category_id'], tenant_id=tenant_id).first()
            if not category:
                return jsonify({'message': 'Categoría no encontrada para este tenant'}), 400
            product.category_id = int(data['category_id'])

        if 'barcode' in data and data['barcode'] is not None and data['barcode'] != product.barcode:
            existing = Product.query.filter_by(tenant_id=tenant_id, barcode=data['barcode']).first()
            if existing:
                return jsonify({'message': f"El código de barras {data['barcode']} ya está registrado"}), 400
            product.barcode = data['barcode']

        db.session.commit()
        return jsonify({'message': 'Producto actualizado exitosamente', 'product_id': product.id}), 200

    except ValueError as ve:
        db.session.rollback()
        return jsonify({'message': 'Error de validación de datos', 'error': str(ve)}), 400
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'message': 'Error interno al actualizar el producto', 'error': str(e)}), 500


@products_bp.route('/products/<int:tenant_id>/<int:product_id>', methods=['DELETE'])
@jwt_required()
@require_tenant_access
@require_admin
def delete_product(tenant_id, product_id, current_user):
    """Delete a product"""
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
