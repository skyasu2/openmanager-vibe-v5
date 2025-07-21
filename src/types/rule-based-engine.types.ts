/**
 * 🎯 룰기반 메인 엔진 타입 정의
 *
 * SOLID 원칙: Interface Segregation Principle
 * 각 역할별로 인터페이스 분리
 */

// ========================================
// 기본 응답 타입들
// ========================================

export interface RuleBasedResponse {
  intent: string;
  confidence: number;
  response: string;
  patterns: string[];
  processingTime: number;
  engine: string;
  metadata: RuleBasedMetadata;
}

export interface RuleBasedMetadata {
  nlpAnalysis: NLPAnalysisResult;
  intentClassification: IntentClassificationResult;
  patternMatching: PatternMatchingResult;
  koreanNLU: KoreanNLUResult;
  queryAnalysis: QueryAnalysisResult;
  logProcessing?: LogProcessingResult;
}

// ========================================
// 개별 엔진 응답 타입들
// ========================================

export interface NLPAnalysisResult {
  intent: string;
  confidence: number;
  entities: any[];
  keywords: string[];
  language: 'ko' | 'en';
  sentiment: 'positive' | 'negative' | 'neutral';
  query_type: string;
}

export interface IntentClassificationResult {
  intent: string;
  confidence: number;
  alternatives: Array<{
    intent: string;
    confidence: number;
  }>;
  entities: Record<string, string[]>;
  processingTime: number;
}

export interface PatternMatchingResult {
  matchedPatterns: string[];
  alerts: PatternAlert[];
  confidence: number;
  processingTime: number;
}

export interface KoreanNLUResult {
  category: string;
  confidence: number;
  keywords: string[];
  processingTime: number;
}

export interface QueryAnalysisResult {
  queryType:
    | 'analysis'
    | 'search'
    | 'prediction'
    | 'optimization'
    | 'troubleshooting';
  confidence: number;
  entities: Record<string, string[]>;
  technicalTerms: string[];
  processingTime: number;
}

export interface LogProcessingResult {
  level: string;
  module: string;
  message: string;
  details?: string;
  metadata?: Record<string, any>;
  processingTime: number;
}

// ========================================
// 패턴 관련 타입들
// ========================================

export interface PatternAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  serverId?: string;
  metadata?: Record<string, any>;
}

export interface PatternRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  cooldown: number;
  adaptiveThreshold: boolean;
  learned: boolean;
  createdAt: number;
  triggerCount: number;
  lastTriggered?: number;
}

// ========================================
// 엔진 설정 및 상태 타입들
// ========================================

export interface RuleBasedEngineConfig {
  enabledEngines: {
    nlpProcessor: boolean;
    intentClassifier: boolean;
    patternMatcher: boolean;
    koreanNLU: boolean;
    queryAnalyzer: boolean;
    logEngine: boolean;
  };
  performance: {
    timeoutMs: number;
    parallelProcessing: boolean;
    cacheEnabled: boolean;
    maxCacheSize: number;
  };
  patterns: {
    serverMonitoring: boolean;
    korean: boolean;
    english: boolean;
    technical: boolean;
  };
}

export interface EngineStats {
  totalQueries: number;
  averageResponseTime: number;
  successRate: number;
  errorCount: number;
  cacheHitRate: number;
  engineStatus: Record<string, 'ready' | 'loading' | 'error' | 'disabled'>;
  lastUpdated: number;
}

// ========================================
// 메인 엔진 인터페이스
// ========================================

export interface IRuleBasedMainEngine {
  // 핵심 기능
  processQuery(
    query: string,
    options?: QueryOptions
  ): Promise<RuleBasedResponse>;

  // 초기화 및 상태 관리
  initialize(): Promise<void>;
  isReady(): boolean;
  getStats(): EngineStats;

  // 설정 관리
  updateConfig(config: Partial<RuleBasedEngineConfig>): void;
  getConfig(): RuleBasedEngineConfig;

  // 패턴 관리
  addPattern(
    pattern: Omit<PatternRule, 'id' | 'createdAt' | 'triggerCount'>
  ): Promise<string>;
  removePattern(patternId: string): boolean;
  getPatterns(): Promise<PatternRule[]>;
}

// ========================================
// 개별 엔진 인터페이스들 (기존 엔진 래핑)
// ========================================

export interface INLPProcessor {
  processNLP(query: string): Promise<NLPAnalysisResult>;
  isReady(): boolean;
}

export interface IIntentClassifier {
  classify(query: string, context?: any): Promise<IntentClassificationResult>;
  initialize(): Promise<void>;
  isReady(): boolean;
}

export interface IPatternMatcherEngine {
  analyzeMetrics(metrics: any): Promise<PatternMatchingResult>;
  addRule(rule: Omit<PatternRule, 'id' | 'createdAt' | 'triggerCount'>): string;
  getStats(): any;
}

