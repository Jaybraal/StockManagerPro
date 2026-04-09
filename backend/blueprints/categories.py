"""
Categories Blueprint - Handles category CRUD operations
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy.orm import joinedload
import traceback

from database import db, Category, Product
from utils.decorators import get_current_user, require_tenant_access

categories_bp = Blueprint('categories', __name__, url_prefix='/api')


@categories_bp.route('/categories/<int:tenant_id>', methods=['GET'])
@jwt_required()
@require_tenant_access
def get_categories_with_products(tenant_id, current_user):
    """Get all categories with their products for a tenant"""
    try:
        categories = Category.query.options(
            joinedload(Category.products)
        ).filter_by(tenant_id=current_user.tenant_id).all()

        result = []
        for cat in categories:
            if not hasattr(cat, 'products') or cat.products is None:
                continue

            result.append({
                'id': cat.id,
                'name': cat.name,
                'tax_percent': cat.tax_percent if hasattr(cat, 'tax_percent') else 0,
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
        traceback.print_exc()
        return jsonify({"message": "Error al obtener categorías", "error": str(e)}), 500


@categories_bp.route('/categories/<int:tenant_id>', methods=['POST'])
@jwt_required()
@require_tenant_access
def create_category_with_products(tenant_id, current_user):
    """Create a new category with optional products"""
    data = request.get_json()
    category_name = data.get('categoryName') or data.get('name')
    tax_percent = data.get('taxPercent') if 'taxPercent' in data else data.get('tax_percent', 0)
    products = data.get('products', [])

    if not category_name:
        return jsonify({'message': 'Falta el nombre de la categoría'}), 400

    try:
        category = Category(tenant_id=tenant_id, name=category_name, tax_percent=tax_percent)
        db.session.add(category)
        db.session.flush()

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
        return jsonify({
            'message': 'Categoría y productos creados' if products else 'Categoría creada',
            'category_id': category.id,
            'products': created_products
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error al crear la categoría/productos', 'error': str(e)}), 500


@categories_bp.route('/categories/<int:tenant_id>/<int:category_id>', methods=['DELETE'])
@jwt_required()
@require_tenant_access
def delete_category(tenant_id, category_id, current_user):
    """Delete a category and all its products"""
    if current_user.role != 'administrador':
        return jsonify({'message': 'Solo administradores pueden eliminar categorías'}), 403

    try:
        category = Category.query.filter_by(id=category_id, tenant_id=tenant_id).first()
        if not category:
            return jsonify({'message': 'Categoría no encontrada'}), 404

        # Delete all products in this category first
        Product.query.filter_by(category_id=category_id, tenant_id=tenant_id).delete()

        db.session.delete(category)
        db.session.commit()
        return jsonify({'message': 'Categoría y productos eliminados exitosamente'}), 200

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'message': 'Error al eliminar la categoría', 'error': str(e)}), 500
