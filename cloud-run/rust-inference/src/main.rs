//! Rust ML Inference Service for LangGraph Support
//!
//! Provides statistical ML preprocessing for LangGraph agents:
//! - Analyst Agent: Anomaly detection (26-hour moving average + 2σ)
//! - NLQ Agent: Trend prediction (linear regression)

mod handlers;
mod ml;

use axum::{routing::get, routing::post, Router};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            "rust_inference=info,tower_http=info".into()
        }))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router
    let app = Router::new()
        // Health endpoints
        .route("/health", get(handlers::health::health_check))
        .route("/info", get(handlers::health::info))
        // ML inference endpoints
        .route("/api/anomaly", post(handlers::inference::detect_anomaly))
        .route("/api/trend", post(handlers::inference::predict_trend))
        .route("/api/clustering", post(handlers::clustering::handle_clustering))
        // Middleware
        .layer(TraceLayer::new_for_http())
        .layer(cors);

    // Get port from environment (Cloud Run sets PORT)
    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("PORT must be a number");

    let addr = SocketAddr::from(([0, 0, 0, 0], port));

    tracing::info!("🚀 Rust ML Service starting on {}", addr);
    tracing::info!("📊 Endpoints: /health, /info, /api/anomaly, /api/trend");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
