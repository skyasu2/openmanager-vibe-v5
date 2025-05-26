/**
 * System Health Checker
 * 
 * 🏥 시스템 상태 자동 진단 및 복구
 * - 서버 데이터 가용성 체크
 * - 자동 재시도 및 복구 로직
 * - 다단계 fallback 시스템
 */

export interface HealthCheckResult {
  isHealthy: boolean;
  serverCount: number;
  dataSource: 'api' | 'fallback' | 'none';
  lastCheck: Date;
  issues: string[];
  actions: string[];
}

export interface RecoveryOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  forceInit?: boolean;
  generateFallback?: boolean;
}

export class SystemHealthChecker {
  private static instance: SystemHealthChecker;
  private lastHealthCheck?: HealthCheckResult;
  
  public static getInstance(): SystemHealthChecker {
    if (!this.instance) {
      this.instance = new SystemHealthChecker();
    }
    return this.instance;
  }

  private constructor() {}

  /**
   * 종합 시스템 헬스체크 실행
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    console.log('🏥 Starting system health check...');
    
    const result: HealthCheckResult = {
      isHealthy: false,
      serverCount: 0,
      dataSource: 'none',
      lastCheck: new Date(),
      issues: [],
      actions: []
    };

    try {
      // 1. API 서버 데이터 확인
      const apiCheck = await this.checkAPIServers();
      result.serverCount = apiCheck.count;
      
      if (apiCheck.success && apiCheck.count > 0) {
        result.isHealthy = true;
        result.dataSource = apiCheck.isFallback ? 'fallback' : 'api';
        
        if (apiCheck.isFallback) {
          result.issues.push('Using fallback servers - real data generation may not be working');
          result.actions.push('Check data generator status');
        }
      } else {
        result.issues.push('No servers found via API');
        result.actions.push('Trigger data generation and server registration');
      }

      // 2. DataGenerator 상태 확인
      const generatorCheck = await this.checkDataGenerator();
      if (!generatorCheck.isRunning) {
        result.issues.push('Data generator is not running');
        result.actions.push('Start data generation');
      }

      // 3. ServerDataCollector 상태 확인
      const collectorCheck = await this.checkServerCollector();
      if (collectorCheck.serverCount === 0) {
        result.issues.push('No servers registered in collector');
        result.actions.push('Register servers to collector');
      }

      console.log(`🎯 Health check complete: ${result.isHealthy ? 'HEALTHY' : 'ISSUES'} (${result.serverCount} servers)`);
      this.lastHealthCheck = result;
      
    } catch (error) {
      result.issues.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('❌ Health check error:', error);
    }

    return result;
  }

  /**
   * 자동 시스템 복구 실행
   */
  async performAutoRecovery(options: RecoveryOptions = {}): Promise<HealthCheckResult> {
    const {
      maxRetries = 3,
      retryDelayMs = 2000,
      forceInit = true,
      generateFallback = true
    } = options;

    console.log('🔧 Starting auto recovery process...');
    
    let lastResult: HealthCheckResult | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`📡 Recovery attempt ${attempt}/${maxRetries}`);
      
