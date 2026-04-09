from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from config import Config
from database import db, User, Product, Sale, SaleItem, Tenant, Category, TokenBlocklist, FiscalClient, Return, ReturnItem, Supplier, Purchase, PurchaseItem, PurchaseInvoice, PurchaseInvoicePayment

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)

with app.app_context():
    db.create_all()
    print("Tablas creadas exitosamente.") 