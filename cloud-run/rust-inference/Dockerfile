# ============================================================================
# Multi-stage Dockerfile for Rust ML Inference Service
# Optimized for Cloud Run cold start (~150ms)
# ============================================================================

# Stage 1: Build
FROM rust:1.83-alpine AS builder

# Install musl-dev for static linking
RUN apk add --no-cache musl-dev

WORKDIR /app

# Copy manifests first for better caching
COPY Cargo.toml Cargo.lock* ./

# Create dummy src to build dependencies
RUN mkdir src && \
    echo 'fn main() { println!("dummy"); }' > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy actual source code
COPY src ./src

# Build the actual binary (touch to invalidate cache)
RUN touch src/main.rs && cargo build --release

# Stage 2: Runtime (minimal image)
FROM alpine:3.21 AS runtime

# Install runtime dependencies (ca-certificates for HTTPS)
RUN apk add --no-cache ca-certificates

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/rust-inference /app/rust-inference

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Cloud Run uses PORT environment variable
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the binary
CMD ["./rust-inference"]