export interface IKoreanNLUProcessor {
  analyzeIntent(text: string): Promise<KoreanNLUResult>;
  initialize(): Promise<void>;
  isReady(): boolean;
}

export interface IQueryAnalyzer {
  analyze(query: string): Promise<QueryAnalysisResult>;
  isReady(): boolean;
}

export interface ILogEngine {
  processLog(log: string): Promise<LogProcessingResult>;
  isReady(): boolean;
}

// ========================================
// 옵션 및 유틸리티 타입들
// ========================================

export interface QueryOptions {
  timeout?: number;
  enabledEngines?: string[];
  priority?: 'speed' | 'accuracy' | 'balance';
  language?: 'ko' | 'en' | 'auto';
  context?: Record<string, any>;
}

export interface EngineWeights {
  // Phase 2: 새로운 서버 모니터링 패턴 엔진들
  serverPatterns?: number;
  enhancedKoreanNLU?: number;

  // 기존 엔진들
  nlpProcessor: number;
  intentClassifier: number;
  patternMatcher: number;
  koreanNLU: number;
  queryAnalyzer: number;
  logEngine: number;
}

export interface FusionResult {
  combinedIntent: string;
  combinedConfidence: number;
  contributingEngines: string[];
  weights: EngineWeights;
  processingTime: number;
}

// ========================================
// 에러 타입들
// ========================================

export class RuleBasedEngineError extends Error {
  constructor(
    message: string,
    public code: string,
    public engine?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'RuleBasedEngineError';
  }
}

export interface EngineErrorInfo {
  engine: string;
  error: Error;
  timestamp: number;
  query?: string;
  context?: any;
}

// ========================================
// 상수 정의
// ========================================

export const ENGINE_NAMES = {
  NLP_PROCESSOR: 'NLPProcessor',
  INTENT_CLASSIFIER: 'IntentClassifier',
  PATTERN_MATCHER: 'PatternMatcherEngine',
  KOREAN_NLU: 'KoreanNLUProcessor',
  QUERY_ANALYZER: 'QueryAnalyzer',
  LOG_ENGINE: 'RealTimeLogEngine',
} as const;

export const INTENT_CATEGORIES = {
  SERVER_STATUS: 'server_status',
  PERFORMANCE_ANALYSIS: 'performance_analysis',
  LOG_ANALYSIS: 'log_analysis',
  ALERT_MANAGEMENT: 'alert_management',
  SPECIFIC_SERVER_ANALYSIS: 'specific_server_analysis',
  CAPACITY_PLANNING: 'capacity_planning',
  SECURITY_ANALYSIS: 'security_analysis',
  TROUBLESHOOTING: 'troubleshooting',
  GENERAL_INQUIRY: 'general_inquiry',
} as const;

export const DEFAULT_CONFIG: RuleBasedEngineConfig = {
  enabledEngines: {
    nlpProcessor: true,
    intentClassifier: true,
    patternMatcher: true,
    koreanNLU: true,
    queryAnalyzer: true,
    logEngine: true,
  },
  performance: {
    timeoutMs: 5000,
    parallelProcessing: true,
    cacheEnabled: true,
    maxCacheSize: 1000,
  },
  patterns: {
    serverMonitoring: true,
    korean: true,
    english: true,
    technical: true,
  },
};

/**
 * 📝 타입 설계 완료
 *
 * ✅ Interface Segregation Principle 준수
 * ✅ 기존 엔진들과 호환 가능한 인터페이스
 * ✅ 확장 가능한 구조
 * ✅ 에러 처리 및 설정 관리 포함
 */

/**
 * 룰기반 쿼리 처리 결과
 */
export interface RuleBasedQueryResult {
  query: string;
  intent: string;
  confidence: number;
  response: string;
  category: string;
  serverType?: string; // 🎯 NEW: 감지된 서버 타입
  practicalGuide?: PracticalGuideResult; // 🎯 NEW: 실무 가이드
  suggestions?: string[];
  processingTime: number;
  engineBreakdown: Record<string, number>;
  metadata: {
    rulesMatched: number;
    confidenceBreakdown?: Record<string, number>;
    fallbackUsed: boolean;
    serverTypeDetected?: string; // 🎯 NEW: 메타데이터에도 서버 타입
  };
}

/**
 * 🎯 실무 가이드 결과 타입 (NEW!)
 */
export interface PracticalGuideResult {
  serverType: string;
  availableGuides: {
    commands: boolean;
    troubleshooting: boolean;
    monitoring: boolean;
  };
  quickCommands?: string[];
  troubleshootingTips?: string[];
  monitoringMetrics?: string[];
}
