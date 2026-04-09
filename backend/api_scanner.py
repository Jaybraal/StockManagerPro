import requests
import json
from typing import Dict, List, Optional
from datetime import datetime
import logging
import socket
import re
from database import db, Product, Category
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from collections import Counter

class APIScanner:
    def __init__(self, program_name: str):
        """
        Inicializa el escáner de API
        
        Args:
            program_name (str): Nombre del programa a escanear
        """
        self.program_name = program_name.lower()
        self.api_url = None
        self.api_key = None
        self.headers = {
            'Content-Type': 'application/json',
        }
        
        # Configurar logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Inicializar NLTK para categorización
        try:
            nltk.data.find('tokenizers/punkt')
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('punkt')
            nltk.download('stopwords')

    def detect_api(self) -> bool:
        """
        Detecta la API del programa seleccionado
        
        Returns:
            bool: True si se detectó la API correctamente
        """
        try:
            # Lista de puertos comunes para APIs
            common_ports = [3000, 5000, 8000, 8080, 9000]
            
            # Obtener la IP local
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            
            # Intentar detectar la API en diferentes puertos
            for port in common_ports:
                try:
                    # Intentar diferentes rutas comunes de API
                    api_paths = [
                        '/api',
                        '/api/v1',
                        '/api/products',
                        '/products',
                        '/api/items',
                        '/items'
                    ]
                    
                    for path in api_paths:
                        url = f'http://{local_ip}:{port}{path}'
                        self.logger.info(f"Intentando conectar a: {url}")
                        
                        response = requests.get(url, timeout=2)
                        if response.status_code == 200:
                            # Verificar si la respuesta parece ser una API de productos
                            try:
                                data = response.json()
                                if isinstance(data, (list, dict)) and self._looks_like_product_data(data):
                                    self.api_url = url
                                    self.logger.info(f"API detectada en: {url}")
                                    return True
                            except json.JSONDecodeError:
                                continue
                except requests.exceptions.RequestException:
                    continue
            
            # Si no se encontró en la IP local, intentar con localhost
            for port in common_ports:
                try:
                    for path in api_paths:
                        url = f'http://localhost:{port}{path}'
                        self.logger.info(f"Intentando conectar a: {url}")
                        
                        response = requests.get(url, timeout=2)
                        if response.status_code == 200:
                            try:
                                data = response.json()
                                if isinstance(data, (list, dict)) and self._looks_like_product_data(data):
                                    self.api_url = url
                                    self.logger.info(f"API detectada en: {url}")
                                    return True
                            except json.JSONDecodeError:
                                continue
                except requests.exceptions.RequestException:
                    continue
            
            self.logger.error("No se pudo detectar la API del programa")
            return False
            
        except Exception as e:
            self.logger.error(f"Error al detectar la API: {str(e)}")
            return False

    def _looks_like_product_data(self, data: Dict) -> bool:
        """
        Verifica si los datos parecen ser de productos
        
        Args:
            data (Dict): Datos a verificar
            
        Returns:
            bool: True si los datos parecen ser de productos
        """
        if isinstance(data, list):
            # Verificar el primer elemento si es una lista
            if len(data) > 0:
                data = data[0]
            else:
                return False
                
        # Verificar campos comunes en productos
        required_fields = ['name', 'price']
        optional_fields = ['description', 'stock', 'sku', 'category']
        
        # Verificar si tiene al menos los campos requeridos
        has_required = all(field in data for field in required_fields)
        has_optional = any(field in data for field in optional_fields)
        
        return has_required and has_optional

    def scan_products(self, endpoint: str = '/products') -> List[Dict]:
        """
        Escanea productos desde la API detectada
        
        Args:
            endpoint (str): Endpoint específico para obtener productos
            
        Returns:
            List[Dict]: Lista de productos encontrados
        """
        if not self.api_url:
            self.logger.error("No hay API detectada")
            return []
            
        try:
            response = requests.get(
                f"{self.api_url}{endpoint}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error al escanear productos: {str(e)}")
            return []

    def _categorize_product(self, product_name: str, description: str = "") -> str:
        """
        Categoriza un producto basado en su nombre y descripción
        
        Args:
            product_name (str): Nombre del producto
            description (str): Descripción del producto
            
        Returns:
            str: Nombre de la categoría
        """
        # Palabras clave para categorías comunes
        category_keywords = {
            'Alimentos': ['comida', 'alimento', 'comestible', 'bebida', 'snack', 'golosina'],
            'Electrónica': ['electrónico', 'digital', 'tecnología', 'gadget', 'dispositivo'],
            'Ropa': ['ropa', 'vestido', 'camisa', 'pantalón', 'zapatos', 'accesorio'],
            'Hogar': ['hogar', 'casa', 'mueble', 'decoración', 'limpieza'],
            'Salud': ['salud', 'medicamento', 'vitamina', 'suplemento', 'bienestar'],
            'Papelería': ['papel', 'lápiz', 'pluma', 'cuaderno', 'oficina'],
            'Juguetes': ['juguete', 'juego', 'entretenimiento', 'diversión'],
            'Otros': []  # Categoría por defecto
        }
        
        # Combinar nombre y descripción para análisis
        text = f"{product_name} {description}".lower()
        
        # Tokenizar y eliminar stopwords
        tokens = word_tokenize(text)
        stop_words = set(stopwords.words('spanish'))
        tokens = [word for word in tokens if word.isalnum() and word not in stop_words]
        
        # Contar ocurrencias de palabras clave
        word_counts = Counter(tokens)
        
        # Encontrar la categoría con más coincidencias
        max_matches = 0
        best_category = 'Otros'
        
        for category, keywords in category_keywords.items():
            matches = sum(word_counts[word] for word in keywords if word in word_counts)
            if matches > max_matches:
                max_matches = matches
                best_category = category
        
        return best_category

    def _get_or_create_category(self, category_name: str, tenant_id: int) -> int:
        """
        Obtiene o crea una categoría
        
        Args:
            category_name (str): Nombre de la categoría
            tenant_id (int): ID del tenant
            
        Returns:
            int: ID de la categoría
        """
        category = Category.query.filter_by(
            name=category_name,
            tenant_id=tenant_id
        ).first()
        
        if not category:
            category = Category(
                name=category_name,
                tenant_id=tenant_id
            )
            db.session.add(category)
            db.session.flush()
            self.logger.info(f"Categoría creada: {category_name}")
        
        return category.id

    def map_product(self, external_product: Dict, tenant_id: int) -> Dict:
        """
        Mapea un producto externo al formato de tu sistema
        
        Args:
            external_product (Dict): Producto en formato de la API externa
            tenant_id (int): ID del tenant
            
        Returns:
            Dict: Producto mapeado al formato de tu sistema
        """
        # Obtener o crear categoría
        category_name = external_product.get('category')
        if not category_name:
            # Categorizar automáticamente si no hay categoría
            category_name = self._categorize_product(
                external_product.get('name', ''),
                external_product.get('description', '')
            )
        
        category_id = self._get_or_create_category(category_name, tenant_id)
        
        # Mapeo de campos comunes
        mapped_product = {
            'name': external_product.get('name', ''),
            'description': external_product.get('description', ''),
            'price': float(external_product.get('price', 0.0)),
            'stock': int(external_product.get('stock', 0)),
            'sku': external_product.get('sku', ''),
            'imported_at': datetime.now().isoformat(),
            'external_id': external_product.get('id', ''),
            'stock_minimo': int(external_product.get('stock_minimo', 5)),
            'unidadesPorEmpaque': int(external_product.get('unidadesPorEmpaque', 1)),
            'costePorItem': float(external_product.get('costePorItem', 0.0)),
            'category_id': category_id
        }
        return mapped_product

    def import_products(self, products: List[Dict], tenant_id: int) -> bool:
        """
        Importa productos a tu sistema
        
        Args:
            products (List[Dict]): Lista de productos mapeados
            tenant_id (int): ID del tenant
            
        Returns:
            bool: True si la importación fue exitosa
        """
        try:
            for product_data in products:
                # Verificar si el producto ya existe
                existing_product = Product.query.filter_by(
                    name=product_data['name'],
                    sku=product_data['sku'],
                    tenant_id=tenant_id
                ).first()
                
                if existing_product:
                    # Actualizar producto existente
                    existing_product.description = product_data['description']
                    existing_product.price = product_data['price']
                    existing_product.stock = product_data['stock']
                    existing_product.stock_minimo = product_data.get('stock_minimo', 0)
                    existing_product.unidadesPorEmpaque = product_data.get('unidadesPorEmpaque', 1)
                    existing_product.costePorItem = product_data.get('costePorItem', 0.0)
                    existing_product.category_id = product_data['category_id']
                else:
                    # Crear nuevo producto
                    new_product = Product(
                        tenant_id=tenant_id,
                        name=product_data['name'],
                        description=product_data['description'],
                        price=product_data['price'],
                        stock=product_data['stock'],
                        stock_minimo=product_data.get('stock_minimo', 0),
                        unidadesPorEmpaque=product_data.get('unidadesPorEmpaque', 1),
                        costePorItem=product_data.get('costePorItem', 0.0),
                        sku=product_data['sku'],
                        category_id=product_data['category_id']
                    )
                    db.session.add(new_product)
                
                self.logger.info(f"Producto importado: {product_data['name']} en categoría {product_data['category_id']}")
            
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error al importar productos: {str(e)}")
            return False

    def run_scan(self, tenant_id: int) -> bool:
        """
        Ejecuta el proceso completo de detección, escaneo e importación
        
        Args:
            tenant_id (int): ID del tenant
            
        Returns:
            bool: True si el proceso fue exitoso
        """
        try:
            # Primero detectar la API
            if not self.detect_api():
                self.logger.error("No se pudo detectar la API del programa")
                return False

            # Escanear productos
            products = self.scan_products()
            if not products:
                self.logger.warning("No se encontraron productos para importar")
                return False

            # Mapear productos
            mapped_products = [self.map_product(p, tenant_id) for p in products]

            # Importar productos
            return self.import_products(mapped_products, tenant_id)
        except Exception as e:
            self.logger.error(f"Error en el proceso de escaneo: {str(e)}")
            return False 