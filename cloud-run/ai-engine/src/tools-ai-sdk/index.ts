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
  checkThresholds,
  detectAnomalies,
  detectAnomaliesHybrid,
  detectAnomaliesAdaptive,
  detectAnomaliesUnified,
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
// Incident Report Tools (Structured Reports, SLA, Prediction, Correlation)
// ============================================================================
export {
  calculateSLA,
  predictMetrics,
  analyzeServerCorrelation,
  generateIncidentReport,
} from './incident-report-tools';

// ============================================================================
// Incident Evaluation Tools (Evaluator-Optimizer Pattern)
// ============================================================================
export {
  evaluateIncidentReport,
  validateReportStructure,
  scoreRootCauseConfidence,
  refineRootCauseAnalysis,
  enhanceSuggestedActions,
  extendServerCorrelation,
  incidentEvaluationTools,
} from './incident-evaluation-tools';

// ============================================================================
// Tool Collections (for Supervisor)
// ============================================================================
import { getServerMetrics, getServerMetricsAdvanced, filterServers } from './server-metrics';
import { buildIncidentTimeline, correlateMetrics, findRootCause } from './rca-analysis';
import { checkThresholds, detectAnomalies, detectAnomaliesHybrid, detectAnomaliesAdaptive, detectAnomaliesUnified, predictTrends, analyzePattern } from './analyst-tools';
import { searchKnowledgeBase, recommendCommands, searchWeb } from './reporter-tools';
import { calculateSLA, predictMetrics, analyzeServerCorrelation, generateIncidentReport } from './incident-report-tools';
import { evaluateIncidentReport, validateReportStructure, scoreRootCauseConfidence, refineRootCauseAnalysis, enhanceSuggestedActions, extendServerCorrelation } from './incident-evaluation-tools';

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
  checkThresholds,
  detectAnomalies,
  detectAnomaliesHybrid,
  detectAnomaliesAdaptive,
  detectAnomaliesUnified,
  predictTrends,
  analyzePattern,

  // Reporter
  searchKnowledgeBase,
  recommendCommands,
  searchWeb,

  // Incident Report
  calculateSLA,
  predictMetrics,
  analyzeServerCorrelation,
  generateIncidentReport,

  // Incident Evaluation (Evaluator-Optimizer Pattern)
  evaluateIncidentReport,
  validateReportStructure,
  scoreRootCauseConfidence,
  refineRootCauseAnalysis,
  enhanceSuggestedActions,
  extendServerCorrelation,
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
    checkThresholds,
    detectAnomalies,
    detectAnomaliesHybrid,
    detectAnomaliesAdaptive,
    detectAnomaliesUnified,
    predictTrends,
    analyzePattern,
  },
  reporter: {
    searchKnowledgeBase,
    recommendCommands,
    searchWeb,
  },
  incident: {
    calculateSLA,
    predictMetrics,
    analyzeServerCorrelation,
    generateIncidentReport,
  },
  evaluation: {
    evaluateIncidentReport,
    validateReportStructure,
    scoreRootCauseConfidence,
    refineRootCauseAnalysis,
    enhanceSuggestedActions,
    extendServerCorrelation,
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
  checkThresholds: '임계값 초과 확인 (업계 표준: 80/90%)',
  detectAnomalies: '이상치 탐지 (통계: 2σ)',
  detectAnomaliesHybrid: '하이브리드 이상 탐지 (통계 + Isolation Forest)',
  detectAnomaliesAdaptive: '적응형 이상 탐지 (시간대/요일 패턴)',
  detectAnomaliesUnified: '통합 이상 탐지 (모든 탐지기 앙상블)',
  predictTrends: '트렌드 예측',
  analyzePattern: '패턴 분석',
  searchKnowledgeBase: '과거 장애 이력 및 해결 방법 검색 (GraphRAG)',
  recommendCommands: 'CLI 명령어 추천',
  searchWeb: '실시간 웹 검색 (Tavily) - 최신 기술 정보, 보안 이슈',
  calculateSLA: 'SLA 가용률 계산 및 위반 여부 확인',
  predictMetrics: '메트릭 예측 (30분 후 값 추정)',
  analyzeServerCorrelation: '다중 서버 간 장애 연관성 분석',
  generateIncidentReport: '종합 장애 보고서 생성 (Markdown/JSON)',
  // Incident Evaluation
  evaluateIncidentReport: '장애 보고서 품질 종합 평가 (구조, 완성도, 정확도, 실행가능성)',
  validateReportStructure: '보고서 구조적 완성도 검증',
  scoreRootCauseConfidence: '근본원인 분석 신뢰도 상세 점수화',
  refineRootCauseAnalysis: '낮은 신뢰도 근본원인 분석 심화',
  enhanceSuggestedActions: '권장 조치 CLI 명령어 포함 구체화',
  extendServerCorrelation: '서버 간 연관성 분석 확장',
};

export type ToolName = keyof typeof allTools;
export type ToolCategory = keyof typeof toolCategories;

// ============================================================================
// Tool Validation
// ============================================================================

export interface ToolValidationResult {
  isValid: boolean;
  totalTools: number;
  validTools: string[];
  invalidTools: string[];
  missingDescriptions: string[];
  errors: string[];
}

/**
 * Validate all tools at startup
 * Checks:
 * - Tool exists and is a function
 * - Tool has a description
 * - Tool categories are consistent
 */
export function validateTools(): ToolValidationResult {
  const result: ToolValidationResult = {
    isValid: true,
    totalTools: 0,
    validTools: [],
    invalidTools: [],
    missingDescriptions: [],
    errors: [],
  };

  const toolNames = Object.keys(allTools) as ToolName[];
  result.totalTools = toolNames.length;

  for (const name of toolNames) {
    const tool = allTools[name];

    // Check if tool is defined
    if (!tool) {
      result.invalidTools.push(name);
      result.errors.push(`Tool "${name}" is undefined`);
      result.isValid = false;
      continue;
    }

    // Check if tool has execute function (AI SDK tool interface)
    if (typeof tool !== 'object' || !('execute' in tool || 'generate' in tool)) {
      // Some tools might be wrapped differently, just warn
      console.warn(`⚠️ [ToolValidation] Tool "${name}" may not have standard structure`);
    }

    // Check if tool has description
    if (!toolDescriptions[name]) {
      result.missingDescriptions.push(name);
    }

    result.validTools.push(name);
  }

  // Validate tool categories consistency
  const categorizedTools = new Set<string>();
  for (const category of Object.keys(toolCategories) as ToolCategory[]) {
    const categoryTools = toolCategories[category];
    for (const toolName of Object.keys(categoryTools)) {
      categorizedTools.add(toolName);
    }
  }

  // Find tools not in any category
  for (const name of toolNames) {
    if (!categorizedTools.has(name)) {
      result.errors.push(`Tool "${name}" is not assigned to any category`);
    }
  }

  return result;
}

/**
 * Log tool validation result
 */
export function logToolValidation(): void {
  const result = validateTools();

  if (result.isValid) {
    console.log(`✅ [ToolValidation] ${result.totalTools} tools validated successfully`);
    console.log(`   Tools: [${result.validTools.join(', ')}]`);
  } else {
    console.error(`❌ [ToolValidation] Validation failed!`);
    console.error(`   Invalid tools: [${result.invalidTools.join(', ')}]`);
    for (const error of result.errors) {
      console.error(`   - ${error}`);
    }
  }

  if (result.missingDescriptions.length > 0) {
    console.warn(`⚠️ [ToolValidation] Missing descriptions: [${result.missingDescriptions.join(', ')}]`);
  }
}

// Run validation at module load (startup)
logToolValidation();
