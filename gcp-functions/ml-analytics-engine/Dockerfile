# 🐳 Stage 1: Builder (Compile dependencies)
FROM python:3.10-slim as builder

WORKDIR /app

# Install build tools for NumPy/Extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies to /install directory
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# 🐳 Stage 2: Runner (Lightweight Runtime)
FROM python:3.10-slim

WORKDIR /app

# Copy installed dependencies from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY main.py .

# Environment Configuration
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Expose Port
EXPOSE 8080

# Run with Gunicorn (Optimized for Cloud Run)
# Threads: 8 (Good for I/O bound tasks like external API calls if any)
# Workers: 1 (Cloud Run scales via instances)
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app
