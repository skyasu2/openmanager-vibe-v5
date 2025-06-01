/**
 * 🗂️ DataRetentionScheduler v1.0
 * 
 * OpenManager v5.21.0 - 데이터 보존 스케줄러
 * - 메모리 기반 데이터 정리 (무설정 배포)
 * - 자동화된 데이터 생명주기 관리
 * - 주기적 메모리 최적화
 * - 설정 가능한 보존 정책
 */

export interface RetentionPolicy {
  id: string;
  name: string;
  dataType: 'metrics' | 'alerts' | 'connections' | 'logs' | 'cache';
  maxAge: number; // 최대 보존 기간 (ms)
  maxItems: number; // 최대 항목 수
  enabled: boolean;
  priority: number; // 정리 우선순위 (1-10, 높을수록 우선)
}

export interface CleanupResult {
  dataType: string;
  itemsRemoved: number;
  sizeFreed: number; // bytes
  timeTaken: number; // ms
  success: boolean;
  error?: string;
}

export interface SchedulerStats {
  totalCleanupRuns: number;
  totalItemsRemoved: number;
  totalSizeFreed: number;
  lastCleanupTime: number;
  averageCleanupTime: number;
  activePolicies: number;
  memoryUsageMB: number;
}

class DataRetentionScheduler {
  private policies = new Map<string, RetentionPolicy>();
  private cleanupHistory: CleanupResult[] = [];
  private stats: SchedulerStats = {
    totalCleanupRuns: 0,
    totalItemsRemoved: 0,
    totalSizeFreed: 0,
    lastCleanupTime: 0,
    averageCleanupTime: 0,
    activePolicies: 0,
    memoryUsageMB: 0
  };
  
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5분마다 정리
  private readonly MAX_CLEANUP_HISTORY = 100;

  constructor() {
    this.initializeDefaultPolicies();
    this.startScheduler();
    console.log('🗂️ DataRetentionScheduler 초기화 완료');
  }

  /**
   * 🎯 기본 보존 정책 초기화
   */
  private initializeDefaultPolicies(): void {
    const defaultPolicies: Omit<RetentionPolicy, 'id'>[] = [
      {
        name: '실시간 메트릭 정리',
        dataType: 'metrics',
        maxAge: 2 * 60 * 60 * 1000, // 2시간
        maxItems: 1000,
        enabled: true,
        priority: 8
      },
      {
        name: '패턴 알림 정리',
        dataType: 'alerts',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
        maxItems: 500,
        enabled: true,
        priority: 6
      },
      {
        name: '비활성 연결 정리',
        dataType: 'connections',
        maxAge: 30 * 60 * 1000, // 30분
        maxItems: 100,
        enabled: true,
        priority: 9
      },
      {
        name: '시스템 로그 정리',
        dataType: 'logs',
        maxAge: 24 * 60 * 60 * 1000, // 24시간
        maxItems: 2000,
        enabled: true,
        priority: 5
      },
      {
        name: '캐시 데이터 정리',
        dataType: 'cache',
        maxAge: 60 * 60 * 1000, // 1시간
        maxItems: 200,
        enabled: true,
        priority: 7
      }
    ];

    defaultPolicies.forEach(policy => this.addPolicy(policy));
  }

  /**
   * 📋 새 보존 정책 추가
   */
  addPolicy(policyData: Omit<RetentionPolicy, 'id'>): string {
    const policy: RetentionPolicy = {
      ...policyData,
      id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.policies.set(policy.id, policy);
    this.updateActivePolicies();
    console.log(`📋 새 보존 정책 추가: ${policy.name}`);
    return policy.id;
  }

  /**
   * ✏️ 보존 정책 업데이트
   */
  updatePolicy(policyId: string, updates: Partial<RetentionPolicy>): boolean {
    const policy = this.policies.get(policyId);
    if (!policy) return false;

    Object.assign(policy, updates);
    this.updateActivePolicies();
    console.log(`✏️ 보존 정책 업데이트: ${policy.name}`);
    return true;
  }

  /**
   * 🗑️ 보존 정책 삭제
   */
  deletePolicy(policyId: string): boolean {
    const policy = this.policies.get(policyId);
    if (!policy) return false;

    this.policies.delete(policyId);
    this.updateActivePolicies();
    console.log(`🗑️ 보존 정책 삭제: ${policy.name}`);
    return true;
  }

  /**
   * 🔄 스케줄러 시작
   */
  private startScheduler(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.runCleanup().catch(error => {
        console.error('❌ 자동 정리 실행 중 오류:', error);
      });
    }, this.CLEANUP_INTERVAL);

