//! Anomaly Detection Algorithm
//!
//! Implements 26-hour moving average + 2σ threshold detection
//! Ported from: src/lib/ai/monitoring/SimpleAnomalyDetector.ts

use crate::handlers::inference::{AnomalyPoint, AnomalyResponse, Statistics};

/// Detect anomalies in time series data using moving average + standard deviation
pub fn detect(values: &[f64], window_size: usize, sigma: f64) -> AnomalyResponse {
    if values.is_empty() {
        return AnomalyResponse {
            success: false,
            anomalies: vec![],
            statistics: Statistics {
                mean: 0.0,
                std_dev: 0.0,
                upper_bound: 0.0,
                lower_bound: 0.0,
                anomaly_count: 0,
            },
        };
    }

    // Calculate global statistics
    let mean = values.iter().sum::<f64>() / values.len() as f64;
    let variance = values.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / values.len() as f64;
    let std_dev = variance.sqrt();

    let upper_bound = mean + sigma * std_dev;
    let lower_bound = mean - sigma * std_dev;

    // Calculate moving average and detect anomalies
    let mut anomalies = Vec::with_capacity(values.len());
    let mut anomaly_count = 0;

    for (i, &value) in values.iter().enumerate() {
        // Calculate moving average for current window
        let start = i.saturating_sub(window_size);
        let window = &values[start..=i];
        let moving_avg = window.iter().sum::<f64>() / window.len() as f64;

        // Calculate local standard deviation
        let local_variance =
            window.iter().map(|v| (v - moving_avg).powi(2)).sum::<f64>() / window.len() as f64;
        let local_std_dev = local_variance.sqrt();

        // Detect anomaly
        let deviation = (value - moving_avg).abs();
        let is_anomaly = deviation > sigma * local_std_dev.max(std_dev * 0.5);

        if is_anomaly {
            anomaly_count += 1;
        }

        anomalies.push(AnomalyPoint {
            index: i,
            value,
            moving_avg,
            deviation,
            is_anomaly,
        });
    }

    AnomalyResponse {
        success: true,
        anomalies,
        statistics: Statistics {
            mean,
            std_dev,
            upper_bound,
            lower_bound,
            anomaly_count,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_anomalies() {
        // Normal values with one spike
        let values = vec![
            50.0, 52.0, 48.0, 51.0, 49.0, 50.0, 95.0, // Spike at index 6
            50.0, 51.0, 49.0,
        ];

        let result = detect(&values, 5, 2.0);

        assert!(result.success);
        assert!(result.anomalies[6].is_anomaly);
        assert_eq!(result.statistics.anomaly_count, 1);
    }

    #[test]
    fn test_empty_input() {
        let result = detect(&[], 5, 2.0);
        assert!(!result.success);
    }
}
