//! Feedback Analysis Module
//!
//! Analyzes AI chat feedback to identify patterns:
//! - Sentiment classification (positive/negative keywords)
//! - Feedback clustering (group similar feedback)
//! - Pattern extraction (common issues)

use std::collections::HashMap;

/// Feedback data from the frontend
#[derive(Clone)]
pub struct FeedbackData {
    pub message_id: String,
    pub feedback_type: String, // "positive" or "negative"
    pub message_content: String,
    pub session_id: String,
    pub timestamp: String,
}

/// Analysis result for a single feedback
#[derive(serde::Serialize, Clone)]
pub struct FeedbackAnalysis {
    pub message_id: String,
    pub sentiment_score: f64,       // -1.0 (negative) to 1.0 (positive)
    pub detected_patterns: Vec<String>,
    pub keywords: Vec<String>,
    pub category: String,           // "technical", "quality", "relevance", "other"
}

/// Aggregated analysis for multiple feedbacks
#[derive(serde::Serialize)]
pub struct FeedbackSummary {
    pub total_count: usize,
    pub positive_count: usize,
    pub negative_count: usize,
    pub satisfaction_rate: f64,     // 0.0 ~ 1.0
    pub top_patterns: Vec<PatternInfo>,
    pub category_distribution: HashMap<String, usize>,
    pub recommendations: Vec<String>,
}

#[derive(serde::Serialize, Clone)]
pub struct PatternInfo {
    pub pattern: String,
    pub count: usize,
    pub percentage: f64,
}

// ============================================================================
// Keyword-based Sentiment Analysis
// ============================================================================

/// Positive sentiment keywords (Korean + English)
const POSITIVE_KEYWORDS: &[&str] = &[
    // Korean
    "좋아요", "도움", "완벽", "정확", "빠른", "훌륭", "감사", "유용", "명확", "이해",
    // English
    "good", "helpful", "perfect", "accurate", "fast", "great", "thanks", "useful", "clear", "understand",
];

/// Negative sentiment keywords (Korean + English)
const NEGATIVE_KEYWORDS: &[&str] = &[
    // Korean
    "틀린", "오류", "느린", "불명확", "잘못", "부정확", "실패", "문제", "버그", "에러",
    // English
    "wrong", "error", "slow", "unclear", "incorrect", "fail", "problem", "bug", "issue", "bad",
];

/// Pattern detection keywords (for categorization)
const PATTERN_KEYWORDS: &[(&str, &str)] = &[
    // (keyword, pattern_name)
    ("timeout", "timeout_issue"),
    ("타임아웃", "timeout_issue"),
    ("connection", "connection_issue"),
    ("연결", "connection_issue"),
    ("auth", "auth_issue"),
    ("인증", "auth_issue"),
    ("로그인", "auth_issue"),
    ("permission", "permission_issue"),
    ("권한", "permission_issue"),
    ("memory", "resource_issue"),
    ("메모리", "resource_issue"),
    ("cpu", "resource_issue"),
    ("disk", "resource_issue"),
    ("디스크", "resource_issue"),
    ("slow", "performance_issue"),
    ("느림", "performance_issue"),
    ("응답", "response_quality"),
    ("response", "response_quality"),
    ("format", "format_issue"),
    ("포맷", "format_issue"),
];

/// Analyze a single feedback
pub fn analyze_single(feedback: &FeedbackData) -> FeedbackAnalysis {
    let content_lower = feedback.message_content.to_lowercase();

    // 1. Calculate sentiment score
    let mut positive_hits = 0;
    let mut negative_hits = 0;
    let mut found_keywords = Vec::new();

    for &keyword in POSITIVE_KEYWORDS {
        if content_lower.contains(keyword) {
            positive_hits += 1;
            found_keywords.push(keyword.to_string());
        }
    }

    for &keyword in NEGATIVE_KEYWORDS {
        if content_lower.contains(keyword) {
            negative_hits += 1;
            found_keywords.push(keyword.to_string());
        }
    }

    // Base sentiment from feedback type
    let base_sentiment = if feedback.feedback_type == "positive" { 0.5 } else { -0.5 };

    // Adjust based on keywords
    let keyword_sentiment = if positive_hits + negative_hits > 0 {
        (positive_hits as f64 - negative_hits as f64) / (positive_hits + negative_hits) as f64
    } else {
        0.0
    };

    let sentiment_score = (base_sentiment + keyword_sentiment * 0.5).clamp(-1.0, 1.0);

    // 2. Detect patterns
    let mut detected_patterns = Vec::new();
    for &(keyword, pattern) in PATTERN_KEYWORDS {
        if content_lower.contains(keyword) && !detected_patterns.contains(&pattern.to_string()) {
            detected_patterns.push(pattern.to_string());
        }
    }

    // 3. Categorize
    let category = categorize_feedback(&content_lower, &detected_patterns);

    FeedbackAnalysis {
        message_id: feedback.message_id.clone(),
        sentiment_score,
        detected_patterns,
        keywords: found_keywords,
        category,
    }
}

/// Categorize feedback based on content and patterns
fn categorize_feedback(content: &str, patterns: &[String]) -> String {
    // Priority-based categorization
    if patterns.iter().any(|p| p.contains("auth") || p.contains("permission")) {
        return "security".to_string();
    }
    if patterns.iter().any(|p| p.contains("resource") || p.contains("performance")) {
        return "performance".to_string();
    }
    if patterns.iter().any(|p| p.contains("timeout") || p.contains("connection")) {
        return "technical".to_string();
    }
    if patterns.iter().any(|p| p.contains("response") || p.contains("format")) {
        return "quality".to_string();
    }

    // Fallback based on content keywords
    if content.contains("코드") || content.contains("code") || content.contains("syntax") {
        return "technical".to_string();
    }
    if content.contains("이해") || content.contains("명확") || content.contains("clear") {
        return "quality".to_string();
    }

    "other".to_string()
}

