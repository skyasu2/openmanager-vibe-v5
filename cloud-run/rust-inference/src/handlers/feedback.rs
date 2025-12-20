//! Feedback Analysis API Handlers
//!
//! Endpoints for analyzing AI chat feedback data

use axum::Json;
use serde::{Deserialize, Serialize};

use crate::ml::feedback::{self, FeedbackAnalysis, FeedbackData, FeedbackSummary};

// ============================================================================
// Request/Response Types
// ============================================================================

/// Single feedback analysis request
#[derive(Deserialize)]
pub struct SingleFeedbackRequest {
    pub message_id: String,
    pub feedback_type: String, // "positive" or "negative"
    pub message_content: String,
    #[serde(default)]
    pub session_id: String,
    #[serde(default)]
    pub timestamp: String,
}

/// Batch feedback analysis request
#[derive(Deserialize)]
pub struct BatchFeedbackRequest {
    pub feedbacks: Vec<SingleFeedbackRequest>,
}

/// Single feedback analysis response
#[derive(Serialize)]
pub struct SingleFeedbackResponse {
    pub success: bool,
    pub analysis: FeedbackAnalysis,
}

/// Batch feedback analysis response
#[derive(Serialize)]
pub struct BatchFeedbackResponse {
    pub success: bool,
    pub analyses: Vec<FeedbackAnalysis>,
    pub summary: FeedbackSummary,
}

/// Error response
#[derive(Serialize)]
pub struct ErrorResponse {
    pub success: bool,
    pub error: String,
}

// ============================================================================
// Handlers
// ============================================================================

/// POST /api/feedback/analyze - Analyze a single feedback
pub async fn analyze_single_feedback(
    Json(req): Json<SingleFeedbackRequest>,
) -> Json<SingleFeedbackResponse> {
    let feedback_data = FeedbackData {
        message_id: req.message_id,
        feedback_type: req.feedback_type,
        message_content: req.message_content,
        session_id: req.session_id,
        timestamp: req.timestamp,
    };

    let analysis = feedback::analyze_single(&feedback_data);

    Json(SingleFeedbackResponse {
        success: true,
        analysis,
    })
}

/// POST /api/feedback/analyze-batch - Analyze multiple feedbacks and get summary
pub async fn analyze_batch_feedback(
    Json(req): Json<BatchFeedbackRequest>,
) -> Json<BatchFeedbackResponse> {
    let feedbacks: Vec<FeedbackData> = req
        .feedbacks
        .into_iter()
        .map(|f| FeedbackData {
            message_id: f.message_id,
            feedback_type: f.feedback_type,
            message_content: f.message_content,
            session_id: f.session_id,
            timestamp: f.timestamp,
        })
        .collect();

    let (analyses, summary) = feedback::analyze_batch(&feedbacks);

    Json(BatchFeedbackResponse {
        success: true,
        analyses,
        summary,
    })
}

/// GET /api/feedback/health - Check feedback analysis service health
pub async fn feedback_health() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "feedback-analysis",
        "version": "1.0.0",
        "capabilities": [
            "sentiment_analysis",
            "pattern_detection",
            "categorization",
            "batch_analysis",
            "recommendations"
        ]
    }))
}
