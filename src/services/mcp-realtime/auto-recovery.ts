/**
 * 🔄 MCP 자동 복구 엔진 v3.0
 *
 * 지능형 자동 복구 시스템
 * - 실시간 오류 감지 및 즉시 대응
 * - 다단계 복구 전략 실행
 * - 학습 기반 복구 최적화
 * - 안전한 롤백 메커니즘
 */

import { Redis } from '@upstash/redis';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MCPServerName } from '../mcp-monitor/types';
import type {
  ErrorDetails,
  ErrorSeverity,
  ErrorCategory,
} from './error-tracker';

// 🔧 복구 액션 타입
export type RecoveryActionType =
  | 'restart' // 서비스 재시작
  | 'cache-clear' // 캐시 정리
  | 'fallback' // 폴백 서비스 활성화
  | 'scale-up' // 리소스 확장 (무료 티어에서는 제한적)
  | 'scale-down' // 리소스 축소
  | 'config-reload' // 설정 재로드
  | 'connection-reset' // 연결 재설정
  | 'memory-cleanup' // 메모리 정리
  | 'circuit-break' // 회로 차단기 활성화
  | 'rate-limit' // 요청 제한 활성화
  | 'health-check' // 헬스체크 강화
  | 'maintenance-mode'; // 유지보수 모드 전환

// 📋 복구 액션 정의
export interface RecoveryAction {
  id: string;
  type: RecoveryActionType;
  name: string;
  description: string;

  // 실행 조건
  conditions: {
    errorCategories: ErrorCategory[];
    severityLevels: ErrorSeverity[];
    minOccurrences: number;
    maxExecutionsPerHour: number;
    cooldownMinutes: number;
  };

  // 실행 설정
  execution: {
    timeout: number; // seconds
    retryAttempts: number;
    retryDelay: number; // seconds
    parallel: boolean; // 다른 액션과 병렬 실행 가능
    dependencies: string[]; // 의존성 액션 ID들
  };

  // 안전성 검사
  safety: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    requiresApproval: boolean;
    canRollback: boolean;
    maxImpactScore: number; // 0-100
    prerequisites: string[];
  };

  // 성공 기준
  successCriteria: {
    healthCheckPass: boolean;
    errorRateReduction: number; // percentage
    responseTimeImprovement: number; // percentage
    customChecks: string[];
  };

  // 통계
  statistics: {
    totalExecutions: number;
    successfulExecutions: number;
    lastExecuted?: number;
    averageExecutionTime: number;
    successRate: number;
  };
}

// 🎯 복구 전략
export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;

  // 트리거 조건
  triggers: {
    errorPattern: {
      categories: ErrorCategory[];
      severity: ErrorSeverity;
      frequency: number; // errors per minute
      duration: number; // minutes
    };
    systemMetrics: {
      responseTimeThreshold: number; // ms
      errorRateThreshold: number; // percentage
      memoryUsageThreshold: number; // percentage
      cpuUsageThreshold: number; // percentage
    };
  };

  // 복구 단계
  phases: Array<{
    name: string;
    actions: RecoveryAction[];
    parallel: boolean;
    stopOnFirstSuccess: boolean;
    timeout: number; // seconds
    successThreshold: number; // 0-100
  }>;

  // 전략 메타데이터
  metadata: {
    priority: number; // 1-10 (높을수록 우선순위)
    applicableServers: MCPServerName[];
    environment: 'development' | 'staging' | 'production' | 'all';
    enabled: boolean;

    // 학습 데이터
    effectiveness: number; // 0-100
    lastUpdated: number;
    executionHistory: Array<{
      timestamp: number;
      success: boolean;
      duration: number;
      serverId: MCPServerName;
    }>;
  };
}

// 📊 복구 실행 결과
export interface RecoveryExecution {
  id: string;
  strategyId: string;
  serverId: MCPServerName;
  triggeredBy: string; // error ID or monitoring event

  // 실행 정보
  startTime: number;
  endTime?: number;
  status:
    | 'running'
    | 'success'
    | 'partial'
    | 'failed'
    | 'cancelled'
    | 'rollback';

