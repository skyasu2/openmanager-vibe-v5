import { EventEmitter } from 'events';
import { simulationEngine } from '../../services/simulationEngine';
import { vercelStatusService } from '../../services/vercelStatusService';

/**
 * 🔧 시스템 전체 상태 인터페이스
 */
export interface SystemStatus {
  // 시뮬레이션 상태
  simulation: {
    isRunning: boolean;
    startTime: number | null;
    runtime: number;
    dataCount: number;
    serverCount: number;
    updateInterval: number;
  };

  // Vercel 환경 상태
  environment: {
    plan: 'hobby' | 'pro' | 'enterprise';
    region: string;
    memoryLimit: number;
    resourceUsage: {
      executions: number;
      bandwidth: number;
    };
  };

  // 성능 메트릭
  performance: {
    averageResponseTime: number;
    apiCalls: number;
    cacheHitRate: number;
    errorRate: number;
  };

  // 헬스 상태
  health: 'healthy' | 'warning' | 'critical' | 'degraded';

  // 서비스별 상태
  services: {
    simulation: 'online' | 'offline' | 'starting' | 'stopping';
    cache: 'online' | 'offline' | 'degraded';
    prometheus: 'online' | 'offline' | 'disabled';
    vercel: 'online' | 'offline' | 'unknown';
  };

  // 마지막 업데이트
  lastUpdated: string;
}

/**
 * 🎯 통합 시스템 상태 관리자
 */
export class SystemStateManager extends EventEmitter {
  private static instance: SystemStateManager;
  private currentStatus: SystemStatus | null = null;
  private updateTimer: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 5000; // 5초마다 상태 업데이트

  // 성능 메트릭 추적
  private performanceMetrics = {
    apiCalls: 0,
    errors: 0,
    lastResponseTimes: [] as number[],
    cacheRequests: 0,
    cacheHits: 0,
  };

  private constructor() {
    super();
    this._initializeStatusTracking();
  }

  static getInstance(): SystemStateManager {
    if (!this.instance) {
      this.instance = new SystemStateManager();
    }
    return this.instance;
  }

  /**
   * 🚀 상태 추적 초기화
   */
  private _initializeStatusTracking(): void {
    // 주기적 상태 업데이트
    this.updateTimer = setInterval(() => {
      this.updateSystemStatus();
    }, this.UPDATE_INTERVAL);

    // 시뮬레이션 엔진 이벤트 수신
    this.setupSimulationEngineListeners();

    console.log('🎯 시스템 상태 관리자 초기화 완료');
  }

  /**
   * 🔄 시뮬레이션 엔진 이벤트 리스너 설정
   */
  private setupSimulationEngineListeners(): void {
    // 시뮬레이션 엔진은 EventEmitter를 상속받지 않으므로
    // 주기적 폴링을 통해 상태 변화 감지
    let lastRunningState = false;

    setInterval(() => {
      const currentRunningState = simulationEngine.getIsRunning();

      if (currentRunningState !== lastRunningState) {
        if (currentRunningState) {
          this.emit('simulation:started');
          console.log('📡 시뮬레이션 시작 감지');
        } else {
          this.emit('simulation:stopped');
          console.log('📡 시뮬레이션 중지 감지');
        }

        lastRunningState = currentRunningState;
        this.updateSystemStatus(); // 즉시 상태 업데이트
      }
    }, 1000); // 1초마다 체크
  }

  /**
   * 📊 시스템 상태 업데이트
   */
  private async updateSystemStatus(): Promise<void> {
    try {
      // 시뮬레이션 상태 수집
      const simulationState = simulationEngine.getState();
      const simulationSummary = simulationEngine.getSimulationSummary();

      // Vercel 상태 수집
      const vercelStatus = vercelStatusService.getCurrentStatus();
      const scalingConfig = vercelStatusService.getCurrentConfig();

      // 성능 메트릭 계산
      const averageResponseTime =
        this.performanceMetrics.lastResponseTimes.length > 0
          ? this.performanceMetrics.lastResponseTimes.reduce(
              (sum, time) => sum + time,
              0
            ) / this.performanceMetrics.lastResponseTimes.length
          : 0;

      const cacheHitRate =
        this.performanceMetrics.cacheRequests > 0
          ? (this.performanceMetrics.cacheHits /
              this.performanceMetrics.cacheRequests) *
            100
          : 0;

      const errorRate =
        this.performanceMetrics.apiCalls > 0
          ? (this.performanceMetrics.errors /
              this.performanceMetrics.apiCalls) *
            100
          : 0;

      // 헬스 상태 결정
      const health = this.determineHealthStatus(
        simulationSummary,
        errorRate,
        averageResponseTime
      );

      // 통합 상태 생성
      this.currentStatus = {
        simulation: {
          isRunning: simulationState.status === 'running',
          startTime: null, // 기본값 사용
          runtime: 0, // 기본값 사용
          dataCount: simulationSummary.totalServers || 0,
          serverCount: simulationSummary.totalServers,
          updateInterval: scalingConfig.updateInterval,
        },
        environment: {
          plan: vercelStatus?.plan || 'enterprise',
          region: vercelStatus?.region || 'local',
          memoryLimit: vercelStatus?.memoryLimit || 8192,
          resourceUsage: {
            executions: vercelStatus?.executions.percentage || 0,
            bandwidth: vercelStatus?.bandwidth.percentage || 0,
          },
        },
        performance: {
          averageResponseTime: Math.round(averageResponseTime),
          apiCalls: this.performanceMetrics.apiCalls,
          cacheHitRate: Math.round(cacheHitRate * 100) / 100,
          errorRate: Math.round(errorRate * 100) / 100,
        },
        health,
        services: {
          simulation:
            simulationState.status === 'running' ? 'online' : 'offline',
          cache: 'online', // 캐시는 항상 사용 가능
          prometheus: 'disabled', // 기본값 사용
          vercel: vercelStatus ? 'online' : 'unknown',
        },
        lastUpdated: new Date().toISOString(),
      };

      // 상태 변화 이벤트 발생
      this.emit('status:updated', this.currentStatus);
    } catch (error) {
      console.warn('⚠️ 시스템 상태 업데이트 실패:', error);

      // 폴백 상태 설정
      if (!this.currentStatus) {
        this.currentStatus = this.createFallbackStatus();
      }
    }
  }

