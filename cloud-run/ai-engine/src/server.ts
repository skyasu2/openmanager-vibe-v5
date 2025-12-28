/**
 * Cloud Run AI Engine Server
 * Uses Hono for efficient HTTP handling
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { logAPIKeyStatus, validateAPIKeys } from './lib/model-config';
import { approvalStore } from './services/approval/approval-store';
import { embeddingService } from './services/embedding/embedding-service';
import { generateService } from './services/generate/generate-service';

// 🆕 AI SDK Supervisor (replaces LangGraph)
import { executeSupervisor, checkSupervisorHealth, logProviderStatus } from './services/ai-sdk';

// 🎯 Precomputed State (O(1) 조회, 토큰 최적화)
import { getCurrentState } from './data/precomputed-state';

// 🆕 AI SDK Tools (Direct endpoint imports - replaces LangChain agents)
import {
  detectAnomalies,
  predictTrends,
  analyzePattern,
  searchKnowledgeBase,
  recommendCommands,
  extractKeywordsFromQuery,
} from './tools-ai-sdk';
import {
  extractRelationships,
  getGraphRAGStats,
  getRelatedKnowledge,
} from './lib/graph-rag-service';

// Jobs Router (Async Job Processing)
import { jobsRouter } from './routes/jobs';

// Initialize App
const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health Check
import { getConfigStatus } from './lib/config-parser';
import { isRedisAvailable } from './lib/redis-client';

app.get('/health', (c: Context) =>
  c.json({
    status: 'ok',
    service: 'ai-engine-v5',
    config: getConfigStatus(),
    redis: isRedisAvailable(),
  })
);

// Security Middleware (Skip for health/warmup)
app.use('/api/*', async (c: Context, next: Next) => {
  const apiKey = c.req.header('X-API-Key');
  const validKey = process.env.CLOUD_RUN_API_SECRET;

  // Only enforce if secret is set in env
  if (validKey && apiKey !== validKey) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

// Jobs Router (Async Job Processing - bypasses timeout issues)
app.route('/api/jobs', jobsRouter);

// Warm-up Endpoint (Lightweight)
app.get('/warmup', async (c: Context) => {
  // 🎯 Precomputed State 로드 (O(1) - 이미 빌드됨)
  const state = getCurrentState();
  // Validate keys
  const status = validateAPIKeys();
  return c.json({
    status: 'warmed_up',
    keys: status,
    precomputed: {
      totalSlots: 144, // 24h * 6 (10-min intervals)
      currentSlot: state.slotIndex,
      currentTime: state.timeLabel,
      serverCount: state.servers.length,
      summary: state.summary,
    },
  });
});

// Main AI Supervisor Endpoint (🆕 AI SDK v1.0 - LangGraph removed)
app.post('/api/ai/supervisor', async (c: Context) => {
  try {
    const { messages, sessionId } = await c.req.json();

    // Extract last user message
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage?.content;

    if (!query) {
      return c.json({ error: 'No query provided' }, 400);
    }

    console.log(`🤖 [Supervisor] Using AI SDK (session: ${sessionId})`);
    logProviderStatus();

    const result = await executeSupervisor({
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      sessionId: sessionId || 'default',
    });

    if (!result.success) {
      // Return error response (no LangGraph fallback)
      return c.json({
        success: false,
        error: 'error' in result ? result.error : 'Unknown error',
        code: 'code' in result ? result.code : 'UNKNOWN',
      }, 500);
    }

    // Return JSON response (non-streaming for AI SDK)
    return c.json({
      success: true,
      response: result.response,
      toolsCalled: result.toolsCalled,
      usage: result.usage,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('API Error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Health Check for AI SDK Supervisor
app.get('/api/ai/supervisor/health', async (c: Context) => {
  const health = await checkSupervisorHealth();
  return c.json({
    success: true,
    ...health,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Embedding Endpoints (Hybrid Architecture - API Key on Cloud Run only)
// ============================================================================

// POST /api/ai/embedding - Single text embedding
app.post('/api/ai/embedding', async (c: Context) => {
  try {
    const { text, options } = await c.req.json();

    if (!text) {
      return c.json({ success: false, error: 'text is required' }, 400);
    }

    const result = await embeddingService.createEmbedding(text, options || {});
    return c.json(result);
  } catch (error) {
    console.error('❌ [Embedding] Error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST /api/ai/embedding/batch - Batch text embeddings
app.post('/api/ai/embedding/batch', async (c: Context) => {
  try {
    const { texts, options } = await c.req.json();

    if (!texts || !Array.isArray(texts)) {
      return c.json(
        { success: false, error: 'texts array is required' },
        400
      );
    }

    const result = await embeddingService.createBatchEmbeddings(
      texts,
      options || {}
    );
    return c.json(result);
  } catch (error) {
    console.error('❌ [Embedding Batch] Error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET /api/ai/embedding/stats - Embedding service statistics
app.get('/api/ai/embedding/stats', (c: Context) => {
  const stats = embeddingService.getStats();
  return c.json({ success: true, ...stats });
});

// ============================================================================
// Generate Endpoints (Hybrid Architecture - API Key on Cloud Run only)
// ============================================================================

// POST /api/ai/generate - Text generation (non-streaming)
app.post('/api/ai/generate', async (c: Context) => {
  try {
    const { prompt, options } = await c.req.json();

    if (!prompt) {
      return c.json({ success: false, error: 'prompt is required' }, 400);
    }

    const result = await generateService.generate(prompt, options || {});
    return c.json(result);
  } catch (error) {
    console.error('❌ [Generate] Error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST /api/ai/generate/stream - Text generation (streaming SSE)
app.post('/api/ai/generate/stream', async (c: Context) => {
  try {
    const { prompt, options } = await c.req.json();

    if (!prompt) {
      return c.json({ success: false, error: 'prompt is required' }, 400);
    }

    const stream = await generateService.generateStream(prompt, options || {});

    if (!stream) {
      return c.json({ success: false, error: 'Failed to create stream' }, 500);
    }

    // Set headers for SSE streaming
    c.header('Content-Type', 'text/event-stream; charset=utf-8');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');

    return c.body(stream);
  } catch (error) {
    console.error('❌ [Generate Stream] Error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET /api/ai/generate/stats - Generate service statistics
app.get('/api/ai/generate/stats', (c: Context) => {
  const stats = generateService.getStats();
  return c.json({ success: true, ...stats });
});

// ============================================================================
// Human-in-the-Loop Approval Endpoints
// ============================================================================

// GET /api/ai/approval/status - Check pending approval status
app.get('/api/ai/approval/status', async (c: Context) => {
  const sessionId = c.req.query('sessionId');

  if (!sessionId) {
    return c.json({ success: false, error: 'sessionId is required' }, 400);
  }

  const pending = await approvalStore.getPending(sessionId);

  if (!pending) {
    return c.json({
      success: true,
      hasPending: false,
      action: null,
      sessionId,
    });
  }

  return c.json({
    success: true,
    hasPending: true,
    action: {
      type: pending.actionType,
      description: pending.description,
      details: pending.payload,
      requestedAt: pending.requestedAt.toISOString(),
      requestedBy: pending.requestedBy,
      expiresAt: pending.expiresAt.toISOString(),
    },
    sessionId,
  });
});

// POST /api/ai/approval/decide - Submit approval decision
app.post('/api/ai/approval/decide', async (c: Context) => {
  try {
    const { sessionId, approved, reason, approvedBy } = await c.req.json();

    if (!sessionId || typeof approved !== 'boolean') {
      return c.json(
        { success: false, error: 'sessionId and approved are required' },
        400
      );
    }

    const success = await approvalStore.submitDecision(sessionId, approved, {
      reason,
      decidedBy: approvedBy,
    });

    if (!success) {
      return c.json(
        {
          success: false,
          error: 'No pending approval found for this session',
        },
        404
      );
    }

    return c.json({
      success: true,
      sessionId,
      decision: approved ? 'approved' : 'rejected',
      decidedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Approval] Decision error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET /api/ai/approval/stats - Monitor approval store status
app.get('/api/ai/approval/stats', (c: Context) => {
  const stats = approvalStore.getStats();
  return c.json({
    success: true,
    ...stats,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/ai/approval/history - Get approval history from PostgreSQL
app.get('/api/ai/approval/history', async (c: Context) => {
  try {
    const status = c.req.query('status') as 'pending' | 'approved' | 'rejected' | 'expired' | undefined;
    const actionType = c.req.query('actionType') as 'incident_report' | 'system_command' | 'critical_alert' | undefined;
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);

    const history = await approvalStore.getHistory({
      status,
      actionType,
      limit,
      offset,
    });

    if (history === null) {
      return c.json({
        success: false,
        error: 'PostgreSQL not available for history query',
      }, 503);
    }

    return c.json({
      success: true,
      count: history.length,
      history,
      pagination: { limit, offset },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Approval] History endpoint error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET /api/ai/approval/history/stats - Get approval statistics
app.get('/api/ai/approval/history/stats', async (c: Context) => {
  try {
    const days = parseInt(c.req.query('days') || '7', 10);
    const stats = await approvalStore.getHistoryStats(days);

    if (stats === null) {
      return c.json({
        success: false,
        error: 'PostgreSQL not available for stats query',
      }, 503);
    }

    return c.json({
      success: true,
      days,
      ...stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Approval] History stats endpoint error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ============================================================================
// Direct Agent Tool Endpoints (v5.84.0 - LangGraph Reuse for Function Pages)
// ============================================================================

/**
 * POST /api/ai/analyze-server - Server Analysis Endpoint
 *
 * 🆕 AI SDK 직접 도구 호출 (Supervisor 경유 없이)
 * - detectAnomalies: 이상 탐지 (6-hour moving average + 2σ, 10분 간격)
 * - predictTrends: 트렌드 예측 (Linear regression)
 * - analyzePattern: 패턴 분석
 *
 * Use Case: /api/ai/intelligent-monitoring (Vercel) → Cloud Run 프록시
 */
