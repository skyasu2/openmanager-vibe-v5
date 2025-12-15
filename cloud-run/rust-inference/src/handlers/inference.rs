use axum::Json;
use serde::{Deserialize, Serialize};

use crate::ml::{anomaly, trend};

// ============================================================================
// Request/Response Types
// ============================================================================

#[derive(Deserialize)]
pub struct AnomalyRequest {
    /// Time series values (e.g., CPU usage percentages)
    pub values: Vec<f64>,
    /// Window size for moving average (default: 26 hours in data points)
    #[serde(default = "default_window")]
    pub window_size: usize,
    /// Sigma threshold for anomaly detection (default: 2.0)
    #[serde(default = "default_sigma")]
    pub sigma: f64,
}

fn default_window() -> usize {
    26
}

fn default_sigma() -> f64 {
    2.0
}

#[derive(Serialize)]
pub struct AnomalyResponse {
    pub success: bool,
    pub anomalies: Vec<AnomalyPoint>,
    pub statistics: Statistics,
}

#[derive(Serialize)]
pub struct AnomalyPoint {
    pub index: usize,
    pub value: f64,
    pub moving_avg: f64,
    pub deviation: f64,
    pub is_anomaly: bool,
}

#[derive(Serialize)]
pub struct Statistics {
    pub mean: f64,
    pub std_dev: f64,
    pub upper_bound: f64,
    pub lower_bound: f64,
    pub anomaly_count: usize,
}

#[derive(Deserialize)]
pub struct TrendRequest {
    /// Time series values
    pub values: Vec<f64>,
    /// Number of future points to predict (default: 5)
    #[serde(default = "default_forecast")]
    pub forecast_steps: usize,
}

fn default_forecast() -> usize {
    5
}

#[derive(Serialize)]
pub struct TrendResponse {
    pub success: bool,
    pub trend: TrendInfo,
    pub predictions: Vec<f64>,
    pub regression: RegressionStats,
}

#[derive(Serialize)]
pub struct TrendInfo {
    pub direction: &'static str, // "up", "down", "stable"
    pub slope: f64,
    pub confidence: f64, // R² value
}

#[derive(Serialize)]
pub struct RegressionStats {
    pub slope: f64,
    pub intercept: f64,
    pub r_squared: f64,
}

// ============================================================================
// Handlers
// ============================================================================

/// POST /api/anomaly - Detect anomalies in time series data
pub async fn detect_anomaly(Json(req): Json<AnomalyRequest>) -> Json<AnomalyResponse> {
    let result = anomaly::detect(&req.values, req.window_size, req.sigma);
    Json(result)
}

/// POST /api/trend - Predict trend using linear regression
pub async fn predict_trend(Json(req): Json<TrendRequest>) -> Json<TrendResponse> {
    let result = trend::predict(&req.values, req.forecast_steps);
    Json(result)
}
