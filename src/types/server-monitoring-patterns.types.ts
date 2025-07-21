/**
 * 🖥️ 서버 모니터링 패턴 시스템 타입 정의
 *
 * Phase 2: 서버 모니터링 특화 패턴 확장 타입
 * SOLID 원칙 적용: 인터페이스 분리 원칙 (ISP)
 */

// ===== 기본 인터페이스 =====

/**
 * 패턴 매칭 결과 인터페이스
 */
export interface PatternMatchResult {
  category: PatternCategory;
  confidence: number;
  matchedPatterns: string[];
  subCategories?: PatternCategory[];
  suggestions?: string[];
  processingTime: number;
}

/**
 * 패턴 카테고리 타입
 */
export type PatternCategory =
  | 'server_status'
  | 'performance_analysis'
  | 'log_analysis'
  | 'troubleshooting'
  | 'resource_monitoring'
  | 'general_inquiry';

/**
 * 서버 모니터링 패턴 인터페이스
 */
export interface IServerMonitoringPatterns {
  matchPattern(query: string): Promise<PatternMatchResult>;
  getPatternsByCategory(category: PatternCategory): RegExp[];
  addPattern(category: PatternCategory, pattern: RegExp): void;
  getStatistics(): PatternStatistics;
}

// ===== 확장된 NLP 처리 인터페이스 =====

/**
 * 한국어 NLP 분석 결과
 */
export interface KoreanNLUResult {
  intent: string;
  confidence: number;
  serverType?: ServerType;
  metricType?: MetricType;
  statusType?: StatusType;
  processedQuery: string;
  originalQuery: string;
  processingTime: number;
}

/**
 * 서버 타입
 */
export type ServerType =
  | 'web_server' // 웹서버 (nginx, apache, iis)
  | 'api_server' // API서버 (rest, graphql, grpc)
  | 'database' // 데이터베이스 (mysql, postgresql, mongodb)
  | 'cache_server' // 캐시서버 (redis, memcached)
  | 'app_server' // 애플리케이션서버 (nodejs, java, python)
  | 'proxy_server' // 프록시서버 (nginx, haproxy)
  | 'unknown';

/**
 * 메트릭 타입
 */
export type MetricType =
  | 'cpu' // CPU 사용률, 프로세서, 연산
  | 'memory' // 메모리, RAM, 저장공간
  | 'network' // 네트워크, 대역폭, 통신
  | 'disk' // 디스크, 스토리지, 용량
  | 'response_time' // 응답시간, 지연시간
  | 'throughput' // 처리량, 처리속도
  | 'connection' // 연결, 세션
  | 'unknown';

/**
 * 상태 타입
 */
export type StatusType =
  | 'normal' // 정상, healthy, ok, 양호
  | 'warning' // 경고, warning, caution, 주의
  | 'critical' // 위험, critical, danger, 심각
  | 'unknown';

/**
 * 확장된 한국어 NLP 프로세서 인터페이스
 */
export interface IEnhancedKoreanNLUProcessor {
  analyzeIntent(query: string): Promise<KoreanNLUResult>;
  normalizeQuery(query: string): string;
  extractServerTerms(query: string): ServerTerms;
  mapDomainTerms(terms: string[]): DomainMapping;
}

// ===== 도메인 특화 타입 =====

/**
 * 서버 용어 추출 결과
 */
export interface ServerTerms {
  serverTypes: string[];
  metricTypes: string[];
  statusTypes: string[];
  actionTypes: string[];
  unknownTerms: string[];
}

/**
 * 도메인 매핑 결과
 */
export interface DomainMapping {
  serverType: ServerType;
  metricType: MetricType;
  statusType: StatusType;
  confidence: number;
  mappingDetails: {
    originalTerm: string;
    mappedTerm: string;
    mappingType: 'exact' | 'synonym' | 'fuzzy';
  }[];
}

/**
 * 패턴 통계 정보
 */
export interface PatternStatistics {
  totalPatterns: number;
  patternsByCategory: Record<PatternCategory, number>;
  averageMatchingTime: number;
  mostUsedPatterns: {
    pattern: string;
    category: PatternCategory;
    usageCount: number;
  }[];
  performanceMetrics: {
    fastestMatch: number;
    slowestMatch: number;
    averageConfidence: number;
  };
}

// ===== 설정 및 구성 타입 =====

/**
 * 패턴 구성 설정
 */
export interface PatternConfig {
  enableFuzzyMatching: boolean;
  confidenceThreshold: number;
  maxProcessingTime: number;
  enableCaching: boolean;
  cacheSize: number;
  enableStatistics: boolean;
}

/**
 * 서버 모니터링 패턴 데이터
 */
export interface PatternData {
  category: PatternCategory;
  patterns: RegExp[];
  weight: number;
  description: string;
  examples: string[];
  relatedCategories?: PatternCategory[];
}

/**
 * 패턴 매칭 컨텍스트
 */
export interface PatternMatchingContext {
  query: string;
  previousQueries?: string[];
  userContext?: {
    preferredLanguage: 'ko' | 'en';
    technicalLevel: 'beginner' | 'intermediate' | 'expert';
    frequentPatterns: PatternCategory[];
  };
  systemContext?: {
    currentServerStatus: StatusType;
    recentAlerts: string[];
    activeMetrics: MetricType[];
  };
}

// ===== 에러 및 예외 타입 =====

/**
 * 패턴 매칭 에러
 */
export class PatternMatchingError extends Error {
  constructor(
    message: string,
    public query: string,
    public category?: PatternCategory,
    public processingTime?: number
  ) {
    super(message);
    this.name = 'PatternMatchingError';
  }
}

/**
 * NLP 처리 에러
 */
export class NLPProcessingError extends Error {
  constructor(
    message: string,
    public query: string,
    public stage: 'tokenization' | 'analysis' | 'mapping' | 'normalization'
  ) {
    super(message);
    this.name = 'NLPProcessingError';
  }
}

// ===== 유틸리티 타입 =====

/**
 * 패턴 매칭 옵션
 */
export interface PatternMatchOptions {
  includeSubCategories?: boolean;
  maxSuggestions?: number;
  enablePerformanceLogging?: boolean;
  customThreshold?: number;
}

/**
 * 배치 처리 결과
 */
export interface BatchProcessingResult {
  results: PatternMatchResult[];
  totalProcessingTime: number;
  successCount: number;
  errorCount: number;
  errors: PatternMatchingError[];
}

// 클래스만 default export (런타임에 존재하는 것들만)
const ServerMonitoringErrors = {
  PatternMatchingError,
  NLPProcessingError,
};

export default ServerMonitoringErrors;
