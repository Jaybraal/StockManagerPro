from flask import Flask
from config import Config
from database import db, User
from werkzeug.security import generate_password_hash

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

with app.app_context():
    # Eliminar todos los usuarios excepto el demo
    User.query.filter(~((User.username == 'demo') & (User.tenant_id == 1) & (User.role == 'administrador'))).delete(synchronize_session=False)
    db.session.commit()
    # Crear o actualizar el usuario demo
    user = User.query.filter_by(username='demo', tenant_id=1, role='administrador').first()
    if user:
        user.password_hash = generate_password_hash('demo')
        user.active = True
        user.must_change_password = True
        print('Usuario demo reseteado y forzado a cambiar credenciales.')
    else:
        user = User(username='demo', password_hash=generate_password_hash('demo'), role='administrador', tenant_id=1, active=True, must_change_password=True)
        db.session.add(user)
        print('Usuario demo creado y forzado a cambiar credenciales.')
    db.session.commit()
    print('Base de datos limpia. Solo existe el usuario demo (usuario: demo, contraseña: demo, rol: administrador, tenant_id: 1, must_change_password: True)') 