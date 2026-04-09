import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Determinar la ruta base según el entorno
if getattr(sys, 'frozen', False):
    # Si estamos en un entorno empaquetado (PyInstaller)
    BASE_DIR = os.path.dirname(sys.executable)
else:
    # Si estamos en desarrollo
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Obtener la URI de la base de datos
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no está definida. Configura tu archivo .env para usar PostgreSQL.")
print(f"[Backend] SQLALCHEMY_DATABASE_URI: {DATABASE_URL}")

from datetime import timedelta

class Config:
    # Configuración de la base de datos
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Configuración de JWT con cookies HttpOnly
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    if not JWT_SECRET_KEY or JWT_SECRET_KEY == 'your-secret-key-here':
        raise RuntimeError("JWT_SECRET_KEY debe estar configurada con una clave segura en .env")

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # JWT en cookies HttpOnly (más seguro que localStorage)
    JWT_TOKEN_LOCATION = ['cookies', 'headers']  # Soporta ambos para compatibilidad
    JWT_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False').lower() == 'true'  # True en producción (HTTPS)
    JWT_COOKIE_CSRF_PROTECT = True  # Protección CSRF habilitada
    JWT_CSRF_IN_COOKIES = True
    JWT_ACCESS_COOKIE_NAME = 'access_token_cookie'
    JWT_REFRESH_COOKIE_NAME = 'refresh_token_cookie'
    JWT_ACCESS_CSRF_COOKIE_NAME = 'csrf_access_token'
    JWT_REFRESH_CSRF_COOKIE_NAME = 'csrf_refresh_token'
    JWT_COOKIE_SAMESITE = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')

    # CSRF Secret Key
    CSRF_SECRET_KEY = os.getenv('CSRF_SECRET_KEY', JWT_SECRET_KEY)

    # Configuración de email
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER')

    # Configuración de Redis para rate limiting
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    # Configuración de rate limiting
    RATELIMIT_DEFAULT = "200 per day;50 per hour;10 per minute"
    RATELIMIT_STORAGE_URL = REDIS_URL
    RATELIMIT_STRATEGY = 'fixed-window'

    # Configuración de CORS
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080"
    ]
    CORS_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    CORS_HEADERS = ["Content-Type", "Authorization", "X-CSRF-TOKEN"]

    # Configuración de subida de archivos
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB máximo
    ALLOWED_EXTENSIONS = {'pdf', 'xml'}
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'comprobantes') 