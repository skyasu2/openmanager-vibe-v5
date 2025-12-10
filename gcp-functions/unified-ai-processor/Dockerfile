# Python 3.10 - Unified AI Processor - Cloud Run Optimized
# Version: 3.3.0 (2025-12-10) - Quart Async + Hypercorn ASGI
FROM python:3.10-slim

# Install system dependencies
# - build-essential: for numpy/pandas compilation
# - g++: for C++ dependencies (spaCy, scikit-learn)
# Note: Java (default-jdk) removed - KoNLPy no longer used
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for cache efficiency
COPY requirements.txt .

# Install Python dependencies (hypercorn included in requirements.txt)
RUN pip install --no-cache-dir -r requirements.txt

# Copy modules first (shared engines)
COPY modules/ ./modules/

# Copy application code
COPY main.py .

# Cloud Run uses PORT environment variable
ENV PORT=8080
EXPOSE 8080

# Run with Hypercorn for async production (ASGI server for Quart)
# Workers: 1 (Cloud Run scales via instances, not workers)
# Keep-alive: 300s (for long AI processing)
# Graceful timeout: 30s
CMD exec hypercorn main:app --bind 0.0.0.0:$PORT --workers 1 --keep-alive 300 --graceful-timeout 30
