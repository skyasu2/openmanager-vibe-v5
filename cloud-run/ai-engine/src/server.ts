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
import { createSupervisorStreamResponse } from './services/langgraph/multi-agent-supervisor';
import { loadHourlyScenarioData } from './services/scenario/scenario-loader';

// Direct Agent Tool Imports (for dedicated endpoints)
import {
  detectAnomaliesTool,
  predictTrendsTool,
  analyzePatternTool,
} from './agents/analyst-agent';
import {
  searchKnowledgeBaseTool,
  recommendCommandsTool,
} from './agents/reporter-agent';
import {
  extractRelationships,
  getGraphRAGStats,
  getRelatedKnowledge,
} from './lib/graph-rag-service';

// Initialize App
const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health Check
app.get('/health', (c: Context) => c.json({ status: 'ok', service: 'ai-engine-v5' }));

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

// Warm-up Endpoint (Lightweight)
app.get('/warmup', async (c: Context) => {
  // Trigger data loading to warm up cache
  await loadHourlyScenarioData();
  // Validate keys
  const status = validateAPIKeys();
  return c.json({
    status: 'warmed_up',
    keys: status,
  });
});

// Main AI Supervisor Endpoint
app.post('/api/ai/supervisor', async (c: Context) => {
  try {
    const { messages, sessionId } = await c.req.json();

    // Extract last user message
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage?.content;

    if (!query) {
      return c.json({ error: 'No query provided' }, 400);
    }

    // Check API Keys provided (either in env or headers, currently relying on env)
    const { all } = validateAPIKeys();
    if (!all) {
      // return c.json({ error: 'Missing API Keys' }, 500);
      // Ensure we don't block if one is missing but others might work?
      // validateAPIKeys returns 'all' if BOTH are present.
      // Supervisor uses Groq, NLQ uses Gemini. We need at least one.
      // But let's log and proceed, models usually throw specifically.
      logAPIKeyStatus();
    }

    // Get ReadableStream (Web Standard) from Supervisor
    const stream = await createSupervisorStreamResponse(query, sessionId);

    // Convert Web ReadableStream to Node Readable for Hono (if needed)
    // Hono running on Node might handle Web Streams, but let's be safe.
    // Actually @hono/node-server supports returning a standard Response object with a Stream.

    // Set headers for AI SDK Data Stream Protocol
    c.header('Content-Type', 'text/event-stream; charset=utf-8');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');
    c.header('X-Vercel-AI-Data-Stream', 'v1');

    return c.body(stream);
  } catch (error) {
    console.error('API Error:', error);
    return c.json({ error: String(error) }, 500);
  }
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
 * 직접 Analyst Agent 도구 호출 (Supervisor 경유 없이)
 * - detectAnomaliesTool: 이상 탐지 (6-hour moving average + 2σ, 10분 간격)
 * - predictTrendsTool: 트렌드 예측 (Linear regression)
 * - analyzePatternTool: 패턴 분석
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

    // 분석 타입에 따라 도구 호출
    if (analysisType === 'anomaly' || analysisType === 'full') {
      const anomalyResult = await detectAnomaliesTool.invoke({
        serverId: serverId || undefined,
        metricType: options.metricType || 'all',
      });
      results.anomalyDetection = anomalyResult;
    }

    if (analysisType === 'trend' || analysisType === 'full') {
      const trendResult = await predictTrendsTool.invoke({
        serverId: serverId || undefined,
        metricType: options.metricType || 'all',
        predictionHours: options.predictionHours || 1,
      });
      results.trendPrediction = trendResult;
    }

    if (analysisType === 'pattern' || analysisType === 'full') {
      const patternResult = await analyzePatternTool.invoke({
        query: options.query || '서버 상태 전체 분석',
      });
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
 * 직접 Reporter Agent 도구 호출 (Supervisor 경유 없이)
 * - searchKnowledgeBaseTool: RAG with pgvector
 * - recommendCommandsTool: CLI 명령어 추천
 *
 * Use Case: /api/ai/incident-report (Vercel) → Cloud Run 프록시
 */
app.post('/api/ai/incident-report', async (c: Context) => {
  try {
    const { serverId, query, severity, category } = await c.req.json();

    console.log(`📋 [Incident Report] serverId=${serverId}, query=${query}`);

    // 1. RAG 검색
    const ragResult = await searchKnowledgeBaseTool.invoke({
      query: query || '서버 장애 분석',
      category: category || undefined,
      severity: severity || undefined,
    });

    // 2. 키워드 추출 및 명령어 추천
    const keywords = extractKeywordsFromQuery(query || '');
    const commandResult = await recommendCommandsTool.invoke({ keywords });

    // 3. 이상 탐지 (컨텍스트용)
    const anomalyResult = await detectAnomaliesTool.invoke({
      serverId: serverId || undefined,
      metricType: 'all',
    });

    const result = {
      success: true,
      serverId,
      timestamp: new Date().toISOString(),
      knowledgeBase: ragResult,
      recommendedCommands: commandResult,
      currentStatus: anomalyResult,
      _source: 'Cloud Run LangGraph Direct',
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
 * 여러 서버 동시 분석 (대시보드 전체 새로고침 시)
 */
app.post('/api/ai/analyze-batch', async (c: Context) => {
  try {
    const { serverIds = [], analysisType = 'anomaly' } = await c.req.json();

    console.log(`🔬 [Batch Analysis] servers=${serverIds.length}, type=${analysisType}`);

    // 모든 서버 데이터 로드
    const allServers = await loadHourlyScenarioData();
    const targetServers = serverIds.length > 0
      ? allServers.filter((s) => serverIds.includes(s.id))
      : allServers;

    const results = await Promise.all(
      targetServers.map(async (server) => {
        const anomalyResult = await detectAnomaliesTool.invoke({
          serverId: server.id,
          metricType: 'all',
        });

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
    });
  } catch (error) {
    console.error('❌ [Batch Analysis] Error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Helper: 질문에서 키워드 추출
function extractKeywordsFromQuery(query: string): string[] {
  const keywords: string[] = [];
  const q = query.toLowerCase();

  const patterns = [
    { regex: /서버|server/gi, keyword: '서버' },
    { regex: /상태|status/gi, keyword: '상태' },
    { regex: /에러|error|오류/gi, keyword: '에러' },
    { regex: /로그|log/gi, keyword: '로그' },
    { regex: /메모리|memory/gi, keyword: '메모리' },
    { regex: /cpu|프로세서/gi, keyword: 'cpu' },
    { regex: /디스크|disk/gi, keyword: '디스크' },
    { regex: /재시작|restart/gi, keyword: '재시작' },
    { regex: /장애|failure|incident/gi, keyword: '장애' },
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(q)) {
      keywords.push(pattern.keyword);
    }
  }

  return keywords.length > 0 ? keywords : ['일반', '조회'];
}

// ============================================================================
// GraphRAG Endpoints (Knowledge Graph Relationship Automation)
// ============================================================================

/**
 * POST /api/ai/graphrag/extract - Extract relationships from knowledge base
 *
 * Automatically identifies and stores relationships between knowledge entries.
 * Uses heuristics first, optionally LLM for uncertain cases.
 *
 * @param useLLM - Use LLM for advanced relationship detection (default: false)
 * @param batchSize - Number of entries to process (default: 50)
 */
app.post('/api/ai/graphrag/extract', async (c: Context) => {
  try {
    const { useLLM = false, batchSize = 50 } = await c.req.json();

    console.log(`🔗 [GraphRAG] Starting extraction (LLM: ${useLLM}, batch: ${batchSize})`);

    const results = await extractRelationships({
      useLLM,
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
