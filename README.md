# StockManagerPro - Instrucciones de Instalación

## Requisitos
- Windows 10 o superior
- Python 3.11 o superior
- pip (gestor de paquetes de Python)
- Navegador web moderno (Chrome, Firefox, Edge)

## Instalación
1. Instalar dependencias del backend:
   ```bash
   pip install -r requirements.txt
   ```

2. Configurar la base de datos:
   - La base de datos se creará automáticamente al iniciar
   - Se ubicará en backend/instance/pos_multitenant.db

3. Iniciar el servidor:
   - Hacer doble clic en start.bat
   - O desde la línea de comandos:
     ```bash
     python app.py
     ```

4. Acceder a la aplicación:
   - Abrir el navegador
   - Ir a http://localhost:5001

## Configuración de Producción
Para un entorno de producción en Windows, se recomienda:
- Usar Waitress como servidor WSGI (ya incluido)
- Configurar el firewall de Windows para permitir el puerto 5001
- Configurar respaldos automáticos de la base de datos
- Usar Task Scheduler de Windows para automatizar tareas
