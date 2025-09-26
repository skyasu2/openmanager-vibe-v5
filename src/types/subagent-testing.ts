/**
 * 🤖 test-automation-specialist 서브에이전트 전용 타입 정의
 *
 * @description 서브에이전트가 테스트 시스템을 활용할 때 필요한 모든 타입들
 * @integration 기존 테스트 시스템과 AI 워크플로우 시스템의 통합 타입
 */

// 기존 AI 친화적 Vitals 타입 재사용
import type {
  AIFriendlyMetric,
  VitalsAnalysisResult,
  MetricCollector,
  MetricAnalyzer,
  RegressionAlert,
  ActionRecommendation
} from '../lib/testing/ai-friendly-vitals';

// Re-export imported types for use in other modules
export type {
  AIFriendlyMetric,
  VitalsAnalysisResult,
  MetricCollector,
  MetricAnalyzer,
  RegressionAlert,
  ActionRecommendation
};

// 서브에이전트 전용 확장 타입들
export interface SubagentTestContext {
  priority: 'fast' | 'thorough' | 'comprehensive';
  focus?: 'e2e' | 'api' | 'unit' | 'integration' | 'playwright' | 'vitals';
  timeout?: number;
  tags?: string[];
  environment?: 'development' | 'staging' | 'production';
  branch?: string;
}

export interface SubagentTestExecution {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  command: string;
  exitCode?: number;
  pid?: number;
}

export interface SubagentTestMetrics {
  // 실행 메트릭
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;

  // 테스트 결과 메트릭
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  flakyTests: number;

  // 커버리지 메트릭
  lineCoverage?: number;
  branchCoverage?: number;
  functionCoverage?: number;
  statementCoverage?: number;

  // 품질 메트릭
  codeComplexity?: number;
  technicalDebt?: number;
  maintainabilityIndex?: number;
}

export interface SubagentTestInsights {
  // 성능 통찰
  performanceBottlenecks: {
    file: string;
    function: string;
    duration: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];

  // 안정성 통찰
  stabilityIssues: {
    testName: string;
    failureRate: number;
    lastFailure: string;
    category: 'flaky' | 'environment' | 'timing' | 'dependency';
  }[];

  // 커버리지 갭
  coverageGaps: {
    file: string;
    uncoveredLines: number[];
    criticality: 'low' | 'medium' | 'high';
    suggestedTests: string[];
  }[];

  // 개선 기회
  improvementOpportunities: {
    area: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    description: string;
    actionItems: string[];
  }[];
}

export interface SubagentTestReport {
  // 기본 정보
  id: string;
  timestamp: string;
  version: string;
  environment: string;

  // 실행 정보
  execution: SubagentTestExecution;
  context: SubagentTestContext;

  // 메트릭
  metrics: SubagentTestMetrics;
  vitals: AIFriendlyMetric[];
  analysis: VitalsAnalysisResult;

  // 인사이트
  insights: SubagentTestInsights;

  // 권장사항 (기존 시스템과 통합)
  recommendations: ActionRecommendation[];
  regressions: RegressionAlert[];

  // 다음 액션
  nextActions: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };

  // 서브에이전트 전용 메타데이터
  subagentMetadata: {
    version: string;
    capabilities: string[];
    limitations: string[];
    configUsed: Record<string, any>;
  };
}

export interface SubagentTestConfiguration {
  // 기본 설정
  defaultPriority: 'fast' | 'thorough' | 'comprehensive';
  timeoutSettings: {
    fast: number;
    thorough: number;
    comprehensive: number;
  };

  // 프로필 설정
  profiles: {
    [key: string]: {
      command: string;
      expectedDuration: number;
      coverage: string;
      description: string;
      requiredTools: string[];
    };
  };

  // 임계값 설정
  thresholds: {
    performance: {
      executionTime: number;
      memoryUsage: number;
    };
    quality: {
      minimumCoverage: number;
      maximumFailureRate: number;
      minimumOverallScore: number;
    };
    stability: {
      maximumFlakyRate: number;
      minimumSuccessRate: number;
    };
  };

