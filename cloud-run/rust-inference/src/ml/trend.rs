//! Trend Prediction Algorithm
//!
//! Implements linear regression with R² confidence calculation
//! Ported from: src/lib/ai/monitoring/TrendPredictor.ts

use crate::handlers::inference::{RegressionStats, TrendInfo, TrendResponse};

/// Predict trend using linear regression
pub fn predict(values: &[f64], forecast_steps: usize) -> TrendResponse {
    if values.len() < 2 {
        return TrendResponse {
            success: false,
            trend: TrendInfo {
                direction: "unknown",
                slope: 0.0,
                confidence: 0.0,
            },
            predictions: vec![],
            regression: RegressionStats {
                slope: 0.0,
                intercept: 0.0,
                r_squared: 0.0,
            },
        };
    }

    let n = values.len() as f64;

    // Calculate means
    let x_mean = (n - 1.0) / 2.0; // Mean of 0, 1, 2, ..., n-1
    let y_mean = values.iter().sum::<f64>() / n;

    // Calculate slope and intercept using least squares
    let mut numerator = 0.0;
    let mut denominator = 0.0;

    for (i, &y) in values.iter().enumerate() {
        let x = i as f64;
        numerator += (x - x_mean) * (y - y_mean);
        denominator += (x - x_mean).powi(2);
    }

    let slope = if denominator > 0.0 {
        numerator / denominator
    } else {
        0.0
    };

    let intercept = y_mean - slope * x_mean;

    // Calculate R² (coefficient of determination)
    let mut ss_res = 0.0; // Residual sum of squares
    let mut ss_tot = 0.0; // Total sum of squares

    for (i, &y) in values.iter().enumerate() {
        let x = i as f64;
        let y_pred = slope * x + intercept;
        ss_res += (y - y_pred).powi(2);
        ss_tot += (y - y_mean).powi(2);
    }

    let r_squared = if ss_tot > 0.0 {
        1.0 - (ss_res / ss_tot)
    } else {
        0.0
    };

    // Determine trend direction
    let direction = if slope > 0.01 {
        "up"
    } else if slope < -0.01 {
        "down"
    } else {
        "stable"
    };

    // Generate predictions
    let predictions: Vec<f64> = (0..forecast_steps)
        .map(|i| {
            let x = (values.len() + i) as f64;
            slope * x + intercept
        })
        .collect();

    TrendResponse {
        success: true,
        trend: TrendInfo {
            direction,
            slope,
            confidence: r_squared.clamp(0.0, 1.0),
        },
        predictions,
        regression: RegressionStats {
            slope,
            intercept,
            r_squared: r_squared.clamp(0.0, 1.0),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_upward_trend() {
        let values = vec![10.0, 20.0, 30.0, 40.0, 50.0];
        let result = predict(&values, 3);

        assert!(result.success);
        assert_eq!(result.trend.direction, "up");
        assert!(result.trend.slope > 0.0);
        assert!(result.regression.r_squared > 0.99); // Perfect linear
    }

    #[test]
    fn test_downward_trend() {
        let values = vec![50.0, 40.0, 30.0, 20.0, 10.0];
        let result = predict(&values, 3);

        assert!(result.success);
        assert_eq!(result.trend.direction, "down");
        assert!(result.trend.slope < 0.0);
    }

    #[test]
    fn test_stable_trend() {
        let values = vec![50.0, 50.0, 50.0, 50.0, 50.0];
        let result = predict(&values, 3);

        assert!(result.success);
        assert_eq!(result.trend.direction, "stable");
    }

    #[test]
    fn test_insufficient_data() {
        let result = predict(&[10.0], 3);
        assert!(!result.success);
    }
}
