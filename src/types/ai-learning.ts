// AI 학습 시스템 타입 정의

export interface UserInteractionLog {
  id: string;
  timestamp: Date;
  query: string;
  intent: string;
  confidence: number;
  response: string;
  userFeedback?: 'helpful' | 'not_helpful' | 'incorrect';
  contextData: {
    serverState: any;
    activeMetrics: string[];
    timeOfDay: string;
    userRole: string;
    sessionId: string;
  };
  responseTime: number; // 응답 시간 (ms)
  userId?: string; // 익명화된 사용자 ID
}

export interface UserFeedback {
  interactionId: string;
  feedback: 'helpful' | 'not_helpful' | 'incorrect';
  detailedReason?: string;
  timestamp: Date;
  additionalComments?: string;
}

export interface FailurePattern {
  id: string;
  pattern: string;
  frequency: number;
  commonQueries: string[];
  suggestedImprovement: string;
  confidence: number;
  lastOccurrence: Date;
}

export interface PatternSuggestion {
  id: string;
  originalPattern?: string;
  suggestedPattern: string;
  basedOnInteractions: string[]; // interaction IDs
  confidenceScore: number;
  estimatedImprovement: number; // 예상 개선율 (%)
  status: 'pending' | 'approved' | 'rejected' | 'testing';
  createdAt: Date;
}

export interface PatternImprovement {
  id: string;
  patternId: string;
  improvementType: 'accuracy' | 'coverage' | 'response_quality';
  beforeMetrics: {
    accuracy: number;
    coverage: number;
    userSatisfaction: number;
  };
  afterMetrics: {
    accuracy: number;
    coverage: number;
    userSatisfaction: number;
  };
  implementedAt: Date;
}

export interface WeightAdjustment {
  contextType: string;
  oldWeight: number;
  newWeight: number;
  reason: string;
  effectiveFrom: Date;
  performanceImpact: number;
}

export interface LogFilter {
  startDate?: Date;
  endDate?: Date;
  intent?: string;
  confidence?: {
    min: number;
    max: number;
  };
  feedback?: 'helpful' | 'not_helpful' | 'incorrect';
  userId?: string;
}

export interface AnalysisResult {
  totalInteractions: number;
  lowConfidenceCount: number;
  averageConfidence: number;
  commonFailurePatterns: FailurePattern[];
  recommendedActions: string[];
  analysisDate: Date;
}

export interface PatternAnalysis {
  negativePatterns: FailurePattern[];
  improvementOpportunities: PatternSuggestion[];
  priorityLevel: 'high' | 'medium' | 'low';
  estimatedImpact: number;
}

export interface QuestionType {
  category: string;
  examples: string[];
  frequency: number;
  currentCoverage: number; // 0-100%
  suggestedPatterns: string[];
}

export interface LearningMetrics {
  totalInteractions: number;
  successRate: number;
  averageResponseTime: number;
  userSatisfactionScore: number;
  patternCoverage: number;
  newPatternsDiscovered: number;
  improvementsImplemented: number;
  lastUpdated: Date;
}

/**
 * AI 분석용 구조화된 로그 (토큰 효율적)
 */
export interface QueryLogForAI {
  id: string;
  timestamp: string;
  query: string; // 요약 질문 (100자 내외)
  response: string; // 요약 응답 (200자 내외)
  intent: string;
  confidence: number;
  responseTime: number;
  feedback: 'helpful' | 'not_helpful' | 'incorrect' | null;
  contextSummary?: string; // 컨텍스트 요약 (50자 내외)
  errorType?: string; // 오류 유형 (있는 경우)
  fullQuery?: string; // 원본 질문 전문 (AI 분석 시 필요한 경우)
  fullResponse?: string; // 원본 응답 전문 (AI 분석 시 필요한 경우)
  priorityScore?: number; // 개선 우선순위 점수 (자동 계산)
  groupId?: string; // 유사 질의 그룹 ID
}

/**
 * 실패 로그 우선순위 계산 결과
 */
export interface FailurePriority {
  logId: string;
  priorityScore: number;
  reasons: string[];
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  estimatedImpact: number;
  failureCount: number;
  lastFailure: string;
}

/**
 * 유사 질의 그룹
 */
export interface QueryGroup {
  id: string;
  intent: string;
  representativeQuery: string;
  queries: QueryLogForAI[];
  commonPatterns: string[];
  failureRate: number;
  totalCount: number;
  avgConfidence: number;
  suggestedImprovement?: string;
}

/**
 * 개선 제안 반영 이력
 */
export interface ImprovementHistory {
  id: string;
  timestamp: string;
  adminId: string;
  sessionId: string;
  approvedSuggestions: Array<{
    type: 'pattern' | 'intent' | 'response' | 'context';
    description: string;
    beforeValue?: string;
    afterValue: string;
    estimatedImpact: number;
  }>;
  changelogEntry: string;
  version: string;
  status: 'applied' | 'pending' | 'failed';
}

/**
 * AI 분석 요청 구조
 */
export interface AIAnalysisRequest {
  analysisType:
    | 'pattern_discovery'
    | 'failure_analysis'
    | 'improvement_suggestion'
    | 'intent_classification';
  logs: QueryLogForAI[];
  timeRange: {
    start: string;
    end: string;
  };
  focusArea?:
    | 'low_confidence'
    | 'negative_feedback'
    | 'slow_response'
    | 'unclassified';
  maxTokens?: number; // 토큰 제한
  model?: 'gpt-4' | 'claude-3' | 'internal';
}

/**
 * AI 분석 응답 구조
 */
export interface AIAnalysisResponse {
  id: string;
  timestamp: string;
  analysisType: string;
  model: string;
  tokensUsed: number;
  findings: {
    patterns: Array<{
      pattern: string;
      frequency: number;
      confidence: number;
      examples: string[];
    }>;
    improvements: Array<{
      area: string;
      suggestion: string;
      priority: 'high' | 'medium' | 'low';
      estimatedImpact: number;
    }>;
    newIntents: Array<{
      intent: string;
      patterns: string[];
      confidence: number;
    }>;
  };
  summary: string;
  recommendations: string[];
  nextSteps: string[];
}

/**
 * 관리자 분석 세션
 */
export interface AdminAnalysisSession {
  id: string;
  timestamp: string;
  adminId: string;
  analysisRequest: AIAnalysisRequest;
  aiResponse?: AIAnalysisResponse;
  adminNotes: string;
  approvedSuggestions: string[];
  rejectedSuggestions: string[];
  status: 'pending' | 'ai_analyzed' | 'admin_reviewed' | 'implemented';
}
