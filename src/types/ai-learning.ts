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