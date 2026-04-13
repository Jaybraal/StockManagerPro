import os
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import json
from datetime import datetime, timedelta

db = SQLAlchemy()

# --- Modelos de la Base de Datos ---

class Tenant(db.Model):
    __tablename__ = 'tenants'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    config = db.Column(db.JSON, nullable=True)
    users = db.relationship('User', back_populates='tenant', lazy=True)
    products = db.relationship('Product', back_populates='tenant', lazy=True)
    categories = db.relationship('Category', back_populates='tenant', lazy=True)

class TokenBlocklist(db.Model):
    __tablename__ = 'token_blocklist'
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, nullable=False)

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255))
    role = db.Column(db.String(20), nullable=False)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False)
    active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime)
    last_logout = db.Column(db.DateTime)
    must_change_password = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    tenant = db.relationship('Tenant', back_populates='users')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    tax_percent = db.Column(db.Float, nullable=False, default=0)

    tenant = db.relationship('Tenant', back_populates='categories')
    products = db.relationship('Product', backref='category_obj', lazy=True)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False)
    barcode = db.Column(db.String(100), nullable=True, index=True)
    name = db.Column(db.String(120), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    unit = db.Column(db.String(50), nullable=True)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, nullable=False, default=0)
    stock_minimo = db.Column(db.Integer, nullable=False, default=5)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True, index=True)
    unidadesPorEmpaque = db.Column(db.Integer, nullable=True)
    costePorItem = db.Column(db.Float, nullable=True)

    __table_args__ = (
        db.UniqueConstraint('tenant_id', 'barcode', name='_tenant_barcode_uc'),
        db.Index('ix_product_tenant_name', 'tenant_id', 'name'),
        db.Index('ix_product_tenant_barcode', 'tenant_id', 'barcode'),
    )

    tenant = db.relationship('Tenant', back_populates='products')

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    target_role = db.Column(db.String(20), nullable=True)
    type = db.Column(db.String(50), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    tenant = db.relationship('Tenant', backref='notifications')
    user = db.relationship('User', backref='notifications')

    def to_dict(self):
        return {
            'id': self.id,
            'tenant_id': self.tenant_id,
            'user_id': self.user_id,
            'target_role': self.target_role,
            'type': self.type,
            'message': self.message,
            'read': self.read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Supplier(db.Model):
    __tablename__ = 'suppliers'
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    contact_name = db.Column(db.String(120))
    email = db.Column(db.String(120))
    phone = db.Column(db.String(50))
    address = db.Column(db.String(255))
    tax_id = db.Column(db.String(50))
    status = db.Column(db.String(20), default='active')
    notes = db.Column(db.Text)

    tenant = db.relationship('Tenant', backref='suppliers')

    def to_dict(self):
        return {
            'id': self.id,
            'tenant_id': self.tenant_id,
            'name': self.name,
            'contact_name': self.contact_name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'tax_id': self.tax_id,
            'status': self.status,
            'notes': self.notes
        }

class StockMovement(db.Model):
    __tablename__ = 'stock_movements'
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    type = db.Column(db.String(20), nullable=False)  # entrada, salida, ajuste
    quantity = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(100), nullable=True)
    stock_before = db.Column(db.Integer, nullable=False)
    stock_after = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    product = db.relationship('Product', backref='movements')
    user = db.relationship('User', backref='stock_movements')

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'type': self.type,
            'quantity': self.quantity,
            'reason': self.reason,
            'stock_before': self.stock_before,
            'stock_after': self.stock_after,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# --- Inicialización de la Base de Datos ---

def init_db(app):
    with app.app_context():
        db.create_all()

        if not Tenant.query.first():
            tenant = Tenant(
                name="Negocio Demo",
                config=json.dumps({
                    "currency": "DOP",
                    "address": "Calle Demo 123",
                    "name": "Mi Almacen"
                })
            )
            db.session.add(tenant)
            db.session.commit()

            admin = User(
                username="demo",
                password_hash=generate_password_hash("demo"),
                role="administrador",
                tenant_id=tenant.id,
                must_change_password=True
            )
            db.session.add(admin)
            db.session.commit()


        demo_user = User.query.filter_by(username='demo').first()
        if demo_user and not demo_user.password_hash:
            demo_user.set_password('demo')
            db.session.commit()

        users_without_password = User.query.filter(User.password_hash == None).all()
        for user in users_without_password:
            user.set_password('changeme')
        db.session.commit()
