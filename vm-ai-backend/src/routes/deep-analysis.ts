/**
 * 🔍 Deep Analysis Router
 * 
 * 심층 AI 분석 작업 관리 API
 */

import { Router } from 'express';
import { deepAnalyzer } from '../index';

const router = Router();

/**
 * POST /api/ai/deep-analysis
 * 새 분석 작업 시작
 */
router.post('/', async (req, res) => {
  try {
    const { type, query, context } = req.body;
    
    // 타입 검증
    const validTypes = ['pattern', 'anomaly', 'optimization', 'prediction', 'correlation'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid analysis type. Must be one of: ${validTypes.join(', ')}`
      });
    }
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }
    
    const job = await deepAnalyzer.startAnalysis(type, query, context);
    
    res.status(202).json({
      success: true,
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        createdAt: job.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start analysis'
    });
  }
});

/**
 * GET /api/ai/deep-analysis/:jobId
 * 분석 작업 상태 조회
 */
router.get('/:jobId', (req, res) => {
  try {
    const job = deepAnalyzer.getJob(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    res.json({
      success: true,
      job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get job'
    });
  }
});

/**
 * GET /api/ai/deep-analysis/:jobId/progress
 * 분석 작업 진행률만 조회
 */
router.get('/:jobId/progress', (req, res) => {
  try {
    const job = deepAnalyzer.getJob(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    res.json({
      success: true,
      progress: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        currentStep: job.metadata.currentStep,
        steps: job.metadata.steps
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get progress'
    });
  }
});

/**
 * GET /api/ai/deep-analysis/:jobId/result
 * 분석 결과 조회
 */
router.get('/:jobId/result', (req, res) => {
  try {
    const job = deepAnalyzer.getJob(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    if (job.status !== 'completed') {
      return res.status(202).json({
        success: false,
        error: 'Analysis not completed yet',
        status: job.status,
        progress: job.progress
      });
    }
    
    res.json({
      success: true,
      result: job.result,
      metadata: {
        completedAt: job.completedAt,
        processingTime: job.completedAt && job.startedAt 
          ? job.completedAt.getTime() - job.startedAt.getTime()
          : null,
        confidence: job.metadata.confidence
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get result'
    });
  }
});

/**
 * POST /api/ai/deep-analysis/:jobId/update-progress
 * 분석 작업 진행률 수동 업데이트 (내부용)
 */
router.post('/:jobId/update-progress', (req, res) => {
  try {
    const { progress, currentStep } = req.body;
    
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        error: 'Progress must be a number between 0 and 100'
      });
    }
    
    deepAnalyzer.updateProgress(req.params.jobId, progress, currentStep);
    
    res.json({
      success: true,
      message: 'Progress updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update progress'
    });
  }
});

/**
 * GET /api/ai/deep-analysis/stats
 * 분석 통계
 */
router.get('/stats/overview', (req, res) => {
  try {
    const stats = deepAnalyzer.getStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats'
    });
  }
});

/**
 * POST /api/ai/deep-analysis/batch
 * 배치 분석 작업 시작
 */
router.post('/batch', async (req, res) => {
  try {
    const { analyses } = req.body;
    
    if (!Array.isArray(analyses) || analyses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Analyses array is required'
      });
    }
    
    const jobs = await Promise.all(
      analyses.map(async ({ type, query, context }) => {
        try {
          return await deepAnalyzer.startAnalysis(type, query, context);
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : 'Failed to start analysis',
            type,
            query
          };
        }
      })
    );
    
    res.status(202).json({
      success: true,
      jobs: jobs.map(job => {
        if ('error' in job) {
          return job;
        }
        return {
          id: job.id,
          type: job.type,
          status: job.status,
          createdAt: job.createdAt
        };
      })
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start batch analysis'
    });
  }
});

export const deepAnalysisRouter = router;