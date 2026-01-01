/**
 * AI SDK Tools Registry
 *
 * Central export point for all Vercel AI SDK tools.
 * These tools replace the LangChain-based tools.
 *
 * @version 1.0.0
 * @updated 2025-12-28
 */

// ============================================================================
// Server Metrics Tools
// ============================================================================
export {
  getServerMetrics,
  getServerMetricsAdvanced,
  filterServers,
} from './server-metrics';

// ============================================================================
// RCA (Root Cause Analysis) Tools
// ============================================================================
export {
  buildIncidentTimeline,
  correlateMetrics,
  findRootCause,
} from './rca-analysis';

// ============================================================================
// Analyst Tools (Anomaly Detection & Trend Prediction)
// ============================================================================
export {
  detectAnomalies,
  detectAnomaliesHybrid,
  detectAnomaliesAdaptive,
  predictTrends,
  analyzePattern,
} from './analyst-tools';

// ============================================================================
// Reporter Tools (RAG Search & Command Recommendations & Web Search)
// ============================================================================
export {
  searchKnowledgeBase,
  recommendCommands,
  extractKeywordsFromQuery,
  searchWeb,
} from './reporter-tools';

// ============================================================================
// Tool Collections (for Supervisor)
// ============================================================================
import { getServerMetrics, getServerMetricsAdvanced, filterServers } from './server-metrics';
import { buildIncidentTimeline, correlateMetrics, findRootCause } from './rca-analysis';
import { detectAnomalies, detectAnomaliesHybrid, detectAnomaliesAdaptive, predictTrends, analyzePattern } from './analyst-tools';
import { searchKnowledgeBase, recommendCommands, searchWeb } from './reporter-tools';

/**
 * All available tools for the AI SDK Supervisor
 */
export const allTools = {
  // Server Metrics (NLQ)
  getServerMetrics,
  getServerMetricsAdvanced,
  filterServers,

  // RCA Analysis
  buildIncidentTimeline,
  correlateMetrics,
  findRootCause,

  // Analyst
  detectAnomalies,
  detectAnomaliesHybrid,
  detectAnomaliesAdaptive,
  predictTrends,
  analyzePattern,

  // Reporter
  searchKnowledgeBase,
  recommendCommands,
  searchWeb,
};

/**
 * Tool categories for routing
 */
export const toolCategories = {
  metrics: {
    getServerMetrics,
    getServerMetricsAdvanced,
    filterServers,
  },
  rca: {
    buildIncidentTimeline,
    correlateMetrics,
    findRootCause,
  },
  analyst: {
    detectAnomalies,
    detectAnomaliesHybrid,
    detectAnomaliesAdaptive,
    predictTrends,
    analyzePattern,
  },
  reporter: {
    searchKnowledgeBase,
    recommendCommands,
    searchWeb,
  },
};

/**
 * Tool descriptions for intent classification
 */
export const toolDescriptions = {
  getServerMetrics: '서버 상태 조회 (CPU, 메모리, 디스크)',
  getServerMetricsAdvanced: '고급 서버 메트릭 조회 (시간범위, 필터, 집계)',
  filterServers: '조건에 맞는 서버 필터링',
  buildIncidentTimeline: '장애 타임라인 구성',
  correlateMetrics: '메트릭 간 상관관계 분석',
  findRootCause: '근본 원인 분석 (RCA)',
  detectAnomalies: '이상치 탐지 (통계: 2σ)',
  detectAnomaliesHybrid: '하이브리드 이상 탐지 (통계 + Isolation Forest)',
  detectAnomaliesAdaptive: '적응형 이상 탐지 (시간대/요일 패턴)',
  predictTrends: '트렌드 예측',
  analyzePattern: '패턴 분석',
  searchKnowledgeBase: '과거 장애 이력 및 해결 방법 검색 (GraphRAG)',
  recommendCommands: 'CLI 명령어 추천',
  searchWeb: '실시간 웹 검색 (Tavily) - 최신 기술 정보, 보안 이슈',
};

export type ToolName = keyof typeof allTools;
export type ToolCategory = keyof typeof toolCategories;
