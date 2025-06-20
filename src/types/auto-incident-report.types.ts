/**
 * 📊 자동 장애 보고서 시스템 타입 정의
 * 
 * Phase 3: 자동 장애 보고서 시스템 타입 시스템
 * SOLID 원칙 적용: 인터페이스 분리 원칙 (ISP)
 */

// ===== 기본 인터페이스 =====

/**
 * 장애 정보 인터페이스
 */
export interface Incident {
    id: string;
    type: IncidentType;
    severity: SeverityLevel;
    affectedServer: string;
    affectedServers?: string[];
    startTime: number;
    endTime?: number;
    duration?: number;
    status: IncidentStatus;
    metrics: ServerMetrics;
    rootCause?: string;
    impact?: IncidentImpact;
    pattern?: string;
    predictedTime?: number;
    propagationPattern?: PropagationPattern;
    dependencies?: string[];
}

/**
 * 서버 메트릭 인터페이스
 */
export interface ServerMetrics {
    serverId: string;
    cpu: number;
    memory: number;
    disk: number;
    network?: number;
    responseTime?: number;
    errorRate?: number;
    timestamp: number;
    status?: ServerStatus;
}

/**
 * 장애 보고서 인터페이스
 */
export interface IncidentReport {
    id: string;
    title: string;
    summary: string;
    language: 'ko' | 'en';
    incident: Incident;
    rootCause: RootCauseAnalysis;
    impact: IncidentImpact;
    timeline: TimelineEvent[];
    recommendations: Solution[];
    solutions: Solution[];
    description?: string;
    generatedAt: number;
    generatedBy: string;
    processingTime: number;
}

/**
 * 해결방안 인터페이스
 */
export interface Solution {
    id: string;
    action: string;
    description: string;
    priority: number;
    estimatedTime: number; // 분 단위
    riskLevel: RiskLevel;
    category: SolutionCategory;
    commands?: string[];
    prerequisites?: string[];
    impact?: string;
    successRate?: number;
}

/**
 * 근본 원인 분석 인터페이스
 */
export interface RootCauseAnalysis {
    primaryCause: string;
    contributingFactors: string[];
    analysisMethod: string;
    confidence: number;
    evidences: Evidence[];
    recommendedActions: string[];
}

/**
 * 장애 영향도 분석 인터페이스
 */
export interface IncidentImpact {
    severity: SeverityLevel;
    affectedServices: string[];
    estimatedDowntime: number; // 분 단위
    businessImpact: BusinessImpact;
    userImpact: UserImpact;
    financialImpact?: FinancialImpact;
    reputationImpact?: ReputationImpact;
}

/**
 * 예측 분석 결과 인터페이스
 */
export interface PredictionResult {
    predictedTime: number;
    confidence: number;
    trendAnalysis: TrendAnalysis;
    riskFactors: RiskFactor[];
    preventiveActions: string[];
    alertThreshold: number;
}

/**
 * 트렌드 분석 인터페이스
 */
export interface TrendAnalysis {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    rate: number; // 변화율 (% per hour)
    pattern: TrendPattern;
    seasonality?: SeasonalityInfo;
    anomalies: AnomalyInfo[];
}

// ===== 열거형 타입들 =====

/**
 * 장애 타입
 */
export type IncidentType =
    | 'cpu_overload'
    | 'memory_leak'
    | 'disk_full'
    | 'network_congestion'
    | 'database_connection_failure'
    | 'application_crash'
    | 'cascade_failure'
    | 'security_breach'
    | 'performance_degradation'
    | 'service_unavailable';

/**
 * 심각도 수준
 */
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * 장애 상태
 */
export type IncidentStatus = 'detected' | 'investigating' | 'resolving' | 'resolved' | 'closed';

/**
 * 서버 상태
 */
export type ServerStatus = 'healthy' | 'warning' | 'critical' | 'down';

/**
 * 위험 수준
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * 해결방안 카테고리
 */
export type SolutionCategory =
    | 'immediate_action'
    | 'short_term_fix'
    | 'long_term_solution'
    | 'preventive_measure'
    | 'monitoring_enhancement';

/**
 * 전파 패턴
 */
export type PropagationPattern = 'sequential' | 'parallel' | 'cascading' | 'isolated';

/**
 * 트렌드 패턴
 */
export type TrendPattern = 'linear' | 'exponential' | 'logarithmic' | 'cyclic' | 'random';

// ===== 보조 인터페이스들 =====

export interface TimelineEvent {
    timestamp: number;
    event: string;
    severity: SeverityLevel;
    source: string;
    details?: string;
}

export interface Evidence {
    type: 'metric' | 'log' | 'alert' | 'user_report';
    source: string;
    content: string;
    timestamp: number;
    relevance: number; // 0-1
}

export interface BusinessImpact {
    level: SeverityLevel;
    affectedProcesses: string[];
    estimatedLoss?: number;
    customerImpact: string;
}