      try {
        // 1. 먼저 헬스체크
        lastResult = await this.performHealthCheck();
        
        if (lastResult.isHealthy) {
          console.log('✅ System recovered successfully!');
          return lastResult;
        }

        // 2. 복구 액션 실행
        if (attempt === 1) {
          // 첫 번째 시도: 일반적인 데이터 생성
          console.log('📊 Triggering data generator...');
          await this.triggerDataGenerator();
          await this.sleep(retryDelayMs);
        }
        
        if (attempt === 2 && forceInit) {
          // 두 번째 시도: 강제 초기화
          console.log('🚀 Triggering force initialization...');
          await this.triggerForceInit();
          await this.sleep(retryDelayMs);
        }
        
        if (attempt === 3 && generateFallback) {
          // 세 번째 시도: 강제 서버 등록
          console.log('🔗 Force registering servers...');
          await this.forceRegisterServers();
          await this.sleep(retryDelayMs);
        }
        
      } catch (error) {
        console.error(`❌ Recovery attempt ${attempt} failed:`, error);
        if (lastResult) {
          lastResult.issues.push(`Recovery attempt ${attempt} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    console.log('⚠️ Auto recovery completed with remaining issues');
    return lastResult || {
      isHealthy: false,
      serverCount: 0,
      dataSource: 'none',
      lastCheck: new Date(),
      issues: ['Auto recovery failed'],
      actions: ['Manual intervention required']
    };
  }

  /**
   * API 서버 데이터 확인
   */
  private async checkAPIServers(): Promise<{ success: boolean; count: number; isFallback: boolean }> {
    try {
      const response = await fetch('/api/servers');
      if (!response.ok) {
        return { success: false, count: 0, isFallback: false };
      }
      
      const data = await response.json();
      const servers = data.servers || [];
      const isFallback = data.source === 'fallback' || servers.some((s: any) => s.id?.startsWith('fallback-'));
      
      return {
        success: servers.length > 0,
        count: servers.length,
        isFallback
      };
    } catch (error) {
      console.error('API servers check failed:', error);
      return { success: false, count: 0, isFallback: false };
    }
  }

  /**
   * DataGenerator 상태 확인
   */
  private async checkDataGenerator(): Promise<{ isRunning: boolean; startTime?: Date }> {
    try {
      const response = await fetch('/api/data-generator');
      if (!response.ok) {
        return { isRunning: false };
      }
      
      const data = await response.json();
      return {
        isRunning: data.isGenerating || false,
        startTime: data.startTime ? new Date(data.startTime) : undefined
      };
    } catch (error) {
      console.error('Data generator check failed:', error);
      return { isRunning: false };
    }
  }

  /**
   * ServerDataCollector 상태 확인
   */
  private async checkServerCollector(): Promise<{ serverCount: number }> {
    try {
      // 서버 사이드에서만 확인 가능
      if (typeof window !== 'undefined') {
        return { serverCount: 0 };
      }

      const { serverRegistrationService } = await import('./ServerRegistrationService');
      const count = await serverRegistrationService.getRegisteredServerCount();
      
      return { serverCount: count };
    } catch (error) {
      console.error('Server collector check failed:', error);
      return { serverCount: 0 };
    }
  }

  /**
   * 데이터 생성기 트리거
   */
  private async triggerDataGenerator(): Promise<void> {
    try {
      const response = await fetch('/api/data-generator', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`Data generator trigger failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to trigger data generator:', error);
      throw error;
    }
  }

  /**
   * 강제 초기화 트리거
   */
  private async triggerForceInit(): Promise<void> {
    try {
      const response = await fetch('/api/simulate/force-init', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`Force init failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to trigger force init:', error);
      throw error;
    }
  }

  /**
   * 강제 서버 등록
   */
  private async forceRegisterServers(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        console.log('Client-side: cannot force register servers');
        return;
      }

      const { serverRegistrationService } = await import('./ServerRegistrationService');
      const result = await serverRegistrationService.forceReregister();
      
      if (!result.success) {
        throw new Error(`Force registration failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Failed to force register servers:', error);
      throw error;
    }
  }

  /**
   * 대기 함수
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 마지막 헬스체크 결과 조회
   */
  getLastHealthCheck(): HealthCheckResult | undefined {
    return this.lastHealthCheck;
  }

  /**
   * 빠른 상태 체크 (캐시된 결과 우선)
   */
  async quickHealthCheck(): Promise<HealthCheckResult> {
    if (this.lastHealthCheck && (Date.now() - this.lastHealthCheck.lastCheck.getTime()) < 30000) {
      return this.lastHealthCheck;
    }
    return this.performHealthCheck();
  }
}

// 싱글톤 인스턴스 export
export const systemHealthChecker = SystemHealthChecker.getInstance(); 