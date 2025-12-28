/**
 * Analytics Routes
 *
 * Server analysis, incident reporting, and batch analysis endpoints.
 * Direct AI SDK tool calling without Supervisor.
 *
 * @version 1.0.0
 * @created 2025-12-28
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import {
  detectAnomalies,
  predictTrends,
  analyzePattern,
  searchKnowledgeBase,
  recommendCommands,
  extractKeywordsFromQuery,
} from '../tools-ai-sdk';
import { getCurrentState } from '../data/precomputed-state';
import { handleApiError, jsonSuccess } from '../lib/error-handler';

export const analyticsRouter = new Hono();

/**
 * POST /analyze-server - Server Analysis Endpoint
 *
 * Direct AI SDK tool calling (bypasses Supervisor)
 * - detectAnomalies: 이상 탐지 (6-hour moving average + 2σ)
 * - predictTrends: 트렌드 예측 (Linear regression)
 * - analyzePattern: 패턴 분석
 */
analyticsRouter.post('/analyze-server', async (c: Context) => {
  try {
    const { serverId, analysisType = 'full', options = {} } = await c.req.json();

    console.log(`🔬 [Analyze Server] serverId=${serverId}, type=${analysisType}`);

    const results: Record<string, unknown> = {
      serverId,
      analysisType,
    };

    // Execute tools based on analysis type
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
    return jsonSuccess(c, results);
  } catch (error) {
    return handleApiError(c, error, 'Analyze Server');
  }
});

/**
 * POST /incident-report - Incident Report Generation
 *
 * Direct AI SDK tool calling (bypasses Supervisor)
 * - searchKnowledgeBase: RAG with pgvector + GraphRAG
 * - recommendCommands: CLI 명령어 추천
 */
analyticsRouter.post('/incident-report', async (c: Context) => {
  try {
    const { serverId, query, severity, category } = await c.req.json();

    console.log(`📋 [Incident Report] serverId=${serverId}, query=${query}`);

    // 1. RAG search
    const ragResult = await searchKnowledgeBase.execute!({
      query: query || '서버 장애 분석',
      category: category || undefined,
      severity: severity || undefined,
      useGraphRAG: true,
    }, { toolCallId: 'incident-report-rag', messages: [] });

    // 2. Extract keywords and recommend commands
    const keywords = extractKeywordsFromQuery(query || '');
    const commandResult = await recommendCommands.execute!(
      { keywords },
      { toolCallId: 'incident-report-commands', messages: [] }
    );

    // 3. Anomaly detection for context
    const anomalyResult = await detectAnomalies.execute!({
      serverId: serverId || undefined,
      metricType: 'all',
    }, { toolCallId: 'incident-report-anomaly', messages: [] });

    console.log(`✅ [Incident Report] Generated for ${serverId || 'general'}`);
    return jsonSuccess(c, {
      serverId,
      knowledgeBase: ragResult,
      recommendedCommands: commandResult,
      currentStatus: anomalyResult,
      _source: 'Cloud Run AI SDK Direct',
    });
  } catch (error) {
    return handleApiError(c, error, 'Incident Report');
  }
});

/**
 * POST /analyze-batch - Batch Server Analysis
 *
 * Uses Precomputed State for O(1) lookup
 * Analyzes multiple servers in parallel
 */
analyticsRouter.post('/analyze-batch', async (c: Context) => {
  try {
    const { serverIds = [], analysisType = 'anomaly' } = await c.req.json();

    console.log(`🔬 [Batch Analysis] servers=${serverIds.length}, type=${analysisType}`);

    // Get servers from precomputed state (O(1))
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

    return jsonSuccess(c, {
      totalServers: results.length,
      analysisType,
      results,
      _dataSource: 'precomputed-state',
    });
  } catch (error) {
    return handleApiError(c, error, 'Batch Analysis');
  }
});
