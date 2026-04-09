from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Importar todos los modelos aquí
from database import User, Product, Sale, SaleItem, Tenant, Category, TokenBlocklist, FiscalClient, Return, ReturnItem, Supplier, Purchase, PurchaseItem, PurchaseInvoice, PurchaseInvoicePayment 