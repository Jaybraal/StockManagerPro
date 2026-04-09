# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend
FROM python:3.11-slim
WORKDIR /app/backend

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy React build output
COPY --from=frontend-build /app/frontend/build /app/frontend/build

# Expose port
EXPOSE 8000

# Start with gunicorn + gevent (required for Flask-SocketIO)
CMD ["/bin/sh", "-c", "gunicorn --worker-class gevent -w 1 --bind 0.0.0.0:${PORT:-8000} --timeout 120 app:app"]