/// Analyze multiple feedbacks and generate summary
pub fn analyze_batch(feedbacks: &[FeedbackData]) -> (Vec<FeedbackAnalysis>, FeedbackSummary) {
    if feedbacks.is_empty() {
        return (
            vec![],
            FeedbackSummary {
                total_count: 0,
                positive_count: 0,
                negative_count: 0,
                satisfaction_rate: 0.0,
                top_patterns: vec![],
                category_distribution: HashMap::new(),
                recommendations: vec!["Not enough data for analysis".to_string()],
            },
        );
    }

    // Analyze each feedback
    let analyses: Vec<FeedbackAnalysis> = feedbacks.iter().map(analyze_single).collect();

    // Count positive/negative
    let positive_count = feedbacks.iter().filter(|f| f.feedback_type == "positive").count();
    let negative_count = feedbacks.len() - positive_count;

    // Calculate satisfaction rate
    let satisfaction_rate = positive_count as f64 / feedbacks.len() as f64;

    // Aggregate patterns
    let mut pattern_counts: HashMap<String, usize> = HashMap::new();
    for analysis in &analyses {
        for pattern in &analysis.detected_patterns {
            *pattern_counts.entry(pattern.clone()).or_insert(0) += 1;
        }
    }

    // Top patterns
    let mut top_patterns: Vec<PatternInfo> = pattern_counts
        .iter()
        .map(|(pattern, &count)| PatternInfo {
            pattern: pattern.clone(),
            count,
            percentage: count as f64 / feedbacks.len() as f64 * 100.0,
        })
        .collect();
    top_patterns.sort_by(|a, b| b.count.cmp(&a.count));
    top_patterns.truncate(5);

    // Category distribution
    let mut category_distribution: HashMap<String, usize> = HashMap::new();
    for analysis in &analyses {
        *category_distribution.entry(analysis.category.clone()).or_insert(0) += 1;
    }

    // Generate recommendations
    let recommendations = generate_recommendations(&top_patterns, satisfaction_rate, &category_distribution);

    let summary = FeedbackSummary {
        total_count: feedbacks.len(),
        positive_count,
        negative_count,
        satisfaction_rate,
        top_patterns,
        category_distribution,
        recommendations,
    };

    (analyses, summary)
}

/// Generate improvement recommendations based on analysis
fn generate_recommendations(
    patterns: &[PatternInfo],
    satisfaction_rate: f64,
    categories: &HashMap<String, usize>,
) -> Vec<String> {
    let mut recommendations = Vec::new();

    // Low satisfaction rate
    if satisfaction_rate < 0.5 {
        recommendations.push("Overall satisfaction is low. Consider reviewing AI response quality.".to_string());
    }

    // Pattern-based recommendations
    for pattern in patterns {
        if pattern.percentage > 20.0 {
            match pattern.pattern.as_str() {
                "timeout_issue" => {
                    recommendations.push("High timeout issues detected. Consider increasing timeout limits or optimizing response generation.".to_string());
                }
                "auth_issue" => {
                    recommendations.push("Authentication issues are frequent. Review auth flow and error messages.".to_string());
                }
                "performance_issue" => {
                    recommendations.push("Performance complaints detected. Monitor AI inference latency.".to_string());
                }
                "response_quality" => {
                    recommendations.push("Response quality concerns raised. Consider improving prompts or model selection.".to_string());
                }
                _ => {}
            }
        }
    }

    // Category-based recommendations
    if let Some(&tech_count) = categories.get("technical") {
        if tech_count as f64 / categories.values().sum::<usize>() as f64 > 0.3 {
            recommendations.push("Many technical issues reported. Review error handling and logging.".to_string());
        }
    }

    if recommendations.is_empty() {
        recommendations.push("No critical issues detected. Continue monitoring.".to_string());
    }

    recommendations
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_analyze_positive_feedback() {
        let feedback = FeedbackData {
            message_id: "test-1".to_string(),
            feedback_type: "positive".to_string(),
            message_content: "This response was very helpful and accurate!".to_string(),
            session_id: "session-1".to_string(),
            timestamp: "2025-01-01T00:00:00Z".to_string(),
        };

        let result = analyze_single(&feedback);
        assert!(result.sentiment_score > 0.0);
        assert!(result.keywords.contains(&"helpful".to_string()));
    }

    #[test]
    fn test_analyze_negative_feedback() {
        let feedback = FeedbackData {
            message_id: "test-2".to_string(),
            feedback_type: "negative".to_string(),
            message_content: "The response was wrong and had errors".to_string(),
            session_id: "session-1".to_string(),
            timestamp: "2025-01-01T00:00:00Z".to_string(),
        };

        let result = analyze_single(&feedback);
        assert!(result.sentiment_score < 0.0);
    }

    #[test]
    fn test_pattern_detection() {
        let feedback = FeedbackData {
            message_id: "test-3".to_string(),
            feedback_type: "negative".to_string(),
            message_content: "Connection timeout during authentication".to_string(),
            session_id: "session-1".to_string(),
            timestamp: "2025-01-01T00:00:00Z".to_string(),
        };

        let result = analyze_single(&feedback);
        assert!(result.detected_patterns.contains(&"timeout_issue".to_string()));
        assert!(result.detected_patterns.contains(&"auth_issue".to_string()));
    }
}
