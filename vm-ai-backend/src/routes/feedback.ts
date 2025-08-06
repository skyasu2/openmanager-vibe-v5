/**
 * 📝 Feedback Router
 * 
 * 사용자 피드백 수집 및 학습 API
 */

import { Router } from 'express';
import { feedbackLearner } from '../index';

const router = Router();

/**
 * POST /api/ai/feedback
 * 피드백 수집
 */
router.post('/', async (req, res) => {
  try {
    const { queryId, query, response, rating, comment, sessionId, metadata } = req.body;
    
    // 필수 필드 검증
    if (!queryId || !query || !response || typeof rating !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'queryId, query, response, and rating are required'
      });
    }
    
    // 평점 범위 검증
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }
    
    const feedback = await feedbackLearner.collectFeedback(
      queryId,
      query,
      response,
      rating,
      comment,
      { ...metadata, sessionId }
    );
    
    res.status(201).json({
      success: true,
      feedback: {
        id: feedback.id,
        rating: feedback.rating,
        sentiment: feedback.sentiment,
        categories: feedback.categories,
        improvements: feedback.improvements
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to collect feedback'
    });
  }
});

/**
 * GET /api/ai/feedback/:feedbackId
 * 특정 피드백 조회
 */
router.get('/:feedbackId', (req, res) => {
  try {
    const feedback = feedbackLearner.getFeedback(req.params.feedbackId);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get feedback'
    });
  }
});

/**
 * GET /api/ai/feedback/session/:sessionId
 * 세션별 피드백 조회
 */
router.get('/session/:sessionId', (req, res) => {
  try {
    const feedbacks = feedbackLearner.getSessionFeedbacks(req.params.sessionId);
    
    res.json({
      success: true,
      feedbacks,
      total: feedbacks.length,
      averageRating: feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
        : 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get session feedbacks'
    });
  }
});

/**
 * GET /api/ai/feedback/metrics
 * 전체 피드백 메트릭
 */
router.get('/metrics/overview', (req, res) => {
  try {
    const metrics = feedbackLearner.getMetrics();
    
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get metrics'
    });
  }
});

/**
 * POST /api/ai/feedback/recommendations
 * 쿼리에 대한 권장사항 생성
 */
router.post('/recommendations', (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }
    
    const recommendations = feedbackLearner.getRecommendations(query);
    
    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recommendations'
    });
  }
});

/**
 * POST /api/ai/feedback/batch
 * 배치 피드백 수집
 */
router.post('/batch', async (req, res) => {
  try {
    const { feedbacks } = req.body;
    
    if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Feedbacks array is required'
      });
    }
    
    const results = await Promise.all(
      feedbacks.map(async (f) => {
        try {
          return await feedbackLearner.collectFeedback(
            f.queryId,
            f.query,
            f.response,
            f.rating,
            f.comment,
            f.metadata
          );
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : 'Failed to collect feedback',
            queryId: f.queryId
          };
        }
      })
    );
    
    const successful = results.filter(r => !('error' in r));
    const failed = results.filter(r => 'error' in r);
    
    res.status(201).json({
      success: true,
      collected: successful.length,
      failed: failed.length,
      results: results.map(r => {
        if ('error' in r) {
          return r;
        }
        return {
          id: r.id,
          rating: r.rating,
          sentiment: r.sentiment
        };
      })
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to collect batch feedback'
    });
  }
});

/**
 * GET /api/ai/feedback/export
 * 피드백 데이터 내보내기
 */
router.get('/export/csv', (req, res) => {
  try {
    const metrics = feedbackLearner.getMetrics();
    
    // CSV 형식으로 변환 (간단한 예시)
    const csv = [
      'Metric,Value',
      `Total Feedbacks,${metrics.totalFeedbacks}`,
      `Average Rating,${metrics.averageRating.toFixed(2)}`,
      `Satisfaction Rate,${(metrics.satisfactionRate * 100).toFixed(1)}%`,
      `Response Time P50,${metrics.responseTimeP50}ms`,
      `Response Time P95,${metrics.responseTimeP95}ms`,
      '',
      'Top Issues',
      ...metrics.topIssues.map(i => `"${i.issue}",${i.count}`),
      '',
      'Top Successes',
      ...metrics.topSuccesses.map(s => `"${s.pattern}",${s.avgRating.toFixed(2)}`)
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="feedback-metrics.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export data'
    });
  }
});

export const feedbackRouter = router;