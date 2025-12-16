use axum::{Json, response::IntoResponse};
use serde::{Deserialize, Serialize};
use crate::ml::clustering::{cluster_logs, ClusteringParams, ClusteringResult};

#[derive(Deserialize)]
pub struct ClusterRequest {
    pub logs: Vec<String>,
    pub num_clusters: Option<usize>,
}

#[derive(Serialize)]
pub struct ClusterResponse {
    pub success: bool,
    pub result: Option<ClusteringResult>,
    pub error: Option<String>,
}

pub async fn handle_clustering(
    Json(payload): Json<ClusterRequest>,
) -> impl IntoResponse {
    let logs = payload.logs;
    let num_clusters = payload.num_clusters.unwrap_or(5); // Default 5 clusters

    // Vector size 100 is usually enough for simple log patterns
    let params = ClusteringParams {
        num_clusters,
        vector_size: 100, 
    };

    match cluster_logs(&logs, params) {
        Ok(result) => Json(ClusterResponse {
            success: true,
            result: Some(result),
            error: None,
        }),
        Err(e) => Json(ClusterResponse {
            success: false,
            result: None,
            error: Some(e),
        }),
    }
}