app.post('/api/ai/analyze-server', async (c: Context) => {
  try {
    const { serverId, analysisType = 'full', options = {} } = await c.req.json();

    console.log(`🔬 [Analyze Server] serverId=${serverId}, type=${analysisType}`);

    const results: Record<string, unknown> = {
      success: true,
      serverId,
      analysisType,
      timestamp: new Date().toISOString(),
    };

    // 분석 타입에 따라 AI SDK 도구 호출 (execute는 2개 인자 필요)
    if (analysisType === 'anomaly' || analysisType === 'full') {
      const anomalyResult = await detectAnomalies.execute!({
        serverId: serverId || undefined,
        metricType: options.metricType || 'all',
      }, { toolCallId: 'analyze-server-anomaly', messages: [] });
      results.anomalyDetection = anomalyResult;
    }

    if (analysisType === 'trend' || analysisType === 'full') {
      const trendResult = await predictTrends.execute!({
        serverId: serverId || undefined,
        metricType: options.metricType || 'all',
        predictionHours: options.predictionHours || 1,
      }, { toolCallId: 'analyze-server-trend', messages: [] });
      results.trendPrediction = trendResult;
    }

    if (analysisType === 'pattern' || analysisType === 'full') {
      const patternResult = await analyzePattern.execute!({
        query: options.query || '서버 상태 전체 분석',
      }, { toolCallId: 'analyze-server-pattern', messages: [] });
      results.patternAnalysis = patternResult;
    }

    console.log(`✅ [Analyze Server] Completed for ${serverId || 'all servers'}`);
    return c.json(results);
  } catch (error) {
    console.error('❌ [Analyze Server] Error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

/**
 * POST /api/ai/incident-report - Incident Report Generation Endpoint
 *
 * 🆕 AI SDK 직접 도구 호출 (Supervisor 경유 없이)
 * - searchKnowledgeBase: RAG with pgvector + GraphRAG
 * - recommendCommands: CLI 명령어 추천
 *
 * Use Case: /api/ai/incident-report (Vercel) → Cloud Run 프록시
 */
app.post('/api/ai/incident-report', async (c: Context) => {
  try {
    const { serverId, query, severity, category } = await c.req.json();

    console.log(`📋 [Incident Report] serverId=${serverId}, query=${query}`);

    // 1. RAG 검색 (AI SDK)
    const ragResult = await searchKnowledgeBase.execute!({
      query: query || '서버 장애 분석',
      category: category || undefined,
      severity: severity || undefined,
      useGraphRAG: true,
    }, { toolCallId: 'incident-report-rag', messages: [] });

    // 2. 키워드 추출 및 명령어 추천 (AI SDK)
    const keywords = extractKeywordsFromQuery(query || '');
    const commandResult = await recommendCommands.execute!({ keywords }, { toolCallId: 'incident-report-commands', messages: [] });

    // 3. 이상 탐지 (컨텍스트용, AI SDK)
    const anomalyResult = await detectAnomalies.execute!({
      serverId: serverId || undefined,
      metricType: 'all',
    }, { toolCallId: 'incident-report-anomaly', messages: [] });

    const result = {
      success: true,
      serverId,
      timestamp: new Date().toISOString(),
      knowledgeBase: ragResult,
      recommendedCommands: commandResult,
      currentStatus: anomalyResult,
      _source: 'Cloud Run AI SDK Direct',
    };

    console.log(`✅ [Incident Report] Generated for ${serverId || 'general'}`);
    return c.json(result);
  } catch (error) {
    console.error('❌ [Incident Report] Error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

/**
 * POST /api/ai/analyze-batch - Batch Server Analysis
 *
 * 🎯 Precomputed State 사용 - O(1) 조회
 * 🆕 AI SDK 도구 사용
 * 여러 서버 동시 분석 (대시보드 전체 새로고침 시)
 */
app.post('/api/ai/analyze-batch', async (c: Context) => {
  try {
    const { serverIds = [], analysisType = 'anomaly' } = await c.req.json();

    console.log(`🔬 [Batch Analysis] servers=${serverIds.length}, type=${analysisType}`);

    // 🎯 Precomputed State에서 현재 서버 상태 조회 (O(1))
    const state = getCurrentState();
    const targetServers = serverIds.length > 0
      ? state.servers.filter((s) => serverIds.includes(s.id))
      : state.servers;

    const results = await Promise.all(
      targetServers.map(async (server) => {
        const anomalyResult = await detectAnomalies.execute!({
          serverId: server.id,
          metricType: 'all',
        }, { toolCallId: `batch-${server.id}`, messages: [] });

        return {
          serverId: server.id,
          serverName: server.name,
          ...anomalyResult,
        };
      })
    );

    return c.json({
      success: true,
      totalServers: results.length,
      analysisType,
      results,
      timestamp: new Date().toISOString(),
      _dataSource: 'precomputed-state',
    });
  } catch (error) {
    console.error('❌ [Batch Analysis] Error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Note: extractKeywordsFromQuery is now imported from './tools-ai-sdk'

// ============================================================================
// GraphRAG Endpoints (Knowledge Graph Relationship Automation)
// ============================================================================

/**
 * POST /api/ai/graphrag/extract - Extract relationships from knowledge base
 *
 * Automatically identifies and stores relationships between knowledge entries.
 * Uses heuristics-only detection (LLM removed 2025-12-28).
 *
 * @param batchSize - Number of entries to process (default: 50)
 */
app.post('/api/ai/graphrag/extract', async (c: Context) => {
  try {
    const { batchSize = 50 } = await c.req.json();

    console.log(`🔗 [GraphRAG] Starting extraction (heuristics-only, batch: ${batchSize})`);

    const results = await extractRelationships({
      batchSize,
      onlyUnprocessed: true,
    });

    const totalRelationships = results.reduce((sum, r) => sum + r.relationships.length, 0);

    console.log(`✅ [GraphRAG] Extracted ${totalRelationships} relationships from ${results.length} entries`);

    return c.json({
      success: true,
      entriesProcessed: results.length,
      relationshipsCreated: totalRelationships,
      timestamp: new Date().toISOString(),
      details: results.slice(0, 10), // Return first 10 for brevity
    });
  } catch (error) {
    console.error('❌ [GraphRAG] Extraction error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

/**
 * GET /api/ai/graphrag/stats - Get GraphRAG statistics
 */
app.get('/api/ai/graphrag/stats', async (c: Context) => {
  try {
    const stats = await getGraphRAGStats();

    if (!stats) {
      return c.json({
        success: false,
        error: 'Could not retrieve GraphRAG stats',
      }, 500);
    }

    return c.json({
      success: true,
      ...stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [GraphRAG] Stats error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

/**
 * GET /api/ai/graphrag/related/:nodeId - Get related knowledge via graph traversal
 *
 * @param nodeId - UUID of the source knowledge entry
 * @param maxHops - Maximum graph traversal depth (default: 2)
 * @param maxResults - Maximum results to return (default: 10)
 */
app.get('/api/ai/graphrag/related/:nodeId', async (c: Context) => {
  try {
    const nodeId = c.req.param('nodeId');
    const maxHops = parseInt(c.req.query('maxHops') || '2', 10);
    const maxResults = parseInt(c.req.query('maxResults') || '10', 10);

    if (!nodeId) {
      return c.json({ success: false, error: 'nodeId is required' }, 400);
    }

    console.log(`🔗 [GraphRAG] Finding related for ${nodeId} (hops: ${maxHops})`);

    const related = await getRelatedKnowledge(nodeId, {
      maxHops,
      maxResults,
    });

    return c.json({
      success: true,
      nodeId,
      relatedCount: related.length,
      related,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [GraphRAG] Related search error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Start Server
const port = parseInt(process.env.PORT || '8080', 10);
console.log(`🚀 AI Engine Server starting on port ${port}...`);
logAPIKeyStatus();

serve(
  {
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0', // Required for Cloud Run
  },
  (info: { address: string; port: number }) => {
    console.log(`✅ Server listening on http://${info.address}:${info.port}`);
  }
);