  // 알림 설정
  notifications: {
    criticalFailures: boolean;
    performanceRegressions: boolean;
    coverageDrops: boolean;
    recommendations: boolean;
  };

  // 서브에이전트 특화 설정
  subagentSettings: {
    autoAnalysis: boolean;
    autoRecommendations: boolean;
    autoActions: boolean;
    verboseLogging: boolean;
    memoryManagement: boolean;
  };
}

// 서브에이전트 테스트 이벤트 타입
export type SubagentTestEvent =
  | { type: 'test:started'; payload: SubagentTestExecution }
  | { type: 'test:progress'; payload: { id: string; progress: number; message: string } }
  | { type: 'test:completed'; payload: SubagentTestReport }
  | { type: 'test:failed'; payload: { id: string; error: Error; context: SubagentTestContext } }
  | { type: 'analysis:generated'; payload: { id: string; insights: SubagentTestInsights } }
  | { type: 'recommendations:updated'; payload: { id: string; recommendations: ActionRecommendation[] } };

// 서브에이전트 상태 타입
export interface SubagentTestState {
  // 현재 실행 상태
  currentExecution?: SubagentTestExecution;

  // 최근 보고서들
  recentReports: SubagentTestReport[];

  // 성능 트렌드
  performanceTrend: {
    timestamps: string[];
    executionTimes: number[];
    successRates: number[];
    overallScores: number[];
  };

  // 활성 권장사항
  activeRecommendations: ActionRecommendation[];

  // 설정
  configuration: SubagentTestConfiguration;

  // 메타데이터
  metadata: {
    totalTestsRun: number;
    totalTimeSpent: number;
    averageSuccessRate: number;
    lastUpdated: string;
  };
}

// 유틸리티 타입들
export type SubagentTestPriority = SubagentTestContext['priority'];
export type SubagentTestFocus = SubagentTestContext['focus'];
export type SubagentTestStatus = SubagentTestExecution['status'];

// 서브에이전트 테스트 실행자 인터페이스
export interface ISubagentTestRunner {
  // 메인 메서드
  runTest(context: SubagentTestContext): Promise<SubagentTestReport>;

  // 분석 메서드
  analyzeResults(execution: SubagentTestExecution): Promise<SubagentTestInsights>;
  generateRecommendations(insights: SubagentTestInsights): ActionRecommendation[];

  // 유틸리티 메서드
  getHistory(limit?: number): SubagentTestReport[];
  analyzeTrend(): SubagentTestState['performanceTrend'];
  updateConfiguration(config: Partial<SubagentTestConfiguration>): void;

  // 이벤트 처리
  on(event: string, handler: (payload: any) => void): void;
  emit(event: SubagentTestEvent): void;
}

// 서브에이전트 테스트 컨텍스트 빌더
export class SubagentTestContextBuilder {
  private context: Partial<SubagentTestContext> = {};

  priority(priority: SubagentTestPriority): this {
    this.context.priority = priority;
    return this;
  }

  focus(focus: SubagentTestFocus): this {
    this.context.focus = focus;
    return this;
  }

  timeout(timeout: number): this {
    this.context.timeout = timeout;
    return this;
  }

  tags(tags: string[]): this {
    this.context.tags = tags;
    return this;
  }

  environment(env: 'development' | 'staging' | 'production'): this {
    this.context.environment = env;
    return this;
  }

  branch(branch: string): this {
    this.context.branch = branch;
    return this;
  }

  build(): SubagentTestContext {
    if (!this.context.priority) {
      this.context.priority = 'fast';
    }
    return this.context as SubagentTestContext;
  }
}