    console.log(`🔄 데이터 정리 스케줄러 시작 (${this.CLEANUP_INTERVAL / 1000}초 간격)`);
  }

  /**
   * 🧹 정리 작업 실행
   */
  async runCleanup(): Promise<CleanupResult[]> {
    const startTime = Date.now();
    const results: CleanupResult[] = [];
    
    console.log('🧹 데이터 정리 작업 시작...');

    // 우선순위 순으로 정책 정렬
    const sortedPolicies = Array.from(this.policies.values())
      .filter(p => p.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const policy of sortedPolicies) {
      try {
        const result = await this.cleanupByPolicy(policy);
        results.push(result);
      } catch (error) {
        const errorResult: CleanupResult = {
          dataType: policy.dataType,
          itemsRemoved: 0,
          sizeFreed: 0,
          timeTaken: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        results.push(errorResult);
        console.error(`❌ 정책 실행 실패: ${policy.name}`, error);
      }
    }

    // 통계 업데이트
    const totalTime = Date.now() - startTime;
    this.updateStats(results, totalTime);
    this.addToCleanupHistory(results);

    console.log(`🧹 데이터 정리 완료: ${results.length}개 정책 실행, ${totalTime}ms 소요`);
    return results;
  }

  /**
   * 🎯 정책별 정리 실행
   */
  private async cleanupByPolicy(policy: RetentionPolicy): Promise<CleanupResult> {
    const startTime = Date.now();
    let itemsRemoved = 0;
    let sizeFreed = 0;

    try {
      switch (policy.dataType) {
        case 'metrics':
          const metricsResult = await this.cleanupMetrics(policy);
          itemsRemoved = metricsResult.itemsRemoved;
          sizeFreed = metricsResult.sizeFreed;
          break;

        case 'alerts':
          const alertsResult = await this.cleanupAlerts(policy);
          itemsRemoved = alertsResult.itemsRemoved;
          sizeFreed = alertsResult.sizeFreed;
          break;

        case 'connections':
          const connectionsResult = await this.cleanupConnections(policy);
          itemsRemoved = connectionsResult.itemsRemoved;
          sizeFreed = connectionsResult.sizeFreed;
          break;

        case 'logs':
          const logsResult = await this.cleanupLogs(policy);
          itemsRemoved = logsResult.itemsRemoved;
          sizeFreed = logsResult.sizeFreed;
          break;

        case 'cache':
          const cacheResult = await this.cleanupCache(policy);
          itemsRemoved = cacheResult.itemsRemoved;
          sizeFreed = cacheResult.sizeFreed;
          break;

        default:
          throw new Error(`알 수 없는 데이터 타입: ${policy.dataType}`);
      }

      return {
        dataType: policy.dataType,
        itemsRemoved,
        sizeFreed,
        timeTaken: Date.now() - startTime,
        success: true
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * 📊 메트릭 데이터 정리
   */
  private async cleanupMetrics(policy: RetentionPolicy): Promise<{itemsRemoved: number, sizeFreed: number}> {
    let itemsRemoved = 0;
    let sizeFreed = 0;

    try {
      // PatternMatcherEngine에서 메트릭 히스토리 정리
      const { getPatternMatcherEngine } = await import('../engines/PatternMatcherEngine');
      const engine = getPatternMatcherEngine();
      
      const now = Date.now();
      const cutoffTime = now - policy.maxAge;

      // 각 서버의 메트릭 히스토리를 정리
      const metricsHistory = (engine as any).metricsHistory as Map<string, any[]>;
      
      for (const [serverId, history] of metricsHistory.entries()) {
        const originalLength = history.length;
        
        // 시간 기준 정리
        const timeFiltered = history.filter((metric: any) => metric.timestamp > cutoffTime);
        
        // 개수 기준 정리
        const finalFiltered = timeFiltered.length > policy.maxItems ? 
          timeFiltered.slice(-policy.maxItems) : timeFiltered;
        
        const removed = originalLength - finalFiltered.length;
        if (removed > 0) {
          metricsHistory.set(serverId, finalFiltered);
          itemsRemoved += removed;
          sizeFreed += removed * 200; // 메트릭 하나당 약 200바이트로 추정
        }
      }

    } catch (error) {
      console.warn('⚠️ 메트릭 정리 중 오류 (무시):', error);
    }

    return { itemsRemoved, sizeFreed };
  }

  /**
   * 🚨 알림 데이터 정리
   */
  private async cleanupAlerts(policy: RetentionPolicy): Promise<{itemsRemoved: number, sizeFreed: number}> {
    let itemsRemoved = 0;
    let sizeFreed = 0;

    try {
      const { getPatternMatcherEngine } = await import('../engines/PatternMatcherEngine');
      const engine = getPatternMatcherEngine();
      
      const alerts = (engine as any).alerts as any[];
      const originalLength = alerts.length;
      const now = Date.now();
      const cutoffTime = now - policy.maxAge;

      // 시간 기준 정리
      const timeFiltered = alerts.filter((alert: any) => alert.timestamp > cutoffTime);
      
      // 개수 기준 정리
      const finalFiltered = timeFiltered.length > policy.maxItems ? 
        timeFiltered.slice(-policy.maxItems) : timeFiltered;

      if (finalFiltered.length < originalLength) {
        (engine as any).alerts = finalFiltered;
        itemsRemoved = originalLength - finalFiltered.length;
        sizeFreed = itemsRemoved * 300; // 알림 하나당 약 300바이트로 추정
      }

    } catch (error) {
      console.warn('⚠️ 알림 정리 중 오류 (무시):', error);
    }

    return { itemsRemoved, sizeFreed };
  }

  /**
   * 🔗 연결 데이터 정리
   */
  private async cleanupConnections(policy: RetentionPolicy): Promise<{itemsRemoved: number, sizeFreed: number}> {
    let itemsRemoved = 0;
    let sizeFreed = 0;

    try {
      const { getRealTimeHub } = await import('../core/realtime/RealTimeHub');
      const hub = getRealTimeHub();
      
      const connections = (hub as any).connections as Map<string, any>;
      const now = Date.now();
      const cutoffTime = now - policy.maxAge;

      // 비활성 연결 찾기
      const toRemove: string[] = [];
      
      for (const [connectionId, connection] of connections.entries()) {
        if (connection.lastActivity < cutoffTime) {
          toRemove.push(connectionId);
        }
      }

      // 연결 정리
      toRemove.forEach(connectionId => {
        hub.disconnectConnection(connectionId);
        itemsRemoved++;
        sizeFreed += 150; // 연결 하나당 약 150바이트로 추정
      });

    } catch (error) {
      console.warn('⚠️ 연결 정리 중 오류 (무시):', error);
    }

    return { itemsRemoved, sizeFreed };
  }

  /**
   * 📝 로그 데이터 정리
   */
  private async cleanupLogs(policy: RetentionPolicy): Promise<{itemsRemoved: number, sizeFreed: number}> {
    let itemsRemoved = 0;
    let sizeFreed = 0;

    try {
      const { getRealTimeHub } = await import('../core/realtime/RealTimeHub');
      const hub = getRealTimeHub();
      
      const messageHistory = (hub as any).messageHistory as any[];
      const originalLength = messageHistory.length;
      const now = Date.now();
      const cutoffTime = now - policy.maxAge;

      // 시간 기준 정리
      const timeFiltered = messageHistory.filter((message: any) => message.timestamp > cutoffTime);
      
      // 개수 기준 정리
      const finalFiltered = timeFiltered.length > policy.maxItems ? 
        timeFiltered.slice(-policy.maxItems) : timeFiltered;

      if (finalFiltered.length < originalLength) {
        (hub as any).messageHistory = finalFiltered;
        itemsRemoved = originalLength - finalFiltered.length;
        sizeFreed = itemsRemoved * 250; // 메시지 하나당 약 250바이트로 추정
      }

    } catch (error) {
      console.warn('⚠️ 로그 정리 중 오류 (무시):', error);
    }

    return { itemsRemoved, sizeFreed };
  }

  /**
   * 🗄️ 캐시 데이터 정리
   */
  private async cleanupCache(policy: RetentionPolicy): Promise<{itemsRemoved: number, sizeFreed: number}> {
    let itemsRemoved = 0;
    let sizeFreed = 0;

    try {
      // Redis 캐시 정리
      const { getRedisClient } = await import('../lib/redis');
      const redis = await getRedisClient();
      
      // DummyRedisClient인 경우 캐시 정리
      if ((redis as any).cache instanceof Map) {
        const cache = (redis as any).cache as Map<string, any>;
        const now = Date.now();
        const toRemove: string[] = [];

        for (const [key, item] of cache.entries()) {
          if (item.expires > 0 && now > item.expires) {
            toRemove.push(key);
          }
        }

        toRemove.forEach(key => {
          cache.delete(key);
          itemsRemoved++;
          sizeFreed += 100; // 캐시 항목 하나당 약 100바이트로 추정
        });
      }

    } catch (error) {
      console.warn('⚠️ 캐시 정리 중 오류 (무시):', error);
    }

    return { itemsRemoved, sizeFreed };
  }

  /**
   * 📊 통계 업데이트
   */
  private updateStats(results: CleanupResult[], totalTime: number): void {
    this.stats.totalCleanupRuns++;
    this.stats.lastCleanupTime = Date.now();
    
    const successfulResults = results.filter(r => r.success);
    const totalItemsRemoved = successfulResults.reduce((sum, r) => sum + r.itemsRemoved, 0);
    const totalSizeFreed = successfulResults.reduce((sum, r) => sum + r.sizeFreed, 0);
    
    this.stats.totalItemsRemoved += totalItemsRemoved;
    this.stats.totalSizeFreed += totalSizeFreed;
    
    // 평균 정리 시간 계산
    this.stats.averageCleanupTime = 
      (this.stats.averageCleanupTime * (this.stats.totalCleanupRuns - 1) + totalTime) / 
      this.stats.totalCleanupRuns;

    // 메모리 사용량 업데이트
    this.updateMemoryUsage();
  }

  /**
   * 🧠 메모리 사용량 업데이트
   */
  private updateMemoryUsage(): void {
    try {
      if (process.memoryUsage) {
        const memUsage = process.memoryUsage();
        this.stats.memoryUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      }
    } catch (error) {
      // 브라우저 환경에서는 process.memoryUsage를 사용할 수 없음
    }
  }

  /**
   * 📚 정리 히스토리 저장
   */
  private addToCleanupHistory(results: CleanupResult[]): void {
    this.cleanupHistory.push(...results);
    
    // 히스토리 크기 제한
    if (this.cleanupHistory.length > this.MAX_CLEANUP_HISTORY) {
      this.cleanupHistory = this.cleanupHistory.slice(-this.MAX_CLEANUP_HISTORY);
    }
  }

  /**
   * 📊 활성 정책 수 업데이트
   */
  private updateActivePolicies(): void {
    this.stats.activePolicies = Array.from(this.policies.values())
      .filter(p => p.enabled).length;
  }

  /**
   * 🔍 수동 정리 실행 (특정 데이터 타입)
   */
  async manualCleanup(dataType?: string): Promise<CleanupResult[]> {
    const policies = dataType ? 
      Array.from(this.policies.values()).filter(p => p.enabled && p.dataType === dataType) :
      Array.from(this.policies.values()).filter(p => p.enabled);

    const results: CleanupResult[] = [];
    
    for (const policy of policies) {
      try {
        const result = await this.cleanupByPolicy(policy);
        results.push(result);
      } catch (error) {
        const errorResult: CleanupResult = {
          dataType: policy.dataType,
          itemsRemoved: 0,
          sizeFreed: 0,
          timeTaken: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        results.push(errorResult);
      }
    }

    console.log(`🔍 수동 정리 완료: ${results.length}개 정책 실행`);
    return results;
  }

  /**
   * 📈 통계 조회
   */
  getStats(): SchedulerStats {
    this.updateMemoryUsage();
    return { ...this.stats };
  }

  /**
   * 📋 정책 목록 조회
   */
  getPolicies(): RetentionPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * 📚 정리 히스토리 조회
   */
  getCleanupHistory(limit: number = 20): CleanupResult[] {
    return this.cleanupHistory.slice(-limit).reverse();
  }

  /**
   * 🛑 스케줄러 종료
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    console.log('🛑 DataRetentionScheduler 종료 완료');
  }
}

// 싱글톤 인스턴스
let schedulerInstance: DataRetentionScheduler | null = null;

export function getDataRetentionScheduler(): DataRetentionScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new DataRetentionScheduler();
  }
  return schedulerInstance;
}

export function resetDataRetentionScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.shutdown();
    schedulerInstance = null;
  }
}

export default DataRetentionScheduler; 