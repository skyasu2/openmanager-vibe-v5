/**
 * Analytics Routes
 *
 * Server analysis, incident reporting, and batch analysis endpoints.
 * Uses specialized AI agents for natural language responses.
 *
 * @version 3.0.0 - Migrated to AI SDK v6 native
 * @created 2025-12-28
 * @updated 2026-01-24 - Removed @ai-sdk-tools/agents dependency
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { randomUUID } from 'crypto';
import { generateText } from 'ai';
import {
  detectAnomalies,
  detectAnomaliesAllServers,
  predictTrends,
  analyzePattern,
  searchKnowledgeBase,
  recommendCommands,
  extractKeywordsFromQuery,
} from '../tools-ai-sdk';
import { getCurrentState } from '../data/precomputed-state';
import { handleApiError, jsonSuccess } from '../lib/error-handler';
import { sanitizeChineseCharacters, sanitizeJsonStrings } from '../lib/text-sanitizer';
import { getReporterAgentConfig, isReporterAgentAvailable } from '../services/ai-sdk/agents/reporter-agent';
import { getAnalystAgentConfig, isAnalystAgentAvailable } from '../services/ai-sdk/agents/analyst-agent';
// incident-rag-injector imports removed - endpoints deprecated

export const analyticsRouter = new Hono();

/**
 * POST /analyze-server - Server Analysis Endpoint
 *
 * Hybrid approach: Tools for structured data + Agent for natural language insights.
 * Returns CloudRunAnalysisResponse format for frontend compatibility.
 *
 * @version 2.1.0 - Hybrid Tool + Agent approach (Frontend compatible)
 */
analyticsRouter.post('/analyze-server', async (c: Context) => {
  try {
    const { serverId, analysisType = 'full', options = {} } = await c.req.json();

    console.log(`🔬 [Analyze Server] serverId=${serverId}, type=${analysisType}`);

    // Type for metricType
    type MetricType = 'cpu' | 'memory' | 'disk' | 'all';
    const metricType = ((options.metricType as string) || 'all') as MetricType;
    const startTime = Date.now();

    // 1. Run tools directly for structured data (Frontend expects this format)
    const results: {
      serverId?: string;
      analysisType: string;
      anomalyDetection?: unknown;
      trendPrediction?: unknown;
      patternAnalysis?: unknown;
      aiInsights?: { summary: string; recommendations: string[]; confidence: number };
      _source: string;
      _durationMs?: number;
    } = {
      serverId,
      analysisType,
      _source: 'Hybrid (Tool + Agent)',
    };

    // Execute tools based on analysis type
    if (analysisType === 'anomaly' || analysisType === 'full') {
      results.anomalyDetection = await detectAnomalies.execute!({
        serverId: serverId || undefined,
        metricType,
      }, { toolCallId: 'analyze-server-anomaly', messages: [] });
    }

    if (analysisType === 'trend' || analysisType === 'full') {
      results.trendPrediction = await predictTrends.execute!({
        serverId: serverId || undefined,
        metricType,
        predictionHours: (options.predictionHours as number) || 1,
      }, { toolCallId: 'analyze-server-trend', messages: [] });
    }

    if (analysisType === 'pattern' || analysisType === 'full') {
      results.patternAnalysis = await analyzePattern.execute!({
        query: (options.query as string) || '서버 상태 전체 분석',
      }, { toolCallId: 'analyze-server-pattern', messages: [] });
    }

    // 2. Use Agent for natural language insights (if available)
    const analystConfig = getAnalystAgentConfig();
    const analystModelResult = analystConfig?.getModel();
    if (analystConfig && analystModelResult && isAnalystAgentAvailable()) {
      try {
        const anomalyData = results.anomalyDetection as { hasAnomalies?: boolean; anomalyCount?: number } | undefined;
        const trendData = results.trendPrediction as { summary?: { hasRisingTrends?: boolean } } | undefined;

        const prompt = `분석 결과를 해석하고 권장 조치를 제안해주세요.

## 분석 데이터
- 이상 탐지: ${anomalyData?.hasAnomalies ? `${anomalyData.anomalyCount}개 이상 감지` : '정상'}
- 트렌드: ${trendData?.summary?.hasRisingTrends ? '상승 추세 있음' : '안정적'}

## 요청 사항
1. 현재 상태에 대한 간략한 요약 (2-3문장)
2. 권장 조치사항 (최대 3개)

JSON 형식으로 응답하세요:
{"summary": "...", "recommendations": ["...", "..."], "confidence": 0.9}`;

        const agentResult = await generateText({
          model: analystModelResult.model,
          messages: [
            { role: 'system', content: analystConfig.instructions },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
          maxOutputTokens: 512,
        });

        // Sanitize Chinese characters from LLM output
        const sanitizedText = sanitizeChineseCharacters(agentResult.text);

        // Try to parse JSON from agent response
        const jsonMatch = sanitizedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const insights = JSON.parse(jsonMatch[0]);
            results.aiInsights = {
              summary: insights.summary || '',
              recommendations: insights.recommendations || [],
              confidence: insights.confidence || 0.8,
            };
          } catch {
            // If JSON parse fails, use sanitized text as summary
            results.aiInsights = {
              summary: sanitizedText.slice(0, 200),
              recommendations: [],
              confidence: 0.7,
            };
          }
        }
      } catch (agentError) {
        console.warn('⚠️ [Analyze Server] Agent insight generation failed:', agentError);
        // Continue without agent insights
      }
    }

    const durationMs = Date.now() - startTime;
    results._durationMs = durationMs;

    console.log(`✅ [Analyze Server] Completed in ${durationMs}ms`);
    return jsonSuccess(c, results);
  } catch (error) {
    return handleApiError(c, error, 'Analyze Server');
  }
});