  /**
   * 🏥 헬스 상태 결정
   */
  private determineHealthStatus(
    simulationSummary: any,
    errorRate: number,
    averageResponseTime: number
  ): 'healthy' | 'warning' | 'critical' | 'degraded' {
    // Critical 조건
    if (errorRate > 10 || averageResponseTime > 5000) {
      return 'critical';
    }

    // Warning 조건
    if (
      errorRate > 5 ||
      averageResponseTime > 2000 ||
      simulationSummary.activeFailures > simulationSummary.totalServers * 0.3
    ) {
      return 'warning';
    }

    // Degraded 조건
    if (errorRate > 1 || averageResponseTime > 1000) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * 🔄 폴백 상태 생성
   */
  private createFallbackStatus(): SystemStatus {
    return {
      simulation: {
        isRunning: false,
        startTime: null,
        runtime: 0,
        dataCount: 0,
        serverCount: 0,
        updateInterval: 10000,
      },
      environment: {
        plan: 'enterprise',
        region: 'local',
        memoryLimit: 8192,
        resourceUsage: {
          executions: 0,
          bandwidth: 0,
        },
      },
      performance: {
        averageResponseTime: 0,
        apiCalls: 0,
        cacheHitRate: 0,
        errorRate: 0,
      },
      health: 'degraded',
      services: {
        simulation: 'offline',
        cache: 'online',
        prometheus: 'disabled',
        vercel: 'unknown',
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * 📊 현재 시스템 상태 조회
   */
  getSystemStatus(): SystemStatus {
    if (!this.currentStatus) {
      this.updateSystemStatus(); // 동기적으로 상태 업데이트 시도
      return this.createFallbackStatus();
    }

    return { ...this.currentStatus };
  }

  /**
   * 📈 API 호출 추적
   */
  trackApiCall(responseTime: number, isError: boolean = false): void {
    this.performanceMetrics.apiCalls++;

    if (isError) {
      this.performanceMetrics.errors++;
    }

    // 응답시간 추적 (최근 100개만)
    this.performanceMetrics.lastResponseTimes.push(responseTime);
    if (this.performanceMetrics.lastResponseTimes.length > 100) {
      this.performanceMetrics.lastResponseTimes.shift();
    }
  }

  /**
   * 💾 캐시 사용 추적
   */
  trackCacheUsage(isHit: boolean): void {
    this.performanceMetrics.cacheRequests++;

    if (isHit) {
      this.performanceMetrics.cacheHits++;
    }
  }

  /**
   * 🔧 시스템 제어 메서드
   */
  async startSimulation(mode: 'fast' | 'full' = 'full'): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (simulationEngine.getIsRunning()) {
        return {
          success: false,
          message: '시뮬레이션이 이미 실행 중입니다.',
        };
      }

      simulationEngine.start();
      await this.updateSystemStatus();

      return {
        success: true,
        message: `시뮬레이션이 성공적으로 시작되었습니다 (${mode} 모드).`,
      };
    } catch (error) {
      console.error('❌ 시뮬레이션 시작 실패:', error);
      return {
        success: false,
        message: '시뮬레이션 시작에 실패했습니다.',
      };
    }
  }

  async stopSimulation(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (!simulationEngine.getIsRunning()) {
        return {
          success: false,
          message: '시뮬레이션이 실행 중이 아닙니다.',
        };
      }

      const state = simulationEngine.getState();
      const runtime = 0; // 기본값 사용

      simulationEngine.stop();
      await this.updateSystemStatus();

      return {
        success: true,
        message: `시뮬레이션이 성공적으로 중지되었습니다. (실행시간: ${Math.round(runtime / 1000)}초)`,
      };
    } catch (error) {
      console.error('❌ 시뮬레이션 중지 실패:', error);
      return {
        success: false,
        message: '시뮬레이션 중지에 실패했습니다.',
      };
    }
  }

  /**
   * 🧹 정리 작업
   */
  destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    this.removeAllListeners();
    console.log('🧹 시스템 상태 관리자 정리 완료');
  }
}

// 싱글톤 인스턴스
export const systemStateManager = SystemStateManager.getInstance();
