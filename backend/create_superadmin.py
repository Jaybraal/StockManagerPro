"""
Script de emergencia para crear el superadmin manualmente.
Ejecutar en Railway: python create_superadmin.py
"""
from app import app
from database import db, User, Tenant
from werkzeug.security import generate_password_hash

with app.app_context():
    existing = User.query.filter_by(role='superadmin').first()
    if existing:
        print(f"Superadmin ya existe: '{existing.username}' (activo={existing.active})")
    else:
        tenant = Tenant.query.order_by(Tenant.id).first()
        if not tenant:
            print("ERROR: No hay ningún tenant en la base de datos.")
        else:
            sa = User(
                username='superadmin',
                password_hash=generate_password_hash('superadmin'),
                role='superadmin',
                tenant_id=tenant.id,
                must_change_password=True,
                active=True
            )
            db.session.add(sa)
            db.session.commit()
            print(f"Superadmin creado en tenant '{tenant.name}'")
            print("Usuario: superadmin | Contraseña: superadmin")
            print("IMPORTANTE: Cámbiala al primer login.")