// Note: parseAnalystResponse and analyzeServerFallback removed in v2.1.0
// Main endpoint now uses hybrid approach (Tools + Agent)

/**
 * POST /incident-report - Incident Report Generation
 *
 * Uses Reporter Agent for natural language report generation.
 * Agent calls tools internally and synthesizes results.
 *
 * @version 2.1.0 - Structured JSON output + Enhanced parsing (ITIL-aligned)
 */
analyticsRouter.post('/incident-report', async (c: Context) => {
  try {
    const { serverId, query, severity, category, metrics, action } = await c.req.json();

    console.log(`📋 [Incident Report] action=${action}, serverId=${serverId}`);

    const startTime = Date.now();

    // 1. Collect real-time data from tools first (parallel execution)
    // Use detectAnomaliesAllServers to get full system summary for incident reports
    const [anomalyData, trendData, timelineData] = await Promise.all([
      detectAnomaliesAllServers.execute!(
        { metricType: 'all' },
        { toolCallId: 'ir-anomaly-all', messages: [] }
      ),
      predictTrends.execute!(
        { serverId: serverId || undefined, metricType: 'all', predictionHours: 1 },
        { toolCallId: 'ir-trend', messages: [] }
      ),
      serverId
        ? (await import('../tools-ai-sdk/index.js').then((m) =>
            m.buildIncidentTimeline.execute!(
              { serverId, timeRangeHours: 6 },
              { toolCallId: 'ir-timeline', messages: [] }
            )
          ))
        : null,
    ]);

    // 2. Extract structured data from tool results
    const toolBasedData = extractToolBasedData(anomalyData, trendData, timelineData, serverId);

    // Check if Reporter Agent is available
    const reporterConfig = getReporterAgentConfig();
    const reporterModelResult = reporterConfig?.getModel();
    if (!reporterConfig || !reporterModelResult || !isReporterAgentAvailable()) {
      console.warn('⚠️ [Incident Report] Reporter Agent unavailable, using tool-based fallback');
      return jsonSuccess(c, {
        ...toolBasedData,
        created_at: new Date().toISOString(),
        _source: 'Tool-based Fallback (No Agent)',
        _durationMs: Date.now() - startTime,
      });
    }

    // 3. Build prompt for Reporter Agent with JSON output request
    const metricsContext =
      metrics && metrics.length > 0
        ? `\n현재 서버 메트릭:\n${metrics
            .map(
              (m: { server_name: string; cpu: number; memory: number; disk: number }) =>
                `- ${m.server_name}: CPU ${m.cpu.toFixed(1)}%, Memory ${m.memory.toFixed(1)}%, Disk ${m.disk.toFixed(1)}%`
            )
            .join('\n')}`
        : '';

    const prompt = `서버 장애 보고서를 JSON 형식으로 생성해주세요.

## 요청 정보
- 대상 서버: ${serverId || '전체 서버'}
- 상황: ${query || '현재 시스템 상태 분석'}
- 심각도 힌트: ${severity || '자동 판단'}
- 카테고리: ${category || '일반'}
${metricsContext}

## 현재 수집된 데이터
- 이상 감지: ${JSON.stringify(anomalyData).slice(0, 500)}
- 트렌드: ${JSON.stringify(trendData).slice(0, 300)}

## 중요: 반드시 아래 JSON 형식으로만 응답하세요

\`\`\`json
{
  "title": "간결한 상황 요약 (예: 웹 서버 CPU 과부하 경고)",
  "severity": "critical|high|medium|low 중 하나",
  "description": "현재 상황에 대한 상세 설명 (2-3문장)",
  "affected_servers": ["서버ID1", "서버ID2"],
  "root_cause": "근본 원인 분석 결과",
  "recommendations": [
    {"action": "조치 내용", "priority": "high|medium|low", "expected_impact": "예상 효과"}
  ],
  "pattern": "감지된 패턴 설명"
}
\`\`\`

위 형식의 JSON만 출력하세요. 다른 텍스트는 포함하지 마세요.`;

    console.log(`🤖 [Incident Report] Invoking Reporter Agent with JSON output...`);

    const result = await generateText({
      model: reporterModelResult.model,
      messages: [
        { role: 'system', content: reporterConfig.instructions },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      maxOutputTokens: 1024,
    });

    const durationMs = Date.now() - startTime;
    console.log(`✅ [Incident Report] Agent completed in ${durationMs}ms`);

    // 4. Sanitize Chinese characters and parse JSON from agent response
    const sanitizedText = sanitizeChineseCharacters(result.text);
    const agentReport = parseAgentJsonResponse(sanitizedText, toolBasedData);

    // 5. Merge tool-based data with agent response (agent takes precedence for text fields)
    const finalReport = {
      id: toolBasedData.id,
      title: agentReport.title || toolBasedData.title,
      severity: agentReport.severity || toolBasedData.severity,
      description: agentReport.description || toolBasedData.description,
      affected_servers: agentReport.affected_servers.length > 0
        ? agentReport.affected_servers
        : toolBasedData.affected_servers,
      anomalies: toolBasedData.anomalies, // From tool
      system_summary: toolBasedData.system_summary, // From tool
      timeline: toolBasedData.timeline, // From tool
      root_cause_analysis: {
        primary_cause: agentReport.root_cause || '도구 분석 결과를 참조하세요',
        contributing_factors: [],
      },
      recommendations: agentReport.recommendations.length > 0
        ? agentReport.recommendations
        : toolBasedData.recommendations,
      pattern: agentReport.pattern || toolBasedData.pattern,
      created_at: new Date().toISOString(),
      _agentResponse: sanitizedText,
      _source: 'Reporter Agent + Tool Data (Hybrid)',
      _durationMs: durationMs,
    };

    return jsonSuccess(c, finalReport);
  } catch (error) {
    return handleApiError(c, error, 'Incident Report');
  }
});

/**
 * Extract structured data from tool results
 * Updated to work with detectAnomaliesAllServers output
 */
function extractToolBasedData(
  anomalyData: unknown,
  trendData: unknown,
  timelineData: unknown,
  serverId?: string
): {
  id: string;
  title: string;
  severity: string;
  description: string;
  affected_servers: string[];
  anomalies: Array<{ server_id: string; server_name: string; metric: string; value: number; severity: string }>;
  system_summary: { total_servers: number; healthy_servers: number; warning_servers: number; critical_servers: number };
  timeline: Array<{ timestamp: string; event: string; severity: string }>;
  recommendations: Array<{ action: string; priority: string; expected_impact: string }>;
  pattern: string;
} {
  const id = randomUUID();

  // Parse anomaly data from detectAnomaliesAllServers
  const allServerAnomaly = anomalyData as {
    success?: boolean;
    totalServers?: number;
    anomalies?: Array<{ server_id: string; server_name: string; metric: string; value: number; severity: string }>;
    affectedServers?: string[];
    summary?: { totalServers?: number; healthyCount?: number; warningCount?: number; criticalCount?: number };
    hasAnomalies?: boolean;
    anomalyCount?: number;
  } | undefined;

  // Get anomalies directly from the new format
  const anomalies: Array<{ server_id: string; server_name: string; metric: string; value: number; severity: string }> =
    allServerAnomaly?.anomalies || [];

  // System summary from anomaly data (now properly structured)
  // Use snake_case to match frontend expectations
  const summary = allServerAnomaly?.summary || {};
  const systemSummary = {
    total_servers: summary.totalServers ?? allServerAnomaly?.totalServers ?? 0,
    healthy_servers: summary.healthyCount ?? 0,
    warning_servers: summary.warningCount ?? 0,
    critical_servers: summary.criticalCount ?? 0,
  };

  // Parse timeline data
  const tl = timelineData as { events?: Array<{ timestamp: string; description: string; severity: string }> } | null;
  const timeline: Array<{ timestamp: string; event: string; severity: string }> = [];
  if (tl?.events) {
    for (const e of tl.events) {
      timeline.push({
        timestamp: e.timestamp,
        event: e.description,
        severity: e.severity,
      });
    }
  }

  // Determine severity from data
  let severity = 'info';
  if (systemSummary.critical_servers > 0 || anomalies.some((a) => a.severity === 'critical')) {
    severity = 'critical';
  } else if (systemSummary.warning_servers > 0 || anomalies.some((a) => a.severity === 'warning' || a.severity === 'medium')) {
    severity = 'warning';
  }

  // Parse trend data for recommendations
  const trend = trendData as { summary?: { hasRisingTrends?: boolean; risingMetrics?: string[] } } | undefined;
  const recommendations: Array<{ action: string; priority: string; expected_impact: string }> = [];
  if (trend?.summary?.hasRisingTrends && trend.summary.risingMetrics) {
    for (const metric of trend.summary.risingMetrics.slice(0, 3)) {
      recommendations.push({
        action: `${metric} 상승 추세 모니터링 강화`,
        priority: 'medium',
        expected_impact: '사전 장애 예방',
      });
    }
  }

  // Generate title and description using allServerAnomaly data
  const hasAnomalies = allServerAnomaly?.hasAnomalies ?? anomalies.length > 0;
  const anomalyCount = allServerAnomaly?.anomalyCount ?? anomalies.length;
  const affectedServerIds = allServerAnomaly?.affectedServers ?? [...new Set(anomalies.map((a) => a.server_id))];

  const title = hasAnomalies
    ? `이상 감지: ${anomalyCount}건 발견`
    : '서버 상태 정상';
  const description = hasAnomalies
    ? `총 ${systemSummary.total_servers}대 서버 중 ${anomalyCount}건의 이상 징후가 감지되었습니다.`
    : `총 ${systemSummary.total_servers}대 서버가 정상 상태입니다.`;

  return {
    id,
    title,
    severity,
    description,
    affected_servers: serverId ? [serverId] : affectedServerIds,
    anomalies,
    system_summary: systemSummary,
    timeline,
    recommendations,
    pattern: hasAnomalies ? '이상 패턴 감지됨' : '정상 패턴',
  };
}

/**
 * Parse JSON response from agent
 */
function parseAgentJsonResponse(
  text: string,
  fallback: { title: string; severity: string; affected_servers: string[]; recommendations: Array<{ action: string; priority: string; expected_impact: string }>; pattern: string }
): {
  title: string;
  severity: string;
  description: string;
  affected_servers: string[];
  root_cause: string;
  recommendations: Array<{ action: string; priority: string; expected_impact: string }>;
  pattern: string;
} {
  // Try to extract JSON from response
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    try {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      return {
        title: parsed.title || fallback.title,
        severity: parsed.severity || fallback.severity,
        description: parsed.description || '',
        affected_servers: Array.isArray(parsed.affected_servers) ? parsed.affected_servers : fallback.affected_servers,
        root_cause: parsed.root_cause || '',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : fallback.recommendations,
        pattern: parsed.pattern || fallback.pattern,
      };
    } catch (e) {
      console.warn('⚠️ [Incident Report] JSON parse failed, using regex extraction');
    }
  }

  // Fallback to regex extraction (legacy parser)
  return {
    title: fallback.title,
    severity: fallback.severity,
    description: '',
    affected_servers: fallback.affected_servers,
    root_cause: '',
    recommendations: fallback.recommendations,
    pattern: fallback.pattern,
  };
}