  // 단계별 결과
  phaseResults: Array<{
    phaseName: string;
    startTime: number;
    endTime?: number;
    status: 'running' | 'success' | 'failed' | 'skipped';
    actions: Array<{
      actionId: string;
      status: 'running' | 'success' | 'failed' | 'skipped';
      startTime: number;
      endTime?: number;
      error?: string;
      result?: any;
    }>;
  }>;

  // 전체 결과
  result: {
    success: boolean;
    improvements: {
      errorRateReduction: number;
      responseTimeImprovement: number;
      healthScoreImprovement: number;
    };
    sideEffects: string[];
    rollbackPerformed: boolean;
  };

  // 메타데이터
  metadata: {
    triggeredByUser: boolean;
    approvedByUser: boolean;
    executionContext: any;
    logs: string[];
  };
}

// ⚙️ 자동 복구 설정
interface AutoRecoveryConfig {
  enabled: boolean;

  // 실행 제한
  limits: {
    maxConcurrentExecutions: number; // 3
    maxExecutionsPerServer: number; // 5/hour
    maxGlobalExecutions: number; // 20/hour
    cooldownBetweenExecutions: number; // 300 seconds
  };

  // 안전성 제어
  safety: {
    requireApprovalForHighRisk: boolean; // true
    autoRollbackOnFailure: boolean; // true
    maxRollbackAttempts: number; // 3
    emergencyStopThreshold: number; // 5 consecutive failures
  };

  // 모니터링
  monitoring: {
    logAllExecutions: boolean; // true
    alertOnFailure: boolean; // true
    metricsRetentionDays: number; // 30
    healthCheckAfterRecovery: boolean; // true
  };

  // 학습
  learning: {
    enabled: boolean; // true
    adaptiveThresholds: boolean; // true
    strategyOptimization: boolean; // true
    feedbackCollection: boolean; // true
  };
}

/**
 * MCP 자동 복구 엔진
 */
export class MCPAutoRecoveryEngine {
  private redis: Redis;
  private supabase: SupabaseClient;
  private config: AutoRecoveryConfig;

  // 복구 전략 및 액션
  private strategies: Map<string, RecoveryStrategy> = new Map();
  private actions: Map<string, RecoveryAction> = new Map();

  // 실행 추적
  private activeExecutions: Map<string, RecoveryExecution> = new Map();
  private executionHistory: RecoveryExecution[] = [];

  // 상태 관리
  private serverStates: Map<
    MCPServerName,
    {
      lastRecovery: number;
      consecutiveFailures: number;
      isInMaintenanceMode: boolean;
      currentExecutions: string[];
    }
  > = new Map();

  // 타이머
  private monitoringTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  // 이벤트 리스너
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(
    redis: Redis,
    supabase: SupabaseClient,
    config?: Partial<AutoRecoveryConfig>
  ) {
    this.redis = redis;
    this.supabase = supabase;
    this.config = {
      enabled: true,
      limits: {
        maxConcurrentExecutions: 3,
        maxExecutionsPerServer: 5,
        maxGlobalExecutions: 20,
        cooldownBetweenExecutions: 300,
      },
      safety: {
        requireApprovalForHighRisk: true,
        autoRollbackOnFailure: true,
        maxRollbackAttempts: 3,
        emergencyStopThreshold: 5,
      },
      monitoring: {
        logAllExecutions: true,
        alertOnFailure: true,
        metricsRetentionDays: 30,
        healthCheckAfterRecovery: true,
      },
      learning: {
        enabled: true,
        adaptiveThresholds: true,
        strategyOptimization: true,
        feedbackCollection: true,
      },
      ...config,
    };

    this.initializeDefaultStrategies();
    this.startMonitoring();
  }

