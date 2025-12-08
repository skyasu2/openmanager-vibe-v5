# Python 3.10 with KoNLPy support (Java required)
# Unified AI Processor - Cloud Run Optimized
# Version: 3.0.0
FROM python:3.10-slim

# Install system dependencies
# - build-essential: for numpy/pandas compilation
# - default-jdk: required for KoNLPy (Korean NLP)
# - g++: for C++ dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-jdk \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set Java environment for KoNLPy
ENV JAVA_HOME=/usr/lib/jvm/default-java

WORKDIR /app

# Copy requirements first for cache efficiency
COPY requirements.txt .

# Install Python dependencies (including gunicorn for production)
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy modules first (shared engines)
COPY modules/ ./modules/

# Copy application code
COPY main.py .

# Cloud Run uses PORT environment variable
ENV PORT=8080
EXPOSE 8080

# Run with Gunicorn for production (Cloud Run compatible)
# Workers: 1 (Cloud Run scales via instances, not workers)
# Timeout: 300s (for long AI processing)
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 300 main:app