/**
 * Parse Reporter Agent response into structured format
 */
function parseReporterResponse(text: string, serverId?: string): {
  id: string;
  title: string;
  severity: string;
  affectedServers: string[];
  rootCauseAnalysis: { primary_cause: string; contributing_factors: string[] };
  recommendations: Array<{ action: string; priority: string; expected_impact: string }>;
  timeline: Array<{ timestamp: string; event: string; severity: string }>;
  pattern: string;
} {
  const id = randomUUID();

  // Extract title (first line or ## heading)
  const titleMatch = text.match(/^#*\s*(.+?)[\n\r]/m) || text.match(/제목[:\s]*(.+?)[\n\r]/i);
  const title = titleMatch?.[1]?.trim() || '서버 상태 분석 보고서';

  // Extract severity
  const severityMatch = text.match(/심각도[:\s]*(critical|high|medium|low|위험|높음|중간|낮음)/i);
  let severity = 'medium';
  if (severityMatch) {
    const s = severityMatch[1].toLowerCase();
    if (s === 'critical' || s === '위험') severity = 'critical';
    else if (s === 'high' || s === '높음') severity = 'high';
    else if (s === 'low' || s === '낮음') severity = 'low';
  }

  // Extract affected servers
  const serversMatch = text.match(/영향.*서버[:\s]*([^\n]+)/i) || text.match(/서버[:\s]*([^\n]*(?:,|、)[^\n]*)/i);
  const affectedServers = serversMatch
    ? serversMatch[1].split(/[,、\s]+/).filter(Boolean).map(s => s.trim())
    : serverId ? [serverId] : [];

  // Extract root cause
  const causeMatch = text.match(/근본\s*원인[:\s]*([^\n]+)/i) || text.match(/원인[:\s]*([^\n]+)/i);
  const rootCauseAnalysis = {
    primary_cause: causeMatch?.[1]?.trim() || '분석 결과를 확인하세요',
    contributing_factors: [] as string[],
  };

  // Extract recommendations
  const recommendations: Array<{ action: string; priority: string; expected_impact: string }> = [];
  const recMatches = text.matchAll(/(?:권장|조치|해결)[:\s]*[-•*]?\s*(.+)/gi);
  for (const match of recMatches) {
    if (match[1] && match[1].length > 5) {
      recommendations.push({
        action: match[1].trim(),
        priority: severity === 'critical' ? 'high' : 'medium',
        expected_impact: '상태 개선 예상',
      });
    }
  }
  // Also try numbered list
  const numberedRecs = text.matchAll(/\d+\.\s*(.+)/g);
  for (const match of numberedRecs) {
    if (match[1] && match[1].length > 10 && recommendations.length < 5) {
      recommendations.push({
        action: match[1].trim(),
        priority: 'medium',
        expected_impact: '상태 개선 예상',
      });
    }
  }

  // Extract pattern
  const patternMatch = text.match(/패턴[:\s]*([^\n]+)/i);
  const pattern = patternMatch?.[1]?.trim() || '분석 완료';

  return {
    id,
    title,
    severity,
    affectedServers,
    rootCauseAnalysis,
    recommendations: recommendations.slice(0, 5),
    timeline: [],
    pattern,
  };
}

/**
 * Fallback when Reporter Agent is unavailable
 */
async function incidentReportFallback(
  c: Context,
  { serverId, query, severity, category }: { serverId?: string; query?: string; severity?: string; category?: string }
) {
  // Type definitions for searchKnowledgeBase
  type KBCategory = 'incident' | 'troubleshooting' | 'security' | 'performance' | 'best_practice';
  type KBSeverity = 'critical' | 'high' | 'medium' | 'low';

  // 1. RAG search
  const ragResult = await searchKnowledgeBase.execute!({
    query: query || '서버 장애 분석',
    category: category as KBCategory | undefined,
    severity: severity as KBSeverity | undefined,
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

  console.log(`✅ [Incident Report Fallback] Generated for ${serverId || 'general'}`);

  return jsonSuccess(c, {
    id: randomUUID(),
    title: '서버 상태 분석 보고서 (Fallback)',
    severity: severity || 'medium',
    affected_servers: serverId ? [serverId] : [],
    root_cause_analysis: { primary_cause: '자동 분석 결과를 확인하세요', contributing_factors: [] },
    recommendations: [],
    timeline: [],
    pattern: 'fallback',
    knowledgeBase: ragResult,
    recommendedCommands: commandResult,
    currentStatus: anomalyResult,
    created_at: new Date().toISOString(),
    _source: 'Cloud Run Fallback (Direct Tool)',
  });
}

// analyze-batch endpoint removed - not used by frontend

// RAG sync/stats endpoints removed - not used by frontend