// 헬퍼 함수들
export const SubagentTestHelpers = {
  // 컨텍스트 빌더 팩토리
  createContext: () => new SubagentTestContextBuilder(),

  // 우선순위별 예상 시간 계산
  estimatedDuration: (priority: SubagentTestPriority, focus?: SubagentTestFocus): number => {
    const baseTimes = { fast: 3000, thorough: 45000, comprehensive: 120000 };
    const focusMultipliers = {
      e2e: 3, api: 1.5, unit: 0.5, integration: 2, playwright: 2.5, vitals: 1.8
    };

    const baseTime = baseTimes[priority];
    const multiplier = focus ? (focusMultipliers[focus] || 1) : 1;

    return Math.round(baseTime * multiplier);
  },

  // 권장사항 우선순위 정렬
  sortRecommendations: (recommendations: ActionRecommendation[]): ActionRecommendation[] => {
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...recommendations].sort((a, b) =>
      (priorityOrder[a.priority] ?? 999) - (priorityOrder[b.priority] ?? 999) ||
      b.estimatedImpact - a.estimatedImpact
    );
  },

  // 성능 트렌드 분석
  analyzeTrend: (reports: SubagentTestReport[]): 'improving' | 'stable' | 'declining' => {
    if (reports.length < 4) return 'stable';

    const recent = reports.slice(0, 2);
    const previous = reports.slice(2, 4);

    const recentAvg = recent.reduce((sum, r) => sum + r.analysis.overallScore, 0) / recent.length;
    const previousAvg = previous.reduce((sum, r) => sum + r.analysis.overallScore, 0) / previous.length;

    if (recentAvg > previousAvg + 5) return 'improving';
    if (recentAvg < previousAvg - 5) return 'declining';
    return 'stable';
  },

  // 메트릭 집계
  aggregateMetrics: (reports: SubagentTestReport[]): {
    averageExecutionTime: number;
    averageSuccessRate: number;
    averageOverallScore: number;
    totalTests: number;
  } => {
    if (reports.length === 0) {
      return { averageExecutionTime: 0, averageSuccessRate: 0, averageOverallScore: 0, totalTests: 0 };
    }

    const totalExecutionTime = reports.reduce((sum, r) => sum + (r.execution.duration || 0), 0);
    const totalTests = reports.reduce((sum, r) => sum + r.metrics.totalTests, 0);
    const totalPassed = reports.reduce((sum, r) => sum + r.metrics.passedTests, 0);
    const totalScore = reports.reduce((sum, r) => sum + r.analysis.overallScore, 0);

    return {
      averageExecutionTime: Math.round(totalExecutionTime / reports.length),
      averageSuccessRate: Math.round((totalPassed / totalTests) * 100),
      averageOverallScore: Math.round(totalScore / reports.length),
      totalTests
    };
  }
};

// 기본 설정 상수
export const SUBAGENT_TEST_DEFAULTS: SubagentTestConfiguration = {
  defaultPriority: 'fast',
  timeoutSettings: {
    fast: 30000,      // 30초
    thorough: 120000, // 2분
    comprehensive: 300000 // 5분
  },
  profiles: {
    'ultra-fast': {
      command: 'npx vitest run --config config/testing/vitest.config.minimal.ts',
      expectedDuration: 3000,
      coverage: '핵심 로직만',
      description: '서브에이전트 빠른 검증용',
      requiredTools: ['vitest']
    },
    'smart-fast': {
      command: 'npx vitest run --config config/testing/vitest.config.main.ts --reporter=dot',
      expectedDuration: 8000,
      coverage: '주요 컴포넌트',
      description: '서브에이전트 개발 중 검증용',
      requiredTools: ['vitest']
    },
    'e2e-critical': {
      command: 'npm run test:vercel',
      expectedDuration: 45000,
      coverage: '실제 환경',
      description: '서브에이전트 최종 검증용',
      requiredTools: ['playwright', 'vercel']
    }
  },
  thresholds: {
    performance: {
      executionTime: 60000, // 1분
      memoryUsage: 512 // MB
    },
    quality: {
      minimumCoverage: 80,
      maximumFailureRate: 5,
      minimumOverallScore: 75
    },
    stability: {
      maximumFlakyRate: 10,
      minimumSuccessRate: 95
    }
  },
  notifications: {
    criticalFailures: true,
    performanceRegressions: true,
    coverageDrops: true,
    recommendations: true
  },
  subagentSettings: {
    autoAnalysis: true,
    autoRecommendations: true,
    autoActions: false, // 기본적으로 수동 승인
    verboseLogging: false,
    memoryManagement: true
  }
};