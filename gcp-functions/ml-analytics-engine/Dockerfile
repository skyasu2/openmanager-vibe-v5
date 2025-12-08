# Python 3.10 - Cloud Run Optimized
# ML Analytics Engine - Time Series & Anomaly Detection
# Version: 3.0.0
FROM python:3.10-slim

# Install system dependencies (numpy/pandas compilation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for cache efficiency
COPY requirements.txt .

# Install Python dependencies (including gunicorn for production)
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy application code
COPY main.py .

# Cloud Run uses PORT environment variable
ENV PORT=8080
EXPOSE 8080

# Run with Gunicorn for production (Cloud Run compatible)
# Workers: 1 (Cloud Run scales via instances, not workers)
# Timeout: 300s (for long ML processing)
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 300 main:app