export interface UserImpact {
    affectedUsers: number;
    impactLevel: SeverityLevel;
    userExperience: string;
    supportTickets?: number;
}

export interface FinancialImpact {
    estimatedCost: number;
    currency: string;
    breakdown: FinancialBreakdown[];
}

export interface FinancialBreakdown {
    category: string;
    amount: number;
    description: string;
}

export interface ReputationImpact {
    level: SeverityLevel;
    publicVisibility: boolean;
    mediaAttention?: boolean;
    socialMediaMentions?: number;
}

export interface RiskFactor {
    factor: string;
    weight: number;
    description: string;
    mitigation: string;
}

export interface SeasonalityInfo {
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    peakTimes: number[];
    confidence: number;
}

export interface AnomalyInfo {
    timestamp: number;
    value: number;
    expectedValue: number;
    deviation: number;
    severity: SeverityLevel;
}

// ===== 메인 시스템 인터페이스들 =====

/**
 * 자동 장애 보고서 시스템 메인 인터페이스
 */
export interface IAutoIncidentReportSystem {
    // 장애 감지
    detectIncident(metrics: ServerMetrics): Promise<Incident | null>;
    detectMemoryLeak(trend: ServerMetrics[]): Promise<Incident | null>;
    detectCascadeFailure(metrics: ServerMetrics[]): Promise<Incident | null>;

    // 보고서 생성
    generateReport(incident: Incident): Promise<IncidentReport>;
    generateKoreanReport(incident: Incident): Promise<IncidentReport>;
    generateSolutions(incident: Incident): Promise<Solution[]>;

    // 예측 분석
    predictFailureTime(historicalData: ServerMetrics[]): Promise<PredictionResult>;
    analyzeImpact(incident: Incident): Promise<IncidentImpact>;

    // 통합 처리
    processRealTimeIncident(metrics: ServerMetrics): Promise<FullIncidentReport>;
    generateCompatibleReport(context: any): Promise<IncidentReport>;
}

/**
 * 장애 감지 엔진 인터페이스
 */
export interface IIncidentDetectionEngine {
    detectAnomalies(metrics: ServerMetrics[]): Promise<Incident[]>;
    analyzePatterns(data: ServerMetrics[]): Promise<PatternAnalysis>;
    classifyIncident(metrics: ServerMetrics): Promise<IncidentClassification>;
    calculateSeverity(incident: Incident): Promise<SeverityLevel>;
}

/**
 * 해결방안 데이터베이스 인터페이스
 */
export interface ISolutionDatabase {
    getSolutions(incidentType: IncidentType): Promise<Solution[]>;
    addSolution(solution: Omit<Solution, 'id'>): Promise<string>;
    updateSolution(id: string, solution: Partial<Solution>): Promise<boolean>;
    searchSolutions(query: string): Promise<Solution[]>;
    getStatistics(): Promise<SolutionStatistics>;
}

// ===== 추가 타입들 =====

export interface FullIncidentReport {
    detection: Incident;
    report: IncidentReport;
    solutions: Solution[];
    prediction: PredictionResult;
    processingTime: number;
}

export interface PatternAnalysis {
    patterns: DetectedPattern[];
    confidence: number;
    recommendations: string[];
}

export interface DetectedPattern {
    type: string;
    description: string;
    frequency: number;
    lastOccurrence: number;
}

export interface IncidentClassification {
    type: IncidentType;
    confidence: number;
    alternativeTypes: Array<{
        type: IncidentType;
        confidence: number;
    }>;
}

export interface SolutionStatistics {
    totalSolutions: number;
    successRate: number;
    averageResolutionTime: number;
    mostUsedSolutions: Solution[];
    categoryDistribution: Record<SolutionCategory, number>;
}

// ===== 설정 및 옵션 타입들 =====

export interface IncidentDetectionConfig {
    thresholds: {
        cpu: number;
        memory: number;
        disk: number;
        network: number;
        responseTime: number;
        errorRate: number;
    };
    sensitivity: 'low' | 'medium' | 'high';
    enablePrediction: boolean;
    historicalDataWindow: number; // 시간 (시간 단위)
}

export interface ReportGenerationOptions {
    language: 'ko' | 'en';
    includeTimeline: boolean;
    includeSolutions: boolean;
    includeImpactAnalysis: boolean;
    detailLevel: 'summary' | 'detailed' | 'comprehensive';
}

// ===== 에러 타입들 =====

export class IncidentReportError extends Error {
    constructor(
        message: string,
        public code: string,
        public incidentId?: string,
        public details?: any
    ) {
        super(message);
        this.name = 'IncidentReportError';
    }
}

export interface IncidentReportErrorInfo {
    error: IncidentReportError;
    timestamp: number;
    context?: any;
}

/**
 * 📝 타입 설계 완료
 * 
 * ✅ Interface Segregation Principle 준수
 * ✅ 확장 가능한 구조
 * ✅ 에러 처리 및 설정 관리 포함
 * ✅ 기존 AutoReportService와 호환 가능
 */ 