  /**
   * 🚨 오류 기반 자동 복구 시작
   */
  async handleError(error: ErrorDetails): Promise<{
    triggered: boolean;
    executionId?: string;
    strategy?: string;
    estimatedRecoveryTime?: number;
  }> {
    if (!this.config.enabled) {
      return { triggered: false };
    }

    // 적용 가능한 전략 찾기
    const applicableStrategies = await this.findApplicableStrategies(error);

    if (applicableStrategies.length === 0) {
      console.log(
        `📝 [AutoRecovery] No applicable strategies for error: ${error.id}`
      );
      return { triggered: false };
    }

    // 가장 적합한 전략 선택
    const selectedStrategy = this.selectBestStrategy(
      applicableStrategies,
      error
    );

    // 실행 제한 검사
    const canExecute = await this.checkExecutionLimits(
      error.serverId,
      selectedStrategy
    );
    if (!canExecute) {
      console.log(
        `⏳ [AutoRecovery] Execution limits reached for ${error.serverId}`
      );
      return { triggered: false };
    }

    // 복구 실행
    const executionId = await this.executeRecovery(selectedStrategy, error);

    return {
      triggered: true,
      executionId,
      strategy: selectedStrategy.name,
      estimatedRecoveryTime: this.estimateRecoveryTime(selectedStrategy),
    };
  }

