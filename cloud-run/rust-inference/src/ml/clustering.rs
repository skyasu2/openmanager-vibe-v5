use linfa::dataset::AsTargets;
use linfa::traits::{Fit, Predict};
use linfa::Dataset;
use linfa_clustering::KMeans;
use ndarray::Array2;
use rand::thread_rng;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

/// Parameters for log clustering
pub struct ClusteringParams {
    pub num_clusters: usize,
    pub vector_size: usize,
}

/// Result of log clustering
#[derive(serde::Serialize)]
pub struct ClusteringResult {
    pub clusters: Vec<ClusterInfo>,
    pub outliers: Vec<usize>, // Indicies of outliers (if supported, for KMeans usually just far points)
}

#[derive(serde::Serialize)]
pub struct ClusterInfo {
    pub id: usize,
    pub size: usize,
    pub representative_log: String, // The log closest to centroid or just first one
    pub member_indices: Vec<usize>,
}

/// main function to cluster logs
pub fn cluster_logs(logs: &[String], params: ClusteringParams) -> Result<ClusteringResult, String> {
    if logs.is_empty() {
        return Err("No logs provided".to_string());
    }

    // 1. Vectorize Logs (Hashing Trick)
    // Map each log string to a fixed size float vector
    let records: Array2<f64> = vectorize_logs(logs, params.vector_size)?;

    // 2. Wrap in Linfa Dataset
    let dataset = Dataset::from(records);

    // 3. Train K-Means
    // We try to find `num_clusters`. If logs < num_clusters, adjust.
    let k = params.num_clusters.min(logs.len());
    
    let model = KMeans::params_with_rng(k, thread_rng())
        .max_n_iterations(200)
        .tolerance(1e-5)
        .fit(&dataset)
        .map_err(|e| format!("KMeans fitting failed: {}", e))?;

    // 4. Predict (Assign clusters)
    let predictions = model.predict(&dataset);
    let targets = predictions.as_targets();

    // 5. Organize results
    let mut clusters_map: Vec<ClusterInfo> = (0..k)
        .map(|id| ClusterInfo {
            id,
            size: 0,
            representative_log: String::new(),
            member_indices: Vec::new(),
        })
        .collect();

    // Iterate over targets (cluster assignments)
    for (row_idx, &cluster_id) in targets.iter().enumerate() {
        if cluster_id < k {
            clusters_map[cluster_id].size += 1;
            clusters_map[cluster_id].member_indices.push(row_idx);

            // Simple heuristic: First member becomes representative
            if clusters_map[cluster_id].representative_log.is_empty() {
                clusters_map[cluster_id].representative_log = logs[row_idx].clone();
            }
        }
    }

    // Filter out empty clusters (just in case)
    let active_clusters: Vec<ClusterInfo> = clusters_map
        .into_iter()
        .filter(|c| c.size > 0)
        .collect();

    Ok(ClusteringResult {
        clusters: active_clusters,
        outliers: vec![], // KMeans forces assignment, so no explicit outliers unless we define threshold
    })
}

/// Simple Hashing Trick Vectorizer
/// Converts a string into a fixed-size frequency vector using hashing
fn vectorize_logs(logs: &[String], vector_size: usize) -> Result<Array2<f64>, String> {
    let mut data = Vec::with_capacity(logs.len() * vector_size);

    for log in logs {
        let mut vector = vec![0.0; vector_size];
        
        // Simple tokenization: split by whitespace and non-alphanumeric
        let tokens = log.split(|c: char| !c.is_alphanumeric())
            .filter(|s| !s.is_empty());

        for token in tokens {
            let mut hasher = DefaultHasher::new();
            token.hash(&mut hasher);
            let hash = hasher.finish();
            let index = (hash as usize) % vector_size;
            vector[index] += 1.0;
        }

        // Normalize vector (L2) to prevent length bias
        let magnitude: f64 = vector.iter().map(|x| x * x).sum::<f64>().sqrt();
        if magnitude > 0.0 {
            for x in &mut vector {
                *x /= magnitude;
            }
        }

        data.extend(vector);
    }

    Array2::from_shape_vec((logs.len(), vector_size), data)
        .map_err(|e| format!("Failed to create array: {}", e))
}
