/**
 * 🗂️ DataRetentionScheduler v1.0
 *
 * OpenManager v5.44.3 - 데이터 보존 스케줄러 (2025-07-02 18:10 KST)
 * - 메모리 기반 데이터 정리 (무설정 배포)
 * - 자동화된 데이터 생명주기 관리
 * - 주기적 메모리 최적화
 * - 설정 가능한 보존 정책
 * - 기존 keep-alive-scheduler와 상호 보완적 동작
 */

export interface RetentionPolicy {
  id: string;
  name: string;
  dataType: 'metrics' | 'alerts' | 'connections' | 'logs' | 'cache' | 'sse';
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
    memoryUsageMB: 0,
  };

  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5분마다 정리
  private readonly MAX_CLEANUP_HISTORY = 100;
  private static instance: DataRetentionScheduler;

  private constructor() {
    this._initializeDefaultPolicies();
    this.startScheduler();
    console.log('🗂️ DataRetentionScheduler 초기화 완료 (2025-07-02 18:10 KST)');
  }

  static getInstance(): DataRetentionScheduler {
    if (!this.instance) {
      this.instance = new DataRetentionScheduler();
    }
    return this.instance;
  }

  /**
   * 🎯 기본 보존 정책 초기화 - Phase 3 SSE 최적화 반영
   */
  private _initializeDefaultPolicies(): void {
    const defaultPolicies: Omit<RetentionPolicy, 'id'>[] = [
      {
        name: '실시간 메트릭 정리',
        dataType: 'metrics',
        maxAge: 2 * 60 * 60 * 1000, // 2시간
        maxItems: 1000,
        enabled: true,
        priority: 8,
      },
      {
        name: '패턴 알림 정리',
        dataType: 'alerts',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
        maxItems: 500,
        enabled: true,
        priority: 6,
      },
      {
        name: '비활성 연결 정리',
        dataType: 'connections',
        maxAge: 30 * 60 * 1000, // 30분
        maxItems: 100,
        enabled: true,
        priority: 9,
      },
      {
        name: '시스템 로그 정리',
        dataType: 'logs',
        maxAge: 24 * 60 * 60 * 1000, // 24시간
        maxItems: 2000,
        enabled: true,
        priority: 5,
      },
      {
        name: '캐시 데이터 정리',
        dataType: 'cache',
        maxAge: 60 * 60 * 1000, // 1시간
        maxItems: 200,
        enabled: true,
        priority: 7,
      },
      {
        name: 'SSE 연결 정리',
        dataType: 'sse',
        maxAge: 15 * 60 * 1000, // 15분
        maxItems: 50,
        enabled: true,
        priority: 10, // 최고 우선순위
      },
    ];

    defaultPolicies.forEach((policy) => this.addPolicy(policy));
  }

  /**
   * 📋 새 보존 정책 추가
   */
  addPolicy(policyData: Omit<RetentionPolicy, 'id'>): string {
    const policy: RetentionPolicy = {
      ...policyData,
      id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    // 브라우저 환경에서만 실행
    if (typeof window === 'undefined') {
      console.log('⏭️ 서버 환경: DataRetentionScheduler 건너뛰기');
      return;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.runCleanup().catch((error) => {
        console.error('❌ 자동 정리 실행 중 오류:', error);
      });
    }, this.CLEANUP_INTERVAL);

    console.log(
      `🔄 데이터 정리 스케줄러 시작 (${this.CLEANUP_INTERVAL / 1000}초 간격)`
    );
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
      .filter((p) => p.enabled)
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
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        results.push(errorResult);
      }
    }

    const totalTime = Date.now() - startTime;
    this.updateStats(results, totalTime);
    this.addToCleanupHistory(results);

    console.log(`✅ 데이터 정리 완료 (${totalTime}ms)`);
    return results;
  }

  /**
   * 🎯 정책별 정리 실행
   */
  private async cleanupByPolicy(
    policy: RetentionPolicy
  ): Promise<CleanupResult> {
    const startTime = Date.now();

    try {
      const cleanup = await this.getCleanupMethodForDataType(policy.dataType);
      const { itemsRemoved, sizeFreed } = await cleanup(policy);

      const timeTaken = Date.now() - startTime;

      return {
        dataType: policy.dataType,
        itemsRemoved,
        sizeFreed,
        timeTaken,
        success: true,
      };
    } catch (error) {
      return {
        dataType: policy.dataType,
        itemsRemoved: 0,
        sizeFreed: 0,
        timeTaken: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 📊 데이터 타입별 정리 메서드 선택
   */
  private async getCleanupMethodForDataType(dataType: string) {
    switch (dataType) {
      case 'metrics':
        return this.cleanupMetrics.bind(this);
      case 'alerts':
        return this.cleanupAlerts.bind(this);
      case 'connections':
        return this.cleanupConnections.bind(this);
      case 'logs':
        return this.cleanupLogs.bind(this);
      case 'cache':
        return this.cleanupCache.bind(this);
      case 'sse':
        return this.cleanupSSE.bind(this);
      default:
        return this.cleanupGeneric.bind(this);
    }
  }

  /**
   * 📈 메트릭 데이터 정리
   */
  private async cleanupMetrics(
    policy: RetentionPolicy
  ): Promise<{ itemsRemoved: number; sizeFreed: number }> {
    let itemsRemoved = 0;
    let sizeFreed = 0;

    // localStorage 메트릭 정리
    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = Object.keys(localStorage).filter(
        (key) => key.includes('metrics') || key.includes('server-data')
      );

      for (const key of keys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (
              parsed.timestamp &&
              Date.now() - parsed.timestamp > policy.maxAge
            ) {
              localStorage.removeItem(key);
              itemsRemoved++;
              sizeFreed += data.length;
            }
          }
        } catch (error) {
          // 잘못된 JSON은 제거
          localStorage.removeItem(key);
          itemsRemoved++;
        }
      }
    }

    return { itemsRemoved, sizeFreed };
  }

  /**
   * 🚨 알림 데이터 정리
   */
  private async cleanupAlerts(
    policy: RetentionPolicy
  ): Promise<{ itemsRemoved: number; sizeFreed: number }> {
    let itemsRemoved = 0;
    let sizeFreed = 0;

    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = Object.keys(localStorage).filter(
        (key) => key.includes('alert') || key.includes('notification')
      );

      for (const key of keys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (
              parsed.timestamp &&
              Date.now() - parsed.timestamp > policy.maxAge
            ) {
              localStorage.removeItem(key);
              itemsRemoved++;
              sizeFreed += data.length;
            }
          }
        } catch (error) {
          localStorage.removeItem(key);
          itemsRemoved++;
        }
      }
    }

    return { itemsRemoved, sizeFreed };
  }

  /**
   * 🔗 연결 데이터 정리
   */
  private async cleanupConnections(
    policy: RetentionPolicy
  ): Promise<{ itemsRemoved: number; sizeFreed: number }> {
    let itemsRemoved = 0;
    let sizeFreed = 0;

    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = Object.keys(localStorage).filter(
        (key) => key.includes('connection') || key.includes('session')
      );

      for (const key of keys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (
              parsed.lastActivity &&
              Date.now() - parsed.lastActivity > policy.maxAge
            ) {
              localStorage.removeItem(key);
              itemsRemoved++;
              sizeFreed += data.length;
            }
          }
        } catch (error) {
          localStorage.removeItem(key);
          itemsRemoved++;
        }
      }
    }

    return { itemsRemoved, sizeFreed };
  }

  /**
   * 📋 로그 데이터 정리
   */
  private async cleanupLogs(
    policy: RetentionPolicy
  ): Promise<{ itemsRemoved: number; sizeFreed: number }> {
    let itemsRemoved = 0;
    let sizeFreed = 0;

    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = Object.keys(localStorage).filter(
        (key) =>
          key.includes('log') || key.includes('debug') || key.includes('error')
      );

      for (const key of keys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (
              parsed.timestamp &&
              Date.now() - parsed.timestamp > policy.maxAge
            ) {
              localStorage.removeItem(key);
              itemsRemoved++;
              sizeFreed += data.length;
            }
          }
        } catch (error) {
          localStorage.removeItem(key);
          itemsRemoved++;
        }
      }
    }

    return { itemsRemoved, sizeFreed };
  }

  /**
   * 💾 캐시 데이터 정리
   */
  private async cleanupCache(
    policy: RetentionPolicy
  ): Promise<{ itemsRemoved: number; sizeFreed: number }> {
    let itemsRemoved = 0;
    let sizeFreed = 0;

    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = Object.keys(localStorage).filter(
        (key) =>
          key.includes('cache') ||
          key.includes('temp') ||
          key.includes('buffer')
      );

      for (const key of keys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (
              parsed.cacheTime &&
              Date.now() - parsed.cacheTime > policy.maxAge
            ) {
              localStorage.removeItem(key);
              itemsRemoved++;
              sizeFreed += data.length;
            }
          }
        } catch (error) {
          localStorage.removeItem(key);
          itemsRemoved++;
        }
      }
    }

    return { itemsRemoved, sizeFreed };
  }

  /**
   * 🔄 SSE 연결 정리 (Phase 3 반영)
   */
  private async cleanupSSE(
    policy: RetentionPolicy
  ): Promise<{ itemsRemoved: number; sizeFreed: number }> {
    let itemsRemoved = 0;
    let sizeFreed = 0;

    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = Object.keys(localStorage).filter(
        (key) =>
          key.includes('sse') ||
          key.includes('eventsource') ||
          key.includes('realtime')
      );

      for (const key of keys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (
              parsed.lastActivity &&
              Date.now() - parsed.lastActivity > policy.maxAge
            ) {
              localStorage.removeItem(key);
              itemsRemoved++;
              sizeFreed += data.length;
            }
          }
        } catch (error) {
          localStorage.removeItem(key);
          itemsRemoved++;
        }
      }
    }

    return { itemsRemoved, sizeFreed };
  }

  /**
   * 🔧 일반 데이터 정리
   */
  private async cleanupGeneric(
    policy: RetentionPolicy
  ): Promise<{ itemsRemoved: number; sizeFreed: number }> {
    return { itemsRemoved: 0, sizeFreed: 0 };
  }

  /**
   * 📊 통계 업데이트
   */
  private updateStats(results: CleanupResult[], totalTime: number): void {
    this.stats.totalCleanupRuns++;
    this.stats.lastCleanupTime = Date.now();

    const totalItems = results.reduce((sum, r) => sum + r.itemsRemoved, 0);
    const totalSize = results.reduce((sum, r) => sum + r.sizeFreed, 0);

    this.stats.totalItemsRemoved += totalItems;
    this.stats.totalSizeFreed += totalSize;

    // 평균 처리 시간 계산
    this.stats.averageCleanupTime =
      (this.stats.averageCleanupTime * (this.stats.totalCleanupRuns - 1) +
        totalTime) /
      this.stats.totalCleanupRuns;

    this.updateMemoryUsage();
  }

  /**
   * 💾 메모리 사용량 업데이트
   */
  private updateMemoryUsage(): void {
    if (
      typeof window !== 'undefined' &&
      'performance' in window &&
      'memory' in (performance as any)
    ) {
      const memory = (performance as any).memory;
      this.stats.memoryUsageMB = Math.round(
        memory.usedJSHeapSize / 1024 / 1024
      );
    }
  }

  /**
   * 📋 정리 기록 추가
   */
  private addToCleanupHistory(results: CleanupResult[]): void {
    this.cleanupHistory.push(...results);

    // 기록 수 제한
    if (this.cleanupHistory.length > this.MAX_CLEANUP_HISTORY) {
      this.cleanupHistory = this.cleanupHistory.slice(
        -this.MAX_CLEANUP_HISTORY
      );
    }
  }

  /**
   * 📊 활성 정책 수 업데이트
   */
  private updateActivePolicies(): void {
    this.stats.activePolicies = Array.from(this.policies.values()).filter(
      (p) => p.enabled
    ).length;
  }

  /**
   * 🔧 수동 정리 실행
   */
  async manualCleanup(dataType?: string): Promise<CleanupResult[]> {
    const startTime = Date.now();
    const results: CleanupResult[] = [];

    console.log(`🔧 수동 정리 시작${dataType ? ` (${dataType})` : ''}...`);

    const policiesToRun = Array.from(this.policies.values())
      .filter((p) => p.enabled && (!dataType || p.dataType === dataType))
      .sort((a, b) => b.priority - a.priority);

    for (const policy of policiesToRun) {
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
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        results.push(errorResult);
      }
    }

    const totalTime = Date.now() - startTime;
    this.updateStats(results, totalTime);
    this.addToCleanupHistory(results);

    console.log(`✅ 수동 정리 완료 (${totalTime}ms)`);
    return results;
  }

  /**
   * 📊 통계 조회
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
   * 📋 정리 기록 조회
   */
  getCleanupHistory(limit: number = 20): CleanupResult[] {
    return this.cleanupHistory.slice(-limit);
  }

  /**
   * 🛑 스케줄러 종료
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    console.log('🛑 DataRetentionScheduler 종료됨');
  }
}

// 싱글톤 인스턴스 내보내기
export function getDataRetentionScheduler(): DataRetentionScheduler {
  return DataRetentionScheduler.getInstance();
}

// 개발 모드 리셋 지원
export function resetDataRetentionScheduler(): void {
  if ((DataRetentionScheduler as any).instance) {
    (DataRetentionScheduler as any).instance.shutdown();
    (DataRetentionScheduler as any).instance = null;
  }
}

export default DataRetentionScheduler;