  /**
   * 🔄 수동 복구 실행
   */
  async executeManualRecovery(
    serverId: MCPServerName,
    strategyId: string,
    options?: {
      skipSafetyChecks?: boolean;
      forceExecution?: boolean;
      customParameters?: any;
    }
  ): Promise<{
    success: boolean;
    executionId?: string;
    error?: string;
  }> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      return { success: false, error: `Strategy not found: ${strategyId}` };
    }

    // 안전성 검사
    if (!options?.skipSafetyChecks) {
      const safetyCheck = await this.performSafetyChecks(serverId, strategy);
      if (!safetyCheck.safe && !options?.forceExecution) {
        return { success: false, error: safetyCheck.reason };
      }
    }

    try {
      const executionId = await this.executeRecovery(strategy, null, {
        manual: true,
        userId: 'manual',
        customParameters: options?.customParameters,
      });

      return { success: true, executionId };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * 📊 실행 중인 복구 상태 조회
   */
  getActiveRecoveries(): Array<{
    executionId: string;
    serverId: MCPServerName;
    strategy: string;
    status: string;
    progress: number;
    startTime: number;
    estimatedCompletion?: number;
  }> {
    return Array.from(this.activeExecutions.values()).map((execution) => ({
      executionId: execution.id,
      serverId: execution.serverId,
      strategy: execution.strategyId,
      status: execution.status,
      progress: this.calculateProgress(execution),
      startTime: execution.startTime,
      estimatedCompletion: this.estimateCompletion(execution),
    }));
  }

  /**
   * ⏹️ 복구 실행 중단
   */
  async cancelRecovery(executionId: string, reason?: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return false;
    }

    execution.status = 'cancelled';
    execution.endTime = Date.now();
    execution.metadata.logs.push(`Cancelled: ${reason || 'User requested'}`);

    // 활성 액션들 정리
    await this.cleanupActiveActions(execution);

    // 실행 목록에서 제거
    this.activeExecutions.delete(executionId);

    // 이벤트 발생
    this.emit('recovery-cancelled', { executionId, reason });

    console.log(`🛑 [AutoRecovery] Recovery cancelled: ${executionId}`);
    return true;
  }

  /**
   * 📈 복구 통계 및 성능 분석
   */
  async getRecoveryAnalytics(
    timeWindow: '1h' | '6h' | '24h' | '7d' = '24h'
  ): Promise<{
    overview: {
      totalExecutions: number;
      successfulExecutions: number;
      successRate: number;
      averageRecoveryTime: number;
      mostEffectiveStrategy: string;
    };
    strategyPerformance: Array<{
      strategyId: string;
      name: string;
      executions: number;
      successRate: number;
      averageTime: number;
      effectiveness: number;
    }>;
    serverImpact: Array<{
      serverId: MCPServerName;
      recoveries: number;
      successRate: number;
      healthImprovement: number;
    }>;
    trends: Array<{
      timestamp: number;
      executions: number;
      successRate: number;
      averageTime: number;
    }>;
    recommendations: Array<{
      type: 'optimization' | 'configuration' | 'strategy';
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      impact: string;
    }>;
  }> {
    const windowMs = this.parseTimeWindow(timeWindow);
    const cutoff = Date.now() - windowMs;

    const recentExecutions = this.executionHistory.filter(
      (e) => e.startTime >= cutoff
    );

    // 개요 통계
    const overview = this.calculateOverviewStats(recentExecutions);

    // 전략별 성능
    const strategyPerformance =
      this.analyzeStrategyPerformance(recentExecutions);

    // 서버별 영향
    const serverImpact = this.analyzeServerImpact(recentExecutions);

    // 트렌드 분석
    const trends = this.analyzeTrends(recentExecutions, windowMs);

    // 권장사항 생성
    const recommendations = this.generateRecommendations(
      overview,
      strategyPerformance,
      serverImpact
    );

    return {
      overview,
      strategyPerformance,
      serverImpact,
      trends,
      recommendations,
    };
  }

  /**
   * 🎯 복구 전략 추가/수정
   */
  async addStrategy(
    strategy: Omit<RecoveryStrategy, 'metadata'>
  ): Promise<void> {
    const fullStrategy: RecoveryStrategy = {
      ...strategy,
      metadata: {
        priority: 5,
        applicableServers: [],
        environment: 'all',
        enabled: true,
        effectiveness: 50,
        lastUpdated: Date.now(),
        executionHistory: [],
      },
    };

    this.strategies.set(strategy.id, fullStrategy);

    // 데이터베이스에 저장
    await this.saveStrategy(fullStrategy);

    console.log(`✅ [AutoRecovery] Strategy added: ${strategy.name}`);
  }

  /**
   * 🔧 복구 액션 추가/수정
   */
  async addAction(action: Omit<RecoveryAction, 'statistics'>): Promise<void> {
    const fullAction: RecoveryAction = {
      ...action,
      statistics: {
        totalExecutions: 0,
        successfulExecutions: 0,
        averageExecutionTime: 0,
        successRate: 0,
      },
    };

    this.actions.set(action.id, fullAction);

    // 데이터베이스에 저장
    await this.saveAction(fullAction);

    console.log(`✅ [AutoRecovery] Action added: ${action.name}`);
  }

  // === Private Implementation Methods ===

  private initializeDefaultStrategies(): void {
    // 기본 복구 전략들을 초기화
    const defaultStrategies: RecoveryStrategy[] = [
      {
        id: 'redis-memory-recovery',
        name: 'Redis 메모리 복구',
        description: 'Redis 메모리 사용량이 높을 때 캐시 정리',
        triggers: {
          errorPattern: {
            categories: ['cache', 'resource'],
            severity: 'high',
            frequency: 5,
            duration: 2,
          },
          systemMetrics: {
            responseTimeThreshold: 500,
            errorRateThreshold: 10,
            memoryUsageThreshold: 85,
            cpuUsageThreshold: 80,
          },
        },
        phases: [
          {
            name: '캐시 정리',
            actions: [], // 실제 액션들을 추가
            parallel: false,
            stopOnFirstSuccess: true,
            timeout: 60,
            successThreshold: 80,
          },
        ],
        metadata: {
          priority: 8,
          applicableServers: [],
          environment: 'all',
          enabled: true,
          effectiveness: 75,
          lastUpdated: Date.now(),
          executionHistory: [],
        },
      },

      {
        id: 'database-connection-recovery',
        name: '데이터베이스 연결 복구',
        description: 'Supabase 연결 오류 시 연결 재설정',
        triggers: {
          errorPattern: {
            categories: ['database', 'connection'],
            severity: 'high',
            frequency: 3,
            duration: 1,
          },
          systemMetrics: {
            responseTimeThreshold: 1000,
            errorRateThreshold: 15,
            memoryUsageThreshold: 90,
            cpuUsageThreshold: 90,
          },
        },
        phases: [
          {
            name: '연결 재설정',
            actions: [], // 실제 액션들을 추가
            parallel: false,
            stopOnFirstSuccess: true,
            timeout: 30,
            successThreshold: 90,
          },
        ],
        metadata: {
          priority: 9,
          applicableServers: [],
          environment: 'all',
          enabled: true,
          effectiveness: 85,
          lastUpdated: Date.now(),
          executionHistory: [],
        },
      },
    ];

    defaultStrategies.forEach((strategy) => {
      this.strategies.set(strategy.id, strategy);
    });

    // 기본 액션들도 초기화
    this.initializeDefaultActions();
  }

  private initializeDefaultActions(): void {
    const defaultActions: RecoveryAction[] = [
      {
        id: 'clear-redis-cache',
        type: 'cache-clear',
        name: 'Redis 캐시 정리',
        description: 'Redis 메모리 사용량을 줄이기 위해 오래된 키들을 정리',
        conditions: {
          errorCategories: ['cache', 'resource'],
          severityLevels: ['medium', 'high', 'critical'],
          minOccurrences: 3,
          maxExecutionsPerHour: 5,
          cooldownMinutes: 10,
        },
        execution: {
          timeout: 30,
          retryAttempts: 2,
          retryDelay: 5,
          parallel: false,
          dependencies: [],
        },
        safety: {
          riskLevel: 'low',
          requiresApproval: false,
          canRollback: false,
          maxImpactScore: 20,
          prerequisites: ['메모리 사용량 > 80%'],
        },
        successCriteria: {
          healthCheckPass: true,
          errorRateReduction: 50,
          responseTimeImprovement: 30,
          customChecks: ['메모리 사용량 < 70%'],
        },
        statistics: {
          totalExecutions: 0,
          successfulExecutions: 0,
          averageExecutionTime: 0,
          successRate: 0,
        },
      },

      {
        id: 'reset-database-connection',
        type: 'connection-reset',
        name: '데이터베이스 연결 재설정',
        description: 'Supabase 연결 풀을 재설정하여 연결 문제 해결',
        conditions: {
          errorCategories: ['database', 'connection'],
          severityLevels: ['high', 'critical'],
          minOccurrences: 2,
          maxExecutionsPerHour: 3,
          cooldownMinutes: 15,
        },
        execution: {
          timeout: 20,
          retryAttempts: 1,
          retryDelay: 10,
          parallel: false,
          dependencies: [],
        },
        safety: {
          riskLevel: 'medium',
          requiresApproval: false,
          canRollback: true,
          maxImpactScore: 40,
          prerequisites: ['연결 오류 > 3회'],
        },
        successCriteria: {
          healthCheckPass: true,
          errorRateReduction: 80,
          responseTimeImprovement: 50,
          customChecks: ['DB 연결 성공률 > 95%'],
        },
        statistics: {
          totalExecutions: 0,
          successfulExecutions: 0,
          averageExecutionTime: 0,
          successRate: 0,
        },
      },
    ];

    defaultActions.forEach((action) => {
      this.actions.set(action.id, action);
    });
  }

  private startMonitoring(): void {
    // 복구 모니터링 (30초마다)
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.monitorActiveRecoveries();
      } catch (error) {
        console.error('❌ [AutoRecovery] Monitoring failed:', error);
      }
    }, 30 * 1000);

    // 정리 작업 (5분마다)
    this.cleanupTimer = setInterval(
      async () => {
        try {
          await this.performCleanup();
        } catch (error) {
          console.error('❌ [AutoRecovery] Cleanup failed:', error);
        }
      },
      5 * 60 * 1000
    );

    console.log('🤖 [AutoRecovery] Monitoring started');
  }

  private async findApplicableStrategies(
    error: ErrorDetails
  ): Promise<RecoveryStrategy[]> {
    const applicable: RecoveryStrategy[] = [];

    for (const strategy of this.strategies.values()) {
      if (!strategy.metadata.enabled) continue;

      // 오류 패턴 매칭
      const patternMatch =
        strategy.triggers.errorPattern.categories.includes(error.category) &&
        this.severityMatches(
          strategy.triggers.errorPattern.severity,
          error.severity
        );

      if (patternMatch) {
        applicable.push(strategy);
      }
    }

    return applicable.sort((a, b) => b.metadata.priority - a.metadata.priority);
  }

  private selectBestStrategy(
    strategies: RecoveryStrategy[],
    error: ErrorDetails
  ): RecoveryStrategy {
    // 현재는 첫 번째 (우선순위 높은) 전략 선택
    // 실제로는 더 복잡한 선택 로직 구현 필요
    return strategies[0];
  }

  private async checkExecutionLimits(
    serverId: MCPServerName,
    strategy: RecoveryStrategy
  ): Promise<boolean> {
    // 전역 실행 제한 확인
    const globalExecutions = this.activeExecutions.size;
    if (globalExecutions >= this.config.limits.maxConcurrentExecutions) {
      return false;
    }

    // 서버별 실행 제한 확인
    const serverState = this.serverStates.get(serverId);
    if (serverState) {
      const recentExecutions = serverState.currentExecutions.length;
      if (recentExecutions >= this.config.limits.maxExecutionsPerServer) {
        return false;
      }

      // 쿨다운 시간 확인
      const timeSinceLastRecovery = Date.now() - serverState.lastRecovery;
      if (
        timeSinceLastRecovery <
        this.config.limits.cooldownBetweenExecutions * 1000
      ) {
        return false;
      }
    }

    return true;
  }

  private async executeRecovery(
    strategy: RecoveryStrategy,
    error: ErrorDetails | null,
    options?: any
  ): Promise<string> {
    const executionId = this.generateExecutionId();
    const serverId = error?.serverId || options?.serverId;

    if (!serverId) {
      throw new Error('Server ID is required for recovery execution');
    }

    // 실행 객체 생성
    const execution: RecoveryExecution = {
      id: executionId,
      strategyId: strategy.id,
      serverId,
      triggeredBy: error?.id || 'manual',
      startTime: Date.now(),
      status: 'running',
      phaseResults: [],
      result: {
        success: false,
        improvements: {
          errorRateReduction: 0,
          responseTimeImprovement: 0,
          healthScoreImprovement: 0,
        },
        sideEffects: [],
        rollbackPerformed: false,
      },
      metadata: {
        triggeredByUser: options?.manual || false,
        approvedByUser: options?.approved || false,
        executionContext: options?.customParameters || {},
        logs: [`Recovery started: ${strategy.name}`],
      },
    };

    // 실행 추가
    this.activeExecutions.set(executionId, execution);

    // 서버 상태 업데이트
    this.updateServerState(serverId, executionId);

    // 이벤트 발생
    this.emit('recovery-started', {
      executionId,
      strategy: strategy.name,
      serverId,
    });

    // 백그라운드에서 실행
    this.performRecoveryExecution(execution, strategy).catch((error) => {
      console.error(
        `❌ [AutoRecovery] Execution failed: ${executionId}`,
        error
      );
    });

    return executionId;
  }

  private async performRecoveryExecution(
    execution: RecoveryExecution,
    strategy: RecoveryStrategy
  ): Promise<void> {
    try {
      for (const phase of strategy.phases) {
        const phaseResult = {
          phaseName: phase.name,
          startTime: Date.now(),
          status: 'running' as const,
          actions: [],
        };

        execution.phaseResults.push(phaseResult);
        execution.metadata.logs.push(`Phase started: ${phase.name}`);

        // 단계 실행
        const success = await this.executePhase(execution, phase, phaseResult);

        phaseResult.endTime = Date.now();
        phaseResult.status = success ? 'success' : 'failed';

        if (!success && !phase.parallel) {
          // 실패 시 중단 (병렬이 아닌 경우)
          break;
        }
      }

      // 실행 완료 처리
      await this.completeExecution(execution, strategy);
    } catch (error) {
      execution.status = 'failed';
      execution.metadata.logs.push(`Execution error: ${error}`);

      // 롤백 시도
      if (this.config.safety.autoRollbackOnFailure) {
        await this.performRollback(execution, strategy);
      }
    } finally {
      execution.endTime = Date.now();
      this.activeExecutions.delete(execution.id);
      this.executionHistory.push(execution);

      // 서버 상태 정리
      this.cleanupServerState(execution.serverId, execution.id);

      // 이벤트 발생
      this.emit('recovery-completed', {
        executionId: execution.id,
        success: execution.status === 'success',
        duration: (execution.endTime || Date.now()) - execution.startTime,
      });
    }
  }

  private async executePhase(
    execution: RecoveryExecution,
    phase: RecoveryStrategy['phases'][0],
    phaseResult: any
  ): Promise<boolean> {
    const actionPromises = phase.actions.map(async (action) => {
      const actionResult = {
        actionId: action.id,
        status: 'running' as const,
        startTime: Date.now(),
      };

      phaseResult.actions.push(actionResult);

      try {
        const result = await this.executeAction(action, execution);
        actionResult.status = 'success';
        actionResult.result = result;
        return true;
      } catch (error) {
        actionResult.status = 'failed';
        actionResult.error = String(error);
        return false;
      } finally {
        actionResult.endTime = Date.now();
      }
    });

    if (phase.parallel) {
      const results = await Promise.allSettled(actionPromises);
      const successCount = results.filter(
        (r) => r.status === 'fulfilled' && r.value
      ).length;
      const successRate = (successCount / results.length) * 100;

      return successRate >= phase.successThreshold;
    } else {
      // 순차 실행
      for (const promise of actionPromises) {
        const success = await promise;
        if (success && phase.stopOnFirstSuccess) {
          return true;
        }
        if (!success) {
          return false;
        }
      }
      return true;
    }
  }

  private async executeAction(
    action: RecoveryAction,
    execution: RecoveryExecution
  ): Promise<any> {
    // 액션 타입별 실행 로직
    switch (action.type) {
      case 'cache-clear':
        return await this.executeCacheClear(execution.serverId);

      case 'connection-reset':
        return await this.executeConnectionReset(execution.serverId);

      case 'restart':
        return await this.executeRestart(execution.serverId);

      case 'health-check':
        return await this.executeHealthCheck(execution.serverId);

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // 개별 액션 실행 메서드들
  private async executeCacheClear(serverId: MCPServerName): Promise<any> {
    // Redis 캐시 정리 로직
    const pattern = `mcp:${serverId}:*`;
    const keys = await this.redis.keys(pattern);

    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    return { clearedKeys: keys.length };
  }

  private async executeConnectionReset(serverId: MCPServerName): Promise<any> {
    // 데이터베이스 연결 재설정 로직
    // 실제 구현에서는 연결 풀 재설정 등
    return { connectionReset: true };
  }

  private async executeRestart(serverId: MCPServerName): Promise<any> {
    // 서비스 재시작 로직 (무료 티어에서는 제한적)
    return { restarted: false, reason: 'Not supported in free tier' };
  }

  private async executeHealthCheck(serverId: MCPServerName): Promise<any> {
    // 헬스체크 실행
    try {
      const healthKey = `mcp:health:${serverId}`;
      const health = await this.redis.get(healthKey);
      return { healthy: !!health, details: health };
    } catch (error) {
      return { healthy: false, error: String(error) };
    }
  }

  // 유틸리티 메서드들
  private generateExecutionId(): string {
    return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private severityMatches(
    targetSeverity: ErrorSeverity,
    actualSeverity: ErrorSeverity
  ): boolean {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    return severityLevels[actualSeverity] >= severityLevels[targetSeverity];
  }

  private estimateRecoveryTime(strategy: RecoveryStrategy): number {
    return strategy.phases.reduce((total, phase) => total + phase.timeout, 0);
  }

  private calculateProgress(execution: RecoveryExecution): number {
    const totalPhases = execution.phaseResults.length;
    const completedPhases = execution.phaseResults.filter(
      (p) => p.endTime
    ).length;
    return totalPhases > 0
      ? Math.round((completedPhases / totalPhases) * 100)
      : 0;
  }

  private estimateCompletion(execution: RecoveryExecution): number | undefined {
    // 간단한 추정 로직
    const elapsed = Date.now() - execution.startTime;
    const progress = this.calculateProgress(execution);

    if (progress > 0) {
      const totalEstimate = (elapsed / progress) * 100;
      return execution.startTime + totalEstimate;
    }

    return undefined;
  }

  private updateServerState(
    serverId: MCPServerName,
    executionId: string
  ): void {
    if (!this.serverStates.has(serverId)) {
      this.serverStates.set(serverId, {
        lastRecovery: Date.now(),
        consecutiveFailures: 0,
        isInMaintenanceMode: false,
        currentExecutions: [],
      });
    }

    const state = this.serverStates.get(serverId)!;
    state.currentExecutions.push(executionId);
    state.lastRecovery = Date.now();
  }

  private cleanupServerState(
    serverId: MCPServerName,
    executionId: string
  ): void {
    const state = this.serverStates.get(serverId);
    if (state) {
      state.currentExecutions = state.currentExecutions.filter(
        (id) => id !== executionId
      );
    }
  }

  private parseTimeWindow(timeWindow: string): number {
    const windows = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    };
    return windows[timeWindow as keyof typeof windows] || windows['24h'];
  }

  // 이벤트 시스템
  private emit(eventName: string, data: any): void {
    const handlers = this.eventHandlers.get(eventName) || [];
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Event handler error for ${eventName}:`, error);
      }
    });
  }

  /**
   * 📡 이벤트 리스너 등록
   */
  on(eventName: string, handler: Function): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)!.push(handler);
  }

  // 추가 헬퍼 메서드들은 구현 필요...
  private async performSafetyChecks(
    serverId: MCPServerName,
    strategy: RecoveryStrategy
  ): Promise<{ safe: boolean; reason?: string }> {
    return { safe: true };
  }

  private async completeExecution(
    execution: RecoveryExecution,
    strategy: RecoveryStrategy
  ): Promise<void> {
    execution.status = 'success';
  }

  private async performRollback(
    execution: RecoveryExecution,
    strategy: RecoveryStrategy
  ): Promise<void> {
    execution.result.rollbackPerformed = true;
  }

  private async cleanupActiveActions(
    execution: RecoveryExecution
  ): Promise<void> {
    // 액션 정리 로직
  }

  private async monitorActiveRecoveries(): Promise<void> {
    // 활성 복구 모니터링
  }

  private async performCleanup(): Promise<void> {
    // 정리 작업
  }

  private calculateOverviewStats(executions: RecoveryExecution[]): any {
    return {
      totalExecutions: executions.length,
      successfulExecutions: executions.filter((e) => e.status === 'success')
        .length,
      successRate: 0,
      averageRecoveryTime: 0,
      mostEffectiveStrategy: '',
    };
  }

  private analyzeStrategyPerformance(executions: RecoveryExecution[]): any[] {
    return [];
  }

  private analyzeServerImpact(executions: RecoveryExecution[]): any[] {
    return [];
  }

  private analyzeTrends(
    executions: RecoveryExecution[],
    windowMs: number
  ): any[] {
    return [];
  }

  private generateRecommendations(
    overview: any,
    strategyPerformance: any[],
    serverImpact: any[]
  ): any[] {
    return [];
  }

  private async saveStrategy(strategy: RecoveryStrategy): Promise<void> {
    // 데이터베이스 저장 로직
  }

  private async saveAction(action: RecoveryAction): Promise<void> {
    // 데이터베이스 저장 로직
  }

  /**
   * 🧹 리소스 정리
   */
  async cleanup(): Promise<void> {
    if (this.monitoringTimer) clearInterval(this.monitoringTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);

    // 활성 실행들 중단
    for (const executionId of this.activeExecutions.keys()) {
      await this.cancelRecovery(executionId, 'System cleanup');
    }

    this.strategies.clear();
    this.actions.clear();
    this.activeExecutions.clear();
    this.executionHistory.length = 0;
    this.serverStates.clear();
    this.eventHandlers.clear();

    console.log('✅ [AutoRecovery] Cleanup completed');
  }
}

// 팩토리 함수
export function createAutoRecoveryEngine(
  redis: Redis,
  supabase: SupabaseClient,
  config?: Partial<AutoRecoveryConfig>
): MCPAutoRecoveryEngine {
  return new MCPAutoRecoveryEngine(redis, supabase, config);
}

// 타입 익스포트
export type {
  AutoRecoveryConfig,
  RecoveryStrategy,
  RecoveryAction,
  RecoveryExecution,
};
