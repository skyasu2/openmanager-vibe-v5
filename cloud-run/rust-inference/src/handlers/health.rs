use axum::Json;
use serde::Serialize;

#[derive(Serialize)]
pub struct HealthResponse {
    status: &'static str,
    service: &'static str,
    version: &'static str,
}

#[derive(Serialize)]
pub struct InfoResponse {
    name: &'static str,
    version: &'static str,
    description: &'static str,
    endpoints: Vec<EndpointInfo>,
}

#[derive(Serialize)]
pub struct EndpointInfo {
    path: &'static str,
    method: &'static str,
    description: &'static str,
}

/// GET /health - Health check endpoint
pub async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "healthy",
        service: "rust-inference",
        version: env!("CARGO_PKG_VERSION"),
    })
}

/// GET /info - Service information
pub async fn info() -> Json<InfoResponse> {
    Json(InfoResponse {
        name: "Rust ML Inference Service",
        version: env!("CARGO_PKG_VERSION"),
        description: "LangGraph ML Support - Anomaly Detection & Trend Prediction",
        endpoints: vec![
            EndpointInfo {
                path: "/health",
                method: "GET",
                description: "Health check",
            },
            EndpointInfo {
                path: "/info",
                method: "GET",
                description: "Service information",
            },
            EndpointInfo {
                path: "/api/anomaly",
                method: "POST",
                description: "Detect anomalies in time series data (26h moving avg + 2σ)",
            },
            EndpointInfo {
                path: "/api/trend",
                method: "POST",
                description: "Predict trend using linear regression",
            },
        ],
    })
}
