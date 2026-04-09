from flask import Flask
from config import Config
from database import db, User
from werkzeug.security import generate_password_hash

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

with app.app_context():
    # Eliminar todos los administradores del tenant 1 excepto el usuario demo
    admins = User.query.filter(User.tenant_id == 1, User.role == 'administrador', User.username != 'demo').all()
    for admin in admins:
        db.session.delete(admin)
        print(f'Administrador {admin.username} eliminado.')
    db.session.commit()
    # Reactivar el usuario demo
    demo = User.query.filter_by(username='demo', tenant_id=1, role='administrador').first()
    if demo:
        demo.active = True
        print('Usuario demo reactivado.')
        db.session.commit()
    print('Todos los administradores (excepto demo) eliminados y demo reactivado.')

    user = User.query.filter_by(username='demo', tenant_id=1, role='administrador').first()
    if user:
        user.password_hash = generate_password_hash('demo')
        user.active = True
        user.must_change_password = False
        print('Usuario demo reseteado.')
    else:
        user = User(username='demo', password_hash=generate_password_hash('demo'), role='administrador', tenant_id=1, active=True, must_change_password=False)
        db.session.add(user)
        print('Usuario demo creado.')
    db.session.commit()
    print('Usuario demo listo para usar (usuario: demo, contraseña: demo, rol: administrador, tenant_id: 1)') 